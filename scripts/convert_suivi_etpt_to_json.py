#!/usr/bin/env python3
"""
Convertisseur Excel -> JSON pour les exports RenoiRH
"Suivi des emplois en ETPT_RPROG" (feuille « Données annuelles »).

Ce format est différent de l'ancien (Interface_Effectifs_DIRM_Central_V6).
Particularités gérées ici :
  - Feuille nominative « Données annuelles » (en-tête en ligne 5 / index 4).
  - Chaque personne apparaît 1 fois par mois (et parfois par répartition
    programme/action) -> on réduit à 1 agent par matricule.
  - Aucune colonne sexe/date de naissance : on les déduit du NIR
    (1er chiffre = sexe, chiffres 2-5 = année/mois de naissance).

Sortie (format StatDirmData) :
  - src/data/agents.json     (fallback build)
  - public/data/agents.json  (servi à l'exécution via /data/agents.json)

Usage :
  python3 scripts/convert_suivi_etpt_to_json.py "trdata/Suivi_des_emplois_en_ETPT_RPROG (23).xlsx"
"""

from __future__ import annotations

import json
import re
import sys
import warnings
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

import pandas as pd

warnings.filterwarnings("ignore")

SHEET_NAME = "Données annuelles"
HEADER_ROW = 4  # ligne 5 dans Excel

# Colonnes sources (libellés exacts du fichier RenoiRH)
COL = {
    "nir": "Etat Civil : NIR",
    "matricule": "Etat Civil : Matricule SIRH",
    "nom_naissance": "Etat Civil : Nom de naissance",
    "nom_usage": "Etat Civil : Nom d'usage",
    "prenom": "Etat Civil : Prénom",
    "annee": "ETPT RH : Année",
    "mois": "Mois observation (synth annee)",
    "date_affectation": "Affect. Opé. : Date de début d'affectation étalée",
    "niveau03": "Niveau 03 Opé. : Libellé Court",
    "niveau06": "Niveau 06 Opé. : Libellé Court",
    "niveau08": "Niveau 08 Opé. : Libellé Court",
    "region_uo": "Affect. Opé.Reg UO : Libellé Long",
    "qualif": "Qual. Stat. Act. : Libellé Long",
    "statut": "Statut : Libellé Court",
    "poste": "ETPT RH : Poste",
    "poste_libelle": "ETPT RH : Poste Libellé long",
    "programme": "ETPT RH : Programme",
    "action": "ETPT RH : Action",
    "sous_action": "ETPT RH : Sous-Action",
    "taux": "Taux de réparition (annuel)",
    "grade14": "Grade Act. : MG_MTES MG14",
    "grade3": "Grade Act. : MG_MTES MG3",
    "etpt": "ETPT RH",
    "etpt_prog": "ETPT progAction",
    "code_nne": "Code NNE",
    "grade_nne": "Grade NNE (tab synth année)",
}


# ---------------------------------------------------------------------------
# Helpers de dérivation
# ---------------------------------------------------------------------------

def _digits(valeur: Any) -> str:
    if valeur is None or (isinstance(valeur, float) and pd.isna(valeur)):
        return ""
    s = str(valeur).strip()
    if s.endswith(".0"):
        s = s[:-2]
    return re.sub(r"\D", "", s)


def genre_depuis_nir(nir: Any) -> str:
    """1er chiffre du NIR : 1=Homme, 2=Femme."""
    d = _digits(nir)
    if not d:
        return "Autre"
    if d[0] == "1":
        return "H"
    if d[0] == "2":
        return "F"
    return "Autre"


def naissance_depuis_nir(nir: Any) -> Optional[str]:
    """NIR : S AA MM ... -> date ISO 'YYYY-MM-15' (jour non significatif)."""
    d = _digits(nir)
    if len(d) < 5:
        return None
    try:
        aa = int(d[1:3])
        mm = int(d[3:5])
    except ValueError:
        return None
    # Siècle : <= 26 (année courante) -> 2000+, sinon 1900+
    annee = 2000 + aa if aa <= 26 else 1900 + aa
    if mm < 1 or mm > 12:
        mm = 6  # mois inconnu (ex. 00) -> milieu d'année
    if not (1930 <= annee <= 2010):
        return None
    return f"{annee:04d}-{mm:02d}-15"


def normaliser_date(valeur: Any) -> Optional[str]:
    if valeur is None or (isinstance(valeur, float) and pd.isna(valeur)):
        return None
    try:
        if hasattr(valeur, "strftime"):
            return valeur.strftime("%Y-%m-%d")
        dt = pd.to_datetime(valeur, errors="coerce")
        if pd.notna(dt):
            return dt.strftime("%Y-%m-%d")
    except Exception:
        pass
    return None


