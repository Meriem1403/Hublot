#!/usr/bin/env python3
"""
Script de conversion Excel vers JSON pour StatDirm
Convertit les données Excel au format JSON compatible avec l'application
"""

import pandas as pd
import json
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import warnings

warnings.filterwarnings('ignore')

# Mapping des colonnes (même que dans analyze_excel.py)
COLONNES_ATTENDUES = {
    'id': ['id', 'identifiant', 'matricule', 'numero', 'numéro'],
    'nom': ['nom', 'name', 'lastname', 'nom_famille'],
    'prenom': ['prenom', 'prénom', 'prenom_agent', 'firstname'],
    'dateNaissance': ['date_naissance', 'date naissance', 'date_de_naissance', 'birthdate', 'année de naissance', 'annee de naissance', 'année_de_naissance', 'annee_de_naissance'],
    'genre': ['genre', 'sexe', 'gender', 'sex', 'civilite'],
    'statut': ['statut', 'status', 'type_contrat', 'situation'],
    # Aligné sur analyze_excel.COLS_ATTENDUES pour mieux détecter la colonne "Temps de travail"
    'contratType': ['contrat_type', 'type_contrat', 'temps_travail', 'temps travail', 'quotite', 'temps de travail'],
    'tempsPartielPourcentage': ['temps_partiel', 'quotite', 'quotité', 'pourcentage_tp'],
    'region': ['region', 'région', 'zone', 'site'],
    'service': ['service', 'direction', 'departement', 'unite'],
    'mission': ['mission', 'activite', 'fonction', 'action'],
    'metier': ['metier', 'métier', 'poste', 'fonction', 'grade'],
    'niveauResponsabilite': ['niveau', 'niveau_responsabilite', 'hierarchie', 'echelon', 'catégorie', 'categorie', 'category'],
    'poste': ['poste', 'fonction', 'libelle_poste', 'intitule'],
    'dateEmbauche': ['date_embauche', 'date_recrutement', 'date_entree'],
    'dateFinContrat': ['date_fin_contrat', 'date_fin', 'fin_contrat'],
    'dateDepartPrevue': ['date_depart', 'date_depart_prevue', 'depart_prevue'],
    'etp': ['etp', 'eqtp', 'equivalent_temps_plein'],
    'enConges': ['en_conges', 'conges', 'absence_conges'],
    'enFormation': ['en_formation', 'formation', 'en_stage'],
    'enArretMaladie': ['arret_maladie', 'maladie', 'en_arret'],
    'actif': ['actif', 'en_poste', 'actif_agent'],
    'dateMaj': ['date_maj', 'date_mise_a_jour', 'derniere_maj']
}

def normaliser_nom_colonne(nom: str) -> str:
    """Normalise le nom d'une colonne"""
    return nom.lower().strip().replace(' ', '_').replace('é', 'e').replace('è', 'e').replace('à', 'a')

def trouver_colonne(df: pd.DataFrame, colonne_cible: str) -> Optional[str]:
    """Trouve la colonne correspondante dans le DataFrame"""
    colonnes_norm = {normaliser_nom_colonne(c): c for c in df.columns}
    
    for alias in COLONNES_ATTENDUES.get(colonne_cible, []):
        alias_norm = normaliser_nom_colonne(alias)
        if alias_norm in colonnes_norm:
            return colonnes_norm[alias_norm]
    
    colonne_norm_cible = normaliser_nom_colonne(colonne_cible)
    for col_norm, col_orig in colonnes_norm.items():
        if colonne_norm_cible in col_norm or col_norm in colonne_norm_cible:
            return col_orig
    
    return None

