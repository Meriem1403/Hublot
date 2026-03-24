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
import re

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
    'region': ['region', 'région', 'zone', 'site', 'implantation'],
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


def mapper_pasa(code_action: Any, sous_action: Any, thematique: Any) -> Dict[str, Optional[str]]:
    """
    Déduit la politique publique PASA (code + libellé) et un segment (optionnel)
    à partir des colonnes Action / Sous-Action / Thématique.

    IMPORTANT:
    Le classeur fourni ne contient pas directement le code 217-11-xx. Cette déduction
    est basée sur les codes observés (Action / Sous-Action) et la thématique.
    """
    action = str(code_action).strip() if pd.notna(code_action) else ''
    sous = str(sous_action).strip() if pd.notna(sous_action) else ''
    thema = str(thematique).strip() if pd.notna(thematique) else ''

    LIBELLES = {
        '217-11-02': "217-11-02 enseignement maritime, emploi et formations maritimes",
        '217-11-03': "217-11-03 pavillon français, flotte de commerce et sécurité des navires",
        '217-11-04': "217-11-04 police en mer (contrôle/surveillance, environnement marin, cultures marines)",
        '217-11-05': "217-11-05 soutien et systèmes d’information",
        '217-11-08': "217-11-08 planification maritime, plaisance et sécurité des loisirs nautiques",
        '217-11-11': "217-11-11 sauvetage et sécurité en mer",
        '217-11-13': "217-11-13 aides à la navigation (phares et balises) / lutte contre les pollutions marines",
        '217-11-16': "217-11-16 capitaineries et sécurité portuaire",
    }

    thema_norm = thema.lower()
    if thema_norm == 'phares et balises':
        return {'pasaCode': '217-11-13', 'pasaLibelle': LIBELLES['217-11-13'], 'pasaSegment': 'Phares et balises', 'pasaSousSegment': sous or None}
    if thema.upper() == 'ISN':
        return {'pasaCode': '217-11-05', 'pasaLibelle': LIBELLES['217-11-05'], 'pasaSegment': 'Systèmes d’information', 'pasaSousSegment': sous or None}
    if thema.upper() == 'LPM':
        return {'pasaCode': '217-11-16', 'pasaLibelle': LIBELLES['217-11-16'], 'pasaSegment': 'Capitaineries / ports', 'pasaSousSegment': sous or None}

    # Codes décimaux -> formation
    if action in ['0.4', '0.5', '0.62', '0.7', '0.8', '0.85', '0.86', '0.9']:
        return {'pasaCode': '217-11-02', 'pasaLibelle': LIBELLES['217-11-02'], 'pasaSegment': 'Formation maritime', 'pasaSousSegment': action}

    # Sauvetage
    if action == '1':
        return {'pasaCode': '217-11-11', 'pasaLibelle': LIBELLES['217-11-11'], 'pasaSegment': 'Sauvetage', 'pasaSousSegment': sous or action}

    # Contrôle/surveillance/pêches
    if action.startswith('0205') or action.startswith('0203'):
        return {'pasaCode': '217-11-04', 'pasaLibelle': LIBELLES['217-11-04'], 'pasaSegment': 'Police en mer', 'pasaSousSegment': sous or action}

    # Affaires maritimes
    if action == '0113-07':
        return {'pasaCode': '217-11-03', 'pasaLibelle': LIBELLES['217-11-03'], 'pasaSegment': 'Affaires maritimes', 'pasaSousSegment': sous or action}

    # Par défaut
    return {'pasaCode': '217-11-05', 'pasaLibelle': LIBELLES['217-11-05'], 'pasaSegment': thema or None, 'pasaSousSegment': sous or None}

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

