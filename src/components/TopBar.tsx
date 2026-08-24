import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MenuItemId } from '../types';
import {
  Menu,
  Filter,
  PlusCircle,
  Calendar,
  X,
  Search,
  HardDrive,
  Save,
  CheckCircle2,
  RefreshCw,
  ChevronDown,
  Download,
} from 'lucide-react';
import { formatMesAno } from '../utils/formatters';
import { PlatformSaveModal } from './PlatformSaveModal';
import { DateRangePickerPopover } from './DateRangePickerPopover';
import { saveAllPlatformDataToServer, downloadPlatformBackup } from '../utils/platformBackup';

interface TopBarProps {
  setIsMobileOpen: (open: boolean) => void;
  isFilterOpen: boolean;
  setIsFilterOpen: (open: boolean) => void;
}

const TAB_TITLES: Record<MenuItemId, { title: string; subtitle: string }> = {
  'dashboard-geral': { title: 'Dashboard Geral Consolidado', subtitle: 'Painel executivo com gráficos integrados de todas as abas do sistema' },
  dashboard: { title: 'Análise Anual de Quebras', subtitle: 'Comparativo Meta 2026 x Real 2026 e Indicadores do Pacote Prejuízo' },
  reposicao: { title: 'Reposição de Bebidas', subtitle: 'Painel analítico de reposições, formatos de embalagem e achados operacionais' },
  'perdas-por': { title: 'Perdas por Mercadoria', subtitle: 'Análise estruturada de perdas, conversor Excel/JSON, Pareto e árvore por mês' },
  'troca-improprio': { title: 'Troca de Produto Impróprio', subtitle: 'Gestão financeira mês a mês de trocas, validades e devoluções do mercado' },
  'arvore-decomposicao': { title: 'Árvore de Decomposição', subtitle: 'Visão expandida e hierárquica por Total → Categoria → Marca → SKU' },
  registrar: { title: 'Registrar Perda de Armazém', subtitle: 'Lançamento de nova ocorrência de avaria ou quebra' },
  analise: { title: 'Análise de Causas & Pareto', subtitle: 'Decomposição de custos por motivo, produto, área e turno' },
  scl: { title: 'SCL - Pacote Prejuízo R$', subtitle: 'Supply Chain Loss - Impacto financeiro total das perdas' },
  'plano-acao': { title: 'Plano de Ação (5W2H)', subtitle: 'Tratamento das causas raiz e acompanhamento dos prazos' },
  revisao: { title: 'Revisão Financeira Mensal', subtitle: 'Ritmo de gestão executiva do Pacote Prejuízo' },
  historico: { title: 'Histórico Operacional', subtitle: 'Consulta e auditoria detalhada dos lançamentos' },
};