def convertir_code_mission_en_nom(code_mission: str, row: pd.Series, mapping: Dict[str, str]) -> str:
    """
    Convertit un code Action en nom de mission lisible
    Basé sur les codes trouvés dans les données et leur thématique
    """
    code_str = str(code_mission).strip()
    
    # Récupérer la thématique si disponible
    thematique = None
    col_thematique = None
    for col in row.index:
        if 'thématique' in str(col).lower() or 'thematique' in str(col).lower():
            col_thematique = col
            break
    
    if col_thematique and col_thematique in row.index:
        thematique = str(row[col_thematique]).strip() if pd.notna(row[col_thematique]) else None
    
    # Table de correspondance basée sur les codes et thématiques observés
    correspondances = {
        # Codes principaux avec leurs noms
        '0205': 'Contrôle et surveillance maritime',
        '0205-01': 'Contrôle et surveillance maritime - Opérations',
        '0205-02': 'Contrôle et surveillance maritime - Coordination',
        '0205-04': 'Contrôle et surveillance maritime - Surveillance côtière',
        '0205-05': 'Contrôle et surveillance maritime - Appui technique',
        '0205-06': 'Contrôle et surveillance maritime - Spécialisé',
        '0205-07': 'Contrôle et surveillance maritime - Autre',
        '0203': 'Police des pêches',
        '0203-11': 'Police des pêches - Contrôle',
        '0203-14': 'Police des pêches - Surveillance',
        '0203-43': 'Police des pêches - Spécialisé',
        '0113-07': 'Affaires maritimes',
        '1': 'Sauvetage en mer et sécurité maritime',
        # Codes décimaux (missions LPM)
        '0.4': 'Formation maritime - Spécialisé',
        '0.5': 'Formation maritime',
        '0.62': 'Formation maritime - Partiel',
        '0.7': 'Formation maritime - Avancé',
        '0.8': 'Formation maritime - Standard',
        '0.85': 'Formation maritime - Standard+',
        '0.86': 'Formation maritime - Standard+',
        '0.9': 'Formation maritime - Avancé+',
    }
    
    # Vérifier d'abord la correspondance exacte
    if code_str in correspondances:
        return correspondances[code_str]
    
    # Sinon, créer un nom basé sur le code et la thématique
    if code_str.startswith('02'):
        if thematique == 'Phares et Balises':
            return f'Phares et Balises - {code_str}'
        elif thematique == 'OP-OPa':
            return f'Opérations - {code_str}'
        elif thematique == 'DCS':
            return f'Contrôle et surveillance maritime - {code_str}'
        else:
            return f'Contrôle et surveillance - {code_str}'
    elif code_str.startswith('01'):
        return f'Affaires maritimes - {code_str}'
    elif '.' in code_str:
        return f'Formation maritime - {code_str}'
    else:
        # Nom générique basé sur la thématique
        if thematique:
            if thematique == 'LPM':
                return f'Sauvetage en mer et sécurité maritime - {code_str}'
            elif thematique == 'APB':
                return f'Sauvetage en mer et sécurité maritime - {code_str}'
            elif thematique == 'ISN':
                return f'Intervention et sécurité - {code_str}'
            else:
                return f'{thematique} - {code_str}'
        else:
            return f'Mission {code_str}'

def normaliser_valeur_genre(valeur: Any) -> str:
    """Normalise la valeur du genre"""
    if pd.isna(valeur):
        return 'Autre'
    
    valeur_str = str(valeur).upper().strip()
    
    if valeur_str in ['H', 'HOMME', 'M', 'MALE', 'MASCULIN']:
        return 'H'
    elif valeur_str in ['F', 'FEMME', 'FEMALE', 'FEMININ']:
        return 'F'
    else:
        return 'Autre'

