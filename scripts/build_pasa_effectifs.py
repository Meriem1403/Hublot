#!/usr/bin/env python3
"""
Extrait les effectifs PASA 2 / 7 / 8 depuis l'export RenoiRH ETPT_RPROG
(feuille « Données annuelles ») vers public/data/pasa-effectifs.json.

Usage :
  python3 scripts/build_pasa_effectifs.py
  python3 scripts/build_pasa_effectifs.py trdata/2026_03_Suivi_des_emplois_en_ETPT_RPROG.xlsx
"""

from __future__ import annotations

import json
import sys
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

import openpyxl

SHEET_NAME = "Données annuelles"
HEADER_ROW = 5

COL = {
    "matricule": "Etat Civil : Matricule SIRH",
    "mois": "Mois observation (synth annee)",
    "niveau03": "Niveau 03 Opé. : Libellé Court",
    "niveau06": "Niveau 06 Opé. : Libellé Court",
    "niveau08": "Niveau 08 Opé. : Libellé Court",
    "poste": "ETPT RH : Poste Libellé long",
    "sous_action": "ETPT RH : Sous-Action",
    "etpt": "ETPT RH",
}

PASA_CODES = {
    "pasa2": "0217-11-02",
    "pasa7": "0217-11-07",
    "pasa8": "0217-11-08",
}

LABELS = {
    "lpm": "Lycées professionnels maritimes (LPM)",
    "services_formation": "Services formation (DIRM)",
    "services_instructions": "Services instructions / permis (DDTM)",
    "ssgm": "Services de santé des gens de mer (SSGM)",
    "planification": "Planification (DIRM)",
    "plaisance": "Plaisance (DDTM)",
    "peche": "Pêche",
    "aquaculture": "Aquaculture",
    "autres": "Autres / non classés",
}


