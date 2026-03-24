import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { X } from 'lucide-react';
import { useAgentsData } from '../hooks/useAgentsData';
import { useMemo, useState } from 'react';

export function MissionChart() {
  const agents = useAgentsData();

  const [groupBy, setGroupBy] = useState<'mission' | 'pasa' | 'pasaSegment' | 'pasaSousSegment'>('mission');
  const [openInfo, setOpenInfo] = useState(false);

  const title =
    groupBy === 'mission'
      ? 'Effectifs par mission'
      : groupBy === 'pasa'
        ? 'Effectifs par politique publique (PASA)'
        : groupBy === 'pasaSegment'
          ? 'Effectifs par segment (PASA)'
          : 'Effectifs par sous-segment (PASA)';
  const subtitle =
    groupBy === 'mission'
      ? 'Comptage des effectifs par mission (libellé Excel)'
      : 'Répartition des effectifs actifs selon la classification PASA';
  
  // Important : en mode "Mission", on affiche uniquement un comptage réel
  // basé sur le libellé mission dérivé des colonnes Excel Action / Sous-Action / Thématique.
  const missionData = useMemo(() => {
    // Si l'Excel ne fournit pas une information fiable sur "actif",
    // alors on compte sur l'ensemble des agents convertis.
    const hasInactifs = agents.some((a) => a.actif === false);
    const agentsConsidered = hasInactifs ? agents.filter((a) => a.actif) : agents;
    const missionsMap = new Map<string, number>();
    agentsConsidered.forEach((agent) => {
      const missionNom = (agent.mission || '').trim() || 'Mission non définie';
      missionsMap.set(missionNom, (missionsMap.get(missionNom) || 0) + 1);
    });

    return Array.from(missionsMap.entries())
      .map(([mission, effectif]) => ({ label: mission, effectif }))
      .sort((a, b) => b.effectif - a.effectif);
  }, [agents]);

  // Données PASA (effectifs uniquement) : utile pour analyser la politique publique
  const pasaData = useMemo(() => {
    const agentsActifs = agents.filter((a) => a.actif);
    const map = new Map<string, number>();

    const getKey = (a: (typeof agents)[number]) => {
      const code = a.pasaCode || 'Non renseigné';
      const libelle = a.pasaLibelle ? String(a.pasaLibelle).trim() : '';
      const segment = a.pasaSegment ? String(a.pasaSegment).trim() : '';
      const sous = a.pasaSousSegment ? String(a.pasaSousSegment).trim() : '';

      const base = libelle ? `${code} — ${libelle}` : code;
      if (groupBy === 'pasa') return base;
      if (groupBy === 'pasaSegment') return segment ? `${base} / ${segment}` : `${base} / (Segment non renseigné)`;
      return sous
        ? `${base} / ${segment || '(Segment non renseigné)'} / ${sous}`
        : `${base} / ${segment || '(Segment non renseigné)'} / (Sous-segment non renseigné)`;
    };

    agentsActifs.forEach((a) => {
      const k = getKey(a);
      map.set(k, (map.get(k) || 0) + 1);
    });

    return Array.from(map.entries())
      .map(([label, effectif]) => ({ label, effectif }))
      .sort((a, b) => b.effectif - a.effectif);
  }, [agents, groupBy]);

  const palette = ['#1d4ed8', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316', '#64748b'];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl mb-2">{title}</h2>
            <p className="text-gray-600">
              {subtitle}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOpenInfo(true)}
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
            >
              Méthodologie des calculs
            </button>
            <span className="text-sm text-gray-600">Regrouper par</span>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as any)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              title="Regroupement des effectifs"
            >
              <option value="mission">Mission</option>
              <option value="pasa">Politique PASA</option>
              <option value="pasaSegment">Segment PASA</option>
              <option value="pasaSousSegment">Sous-segment PASA</option>
            </select>
          </div>
        </div>
      </div>

      {openInfo && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center"
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpenInfo(false);
          }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpenInfo(false)}
            aria-label="Fermer la fiche méthodologie mission"
          />
          <div className="relative w-[min(920px,calc(100vw-2rem))] max-h-[min(80vh,720px)] overflow-auto bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-2xl text-gray-900">Méthodologie — Par mission</h3>
                <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                  Cette fiche décrit les calculs affichés dans cet onglet et leurs sources Excel.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpenInfo(false)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <h4 className="text-gray-900 font-semibold mb-2">Mode “Mission”</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li><strong>Source Excel :</strong> colonnes <strong>Action</strong>, <strong>Sous-Action</strong>, <strong>Thématique</strong>.</li>
                  <li><strong>Ordonnée :</strong> libellé mission lisible uniquement (sans code).</li>
                  <li><strong>Calcul :</strong> comptage du nombre d’agents par libellé mission.</li>
                  <li><strong>Important :</strong> aucun taux/capacité/postes vacants n’est calculé dans ce mode.</li>
                </ul>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <h4 className="text-gray-900 font-semibold mb-2">Mode “Politique PASA / Segment / Sous-segment”</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li><strong>Source Excel :</strong> colonnes <strong>Action</strong>, <strong>Sous-Action</strong>, <strong>Thématique</strong>.</li>
                  <li><strong>Calcul :</strong> comptage des agents par regroupement PASA sélectionné.</li>
                  <li><strong>Affichage :</strong> barres d’effectifs uniquement (pas de capacité ni taux).</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-900">
                Les filtres globaux (Région, Service, Statut, PASA, Corps, Fonction) s’appliquent avant les regroupements de ce graphique.
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        {groupBy === 'mission' ? (
          <>
            <ResponsiveContainer width="100%" height={Math.max(600, missionData.length * 40)}>
              <BarChart
                data={missionData}
                layout="vertical"
                margin={{ top: 20, right: 30, left: 10, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis
                  type="number"
                  label={{ value: "Nombre d'agents", position: 'insideBottom', offset: -10, style: { textAnchor: 'middle', fontSize: '14px', fontWeight: 'bold' } }}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => value.toLocaleString('fr-FR')}
                  domain={[0, (dataMax: number) => Math.max(dataMax * 1.1, 10)]}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={180}
                  tick={{ fontSize: 10 }}
                  interval={0}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as (typeof missionData)[number];
                      return (
                        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 min-w-[200px]">
                          <p className="mb-3 font-semibold text-gray-900 text-base border-b pb-2">{data.label}</p>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Effectif :</span>
                            <span className="font-bold text-blue-600">{data.effectif.toLocaleString('fr-FR')} agents</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="effectif" name="Effectif" radius={[0, 8, 8, 0]}>
                  {missionData.map((entry, index) => (
                    <Cell key={`mission-cell-${entry.label}`} fill={palette[index % palette.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 text-xs text-gray-500">
              Calcul : comptage des agents par <strong>mission (libellé)</strong> issu des colonnes Excel sources.
            </div>
          </>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={Math.max(600, pasaData.length * 40)}>
              <BarChart
                data={pasaData}
                layout="vertical"
                margin={{ top: 20, right: 30, left: 10, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis
                  type="number"
                  label={{ value: 'Nombre d\'agents', position: 'insideBottom', offset: -10, style: { textAnchor: 'middle', fontSize: '14px', fontWeight: 'bold' } }}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => value.toLocaleString('fr-FR')}
                  domain={[0, (dataMax: number) => Math.max(dataMax * 1.1, 10)]}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={260}
                  tick={{ fontSize: 10 }}
                  interval={0}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as (typeof pasaData)[number];
                      return (
                        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 min-w-[240px]">
                          <p className="mb-2 font-semibold text-gray-900 text-base border-b pb-2">{data.label}</p>
                          <p className="text-blue-600 font-semibold">Effectif: {data.effectif.toLocaleString('fr-FR')} agents</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="effectif" name="Effectif" radius={[0, 8, 8, 0]}>
                  {pasaData.map((entry, index) => (
                    <Cell key={`cell-${entry.label}`} fill={palette[index % palette.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-500 mt-3">
              Source : champs PASA dérivés de <span className="font-semibold">Action / Sous-Action / Thématique</span> (Excel).
            </p>
          </>
        )}
      </div>
    </div>
  );
}