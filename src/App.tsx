import { useState, useEffect } from 'react';
import { Users, TrendingUp, AlertTriangle, MapPin, LogOut, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { OverviewCards } from './components/OverviewCards';
import { MissionChart } from './components/MissionChart';
import { RegionMap } from './components/RegionMap';
import { ServiceTreemap } from './components/ServiceTreemap';
import { StatusDonut } from './components/StatusDonut';
import { ContractChart } from './components/ContractChart';
import { ResponsibilityPyramid } from './components/ResponsibilityPyramid';
import { JobsChart } from './components/JobsChart';
import { AgeChart } from './components/AgeChart';
import { GenderDonut } from './components/GenderDonut';
import { WorkTimeGauge } from './components/WorkTimeGauge';
import { DynamicView } from './components/DynamicView';
import { LoginPage } from './components/LoginPage';
import { isAuthenticated, clearSession, getUsername } from './utils/security';
import { GlobalFilterProvider, useGlobalFilterContext } from './contexts/GlobalFilterContext';
import { useFilterOptions } from './hooks/useAgentsData';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    try {
      setIsLoggedIn(isAuthenticated());
    } catch {
      setIsLoggedIn(false);
    }
  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      clearSession();
      setIsLoggedIn(false);
    }
  };

  // Afficher la page de connexion si non connecté
  if (!isLoggedIn) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const username = getUsername();

  return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <GlobalFilterProvider>
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                <Users className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl">Hublot</h1>
                <p className="text-blue-200 mt-1">Direction générale des Affaires maritimes, de la Pêche et de l'Aquaculture – Tableau de bord des effectifs et statistiques RH</p>
              </div>
            </div>
            {/* Session : utilisateur + déconnexion */}
            {username && (
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-sm text-white/90 truncate max-w-[120px] sm:max-w-[180px]" title={username}>
                  {username}
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition-colors flex items-center gap-2 shrink-0"
                  title="Se déconnecter"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Déconnexion</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto py-2 scrollbar-visible">
            {[
              { id: 'overview', label: 'Vue d\'ensemble', icon: Users },
              { id: 'missions', label: 'Par mission', icon: TrendingUp },
              { id: 'regions', label: 'Par région', icon: MapPin },
              { id: 'services', label: 'Par service', icon: AlertTriangle },
              { id: 'status', label: 'Statuts', icon: Users },
              { id: 'contracts', label: 'Contrats', icon: Users },
              { id: 'responsibility', label: 'Responsabilités', icon: Users },
              { id: 'jobs', label: 'Métiers', icon: Users },
              { id: 'age', label: 'Âges', icon: Users },
              { id: 'gender', label: 'Parité H/F', icon: Users },
              { id: 'worktime', label: 'Temps de travail', icon: Users },
              { id: 'dynamic', label: 'Vue dynamique', icon: TrendingUp }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab(tab.id);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-blue-900 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Filtres globaux (tous les onglets) — Service inclut DIRM Méditerranée */}
      <GlobalFilterBar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" key={activeTab}>
        {activeTab === 'overview' && <OverviewCards />}
        {activeTab === 'missions' && <MissionChart />}
        {activeTab === 'regions' && <RegionMap />}
        {activeTab === 'services' && <ServiceTreemap />}
        {activeTab === 'status' && <StatusDonut />}
        {activeTab === 'contracts' && <ContractChart />}
        {activeTab === 'responsibility' && <ResponsibilityPyramid />}
        {activeTab === 'jobs' && <JobsChart />}
        {activeTab === 'age' && <AgeChart />}
        {activeTab === 'gender' && <GenderDonut />}
        {activeTab === 'worktime' && <WorkTimeGauge />}
        {activeTab === 'dynamic' && <DynamicView />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-500 text-sm">
            © 2025 DIRM Méditerranée - Ministère de la Mer
          </p>
        </div>
      </footer>
      </GlobalFilterProvider>
      </div>
  );
}

function GlobalFilterBar() {
  const ctx = useGlobalFilterContext();
  const { regions, services, statuts, pasas, corps, fonctions } = useFilterOptions();
  if (!ctx) return null;
  const { filters, setRegion, setService, setStatut, setPasa, setCorps, setFonction, resetFilters } = ctx;
  const advancedActive = filters.pasa !== 'all' || filters.corps !== 'all' || filters.fonction !== 'all';
  const [showAdvanced, setShowAdvanced] = useState<boolean>(advancedActive);
  const hasFilter =
    filters.region !== 'all' ||
    filters.service !== 'all' ||
    filters.statut !== 'all' ||
    filters.pasa !== 'all' ||
    filters.corps !== 'all' ||
    filters.fonction !== 'all';
  return (
    <div className="bg-white/80 backdrop-blur border-b border-gray-200 sticky top-[52px] z-[9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filtres</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-sm text-gray-700 leading-none whitespace-nowrap transition-colors"
              aria-expanded={showAdvanced}
            >
              <span className="leading-none">Filtres avancés</span>
              <span className="flex h-4 w-4 items-center justify-center">
                {showAdvanced ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
              </span>
            </button>
            {hasFilter && (
              <button
                type="button"
                onClick={resetFilters}
                className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                Réinitialiser
              </button>
            )}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="flex items-center pr-3 rounded-lg border border-gray-300 bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
            <select
              value={filters.region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-transparent border-0 outline-none"
              style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}
            >
              <option value="all">Toutes les régions</option>
              {regions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <span className="pointer-events-none flex h-4 w-6 items-center justify-center text-gray-500">
              <ChevronDown className="h-4 w-4 shrink-0" />
            </span>
          </div>
          <div className="flex items-center pr-3 rounded-lg border border-gray-300 bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
            <select
              value={filters.service}
              onChange={(e) => setService(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-transparent border-0 outline-none"
              style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}
            >
              <option value="all">Tous les services</option>
              {services.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <span className="pointer-events-none flex h-4 w-6 items-center justify-center text-gray-500">
              <ChevronDown className="h-4 w-4 shrink-0" />
            </span>
          </div>
          <div className="flex items-center pr-3 rounded-lg border border-gray-300 bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
            <select
              value={filters.statut}
              onChange={(e) => setStatut(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-transparent border-0 outline-none"
              style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}
            >
              <option value="all">Tous les statuts</option>
              {statuts.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <span className="pointer-events-none flex h-4 w-6 items-center justify-center text-gray-500">
              <ChevronDown className="h-4 w-4 shrink-0" />
            </span>
          </div>
        </div>

        {showAdvanced && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="flex items-center pr-3 rounded-lg border border-gray-300 bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
              <select
                value={filters.pasa}
                onChange={(e) => setPasa(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-transparent border-0 outline-none"
                title="Politique publique (PASA)"
                style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}
              >
                <option value="all">Toutes les politiques PASA</option>
                {pasas.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <span className="pointer-events-none flex h-4 w-6 items-center justify-center text-gray-500">
                <ChevronDown className="h-4 w-4 shrink-0" />
              </span>
            </div>
            <div className="flex items-center pr-3 rounded-lg border border-gray-300 bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
              <select
                value={filters.corps}
                onChange={(e) => setCorps(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-transparent border-0 outline-none"
                title="Corps (Grade)"
                style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}
              >
                <option value="all">Tous les corps</option>
                {corps.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <span className="pointer-events-none flex h-4 w-6 items-center justify-center text-gray-500">
                <ChevronDown className="h-4 w-4 shrink-0" />
              </span>
            </div>
            <div className="flex items-center pr-3 rounded-lg border border-gray-300 bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
              <select
                value={filters.fonction}
                onChange={(e) => setFonction(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-transparent border-0 outline-none"
                title="Fonction exercée (Poste)"
                style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}
              >
                <option value="all">Toutes les fonctions</option>
                {fonctions.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
              <span className="pointer-events-none flex h-4 w-6 items-center justify-center text-gray-500">
                <ChevronDown className="h-4 w-4 shrink-0" />
              </span>
            </div>
          </div>
        )}

        {advancedActive && !showAdvanced && (
          <p className="mt-2 text-xs text-gray-500">
            Des filtres avancés sont actifs (PASA/Corps/Fonctions).
          </p>
        )}
      </div>
    </div>
  );
}