export interface PasaCategoryDetail {
  service: string;
  effectif: number;
  etpt: number;
}

export interface PasaPosteDetail {
  poste: string;
  service: string;
  effectif: number;
  etpt: number;
}

export interface PasaCategory {
  id: string;
  label: string;
  effectif: number;
  etpt: number;
  detailsParService: PasaCategoryDetail[];
  detailsParPoste: PasaPosteDetail[];
}

export interface PasaActionEffectifs {
  id: string;
  code: string;
  title: string;
  lignesAnalysees: number;
  totalEffectif: number;
  totalEtpt: number;
  categories: PasaCategory[];
}

export interface PasaEffectifsData {
  metadonnees: {
    dateExport: string;
    source: string;
    feuille: string;
    moisReference: number | null;
    lignesBrutes: number;
    description: string;
  };
  actions: PasaActionEffectifs[];
}