def normaliser_service(valeur: Any, thematique: Optional[str]) -> str:
    """
    Normalise le champ service en conservant les structures réelles (DDTM/DIRM/DM/SAM…)
    et en ventilant COM-STC quand c’est possible.
    """
    if pd.isna(valeur):
        service = 'Non défini'
    else:
        service = str(valeur).strip()
        if not service:
            service = 'Non défini'

    # Harmoniser "DDTM06" -> "DDTM 06" (et variantes)
    m = re.match(r'^(DDTM|DDT|DIRM|DM|SAM)\s*[-_/]?\s*(\d{1,2})$', service.upper())
    if m:
        prefix = m.group(1)
        num = m.group(2).zfill(2)
        service = f'{prefix} {num}'

    # Normaliser quelques libellés fréquents
    s_upper = service.upper()
    if s_upper in ['DIRM MED', 'DIRM MÉD', 'DIRM MEDITERRANEE', 'DIRM MÉDITERRANÉE', 'DIRM MEDITERRANÉE']:
        service = 'DIRM MED'
    if s_upper == 'DMSOI':
        service = 'DM SOI'
        s_upper = service.upper()
    # DML / DMLC : harmoniser
    if s_upper.startswith('DML '):
        service = 'DMLC ' + service[4:].strip()
        s_upper = service.upper()
    if s_upper == 'DML CORSE':
        service = 'DMLC CORSE'
        s_upper = service.upper()

    # Ventilation COM-STC -> APB / ESP Mer / CROSS Minarm / LPM (ou fallback)
    if 'COM-STC' in s_upper or s_upper == 'COM STC':
        th = (thematique or '').strip()
        th_upper = th.upper()
        if th_upper in ['APB', 'LPM', 'ISN']:
            return th_upper
        if 'CROSS' in th_upper or 'MINARM' in th_upper:
            return 'CROSS Minarm'
        if 'ESP' in th_upper:
            return 'ESP Mer'
        return 'Autre COM-STC'

    return service