def extraire_date_naissance_du_nne(libelle_nne: Any) -> Optional[str]:
    """
    Extrait la date de naissance depuis le Libellé NNE
    Le format NNE français peut contenir la date de naissance codée
    Format possible: FR + date (JJMMAA ou AAMMJJ) + numéro séquentiel + clé
    """
    if pd.isna(libelle_nne):
        return None
    
    libelle_str = str(libelle_nne).strip()
    if not libelle_str:
        return None
    
    import re
    from datetime import datetime
    
    # Chercher un pattern de numéro NNE (FR suivi de chiffres)
    # Format typique: FR + 6 chiffres (date) + autres chiffres
    nne_match = re.search(r'FR(\d{6,})', libelle_str.upper())
    if not nne_match:
        # Chercher aussi sans le préfixe FR
        nne_match = re.search(r'(\d{10,})', libelle_str)
    
    if nne_match:
        nne_number = nne_match.group(1) if nne_match.lastindex else nne_match.group(0)
        
        # Le NNE français contient généralement la date de naissance dans les 6 premiers chiffres
        # Format peut être JJMMAA ou AAMMJJ
        if len(nne_number) >= 6:
            date_part = nne_number[:6]
            
            # Essayer format JJMMAA (jour, mois, année sur 2 chiffres)
            try:
                jour = int(date_part[:2])
                mois = int(date_part[2:4])
                annee_2chiffres = int(date_part[4:6])
                
                # Déterminer le siècle (généralement 19xx ou 20xx)
                if annee_2chiffres <= 30:  # Probablement 2000-2030
                    annee = 2000 + annee_2chiffres
                else:  # Probablement 1930-1999
                    annee = 1900 + annee_2chiffres
                
                # Valider la date
                if 1 <= jour <= 31 and 1 <= mois <= 12 and 1930 <= annee <= 2010:
                    try:
                        # Vérifier que la date est valide
                        datetime(annee, mois, min(jour, 28))  # Utiliser 28 pour éviter les problèmes de février
                        return f'{annee}-{mois:02d}-{jour:02d}'
                    except:
                        pass
            except:
                pass
            
            # Essayer format AAMMJJ (année sur 2 chiffres, mois, jour)
            try:
                annee_2chiffres = int(date_part[:2])
                mois = int(date_part[2:4])
                jour = int(date_part[4:6])
                
                # Déterminer le siècle
                if annee_2chiffres <= 30:
                    annee = 2000 + annee_2chiffres
                else:
                    annee = 1900 + annee_2chiffres
                
                # Valider la date
                if 1 <= jour <= 31 and 1 <= mois <= 12 and 1930 <= annee <= 2010:
                    try:
                        datetime(annee, mois, min(jour, 28))
                        return f'{annee}-{mois:02d}-{jour:02d}'
                    except:
                        pass
            except:
                pass
    
    return None

def normaliser_valeur_statut(valeur: Any) -> str:
    """Normalise la valeur du statut"""
    if pd.isna(valeur):
        return 'CDD'
    
    valeur_str = str(valeur).upper().strip()
    
    # Catégories A, B, C = Titulaires
    if valeur_str in ['A', 'B', 'C']:
        return 'Titulaire'
    elif 'CONTRACTUEL' in valeur_str:
        return 'CDI'
    elif 'CDD' in valeur_str:
        return 'CDD'
    elif 'STAGIAIRE' in valeur_str or 'STAGE' in valeur_str:
        return 'Stagiaire'
    elif 'TITULAIRE' in valeur_str or 'TIT' in valeur_str:
        return 'Titulaire'
    elif 'CDI' in valeur_str:
        return 'CDI'
    else:
        # Par défaut, considérer comme titulaire si c'est une catégorie
        if valeur_str in ['A', 'B', 'C']:
            return 'Titulaire'
        return 'CDD'

def normaliser_date(valeur: Any) -> Optional[str]:
    """Convertit une date en format ISO"""
    if pd.isna(valeur):
        return None
    
    try:
        if isinstance(valeur, str):
            # Essayer différents formats
            for fmt in ['%Y-%m-%d', '%d/%m/%Y', '%d-%m-%Y', '%Y/%m/%d']:
                try:
                    dt = datetime.strptime(valeur, fmt)
                    return dt.strftime('%Y-%m-%d')
                except:
                    continue
        
        # Si c'est déjà une date pandas
        if hasattr(valeur, 'strftime'):
            return valeur.strftime('%Y-%m-%d')
        
        # Essayer de convertir avec pandas
        dt = pd.to_datetime(valeur, errors='coerce')
        if pd.notna(dt):
            return dt.strftime('%Y-%m-%d')
    except:
        pass
    
    return None

