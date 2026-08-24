import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { FilterBar } from './components/FilterBar';
import { DashboardGeralView } from './components/DashboardGeralView';
import { DashboardView } from './components/DashboardView';
import { RegistroPerdaView } from './components/RegistroPerdaView';
import { AnaliseCausasView } from './components/AnaliseCausasView';
import { KPIIndividualView } from './components/KPIIndividualView';
import { PlanoAcaoView } from './components/PlanoAcaoView';
import { RevisaoFinanceiraView } from './components/RevisaoFinanceiraView';
import { HistoricoView } from './components/HistoricoView';
import { TrocaProdImproprioView } from './components/TrocaProdImproprioView';
import { ArvoreDecomposicaoView } from './components/ArvoreDecomposicaoView';
import { StandaloneTreeView } from './components/StandaloneTreeView';
import { ConsumoInternoView } from './components/ConsumoInternoView';
import { PerdasPorView } from './components/PerdasPorView';
import { ReposicaoView } from './components/ReposicaoView';

function MainLayout() {
  const { activeTab } = useApp();
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [isStandaloneTree, setIsStandaloneTree] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return params.get('view') === 'arvore' || params.get('view') === 'arvore-decomposicao' || window.location.hash === '#arvore';
  });

  useEffect(() => {
    const checkUrl = () => {
      const params = new URLSearchParams(window.location.search);
      setIsStandaloneTree(
        params.get('view') === 'arvore' ||
        params.get('view') === 'arvore-decomposicao' ||
        window.location.hash === '#arvore'
      );
    };

    window.addEventListener('popstate', checkUrl);
    window.addEventListener('hashchange', checkUrl);
    return () => {
      window.removeEventListener('popstate', checkUrl);
      window.removeEventListener('hashchange', checkUrl);
    };
  }, []);

  if (isStandaloneTree) {
    return <StandaloneTreeView />;
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard-geral':
        return <DashboardGeralView />;
      case 'dashboard':
        return <DashboardView />;
      case 'reposicao':
        return <ReposicaoView />;
      case 'perdas-por':
        return <PerdasPorView />;
      case 'consumo-interno':
        return <ConsumoInternoView />;
      case 'troca-improprio':
        return <TrocaProdImproprioView />;
      case 'arvore-decomposicao':
        return <ArvoreDecomposicaoView />;
      case 'registrar':
        return <RegistroPerdaView />;
      case 'analise':
        return <AnaliseCausasView />;
      case 'scl':
        return <KPIIndividualView kpiKey="scl" />;
      case 'plano-acao':
        return <PlanoAcaoView />;
      case 'revisao':
        return <RevisaoFinanceiraView />;
      case 'historico':
        return <HistoricoView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-amber-500 selection:text-slate-950">
      {/* Sidebar Navigation */}
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />

      {/* Main Content Area */}
      <div className="lg:pl-72 flex flex-col min-h-screen">
        {/* Top Header Bar */}
        <TopBar
          setIsMobileOpen={setIsMobileOpen}
          isFilterOpen={isFilterOpen}
          setIsFilterOpen={setIsFilterOpen}
        />

        {/* Global Filter Drawer/Bar */}
        <FilterBar isOpen={isFilterOpen} setIsOpen={setIsFilterOpen} />

        {/* Dynamic View Container - 100% Full Width Fluid */}
        <main className="flex-1 p-3 sm:p-5 md:p-6 w-full">
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
