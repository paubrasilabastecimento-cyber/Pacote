import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { parseQuebrasJSON, ParseResult } from '../utils/jsonImporter';
import {
  formatCurrency,
  formatMesAno,
  formatMesCurto,
  formatDateBR,
  formatPercent,
  formatHL,
} from '../utils/formatters';
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Building,
  Percent,
  FileSpreadsheet,
  FileText,
  BarChart3,
  Upload,
  FileJson,
  X,
  FileType,
  AlertCircle,
  Database,
  Sparkles,
  Network,
  FolderTree,
} from 'lucide-react';
import { QuebrasTreeModal } from './QuebrasTreeModal';
import { QuebrasHierarchyTree } from './QuebrasHierarchyTree';
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
  ReferenceLine,
} from 'recharts';

export const DashboardView: React.FC = () => {
  const {
    kpis,
    currentMonthKPI,
    computedMonthKPIs,
    filteredPerdas,
    setActiveTab,
    filtros,
    importBatchPerdas,
  } = useApp();

  // JSON Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [jsonTextInput, setJsonTextInput] = useState<string>('');
  const [parsedResult, setParsedResult] = useState<ParseResult | null>(null);
  const [overwriteMode, setOverwriteMode] = useState<boolean>(true);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Time Horizon for Evolution Charts: 'anual' (12 Meses) | '6m' | '4m'
  const [timeHorizon, setTimeHorizon] = useState<'anual' | '6m' | '4m'>('anual');

  // Motive display count filter for Pareto chart
  const [paretoLimit, setParetoLimit] = useState<'top8' | 'top12' | 'all'>('top8');

  // Quebras Decomposition Tree Modal and Inline State
  const [isQuebrasTreeModalOpen, setIsQuebrasTreeModalOpen] = useState<boolean>(false);
  const [showInlineQuebrasTree, setShowInlineQuebrasTree] = useState<boolean>(false);

  // Handlers for JSON Import
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonTextInput(content);
      const res = parseQuebrasJSON(content);
      setParsedResult(res);
    };
    reader.readAsText(file);
  };

  const handleTextChange = (text: string) => {
    setJsonTextInput(text);
    if (text.trim()) {
      const res = parseQuebrasJSON(text);
      setParsedResult(res);
    } else {
      setParsedResult(null);
    }
  };

  const handleLoadSampleJSON = () => {
    const sample = JSON.stringify(
      [
        {
          "Data": "2026-01-01 11:59:15",
          "Mês": "JANEIRO",
          "CodProduto": 21020,
          "Descricao": "BUDWEISER 350ML",
          "Quantidade": 1,
          "Area": "ARMAZEM",
          "Turno": "Noite",
          "CodQuebra": 524,
          "Motivo": "FALTA NO PALETE",
          "Colaborador": "RONILDO",
          "Funcao": "EMPILHADOR",
          "VALOR DA AVARIA": 2.648683333333333,
          "HECTO LITRO": 0.0035,
          "HECTO PERDIDO ": 0.0035
        },
        {
          "Data": "2026-01-02 15:40:22",
          "Mês": "JANEIRO",
          "CodProduto": 18450,
          "Descricao": "STELLA ARTOIS 330ML",
          "Quantidade": 12,
          "Area": "CARREGAMENTO",
          "Turno": "Tarde",
          "CodQuebra": 102,
          "Motivo": "QUEBRA NO MANUSEIO",
          "Colaborador": "CARLOS SILVA",
          "Funcao": "CONFERENTE",
          "VALOR DA AVARIA": 45.80,
          "HECTO LITRO": 0.0033,
          "HECTO PERDIDO ": 0.0396
        },
        {
          "Data": "2026-01-03 08:15:10",
          "Mês": "JANEIRO",
          "CodProduto": 22100,
          "Descricao": "BRAHMA DUPLO MALTE 350ML",
          "Quantidade": 24,
          "Area": "ARMAZEM",
          "Turno": "Manhã",
          "CodQuebra": 524,
          "Motivo": "FALTA NO PALETE",
          "Colaborador": "MARCOS SOUZA",
          "Funcao": "OPERADOR DE EMPILHADEIRA",
          "VALOR DA AVARIA": 68.40,
          "HECTO LITRO": 0.0035,
          "HECTO PERDIDO ": 0.084
        }
      ],
      null,
      2
    );
    handleTextChange(sample);
  };

  const handleConfirmImport = async () => {
    if (!parsedResult || parsedResult.records.length === 0) return;

    await importBatchPerdas(parsedResult.records, overwriteMode);
    setImportSuccessMsg(
      `${parsedResult.records.length} ocorrência(s) de quebra importada(s) com sucesso!`
    );

    setTimeout(() => {
      setIsImportModalOpen(false);
      setJsonTextInput('');
      setParsedResult(null);
      setImportSuccessMsg(null);
    }, 1500);
  };

  // Exact Meta by month
  const MONTHLY_METAS_MAP: Record<string, number> = {
    '2026-01': 4067.54,
    '2026-02': 7148.48,
    '2026-03': 4474.72,
    '2026-04': 3692.83,
    '2026-05': 2816.18,
    '2026-06': 4464.79,
    '2026-07': 5123.33,
    '2026-08': 1316.14,
    '2026-09': 2401.16,
    '2026-10': 5126.55,
    '2026-11': 3563.72,
    '2026-12': 5940.13,
  };

  // Custom High-End Tooltip for Meta x Real 2026 Chart
  const CustomComparativoTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0]?.payload;
    if (!data) return null;

    const mesLabel = formatMesAno(data.mes || label || '');
    const realVal = data.sclAtual;
    const metaVal = data.sclMeta;
    const isPendente = realVal === null || realVal === undefined;
    const gap = !isPendente ? realVal - metaVal : null;
    const isDentro = gap !== null && gap <= 0;
    const atingimentoPct = !isPendente && metaVal > 0 ? (realVal / metaVal) * 100 : null;

    return (
      <div className="bg-slate-950/95 backdrop-blur-md border border-slate-700/90 rounded-xl p-3.5 shadow-2xl min-w-[250px] text-xs font-sans ring-1 ring-white/10">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2.5 gap-2">
          <div className="flex items-center gap-1.5 font-bold text-white tracking-wide text-sm">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span>{mesLabel}</span>
          </div>
          {isPendente ? (
            <span className="bg-slate-800 text-slate-300 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-slate-700">
              Pendente
            </span>
          ) : isDentro ? (
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/40 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Dentro da Meta
            </span>
          ) : (
            <span className="bg-rose-500/20 text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-500/40 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              Acima da Meta
            </span>
          )}
        </div>

        <div className="space-y-2">
          {/* Meta Orçada */}
          <div className="flex items-center justify-between bg-slate-900/90 px-2.5 py-1.5 rounded-lg border border-slate-800">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-slate-300 font-medium">Meta 2026:</span>
            </div>
            <span className="font-mono font-bold text-amber-400">{formatCurrency(metaVal)}</span>
          </div>

          {/* Realizado */}
          <div className="flex items-center justify-between bg-slate-900/90 px-2.5 py-1.5 rounded-lg border border-slate-800">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isPendente ? 'bg-slate-500' : isDentro ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              <span className="text-slate-300 font-medium">Real 2026:</span>
            </div>
            <span className={`font-mono font-bold ${isPendente ? 'text-slate-400 italic' : isDentro ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isPendente ? 'Ainda não temos' : formatCurrency(realVal)}
            </span>
          </div>

          {/* Gap & Atingimento if realized */}
          {!isPendente && gap !== null && atingimentoPct !== null && (
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-medium">
                {isDentro ? 'Economia no Mês:' : 'Desvio no Mês:'}
              </span>
              <span className={`font-mono font-bold ${isDentro ? 'text-emerald-400' : 'text-rose-400'}`}>
                {gap <= 0 ? '-' : '+'}{formatCurrency(Math.abs(gap))} ({atingimentoPct.toFixed(1)}%)
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Custom High-End Tooltip for Gap Chart
  const CustomGapTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0]?.payload;
    if (!data) return null;

    const mesLabel = formatMesAno(data.mes || label || '');
    const realVal = data.sclAtual;
    const metaVal = data.sclMeta;
    const isPendente = realVal === null || realVal === undefined;
    const gap = !isPendente ? realVal - metaVal : null;
    const isEconomia = gap !== null && gap <= 0;

    return (
      <div className="bg-slate-950/95 backdrop-blur-md border border-slate-700/90 rounded-xl p-3.5 shadow-2xl min-w-[250px] text-xs font-sans ring-1 ring-white/10">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2.5 gap-2">
          <div className="flex items-center gap-1.5 font-bold text-white tracking-wide text-sm">
            <Calendar className="w-3.5 h-3.5 text-sky-400" />
            <span>{mesLabel}</span>
          </div>
          {isPendente ? (
            <span className="bg-slate-800 text-slate-300 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-slate-700">
              Pendente
            </span>
          ) : isEconomia ? (
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/40">
              Economia (Abaixo)
            </span>
          ) : (
            <span className="bg-rose-500/20 text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-500/40">
              Desvio (Acima)
            </span>
          )}
        </div>

        <div className="space-y-2">
          {!isPendente && gap !== null ? (
            <>
              <div className="flex items-center justify-between bg-slate-900/90 px-2.5 py-1.5 rounded-lg border border-slate-800">
                <span className="text-slate-300 font-medium">Variação Real vs Meta:</span>
                <span className={`font-mono text-sm font-black ${isEconomia ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {gap <= 0 ? '-' : '+'}{formatCurrency(Math.abs(gap))}
                </span>
              </div>
              <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800/80 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Meta Orçada:</span>
                  <span className="font-mono text-amber-400 font-bold">{formatCurrency(metaVal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Real Apurado:</span>
                  <span className={`font-mono font-bold ${isEconomia ? 'text-emerald-400' : 'text-rose-400'}`}>{formatCurrency(realVal)}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-slate-400 text-center py-1">
              Real ainda não apurado para este mês.
            </div>
          )}
        </div>
      </div>
    );
  };

  // Custom High-End Tooltip for Pareto Chart
  const CustomParetoTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0]?.payload;
    if (!data) return null;

    const motivo = data.motivo || label || '';
    const valor = data.valor || 0;
    const acumulado = data.acumulado || 0;

    return (
      <div className="bg-slate-950/95 backdrop-blur-md border border-slate-700/90 rounded-xl p-3.5 shadow-2xl min-w-[260px] text-xs font-sans ring-1 ring-white/10">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2.5 gap-2">
          <span className="font-bold text-white tracking-wide text-sm truncate max-w-[170px]" title={motivo}>
            {motivo}
          </span>
          {acumulado <= 80.5 ? (
            <span className="bg-rose-500/20 text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-500/40">
              Zona Vital (80%)
            </span>
          ) : (
            <span className="bg-sky-500/20 text-sky-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-sky-500/40">
              Cauda (20%)
            </span>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between bg-slate-900/90 px-2.5 py-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-300 font-medium">Prejuízo Financeiro:</span>
            <span className="font-mono font-black text-rose-400 text-sm">{formatCurrency(valor)}</span>
          </div>

          <div className="flex items-center justify-between bg-slate-900/90 px-2.5 py-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-300 font-medium">% Acumulado Pareto:</span>
            <span className="font-mono font-bold text-sky-400">{acumulado.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    );
  };

  // Dynamic Month KPIs calculated dynamically from filteredPerdas and sliced by Time Horizon
  const chartMonthKPIs = useMemo(() => {
    const monthsSet = new Set<string>();
    kpis.forEach((k) => monthsSet.add(k.mes));
    filteredPerdas.forEach((p) => {
      if (p.mesRef) monthsSet.add(p.mesRef);
    });
    // Ensure all 12 months of 2026 are included in chronological sequence
    for (let m = 1; m <= 12; m++) {
      monthsSet.add(`2026-${String(m).padStart(2, '0')}`);
    }

    const sortedMonths = Array.from(monthsSet).sort();

    const full12Months = sortedMonths.map((mes) => {
      const baseKPI = kpis.find((k) => k.mes === mes);
      const perdasDoMes = filteredPerdas.filter((p) => p.mesRef === mes);
      const hasReal = perdasDoMes.length > 0;
      const sclAtual = hasReal ? Number(perdasDoMes.reduce((acc, p) => acc + p.valorR$, 0).toFixed(2)) : null;
      const sclMeta = MONTHLY_METAS_MAP[mes] ?? (baseKPI?.sclMeta || 4595.76);
      const sclAnterior = baseKPI?.sclAnterior ?? (sclAtual !== null ? Number((sclAtual * 0.95).toFixed(2)) : 0);

      return {
        id: baseKPI?.id || `kpi-${mes}`,
        mes,
        sclAtual, // null if future/no records yet
        sclMeta,
        sclAnterior,
        count: perdasDoMes.length,
        hasReal,
      };
    });

    if (timeHorizon === '4m') {
      return full12Months.slice(-4);
    }
    if (timeHorizon === '6m') {
      return full12Months.slice(-6);
    }
    return full12Months; // 'anual' => all 12 months of 2026
  }, [kpis, filteredPerdas, timeHorizon]);

  // Annual / Period Consolidated Totals for Summary
  const periodTotals = useMemo(() => {
    const realizedList = chartMonthKPIs.filter((k) => k.sclAtual !== null);
    const totalSCLReal = realizedList.reduce((acc, k) => acc + (k.sclAtual || 0), 0);
    const totalSCLMeta = chartMonthKPIs.reduce((acc, k) => acc + k.sclMeta, 0);
    const gapTotal = totalSCLReal - totalSCLMeta;
    const atingimentoMedio = totalSCLMeta > 0 ? (totalSCLReal / totalSCLMeta) * 100 : 0;
    const mediaMensalReal = realizedList.length > 0 ? totalSCLReal / realizedList.length : 0;

    return {
      totalSCLReal,
      totalSCLMeta,
      gapTotal,
      atingimentoMedio,
      mediaMensalReal,
      monthsCount: chartMonthKPIs.length,
    };
  }, [chartMonthKPIs]);

  // Calculate Pareto data from filtered perdas (100% Financial R$)
  const motiveLossMap: Record<string, number> = {};
  filteredPerdas.forEach((p) => {
    const mot = (p.motivo || 'OUTROS').trim().toUpperCase();
    motiveLossMap[mot] = (motiveLossMap[mot] || 0) + p.valorR$;
  });

  const totalFilteredValor = filteredPerdas.reduce((acc, p) => acc + p.valorR$, 0);

  const rawParetoSorted = Object.entries(motiveLossMap)
    .map(([motivo, valor]) => ({
      motivo,
      valor,
      percent: totalFilteredValor > 0 ? (valor / totalFilteredValor) * 100 : 0,
    }))
    .sort((a, b) => b.valor - a.valor);

  // Group into Top N + "DEMAIS MOTIVOS" if necessary
  let paretoData = rawParetoSorted;
  if (paretoLimit === 'top8' && rawParetoSorted.length > 8) {
    const top = rawParetoSorted.slice(0, 8);
    const rest = rawParetoSorted.slice(8);
    const restVal = rest.reduce((sum, item) => sum + item.valor, 0);
    const restPercent = rest.reduce((sum, item) => sum + item.percent, 0);
    if (restVal > 0) {
      top.push({
        motivo: 'DEMAIS MOTIVOS',
        valor: restVal,
        percent: restPercent,
      });
    }
    paretoData = top;
  } else if (paretoLimit === 'top12' && rawParetoSorted.length > 12) {
    const top = rawParetoSorted.slice(0, 12);
    const rest = rawParetoSorted.slice(12);
    const restVal = rest.reduce((sum, item) => sum + item.valor, 0);
    const restPercent = rest.reduce((sum, item) => sum + item.percent, 0);
    if (restVal > 0) {
      top.push({
        motivo: 'DEMAIS MOTIVOS',
        valor: restVal,
        percent: restPercent,
      });
    }
    paretoData = top;
  }

  // Cumulative percentage calculation for Pareto
  let acum = 0;
  const paretoChartData = paretoData.map((d) => {
    acum += d.percent;
    return {
      ...d,
      acumulado: Number(Math.min(100, acum).toFixed(1)),
    };
  });

  // Gap for current month
  const currentMonthGap = currentMonthKPI.sclAtual - currentMonthKPI.sclMeta;
  const currentMonthAtingimento = currentMonthKPI.sclMeta > 0 ? (currentMonthKPI.sclAtual / currentMonthKPI.sclMeta) * 100 : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Info */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-amber-500 text-slate-950 font-bold text-xs uppercase px-2.5 py-0.5 rounded-md tracking-wider">
              Gestão Financeira AMBEV 2026
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Mês Referência: <strong className="text-amber-400">{formatMesAno(currentMonthKPI.mes)}</strong>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Painel Executivo do Pacote Prejuízo (SCL R$)
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl">
            Monitoramento 100% financeiro do orçamento de perdas operacionais, comparativo Meta vs Real 2026 e eficiência de custos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-start xl:justify-end">
          <div className="flex items-center gap-4 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
            <div className="text-right">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                Prejuízo Real Acumulado
              </div>
              <div className="text-xl font-extrabold text-emerald-400 font-mono">
                {formatCurrency(periodTotals.totalSCLReal)}
              </div>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div className="text-left">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                Meta Orçada Acumulada
              </div>
              <div className="text-xl font-extrabold text-amber-400 font-mono">
                {formatCurrency(periodTotals.totalSCLMeta)}
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-4 py-3 rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer whitespace-nowrap"
            title="Importar arquivo JSON de quebras para alimentar toda a análise anual"
          >
            <Upload className="w-4 h-4 text-slate-950" />
            <span>Importar JSON de Quebras</span>
          </button>
        </div>
      </div>

      {/* 4 MAIN FINANCIAL SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Prejuízo Real Mês Atual */}
        <div
          onClick={() => setActiveTab('scl')}
          className="group bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-4 transition-all duration-200 shadow-md hover:shadow-xl cursor-pointer relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
              Real 2026 ({formatMesCurto(currentMonthKPI.mes)})
            </span>
            <div className="p-2 rounded-lg bg-slate-800 group-hover:bg-emerald-500/10 transition-colors">
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {formatCurrency(currentMonthKPI.sclAtual)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800">
            <span>Meta: <strong className="text-slate-200 font-mono">{formatCurrency(currentMonthKPI.sclMeta)}</strong></span>
            <span className={currentMonthKPI.sclAtual <= currentMonthKPI.sclAnterior ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
              {currentMonthKPI.sclAtual <= currentMonthKPI.sclAnterior ? 'Melhora vs Ant.' : 'Aumento vs Ant.'}
            </span>
          </div>
        </div>

        {/* Card 2: Meta 2026 Mês Atual */}
        <div
          onClick={() => setActiveTab('scl')}
          className="group bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-4 transition-all duration-200 shadow-md hover:shadow-xl cursor-pointer relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
              Meta Orçada 2026
            </span>
            <div className="p-2 rounded-lg bg-slate-800 group-hover:bg-amber-500/10 transition-colors">
              <Building className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">
            {formatCurrency(currentMonthKPI.sclMeta)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800">
            <span>Orçamento CD</span>
            <span className="text-amber-400 font-semibold">{formatMesAno(currentMonthKPI.mes)}</span>
          </div>
        </div>

        {/* Card 3: Desvio / Gap Financeiro */}
        <div
          onClick={() => setActiveTab('scl')}
          className="group bg-slate-900 border border-slate-800 hover:border-sky-500/50 rounded-2xl p-4 transition-all duration-200 shadow-md hover:shadow-xl cursor-pointer relative overflow-hidden"
        >
          <div className={`absolute top-0 left-0 right-0 h-1 ${currentMonthGap <= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
              Desvio Orçamentário (Gap)
            </span>
            <div className="p-2 rounded-lg bg-slate-800 group-hover:bg-sky-500/10 transition-colors">
              {currentMonthGap <= 0 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              )}
            </div>
          </div>
          <div className={`text-2xl font-black font-mono ${currentMonthGap <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {currentMonthGap <= 0 ? '-' : '+'}{formatCurrency(Math.abs(currentMonthGap))}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800">
            <span>{currentMonthGap <= 0 ? (currentMonthKPI.mes === 'Consolidado' ? 'Economia no Ano' : 'Economia no Mês') : (currentMonthKPI.mes === 'Consolidado' ? 'Estouro no Ano' : 'Estouro no Mês')}</span>
            <span className={currentMonthGap <= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
              {currentMonthGap <= 0 ? 'DENTRO DA META' : 'FORA DA META'}
            </span>
          </div>
        </div>

        {/* Card 4: % Atingimento da Meta */}
        <div
          onClick={() => setActiveTab('scl')}
          className="group bg-slate-900 border border-slate-800 hover:border-purple-500/50 rounded-2xl p-4 transition-all duration-200 shadow-md hover:shadow-xl cursor-pointer relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-purple-500" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
              % Atingimento Orçado
            </span>
            <div className="p-2 rounded-lg bg-slate-800 group-hover:bg-purple-500/10 transition-colors">
              <Percent className="w-4 h-4 text-purple-400" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-400 font-mono">
            {currentMonthAtingimento.toFixed(1)}%
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800">
            <span>Média 2026: <strong className="text-slate-200">{formatCurrency(periodTotals.mediaMensalReal)}/mês</strong></span>
            <span className="text-slate-400 font-mono">{chartMonthKPIs.length} meses</span>
          </div>
        </div>
      </div>

      {/* TIME HORIZON SELECTOR & EVOLUTION CHARTS */}
      <div className="space-y-4">
        {/* Time Horizon Selector Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-amber-500/10 rounded-lg border border-amber-500/20">
              <Calendar className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <span className="text-xs font-black text-white uppercase tracking-wider block">
                Evolução Financeira Anual 2026
              </span>
              <span className="text-[11px] text-slate-400">
                {timeHorizon === 'anual'
                  ? 'Comparativo Mensal Consolidado (Janeiro a Dezembro de 2026)'
                  : timeHorizon === '6m'
                  ? 'Tendência dos Últimos 6 Meses'
                  : 'Tendência dos Últimos 4 Meses'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setTimeHorizon('anual')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                timeHorizon === 'anual'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Visão Anual 2026 (12 Meses)</span>
            </button>
            <button
              onClick={() => setTimeHorizon('6m')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                timeHorizon === '6m'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>6 Meses</span>
            </button>
            <button
              onClick={() => setTimeHorizon('4m')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                timeHorizon === '4m'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>4 Meses</span>
            </button>
          </div>
        </div>

        {/* 2 MAIN FINANCIAL COMPARISON CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Comparativo Meta 2026 x Real 2026 (R$) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span>Comparativo Meta 2026 x Real 2026 (R$)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Prejuízo Financeiro Realizado vs Orçamento de Meta SCL (R$)
                </p>
              </div>
              <button
                onClick={() => setActiveTab('scl')}
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
              >
                <span>Detalhar SCL</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartMonthKPIs} margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                  <XAxis
                    dataKey="mes"
                    tickFormatter={formatMesCurto}
                    stroke="#94a3b8"
                    fontSize={10}
                    interval={0}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#10b981"
                    fontSize={10}
                    tickFormatter={(v) => `R$${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v}`}
                  />
                  <Tooltip
                    content={<CustomComparativoTooltip />}
                    cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar
                    dataKey="sclAtual"
                    name="Real 2026 (R$)"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                    barSize={timeHorizon === 'anual' ? 20 : 36}
                  >
                    {chartMonthKPIs.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.sclAtual !== null ? (entry.sclAtual <= entry.sclMeta ? '#10b981' : '#ef4444') : 'transparent'}
                      />
                    ))}
                  </Bar>
                  <Line
                    type="monotone"
                    dataKey="sclMeta"
                    name="Meta 2026 (R$)"
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                    strokeWidth={2.5}
                    dot={{ r: 3.5, fill: '#f59e0b' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm" /> Dentro da Meta
                <span className="w-2.5 h-2.5 bg-rose-500 rounded-sm ml-2" /> Acima da Meta
              </span>
              <span className="font-mono text-slate-300">
                Total Real: <strong className="text-emerald-400">{formatCurrency(periodTotals.totalSCLReal)}</strong>
              </span>
            </div>
          </div>

          {/* Chart 2: Variação Orçamentária Mensal (Desvio R$) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-sky-400" />
                  <span>Variação Orçamentária / Gap Mensal (R$)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Diferença Real vs Meta (+ Desvio Acima / - Economia Abaixo da Meta)
                </p>
              </div>
              <button
                onClick={() => setActiveTab('revisao')}
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
              >
                <span>Revisão Mensal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartMonthKPIs.map((k) => ({
                    ...k,
                    gap: k.sclAtual !== null ? Number((k.sclAtual - k.sclMeta).toFixed(2)) : null,
                  }))}
                  margin={{ top: 15, right: 15, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                  <XAxis
                    dataKey="mes"
                    tickFormatter={formatMesCurto}
                    stroke="#94a3b8"
                    fontSize={10}
                    interval={0}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={10}
                    tickFormatter={(v) => `R$${v >= 1000 || v <= -1000 ? (v / 1000).toFixed(1) + 'k' : v}`}
                  />
                  <Tooltip
                    content={<CustomGapTooltip />}
                    cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                  />
                  <ReferenceLine y={0} stroke="#64748b" strokeWidth={1.5} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar
                    dataKey="gap"
                    name="Variação Real vs Meta (R$)"
                    radius={[4, 4, 0, 0]}
                    barSize={timeHorizon === 'anual' ? 20 : 36}
                  >
                    {chartMonthKPIs.map((entry, index) => {
                      if (entry.sclAtual === null) {
                        return <Cell key={`gap-cell-${index}`} fill="transparent" />;
                      }
                      const gap = entry.sclAtual - entry.sclMeta;
                      return (
                        <Cell
                          key={`gap-cell-${index}`}
                          fill={gap <= 0 ? '#10b981' : '#ef4444'}
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm" /> Economia (Abaixo)
                <span className="w-2.5 h-2.5 bg-rose-500 rounded-sm ml-2" /> Desvio (Acima)
              </span>
              <span className="font-mono text-slate-300">
                Gap Total: <strong className={periodTotals.gapTotal <= 0 ? 'text-emerald-400' : 'text-rose-400'}>{periodTotals.gapTotal <= 0 ? '-' : '+'}{formatCurrency(Math.abs(periodTotals.gapTotal))}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* PARETO CHART SECTION (100% FINANCIAL R$) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Análise de Pareto – Prejuízo Financeiro por Motivo (R$)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Regra 80/20: Identificação dos motivos que concentram a maior fatia dos custos de avarias
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Pareto Limit Switch */}
            <div className="bg-slate-950 p-0.5 rounded-lg border border-slate-800 flex text-[11px]">
              <button
                onClick={() => setParetoLimit('top8')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  paretoLimit === 'top8'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Exibir os 8 maiores motivos e agrupar o restante em Outros"
              >
                Top 8
              </button>
              <button
                onClick={() => setParetoLimit('top12')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  paretoLimit === 'top12'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Top 12
              </button>
              <button
                onClick={() => setParetoLimit('all')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  paretoLimit === 'all'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Todos ({rawParetoSorted.length})
              </button>
            </div>

            {/* Ver Detalhes -> Árvore de Decomposição / Hierarquia */}
            <button
              id="btn-open-pareto-tree-modal"
              onClick={() => setIsQuebrasTreeModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all cursor-pointer shadow-md ml-1 group"
              title="Abrir a Árvore de Decomposição Financeira do Prejuízo por Motivo"
            >
              <Network className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              <span>Ver Detalhes (Árvore de Hierarquia)</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={paretoChartData} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
              <XAxis
                dataKey="motivo"
                stroke="#cbd5e1"
                fontSize={10}
                interval={0}
                angle={-25}
                textAnchor="end"
                height={55}
                dy={10}
                tickFormatter={(val: string) => {
                  if (!val) return '';
                  if (val.length > 15) {
                    return `${val.slice(0, 13)}…`;
                  }
                  return val;
                }}
              />
              <YAxis
                yAxisId="left"
                stroke="#f59e0b"
                fontSize={10}
                tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#38bdf8"
                fontSize={10}
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                content={<CustomParetoTooltip />}
                cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
              />
              <Bar
                yAxisId="left"
                dataKey="valor"
                name="Valor Perdas (R$)"
                fill="#f59e0b"
                radius={[4, 4, 0, 0]}
              >
                {paretoChartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      index === 0
                        ? '#ef4444'
                        : index === 1
                        ? '#f97316'
                        : index === 2
                        ? '#f59e0b'
                        : '#3b82f6'
                    }
                  />
                ))}
              </Bar>
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="acumulado"
                name="% Acumulado"
                stroke="#38bdf8"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#38bdf8' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* RECENT LOSSES FEED (100% FINANCIAL R$) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Últimas Ocorrências Registradas</span>
            </h3>
            <p className="text-xs text-slate-400">
              Registros mais recentes de perdas financeiras no armazém
            </p>
          </div>
          <button
            onClick={() => setActiveTab('historico')}
            className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
          >
            <span>Ver Histórico Completo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {filteredPerdas.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            Nenhuma ocorrência encontrada com os filtros selecionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider font-bold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Data / Turno</th>
                  <th className="py-2.5 px-3">Área</th>
                  <th className="py-2.5 px-3">Produto / SKU</th>
                  <th className="py-2.5 px-3">Motivo / Causa</th>
                  <th className="py-2.5 px-3 text-right">Qtd</th>
                  <th className="py-2.5 px-3 text-right">Valor Avaria (R$)</th>
                  <th className="py-2.5 px-3">Responsável</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                {filteredPerdas.slice(0, 5).map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="font-mono text-slate-200">{formatDateBR(p.data)}</div>
                      <div className="text-[10px] text-slate-500">{p.turno}</div>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[11px]">
                        {p.area}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-100 max-w-xs truncate">
                      {p.produto}
                    </td>
                    <td className="py-2.5 px-3 max-w-xs">
                      <div className="text-amber-400 font-bold text-[11px]">
                        {p.codigoMotivo} - {p.motivo}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">{p.causa}</div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                      {p.quantidade} un/cx
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                      {formatCurrency(p.valorR$)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px] truncate max-w-xs">
                      {p.responsavel}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* JSON IMPORT MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400">
                  <FileJson className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Importar Arquivo JSON de Quebras (Base Oficial 2026)</h3>
                  <p className="text-xs text-slate-400">
                    Alimenta automaticamente todo o Painel Executivo, gráficos anuais, Pareto e árvore de perdas.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setJsonTextInput('');
                  setParsedResult(null);
                  setImportSuccessMsg(null);
                }}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Success Message Banner */}
            {importSuccessMsg && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl flex items-center gap-3 text-xs font-bold animate-fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <span>{importSuccessMsg}</span>
              </div>
            )}

            {/* UPLOAD & PASTE CONTROLS */}
            <div className="space-y-4">
              {/* File Upload Drop Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-amber-500/60 bg-slate-950/60 hover:bg-slate-950 p-5 rounded-2xl text-center cursor-pointer transition-all group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Upload className="w-7 h-7 text-amber-400 mx-auto mb-1.5 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-bold text-slate-200">
                  Clique aqui para selecionar seu arquivo <span className="text-amber-400 font-mono">.json</span> de quebras
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Mapeamento automático de <code className="text-amber-400">Data</code>, <code className="text-amber-400">Mês</code>, <code className="text-amber-400">CodProduto</code>, <code className="text-amber-400">Descricao</code>, <code className="text-amber-400">CodQuebra</code>, <code className="text-amber-400">Motivo</code>, <code className="text-amber-400">Colaborador</code>, <code className="text-amber-400">Funcao</code>, <code className="text-amber-400">VALOR DA AVARIA</code>, <code className="text-amber-400">HECTO LITRO</code> e <code className="text-amber-400">HECTO PERDIDO</code>.
                </div>
              </div>

              {/* Text Area for Pasting JSON */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Ou cole o código JSON diretamente no campo abaixo:
                  </label>
                  <button
                    type="button"
                    onClick={handleLoadSampleJSON}
                    className="text-[11px] font-bold text-amber-400 hover:text-amber-300 underline flex items-center gap-1 cursor-pointer"
                  >
                    <FileType className="w-3.5 h-3.5" />
                    Carregar Exemplo de Quebras 2026
                  </button>
                </div>
                <textarea
                  rows={5}
                  placeholder={`[\n  {\n    "Data": "2026-01-01 11:59:15",\n    "Mês": "JANEIRO",\n    "CodProduto": 21020,\n    "Descricao": "BUDWEISER 350ML",\n    "Quantidade": 1,\n    "Area": "ARMAZEM",\n    "Turno": "Noite",\n    "CodQuebra": 524,\n    "Motivo": "FALTA NO PALETE",\n    "Colaborador": "RONILDO",\n    "Funcao": "EMPILHADOR",\n    "VALOR DA AVARIA": 2.648683333333333,\n    "HECTO LITRO": 0.0035,\n    "HECTO PERDIDO ": 0.0035\n  }\n]`}
                  value={jsonTextInput}
                  onChange={(e) => handleTextChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* PARSED STATUS AND PREVIEW */}
              {parsedResult && (
                <div className="space-y-3">
                  {parsedResult.errors.length > 0 && (
                    <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-xl text-xs space-y-1">
                      <div className="flex items-center gap-2 font-bold text-rose-400">
                        <AlertCircle className="w-4 h-4" />
                        <span>Avisos de processamento:</span>
                      </div>
                      <ul className="list-disc list-inside text-[11px] space-y-0.5 text-rose-300/90">
                        {parsedResult.errors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {parsedResult.records.length > 0 && (
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>
                            {parsedResult.records.length} registro(s) identificado(s) com sucesso!
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">
                          Total R$: <strong className="text-emerald-400">{formatCurrency(parsedResult.records.reduce((a, b) => a + b.valorR$, 0))}</strong> | Total HL: <strong className="text-sky-400">{formatHL(parsedResult.records.reduce((a, b) => a + b.hlPerdido, 0), 4)}</strong>
                        </div>
                      </div>

                      {/* Preview Table with full fields */}
                      <div className="max-h-48 overflow-y-auto border border-slate-800 rounded-lg">
                        <table className="w-full text-left text-[11px]">
                          <thead className="bg-slate-900 text-slate-400 font-bold sticky top-0 uppercase text-[9px]">
                            <tr>
                              <th className="py-2 px-2.5">Data / Hora</th>
                              <th className="py-2 px-2.5">Mês</th>
                              <th className="py-2 px-2.5">Cód. SKU</th>
                              <th className="py-2 px-2.5">Descrição</th>
                              <th className="py-2 px-2.5">Área / Turno</th>
                              <th className="py-2 px-2.5">Cód. Quebra</th>
                              <th className="py-2 px-2.5">Motivo</th>
                              <th className="py-2 px-2.5 text-right">Qtd</th>
                              <th className="py-2 px-2.5 text-right">HL Perdido</th>
                              <th className="py-2 px-2.5 text-right">Valor Avaria</th>
                              <th className="py-2 px-2.5">Colaborador / Função</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                            {parsedResult.records.map((r, i) => (
                              <tr key={i} className="hover:bg-slate-900/60">
                                <td className="py-1.5 px-2.5 whitespace-nowrap text-white font-bold">{r.dataHora || r.data}</td>
                                <td className="py-1.5 px-2.5 uppercase text-amber-400 font-bold text-[10px]">{r.mesNome || 'JANEIRO'}</td>
                                <td className="py-1.5 px-2.5 text-sky-300 font-bold">{r.codProduto || '-'}</td>
                                <td className="py-1.5 px-2.5 truncate max-w-[140px] font-sans font-semibold text-white">
                                  {r.descricaoProduto || r.produto}
                                </td>
                                <td className="py-1.5 px-2.5 whitespace-nowrap font-sans text-slate-400 text-[10px]">
                                  {r.area} ({r.turno})
                                </td>
                                <td className="py-1.5 px-2.5 text-amber-400 font-bold">{r.codQuebra || r.codigoMotivo}</td>
                                <td className="py-1.5 px-2.5 font-sans font-bold text-amber-300 text-[10px] truncate max-w-[120px]">{r.motivo}</td>
                                <td className="py-1.5 px-2.5 text-right font-bold text-white">{r.quantidade}</td>
                                <td className="py-1.5 px-2.5 text-right text-sky-400 font-bold">
                                  {formatHL(r.hlPerdido, 4)}
                                </td>
                                <td className="py-1.5 px-2.5 text-right text-emerald-400 font-bold">
                                  {formatCurrency(r.valorR$)}
                                </td>
                                <td className="py-1.5 px-2.5 truncate max-w-[130px] font-sans text-slate-300 text-[10px]">
                                  {r.colaborador || r.responsavel} {r.funcao ? `(${r.funcao})` : ''}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* OVERWRITE OR APPEND MODE OPTIONS */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
                <span className="font-bold text-slate-200 block text-xs uppercase tracking-wider">
                  Configuração da Base de Dados:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setOverwriteMode(true)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                      overwriteMode
                        ? 'bg-amber-500/10 border-amber-500/60 text-white shadow-sm'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={overwriteMode}
                      onChange={() => setOverwriteMode(true)}
                      className="accent-amber-500 mt-0.5"
                    />
                    <div>
                      <div className="font-bold text-amber-400">
                        ⭐ Tornar este JSON como Base Oficial Padrão
                      </div>
                      <div className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                        Substitui o histórico anterior e define este lote JSON como a base oficial 2026 da plataforma.
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => setOverwriteMode(false)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                      !overwriteMode
                        ? 'bg-sky-500/10 border-sky-500/60 text-white shadow-sm'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={!overwriteMode}
                      onChange={() => setOverwriteMode(false)}
                      className="accent-sky-500 mt-0.5"
                    />
                    <div>
                      <div className="font-bold text-sky-400">
                        ➕ Apenas Adicionar Registros
                      </div>
                      <div className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                        Mantém os registros já existentes no histórico e incrementa os novos dados deste JSON.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* MODAL FOOTER BUTTONS */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setJsonTextInput('');
                  setParsedResult(null);
                  setImportSuccessMsg(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={!parsedResult || parsedResult.records.length === 0}
                onClick={handleConfirmImport}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-black text-xs transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
              >
                <Database className="w-4 h-4" />
                <span>
                  Confirmar Importação de {parsedResult ? parsedResult.records.length : 0} Registros
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quebras Hierarchy Decomposition Tree Modal */}
      <QuebrasTreeModal
        isOpen={isQuebrasTreeModalOpen}
        onClose={() => setIsQuebrasTreeModalOpen(false)}
        perdas={filteredPerdas}
      />
    </div>
  );
};
