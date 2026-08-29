import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ItemReposicao } from '../types/reposicao';
import { DEMO_REPOSICAO_BEBIDAS } from '../data/mockReposicao';
import { PerdaItemJSON } from '../types/perdasPor';
import defaultRawPerdasPor from '../data/perdas_normalizadas.json';
import { DADOS_PLANILHA_DEMO, ItemPlanilha } from '../utils/spreadsheetAnalyzer';
import { QuebraMovimentacaoItem } from '../types/quebrasMovimentacao';
import { DEMO_QUEBRAS_MOVIMENTACAO } from '../data/mockQuebrasMovimentacao';
import {
  DADOS_INVENTARIO_MARCO_2026,
  InventarioFaltasSobrasData,
} from '../data/mockFaltasSobras';
import { MONTHLY_METAS_MAP_2026 } from '../data/mockData';
import {
  formatCurrency,
  formatMesCurto,
  formatHL,
  formatNumber,
} from '../utils/formatters';
import {
  BarChart3,
  Layers,
  RotateCcw,
  PieChart as PieChartIcon,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Boxes,
  ExternalLink,
  LayoutDashboard,
  Wallet,
  Scale,
  TrendingDown,
  TrendingUp,
  User,
  Activity,
  Recycle,
} from 'lucide-react';
import { getStoredRefugoData } from '../utils/refugoUtils';
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

const CORES_PIE = ['#f59e0b', '#38bdf8', '#6366f1', '#f43f5e', '#10b981', '#a855f7', '#06b6d4', '#64748b'];

