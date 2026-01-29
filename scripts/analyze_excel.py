#!/usr/bin/env python3
"""
Script d'analyse des fichiers Excel pour StatDirm
Analyse la structure des données et vérifie la compatibilité avec le modèle de données requis
"""

import pandas as pd
import json
import sys
from pathlib import Path
from typing import Dict, List, Any
import warnings

warnings.filterwarnings('ignore')

# Mapping des colonnes attendues vers les colonnes possibles dans Excel
COLONNES_ATTENDUES = {
    # Informations personnelles
    'id': ['id', 'identifiant', 'matricule', 'numero', 'numéro', 'thématique'],
    'nom': ['nom', 'name', 'lastname', 'nom_famille'],
    'prenom': ['prenom', 'prénom', 'prenom_agent', 'firstname', 'prenom_agent'],
    'dateNaissance': ['date_naissance', 'date naissance', 'date_de_naissance', 'birthdate', 'date_naiss', 'année de naissance', 'annee de naissance', 'année_de_naissance'],
    'genre': ['genre', 'sexe', 'gender', 'sex', 'civilite', 'civilité'],
    
    # Informations professionnelles
    'statut': ['statut', 'status', 'type_contrat', 'type contrat', 'situation', 'situation_statutaire', 'catégorie', 'categorie'],
    'contratType': ['contrat_type', 'type_contrat', 'temps_travail', 'temps travail', 'quotite', 'temps de travail'],
    'tempsPartielPourcentage': ['temps_partiel', 'temps partiel', 'quotite', 'quotité', 'pourcentage_tp'],
    
    # Affectation
    'region': ['region', 'région', 'zone', 'site', 'implantation'],
    'service': ['service', 'direction', 'departement', 'département', 'unite', 'unité'],
    'mission': ['mission', 'activite', 'activité', 'fonction', 'action', 'sous-action', 'sous_action'],
    'metier': ['metier', 'métier', 'poste', 'fonction', 'emploi', 'grade', 'libellé nne', 'libelle nne', 'libellé_nne'],
    
    # Hiérarchie
    'niveauResponsabilite': ['niveau', 'niveau_responsabilite', 'niveau responsabilité', 'hierarchie', 'hiérarchie', 'echelon', 'catégorie', 'categorie'],
    'poste': ['poste', 'fonction', 'libelle_poste', 'libellé poste', 'intitule', 'intitulé'],
    
    # Dates
    'dateEmbauche': ['date_embauche', 'date embauche', 'date_recrutement', 'date recrutement', 'date_entree', 'date entrée', 'date d\'affectation', 'date_affectation'],
    'dateFinContrat': ['date_fin_contrat', 'date fin contrat', 'date_fin', 'fin_contrat'],
    'dateDepartPrevue': ['date_depart', 'date départ', 'date_depart_prevue', 'date départ prévue', 'depart_prevue'],
    
    # Temps de travail
    'etp': ['etp', 'eqtp', 'equivalent_temps_plein', 'équivalent temps plein'],
    'enConges': ['en_conges', 'en congés', 'conges', 'congés', 'absence_conges'],
    'enFormation': ['en_formation', 'en formation', 'formation', 'en_stage'],
    'enArretMaladie': ['arret_maladie', 'arrêt maladie', 'maladie', 'en_arret', 'en arrêt'],
    
    # Métadonnées
    'actif': ['actif', 'en_poste', 'en poste', 'actif_agent', 'statut_actif'],
    'dateMaj': ['date_maj', 'date maj', 'date_mise_a_jour', 'derniere_maj', 'dernière maj']
}

def normaliser_nom_colonne(nom: str) -> str:
    """Normalise le nom d'une colonne pour faciliter la correspondance"""
    return nom.lower().strip().replace(' ', '_').replace('é', 'e').replace('è', 'e').replace('à', 'a')