def categoriser_fonction(poste: Optional[str]) -> Optional[str]:
    """
    Catégorise une fonction exercée (champ Poste) en catégories génériques
    pour faciliter le filtrage et l'analyse.
    """
    if not poste:
        return None
    p = str(poste).strip()
    if not p:
        return None
    up = p.upper()

    # Encadrement / direction
    if any(k in up for k in ['DIRECT', 'DIR.', 'CHEF', 'RESPONS', 'COORDIN', 'ENCAD', 'MANAGER']):
        return 'Encadrement'

    # Contrôle / surveillance / police
    if any(k in up for k in ['CONTROLE', 'CONTRÔLE', 'SURVEILL', 'POLICE', 'PATROUIL', 'INSPECT', 'DCS', 'PECHE', 'PÊCHE', 'CULTURES MARINES']):
        return 'Contrôle/Surveillance'

    # Sauvetage / CROSS / secours
    if any(k in up for k in ['CROSS', 'SAUVET', 'SECOURS', 'SAR', 'MRCC']):
        return 'Sauvetage/Secours'

    # Systèmes d'information
    if any(k in up for k in ['SI', 'SIC', 'INFORMAT', 'RÉSEAU', 'RESEAU', 'CYBER', 'DATA', 'APPLICATION']):
        return "Systèmes d'information"

    # Environnement / pollution
    if any(k in up for k in ['ENVIRON', 'POLLUTION', 'POLLUT', 'AIRE MARINE', 'NATURA', 'BIODIVERS']):
        return 'Environnement'

    # Portuaire / capitainerie
    if any(k in up for k in ['PORT', 'CAPITAIN', 'CAPITAINERIE', 'QUAI', 'DOCK']):
        return 'Portuaire'

    # Marins / navigation / balisage
    if any(k in up for k in ['NAVIGATION', 'BALIS', 'PHARES', 'BALISE', 'AIDE A LA NAVIGATION', 'AIDE À LA NAVIGATION']):
        return 'Navigation'

    # Juridique
    if any(k in up for k in ['JURIDI', 'CONTENTIEUX', 'REGLEMENT', 'RÉGLEMENT']):
        return 'Juridique'

    # Formation
    if any(k in up for k in ['FORMATION', 'ENSEIGN', 'PEDAGOG', 'PÉDAGOG']):
        return 'Formation'

    # Technique / maintenance
    if any(k in up for k in ['TECHNI', 'MAINTEN', 'MECANI', 'MÉCANI', 'ELECT', 'ÉLECT', 'NAV', 'PHARES', 'BALISE']):
        return 'Technique/Maintenance'

    # Administratif / RH / finances
    if any(k in up for k in ['ADMIN', 'SECRET', 'RH', 'RESSOURCES', 'FINANC', 'BUDGET', 'COMPTA', 'ACHAT', 'MARCHE']):
        return 'Administratif/RH/Finances'

    # Logistique
    if any(k in up for k in ['LOGIST', 'APPRO', 'STOCK', 'MAGASIN', 'FLOTTE']):
        return 'Logistique'

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
    
    # Région (conserver la valeur source Excel, sans conversion en villes)
    col_region = mapping.get('region')
    if col_region and col_region in row.index:
        region = str(row[col_region]).strip() if pd.notna(row[col_region]) else ''
        agent['region'] = region or 'Non définie'
    else:
        agent['region'] = 'Non définie'
    
    # Service
    # Récupérer la thématique si disponible (utile pour COM-STC)
    col_thematique = None
    for col in row.index:
        if 'thématique' in str(col).lower() or 'thematique' in str(col).lower():
            col_thematique = col
            break
    thematique_val = None
    if col_thematique and col_thematique in row.index and pd.notna(row[col_thematique]):
        thematique_val = str(row[col_thematique]).strip()

    col_service = mapping.get('service')
    if col_service and col_service in row.index:
        agent['service'] = normaliser_service(row[col_service], thematique_val)
    else:
        agent['service'] = 'Non défini'
    
    # Mission (depuis la colonne "Action")
    col_mission = mapping.get('mission')
    if col_mission and col_mission in row.index:
        code_mission = str(row[col_mission]) if pd.notna(row[col_mission]) else None
        if code_mission:
            # Conserver le code Action brut (référence fiable Excel)
            agent['missionCode'] = code_mission.strip()
            # Convertir le code Action en nom de mission lisible
            agent['mission'] = convertir_code_mission_en_nom(code_mission, row, mapping)
        else:
            agent['mission'] = 'Non définie'
    else:
        agent['mission'] = 'Non définie'

    # PASA : politique publique + segment (dérivés de Action / Sous-Action / Thématique)
    col_sous_action = None
    for col in row.index:
        col_lower = str(col).lower()
        if 'sous-action' in col_lower or col_lower.strip() == 'sous_action':
            col_sous_action = col

    pasa = mapper_pasa(
        row[col_mission] if col_mission and col_mission in row.index else None,
        row[col_sous_action] if col_sous_action and col_sous_action in row.index else None,
        row[col_thematique] if col_thematique and col_thematique in row.index else None,
    )
    for k, v in pasa.items():
        if v is not None and v != '':
            agent[k] = v

    # Corps / fonction exercée (proposition)
    # - corps : issu de la colonne "Grade" si présente
    # - libelleNNE : issu de la colonne "Libellé NNE" (souvent plus explicite)
    # - fonctionExercee : issu de la colonne "Poste"
    col_grade_excel = None
    for col in row.index:
        if str(col).strip().lower() == 'grade':
            col_grade_excel = col
            break
    if col_grade_excel and pd.notna(row[col_grade_excel]):
        agent['corps'] = str(row[col_grade_excel]).strip()

    col_libelle_nne = mapping.get('libelleNNE')
    if col_libelle_nne and col_libelle_nne in row.index and pd.notna(row[col_libelle_nne]):
        libelle_nne = str(row[col_libelle_nne]).strip()
        if libelle_nne:
            agent['libelleNNE'] = libelle_nne

    col_poste = mapping.get('poste')
    if col_poste and col_poste in row.index and pd.notna(row[col_poste]):
        agent['fonctionExercee'] = str(row[col_poste]).strip()
        cat = categoriser_fonction(agent.get('fonctionExercee'))
        if cat:
            agent['fonctionCategorie'] = cat
    
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
        else:
            # Valeurs non A/B/C (ex: Contractuel, Autre) :
            # on reste sur une règle strictement traçable et descriptive.
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
    
    # Absences
    # IMPORTANT: ne JAMAIS inventer des absences. Si la source ne fournit pas le motif,
    # on laisse à False (données non renseignées).
    col_conges = mapping.get('enConges')
    col_formation = mapping.get('enFormation')
    col_maladie = mapping.get('enArretMaladie')
    
    # Vérifier d'abord les colonnes explicites d'absence si elles existent
    agent['enConges'] = bool(row[col_conges]) if col_conges and col_conges in row.index and pd.notna(row[col_conges]) else False
    agent['enFormation'] = bool(row[col_formation]) if col_formation and col_formation in row.index and pd.notna(row[col_formation]) else False
    agent['enArretMaladie'] = bool(row[col_maladie]) if col_maladie and col_maladie in row.index and pd.notna(row[col_maladie]) else False
    
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
        
        # Filtrer pour DIRM Méditerranée si demandé (optionnel, pas par défaut)
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