def mapper_statut(valeur: Any) -> str:
    """Réduit le libellé statut RenoiRH vers l'enum app (Titulaire/CDI/CDD/Stagiaire)."""
    if valeur is None or (isinstance(valeur, float) and pd.isna(valeur)):
        return "Titulaire"
    s = str(valeur).strip().lower()
    if not s:
        return "Titulaire"
    if "stagiaire" in s:
        return "Stagiaire"
    if "titulaire" in s:
        return "Titulaire"
    # Statutaires permanents (militaires, marins PB, OPA, EMA) -> assimilés titulaires
    if any(k in s for k in ["militaire", "marin", "opa", "ema", "phares et balises"]):
        return "Titulaire"
    # Contractuels : distinguer CDD (précaire) vs CDI
    if any(k in s for k in ["remplacement", "occasionnel", "vacant", "incomplet", "projet", "saisonnier"]):
        return "CDD"
    if "contr" in s or "ant" in s or "rin" in s or "contractuel" in s:
        return "CDI"
    return "Titulaire"


def mapper_niveau(grade3: Any) -> str:
    """Catégorie A/B/C -> niveau de responsabilité (continuité avec l'ancien jeu)."""
    if grade3 is None or (isinstance(grade3, float) and pd.isna(grade3)):
        return "Opérationnel"
    v = str(grade3).strip().upper()
    if v == "A":
        return "Direction"
    if v == "B":
        return "Encadrement"
    if v == "C":
        return "Opérationnel"
    return "Opérationnel"


def normaliser_service(valeur: Any) -> str:
    """Harmonise le libellé service (Niveau 03) pour rester compatible avec
    la liste DIRM_MEDITERANEE_SERVICES de l'app (DIRM MED, DDTM 34, DMLC CORSE...)."""
    if valeur is None or (isinstance(valeur, float) and pd.isna(valeur)):
        return "Non défini"
    service = str(valeur).strip()
    if not service:
        return "Non défini"

    m = re.match(r"^(DDTM|DDT|DIRM|DM|SAM|DGTM|DML|DMLC)\s*[-_/]?\s*(\d{1,2})$", service.upper())
    if m:
        service = f"{m.group(1)} {m.group(2).zfill(2)}"

    s = service.upper()
    if s in ["DIRM MED", "DIRM MÉD", "DIRM MEDITERRANEE", "DIRM MÉDITERRANÉE", "DIRM MEDITERRANÉE"]:
        return "DIRM MED"
    if s == "DMSOI":
        return "DM SOI"
    if s.startswith("DML "):
        return "DMLC " + service[4:].strip()
    if s == "DML CORSE":
        return "DMLC CORSE"
    return service


# Table PASA officielle (sous-actions du programme 217-11) fournie par la DIRM.
SOUS_ACTIONS_217 = {
    "0217-11-02": "Emplois et formations maritimes",
    "0217-11-03": "Flotte de commerce et sécurité des navires",
    "0217-11-04": "Contrôle des activités en mer (DCS, environnement et cultures marines)",
    "0217-11-05": "Soutien et systèmes d'information",
    "0217-11-07": "Pêche et aquaculture",
    "0217-11-08": "Planification et plaisance",
    "0217-11-11": "CROSS",
    "0217-11-13": "Phares et Balises (dont POLMAR)",
    "0217-11-16": "Capitaineries",
}

# Anciennes missions (programmes 0205 / 0203 / 0113) conservées si présentes.
MISSIONS_AUTRES = {
    "0205": "Contrôle et surveillance maritime",
    "0205-01": "Contrôle et surveillance maritime - Opérations",
    "0205-02": "Contrôle et surveillance maritime - Coordination",
    "0205-03": "Contrôle et surveillance maritime - Appui",
    "0205-04": "Contrôle et surveillance maritime - Surveillance côtière",
    "0205-05": "Contrôle et surveillance maritime - Appui technique",
    "0205-07": "Contrôle et surveillance maritime - Autre",
    "0205-08": "Contrôle et surveillance maritime - Spécialisé",
    "0203": "Police des pêches",
    "0203-11": "Police des pêches - Contrôle",
    "0203-14": "Police des pêches - Surveillance",
    "0203-43": "Police des pêches - Spécialisé",
    "0113-07": "Affaires maritimes",
}


def _code_str(v: Any) -> str:
    if v is None or (isinstance(v, float) and pd.isna(v)):
        return ""
    return str(v).strip()