def trouver_colonne_correspondante(colonne_cible: str, colonnes_disponibles: List[str]) -> str:
    """Trouve la colonne correspondante dans la liste des colonnes disponibles"""
    colonnes_norm = {normaliser_nom_colonne(c): c for c in colonnes_disponibles}
    
    # Chercher une correspondance exacte
    for alias in COLONNES_ATTENDUES.get(colonne_cible, []):
        alias_norm = normaliser_nom_colonne(alias)
        if alias_norm in colonnes_norm:
            return colonnes_norm[alias_norm]
    
    # Chercher une correspondance partielle
    colonne_norm_cible = normaliser_nom_colonne(colonne_cible)
    for col_norm, col_orig in colonnes_norm.items():
        if colonne_norm_cible in col_norm or col_norm in colonne_norm_cible:
            return col_orig
    
    return None

def analyser_fichier_excel(chemin_fichier: Path) -> Dict[str, Any]:
    """Analyse un fichier Excel et retourne un rapport d'analyse"""
    print(f"\n{'='*80}")
    print(f"Analyse du fichier: {chemin_fichier.name}")
    print(f"{'='*80}\n")
    
    try:
        # Lire le fichier Excel
        excel_file = pd.ExcelFile(chemin_fichier)
        print(f"✅ Fichier Excel ouvert avec succès")
        print(f"   Nombre de feuilles: {len(excel_file.sheet_names)}")
        print(f"   Feuilles: {', '.join(excel_file.sheet_names)}\n")
        
        rapport = {
            'fichier': str(chemin_fichier),
            'feuilles': {},
            'analyse_globale': {}
        }
        
        # Analyser chaque feuille
        for sheet_name in excel_file.sheet_names:
            print(f"\n📊 Analyse de la feuille: '{sheet_name}'")
            print("-" * 80)
            
            # Essayer de trouver la ligne d'en-tête
            df_raw = pd.read_excel(excel_file, sheet_name=sheet_name, header=None)
            
            # Chercher la ligne contenant les en-têtes (chercher "Nom", "Prénom", etc.)
            header_row = None
            mots_cles = ['nom', 'prénom', 'prenom', 'sexe', 'genre', 'âge', 'age', 'service', 'région', 'region']
            
            for idx in range(min(10, len(df_raw))):  # Chercher dans les 10 premières lignes
                row_values = [str(val).lower() if pd.notna(val) else '' for val in df_raw.iloc[idx]]
                matches = sum(1 for mot in mots_cles if any(mot in val for val in row_values))
                if matches >= 3:  # Au moins 3 mots-clés trouvés
                    header_row = idx
                    break
            
            if header_row is not None:
                print(f"   ✅ Ligne d'en-tête détectée à la ligne {header_row + 1}")
                df = pd.read_excel(excel_file, sheet_name=sheet_name, header=header_row)
                # Nettoyer les colonnes avec des noms vides
                df.columns = [col if pd.notna(col) and str(col).strip() != '' else f'Unnamed_{i}' 
                             for i, col in enumerate(df.columns)]
            else:
                print(f"   ⚠️  Ligne d'en-tête non détectée, utilisation de la première ligne")
                df = pd.read_excel(excel_file, sheet_name=sheet_name)
            
            # Informations de base
            nb_lignes = len(df)
            nb_colonnes = len(df.columns)
            
            print(f"   Lignes: {nb_lignes}")
            print(f"   Colonnes: {nb_colonnes}")
            print(f"\n   Colonnes disponibles:")
            for i, col in enumerate(df.columns, 1):
                valeurs_uniques = df[col].nunique()
                valeurs_manquantes = df[col].isna().sum()
                print(f"      {i:2d}. {col:40s} | Uniques: {valeurs_uniques:4d} | Manquantes: {valeurs_manquantes:4d}")
            
            # Analyser la correspondance avec les colonnes attendues
            print(f"\n   📋 Correspondance avec le modèle de données:")
            correspondances = {}
            colonnes_manquantes = []
            
            for colonne_attendue in COLONNES_ATTENDUES.keys():
                colonne_trouvee = trouver_colonne_correspondante(colonne_attendue, df.columns.tolist())
                if colonne_trouvee:
                    correspondances[colonne_attendue] = colonne_trouvee
                    valeurs_uniques = df[colonne_trouvee].nunique()
                    valeurs_manquantes = df[colonne_trouvee].isna().sum()
                    print(f"      ✅ {colonne_attendue:25s} → {colonne_trouvee:30s} ({valeurs_uniques} valeurs uniques, {valeurs_manquantes} manquantes)")
                else:
                    colonnes_manquantes.append(colonne_attendue)
                    print(f"      ❌ {colonne_attendue:25s} → NON TROUVÉE")
            
            # Analyser les valeurs uniques pour certaines colonnes importantes
            print(f"\n   📊 Analyse des valeurs uniques:")
            
            analyses_valeurs = {}
            
            # Genre
            if 'genre' in correspondances:
                col_genre = correspondances['genre']
                valeurs_genre = df[col_genre].value_counts()
                print(f"      Genre: {dict(valeurs_genre)}")
                analyses_valeurs['genre'] = dict(valeurs_genre)
            
            # Statut
            if 'statut' in correspondances:
                col_statut = correspondances['statut']
                valeurs_statut = df[col_statut].value_counts()
                print(f"      Statut: {dict(valeurs_statut)}")
                analyses_valeurs['statut'] = dict(valeurs_statut)
            
            # Région
            if 'region' in correspondances:
                col_region = correspondances['region']
                valeurs_region = df[col_region].value_counts()
                print(f"      Région: {dict(valeurs_region)}")
                analyses_valeurs['region'] = dict(valeurs_region)
            
            # Service
            if 'service' in correspondances:
                col_service = correspondances['service']
                valeurs_service = df[col_service].value_counts()
                print(f"      Service ({len(valeurs_service)} valeurs): {dict(valeurs_service.head(10))}")
                analyses_valeurs['service'] = dict(valeurs_service)
            
            # Mission
            if 'mission' in correspondances:
                col_mission = correspondances['mission']
                valeurs_mission = df[col_mission].value_counts()
                print(f"      Mission ({len(valeurs_mission)} valeurs): {dict(valeurs_mission.head(10))}")
                analyses_valeurs['mission'] = dict(valeurs_mission)
            
            # Métier
            if 'metier' in correspondances:
                col_metier = correspondances['metier']
                valeurs_metier = df[col_metier].value_counts()
                print(f"      Métier ({len(valeurs_metier)} valeurs): {dict(valeurs_metier.head(10))}")
                analyses_valeurs['metier'] = dict(valeurs_metier)
            
            # Niveau de responsabilité
            if 'niveauResponsabilite' in correspondances:
                col_niveau = correspondances['niveauResponsabilite']
                valeurs_niveau = df[col_niveau].value_counts()
                print(f"      Niveau responsabilité: {dict(valeurs_niveau)}")
                analyses_valeurs['niveauResponsabilite'] = dict(valeurs_niveau)
            
            # Dates
            print(f"\n   📅 Analyse des dates:")
            dates_trouvees = []
            for date_col in ['dateNaissance', 'dateEmbauche', 'dateFinContrat', 'dateDepartPrevue']:
                if date_col in correspondances:
                    col_date = correspondances[date_col]
                    dates_valides = pd.to_datetime(df[col_date], errors='coerce').notna().sum()
                    print(f"      {date_col:25s}: {dates_valides}/{nb_lignes} dates valides")
                    dates_trouvees.append(date_col)
            
            # Stocker les informations dans le rapport
            rapport['feuilles'][sheet_name] = {
                'nb_lignes': nb_lignes,
                'nb_colonnes': nb_colonnes,
                'colonnes': list(df.columns),
                'correspondances': correspondances,
                'colonnes_manquantes': colonnes_manquantes,
                'analyses_valeurs': analyses_valeurs,
                'dates_trouvees': dates_trouvees
            }
            
            # Aperçu des premières lignes
            print(f"\n   👀 Aperçu des données (5 premières lignes):")
            print(df.head().to_string())
        
        # Analyse globale
        print(f"\n\n{'='*80}")
        print("📈 RÉSUMÉ GLOBAL")
        print(f"{'='*80}\n")
        
        toutes_correspondances = {}
        toutes_colonnes_manquantes = set()
        
        for sheet_name, sheet_data in rapport['feuilles'].items():
            toutes_correspondances.update(sheet_data['correspondances'])
            toutes_colonnes_manquantes.update(sheet_data['colonnes_manquantes'])
        
        print(f"✅ Colonnes trouvées: {len(toutes_correspondances)}/{len(COLONNES_ATTENDUES)}")
        print(f"❌ Colonnes manquantes: {len(toutes_colonnes_manquantes)}")
        
        if toutes_colonnes_manquantes:
            print(f"\n   Colonnes manquantes:")
            for col in sorted(toutes_colonnes_manquantes):
                print(f"      - {col}")
        
        # Colonnes critiques
        colonnes_critiques = ['nom', 'prenom', 'dateNaissance', 'genre', 'statut', 'region', 'service']
        colonnes_critiques_trouvees = [col for col in colonnes_critiques if col in toutes_correspondances]
        colonnes_critiques_manquantes = [col for col in colonnes_critiques if col not in toutes_correspondances]
        
        print(f"\n   Colonnes CRITIQUES:")
        print(f"      ✅ Trouvées: {len(colonnes_critiques_trouvees)}/{len(colonnes_critiques)}")
        if colonnes_critiques_manquantes:
            print(f"      ❌ Manquantes: {', '.join(colonnes_critiques_manquantes)}")
        
        rapport['analyse_globale'] = {
            'colonnes_trouvees': len(toutes_correspondances),
            'colonnes_total': len(COLONNES_ATTENDUES),
            'colonnes_manquantes': list(toutes_colonnes_manquantes),
            'colonnes_critiques_trouvees': colonnes_critiques_trouvees,
            'colonnes_critiques_manquantes': colonnes_critiques_manquantes,
            'toutes_correspondances': toutes_correspondances
        }
        
        return rapport
        
    except Exception as e:
        print(f"❌ Erreur lors de l'analyse: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'fichier': str(chemin_fichier),
            'erreur': str(e)
        }