def convertir_agent(row: pd.Series, mapping: Dict[str, str]) -> Dict[str, Any]:
    """Convertit une ligne du DataFrame en objet Agent"""
    agent = {}
    
    # ID
    col_id = mapping.get('id')
    if col_id and col_id in row.index:
        agent['id'] = str(row[col_id]) if pd.notna(row[col_id]) else None
    else:
        agent['id'] = str(row.name + 1)  # Utiliser l'index comme ID
    
    # Nom et prénom
    col_nom = mapping.get('nom')
    col_prenom = mapping.get('prenom')
    if col_nom and col_nom in row.index:
        agent['nom'] = str(row[col_nom]) if pd.notna(row[col_nom]) else ''
    else:
        agent['nom'] = ''
    
    if col_prenom and col_prenom in row.index:
        agent['prenom'] = str(row[col_prenom]) if pd.notna(row[col_prenom]) else ''
    else:
        agent['prenom'] = ''
    
    # Date de naissance (peut être une année uniquement)
    col_date_naissance = mapping.get('dateNaissance')
    date_naissance_trouvee = None
    
    if col_date_naissance and col_date_naissance in row.index:
        valeur_date = row[col_date_naissance]
        if pd.notna(valeur_date):
            # Si c'est juste une année (nombre)
            try:
                annee = int(float(valeur_date))
                if 1900 <= annee <= 2010:  # Année valide
                    date_naissance_trouvee = f'{annee}-06-15'  # Date au milieu de l'année
                else:
                    date_naissance_trouvee = normaliser_date(valeur_date)
            except:
                date_naissance_trouvee = normaliser_date(valeur_date)
    
    # Si pas de date trouvée ou date par défaut, essayer d'extraire depuis le Libellé NNE ou autres colonnes
    if not date_naissance_trouvee or date_naissance_trouvee == '1970-01-01':
        # Chercher la colonne Libellé NNE
        col_libelle_nne = None
        for col in row.index:
            if 'libellé' in str(col).lower() and 'nne' in str(col).lower():
                col_libelle_nne = col
                break
        
        if col_libelle_nne and col_libelle_nne in row.index:
            date_depuis_nne = extraire_date_naissance_du_nne(row[col_libelle_nne])
            if date_depuis_nne:
                date_naissance_trouvee = date_depuis_nne
        
        # Chercher aussi dans toutes les colonnes pour un numéro NNE
        if not date_naissance_trouvee or date_naissance_trouvee == '1970-01-01':
            for col in row.index:
                if col not in [col_date_naissance, col_libelle_nne]:
                    val = row[col]
                    if pd.notna(val):
                        date_depuis_nne = extraire_date_naissance_du_nne(val)
                        if date_depuis_nne:
                            date_naissance_trouvee = date_depuis_nne
                            break
    
    agent['dateNaissance'] = date_naissance_trouvee or '1970-01-01'
    
    # Genre
    col_genre = mapping.get('genre')
    if col_genre and col_genre in row.index:
        agent['genre'] = normaliser_valeur_genre(row[col_genre])
    else:
        agent['genre'] = 'Autre'
    
    # Statut
    col_statut = mapping.get('statut')
    statut_determine = False
    
    if col_statut and col_statut in row.index:
        agent['statut'] = normaliser_valeur_statut(row[col_statut])
        statut_determine = True
    else:
        # Si pas de colonne statut, utiliser la colonne Catégorie (niveauResponsabilite)
        col_categorie = mapping.get('niveauResponsabilite')
        if col_categorie and col_categorie in row.index:
            valeur_categorie = str(row[col_categorie]).strip()
            # Catégories A, B, C = Titulaires
            if valeur_categorie in ['A', 'B', 'C']:
                agent['statut'] = 'Titulaire'
                statut_determine = True
            elif 'CONTRACTUEL' in valeur_categorie.upper():
                # Par défaut CDI pour les contractuels, mais on pourrait avoir besoin d'une autre colonne pour distinguer CDI/CDD
                agent['statut'] = 'CDI'
                statut_determine = True
    
    # Si toujours pas déterminé, utiliser CDD par défaut
    if not statut_determine:
        agent['statut'] = 'CDD'
    
    # Contrat type et temps partiel (depuis "Temps de travail")
    col_contrat_type = mapping.get('contratType')
    if col_contrat_type and col_contrat_type in row.index:
        valeur = row[col_contrat_type]
        if pd.notna(valeur):
            try:
                temps_travail = float(valeur)
                if temps_travail == 100:
                    agent['contratType'] = 'Temps plein'
                    agent['tempsPartielPourcentage'] = None
                elif temps_travail < 100:
                    agent['contratType'] = 'Temps partiel'
                    agent['tempsPartielPourcentage'] = int(temps_travail)
                else:
                    agent['contratType'] = 'Temps plein'
                    agent['tempsPartielPourcentage'] = None
            except:
                valeur_str = str(valeur).upper()
                if 'PARTIEL' in valeur_str or 'TP' in valeur_str:
                    agent['contratType'] = 'Temps partiel'
                    agent['tempsPartielPourcentage'] = 80  # Par défaut
                else:
                    agent['contratType'] = 'Temps plein'
                    agent['tempsPartielPourcentage'] = None
        else:
            agent['contratType'] = 'Temps plein'
            agent['tempsPartielPourcentage'] = None
    else:
        agent['contratType'] = 'Temps plein'
        agent['tempsPartielPourcentage'] = None
    
    # Région
    col_region = mapping.get('region')
    if col_region and col_region in row.index:
        region = str(row[col_region]).strip()
        # Normaliser les régions
        if 'MARSEILLE' in region.upper():
            agent['region'] = 'Marseille'
        elif 'NICE' in region.upper() or 'COTE' in region.upper() or 'CÔTE' in region.upper():
            agent['region'] = 'Nice'
        elif 'TOULON' in region.upper():
            agent['region'] = 'Toulon'
        elif 'SETE' in region.upper() or 'SÈTE' in region.upper() or 'MONTPELLIER' in region.upper():
            agent['region'] = 'Sète'
        else:
            agent['region'] = region
    else:
        agent['region'] = 'Marseille'  # Par défaut
    
    # Service
    col_service = mapping.get('service')
    if col_service and col_service in row.index:
        agent['service'] = str(row[col_service]) if pd.notna(row[col_service]) else 'Non défini'
    else:
        agent['service'] = 'Non défini'
    
    # Mission (depuis la colonne "Action")
    col_mission = mapping.get('mission')
    if col_mission and col_mission in row.index:
        code_mission = str(row[col_mission]) if pd.notna(row[col_mission]) else None
        if code_mission:
            # Convertir le code Action en nom de mission lisible
            agent['mission'] = convertir_code_mission_en_nom(code_mission, row, mapping)
        else:
            agent['mission'] = 'Non définie'
    else:
        agent['mission'] = 'Non définie'
    
    # Métier
    col_metier = mapping.get('metier')
    if col_metier and col_metier in row.index:
        agent['metier'] = str(row[col_metier]) if pd.notna(row[col_metier]) else 'Non défini'
    else:
        agent['metier'] = 'Non défini'
    
    # Niveau de responsabilité (basé sur la catégorie)
    # Utiliser d'abord la colonne niveauResponsabilite, sinon utiliser statut (qui contient A, B, C)
    col_niveau = mapping.get('niveauResponsabilite')
    col_statut = mapping.get('statut')
    
    niveau_determine = False
    
    # Essayer avec la colonne niveauResponsabilite (qui devrait être "Catégorie")
    if col_niveau and col_niveau in row.index:
        valeur = str(row[col_niveau]).upper().strip()
        # Catégorie A = Direction généralement
        if valeur == 'A':
            agent['niveauResponsabilite'] = 'Direction'
            niveau_determine = True
        # Catégorie B = Encadrement généralement
        elif valeur == 'B':
            agent['niveauResponsabilite'] = 'Encadrement'
            niveau_determine = True
        # Catégorie C = Opérationnel
        elif valeur == 'C':
            agent['niveauResponsabilite'] = 'Opérationnel'
            niveau_determine = True
    
    # Si pas déterminé, utiliser la colonne statut (qui contient aussi A, B, C)
    if not niveau_determine and col_statut and col_statut in row.index:
        valeur_statut = str(row[col_statut]).upper().strip()
        if valeur_statut == 'A':
            agent['niveauResponsabilite'] = 'Direction'
            niveau_determine = True
        elif valeur_statut == 'B':
            agent['niveauResponsabilite'] = 'Encadrement'
            niveau_determine = True
        elif valeur_statut == 'C':
            agent['niveauResponsabilite'] = 'Opérationnel'
            niveau_determine = True
    
    # Si toujours pas déterminé, essayer avec le grade ou le poste
    if not niveau_determine:
        col_grade = mapping.get('metier') or mapping.get('poste')
        if col_grade and col_grade in row.index:
            grade_str = str(row[col_grade]).upper()
            # Mots-clés pour direction/encadrement
            if any(mot in grade_str for mot in ['DIRECTEUR', 'DIRECTION', 'CHEF', 'RESPONSABLE', 'COORDINATEUR']):
                if 'DIRECTEUR' in grade_str or 'DIRECTION' in grade_str:
                    agent['niveauResponsabilite'] = 'Direction'
                else:
                    agent['niveauResponsabilite'] = 'Encadrement'
                niveau_determine = True
    
    # Par défaut, opérationnel
    if not niveau_determine:
        agent['niveauResponsabilite'] = 'Opérationnel'
    
    # Poste
    col_poste = mapping.get('poste')
    if col_poste and col_poste in row.index:
        agent['poste'] = str(row[col_poste]) if pd.notna(row[col_poste]) else agent['metier']
    else:
        agent['poste'] = agent['metier']
    
    # Dates
    col_date_embauche = mapping.get('dateEmbauche')
    agent['dateEmbauche'] = normaliser_date(row[col_date_embauche]) if col_date_embauche and col_date_embauche in row.index else None
    
    col_date_fin = mapping.get('dateFinContrat')
    agent['dateFinContrat'] = normaliser_date(row[col_date_fin]) if col_date_fin and col_date_fin in row.index else None
    
    col_date_depart = mapping.get('dateDepartPrevue')
    agent['dateDepartPrevue'] = normaliser_date(row[col_date_depart]) if col_date_depart and col_date_depart in row.index else None
    
    # ETP
    col_etp = mapping.get('etp')
    if col_etp and col_etp in row.index:
        try:
            agent['etp'] = float(row[col_etp]) if pd.notna(row[col_etp]) else 1.0
        except:
            agent['etp'] = 1.0 if agent['contratType'] == 'Temps plein' else (agent['tempsPartielPourcentage'] or 80) / 100
    else:
        agent['etp'] = 1.0 if agent['contratType'] == 'Temps plein' else (agent['tempsPartielPourcentage'] or 80) / 100
    
    # Disponibilité (détectée depuis "Temps de travail")
    # Si "Temps de travail" = 0, l'agent est probablement absent
    # On ne peut pas distinguer le type d'absence, donc on considère comme congés par défaut
    col_conges = mapping.get('enConges')
    col_formation = mapping.get('enFormation')
    col_maladie = mapping.get('enArretMaladie')
    col_temps_travail = mapping.get('contratType')  # Cette colonne correspond à "Temps de travail"
    
    # Vérifier d'abord les colonnes explicites d'absence si elles existent
    agent['enConges'] = bool(row[col_conges]) if col_conges and col_conges in row.index and pd.notna(row[col_conges]) else False
    agent['enFormation'] = bool(row[col_formation]) if col_formation and col_formation in row.index and pd.notna(row[col_formation]) else False
    agent['enArretMaladie'] = bool(row[col_maladie]) if col_maladie and col_maladie in row.index and pd.notna(row[col_maladie]) else False
    
    # Si aucune absence détectée mais "Temps de travail" = 0, considérer comme congés
    if not agent['enConges'] and not agent['enFormation'] and not agent['enArretMaladie']:
        # Chercher la colonne "Temps de travail" directement
        col_temps_travail_direct = None
        for col in row.index:
            if 'temps' in str(col).lower() and 'travail' in str(col).lower():
                col_temps_travail_direct = col
                break
        
        if col_temps_travail_direct and col_temps_travail_direct in row.index:
            try:
                temps_travail_val = row[col_temps_travail_direct]
                if pd.notna(temps_travail_val):
                    temps_travail_num = float(temps_travail_val)
                    # Si temps de travail = 0, l'agent est absent
                    if temps_travail_num == 0:
                        # Essayer de déterminer le type d'absence selon des critères
                        # 1. Vérifier le Poste/Grade pour détecter la formation
                        col_poste = mapping.get('poste') or mapping.get('metier')
                        col_grade = mapping.get('metier') or mapping.get('poste')
                        
                        est_formation = False
                        est_maladie = False
                        
                        if col_poste and col_poste in row.index:
                            poste_str = str(row[col_poste]).upper()
                            # Mots-clés pour formation
                            if any(mot in poste_str for mot in ['FORMATION', 'FORMATEUR', 'STAGE', 'APPRENTI', 'STAGIAIRE']):
                                est_formation = True
                        
                        if col_grade and col_grade in row.index:
                            grade_str = str(row[col_grade]).upper()
                            if any(mot in grade_str for mot in ['FORMATION', 'FORMATEUR', 'STAGE', 'APPRENTI', 'STAGIAIRE']):
                                est_formation = True
                        
                        # 2. Vérifier la date d'affectation récente (peut indiquer formation)
                        col_date_affectation = mapping.get('dateEmbauche')
                        if col_date_affectation and col_date_affectation in row.index:
                            try:
                                date_aff = pd.to_datetime(row[col_date_affectation])
                                if pd.notna(date_aff):
                                    # Si affectation très récente (< 3 mois), peut-être formation
                                    trois_mois = datetime.now() - timedelta(days=90)
                                    if date_aff > trois_mois:
                                        est_formation = True
                            except:
                                pass
                        
                        # Répartition statistique si aucun critère ne correspond
                        # En moyenne dans la fonction publique :
                        # - Congés : ~70% des absences
                        # - Maladie : ~20% des absences  
                        # - Formation : ~10% des absences
                        if est_formation:
                            agent['enFormation'] = True
                        else:
                            # Utiliser un hash de l'ID pour une répartition déterministe
                            agent_id = agent.get('id', str(row.name))
                            hash_val = hash(str(agent_id)) % 100
                            if hash_val < 70:  # 70% en congés
                                agent['enConges'] = True
                            elif hash_val < 90:  # 20% en maladie
                                agent['enArretMaladie'] = True
                            else:  # 10% en formation
                                agent['enFormation'] = True
            except:
                pass
    
    # Actif
    col_actif = mapping.get('actif')
    if col_actif and col_actif in row.index:
        valeur = str(row[col_actif]).upper()
        agent['actif'] = valeur in ['TRUE', '1', 'OUI', 'YES', 'ACTIF', 'EN POSTE']
    else:
        agent['actif'] = True  # Par défaut
    
    # Date de mise à jour
    col_date_maj = mapping.get('dateMaj')
    agent['dateMaj'] = normaliser_date(row[col_date_maj]) if col_date_maj and col_date_maj in row.index else datetime.now().strftime('%Y-%m-%d')
    
    return agent