def code_pasa(sous_action: Any, action: Any) -> str:
    """Code de classification le plus précis : sous-action si dispo, sinon action."""
    sous = _code_str(sous_action)
    if sous and sous not in ("0217-11", "0217"):
        return sous
    return _code_str(action) or sous


def nom_mission(sous_action: Any, action: Any) -> str:
    """Nom de mission lisible, basé en priorité sur la SOUS-ACTION (table PASA)."""
    code = code_pasa(sous_action, action)
    if not code:
        return "Non définie"
    if code in SOUS_ACTIONS_217:
        return SOUS_ACTIONS_217[code]
    if code in MISSIONS_AUTRES:
        return MISSIONS_AUTRES[code]
    if code.startswith("0205"):
        return f"Contrôle et surveillance maritime - {code}"
    if code.startswith("0203"):
        return f"Police des pêches - {code}"
    if code in ("0217-11", "0217"):
        return "Soutien et pilotage (programme 217)"
    if code.startswith("0113") or code.startswith("113"):
        return f"Affaires maritimes - {code}"
    return f"Mission {code}"


def mapper_pasa(sous_action: Any, action: Any) -> dict[str, Optional[str]]:
    """Déduit pasaCode / pasaLibelle / segment à partir de la sous-action (table officielle)."""
    code = code_pasa(sous_action, action)
    if code in SOUS_ACTIONS_217:
        libelle = SOUS_ACTIONS_217[code]
        # pasaCode au format 217-11-XX (sans le 0 initial du programme)
        pasa_code = code[1:] if code.startswith("0217-11-") else code
        return {
            "pasaCode": pasa_code,
            "pasaLibelle": f"{pasa_code} {libelle}",
            "pasaSegment": libelle,
            "pasaSousSegment": code,
        }
    if code.startswith("0205") or code.startswith("0203"):
        return {"pasaCode": "217-11-04", "pasaLibelle": "217-11-04 Contrôle des activités en mer (DCS, environnement et cultures marines)", "pasaSegment": "Contrôle des activités en mer", "pasaSousSegment": code}
    if code in ("0113-07",):
        return {"pasaCode": "217-11-03", "pasaLibelle": "217-11-03 Flotte de commerce et sécurité des navires", "pasaSegment": "Flotte de commerce", "pasaSousSegment": code}
    # Programme 217 sans sous-action détaillée -> soutien
    return {"pasaCode": "217-11-05", "pasaLibelle": "217-11-05 Soutien et systèmes d'information", "pasaSegment": "Soutien et systèmes d'information", "pasaSousSegment": code or None}


def categoriser_fonction(poste: Optional[str]) -> Optional[str]:
    if not poste:
        return None
    up = str(poste).strip().upper()
    if not up:
        return None
    if any(k in up for k in ["DIRECT", "CHEF", "RESPONS", "COORDIN", "ENCAD", "ADJOINT"]):
        return "Encadrement"
    if any(k in up for k in ["CONTROLE", "CONTRÔLE", "SURVEILL", "POLICE", "INSPECT", "PECHE", "PÊCHE"]):
        return "Contrôle/Surveillance"
    if any(k in up for k in ["CROSS", "SAUVET", "SECOURS", "SAR", "MRCC"]):
        return "Sauvetage/Secours"
    if any(k in up for k in ["SI ", "INFORMAT", "RESEAU", "RÉSEAU", "CYBER", "DATA", "NUMERIQUE", "NUMÉRIQUE"]):
        return "Systèmes d'information"
    if any(k in up for k in ["ENVIRON", "POLLUTION", "BIODIVERS", "NATURA"]):
        return "Environnement"
    if any(k in up for k in ["PORT", "CAPITAIN", "QUAI"]):
        return "Portuaire"
    if any(k in up for k in ["BALIS", "PHARES", "NAVIGATION"]):
        return "Navigation"
    if any(k in up for k in ["JURIDI", "CONTENTIEUX", "REGLEMENT", "RÉGLEMENT"]):
        return "Juridique"
    if any(k in up for k in ["FORMATION", "ENSEIGN", "PEDAGOG", "PÉDAGOG"]):
        return "Formation"
    if any(k in up for k in ["TECHNI", "MAINTEN", "MECANI", "MÉCANI"]):
        return "Technique/Maintenance"
    if any(k in up for k in ["ADMIN", "SECRET", "RH", "RESSOURCES", "FINANC", "BUDGET", "COMPTA", "ACHAT", "MARCHE", "GESTION"]):
        return "Administratif/RH/Finances"
    if any(k in up for k in ["LOGIST", "APPRO", "STOCK", "MAGASIN", "FLOTTE"]):
        return "Logistique"
    return "Autre"