export const DashboardGeralView: React.FC = () => {
  const {
    computedMonthKPIs,
    filteredPerdas,
    trocaPlanilhaItens,
    setActiveTab,
  } = useApp();

  // Revision state to re-trigger memo when data is cleared or reset
  const [dataVersion, setDataVersion] = useState<number>(0);

  useEffect(() => {
    const handleStorageChange = () => setDataVersion((v) => v + 1);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('ambev_platform_data_cleared', handleStorageChange);
    window.addEventListener('ambev_platform_data_reset', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('ambev_platform_data_cleared', handleStorageChange);
      window.removeEventListener('ambev_platform_data_reset', handleStorageChange);
    };
  }, []);

  // Selected Month filter inside Dashboard Geral ('all' or 'YYYY-MM')
  const [selectedMes, setSelectedMes] = useState<string>('all');

  // 1. Reposição / Vales Items from cache or empty
  const itensReposicao: ItemReposicao[] = useMemo(() => {
    try {
      const cached = localStorage.getItem('AMBEV_REPOSICAO_BEBIDAS');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  }, [dataVersion]);

  // 2. WQI / Quebras de Movimentação from cache or empty
  const itensWQI: QuebraMovimentacaoItem[] = useMemo(() => {
    try {
      const cached = localStorage.getItem('AMBEV_QUEBRAS_MOVIMENTACAO');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  }, [dataVersion]);

  // 3. Perdas Por Mercadoria Items from cache or empty
  const itensPerdasPor: PerdaItemJSON[] = useMemo(() => {
    try {
      const cached = localStorage.getItem('ambev_perdas_por_mercadoria_v1');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  }, [dataVersion]);

  // 4. Troca Impróprio Items
  const itensTrocaImproprio: ItemPlanilha[] = useMemo(() => {
    if (trocaPlanilhaItens && Array.isArray(trocaPlanilhaItens)) {
      return trocaPlanilhaItens;
    }
    return [];
  }, [trocaPlanilhaItens, dataVersion]);

  // 5. Inventário (Faltas & Sobras)
  const dadosInventario: any = useMemo(() => {
    try {
      const saved = localStorage.getItem('ambev_inventario_faltas_sobras');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed &&
          (parsed.total_itens !== undefined ||
            parsed.total_estoque !== undefined ||
            parsed.total_diferenca !== undefined)
        ) {
          return parsed;
        }
      }
    } catch {}
    return {
      valor_falta: 0,
      valor_sobra: 0,
      total_diferenca: 0,
      total_itens: 0,
      acuracidade_pct: 100,
      skus: [],
      grupos_resumo: {},
    };
  }, [dataVersion]);

  // 6. Refugo Items
  const dadosRefugo = useMemo(() => {
    try {
      return getStoredRefugoData();
    } catch {
      return [];
    }
  }, [dataVersion]);

  const totalRefugoR$ = useMemo(() => {
    return dadosRefugo.reduce((acc, item) => acc + (Number(item.valor) || 0), 0);
  }, [dadosRefugo]);

  // --- FILTERS APPLICATION ---
  // A. Filtered Perdas PA
  const quebrasFiltradas = useMemo(() => {
    if (selectedMes === 'all') return filteredPerdas;
    return filteredPerdas.filter((p) => p.mesRef === selectedMes || (p.data && p.data.startsWith(selectedMes)));
  }, [filteredPerdas, selectedMes]);

  // B. Filtered WQI
  const wqiFiltrado = useMemo(() => {
    if (selectedMes === 'all') return itensWQI;
    return itensWQI.filter((item) => {
      if (item.data_hora && item.data_hora.startsWith(selectedMes)) return true;
      const monthMap: Record<string, string> = {
        '2026-01': 'JANEIRO',
        '2026-02': 'FEVEREIRO',
        '2026-03': 'MARÇO',
        '2026-04': 'ABRIL',
        '2026-05': 'MAIO',
        '2026-06': 'JUNHO',
      };
      if (monthMap[selectedMes] && item.mes?.toUpperCase() === monthMap[selectedMes]) return true;
      return false;
    });
  }, [itensWQI, selectedMes]);

  // C. Filtered Vales / Reposição
  const reposicaoFiltrada = useMemo(() => {
    if (selectedMes === 'all') return itensReposicao;
    return itensReposicao.filter(
      (r) => r.mesRef === selectedMes || (r.dataOperacao && r.dataOperacao.startsWith(selectedMes))
    );
  }, [itensReposicao, selectedMes]);

  // D. Filtered Perdas Por
  const perdasPorFiltradas = useMemo(() => {
    if (selectedMes === 'all') return itensPerdasPor;
    return itensPerdasPor.filter(
      (p) => p.dataOperacao && p.dataOperacao.startsWith(selectedMes)
    );
  }, [itensPerdasPor, selectedMes]);

  // E. Filtered Trocas Impróprias
  const trocasFiltradas = useMemo(() => {
    if (selectedMes === 'all') return itensTrocaImproprio;
    return itensTrocaImproprio.filter(
      (t) => t.mes === selectedMes || (t.data && t.data.startsWith(selectedMes))
    );
  }, [itensTrocaImproprio, selectedMes]);

  // --- KPI CONSOLIDATED TOTALS ---
  const totalPerdasPAR$ = useMemo(
    () => quebrasFiltradas.reduce((acc, p) => acc + (Number(p.valorR$) || 0), 0),
    [quebrasFiltradas]
  );
  const totalPerdasPAHL = useMemo(
    () => quebrasFiltradas.reduce((acc, p) => acc + (Number(p.hlPerdido) || 0), 0),
    [quebrasFiltradas]
  );

  const totalWQIR$ = useMemo(
    () => wqiFiltrado.reduce((acc, item) => acc + (Number(item.valor) || 0), 0),
    [wqiFiltrado]
  );
  const totalWQIQtde = useMemo(
    () => wqiFiltrado.reduce((acc, item) => acc + (Number(item.quantidade) || 0), 0),
    [wqiFiltrado]
  );

  const totalValesR$ = useMemo(
    () => reposicaoFiltrada.reduce((acc, r) => acc + (Number(r.valor) || 0), 0),
    [reposicaoFiltrada]
  );
  const totalValesQtde = useMemo(
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

  const totalTrocasR$ = useMemo(
    () => trocasFiltradas.reduce((acc, t) => acc + (Number(t.valor) || 0), 0),
    [trocasFiltradas]
  );
  const totalTrocasQtd = useMemo(
    () => trocasFiltradas.reduce((acc, t) => acc + (Number(t.quantidade) || 0), 0),
    [trocasFiltradas]
  );

  const totalInventarioFaltaR$ = useMemo(() => {
    const raw =
      dadosInventario?.valor_falta ??
      dadosInventario?.valor_total_falta ??
      0;
    return Math.abs(Number(raw) || 0);
  }, [dadosInventario]);

  const totalInventarioSobraR$ = useMemo(() => {
    const raw =
      dadosInventario?.valor_sobra ??
      dadosInventario?.valor_total_sobra ??
      0;
    return Math.abs(Number(raw) || 0);
  }, [dadosInventario]);

  const totalInventarioSaldoR$ = useMemo(() => {
    if (dadosInventario?.total_diferenca !== undefined) {
      return Number(dadosInventario.total_diferenca);
    }
    if (dadosInventario?.valor_diferenca_liquida !== undefined) {
      return Number(dadosInventario.valor_diferenca_liquida);
    }
    if (dadosInventario?.saldo_liquido !== undefined) {
      return Number(dadosInventario.saldo_liquido);
    }
    return totalInventarioSobraR$ - totalInventarioFaltaR$;
  }, [dadosInventario, totalInventarioSobraR$, totalInventarioFaltaR$]);

  // Custo Total Consolidado do Pacote (Perdas PA + WQI + Vales + Perdas Mercadoria + Trocas + Faltas Inventário)
  const custoTotalGeral = totalPerdasPAR$ + totalWQIR$ + totalValesR$ + totalPerdasPorR$ + totalTrocasR$ + totalInventarioFaltaR$;

  // --- CHART 1: PERDAS PA (Evolução Mensal Realizado vs Meta) ---
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
      const metaR$ = kpi?.sclMeta ?? MONTHLY_METAS_MAP_2026[mes] ?? 4177.96;

      return {
        mes: formatMesCurto(mes),
        mesRef: mes,
        realR$: Math.round(realR$),
        metaR$: Math.round(metaR$),
        hl: Number(hlMes.toFixed(2)),
      };
    });
  }, [filteredPerdas, computedMonthKPIs]);

  // --- CHART 2: WQI (Top Operadores por Custo de Quebra) ---
  const chartWQIOperadores = useMemo(() => {
    const opMap: Record<string, { funcionario: string; valor: number; qtd: number }> = {};
    wqiFiltrado.forEach((item) => {
      const func = item.funcionario || 'NÃO INFORMADO';
      if (!opMap[func]) {
        opMap[func] = { funcionario: func, valor: 0, qtd: 0 };
      }
      opMap[func].valor += Number(item.valor) || 0;
      opMap[func].qtd += Number(item.quantidade) || 0;
    });

    return Object.values(opMap)
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 6);
  }, [wqiFiltrado]);

  // --- CHART 3: VALES (Distribuição por Embalagem) ---
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

  // --- CHART 4: PERDAS POR MERCADORIA (Top Embalagens por Valor R$) ---
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

  // --- CHART 5: TROCAS PRODUTOS IMPRÓPRIOS (Distribuição por Categoria) ---
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

  // --- CHART 6: INVENTÁRIO (Grupos com Maior Divergência de Faltas/Sobras) ---
  const chartInventarioGrupos = useMemo(() => {
    if (dadosInventario?.grupos && Array.isArray(dadosInventario.grupos)) {
      return dadosInventario.grupos
        .map((g: any) => ({
          grupo: String(g.grupo || '').replace('CERVEJA ', '').replace('REFRIGERANTE ', 'REFRI '),
          valorDiferenca: Math.abs(Number(g.valor_diferenca) || 0),
          valorEstoque: Number(g.valor_estoque) || 0,
          itens: Number(g.itens) || 0,
        }))
        .sort((a: any, b: any) => b.valorDiferenca - a.valorDiferenca)
        .slice(0, 6);
    }
    if (dadosInventario?.grupos_resumo) {
      return Object.entries(dadosInventario.grupos_resumo)
        .map(([nome, g]: [string, any]) => ({
          grupo: nome.replace('CERVEJA ', '').replace('REFRIGERANTE ', 'REFRI '),
          valorDiferenca: Math.abs(Number(g.valor_diferenca) || 0),
          valorEstoque: Number(g.valor_estoque) || 0,
          itens: Number(g.itens) || 0,
        }))
        .sort((a: any, b: any) => b.valorDiferenca - a.valorDiferenca)
        .slice(0, 6);
    }
    return [];
  }, [dadosInventario]);

  // --- CHART 7: COMPOSIÇÃO GERAL DO PREJUÍZO (Consolidado) ---
  const chartComposicaoGeral = useMemo(() => {
    return [
      { name: 'Perdas PA', value: Math.round(totalPerdasPAR$), color: PALETA_AMBEV.amber },
      { name: 'WQI (Armazém)', value: Math.round(totalWQIR$), color: PALETA_AMBEV.emerald },
      { name: 'Vales', value: Math.round(totalValesR$), color: PALETA_AMBEV.skyLight },
      { name: 'Perdas Mercadoria', value: Math.round(totalPerdasPorR$), color: PALETA_AMBEV.indigo },
      { name: 'Trocas Impróprios', value: Math.round(totalTrocasR$), color: PALETA_AMBEV.rose },
      { name: 'Faltas Inventário', value: Math.round(totalInventarioFaltaR$), color: '#ef4444' },
    ].filter((item) => item.value > 0);
  }, [totalPerdasPAR$, totalWQIR$, totalValesR$, totalPerdasPorR$, totalTrocasR$, totalInventarioFaltaR$]);

  return (
    <div id="view-dashboard-geral" className="space-y-6 pb-12">
      {/* 1. TOP EXECUTIVE HEADER BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-blue-900/50 rounded-3xl p-6 md:p-8 shadow-2xl shadow-blue-950/20 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 text-white relative overflow-hidden">
        {/* Glow de fundo */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2 relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-blue-600/30 text-blue-300 border border-blue-400/30 flex items-center gap-1.5 shadow-xs">
              <LayoutDashboard className="w-3.5 h-3.5 text-blue-400" />
              ÍNDICE DA CATEGORIA • 7 MÓDULOS DISPONÍVEIS
            </span>
            <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              PAU BRASIL • DISTRIBUIDORA AMBEV
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            PACOTE PREJUÍZO & EFICIÊNCIA OPERACIONAL
          </h1>
          <p className="text-xs md:text-sm text-blue-200/80 max-w-4xl font-normal leading-relaxed">
            Painel unificado consolidando dados operacionais: <strong>Perdas PA</strong>, <strong>WQI</strong>, <strong>Vales</strong>, <strong>Avarias no Total</strong>, <strong>Refugo</strong>, <strong>Trocas</strong> e <strong>Inventário</strong>.
          </p>
        </div>

        {/* Global Filter by Month */}
        <div className="flex items-center gap-2.5 bg-slate-900/90 backdrop-blur-md p-2.5 rounded-2xl border border-blue-800/60 shrink-0 w-full lg:w-auto relative z-10 shadow-lg">
          <Calendar className="w-4 h-4 text-blue-400 ml-2" />
          <span className="text-xs font-bold text-blue-200">Período:</span>
          <select
            value={selectedMes}
            onChange={(e) => setSelectedMes(e.target.value)}
            className="bg-slate-950 text-xs font-bold text-white border border-blue-700/60 rounded-xl px-3.5 py-2 focus:outline-hidden focus:border-blue-400 cursor-pointer shadow-xs"
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

      {/* 2. TOP 7 EXECUTIVE SUMMARY KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7 gap-4">
        {/* Card 1: Perdas PA */}
        <div
          onClick={() => setActiveTab('dashboard')}
          className="bg-white border border-blue-200/90 hover:border-blue-500 rounded-2xl p-4 transition-all duration-200 cursor-pointer group shadow-sm hover:shadow-md shadow-blue-900/5 hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">1. Perdas PA</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-black text-slate-900">{formatCurrency(totalPerdasPAR$)}</div>
          <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
            <span>{formatHL(totalPerdasPAHL)}</span>
            <span className="text-blue-600 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
              Ver aba <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 2: WQI */}
        <div
          onClick={() => setActiveTab('quebras-movimentacao')}
          className="bg-white border border-blue-200/90 hover:border-blue-500 rounded-2xl p-4 transition-all duration-200 cursor-pointer group shadow-sm hover:shadow-md shadow-blue-900/5 hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">2. WQI</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-black text-slate-900">{formatCurrency(totalWQIR$)}</div>
          <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
            <span>{formatNumber(totalWQIQtde)} avarias</span>
            <span className="text-blue-600 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
              Ver aba <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 3: Vales */}
        <div
          onClick={() => setActiveTab('reposicao')}
          className="bg-white border border-blue-200/90 hover:border-blue-500 rounded-2xl p-4 transition-all duration-200 cursor-pointer group shadow-sm hover:shadow-md shadow-blue-900/5 hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">3. Vales</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-black text-slate-900">{formatCurrency(totalValesR$)}</div>
          <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
            <span>{formatNumber(totalValesQtde)} itens</span>
            <span className="text-blue-600 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
              Ver aba <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 4: Avarias no Total */}
        <div
          onClick={() => setActiveTab('perdas-por')}
          className="bg-white border border-blue-200/90 hover:border-blue-500 rounded-2xl p-4 transition-all duration-200 cursor-pointer group shadow-sm hover:shadow-md shadow-blue-900/5 hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">4. Avarias Total</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-black text-slate-900">{formatCurrency(totalPerdasPorR$)}</div>
          <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
            <span>{formatNumber(totalPerdasPorQtde)} un</span>
            <span className="text-blue-600 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
              Ver aba <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 5: Trocas de Produtos Impróprios */}
        <div
          onClick={() => setActiveTab('troca-improprio')}
          className="bg-white border border-blue-200/90 hover:border-blue-500 rounded-2xl p-4 transition-all duration-200 cursor-pointer group shadow-sm hover:shadow-md shadow-blue-900/5 hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">5. Trocas Impróprio</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center group-hover:scale-110 transition-transform">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-black text-slate-900">{formatCurrency(totalTrocasR$)}</div>
          <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
            <span>{formatNumber(totalTrocasQtd)} trocas</span>
            <span className="text-blue-600 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
              Ver aba <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 6: Inventário */}
        <div
          onClick={() => setActiveTab('faltas-sobras')}
          className="bg-white border border-blue-200/90 hover:border-blue-500 rounded-2xl p-4 transition-all duration-200 cursor-pointer group shadow-sm hover:shadow-md shadow-blue-900/5 hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">6. Inventário</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-lg font-black ${totalInventarioSaldoR$ < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            {formatCurrency(totalInventarioSaldoR$)}
          </div>
          <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
            <span className="truncate text-[10px]">
              <span className="text-red-600">-{formatCurrency(totalInventarioFaltaR$)}</span>
              <span className="text-slate-300 mx-1">|</span>
              <span className="text-emerald-600">+{formatCurrency(totalInventarioSobraR$)}</span>
            </span>
            <span className="text-blue-600 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform shrink-0 ml-1">
              Ver aba <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 7: Custo Total Consolidado */}
        <div className="bg-gradient-to-br from-blue-900 via-blue-950 to-slate-950 border border-blue-800 rounded-2xl p-4 shadow-md text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-200">Custo Total Pacote</span>
            <div className="w-8 h-8 rounded-xl bg-blue-600/40 text-blue-300 border border-blue-400/30 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-black text-amber-300">{formatCurrency(custoTotalGeral)}</div>
          <div className="flex items-center justify-between mt-1 text-[11px] text-blue-200/80">
            <span>Global Consolidado</span>
            <span className="text-emerald-400 font-bold">7 Módulos</span>
          </div>
        </div>
      </div>

      {/* 3. CHARTS GRID (2 COLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* CHART 1: ABA PERDAS PA */}
        <div className="bg-white border border-blue-200/90 rounded-2xl p-5 shadow-sm shadow-blue-900/5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
                  <BarChart3 className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-extrabold text-blue-950 text-sm">Perdas PA — Evolução Mensal</h3>
                  <p className="text-[11px] text-slate-500">Perdas Realizadas (R$) vs. Meta Orçada SCL 2026</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('dashboard')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
              >
                <span>Acessar Aba</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <div className="h-64 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartQuebrasMensal} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="mes" stroke="#94a3b8" fontSize={11} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#cbd5e1',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      color: '#0f172a'
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

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Total Realizado: <strong className="text-slate-800">{formatCurrency(totalPerdasPAR$)}</strong></span>
            <span>Total Volume: <strong className="text-slate-800">{formatHL(totalPerdasPAHL)}</strong></span>
          </div>
        </div>

        {/* CHART 2: WQI (QUEBRAS DE MOVIMENTAÇÃO) */}
        <div className="bg-white border border-blue-200/90 rounded-2xl p-5 shadow-sm shadow-blue-900/5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
                  <Boxes className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-extrabold text-blue-950 text-sm">WQI — Avarias por Operador</h3>
                  <p className="text-[11px] text-slate-500">Impacto Financeiro de Quebras de Movimentação por Operador (R$)</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('quebras-movimentacao')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
              >
                <span>Acessar Aba</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <div className="h-64 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartWQIOperadores} layout="vertical" margin={{ top: 10, right: 20, left: 30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis
                    type="number"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickFormatter={(val) => `R$ ${val.toFixed(0)}`}
                  />
                  <YAxis type="category" dataKey="funcionario" stroke="#64748b" fontSize={11} width={110} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#cbd5e1',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      color: '#0f172a'
                    }}
                    formatter={(val: any, _: any, item: any) => [
                      `${formatCurrency(Number(val))} (${item?.payload?.qtd || 0} avarias)`,
                      'Valor de Quebra',
                    ]}
                  />
                  <Bar dataKey="valor" radius={[0, 4, 4, 0]} barSize={18}>
                    {chartWQIOperadores.map((_, index) => (
                      <Cell key={`cell-wqi-${index}`} fill={CORES_PIE[index % CORES_PIE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Total WQI: <strong className="text-slate-800">{formatCurrency(totalWQIR$)}</strong></span>
            <span>Total Ocorrências: <strong className="text-slate-800">{formatNumber(totalWQIQtde)} avarias</strong></span>
          </div>
        </div>

        {/* CHART 3: ABA VALES */}
        <div className="bg-white border border-blue-200/90 rounded-2xl p-5 shadow-sm shadow-blue-900/5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-sky-50 text-sky-600 border border-sky-200">
                  <Boxes className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-extrabold text-blue-950 text-sm">Vales — Reposição de Mercadorias</h3>
                  <p className="text-[11px] text-slate-500">Distribuição Financeira por Tipo de Embalagem (R$)</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('reposicao')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
              >
                <span>Acessar Aba</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <div className="h-64 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartReposicaoEmbalagem} layout="vertical" margin={{ top: 10, right: 20, left: 30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis
                    type="number"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                  />
                  <YAxis type="category" dataKey="embalagem" stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#cbd5e1',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      color: '#0f172a'
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

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Total Vales: <strong className="text-slate-800">{formatCurrency(totalValesR$)}</strong></span>
            <span>Total Unidades: <strong className="text-slate-800">{formatNumber(totalValesQtde)}</strong></span>
          </div>
        </div>

        {/* CHART 4: ABA PERDAS POR MERCADORIA */}
        <div className="bg-white border border-blue-200/90 rounded-2xl p-5 shadow-sm shadow-blue-900/5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200">
                  <Layers className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-extrabold text-blue-950 text-sm">Avarias no Total</h3>
                  <p className="text-[11px] text-slate-500">Top Tipos de Embalagem com Maior Impacto Financeiro (R$)</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('perdas-por')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
              >
                <span>Acessar Aba</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <div className="h-64 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartPerdasPorCategorias} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="embalagem"
                    stroke="#94a3b8"
                    fontSize={10}
                    angle={-20}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#cbd5e1',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      color: '#0f172a'
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

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Perdas Registradas: <strong className="text-slate-800">{formatCurrency(totalPerdasPorR$)}</strong></span>
            <span>Total Quantidade: <strong className="text-slate-800">{formatNumber(totalPerdasPorQtde)} un</strong></span>
          </div>
        </div>

        {/* CHART 5: ABA TROCAS DE PRODUTOS IMPRÓPRIOS */}
        <div className="bg-white border border-blue-200/90 rounded-2xl p-5 shadow-sm shadow-blue-900/5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200">
                  <RotateCcw className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-extrabold text-blue-950 text-sm">Trocas de Produtos Impróprios</h3>
                  <p className="text-[11px] text-slate-500">Distribuição Financeira por Categoria de Bebida (R$)</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('troca-improprio')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
              >
                <span>Acessar Aba</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <div className="h-64 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartTrocasMotivos} layout="vertical" margin={{ top: 10, right: 20, left: 40, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis
                    type="number"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                  />
                  <YAxis type="category" dataKey="categoria" stroke="#64748b" fontSize={10} width={100} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#cbd5e1',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      color: '#0f172a'
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

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Total Impróprios: <strong className="text-slate-800">{formatCurrency(totalTrocasR$)}</strong></span>
            <span>Total Trocas: <strong className="text-slate-800">{formatNumber(totalTrocasQtd)}</strong></span>
          </div>
        </div>

        {/* CHART 6: INVENTÁRIO (FALTAS & SOBRAS) */}
        <div className="bg-white border border-blue-200/90 rounded-2xl p-5 shadow-sm shadow-blue-900/5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200">
                  <Scale className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-extrabold text-blue-950 text-sm">Inventário — Divergências por Grupo</h3>
                  <p className="text-[11px] text-slate-500">Impacto Financeiro Absoluto de Divergências Físico vs. Disponível</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('faltas-sobras')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
              >
                <span>Acessar Aba</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <div className="h-64 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartInventarioGrupos} layout="vertical" margin={{ top: 10, right: 20, left: 30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis
                    type="number"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                  />
                  <YAxis type="category" dataKey="grupo" stroke="#64748b" fontSize={10} width={110} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#cbd5e1',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      color: '#0f172a'
                    }}
                    formatter={(val: any, _: any, item: any) => [
                      `${formatCurrency(Number(val))} (${item?.payload?.itens || 0} SKUs)`,
                      'Impacto Divergência',
                    ]}
                  />
                  <Bar dataKey="valorDiferenca" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={18}>
                    {chartInventarioGrupos.map((_, index) => (
                      <Cell key={`cell-inv-${index}`} fill={CORES_PIE[index % CORES_PIE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Faltas: <strong className="text-red-600">-{formatCurrency(totalInventarioFaltaR$)}</strong></span>
            <span>Sobras: <strong className="text-emerald-600">+{formatCurrency(totalInventarioSobraR$)}</strong></span>
          </div>
        </div>
      </div>

      {/* 4. COMPOSIÇÃO GERAL DO PACOTE PREJUÍZO (DONUT) */}
      <div className="bg-white border border-blue-200/90 rounded-2xl p-5 shadow-sm shadow-blue-900/5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
                <PieChartIcon className="w-4 h-4" />
              </span>
              <div>
                <h3 className="font-extrabold text-blue-950 text-sm">Composição Geral do Pacote Prejuízo</h3>
                <p className="text-[11px] text-slate-500">Proporção Financeira entre as Fontes de Perdas Operacionais</p>
              </div>
            </div>
          </div>

          <div className="h-72 w-full mt-2 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartComposicaoGeral}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={3}
                  label={(entry) => `${entry.name}`}
                >
                  {chartComposicaoGeral.map((entry, index) => (
                    <Cell key={`cell-comp-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#cbd5e1',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    color: '#0f172a'
                  }}
                  formatter={(val: any) => [formatCurrency(Number(val)), 'Impacto Financeiro']}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Maior Ofensor: <strong className="text-amber-600">Perdas PA ({formatCurrency(totalPerdasPAR$)})</strong></span>
          <span>Total Consolidado: <strong className="text-blue-950 font-black">{formatCurrency(custoTotalGeral)}</strong></span>
        </div>
      </div>

      {/* 5. CONSOLIDATED SUMMARY COMPARISON TABLE */}
      <div className="bg-white border border-blue-200/90 rounded-2xl p-5 shadow-sm shadow-blue-900/5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <PieChartIcon className="w-5 h-5" />
            </span>
            <div>
              <h2 className="font-extrabold text-blue-950 text-base">Matriz Comparativa Integrada de Todos os Módulos</h2>
              <p className="text-xs text-slate-500">Resumo executivo consolidado com acesso rápido e status operacional por área</p>
            </div>
          </div>
          <div className="sm:text-right">
            <span className="text-[11px] text-slate-500 block uppercase font-bold">Custo Total Consolidado</span>
            <span className="text-base font-black text-blue-950">{formatCurrency(custoTotalGeral)}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-blue-100 bg-blue-50/50 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Módulo / Aba</th>
                <th className="py-3 px-4 text-right">Impacto Financeiro (R$)</th>
                <th className="py-3 px-4 text-right">Volume / Quantidade</th>
                <th className="py-3 px-4">Principal Ofensor / Destaque</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {/* Row 1: Perdas PA */}
              <tr className="hover:bg-blue-50/40 transition-colors">
                <td className="py-3 px-4 font-bold flex items-center gap-2 text-slate-900">
                  <BarChart3 className="w-4 h-4 text-amber-500" />
                  <span>Perdas PA</span>
                </td>
                <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{formatCurrency(totalPerdasPAR$)}</td>
                <td className="py-3 px-4 text-right text-slate-500">{formatHL(totalPerdasPAHL)}</td>
                <td className="py-3 px-4 text-slate-600">Acompanhamento Meta SCL x Realizado Mensal</td>
                <td className="py-3 px-4 text-center">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    Atenção (1º Turno)
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className="px-3 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-[11px] transition-colors cursor-pointer"
                  >
                    Abrir Aba
                  </button>
                </td>
              </tr>

              {/* Row 2: WQI */}
              <tr className="hover:bg-blue-50/40 transition-colors">
                <td className="py-3 px-4 font-bold flex items-center gap-2 text-slate-900">
                  <Boxes className="w-4 h-4 text-emerald-500" />
                  <span>WQI (Quebras de Movimentação)</span>
                </td>
                <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{formatCurrency(totalWQIR$)}</td>
                <td className="py-3 px-4 text-right text-slate-500">{formatNumber(totalWQIQtde)} avarias</td>
                <td className="py-3 px-4 text-slate-600">Avarias em Manuseio e Manobras de Empilhadeira</td>
                <td className="py-3 px-4 text-center">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Monitoramento
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => setActiveTab('quebras-movimentacao')}
                    className="px-3 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-[11px] transition-colors cursor-pointer"
                  >
                    Abrir Aba
                  </button>
                </td>
              </tr>

              {/* Row 3: Vales */}
              <tr className="hover:bg-blue-50/40 transition-colors">
                <td className="py-3 px-4 font-bold flex items-center gap-2 text-slate-900">
                  <Boxes className="w-4 h-4 text-blue-500" />
                  <span>Vales (Reposição de Bebidas)</span>
                </td>
                <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{formatCurrency(totalValesR$)}</td>
                <td className="py-3 px-4 text-right text-slate-500">{formatNumber(totalValesQtde)} itens</td>
                <td className="py-3 px-4 text-slate-600">Latas 350ml e Garrafas RGB 600ml</td>
                <td className="py-3 px-4 text-center">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    Controlado
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => setActiveTab('reposicao')}
                    className="px-3 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-[11px] transition-colors cursor-pointer"
                  >
                    Abrir Aba
                  </button>
                </td>
              </tr>

              {/* Row 4: Avarias no Total */}
              <tr className="hover:bg-blue-50/40 transition-colors">
                <td className="py-3 px-4 font-bold flex items-center gap-2 text-slate-900">
                  <Layers className="w-4 h-4 text-indigo-500" />
                  <span>Avarias no Total</span>
                </td>
                <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{formatCurrency(totalPerdasPorR$)}</td>
                <td className="py-3 px-4 text-right text-slate-500">{formatNumber(totalPerdasPorQtde)} un</td>
                <td className="py-3 px-4 text-slate-600">Cerveja Premium & Linha RGB</td>
                <td className="py-3 px-4 text-center">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Normalizado
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => setActiveTab('perdas-por')}
                    className="px-3 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-[11px] transition-colors cursor-pointer"
                  >
                    Abrir Aba
                  </button>
                </td>
              </tr>

              {/* Row 5: Trocas Impróprios */}
              <tr className="hover:bg-blue-50/40 transition-colors">
                <td className="py-3 px-4 font-bold flex items-center gap-2 text-slate-900">
                  <RotateCcw className="w-4 h-4 text-rose-500" />
                  <span>Trocas de Produtos Impróprios</span>
                </td>
                <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{formatCurrency(totalTrocasR$)}</td>
                <td className="py-3 px-4 text-right text-slate-500">{formatNumber(totalTrocasQtd)} trocas</td>
                <td className="py-3 px-4 text-slate-600">Validade Vencida & Perda de Gás</td>
                <td className="py-3 px-4 text-center">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    Monitoramento
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => setActiveTab('troca-improprio')}
                    className="px-3 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-[11px] transition-colors cursor-pointer"
                  >
                    Abrir Aba
                  </button>
                </td>
              </tr>

              {/* Row 6: Inventário */}
              <tr className="hover:bg-blue-50/40 transition-colors">
                <td className="py-3 px-4 font-bold flex items-center gap-2 text-slate-900">
                  <Scale className="w-4 h-4 text-slate-600" />
                  <span>Inventário (Saldo Faltas & Sobras)</span>
                </td>
                <td className="py-3 px-4 text-right font-mono font-bold">
                  <span className={totalInventarioSaldoR$ < 0 ? 'text-red-600 font-bold' : 'text-emerald-600 font-bold'}>
                    {formatCurrency(totalInventarioSaldoR$)}
                  </span>
                  <span className="text-[10px] text-slate-400 block font-normal">
                    (Falta: -{formatCurrency(totalInventarioFaltaR$)} | Sobra: +{formatCurrency(totalInventarioSobraR$)})
                  </span>
                </td>
                <td className="py-3 px-4 text-right text-slate-500">
                  {dadosInventario?.total_itens || 0} SKUs
                </td>
                <td className="py-3 px-4 text-slate-600">Balanço Físico vs. Disponível de Estoque</td>
                <td className="py-3 px-4 text-center">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    Acuracidade: {dadosInventario?.acuracidade_pct !== undefined ? dadosInventario.acuracidade_pct : 100}%
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => setActiveTab('faltas-sobras')}
                    className="px-3 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-[11px] transition-colors cursor-pointer"
                  >
                    Abrir Aba
                  </button>
                </td>
              </tr>

              {/* Row 7: Refugo */}
              <tr className="hover:bg-blue-50/40 transition-colors">
                <td className="py-3 px-4 font-bold flex items-center gap-2 text-slate-900">
                  <Recycle className="w-4 h-4 text-amber-600" />
                  <span>Refugo (Materiais & Ativos)</span>
                </td>
                <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                  {formatCurrency(totalRefugoR$)}
                </td>
                <td className="py-3 px-4 text-right text-slate-500">
                  {dadosRefugo.length} materiais
                </td>
                <td className="py-3 px-4 text-slate-600">
                  Garrafas de Vidro (80%), Garrafeiras Plásticas e Paletes
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    Estratificado
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => setActiveTab('refugo')}
                    className="px-3 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-[11px] transition-colors cursor-pointer"
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

