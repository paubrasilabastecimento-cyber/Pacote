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
  Droplet,
  Package,
  Globe,
  Link as LinkIcon,
  Loader2,
  DownloadCloud,
  ExternalLink,
  FileCode,
} from 'lucide-react';
import { QuebrasTreeModal } from './QuebrasTreeModal';
import { QuebrasHierarchyTree } from './QuebrasHierarchyTree';
import { TabHeaderBanner } from './common/TabHeaderBanner';
import {
  fetchDataFromGitHubOrUrl,
  isWebOrGitHubUrl,
  normalizeGitHubRawUrl,
} from '../utils/githubUrlFetcher';
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

  // Metric Filter: 'valor' (R$ - Real) or 'hl' (HL - Hectolitro)
  const [unitMetric, setUnitMetric] = useState<'valor' | 'hl'>(() => {
    try {
      const saved = localStorage.getItem('AMBEV_PERDAS_PA_METRIC');
      if (saved === 'hl' || saved === 'valor') return saved;
    } catch {}
    return 'valor';
  });

  const handleSelectMetric = (m: 'valor' | 'hl') => {
    setUnitMetric(m);
    try {
      localStorage.setItem('AMBEV_PERDAS_PA_METRIC', m);
    } catch {}
  };

  // JSON Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [importModalTab, setImportModalTab] = useState<'upload' | 'paste' | 'github'>('github');
  const [jsonTextInput, setJsonTextInput] = useState<string>('');
  const [githubUrlInput, setGithubUrlInput] = useState<string>('');
  const [isLoadingGithub, setIsLoadingGithub] = useState<boolean>(false);
  const [githubError, setGithubError] = useState<string | null>(null);
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
      // Auto-detect if user accidentally pasted a GitHub/Web URL in the textarea
      if (isWebOrGitHubUrl(text.trim())) {
        setGithubUrlInput(text.trim());
      }
      const res = parseQuebrasJSON(text);
      setParsedResult(res);
    } else {
      setParsedResult(null);
    }
  };

  const handleFetchGitHubData = async (urlToFetch?: string) => {
    const targetUrl = (urlToFetch || githubUrlInput).trim();
    if (!targetUrl) {
      setGithubError('Informe o link do arquivo no GitHub (ou URL web).');
      return;
    }

    setIsLoadingGithub(true);
    setGithubError(null);

    const result = await fetchDataFromGitHubOrUrl(targetUrl);
    setIsLoadingGithub(false);

    if (!result.success) {
      setGithubError(result.error || 'Erro ao carregar dados do link informado.');
      return;
    }

    setJsonTextInput(result.rawText);
    const parsed = parseQuebrasJSON(result.data || result.rawText);
    setParsedResult(parsed);

    if (parsed.records.length === 0) {
      setGithubError('O arquivo foi baixado, mas não continha a estrutura esperada de Quebras JSON.');
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

  // Exact Meta by month (Financial R$)
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

  // Exact Meta by month (Volumetric HL - Hectolitros)
  const MONTHLY_METAS_HL_MAP: Record<string, number> = {
    '2026-01': 8.50,
    '2026-02': 8.50,
    '2026-03': 8.50,
    '2026-04': 8.50,
    '2026-05': 8.00,
    '2026-06': 8.00,
    '2026-07': 8.00,
    '2026-08': 7.50,
    '2026-09': 7.50,
    '2026-10': 8.00,
    '2026-11': 8.00,
    '2026-12': 8.50,
  };

  // Helper formatter for dynamic metric display
  const formatMetric = (val: number | null | undefined): string => {
    if (val === null || val === undefined) return 'Pendente';
    if (unitMetric === 'valor') {
      return formatCurrency(val);
    }
    return formatHL(val);
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
              <span className="text-slate-300 font-medium">Meta 2026 ({unitMetric === 'valor' ? 'R$' : 'HL'}):</span>
            </div>
            <span className="font-mono font-bold text-amber-400">{formatMetric(metaVal)}</span>
          </div>

          {/* Realizado */}
          <div className="flex items-center justify-between bg-slate-900/90 px-2.5 py-1.5 rounded-lg border border-slate-800">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isPendente ? 'bg-slate-500' : isDentro ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              <span className="text-slate-300 font-medium">Real 2026 ({unitMetric === 'valor' ? 'R$' : 'HL'}):</span>
            </div>
            <span className={`font-mono font-bold ${isPendente ? 'text-slate-400 italic' : isDentro ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isPendente ? 'Ainda não temos' : formatMetric(realVal)}
            </span>
          </div>

          {/* Gap & Atingimento if realized */}
          {!isPendente && gap !== null && atingimentoPct !== null && (
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-medium">
                {isDentro ? 'Economia no Mês:' : 'Desvio no Mês:'}
              </span>
              <span className={`font-mono font-bold ${isDentro ? 'text-emerald-400' : 'text-rose-400'}`}>
                {gap <= 0 ? '-' : '+'}{formatMetric(Math.abs(gap))} ({atingimentoPct.toFixed(1)}%)
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
                <span className="text-slate-300 font-medium">Variação Real vs Meta ({unitMetric === 'valor' ? 'R$' : 'HL'}):</span>
                <span className={`font-mono text-sm font-black ${isEconomia ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {gap <= 0 ? '-' : '+'}{formatMetric(Math.abs(gap))}
                </span>
              </div>
              <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800/80 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Meta:</span>
                  <span className="font-mono text-amber-400 font-bold">{formatMetric(metaVal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Real Apurado:</span>
                  <span className={`font-mono font-bold ${isEconomia ? 'text-emerald-400' : 'text-rose-400'}`}>{formatMetric(realVal)}</span>
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
            <span className="text-slate-300 font-medium">Perda ({unitMetric === 'valor' ? 'R$' : 'HL'}):</span>
            <span className="font-mono font-black text-rose-400 text-sm">{formatMetric(valor)}</span>
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

      const realValor = hasReal ? Number(perdasDoMes.reduce((acc, p) => acc + (p.valorR$ || 0), 0).toFixed(2)) : null;
      const realHL = hasReal ? Number(perdasDoMes.reduce((acc, p) => acc + (p.hlPerdido || 0), 0).toFixed(4)) : null;

      const sclMetaValor = MONTHLY_METAS_MAP[mes] ?? baseKPI?.sclMeta ?? 4177.96;
      const sclMetaHL = MONTHLY_METAS_HL_MAP[mes] ?? baseKPI?.fgliMeta ?? 8.50;

      const sclAtual = unitMetric === 'valor' ? realValor : realHL;
      const sclMeta = unitMetric === 'valor' ? sclMetaValor : sclMetaHL;

      const baseAnteriorValor = baseKPI?.sclAnterior ?? (realValor !== null ? Number((realValor * 0.95).toFixed(2)) : 0);
      const baseAnteriorHL = baseKPI?.fgliAnterior ?? (realHL !== null ? Number((realHL * 0.95).toFixed(4)) : 0);
      const sclAnterior = unitMetric === 'valor' ? baseAnteriorValor : baseAnteriorHL;

      return {
        id: baseKPI?.id || `kpi-${mes}`,
        mes,
        sclAtual, // null if future/no records yet
        sclMeta,
        sclAnterior,
        realValor,
        realHL,
        metaValor: sclMetaValor,
        metaHL: sclMetaHL,
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
  }, [kpis, filteredPerdas, timeHorizon, unitMetric]);

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

  // Calculate Pareto data from filtered perdas based on selected metric (R$ or HL)
  const motiveLossMap: Record<string, number> = {};
  filteredPerdas.forEach((p) => {
    const mot = (p.motivo || 'OUTROS').trim().toUpperCase();
    const itemVal = unitMetric === 'valor' ? (p.valorR$ || 0) : (p.hlPerdido || 0);
    motiveLossMap[mot] = (motiveLossMap[mot] || 0) + itemVal;
  });

  const totalFilteredMetric = filteredPerdas.reduce(
    (acc, p) => acc + (unitMetric === 'valor' ? (p.valorR$ || 0) : (p.hlPerdido || 0)),
    0
  );

  const rawParetoSorted = Object.entries(motiveLossMap)
    .map(([motivo, valor]) => ({
      motivo,
      valor,
      percent: totalFilteredMetric > 0 ? (valor / totalFilteredMetric) * 100 : 0,
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

  // Dynamic values for current month card based on selected metric (R$ or HL)
  const currentMonthRealVal = useMemo(() => {
    if (unitMetric === 'valor') {
      return currentMonthKPI.sclAtual;
    }
    const perdasMes = filteredPerdas.filter((p) => p.mesRef === currentMonthKPI.mes);
    if (perdasMes.length > 0) {
      return perdasMes.reduce((acc, p) => acc + (p.hlPerdido || 0), 0);
    }
    return currentMonthKPI.fgliAtual || 0;
  }, [unitMetric, currentMonthKPI, filteredPerdas]);

  const currentMonthMetaVal = useMemo(() => {
    if (unitMetric === 'valor') {
      return currentMonthKPI.sclMeta;
    }
    return MONTHLY_METAS_HL_MAP[currentMonthKPI.mes] ?? currentMonthKPI.fgliMeta ?? 8.50;
  }, [unitMetric, currentMonthKPI]);

  const currentMonthAnteriorVal = useMemo(() => {
    if (unitMetric === 'valor') {
      return currentMonthKPI.sclAnterior;
    }
    return currentMonthKPI.fgliAnterior || 0;
  }, [unitMetric, currentMonthKPI]);

  // Gap and Atingimento for current month
  const currentMonthGap = currentMonthRealVal - currentMonthMetaVal;
  const currentMonthAtingimento = currentMonthMetaVal > 0 ? (currentMonthRealVal / currentMonthMetaVal) * 100 : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Info */}
      <TabHeaderBanner
        categoryBadge="MÓDULO 1 • GESTÃO OPERACIONAL"
        categoryIcon={<BarChart3 className="w-3.5 h-3.5 text-blue-400" />}
        title={unitMetric === 'valor' ? 'PAINEL EXECUTIVO DE PERDAS PA (SCL R$)' : 'PAINEL EXECUTIVO DE PERDAS PA (SCL HL)'}
        description={
          <span>
            Monitoramento orçamentário e volumétrico de perdas operacionais • Mês Referência:{' '}
            <strong className="text-amber-300 font-bold">{formatMesAno(currentMonthKPI.mes)}</strong>. Comparativo Meta vs. Real 2026.
          </span>
        }
        rightContent={
          <>
            {/* R$ vs HL Metric Switcher */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-blue-700/60 shadow-inner">
              <button
                id="btn-filter-metric-rs"
                onClick={() => handleSelectMetric('valor')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  unitMetric === 'valor'
                    ? 'bg-amber-400 text-blue-950 shadow-md font-black'
                    : 'text-blue-200 hover:text-white hover:bg-white/10'
                }`}
                title="Filtrar visão em Reais (R$)"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>R$ (Real)</span>
              </button>
              <button
                id="btn-filter-metric-hl"
                onClick={() => handleSelectMetric('hl')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  unitMetric === 'hl'
                    ? 'bg-sky-400 text-blue-950 shadow-md font-black'
                    : 'text-blue-200 hover:text-white hover:bg-white/10'
                }`}
                title="Filtrar visão em Hectolitros (HL)"
              >
                <Droplet className="w-3.5 h-3.5" />
                <span>HL (Hectolitro)</span>
              </button>
            </div>

            {/* Real vs Meta Accumulated Card */}
            <div className="flex items-center gap-3 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-blue-700/60">
              <div className="text-right">
                <div className="text-[9px] text-blue-200 uppercase tracking-wider font-bold">
                  {unitMetric === 'valor' ? 'Prejuízo Real' : 'Volume Real'}
                </div>
                <div className="text-base font-extrabold text-amber-300 font-mono">
                  {formatMetric(periodTotals.totalSCLReal)}
                </div>
              </div>
              <div className="h-6 w-px bg-blue-700/80" />
              <div className="text-left">
                <div className="text-[9px] text-blue-200 uppercase tracking-wider font-bold">
                  {unitMetric === 'valor' ? 'Meta Orçada' : 'Meta HL'}
                </div>
                <div className="text-base font-extrabold text-sky-300 font-mono">
                  {formatMetric(periodTotals.totalSCLMeta)}
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition-all shadow-md active:scale-95 cursor-pointer whitespace-nowrap"
              title="Importar arquivo JSON de quebras para alimentar toda a análise anual"
            >
              <Upload className="w-4 h-4" />
              <span>Importar JSON</span>
            </button>
          </>
        }
      />

      {/* 4 MAIN SUMMARY CARDS (R$ or HL) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Real Mês Atual */}
        <div
          onClick={() => setActiveTab('scl')}
          className="bg-white border border-blue-200/90 hover:border-blue-500 rounded-2xl p-4 sm:p-5 transition-all duration-200 shadow-sm hover:shadow-md shadow-blue-900/5 hover:-translate-y-0.5 cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              1. Real ({formatMesCurto(currentMonthKPI.mes)}) • {unitMetric === 'valor' ? 'R$' : 'HL'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center group-hover:scale-110 transition-transform">
              {unitMetric === 'valor' ? (
                <BarChart3 className="w-4 h-4" />
              ) : (
                <Droplet className="w-4 h-4" />
              )}
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
            {formatMetric(currentMonthRealVal)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>Meta: <strong className="text-slate-800 font-mono">{formatMetric(currentMonthMetaVal)}</strong></span>
            <span className="text-blue-600 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
              Detalhar <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 2: Meta 2026 Mês Atual */}
        <div
          onClick={() => setActiveTab('scl')}
          className="bg-white border border-blue-200/90 hover:border-blue-500 rounded-2xl p-4 sm:p-5 transition-all duration-200 shadow-sm hover:shadow-md shadow-blue-900/5 hover:-translate-y-0.5 cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              2. Meta Orçada 2026 • {unitMetric === 'valor' ? 'R$' : 'HL'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-sky-700 font-mono">
            {formatMetric(currentMonthMetaVal)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>Orçamento CD</span>
            <span className="text-blue-600 font-bold">{formatMesAno(currentMonthKPI.mes)}</span>
          </div>
        </div>

        {/* Card 3: Desvio / Gap (R$ or HL) */}
        <div
          onClick={() => setActiveTab('scl')}
          className="bg-white border border-blue-200/90 hover:border-blue-500 rounded-2xl p-4 sm:p-5 transition-all duration-200 shadow-sm hover:shadow-md shadow-blue-900/5 hover:-translate-y-0.5 cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              3. Desvio Orçamentário (Gap)
            </span>
            <div className={`w-8 h-8 rounded-xl border flex items-center justify-center group-hover:scale-110 transition-transform ${currentMonthGap <= 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
              {currentMonthGap <= 0 ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )}
            </div>
          </div>
          <div className={`text-xl sm:text-2xl font-black font-mono ${currentMonthGap <= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {currentMonthGap <= 0 ? '-' : '+'}{formatMetric(Math.abs(currentMonthGap))}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>{currentMonthGap <= 0 ? 'Economia no Período' : 'Estouro no Período'}</span>
            <span className={currentMonthGap <= 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
              {currentMonthGap <= 0 ? 'DENTRO DA META' : 'FORA DA META'}
            </span>
          </div>
        </div>

        {/* Card 4: % Atingimento da Meta */}
        <div
          onClick={() => setActiveTab('scl')}
          className="bg-gradient-to-br from-blue-900 via-blue-950 to-slate-950 border border-blue-800 rounded-2xl p-4 sm:p-5 shadow-md text-white group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-blue-200">
              4. % Atingimento Orçado
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-600/40 text-blue-300 border border-blue-400/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-300 font-mono">
            {currentMonthAtingimento.toFixed(1)}%
          </div>
          <div className="flex items-center justify-between text-[11px] text-blue-200/80 mt-2 pt-2 border-t border-blue-800/80">
            <span>Média 2026: <strong className="text-white">{formatMetric(periodTotals.mediaMensalReal)}/mês</strong></span>
            <span className="text-emerald-400 font-bold">{chartMonthKPIs.length} meses</span>
          </div>
        </div>
      </div>

      {/* TIME HORIZON SELECTOR & EVOLUTION CHARTS */}
      <div className="space-y-4">
        {/* Time Horizon Selector Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-blue-200 p-3.5 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-black text-blue-950 uppercase tracking-wider block">
                {unitMetric === 'valor' ? 'Evolução Financeira Anual 2026 (R$)' : 'Evolução Volumétrica Anual 2026 (HL)'}
              </span>
              <span className="text-[11px] text-slate-500">
                {timeHorizon === 'anual'
                  ? `Comparativo Mensal Consolidado (Janeiro a Dezembro de 2026) em ${unitMetric === 'valor' ? 'Reais (R$)' : 'Hectolitros (HL)'}`
                  : timeHorizon === '6m'
                  ? 'Tendência dos Últimos 6 Meses'
                  : 'Tendência dos Últimos 4 Meses'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setTimeHorizon('anual')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                timeHorizon === 'anual'
                  ? 'bg-blue-600 text-white shadow-sm font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Visão Anual (12 Meses)</span>
            </button>
            <button
              onClick={() => setTimeHorizon('6m')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                timeHorizon === '6m'
                  ? 'bg-blue-600 text-white shadow-sm font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>6 Meses</span>
            </button>
            <button
              onClick={() => setTimeHorizon('4m')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                timeHorizon === '4m'
                  ? 'bg-blue-600 text-white shadow-sm font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>4 Meses</span>
            </button>
          </div>
        </div>

        {/* 2 MAIN COMPARISON CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Comparativo Meta 2026 x Real 2026 (R$ or HL) */}
          <div className="bg-white border border-blue-200/90 rounded-2xl p-5 shadow-sm shadow-blue-900/5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
                  {unitMetric === 'valor' ? (
                    <DollarSign className="w-4 h-4" />
                  ) : (
                    <Droplet className="w-4 h-4" />
                  )}
                </span>
                <div>
                  <h3 className="font-extrabold text-blue-950 text-sm">
                    {unitMetric === 'valor'
                      ? 'Comparativo Meta 2026 x Real 2026 (R$)'
                      : 'Comparativo Meta 2026 x Real 2026 (HL)'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {unitMetric === 'valor'
                      ? 'Prejuízo Financeiro Realizado vs Orçamento de Meta SCL (R$)'
                      : 'Perda Volumétrica Realizada vs Meta FGLI (HL)'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('scl')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
              >
                <span>Detalhar SCL</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartMonthKPIs} margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="mes"
                    tickFormatter={formatMesCurto}
                    stroke="#94a3b8"
                    fontSize={11}
                    interval={0}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickFormatter={(v) =>
                      unitMetric === 'valor'
                        ? `R$ ${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`
                        : `${v} HL`
                    }
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
                    content={<CustomComparativoTooltip />}
                    cursor={{ fill: 'rgba(59, 130, 246, 0.04)' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar
                    dataKey="sclAtual"
                    name={`Real 2026 (${unitMetric === 'valor' ? 'R$' : 'HL'})`}
                    fill="#f59e0b"
                    radius={[4, 4, 0, 0]}
                    barSize={timeHorizon === 'anual' ? 20 : 36}
                  >
                    {chartMonthKPIs.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.sclAtual !== null ? (entry.sclAtual <= entry.sclMeta ? '#f59e0b' : '#f43f5e') : 'transparent'}
                      />
                    ))}
                  </Bar>
                  <Line
                    type="monotone"
                    dataKey="sclMeta"
                    name={`Meta 2026 (${unitMetric === 'valor' ? 'R$' : 'HL'})`}
                    stroke="#38bdf8"
                    strokeWidth={2.5}
                    dot={{ r: 3.5, fill: '#38bdf8' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-amber-500 rounded-sm" /> Dentro da Meta
                <span className="w-2.5 h-2.5 bg-rose-500 rounded-sm ml-2" /> Acima da Meta
              </span>
              <span className="font-mono text-slate-700">
                Total Real: <strong className="text-slate-900">{formatMetric(periodTotals.totalSCLReal)}</strong>
              </span>
            </div>
          </div>

          {/* Chart 2: Variação Orçamentária Mensal (Desvio R$ or HL) */}
          <div className="bg-white border border-blue-200/90 rounded-2xl p-5 shadow-sm shadow-blue-900/5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-sky-50 text-sky-600 border border-sky-200">
                  <BarChart3 className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-extrabold text-blue-950 text-sm">
                    {unitMetric === 'valor'
                      ? 'Variação Orçamentária / Gap Mensal (R$)'
                      : 'Variação Volumétrica / Gap Mensal (HL)'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Diferença Real vs Meta (+ Desvio Acima / - Economia Abaixo da Meta)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('revisao')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
              >
                <span>Revisão Mensal</span>
                <ArrowRight className="w-3 h-3" />
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
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="mes"
                    tickFormatter={formatMesCurto}
                    stroke="#94a3b8"
                    fontSize={11}
                    interval={0}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickFormatter={(v) =>
                      unitMetric === 'valor'
                        ? `R$ ${v >= 1000 || v <= -1000 ? (v / 1000).toFixed(0) + 'k' : v}`
                        : `${v} HL`
                    }
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
                    content={<CustomGapTooltip />}
                    cursor={{ fill: 'rgba(59, 130, 246, 0.04)' }}
                  />
                  <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1.5} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar
                    dataKey="gap"
                    name={`Variação Real vs Meta (${unitMetric === 'valor' ? 'R$' : 'HL'})`}
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
                          fill={gap <= 0 ? '#10b981' : '#f43f5e'}
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm" /> Economia (Abaixo)
                <span className="w-2.5 h-2.5 bg-rose-500 rounded-sm ml-2" /> Desvio (Acima)
              </span>
              <span className="font-mono text-slate-700">
                Gap Total: <strong className={periodTotals.gapTotal <= 0 ? 'text-emerald-600' : 'text-rose-600'}>{periodTotals.gapTotal <= 0 ? '-' : '+'}{formatMetric(Math.abs(periodTotals.gapTotal))}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* PARETO CHART SECTION (R$ or HL) */}
      <div className="bg-white border border-blue-200 rounded-2xl p-5 shadow-sm shadow-blue-900/5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-blue-950 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>
                {unitMetric === 'valor'
                  ? 'Análise de Pareto – Prejuízo Financeiro por Motivo (R$)'
                  : 'Análise de Pareto – Perda Volumétrica por Motivo (HL)'}
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              {unitMetric === 'valor'
                ? 'Regra 80/20: Identificação dos motivos que concentram a maior fatia dos custos de avarias em R$'
                : 'Regra 80/20: Identificação dos motivos com maior impacto de volume perdido em Hectolitros (HL)'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Pareto Limit Switch */}
            <div className="bg-slate-100 p-0.5 rounded-xl border border-slate-200 flex text-[11px]">
              <button
                onClick={() => setParetoLimit('top8')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  paretoLimit === 'top8'
                    ? 'bg-white text-blue-950 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Exibir os 8 maiores motivos e agrupar o restante em Outros"
              >
                Top 8
              </button>
              <button
                onClick={() => setParetoLimit('top12')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  paretoLimit === 'top12'
                    ? 'bg-white text-blue-950 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Top 12
              </button>
              <button
                onClick={() => setParetoLimit('all')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  paretoLimit === 'all'
                    ? 'bg-white text-blue-950 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Todos ({rawParetoSorted.length})
              </button>
            </div>

            {/* Ver Detalhes -> Árvore de Decomposição / Hierarquia */}
            <button
              id="btn-open-pareto-tree-modal"
              onClick={() => setIsQuebrasTreeModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all cursor-pointer shadow-sm ml-1 group"
              title="Abrir a Árvore de Decomposição por Motivo"
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
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.8} />
              <XAxis
                dataKey="motivo"
                stroke="#64748b"
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
                tickFormatter={(v) =>
                  unitMetric === 'valor'
                    ? `R$${(v / 1000).toFixed(0)}k`
                    : `${v.toFixed(1)} HL`
                }
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#0284c7"
                fontSize={10}
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                content={<CustomParetoTooltip />}
                cursor={{ fill: 'rgba(59, 130, 246, 0.04)' }}
              />
              <Bar
                yAxisId="left"
                dataKey="valor"
                name={unitMetric === 'valor' ? 'Valor Perdas (R$)' : 'Volume Perdido (HL)'}
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
                stroke="#0284c7"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#0284c7' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
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

            {/* TAB SELECTOR */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <button
                type="button"
                onClick={() => setImportModalTab('github')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  importModalTab === 'github'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Globe className="w-4 h-4" />
                <span>Link do GitHub / Web</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/20 font-mono">Recomendado</span>
              </button>

              <button
                type="button"
                onClick={() => setImportModalTab('upload')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  importModalTab === 'upload'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>Upload de Arquivo</span>
              </button>

              <button
                type="button"
                onClick={() => setImportModalTab('paste')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  importModalTab === 'paste'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <FileCode className="w-4 h-4" />
                <span>Colar Código JSON</span>
              </button>
            </div>

            {/* TAB CONTENT */}
            <div className="space-y-4">
              {/* 1. GITHUB / WEB URL TAB */}
              {importModalTab === 'github' && (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div>
                    <label className="text-xs font-bold text-white flex items-center gap-2 mb-1">
                      <Globe className="w-4 h-4 text-amber-400" />
                      Cole o Link do GitHub (Repositório, Arquivo ou Raw):
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Suporta links diretos do GitHub (<code className="text-amber-300 font-mono">github.com/.../blob/...</code> ou <code className="text-amber-300 font-mono">raw.githubusercontent.com</code>). O sistema converte automaticamente para download raw.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                    <div className="relative flex-1">
                      <LinkIcon className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="url"
                        placeholder="https://github.com/usuario/repo/blob/main/quebras.json ou raw.githubusercontent.com/..."
                        value={githubUrlInput}
                        onChange={(e) => {
                          setGithubUrlInput(e.target.value);
                          setGithubError(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleFetchGitHubData();
                          }
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none font-mono"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={isLoadingGithub || !githubUrlInput.trim()}
                      onClick={() => handleFetchGitHubData()}
                      className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    >
                      {isLoadingGithub ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Puxando Dados...</span>
                        </>
                      ) : (
                        <>
                          <DownloadCloud className="w-4 h-4" />
                          <span>Puxar Informações</span>
                        </>
                      )}
                    </button>
                  </div>

                  {githubError && (
                    <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-xl text-xs space-y-1.5">
                      <div className="flex items-center gap-2 font-bold text-rose-400">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>Aviso de Carregamento:</span>
                      </div>
                      <p className="text-[11px] leading-relaxed">{githubError}</p>
                      <div className="text-[10px] text-rose-300/80 bg-rose-950/40 p-2 rounded-lg mt-1 space-y-0.5">
                        <p className="font-semibold">💡 Dicas para links do GitHub:</p>
                        <p>• Certifique-se de que o repositório no GitHub está configurado como <strong>Público (Public)</strong>.</p>
                        <p>• Se o arquivo estiver em um repositório privado, você pode abrir o arquivo no GitHub, copiar o texto e usar a aba <strong>"Colar Código JSON"</strong>.</p>
                      </div>
                    </div>
                  )}

                  {/* Informação sobre conversão automática */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      Conversão inteligente de URL ativa: blob / raw / gists reconhecidos instantaneamente.
                    </span>
                    <button
                      type="button"
                      onClick={handleLoadSampleJSON}
                      className="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
                    >
                      Carregar Exemplo de Quebras 2026
                    </button>
                  </div>
                </div>
              )}

              {/* 2. UPLOAD FILE TAB */}
              {importModalTab === 'upload' && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 hover:border-amber-500/60 bg-slate-950/60 hover:bg-slate-950 p-6 rounded-2xl text-center cursor-pointer transition-all group"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Upload className="w-8 h-8 text-amber-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-xs font-bold text-slate-200">
                    Clique aqui para selecionar seu arquivo <span className="text-amber-400 font-mono">.json</span> de quebras
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1.5">
                    Mapeamento automático de <code className="text-amber-400">Data</code>, <code className="text-amber-400">Mês</code>, <code className="text-amber-400">CodProduto</code>, <code className="text-amber-400">Descricao</code>, <code className="text-amber-400">CodQuebra</code>, <code className="text-amber-400">Motivo</code>, <code className="text-amber-400">Colaborador</code>, <code className="text-amber-400">Funcao</code>, <code className="text-amber-400">VALOR DA AVARIA</code>, <code className="text-amber-400">HECTO LITRO</code> e <code className="text-amber-400">HECTO PERDIDO</code>.
                  </div>
                </div>
              )}

              {/* 3. PASTE CODE TAB */}
              {importModalTab === 'paste' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">
                      Cole o código JSON diretamente no campo abaixo:
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

                  {/* Quick banner if user pasted a link in textarea */}
                  {isWebOrGitHubUrl(jsonTextInput.trim()) && (
                    <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-300">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        <span>Detectamos um link web/GitHub colado! Deseja puxar os dados deste arquivo?</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleFetchGitHubData(jsonTextInput.trim())}
                        disabled={isLoadingGithub}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg cursor-pointer flex items-center gap-1 text-[11px] flex-shrink-0"
                      >
                        {isLoadingGithub ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <DownloadCloud className="w-3.5 h-3.5" />}
                        Puxar do GitHub
                      </button>
                    </div>
                  )}

                  <textarea
                    rows={6}
                    placeholder={`[\n  {\n    "Data": "2026-01-01 11:59:15",\n    "Mês": "JANEIRO",\n    "CodProduto": 21020,\n    "Descricao": "BUDWEISER 350ML",\n    "Quantidade": 1,\n    "Area": "ARMAZEM",\n    "Turno": "Noite",\n    "CodQuebra": 524,\n    "Motivo": "FALTA NO PALETE",\n    "Colaborador": "RONILDO",\n    "Funcao": "EMPILHADOR",\n    "VALOR DA AVARIA": 2.648683333333333,\n    "HECTO LITRO": 0.0035,\n    "HECTO PERDIDO ": 0.0035\n  }\n]`}
                    value={jsonTextInput}
                    onChange={(e) => handleTextChange(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>
              )}

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
