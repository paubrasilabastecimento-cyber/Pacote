import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useConsumoInternoData } from '../hooks/useConsumoInternoData';
import { ItemReposicao } from '../types/reposicao';
import { DEMO_REPOSICAO_BEBIDAS } from '../data/mockReposicao';
import { PerdaItemJSON } from '../types/perdasPor';
import defaultRawPerdasPor from '../data/perdas_normalizadas.json';
import { DADOS_PLANILHA_DEMO, ItemPlanilha } from '../utils/spreadsheetAnalyzer';
import {
  formatCurrency,
  formatMesCurto,
  formatHL,
  formatNumber,
} from '../utils/formatters';
import {
  BarChart3,
  Layers,
  Beer,
  RotateCcw,
  PieChart as PieChartIcon,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Boxes,
  ExternalLink,
  LayoutDashboard,
  Wallet,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area,
  ReferenceLine,
} from 'recharts';

const PALETA_AMBEV = {
  amber: '#f59e0b',
  amberDark: '#d97706',
  emerald: '#10b981',
  sky: '#0284c7',
  skyLight: '#38bdf8',
  indigo: '#6366f1',
  purple: '#8b5cf6',
  rose: '#f43f5e',
  slate: '#64748b',
};

const CORES_PIE = ['#f59e0b', '#38bdf8', '#6366f1', '#a855f7', '#f43f5e', '#10b981', '#64748b'];

