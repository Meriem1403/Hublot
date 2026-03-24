import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useFilteredAgents, useUniqueValues } from '../hooks/useAgentsData';
import { DIRM_MEDITERANEE_LABEL } from '../services/dataService';
import { calculerAge, getTrancheAge, calculerRepartitionAge } from '../utils/dataCalculations';
import type { Agent } from '../types/data';
import ExcelJS from 'exceljs';
import { MethodologyDialog } from './MethodologyDialog';

export function DynamicView() {
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedService, setSelectedService] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [rowsToShow, setRowsToShow] = useState<number>(20);
  
  const uniqueValues = useUniqueValues();
  
  // Filtrer les agents selon les sélections
  const filteredAgents = useFilteredAgents({
    region: selectedRegion !== 'all' ? selectedRegion : undefined,
    service: selectedService !== 'all' ? selectedService : undefined,
    statut: selectedStatus !== 'all' ? selectedStatus : undefined
  });
  
  // Calculer les statistiques filtrées
  const stats = useMemo(() => {
    const agentsActifs = filteredAgents.filter(a => a.actif);
    
    // Répartition par âge
    const byAge = calculerRepartitionAge(agentsActifs);
    
    // Répartition par service
    const services: Record<string, number> = {};
    agentsActifs.forEach(agent => {
      services[agent.service] = (services[agent.service] || 0) + 1;
    });
    const byService = Object.entries(services)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    
    // Totaux
    const hommes = agentsActifs.filter(a => a.genre === 'H').length;
    const femmes = agentsActifs.filter(a => a.genre === 'F').length;
    const ages = agentsActifs.map(a => calculerAge(a.dateNaissance));
    const ageMoyen = ages.length > 0 
      ? ages.reduce((sum, age) => sum + age, 0) / ages.length 
      : 0;
    
    return {
      byAge: byAge.map(item => ({
        tranche: item.tranche,
        count: item.effectif
      })),
      byService,
      totals: {
        effectif: agentsActifs.length,
        hommes,
        femmes,
        ageMoyen: Math.round(ageMoyen * 10) / 10
      }
    };
  }, [filteredAgents]);

  // Fonction pour exporter les données en Excel avec mise en page
  const handleExportData = async () => {
    const agentsActifs = filteredAgents.filter(a => a.actif);
    
    // Créer un nouveau classeur Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Agents');
    
    // Définir les colonnes avec largeurs
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Région', key: 'region', width: 20 },
      { header: 'Service', key: 'service', width: 25 },
      { header: 'Statut', key: 'statut', width: 15 },
      { header: 'Genre', key: 'genre', width: 10 },
      { header: 'Âge', key: 'age', width: 8 },
      { header: 'Date de naissance', key: 'dateNaissance', width: 18 },
      { header: 'Métier', key: 'metier', width: 25 },
      { header: 'Mission', key: 'mission', width: 25 },
      { header: 'Niveau de responsabilité', key: 'niveauResponsabilite', width: 25 },
      { header: 'Contrat type', key: 'contratType', width: 18 },
      { header: 'Date embauche', key: 'dateEmbauche', width: 18 },
      { header: 'Date départ prévue', key: 'dateDepartPrevue', width: 18 }
    ];
    
    // Style pour les en-têtes
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2563EB' } // Bleu
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 25;
    
    // Ajouter les bordures aux en-têtes
    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF1E40AF' } },
        left: { style: 'thin', color: { argb: 'FF1E40AF' } },
        bottom: { style: 'thin', color: { argb: 'FF1E40AF' } },
        right: { style: 'thin', color: { argb: 'FF1E40AF' } }
      };
    });
    
    // Ajouter les données
    agentsActifs.forEach((agent, index) => {
      const age = calculerAge(agent.dateNaissance);
      const row = worksheet.addRow({
        id: agent.id || '',
        region: agent.region || '',
        service: agent.service || '',
        statut: agent.statut || '',
        genre: agent.genre || '',
        age: age,
        dateNaissance: agent.dateNaissance || '',
        metier: agent.metier || '',
        mission: agent.mission || '',
        niveauResponsabilite: agent.niveauResponsabilite || '',
        contratType: agent.contratType || '',
        dateEmbauche: agent.dateEmbauche || '',
        dateDepartPrevue: agent.dateDepartPrevue || ''
      });
      
      // Alternance de couleurs pour les lignes
      if (index % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8F9FA' } // Gris très clair
        };
      }
      
      // Bordures pour toutes les cellules
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
        };
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      });
      
      // Alignement spécifique pour certaines colonnes
      row.getCell('age').alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell('genre').alignment = { vertical: 'middle', horizontal: 'center' };
      
      // Formatage des dates
      if (agent.dateNaissance) {
        const dateNaissanceCell = row.getCell('dateNaissance');
        dateNaissanceCell.numFmt = 'dd/mm/yyyy';
      }
      if (agent.dateEmbauche) {
        const dateEmbaucheCell = row.getCell('dateEmbauche');
        dateEmbaucheCell.numFmt = 'dd/mm/yyyy';
      }
      if (agent.dateDepartPrevue) {
        const dateDepartPrevueCell = row.getCell('dateDepartPrevue');
        dateDepartPrevueCell.numFmt = 'dd/mm/yyyy';
      }
    });
    
    // Ajouter une ligne de résumé en bas
    const summaryRowIndex = agentsActifs.length + 3;
    const summaryRow = worksheet.getRow(summaryRowIndex);
    summaryRow.getCell('region').value = 'Total';
    summaryRow.getCell('region').font = { bold: true };
    summaryRow.getCell('age').value = `Effectif: ${agentsActifs.length} agents`;
    summaryRow.getCell('age').font = { bold: true };
    
    // Ajouter les informations de filtres
    const filterRow = worksheet.getRow(summaryRowIndex + 1);
    const filters = [];
    if (selectedRegion !== 'all') filters.push(`Région: ${selectedRegion}`);
    if (selectedService !== 'all') filters.push(`Service: ${selectedService}`);
    if (selectedStatus !== 'all') filters.push(`Statut: ${selectedStatus}`);
    filterRow.getCell('region').value = filters.length > 0 ? `Filtres appliqués: ${filters.join(', ')}` : 'Aucun filtre';
    filterRow.getCell('region').font = { italic: true, color: { argb: 'FF6B7280' } };
    
    // Nom du fichier avec les filtres appliqués
    const filterNames = [];
    if (selectedRegion !== 'all') filterNames.push(`region-${selectedRegion}`);
    if (selectedService !== 'all') filterNames.push(`service-${selectedService}`);
    if (selectedStatus !== 'all') filterNames.push(`statut-${selectedStatus}`);
    const filename = `agents_${filterNames.length > 0 ? filterNames.join('_') : 'tous'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // Générer le fichier et le télécharger
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl mb-2">Vue dynamique avec filtres</h2>
          <p className="text-gray-600">
            Explorez les données interactivement comme dans Excel sans refaire de tableaux
          </p>
        </div>
        <MethodologyDialog
          title="Méthodologie — Vue dynamique"
          intro="Tous les graphiques sont recalculés en direct selon les filtres sélectionnés."
          sections={[
            {
              title: 'Sources',
              bullets: [
                'Données agents issues de la conversion Excel -> JSON.',
                'Champs région, service, statut, âge, genre, PASA, corps et fonction.'
              ]
            },
            {
              title: 'Calculs affichés',
              bullets: [
                'Filtrage initial puis agrégations (comptages, moyennes d’âge, répartitions).',
                'Les tableaux exportables reprennent strictement les lignes filtrées.',
                'Aucune donnée extrapolée n’est injectée.'
              ]
            }
          ]}
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <h3 className="mb-4">Filtres dynamiques</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-2">Région</label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Toutes les régions</option>
              {uniqueValues.regions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2">Service</label>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les services</option>
              {[
                DIRM_MEDITERANEE_LABEL,
                ...uniqueValues.services.filter((s) => s !== DIRM_MEDITERANEE_LABEL)
              ]
                .sort((a, b) => a.localeCompare(b, 'fr'))
                .map((service) => (
                  <option key={service} value={service}>{service}</option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2">Statut</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les statuts</option>
              {uniqueValues.statuts.map(statut => (
                <option key={statut} value={statut}>
                  {statut === 'Titulaire' ? 'Titulaires' :
                   statut === 'CDI' ? 'Contractuels CDI' :
                   statut === 'CDD' ? 'Contractuels CDD' :
                   'Stagiaires'}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => {
              setSelectedRegion('all');
              setSelectedService('all');
              setSelectedStatus('all');
            }}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors"
          >
            Réinitialiser
          </button>
          <button 
            onClick={handleExportData}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
          >
            Exporter les données
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <p className="text-blue-100 mb-2">Effectif total</p>
          <p className="text-4xl mb-2">{stats.totals.effectif}</p>
          <p className="text-sm text-blue-100">agents sélectionnés</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <p className="text-purple-100 mb-2">Hommes</p>
          <p className="text-4xl mb-2">{stats.totals.hommes}</p>
          <p className="text-sm text-purple-100">
            {Math.round((stats.totals.hommes / stats.totals.effectif) * 100)}% du total
          </p>
        </div>

        <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-6 text-white shadow-lg">
          <p className="text-pink-100 mb-2">Femmes</p>
          <p className="text-4xl mb-2">{stats.totals.femmes}</p>
          <p className="text-sm text-pink-100">
            {Math.round((stats.totals.femmes / stats.totals.effectif) * 100)}% du total
          </p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
          <p className="text-orange-100 mb-2">Âge moyen</p>
          <p className="text-4xl mb-2">{stats.totals.ageMoyen}</p>
          <p className="text-sm text-orange-100">ans</p>
        </div>
      </div>

      {/* Dynamic Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h3 className="mb-4">Répartition par âge (filtrée)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.byAge} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="tranche" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h3 className="mb-4">Répartition par service (filtrée)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.byService} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {stats.byService.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][index]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Data Table Preview */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h3>Aperçu des données ({Math.min(rowsToShow, stats.totals.effectif)} premières lignes)</h3>
          <button
            onClick={() => setRowsToShow(stats.totals.effectif)}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            Voir tout ({stats.totals.effectif} lignes)
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-gray-700">ID</th>
                <th className="px-4 py-3 text-left text-gray-700">Région</th>
                <th className="px-4 py-3 text-left text-gray-700">Service</th>
                <th className="px-4 py-3 text-left text-gray-700">Statut</th>
                <th className="px-4 py-3 text-left text-gray-700">Âge</th>
                <th className="px-4 py-3 text-left text-gray-700">Genre</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAgents.filter(a => a.actif).slice(0, rowsToShow).map((agent) => {
                const age = calculerAge(agent.dateNaissance);
                return (
                  <tr key={agent.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">{agent.id}</td>
                    <td className="px-4 py-3 text-gray-900">{agent.region}</td>
                    <td className="px-4 py-3 text-gray-900">{agent.service}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        agent.statut === 'Titulaire' ? 'bg-blue-100 text-blue-700' :
                        agent.statut === 'CDI' ? 'bg-green-100 text-green-700' :
                        agent.statut === 'CDD' ? 'bg-orange-100 text-orange-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {agent.statut}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-900">{age}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        agent.genre === 'H' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
                      }`}>
                        {agent.genre}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-between items-center text-sm text-gray-600">
          <p>Affichage de {Math.min(rowsToShow, stats.totals.effectif)} sur {stats.totals.effectif} agents</p>
          {stats.totals.effectif > rowsToShow && (
            <div className="flex gap-2">
              <button
                onClick={() =>
                  setRowsToShow((prev) =>
                    Math.min(prev + 50, stats.totals.effectif)
                  )
                }
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
              >
                Voir plus
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Insights */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg mb-3 text-blue-900">💡 Analyses rapides de la sélection</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-white rounded-lg p-4">
            <p className="text-gray-600 mb-1">Service le plus représenté</p>
            <p className="text-xl text-blue-900">
              {stats.byService.length > 0 ? stats.byService[0].name : 'N/A'}
            </p>
            <p className="text-xs text-gray-500">
              {stats.byService.length > 0 && stats.totals.effectif > 0
                ? `${stats.byService[0].count} agents (${Math.round((stats.byService[0].count / stats.totals.effectif) * 1000) / 10}%)`
                : '0 agents'}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-gray-600 mb-1">Tranche d'âge dominante</p>
            <p className="text-xl text-blue-900">
              {stats.byAge.length > 0 ? stats.byAge.reduce((max, item) => item.count > max.count ? item : max, stats.byAge[0]).tranche : 'N/A'}
            </p>
            <p className="text-xs text-gray-500">
              {stats.byAge.length > 0 && stats.totals.effectif > 0
                ? (() => {
                    const maxAge = stats.byAge.reduce((max, item) => item.count > max.count ? item : max, stats.byAge[0]);
                    return `${maxAge.count} agents (${Math.round((maxAge.count / stats.totals.effectif) * 1000) / 10}%)`;
                  })()
                : '0 agents'}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-gray-600 mb-1">Statut majoritaire</p>
            <p className="text-xl text-blue-900">
              {(() => {
                const statuts: Record<string, number> = {};
                filteredAgents.filter(a => a.actif).forEach(a => {
                  statuts[a.statut] = (statuts[a.statut] || 0) + 1;
                });
                const statutMajoritaire = Object.entries(statuts).reduce((max, [statut, count]) => 
                  count > max.count ? { statut, count } : max, 
                  { statut: '', count: 0 }
                );
                return statutMajoritaire.statut || 'N/A';
              })()}
            </p>
            <p className="text-xs text-gray-500">
              {(() => {
                const statuts: Record<string, number> = {};
                filteredAgents.filter(a => a.actif).forEach(a => {
                  statuts[a.statut] = (statuts[a.statut] || 0) + 1;
                });
                const statutMajoritaire = Object.entries(statuts).reduce((max, [statut, count]) => 
                  count > max.count ? { statut, count } : max, 
                  { statut: '', count: 0 }
                );
                return statutMajoritaire.count > 0 && stats.totals.effectif > 0
                  ? `${statutMajoritaire.count} agents (${Math.round((statutMajoritaire.count / stats.totals.effectif) * 1000) / 10}%)`
                  : '0 agents';
              })()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