def convertir_excel_vers_json(chemin_excel: Path, chemin_json: Path, feuille: Optional[str] = None, filtrer_dirm_med: bool = False):
    """Convertit un fichier Excel en JSON"""
    print(f"📖 Lecture du fichier Excel: {chemin_excel.name}")
    
    excel_file = pd.ExcelFile(chemin_excel)
    
    if feuille:
        feuilles = [feuille] if feuille in excel_file.sheet_names else [excel_file.sheet_names[0]]
    else:
        # Par défaut, utiliser la feuille "Données"
        if 'Données' in excel_file.sheet_names:
            feuilles = ['Données']
        elif 'Donnees' in excel_file.sheet_names:
            feuilles = ['Donnees']
        else:
            # Chercher une feuille qui contient "données" ou "donnees"
            for sheet in excel_file.sheet_names:
                if 'donnée' in sheet.lower() or 'donnee' in sheet.lower():
                    feuilles = [sheet]
                    break
            else:
                feuilles = [excel_file.sheet_names[0]]
    
    print(f"   Feuilles à traiter: {', '.join(feuilles)}")
    
    agents = []
    
    for sheet_name in feuilles:
        print(f"\n   Traitement de la feuille: {sheet_name}")
        
        # Détecter la ligne d'en-tête
        df_raw = pd.read_excel(excel_file, sheet_name=sheet_name, header=None)
        header_row = None
        mots_cles = ['nom', 'prénom', 'prenom', 'sexe', 'genre', 'âge', 'age', 'service', 'région', 'region']
        
        for idx in range(min(10, len(df_raw))):
            row_values = [str(val).lower() if pd.notna(val) else '' for val in df_raw.iloc[idx]]
            matches = sum(1 for mot in mots_cles if any(mot in val for val in row_values))
            if matches >= 3:
                header_row = idx
                break
        
        if header_row is not None:
            print(f"   ✅ Ligne d'en-tête détectée à la ligne {header_row + 1}")
            df = pd.read_excel(excel_file, sheet_name=sheet_name, header=header_row)
            df.columns = [col if pd.notna(col) and str(col).strip() != '' else f'Unnamed_{i}' 
                         for i, col in enumerate(df.columns)]
        else:
            df = pd.read_excel(excel_file, sheet_name=sheet_name)
        
        # Trouver les correspondances de colonnes
        mapping = {}
        for colonne_attendue in COLONNES_ATTENDUES.keys():
            col_trouvee = trouver_colonne(df, colonne_attendue)
            if col_trouvee:
                mapping[colonne_attendue] = col_trouvee
        
        # Ajouter aussi la colonne Libellé NNE si elle existe
        for col in df.columns:
            if 'libellé' in str(col).lower() and 'nne' in str(col).lower():
                mapping['libelleNNE'] = col
                break
        
        print(f"   Colonnes mappées: {len(mapping)}/{len(COLONNES_ATTENDUES)}")
        
        # Filtrer pour DIRM Méditerranée si demandé
        if filtrer_dirm_med and 'region' in mapping:
            col_region = mapping['region']
            regions_med = ['PROVENCE-ALPES-COTE-D\'AZUR', 'PROVENCE ALPES COTE D\'AZUR', 
                          'PACA', 'MED', 'MEDITERRANEE', 'MÉDITERRANÉE']
            mask = df[col_region].astype(str).str.upper().str.contains('|'.join(regions_med), na=False, regex=True)
            df = df[mask]
            print(f"   🔍 Filtrage DIRM Méditerranée: {len(df)} agents après filtrage")
        
        # Convertir chaque ligne
        for idx, row in df.iterrows():
            try:
                agent = convertir_agent(row, mapping)
                agents.append(agent)
            except Exception as e:
                print(f"      ⚠️  Erreur ligne {idx}: {str(e)}")
                continue
        
        print(f"   ✅ {len(agents)} agents convertis")
    
    # Créer la structure de données complète
    data = {
        'agents': agents,
        'capacites': {
            'missions': [
                {'mission': 'Contrôle et surveillance', 'capaciteMaximale': 95},
                {'mission': 'Police des pêches', 'capaciteMaximale': 60},
                {'mission': 'Sauvetage en mer', 'capaciteMaximale': 48},
                {'mission': 'Protection environnement', 'capaciteMaximale': 42},
                {'mission': 'Gestion portuaire', 'capaciteMaximale': 35},
                {'mission': 'Formation maritime', 'capaciteMaximale': 32},
                {'mission': 'Affaires maritimes', 'capaciteMaximale': 35},
                {'mission': 'Support administratif', 'capaciteMaximale': 28}
            ],
            'regions': [
                {'region': 'Marseille', 'capaciteMaximale': 150, 'coordonnees': {'x': 83, 'y': 81}},
                {'region': 'Nice', 'capaciteMaximale': 85, 'coordonnees': {'x': 94, 'y': 76}},
                {'region': 'Toulon', 'capaciteMaximale': 92, 'coordonnees': {'x': 88, 'y': 83}},
                {'region': 'Sète', 'capaciteMaximale': 48, 'coordonnees': {'x': 66, 'y': 80}}
            ]
        },
        'metadonnees': {
            'dateExport': datetime.now().strftime('%Y-%m-%d'),
            'version': '1.0',
            'source': chemin_excel.name
        }
    }
    
    # Sauvegarder en JSON
    with open(chemin_json, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False, default=str)
    
    print(f"\n✅ Fichier JSON créé: {chemin_json}")
    print(f"   Total agents: {len(agents)}")
    
    return data

def main():
    """Fonction principale"""
    import sys
    
    base_path = Path(__file__).parent.parent
    
    # Fichier Excel à convertir
    if len(sys.argv) > 1:
        fichier_excel = Path(sys.argv[1])
    else:
        # Par défaut, utiliser le fichier corrigé
        fichier_excel = base_path / 'trdata' / 'Interface_Effectifs_DIRM_Central_V6_corrected.xlsx'
    
    if not fichier_excel.exists():
        print(f"❌ Fichier non trouvé: {fichier_excel}")
        return
    
    # Fichier JSON de sortie
    fichier_json = base_path / 'src' / 'data' / 'agents.json'
    fichier_json.parent.mkdir(parents=True, exist_ok=True)
    
    # Feuille spécifique (optionnel)
    feuille = sys.argv[2] if len(sys.argv) > 2 else None
    
    convertir_excel_vers_json(fichier_excel, fichier_json, feuille)

if __name__ == '__main__':
    main()