def convertir_excels_vers_historique(chemins_excel: List[Path], feuille: Optional[str] = None) -> Dict[str, Any]:
    """
    Construit un StatDirmData avec `historique` (snapshots).
    Le dernier fichier devient le snapshot courant (champ `agents`).
    """
    snapshots: List[Dict[str, Any]] = []
    latest: Optional[Dict[str, Any]] = None

    for p in chemins_excel:
        # Ecriture dans un chemin bidon : on ne garde que le dict retourné
        tmp = convertir_excel_vers_json(p, Path('/dev/null'), feuille)
        snapshots.append({
            'agents': tmp.get('agents', []),
            'metadonnees': {
                'dateExport': tmp.get('metadonnees', {}).get('dateExport', datetime.now().strftime('%Y-%m-%d')),
                'version': tmp.get('metadonnees', {}).get('version', '1.0'),
                'source': p.name
            }
        })
        latest = tmp

    if latest is None:
        raise ValueError("Aucun fichier Excel fourni")

    return {
        'agents': latest.get('agents', []),
        'capacites': latest.get('capacites', {}),
        'metadonnees': latest.get('metadonnees', {}),
        'historique': snapshots
    }

def main():
    """Fonction principale"""
    import sys
    
    base_path = Path(__file__).parent.parent
    
    # Fichiers Excel à convertir (un ou plusieurs)
    excel_args = [a for a in sys.argv[1:] if str(a).lower().endswith('.xlsx')]
    if excel_args:
        fichiers_excel = [Path(a) for a in excel_args]
    else:
        # Par défaut, utiliser le fichier corrigé
        fichiers_excel = [base_path / 'trdata' / 'Interface_Effectifs_DIRM_Central_V6_corrected.xlsx']
    
    for f in fichiers_excel:
        if not f.exists():
            print(f"❌ Fichier non trouvé: {f}")
            return
    
    # Fichiers JSON de sortie (synchronisés)
    # - src/data/agents.json : utilisé en fallback build
    # - public/data/agents.json : servi à l'exécution via /data/agents.json
    fichier_json_src = base_path / 'src' / 'data' / 'agents.json'
    fichier_json_public = base_path / 'public' / 'data' / 'agents.json'
    fichier_json_src.parent.mkdir(parents=True, exist_ok=True)
    fichier_json_public.parent.mkdir(parents=True, exist_ok=True)
    
    # Feuille spécifique (optionnel)
    feuille = None
    if '--sheet' in sys.argv:
        try:
            feuille = sys.argv[sys.argv.index('--sheet') + 1]
        except Exception:
            feuille = None

    if len(fichiers_excel) == 1:
        data = convertir_excel_vers_json(fichiers_excel[0], fichier_json_src, feuille)
    else:
        data = convertir_excels_vers_historique(fichiers_excel, feuille)
        with open(fichier_json_src, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False, default=str)
        print(f"\n✅ Fichier JSON (historique) créé: {fichier_json_src}")
        print(f"   Snapshots: {len(data.get('historique', []))}")
        print(f"   Total agents (snapshot courant): {len(data.get('agents', []))}")

    # Synchroniser la version servie par l'application
    with open(fichier_json_public, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False, default=str)
    print(f"✅ Copie synchronisée: {fichier_json_public}")

if __name__ == '__main__':
    main()