def generer_rapport_json(rapports: List[Dict[str, Any]], fichier_sortie: Path):
    """Génère un rapport JSON avec toutes les analyses"""
    with open(fichier_sortie, 'w', encoding='utf-8') as f:
        json.dump(rapports, f, indent=2, ensure_ascii=False, default=str)
    print(f"\n✅ Rapport JSON généré: {fichier_sortie}")

def main():
    """Fonction principale"""
    # Chemins des fichiers à analyser
    base_path = Path(__file__).parent.parent
    fichiers = [
        base_path / 'trdata' / 'Interface_Effectifs_DIRM_Central_V6.xlsx',
        base_path / 'trdata' / 'Interface_Effectifs_DIRM_Central_V6_corrected.xlsx'
    ]
    
    rapports = []
    
    for fichier in fichiers:
        if fichier.exists():
            rapport = analyser_fichier_excel(fichier)
            rapports.append(rapport)
        else:
            print(f"❌ Fichier non trouvé: {fichier}")
    
    # Générer le rapport JSON
    if rapports:
        rapport_json = base_path / 'scripts' / 'rapport_analyse.json'
        generer_rapport_json(rapports, rapport_json)
        
        # Conclusion
        print(f"\n\n{'='*80}")
        print("🎯 CONCLUSION")
        print(f"{'='*80}\n")
        
        for rapport in rapports:
            if 'erreur' in rapport:
                continue
                
            analyse = rapport.get('analyse_globale', {})
            critiques_trouvees = len(analyse.get('colonnes_critiques_trouvees', []))
            critiques_total = 7
            
            if critiques_trouvees == critiques_total:
                print(f"✅ {Path(rapport['fichier']).name}: DONNÉES SUFFISANTES")
                print(f"   Toutes les colonnes critiques sont présentes!")
            elif critiques_trouvees >= 5:
                print(f"⚠️  {Path(rapport['fichier']).name}: DONNÉES PARTIELLEMENT SUFFISANTES")
                print(f"   {critiques_trouvees}/{critiques_total} colonnes critiques trouvées")
                print(f"   Colonnes manquantes: {', '.join(analyse.get('colonnes_critiques_manquantes', []))}")
            else:
                print(f"❌ {Path(rapport['fichier']).name}: DONNÉES INSUFFISANTES")
                print(f"   Seulement {critiques_trouvees}/{critiques_total} colonnes critiques trouvées")
    
    print(f"\n{'='*80}\n")

if __name__ == '__main__':
    main()
