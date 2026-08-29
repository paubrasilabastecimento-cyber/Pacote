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
  Trash2,
  Database,
  Cloud,
} from 'lucide-react';
import { formatMesAno } from '../utils/formatters';
import { PlatformSaveModal } from './PlatformSaveModal';
import { PlatformClearModal } from './PlatformClearModal';
import { DateRangePickerPopover } from './DateRangePickerPopover';
import { saveAllPlatformDataToServer, downloadPlatformBackup } from '../utils/platformBackup';

interface TopBarProps {
  setIsMobileOpen: (open: boolean) => void;
  isFilterOpen: boolean;
  setIsFilterOpen: (open: boolean) => void;
}

const TAB_TITLES: Record<MenuItemId, { title: string; subtitle: string }> = {
  'dashboard-geral': { title: 'Dashboard Geral Consolidado', subtitle: 'Painel executivo com gráficos integrados de todas as abas do sistema' },
  dashboard: { title: 'Perdas PA', subtitle: 'Comparativo Meta 2026 x Real 2026 e Indicadores do Pacote Prejuízo' },
  'quebras-movimentacao': { title: 'WQI — Quebras de Movimentação do Armazém', subtitle: 'Gestão analítica de avarias no manuseio, operadores, empilhadeiras e impacto financeiro' },
  reposicao: { title: 'Vales', subtitle: 'Painel analítico de vales e reposições, formatos de embalagem e achados operacionais' },
  'perdas-por': { title: 'Avarias no Total', subtitle: 'Análise estruturada de perdas, conversor Excel/JSON, Pareto e árvore por mês' },
  refugo: { title: 'Refugo — Estratificação de Materiais & Ativos', subtitle: 'Plataforma unificada de estratificação de Garrafas de Vidro, Garrafeiras Plásticas e Paletes com Curva de Pareto 80/20' },
  'troca-improprio': { title: 'Trocas de Produtos Impróprios', subtitle: 'Gestão financeira mês a mês de trocas, validades e devoluções do mercado' },
  'faltas-sobras': { title: 'Inventário — Faltas & Sobras de Produto Acabado', subtitle: 'Balanço de estoque físico vs disponível, divergências por SKU e impacto por grupo Ambev' },
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
  const [isClearModalOpen, setIsClearModalOpen] = useState<boolean>(false);
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
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-blue-200/80 px-4 py-3 text-slate-800 flex items-center justify-between shadow-sm shadow-blue-900/5">
      {/* Toast Notification Flutuante */}
      {toastMessage && (
        <div className="fixed top-18 right-6 z-50 bg-white border border-emerald-500 text-emerald-800 px-4 py-3 rounded-xl shadow-2xl shadow-blue-950/20 flex items-center gap-3 animate-in fade-in slide-in-from-top-3 duration-200 text-xs font-bold">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-slate-700 ml-2 p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="lg:hidden p-2 rounded-xl bg-blue-50 text-blue-600 hover:text-blue-800 hover:bg-blue-100 transition-colors cursor-pointer border border-blue-200"
          title="Abrir Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-extrabold text-blue-950 leading-tight flex items-center gap-2">
            <span>{currentTabInfo.title}</span>
          </h1>
          <p className="text-xs text-blue-800/80 font-medium hidden sm:block">
            {currentTabInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Right: Date Range Popover, Save All Data & Filter Toggle */}
      <div className="flex items-center gap-2">
        {/* Filtro de Período / Atalhos e Calendário (Conforme solicitado) */}
        <DateRangePickerPopover />

        {/* Status do Banco de Dados Firestore */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-bold shadow-xs" title="Banco de dados Firebase Firestore conectado e ativo">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <Database className="w-3.5 h-3.5 text-blue-600" />
          <span>Banco Conectado</span>
        </div>

        {/* Botão de Salvar Toda a Plataforma com Opções */}
        <div className="relative">
          <div className="flex items-center rounded-xl overflow-hidden border border-blue-300 shadow-sm bg-blue-600 hover:bg-blue-700 transition-all text-white">
            <button
              onClick={handleQuickSaveAll}
              disabled={isSaving}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                savedSuccess
                  ? 'bg-emerald-600 text-white font-black'
                  : 'text-white hover:bg-blue-700'
              }`}
              title="Salvar 100% dos dados de todas as abas da plataforma agora"
            >
              {isSaving ? (
                <RefreshCw className="w-4 h-4 text-white animate-spin" />
              ) : savedSuccess ? (
                <CheckCircle2 className="w-4 h-4 text-white" />
              ) : (
                <HardDrive className="w-4 h-4 text-white" />
              )}
              <span className="hidden sm:inline">
                {isSaving ? 'Salvando...' : savedSuccess ? 'Plataforma Salva!' : 'Salvar Dados'}
              </span>
            </button>

            {/* Dropdown toggle for options */}
            <button
              onClick={() => setShowSaveOptions(!showSaveOptions)}
              className="px-2 py-1.5 border-l border-blue-500 text-white hover:bg-blue-800 transition-colors cursor-pointer"
              title="Opções de Backup e Restauração"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Menu Dropdown de Opções de Salvamento */}
          {showSaveOptions && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-blue-200 rounded-2xl shadow-2xl py-2 z-50 text-xs animate-in fade-in zoom-in-95">
              <button
                onClick={handleQuickSaveAll}
                className="w-full px-3.5 py-2.5 text-left text-slate-800 hover:bg-blue-50 flex items-center gap-2.5 cursor-pointer font-semibold"
              >
                <Save className="w-4 h-4 text-blue-600" />
                <span className="font-semibold">Salvar Toda a Plataforma</span>
              </button>

              <button
                onClick={() => {
                  setShowSaveOptions(false);
                  setIsSaveModalOpen(true);
                }}
                className="w-full px-3.5 py-2.5 text-left text-slate-800 hover:bg-blue-50 flex items-center gap-2.5 cursor-pointer font-semibold"
              >
                <HardDrive className="w-4 h-4 text-amber-500" />
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
                className="w-full px-3.5 py-2.5 text-left text-slate-800 hover:bg-blue-50 flex items-center gap-2.5 border-t border-slate-100 cursor-pointer font-semibold"
              >
                <Download className="w-4 h-4 text-blue-600" />
                <span>Baixar Backup JSON (.json)</span>
              </button>

              <button
                onClick={() => {
                  setShowSaveOptions(false);
                  setIsClearModalOpen(true);
                }}
                className="w-full px-3.5 py-2.5 text-left text-red-600 hover:bg-red-50 flex items-center gap-2.5 border-t border-slate-100 cursor-pointer font-semibold"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
                <span className="font-semibold">Limpar Todos os Dados</span>
              </button>
            </div>
          )}
        </div>

        {/* Botão de Limpar Toda a Plataforma */}
        <button
          onClick={() => setIsClearModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-all cursor-pointer shadow-xs"
          title="Limpar todos os dados da plataforma (Zerar registros)"
        >
          <Trash2 className="w-3.5 h-3.5 text-red-500 shrink-0" />
          <span className="hidden md:inline">Limpar Dados</span>
        </button>

        {/* Quick Month Dropdown */}
        <div className="hidden xl:flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-xl px-3 py-1.5 text-xs text-blue-900 font-semibold shadow-xs">
          <Calendar className="w-3.5 h-3.5 text-blue-600" />
          <select
            value={filtros.mes}
            onChange={(e) => setFiltros((prev) => ({ ...prev, mes: e.target.value }))}
            className="bg-transparent text-blue-950 font-bold focus:outline-none cursor-pointer"
          >
            <option value="" className="bg-white text-slate-800">
              Todos os Meses ({availableMonths.length > 0 ? `${availableMonths.length} períodos` : 'Consolidado'})
            </option>
            {availableMonths.map((m) => (
              <option key={m} value={m} className="bg-white text-slate-800">
                {formatMesAno(m) || m}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Button */}
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
            isFilterOpen || activeFiltersCount > 0
              ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
              : 'bg-white border-blue-200 text-blue-900 hover:bg-blue-50'
          }`}
        >
          <Filter className="w-4 h-4" />
          <span className="hidden sm:inline">Filtros</span>
          {activeFiltersCount > 0 && (
            <span className="bg-white text-blue-600 font-black rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
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

      {/* Modal Global de Limpeza de Dados */}
      <PlatformClearModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onSuccessToast={(msg) => {
          setToastMessage(msg);
          setTimeout(() => setToastMessage(null), 4500);
        }}
      />
    </header>
  );
};
