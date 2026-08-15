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
} from 'lucide-react';
import { formatMesAno } from '../utils/formatters';

interface TopBarProps {
  setIsMobileOpen: (open: boolean) => void;
  isFilterOpen: boolean;
  setIsFilterOpen: (open: boolean) => void;
}

const TAB_TITLES: Record<MenuItemId, { title: string; subtitle: string }> = {
  dashboard: { title: 'Análise Anual de Quebras', subtitle: 'Comparativo Meta 2026 x Real 2026 e Indicadores do Pacote Prejuízo' },
  reposicao: { title: 'Reposição de Bebidas', subtitle: 'Painel analítico de reposições, formatos de embalagem e achados operacionais' },
  'perdas-por': { title: 'Perdas por Mercadoria', subtitle: 'Análise estruturada de perdas, conversor Excel/JSON, Pareto e árvore por mês' },
  'consumo-interno': { title: 'Consumo Interno', subtitle: 'Gestão e monitoramento analítico de requisições internas por SKU e Categoria' },
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
  const { activeTab, setActiveTab, filtros, setFiltros, resetFiltros, availableMonths } = useApp();

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
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="lg:hidden p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
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

      {/* Right: Quick Month Selector, Filter Toggle & Action Button */}
      <div className="flex items-center gap-2">
        {/* Quick Month Dropdown */}
        <div className="hidden md:flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/70 rounded-lg px-2.5 py-1.5 text-xs">
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
          className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
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
    </header>
  );
};