def _txt(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip()


def _float(value: Any) -> float:
    try:
        if value is None or value == "":
            return 0.0
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def is_dirm(service: str) -> bool:
    s = service.upper()
    return s.startswith("DIRM") or s == "ESP MER"


def is_ddtm(service: str) -> bool:
    s = service.upper()
    return s.startswith("DDTM") or s.startswith("DML")


def contains_any(text: str, needles: tuple[str, ...]) -> bool:
    up = text.upper()
    return any(n in up for n in needles)


def categorize_pasa2(n03: str, n06: str, n08: str) -> str:
    if contains_any(n06, ("LPM",)) or contains_any(n08, ("LPM",)):
        return "lpm"
    if contains_any(n06, ("SSGM",)) or contains_any(n08, ("SSGM",)):
        return "ssgm"
    if is_dirm(n03):
        return "services_formation"
    if is_ddtm(n03):
        return "services_instructions"
    return "autres"


def categorize_pasa8(n03: str) -> str:
    if is_dirm(n03):
        return "planification"
    if is_ddtm(n03):
        return "plaisance"
    return "autres"


def categorize_pasa7(poste: str, n06: str, n08: str) -> str:
    text = " ".join([poste, n06, n08])
    if contains_any(
        text,
        ("AQUACULTURE", "AQUA", "CULTURES MARINES", "CULTURE MARINE", "BAQUA"),
    ):
        return "aquaculture"
    if contains_any(
        text,
        ("PÊCHE", "PECHE", "PECHERIE", "/BEP", "/BGR", "/BASD", "/BAEI", "PECH "),
    ):
        return "peche"
    return "autres"


def load_rows(chemin: Path) -> tuple[list[dict[str, Any]], int, Optional[int]]:
    wb = openpyxl.load_workbook(chemin, read_only=True, data_only=True)
    if SHEET_NAME not in wb.sheetnames:
        raise SystemExit(f"Feuille « {SHEET_NAME} » absente. Feuilles : {wb.sheetnames}")

    ws = wb[SHEET_NAME]
    rows = list(ws.iter_rows(values_only=True))
    header = rows[HEADER_ROW - 1]
    col_idx = {h: i for i, h in enumerate(header) if h}

    for key, name in COL.items():
        if name not in col_idx:
            raise SystemExit(f"Colonne absente ({name!r}). Colonnes : {[h for h in header if h]}")

    def get(row: tuple[Any, ...], key: str) -> Any:
        idx = col_idx[COL[key]]
        return row[idx] if idx < len(row) else None

    parsed: list[dict[str, Any]] = []
    mois_values: list[int] = []

    for row in rows[HEADER_ROW:]:
        matricule = get(row, "matricule")
        if matricule is None:
            continue
        mois_raw = get(row, "mois")
        try:
            mois = int(float(mois_raw)) if mois_raw is not None else None
        except (TypeError, ValueError):
            mois = None
        if mois is not None:
            mois_values.append(mois)

        parsed.append(
            {
                "matricule": str(matricule).strip(),
                "mois": mois,
                "niveau03": _txt(get(row, "niveau03")),
                "niveau06": _txt(get(row, "niveau06")),
                "niveau08": _txt(get(row, "niveau08")),
                "poste": _txt(get(row, "poste")),
                "sous_action": _txt(get(row, "sous_action")),
                "etpt": _float(get(row, "etpt")),
            }
        )

    mois_ref = max(mois_values) if mois_values else None
    return parsed, len(parsed), mois_ref


def aggregate(rows: list[dict[str, Any]], mois_ref: Optional[int], pasa_key: str) -> dict[str, Any]:
    code = PASA_CODES[pasa_key]
    filtered = [
        r
        for r in rows
        if r["sous_action"].startswith(code) and (mois_ref is None or r["mois"] == mois_ref)
    ]

    effectifs: dict[str, set[str]] = defaultdict(set)
    etpt: dict[str, float] = defaultdict(float)
    details: dict[str, dict[str, dict[str, float]]] = defaultdict(
        lambda: defaultdict(lambda: {"effectif": 0.0, "etpt": 0.0})
    )

    categorize = {
        "pasa2": lambda r: categorize_pasa2(r["niveau03"], r["niveau06"], r["niveau08"]),
        "pasa7": lambda r: categorize_pasa7(r["poste"], r["niveau06"], r["niveau08"]),
        "pasa8": lambda r: categorize_pasa8(r["niveau03"]),
    }[pasa_key]

    for row in filtered:
        if row["etpt"] <= 0:
            continue
        cat = categorize(row)
        effectifs[cat].add(row["matricule"])
        etpt[cat] += row["etpt"]
        svc = row["niveau03"] or "Non renseigné"
        details[cat][svc]["effectif"] += 1
        details[cat][svc]["etpt"] += row["etpt"]

    order = {
        "pasa2": ("lpm", "services_formation", "services_instructions", "ssgm", "autres"),
        "pasa7": ("peche", "aquaculture", "autres"),
        "pasa8": ("planification", "plaisance", "autres"),
    }[pasa_key]

    categories = []
    for key in order:
        categories.append(
            {
                "id": key,
                "label": LABELS[key],
                "effectif": len(effectifs.get(key, set())),
                "etpt": round(etpt.get(key, 0.0), 2),
                "detailsParService": sorted(
                    [
                        {
                            "service": service,
                            "effectif": int(values["effectif"]),
                            "etpt": round(values["etpt"], 2),
                        }
                        for service, values in details.get(key, {}).items()
                    ],
                    key=lambda x: (-x["etpt"], x["service"]),
                ),
            }
        )

    total_effectif = len({r["matricule"] for r in filtered if r["etpt"] > 0})
    total_etpt = round(sum(r["etpt"] for r in filtered if r["etpt"] > 0), 2)

    titles = {
        "pasa2": "PASA 2 — Emplois et formations maritimes",
        "pasa7": "PASA 7 — Pêche et aquaculture",
        "pasa8": "PASA 8 — Planification et plaisance",
    }

    return {
        "id": pasa_key,
        "code": PASA_CODES[pasa_key].replace("0217-11-", "217-11-"),
        "title": titles[pasa_key],
        "lignesAnalysees": len(filtered),
        "totalEffectif": total_effectif,
        "totalEtpt": total_etpt,
        "categories": categories,
    }


def build(chemin: Path) -> dict[str, Any]:
    rows, nb_brut, mois_ref = load_rows(chemin)
    return {
        "metadonnees": {
            "dateExport": datetime.now().strftime("%Y-%m-%d"),
            "source": chemin.name,
            "feuille": SHEET_NAME,
            "moisReference": mois_ref,
            "lignesBrutes": nb_brut,
            "description": "Effectifs PASA dérivés indépendamment de agents.json",
        },
        "actions": [
            aggregate(rows, mois_ref, "pasa2"),
            aggregate(rows, mois_ref, "pasa8"),
            aggregate(rows, mois_ref, "pasa7"),
        ],
    }


def main() -> None:
    base = Path(__file__).parent.parent
    args = [a for a in sys.argv[1:] if str(a).lower().endswith(".xlsx")]
    chemin = Path(args[0]) if args else base / "trdata" / "2026_03_Suivi_des_emplois_en_ETPT_RPROG.xlsx"
    if not chemin.exists():
        raise SystemExit(f"Fichier introuvable : {chemin}")

    data = build(chemin)
    for out in (
        base / "public" / "data" / "pasa-effectifs.json",
        base / "src" / "data" / "pasa-effectifs.json",
    ):
        out.parent.mkdir(parents=True, exist_ok=True)
        with open(out, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"Écrit : {out}")

    for action in data["actions"]:
        print(f"\n{action['title']} (mois {data['metadonnees']['moisReference']})")
        for cat in action["categories"]:
            if cat["effectif"] or cat["etpt"]:
                print(f"  - {cat['label']}: {cat['effectif']} agents, {cat['etpt']} ETPT")


if __name__ == "__main__":
    main()