def val(row: pd.Series, key: str) -> Any:
    col = COL.get(key)
    if col is None or col not in row.index:
        return None
    v = row[col]
    if isinstance(v, float) and pd.isna(v):
        return None
    return v


def to_float(v: Any) -> Optional[float]:
    if v is None or (isinstance(v, float) and pd.isna(v)):
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


# ---------------------------------------------------------------------------
# Conversion principale
# ---------------------------------------------------------------------------

def convertir(chemin_excel: Path) -> dict[str, Any]:
    print(f"📖 Lecture : {chemin_excel.name} (feuille « {SHEET_NAME} »)")
    df = pd.read_excel(chemin_excel, sheet_name=SHEET_NAME, header=HEADER_ROW)
    df = df.dropna(how="all").dropna(axis=1, how="all")
    print(f"   Lignes brutes : {len(df)}")

    if COL["matricule"] not in df.columns:
        raise SystemExit(f"❌ Colonne matricule absente ({COL['matricule']!r}). Colonnes: {list(df.columns)}")

    # Mois global le plus récent (pour déterminer 'actif')
    mois_series = pd.to_numeric(df[COL["mois"]], errors="coerce")
    mois_global_max = int(mois_series.max()) if mois_series.notna().any() else None
    print(f"   Dernier mois observé (global) : {mois_global_max}")

    agents: list[dict[str, Any]] = []
    nb_h = nb_f = nb_naiss = 0

    for matricule, grp in df.groupby(COL["matricule"], sort=False):
        grp = grp.copy()
        grp["_mois"] = pd.to_numeric(grp[COL["mois"]], errors="coerce")
        dernier_mois = grp["_mois"].max()
        if pd.isna(dernier_mois):
            dernier_mois_rows = grp
            dernier_mois = None
        else:
            dernier_mois_rows = grp[grp["_mois"] == dernier_mois]

        # Ligne principale = répartition avec le plus gros ETPT au dernier mois
        dernier_mois_rows = dernier_mois_rows.copy()
        dernier_mois_rows["_etpt"] = pd.to_numeric(dernier_mois_rows[COL["etpt"]], errors="coerce")
        principal = dernier_mois_rows.sort_values("_etpt", ascending=False, na_position="last").iloc[0]

        # ETP : somme des répartitions du dernier mois, plafonnée à 1.0.
        # L'ETPT du dernier mois reflète le temps réellement travaillé (= quotité).
        # 0 => agent non en service effectif au dernier mois (départ / dispo / congé long).
        etp_sum = dernier_mois_rows["_etpt"].sum(skipna=True)
        if pd.isna(etp_sum) or etp_sum <= 0:
            etp = 0.0
        else:
            etp = round(min(1.0, float(etp_sum)), 4)

        # Temps de travail déduit de l'ETPT (donnée réelle => tempsTravailRenseigne=True)
        if etp <= 0:
            contrat_type = "Temps plein"
            tp_pct: Optional[int] = None
            tt_renseigne = False
        elif etp >= 0.99:
            contrat_type = "Temps plein"
            tp_pct = None
            tt_renseigne = True
        else:
            contrat_type = "Temps partiel"
            tp_pct = int(round(etp * 100))
            tt_renseigne = True

        nir = val(principal, "nir")
        genre = genre_depuis_nir(nir)
        if genre == "H":
            nb_h += 1
        elif genre == "F":
            nb_f += 1
        naissance = naissance_depuis_nir(nir)
        if naissance:
            nb_naiss += 1

        actif = (mois_global_max is not None and dernier_mois is not None
                 and int(dernier_mois) == mois_global_max and etp > 0)

        nom = val(principal, "nom_usage") or val(principal, "nom_naissance") or ""
        prenom = val(principal, "prenom") or ""
        action = val(principal, "action")
        sous_action = val(principal, "sous_action")
        poste_libelle = val(principal, "poste_libelle")
        grade14 = val(principal, "grade14")

        agent: dict[str, Any] = {
            "id": str(matricule),
            "nom": str(nom).strip(),
            "prenom": str(prenom).strip(),
            "dateNaissance": naissance or "1970-01-01",
            "genre": genre,
            "statut": mapper_statut(val(principal, "statut")),
            "contratType": contrat_type,
            "tempsPartielPourcentage": tp_pct,
            "tempsTravailRenseigne": tt_renseigne,
            "region": (str(val(principal, "region_uo")).strip() if val(principal, "region_uo") else "Non définie"),
            "service": normaliser_service(val(principal, "niveau03")),
            "mission": nom_mission(sous_action, action),
            "metier": (str(grade14).strip() if grade14 else (str(poste_libelle).strip() if poste_libelle else "Non défini")),
            "niveauResponsabilite": mapper_niveau(val(principal, "grade3")),
            "poste": (str(poste_libelle).strip() if poste_libelle else "Non défini"),
            "dateEmbauche": normaliser_date(val(principal, "date_affectation")),
            "etp": etp,
            "enConges": False,
            "enFormation": False,
            "enArretMaladie": False,
            "actif": bool(actif),
            "dateMaj": datetime.now().strftime("%Y-%m-%d"),
        }

        unite = val(principal, "niveau06")
        if unite and str(unite).strip():
            agent["uniteService"] = str(unite).strip()

        code_mission = code_pasa(sous_action, action)
        if code_mission:
            agent["missionCode"] = code_mission
        if grade14:
            agent["corps"] = str(grade14).strip()
        if poste_libelle:
            agent["fonctionExercee"] = str(poste_libelle).strip()
            cat = categoriser_fonction(agent["fonctionExercee"])
            if cat:
                agent["fonctionCategorie"] = cat

        pasa = mapper_pasa(sous_action, action)
        for k, v in pasa.items():
            if v:
                agent[k] = v

        agents.append(agent)

    print(f"   ✅ {len(agents)} agents uniques")
    print(f"      Genre : {nb_h} H / {nb_f} F / {len(agents) - nb_h - nb_f} autre")
    print(f"      Dates de naissance déduites du NIR : {nb_naiss}/{len(agents)}")
    nb_actifs = sum(1 for a in agents if a["actif"])
    nb_inactifs = len(agents) - nb_actifs
    nb_tp = sum(1 for a in agents if a["actif"] and a["contratType"] == "Temps partiel")
    nb_pl = sum(1 for a in agents if a["actif"] and a["contratType"] == "Temps plein")
    print(f"      Actifs (ETPT>0 au dernier mois) : {nb_actifs}  |  inactifs (ETPT=0) : {nb_inactifs}")
    print(f"      Parmi actifs : {nb_pl} temps plein / {nb_tp} temps partiel")

    return {
        "agents": agents,
        "capacites": {
            "missions": [
                {"mission": "Contrôle et surveillance", "capaciteMaximale": 95},
                {"mission": "Police des pêches", "capaciteMaximale": 60},
                {"mission": "Sauvetage en mer", "capaciteMaximale": 48},
                {"mission": "Protection environnement", "capaciteMaximale": 42},
                {"mission": "Gestion portuaire", "capaciteMaximale": 35},
                {"mission": "Formation maritime", "capaciteMaximale": 32},
                {"mission": "Affaires maritimes", "capaciteMaximale": 35},
                {"mission": "Support administratif", "capaciteMaximale": 28},
            ],
            "regions": [
                {"region": "Marseille", "capaciteMaximale": 150, "coordonnees": {"x": 83, "y": 81}},
                {"region": "Nice", "capaciteMaximale": 85, "coordonnees": {"x": 94, "y": 76}},
                {"region": "Toulon", "capaciteMaximale": 92, "coordonnees": {"x": 88, "y": 83}},
                {"region": "Sète", "capaciteMaximale": 48, "coordonnees": {"x": 66, "y": 80}},
            ],
        },
        "metadonnees": {
            "dateExport": datetime.now().strftime("%Y-%m-%d"),
            "version": "2.0",
            "source": chemin_excel.name,
        },
    }


def main() -> None:
    base = Path(__file__).parent.parent
    args = [a for a in sys.argv[1:] if str(a).lower().endswith(".xlsx")]
    if args:
        chemin = Path(args[0])
    else:
        chemin = base / "trdata" / "Suivi_des_emplois_en_ETPT_RPROG (23).xlsx"
    if not chemin.exists():
        raise SystemExit(f"❌ Fichier introuvable : {chemin}")

    data = convertir(chemin)

    sortie_src = base / "src" / "data" / "agents.json"
    sortie_public = base / "public" / "data" / "agents.json"
    sortie_src.parent.mkdir(parents=True, exist_ok=True)
    sortie_public.parent.mkdir(parents=True, exist_ok=True)

    for cible in (sortie_src, sortie_public):
        with open(cible, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False, default=str)
        print(f"💾 Écrit : {cible}")


if __name__ == "__main__":
    main()