export const TopBar: React.FC<TopBarProps> = ({
  setIsMobileOpen,
  isFilterOpen,
  setIsFilterOpen,
}) => {
  const {
    activeTab,
    setActiveTab,
    filtros,
    setFiltros,
    resetFiltros,
    availableMonths,
    perdas,
    acoes,
    kpis,
    comentarios,
    trocasImproprio,
    trocaPlanilhaItens,
    nomeArquivoTroca,
  } = useApp();

  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showSaveOptions, setShowSaveOptions] = useState<boolean>(false);

  // Executa o salvamento direto de 100% da plataforma
  const handleQuickSaveAll = async () => {
    try {
      setIsSaving(true);
      setShowSaveOptions(false);

      const liveData = {
        perdas,
        acoes,
        kpis,
        comentarios,
        trocasImproprio,
        trocaPlanilhaItens,
        nomeArquivoTroca,
      };

      const res = await saveAllPlatformDataToServer(liveData);
      const total = res.stats?.totalRegistrosGerais || (perdas.length + acoes.length + kpis.length);

      setSavedSuccess(true);
      setToastMessage(`✓ Toda a plataforma foi salva com sucesso! ${total.toLocaleString('pt-BR')} registros sincronizados.`);

      setTimeout(() => {
        setSavedSuccess(false);
      }, 3500);

      setTimeout(() => {
        setToastMessage(null);
      }, 4500);
    } catch (err: any) {
      console.error('Erro ao salvar plataforma:', err);
      setToastMessage('Aviso: Erro ao salvar no servidor. Os dados foram salvos no armazenamento local.');
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate active filters count
  const activeFiltersCount = [
    filtros.mes,
    filtros.area,
    filtros.turno,
    filtros.produto,
    filtros.motivo,
    filtros.responsavel,
    filtros.dataInicio,
    filtros.dataFim,
  ].filter(Boolean).length;

  const currentTabInfo = TAB_TITLES[activeTab] || { title: 'Pacote Prejuízo', subtitle: 'AMBEV' };

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 text-slate-100 flex items-center justify-between shadow-sm">
      {/* Toast Notification Flutuante */}
      {toastMessage && (
        <div className="fixed top-18 right-6 z-50 bg-slate-900 border border-emerald-500 text-emerald-300 px-4 py-3 rounded-xl shadow-2xl shadow-emerald-950/80 flex items-center gap-3 animate-in fade-in slide-in-from-top-3 duration-200 text-xs font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-2 p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="lg:hidden p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
          title="Abrir Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-white leading-tight flex items-center gap-2">
            <span>{currentTabInfo.title}</span>
          </h1>
          <p className="text-xs text-slate-400 hidden sm:block">
            {currentTabInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Right: Date Range Popover, Save All Data & Filter Toggle */}
      <div className="flex items-center gap-2">
        {/* Filtro de Período / Atalhos e Calendário (Conforme solicitado) */}
        <DateRangePickerPopover />

        {/* Botão de Salvar Toda a Plataforma com Opções */}
        <div className="relative">
          <div className="flex items-center rounded-lg overflow-hidden border border-emerald-500/50 shadow-sm bg-emerald-500/10 hover:bg-emerald-500/20 transition-all">
            <button
              onClick={handleQuickSaveAll}
              disabled={isSaving}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                savedSuccess
                  ? 'bg-emerald-500 text-slate-950 font-black'
                  : 'text-emerald-300 hover:text-emerald-100'
              }`}
              title="Salvar 100% dos dados de todas as abas da plataforma agora"
            >
              {isSaving ? (
                <RefreshCw className="w-4 h-4 text-emerald-300 animate-spin" />
              ) : savedSuccess ? (
                <CheckCircle2 className="w-4 h-4 text-slate-950" />
              ) : (
                <HardDrive className="w-4 h-4 text-emerald-400" />
              )}
              <span className="hidden sm:inline">
                {isSaving ? 'Salvando...' : savedSuccess ? 'Plataforma Salva!' : 'Salvar Dados'}
              </span>
            </button>

            {/* Dropdown toggle for options */}
            <button
              onClick={() => setShowSaveOptions(!showSaveOptions)}
              className="px-1.5 py-1.5 border-l border-emerald-500/30 text-emerald-400 hover:text-emerald-200 hover:bg-emerald-500/30 transition-colors cursor-pointer"
              title="Opções de Backup e Restauração"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Menu Dropdown de Opções de Salvamento */}
          {showSaveOptions && (
            <div className="absolute right-0 mt-2 w-60 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1.5 z-50 text-xs animate-in fade-in zoom-in-95">
              <button
                onClick={handleQuickSaveAll}
                className="w-full px-3 py-2 text-left text-slate-200 hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold">Salvar Toda a Plataforma</span>
              </button>

              <button
                onClick={() => {
                  setShowSaveOptions(false);
                  setIsSaveModalOpen(true);
                }}
                className="w-full px-3 py-2 text-left text-slate-200 hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
              >
                <HardDrive className="w-4 h-4 text-amber-400" />
                <span>Central de Backup & Restauração</span>
              </button>

              <button
                onClick={async () => {
                  setShowSaveOptions(false);
                  await downloadPlatformBackup({
                    perdas,
                    acoes,
                    kpis,
                    comentarios,
                    trocasImproprio,
                    trocaPlanilhaItens,
                    nomeArquivoTroca,
                  });
                }}
                className="w-full px-3 py-2 text-left text-slate-200 hover:bg-slate-800 flex items-center gap-2 border-t border-slate-800 cursor-pointer"
              >
                <Download className="w-4 h-4 text-sky-400" />
                <span>Baixar Backup JSON (.json)</span>
              </button>
            </div>
          )}
        </div>

        {/* Quick Month Dropdown */}
        <div className="hidden xl:flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/70 rounded-lg px-2.5 py-1.5 text-xs">
          <Calendar className="w-3.5 h-3.5 text-amber-400" />
          <select
            value={filtros.mes}
            onChange={(e) => setFiltros((prev) => ({ ...prev, mes: e.target.value }))}
            className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
          >
            <option value="" className="bg-slate-900 text-slate-200">
              Todos os Meses ({availableMonths.length > 0 ? `${availableMonths.length} períodos` : 'Consolidado'})
            </option>
            {availableMonths.map((m) => (
              <option key={m} value={m} className="bg-slate-900 text-slate-200">
                {formatMesAno(m) || m}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Button */}
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
            isFilterOpen || activeFiltersCount > 0
              ? 'bg-amber-500/15 border-amber-500/50 text-amber-400'
              : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
          }`}
        >
          <Filter className="w-4 h-4" />
          <span className="hidden sm:inline">Filtros</span>
          {activeFiltersCount > 0 && (
            <span className="bg-amber-500 text-slate-950 font-bold rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Modal Global de Salvamento */}
      <PlatformSaveModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
      />
    </header>
  );
};