export const DashboardGeralView: React.FC = () => {
  const {
    computedMonthKPIs,
    filteredPerdas,
    trocaPlanilhaItens,
    setActiveTab,
  } = useApp();

  const { data: consumoInternoList } = useConsumoInternoData('empresa-01');

  // Selected Month filter inside Dashboard Geral ('all' or 'YYYY-MM')
  const [selectedMes, setSelectedMes] = useState<string>('all');

  // 1. Reposição Items from cache or mock fallback
  const itensReposicao: ItemReposicao[] = useMemo(() => {
    try {
      const cached = localStorage.getItem('AMBEV_REPOSICAO_BEBIDAS');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEMO_REPOSICAO_BEBIDAS;
  }, []);

  // 2. Perdas Por Mercadoria Items from cache or default JSON
  const itensPerdasPor: PerdaItemJSON[] = useMemo(() => {
    try {
      const cached = localStorage.getItem('ambev_perdas_por_mercadoria_v1');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return defaultRawPerdasPor as unknown as PerdaItemJSON[];
  }, []);

  // 3. Troca Impróprio Items
  const itensTrocaImproprio: ItemPlanilha[] = useMemo(() => {
    if (trocaPlanilhaItens && trocaPlanilhaItens.length > 0) {
      return trocaPlanilhaItens;
    }
    return DADOS_PLANILHA_DEMO;
  }, [trocaPlanilhaItens]);

  // --- FILTERS APPLICATION ---
  // A. Filtered Quebras (Análise de Quebras)
  const quebrasFiltradas = useMemo(() => {
    if (selectedMes === 'all') return filteredPerdas;
    return filteredPerdas.filter((p) => p.mesRef === selectedMes || (p.data && p.data.startsWith(selectedMes)));
  }, [filteredPerdas, selectedMes]);

  // B. Filtered Reposição
  const reposicaoFiltrada = useMemo(() => {
    if (selectedMes === 'all') return itensReposicao;
    return itensReposicao.filter(
      (r) => r.mesRef === selectedMes || (r.dataOperacao && r.dataOperacao.startsWith(selectedMes))
    );
  }, [itensReposicao, selectedMes]);

  // C. Filtered Perdas Por
  const perdasPorFiltradas = useMemo(() => {
    if (selectedMes === 'all') return itensPerdasPor;
    return itensPerdasPor.filter(
      (p) => p.dataOperacao && p.dataOperacao.startsWith(selectedMes)
    );
  }, [itensPerdasPor, selectedMes]);

  // D. Filtered Consumo Interno
  const consumoInternoFiltrado = useMemo(() => {
    if (!consumoInternoList) return [];
    if (selectedMes === 'all') return consumoInternoList;
    return consumoInternoList.filter(
      (c) =>
        (c.dtOperacao && c.dtOperacao.startsWith(selectedMes)) ||
        (c.dataOperacao && c.dataOperacao.startsWith(selectedMes))
    );
  }, [consumoInternoList, selectedMes]);

  // E. Filtered Trocas Impróprias
  const trocasFiltradas = useMemo(() => {
    if (selectedMes === 'all') return itensTrocaImproprio;
    return itensTrocaImproprio.filter(
      (t) => t.mes === selectedMes || (t.data && t.data.startsWith(selectedMes))
    );
  }, [itensTrocaImproprio, selectedMes]);

  // --- KPI CONSOLIDATED TOTALS ---
  const totalQuebrasR$ = useMemo(
    () => quebrasFiltradas.reduce((acc, p) => acc + (Number(p.valorR$) || 0), 0),
    [quebrasFiltradas]
  );
  const totalQuebrasHL = useMemo(
    () => quebrasFiltradas.reduce((acc, p) => acc + (Number(p.hlPerdido) || 0), 0),
    [quebrasFiltradas]
  );

  const totalReposicaoR$ = useMemo(
    () => reposicaoFiltrada.reduce((acc, r) => acc + (Number(r.valor) || 0), 0),
    [reposicaoFiltrada]
  );
  const totalReposicaoQtde = useMemo(
    () => reposicaoFiltrada.reduce((acc, r) => acc + (Number(r.qtde) || 0), 0),
    [reposicaoFiltrada]
  );

  const totalPerdasPorR$ = useMemo(
    () => perdasPorFiltradas.reduce((acc, p) => acc + (Number(p.valor) || 0), 0),
    [perdasPorFiltradas]
  );
  const totalPerdasPorQtde = useMemo(
    () => perdasPorFiltradas.reduce((acc, p) => acc + (Number(p.qtde) || 0), 0),
    [perdasPorFiltradas]
  );

  const totalConsumoR$ = useMemo(
    () => consumoInternoFiltrado.reduce((acc, c) => acc + (Number(c.valor) || 0), 0),
    [consumoInternoFiltrado]
  );
  const totalConsumoItens = useMemo(
    () => consumoInternoFiltrado.reduce((acc, c) => acc + (Number(c.qtde) || 0), 0),
    [consumoInternoFiltrado]
  );

  const totalTrocasR$ = useMemo(
    () => trocasFiltradas.reduce((acc, t) => acc + (Number(t.valor) || 0), 0),
    [trocasFiltradas]
  );
  const totalTrocasQtd = useMemo(
    () => trocasFiltradas.reduce((acc, t) => acc + (Number(t.quantidade) || 0), 0),
    [trocasFiltradas]
  );

  const custoTotalGeral = totalQuebrasR$ + totalReposicaoR$ + totalPerdasPorR$ + totalConsumoR$ + totalTrocasR$;

  // --- CHART 1: ABA ANÁLISE ANUAL DE QUEBRAS (Evolução Mensal Realizado vs Meta) ---
  const chartQuebrasMensal = useMemo(() => {
    const meses = [
      '2026-01',
      '2026-02',
      '2026-03',
      '2026-04',
      '2026-05',
      '2026-06',
      '2026-07',
      '2026-08',
      '2026-09',
      '2026-10',
      '2026-11',
      '2026-12',
    ];

    return meses.map((mes) => {
      const perdasMes = filteredPerdas.filter(
        (p) => p.mesRef === mes || (p.data && p.data.startsWith(mes))
      );
      const realR$ = perdasMes.reduce((sum, p) => sum + (Number(p.valorR$) || 0), 0);
      const hlMes = perdasMes.reduce((sum, p) => sum + (Number(p.hlPerdido) || 0), 0);
      const kpi = computedMonthKPIs.find((k) => k.mes === mes);
      const metaR$ = kpi?.sclMeta || 45000;

      return {
        mes: formatMesCurto(mes),
        mesRef: mes,
        realR$: Math.round(realR$),
        metaR$: Math.round(metaR$),
        hl: Number(hlMes.toFixed(2)),
      };
    });
  }, [filteredPerdas, computedMonthKPIs]);

  // --- CHART 2: ABA REPOSIÇÃO (Distribuição por Embalagem) ---
  const chartReposicaoEmbalagem = useMemo(() => {
    const grupos: Record<string, { embalagem: string; valor: number; qtd: number }> = {};
    reposicaoFiltrada.forEach((item) => {
      const emb = item.embalagem || 'Outros';
      if (!grupos[emb]) {
        grupos[emb] = { embalagem: emb, valor: 0, qtd: 0 };
      }
      grupos[emb].valor += Number(item.valor) || 0;
      grupos[emb].qtd += Number(item.qtde) || 0;
    });

    return Object.values(grupos).sort((a, b) => b.valor - a.valor);
  }, [reposicaoFiltrada]);

  // --- CHART 3: ABA PERDAS POR MERCADORIA (Top Embalagens por Valor R$) ---
  const chartPerdasPorCategorias = useMemo(() => {
    const catMap: Record<string, { embalagem: string; valor: number; qtd: number }> = {};
    perdasPorFiltradas.forEach((item) => {
      const emb = item.embalagem || 'Geral';
      if (!catMap[emb]) {
        catMap[emb] = { embalagem: emb, valor: 0, qtd: 0 };
      }
      catMap[emb].valor += Number(item.valor) || 0;
      catMap[emb].qtd += Number(item.qtde) || 0;
    });

    return Object.values(catMap)
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 6);
  }, [perdasPorFiltradas]);

  // --- CHART 4: ABA CONSUMO INTERNO (Evolução Mensal) ---
  const chartConsumoInterno = useMemo(() => {
    const mesesMap: Record<string, { mes: string; valor: number; meta: number }> = {
      'Jan': { mes: 'Jan', valor: 3200, meta: 4000 },
      'Fev': { mes: 'Fev', valor: 2890, meta: 4000 },
      'Mar': { mes: 'Mar', valor: 3600, meta: 4000 },
      'Abr': { mes: 'Abr', valor: 3100, meta: 4000 },
      'Mai': { mes: 'Mai', valor: 3450, meta: 4000 },
      'Jun': { mes: 'Jun', valor: 2980, meta: 4000 },
      'Jul': { mes: 'Jul', valor: 3800, meta: 4000 },
      'Ago': { mes: 'Ago', valor: 3400, meta: 4000 },
    };

    if (consumoInternoList && consumoInternoList.length > 0) {
      consumoInternoList.forEach((c) => {
        const rawDate = c.dtOperacao || c.dataOperacao || '2026-01';
        const m = formatMesCurto(rawDate.slice(0, 7));
        if (mesesMap[m]) {
          mesesMap[m].valor += Number(c.valor) || 0;
        }
      });
    }

    return Object.values(mesesMap);
  }, [consumoInternoList]);

  // --- CHART 5: ABA TROCA PROD. IMPRÓPRIO (Distribuição por Categoria) ---
  const chartTrocasMotivos = useMemo(() => {
    const motivosMap: Record<string, { categoria: string; valor: number; count: number }> = {};
    trocasFiltradas.forEach((item) => {
      const cat = item.categoria || item.marca || 'Cerveja';
      const shortCat = cat.length > 22 ? cat.slice(0, 20) + '...' : cat;
      if (!motivosMap[shortCat]) {
        motivosMap[shortCat] = { categoria: shortCat, valor: 0, count: 0 };
      }
      motivosMap[shortCat].valor += Number(item.valor) || 0;
      motivosMap[shortCat].count += Number(item.quantidade) || 1;
    });

    return Object.values(motivosMap)
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5);
  }, [trocasFiltradas]);

  // --- CHART 6: COMPOSIÇÃO GERAL DO PREJUÍZO (Consolidado) ---
  const chartComposicaoGeral = useMemo(() => {
    return [
      { name: 'Quebras Armazém', value: Math.round(totalQuebrasR$), color: PALETA_AMBEV.amber },
      { name: 'Reposição', value: Math.round(totalReposicaoR$), color: PALETA_AMBEV.skyLight },
      { name: 'Perdas Mercadoria', value: Math.round(totalPerdasPorR$), color: PALETA_AMBEV.indigo },
      { name: 'Consumo Interno', value: Math.round(totalConsumoR$), color: PALETA_AMBEV.purple },
      { name: 'Troca Impróprio', value: Math.round(totalTrocasR$), color: PALETA_AMBEV.rose },
    ].filter((item) => item.value > 0);
  }, [totalQuebrasR$, totalReposicaoR$, totalPerdasPorR$, totalConsumoR$, totalTrocasR$]);

  return (
    <div id="view-dashboard-geral" className="space-y-6 pb-12">
      {/* 1. TOP EXECUTIVE HEADER BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1.5 shadow-xs">
              <LayoutDashboard className="w-3.5 h-3.5" />
              Visão Geral Executiva
            </span>
            <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Padrão Operacional AMBEV
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Dashboard Geral de Perdas e Eficiência Operacional
          </h1>
          <p className="text-xs md:text-sm text-slate-400 max-w-3xl">
            Painel executivo consolidando os indicadores e gráficos das abas operacionais do sistema: Quebras, Reposição, Perdas por Mercadoria, Consumo Interno e Troca de Produtos Impróprios.
          </p>
        </div>

        {/* Global Filter by Month */}
        <div className="flex items-center gap-2.5 bg-slate-950/80 p-2 rounded-xl border border-slate-800 shrink-0 w-full lg:w-auto">
          <Calendar className="w-4 h-4 text-amber-400 ml-2" />
          <span className="text-xs font-bold text-slate-300">Filtrar Período:</span>
          <select
            value={selectedMes}
            onChange={(e) => setSelectedMes(e.target.value)}
            className="bg-slate-900 text-xs font-semibold text-slate-100 border border-slate-700 rounded-lg px-3 py-2 focus:outline-hidden focus:border-amber-500 cursor-pointer"
          >
            <option value="all">📅 Todos os Meses (Consolidado 2026)</option>
            <option value="2026-01">Janeiro 2026</option>
            <option value="2026-02">Fevereiro 2026</option>
            <option value="2026-03">Março 2026</option>
            <option value="2026-04">Abril 2026</option>
            <option value="2026-05">Maio 2026</option>
            <option value="2026-06">Junho 2026</option>
            <option value="2026-07">Julho 2026</option>
            <option value="2026-08">Agosto 2026</option>
            <option value="2026-09">Setembro 2026</option>
            <option value="2026-10">Outubro 2026</option>
            <option value="2026-11">Novembro 2026</option>
            <option value="2026-12">Dezembro 2026</option>
          </select>
        </div>
      </div>

      {/* 2. TOP 6 EXECUTIVE SUMMARY KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* Card 1: Quebras */}
        <div
          onClick={() => setActiveTab('dashboard')}
          className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 rounded-xl p-4 transition-all duration-200 cursor-pointer group shadow-lg hover:shadow-amber-500/5"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">1. Quebras Armazém</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-black text-white">{formatCurrency(totalQuebrasR$)}</div>
          <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
            <span>{formatHL(totalQuebrasHL)}</span>
            <span className="text-amber-400 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
              Ver aba <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 2: Reposição */}
        <div
          onClick={() => setActiveTab('reposicao')}
          className="bg-slate-900/90 border border-slate-800 hover:border-sky-500/50 rounded-xl p-4 transition-all duration-200 cursor-pointer group shadow-lg hover:shadow-sky-500/5"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">2. Reposição</span>
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-black text-white">{formatCurrency(totalReposicaoR$)}</div>
          <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
            <span>{formatNumber(totalReposicaoQtde)} itens</span>
            <span className="text-sky-400 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
              Ver aba <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 3: Perdas por Mercadoria */}
        <div
          onClick={() => setActiveTab('perdas-por')}
          className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-4 transition-all duration-200 cursor-pointer group shadow-lg hover:shadow-indigo-500/5"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">3. Perdas Mercadoria</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-black text-white">{formatCurrency(totalPerdasPorR$)}</div>
          <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
            <span>{formatNumber(totalPerdasPorQtde)} un</span>
            <span className="text-indigo-400 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
              Ver aba <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 4: Consumo Interno */}
        <div
          onClick={() => setActiveTab('consumo-interno')}
          className="bg-slate-900/90 border border-slate-800 hover:border-purple-500/50 rounded-xl p-4 transition-all duration-200 cursor-pointer group shadow-lg hover:shadow-purple-500/5"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">4. Consumo Interno</span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Beer className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-black text-white">{formatCurrency(totalConsumoR$)}</div>
          <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
            <span>{formatNumber(totalConsumoItens)} un</span>
            <span className="text-purple-400 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
              Ver aba <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 5: Troca Produto Impróprio */}
        <div
          onClick={() => setActiveTab('troca-improprio')}
          className="bg-slate-900/90 border border-slate-800 hover:border-rose-500/50 rounded-xl p-4 transition-all duration-200 cursor-pointer group shadow-lg hover:shadow-rose-500/5"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">5. Troca Impróprio</span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-black text-white">{formatCurrency(totalTrocasR$)}</div>
          <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
            <span>{formatNumber(totalTrocasQtd)} trocas</span>
            <span className="text-rose-400 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
              Ver aba <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 6: Custo Total Consolidado */}
        <div className="bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/40 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Custo Total Pacote</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-black text-amber-400">{formatCurrency(custoTotalGeral)}</div>
          <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
            <span>Consolidado Global</span>
            <span className="text-emerald-400 font-bold">5 Módulos</span>
          </div>
        </div>
      </div>

      {/* 3. CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* CHART 1: ABA ANÁLISE ANUAL DE QUEBRAS */}
        <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <BarChart3 className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-bold text-white text-sm">Análise Anual de Quebras</h3>
                  <p className="text-[11px] text-slate-400">Evolução Mensal de Quebras Realizadas (R$) vs. Meta Orçada</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('dashboard')}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <span>Acessar Aba</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <div className="h-64 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartQuebrasMensal} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="mes" stroke="#64748b" fontSize={11} />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                    }}
                    formatter={(val: any, name: any) => [
                      formatCurrency(Number(val)),
                      name === 'realR$' ? 'Realizado' : 'Meta Orçada',
                    ]}
                  />
                  <Legend
                    verticalAlign="top"
                    height={32}
                    formatter={(value) => (value === 'realR$' ? 'Realizado (R$)' : 'Meta Orçada (R$)')}
                  />
                  <Bar dataKey="realR$" fill={PALETA_AMBEV.amber} radius={[4, 4, 0, 0]} barSize={20}>
                    {chartQuebrasMensal.map((entry, idx) => (
                      <Cell
                        key={`cell-q-${idx}`}
                        fill={entry.realR$ > entry.metaR$ ? PALETA_AMBEV.rose : PALETA_AMBEV.amber}
                      />
                    ))}
                  </Bar>
                  <Line
                    type="monotone"
                    dataKey="metaR$"
                    stroke={PALETA_AMBEV.skyLight}
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: PALETA_AMBEV.skyLight }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Total Realizado: <strong className="text-slate-200">{formatCurrency(totalQuebrasR$)}</strong></span>
            <span>Total Volume: <strong className="text-slate-200">{formatHL(totalQuebrasHL)}</strong></span>
          </div>
        </div>

        {/* CHART 2: ABA REPOSIÇÃO */}
        <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  <Boxes className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-bold text-white text-sm">Reposição de Mercadorias</h3>
                  <p className="text-[11px] text-slate-400">Distribuição Financeira por Tipo de Embalagem (R$)</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('reposicao')}
                className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <span>Acessar Aba</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <div className="h-64 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartReposicaoEmbalagem} layout="vertical" margin={{ top: 10, right: 20, left: 30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis
                    type="number"
                    stroke="#64748b"
                    fontSize={11}
                    tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                  />
                  <YAxis type="category" dataKey="embalagem" stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [formatCurrency(Number(val)), 'Valor Reposição']}
                  />
                  <Bar dataKey="valor" radius={[0, 4, 4, 0]} barSize={18}>
                    {chartReposicaoEmbalagem.map((_, index) => (
                      <Cell key={`cell-rep-${index}`} fill={CORES_PIE[index % CORES_PIE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Total Reposição: <strong className="text-slate-200">{formatCurrency(totalReposicaoR$)}</strong></span>
            <span>Total Unidades: <strong className="text-slate-200">{formatNumber(totalReposicaoQtde)}</strong></span>
          </div>
        </div>

        {/* CHART 3: ABA PERDAS POR MERCADORIA */}
        <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Layers className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-bold text-white text-sm">Perdas por Mercadoria</h3>
                  <p className="text-[11px] text-slate-400">Top Tipos de Embalagem com Maior Impacto Financeiro (R$)</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('perdas-por')}
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <span>Acessar Aba</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <div className="h-64 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartPerdasPorCategorias} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="embalagem"
                    stroke="#64748b"
                    fontSize={10}
                    angle={-20}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                    }}
                    formatter={(val: any, _: any, item: any) => [
                      `${formatCurrency(Number(val))} (${item?.payload?.qtd || 0} un)`,
                      'Custo Perda',
                    ]}
                  />
                  <Bar dataKey="valor" fill={PALETA_AMBEV.indigo} radius={[4, 4, 0, 0]} barSize={24}>
                    {chartPerdasPorCategorias.map((_, index) => (
                      <Cell key={`cell-perdas-${index}`} fill={CORES_PIE[index % CORES_PIE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Perdas Registradas: <strong className="text-slate-200">{formatCurrency(totalPerdasPorR$)}</strong></span>
            <span>Total Quantidade: <strong className="text-slate-200">{formatNumber(totalPerdasPorQtde)} un</strong></span>
          </div>
        </div>

        {/* CHART 4: ABA CONSUMO INTERNO */}
        <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Beer className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-bold text-white text-sm">Consumo Interno Autorizado</h3>
                  <p className="text-[11px] text-slate-400">Evolução Mensal do Consumo Interno (R$) vs. Teto</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('consumo-interno')}
                className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <span>Acessar Aba</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <div className="h-64 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartConsumoInterno} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorConsumo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={PALETA_AMBEV.purple} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={PALETA_AMBEV.purple} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="mes" stroke="#64748b" fontSize={11} />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickFormatter={(val) => `R$ ${(val / 1000).toFixed(1)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [formatCurrency(Number(val)), 'Consumo Realizado']}
                  />
                  <ReferenceLine y={4000} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: 'Teto R$ 4k', fill: '#f43f5e', fontSize: 10 }} />
                  <Area
                    type="monotone"
                    dataKey="valor"
                    stroke={PALETA_AMBEV.purple}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorConsumo)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Total Consumo: <strong className="text-slate-200">{formatCurrency(totalConsumoR$)}</strong></span>
            <span>Total Unidades: <strong className="text-slate-200">{formatNumber(totalConsumoItens)} un</strong></span>
          </div>
        </div>

        {/* CHART 5: ABA TROCA PRODUTO IMPRÓPRIO */}
        <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <RotateCcw className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-bold text-white text-sm">Troca de Produtos Impróprios</h3>
                  <p className="text-[11px] text-slate-400">Distribuição Financeira por Categoria de Bebida (R$)</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('troca-improprio')}
                className="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <span>Acessar Aba</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <div className="h-64 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartTrocasMotivos} layout="vertical" margin={{ top: 10, right: 20, left: 40, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis
                    type="number"
                    stroke="#64748b"
                    fontSize={11}
                    tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                  />
                  <YAxis type="category" dataKey="categoria" stroke="#64748b" fontSize={10} width={100} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [formatCurrency(Number(val)), 'Valor Trocado']}
                  />
                  <Bar dataKey="valor" fill={PALETA_AMBEV.rose} radius={[0, 4, 4, 0]} barSize={18}>
                    {chartTrocasMotivos.map((_, index) => (
                      <Cell key={`cell-trocas-${index}`} fill={CORES_PIE[index % CORES_PIE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Total Impróprios: <strong className="text-slate-200">{formatCurrency(totalTrocasR$)}</strong></span>
            <span>Total Trocas: <strong className="text-slate-200">{formatNumber(totalTrocasQtd)}</strong></span>
          </div>
        </div>

        {/* CHART 6: COMPOSIÇÃO CONSOLIDADA GERAL */}
        <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <PieChartIcon className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-bold text-white text-sm">Composição Geral do Pacote Prejuízo</h3>
                  <p className="text-[11px] text-slate-400">Proporção Financeira entre as 5 Fontes de Prejuízo</p>
                </div>
              </div>
            </div>

            <div className="h-64 w-full mt-2 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartComposicaoGeral}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    label={(entry) => `${entry.name}`}
                  >
                    {chartComposicaoGeral.map((entry, index) => (
                      <Cell key={`cell-comp-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [formatCurrency(Number(val)), 'Impacto Financeiro']}
                  />
                  <Legend verticalAlign="bottom" height={28} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Maior Ofensor: <strong className="text-amber-400">Quebras Armazém ({formatCurrency(totalQuebrasR$)})</strong></span>
            <span>Total Consolidado: <strong className="text-slate-200">{formatCurrency(custoTotalGeral)}</strong></span>
          </div>
        </div>
      </div>

      {/* 4. CONSOLIDATED SUMMARY COMPARISON TABLE */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <PieChartIcon className="w-5 h-5" />
            </span>
            <div>
              <h2 className="font-bold text-white text-base">Matriz Comparativa Integrada</h2>
              <p className="text-xs text-slate-400">Resumo executivo consolidado com acesso rápido e status por módulo operacional</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block uppercase font-bold">Custo Total Consolidado</span>
            <span className="text-base font-black text-amber-400">{formatCurrency(custoTotalGeral)}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Módulo / Aba</th>
                <th className="py-3 px-4 text-right">Impacto Financeiro (R$)</th>
                <th className="py-3 px-4 text-right">Volume / Quantidade</th>
                <th className="py-3 px-4">Principal Ofensor / Destaque</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {/* Row 1 */}
              <tr className="hover:bg-slate-800/30 transition-colors">
                <td className="py-3 px-4 font-bold flex items-center gap-2 text-amber-400">
                  <BarChart3 className="w-4 h-4" />
                  <span>Análise Anual de Quebras</span>
                </td>
                <td className="py-3 px-4 text-right font-mono font-bold text-white">{formatCurrency(totalQuebrasR$)}</td>
                <td className="py-3 px-4 text-right text-slate-400">{formatHL(totalQuebrasHL)}</td>
                <td className="py-3 px-4 text-slate-300">Falta no Palete & Avarias de Movimentação</td>
                <td className="py-3 px-4 text-center">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    Atenção (1º Turno)
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-[11px] transition-colors cursor-pointer"
                  >
                    Abrir Aba
                  </button>
                </td>
              </tr>

              {/* Row 2 */}
              <tr className="hover:bg-slate-800/30 transition-colors">
                <td className="py-3 px-4 font-bold flex items-center gap-2 text-sky-400">
                  <Boxes className="w-4 h-4" />
                  <span>Reposição de Mercadorias</span>
                </td>
                <td className="py-3 px-4 text-right font-mono font-bold text-white">{formatCurrency(totalReposicaoR$)}</td>
                <td className="py-3 px-4 text-right text-slate-400">{formatNumber(totalReposicaoQtde)} itens</td>
                <td className="py-3 px-4 text-slate-300">Latas 350ml e Garrafas RGB 600ml</td>
                <td className="py-3 px-4 text-center">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/30">
                    Controlado
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => setActiveTab('reposicao')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-[11px] transition-colors cursor-pointer"
                  >
                    Abrir Aba
                  </button>
                </td>
              </tr>

              {/* Row 3 */}
              <tr className="hover:bg-slate-800/30 transition-colors">
                <td className="py-3 px-4 font-bold flex items-center gap-2 text-indigo-400">
                  <Layers className="w-4 h-4" />
                  <span>Perdas por Mercadoria</span>
                </td>
                <td className="py-3 px-4 text-right font-mono font-bold text-white">{formatCurrency(totalPerdasPorR$)}</td>
                <td className="py-3 px-4 text-right text-slate-400">{formatNumber(totalPerdasPorQtde)} un</td>
                <td className="py-3 px-4 text-slate-300">Cerveja Premium & Linha RGB</td>
                <td className="py-3 px-4 text-center">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                    Normalizado
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => setActiveTab('perdas-por')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-[11px] transition-colors cursor-pointer"
                  >
                    Abrir Aba
                  </button>
                </td>
              </tr>

              {/* Row 4 */}
              <tr className="hover:bg-slate-800/30 transition-colors">
                <td className="py-3 px-4 font-bold flex items-center gap-2 text-purple-400">
                  <Beer className="w-4 h-4" />
                  <span>Consumo Interno</span>
                </td>
                <td className="py-3 px-4 text-right font-mono font-bold text-white">{formatCurrency(totalConsumoR$)}</td>
                <td className="py-3 px-4 text-right text-slate-400">{formatNumber(totalConsumoItens)} unidades</td>
                <td className="py-3 px-4 text-slate-300">Treinamento & Degustação Técnica</td>
                <td className="py-3 px-4 text-center">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    Dentro da Cota
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => setActiveTab('consumo-interno')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-[11px] transition-colors cursor-pointer"
                  >
                    Abrir Aba
                  </button>
                </td>
              </tr>

              {/* Row 5 */}
              <tr className="hover:bg-slate-800/30 transition-colors">
                <td className="py-3 px-4 font-bold flex items-center gap-2 text-rose-400">
                  <RotateCcw className="w-4 h-4" />
                  <span>Troca Produto Impróprio</span>
                </td>
                <td className="py-3 px-4 text-right font-mono font-bold text-white">{formatCurrency(totalTrocasR$)}</td>
                <td className="py-3 px-4 text-right text-slate-400">{formatNumber(totalTrocasQtd)} trocas</td>
                <td className="py-3 px-4 text-slate-300">Validade Vencida & Perda de Gás</td>
                <td className="py-3 px-4 text-center">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                    Monitoramento
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => setActiveTab('troca-improprio')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-[11px] transition-colors cursor-pointer"
                  >
                    Abrir Aba
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
