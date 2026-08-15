import React, { useState, useMemo, useRef } from 'react';
import { PerdaItemJSON } from '../types/perdasPor';
import defaultRawData from '../data/perdas_normalizadas.json';
import {
  calculatePerdasPorAnalytics,
  parseExcelOrCsvFile,
  parseJsonFile,
  parseJsonText,
  downloadJsonFile,
  getEmbalagemColor,
} from '../utils/perdasPorAnalytics';
import { PerdasPorHierarchyTree } from './PerdasPorHierarchyTree';
import { formatCurrency } from '../utils/formatters';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';
import {
  Download,
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  TrendingDown,
  Package,
  DollarSign,
  Layers,
  FileCode,
  CheckCircle2,
  Calendar,
  Sparkles,
  Search,
  Filter,
  Copy,
  Info,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileText,
  RotateCcw,
  Check,
  FolderTree,
  Maximize2,
} from 'lucide-react';

export const PerdasPorView: React.FC = () => {
  // Main data state with persistent cache initialization
  const [dataItems, setDataItems] = useState<PerdaItemJSON[]>(() => {
    try {
      const cached = localStorage.getItem('ambev_perdas_por_mercadoria_v1');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return defaultRawData as PerdaItemJSON[];
  });
  const [metricMode, setMetricMode] = useState<'valor' | 'quantidade'>('valor');
  const [filtroMes, setFiltroMes] = useState<string>('todos');
  const [filtroEmbalagem, setFiltroEmbalagem] = useState<string>('todas');
  const [buscaTexto, setBuscaTexto] = useState<string>('');

  // Synchronize with API on mount
  React.useEffect(() => {
    fetch('/api/perdas-por')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setDataItems(data);
          try {
            localStorage.setItem('ambev_perdas_por_mercadoria_v1', JSON.stringify(data));
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  const persistDataItems = (items: PerdaItemJSON[]) => {
    setDataItems(items);
    try {
      localStorage.setItem('ambev_perdas_por_mercadoria_v1', JSON.stringify(items));
    } catch {}
    fetch('/api/perdas-por/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, overwrite: true }),
    }).catch(() => {});
  };

  // Modals / Overlays
  const [showImportJsonModal, setShowImportJsonModal] = useState<boolean>(false);
  const [importJsonTab, setImportJsonTab] = useState<'file' | 'text'>('file');
  const [jsonPastedCode, setJsonPastedCode] = useState<string>('');
  const [jsonParseError, setJsonParseError] = useState<string | null>(null);
  const [showJsonModal, setShowJsonModal] = useState<boolean>(false);
  const [showExecutiveSummary, setShowExecutiveSummary] = useState<boolean>(false);
  const [showTreeModal, setShowTreeModal] = useState<boolean>(false);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<{ message: string; type: 'success' | 'error' | null }>({
    message: '',
    type: null,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);

  // Analytics computation
  const { stats, mesesSummary, topProdutos, embalagensSummary } = useMemo(() => {
    return calculatePerdasPorAnalytics(dataItems);
  }, [dataItems]);

  const totalUniqueSkus = useMemo(() => {
    return new Set(dataItems.map((it) => it.produto)).size;
  }, [dataItems]);

  // Filtered list for the data table
  const filteredItems = useMemo(() => {
    return dataItems.filter((it) => {
      const matchMes = filtroMes === 'todos' || it.dataOperacao.startsWith(filtroMes);
      const matchEmb = filtroEmbalagem === 'todas' || it.embalagem.toUpperCase() === filtroEmbalagem.toUpperCase();
      const matchText =
        !buscaTexto ||
        it.descricao.toLowerCase().includes(buscaTexto.toLowerCase()) ||
        String(it.produto).includes(buscaTexto);
      return matchMes && matchEmb && matchText;
    });
  }, [dataItems, filtroMes, filtroEmbalagem, buscaTexto]);

  // JSON File upload handler (dedicated)
  const handleJsonFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const parsedItems = await parseJsonFile(file);

      if (parsedItems.length === 0) {
        setUploadStatus({
          message: 'O arquivo JSON não contém registros válidos de perdas.',
          type: 'error',
        });
        return;
      }

      persistDataItems(parsedItems);
      setShowImportJsonModal(false);
      setUploadStatus({
        message: `Arquivo JSON importado com sucesso! ${parsedItems.length} registros carregados.`,
        type: 'success',
      });
      setTimeout(() => setUploadStatus({ message: '', type: null }), 5000);
    } catch (err: any) {
      console.error(err);
      setUploadStatus({
        message: 'Erro ao processar arquivo JSON: ' + (err?.message || 'Formato inválido'),
        type: 'error',
      });
    } finally {
      if (event.target) event.target.value = '';
    }
  };

  // Import JSON from pasted text
  const handleImportPastedJson = () => {
    if (!jsonPastedCode.trim()) {
      setJsonParseError('Por favor, cole o código JSON antes de importar.');
      return;
    }

    try {
      const parsedItems = parseJsonText(jsonPastedCode);
      if (parsedItems.length === 0) {
        setJsonParseError('O JSON colado não contém uma lista de itens válida.');
        return;
      }

      persistDataItems(parsedItems);
      setJsonParseError(null);
      setShowImportJsonModal(false);
      setJsonPastedCode('');
      setUploadStatus({
        message: `JSON colado importado com sucesso! ${parsedItems.length} registros normalizados.`,
        type: 'success',
      });
      setTimeout(() => setUploadStatus({ message: '', type: null }), 5000);
    } catch (err: any) {
      console.error(err);
      setJsonParseError('Erro de sintaxe JSON: ' + (err?.message || 'Verifique vírgulas e aspas duplas'));
    }
  };

  // Reset to default AMBEV sample dataset
  const handleResetToDefault = () => {
    persistDataItems(defaultRawData as PerdaItemJSON[]);
    setShowImportJsonModal(false);
    setUploadStatus({
      message: 'Base original restaurada com sucesso (50 registros padrão AMBEV).',
      type: 'success',
    });
    setTimeout(() => setUploadStatus({ message: '', type: null }), 4000);
  };

  // Excel / CSV File upload handler
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      let parsedItems: PerdaItemJSON[] = [];
      if (file.name.endsWith('.json')) {
        parsedItems = await parseJsonFile(file);
      } else {
        parsedItems = await parseExcelOrCsvFile(file);
      }

      if (parsedItems.length === 0) {
        setUploadStatus({
          message: 'O arquivo não contém registros válidos de perdas.',
          type: 'error',
        });
        return;
      }

      persistDataItems(parsedItems);
      setUploadStatus({
        message: `Planilha importada com sucesso! ${parsedItems.length} registros normalizados.`,
        type: 'success',
      });
      setTimeout(() => setUploadStatus({ message: '', type: null }), 5000);
    } catch (err: any) {
      console.error(err);
      setUploadStatus({
        message: 'Erro ao processar arquivo: ' + (err?.message || 'Formato inválido'),
        type: 'error',
      });
    } finally {
      if (event.target) event.target.value = '';
    }
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(dataItems, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2500);
  };

  const executiveSummaryText = `========================================================
RELATÓRIO EXECUTIVO DE ANÁLISE DE PERDAS (2026)
========================================================
• Valor Total Perdido: ${formatCurrency(stats.valorTotal)}
• Quantidade Total: ${stats.qtdeTotal.toLocaleString('pt-BR')} unidades (${stats.totalRegistros} operações)

ACHADOS E ANOMALIAS PRINCIPAIS:
1. PICO CRÍTICO EM FEVEREIRO/2026:
   Fevereiro registrou o maior prejuízo acumulado do ano (${formatCurrency(stats.mesCritico.valor)}, representando ${stats.mesCritico.percentualDoTotal.toFixed(1)}% do total anual), impulsionado por quebras concentradas em cervejas retornáveis (Skol 600ml RGB: R$ 2.448,00) e energéticos Red Bull (R$ 2.376,00).

2. ALTA CONCENTRAÇÃO PARETO (TOP 3 PRODUTOS):
   Três produtos de alto valor unitário concentram 58,0% de todo o prejuízo financeiro:
   - Red Bull Energy Drink (Lata): R$ 18.744,00 (29,85% do total)
   - Corona Extra LN (Long Neck): R$ 9.833,21 (15,66% do total)
   - Spaten Munich Helles (Long Neck): R$ 7.868,40 (12,53% do total)

3. VULNERABILIDADE CRÍTICA EM LATAS E LONG NECKS:
   As embalagens LATA (42,9%) e LONG NECK (37,9%) somam juntas 80,8% de todo o prejuízo monetário (R$ 50.719,61), indicando maior fragilidade mecânica e riscos no manuseio de pallets e picking.

4. EFICIÊNCIA DE REGISTRO E RASTREABILIDADE:
   A base de dados foi 100% normalizada com campos padronizados (dataOperacao, emissao, produto, unidade, descricao, qtde, valor, embalagem).
========================================================`;

  const handleCopySummary = () => {
    navigator.clipboard.writeText(executiveSummaryText);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  return (
    <div id="perdas-por-view" className="space-y-6 pb-12">
      {/* Top Header & Action Controls */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>Perdas por Mercadoria</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Análise Estruturada & JSON
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-400">
                  Dashboard analítico, diagrama hierárquico por mês e normalizador de planilhas (.xlsx / .json)
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Dedicated JSON File Input */}
            <input
              type="file"
              ref={jsonFileInputRef}
              onChange={handleJsonFileUpload}
              accept=".json,application/json"
              className="hidden"
            />

            {/* Upload Excel Button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".xlsx,.xls,.csv,.json"
              className="hidden"
            />

            {/* Import JSON Button */}
            <button
              onClick={() => setShowImportJsonModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-all cursor-pointer shadow-md shadow-sky-600/25"
              title="Importar dados por arquivo .json ou colar código JSON"
            >
              <Upload className="w-4 h-4 text-sky-200" />
              <span>Importar JSON</span>
            </button>

            {/* Import Excel Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition-all cursor-pointer shadow-sm hover:border-slate-600"
              title="Importar planilha .xlsx ou .csv"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Importar Planilha (.xlsx)</span>
            </button>

            {/* Open Tree Button */}
            <button
              onClick={() => setShowTreeModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all cursor-pointer shadow-md shadow-amber-500/20 active:scale-95"
              title="Abrir Árvore de Hierarquia em Tela Cheia (1366x768)"
            >
              <FolderTree className="w-4 h-4" />
              <span>Abrir Árvore</span>
            </button>

            {/* Download JSON Button */}
            <button
              onClick={() => downloadJsonFile(dataItems, 'perdas_normalizadas.json')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition-all cursor-pointer shadow-sm hover:border-slate-600"
              title="Baixar arquivo JSON normalizado"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Baixar JSON</span>
            </button>

            {/* View JSON Modal Button */}
            <button
              onClick={() => setShowJsonModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold text-xs transition-all cursor-pointer"
              title="Inspecionar JSON completo"
            >
              <FileCode className="w-4 h-4 text-emerald-400" />
              <span>Ver JSON</span>
            </button>

            {/* Executive Summary Button */}
            <button
              onClick={() => setShowExecutiveSummary(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold text-xs transition-all cursor-pointer"
              title="Resumo dos 4 achados principais"
            >
              <Sparkles className="w-4 h-4 text-rose-400" />
              <span>Achados & Anomalias</span>
            </button>
          </div>
        </div>

        {/* Upload Alert feedback if any */}
        {uploadStatus.message && (
          <div
            className={`mt-4 p-3 rounded-xl text-xs font-semibold flex items-center justify-between border ${
              uploadStatus.type === 'success'
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
                : 'bg-rose-950/40 text-rose-300 border-rose-500/40'
            }`}
          >
            <div className="flex items-center gap-2">
              {uploadStatus.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              )}
              <span>{uploadStatus.message}</span>
            </div>
            <button
              onClick={() => setUploadStatus({ message: '', type: null })}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* ========================================================
          1. CARDS DE RESUMO (KPIs Principais)
         ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Valor Total */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4.5 shadow-lg relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Valor Total Perdido
            </span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono tracking-tight">
            {formatCurrency(stats.valorTotal)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="font-semibold text-amber-400 font-mono">
              Ticket Médio:{' '}
              {formatCurrency(stats.ticketMedioItem)}/un
            </span>
          </div>
        </div>

        {/* Card 2: Quantidade & Registros */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4.5 shadow-lg relative overflow-hidden group hover:border-sky-500/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Quantidade Perdida
            </span>
            <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono tracking-tight">
            {stats.qtdeTotal.toLocaleString('pt-BR')}{' '}
            <span className="text-sm font-sans font-normal text-slate-400">unidades</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="font-semibold text-sky-400 font-mono">
              {stats.totalRegistros} operações
            </span>
            <span>em {mesesSummary.length} meses</span>
          </div>
        </div>

        {/* Card 3: Mês Crítico */}
        <div className="bg-slate-900/90 border border-rose-900/40 rounded-2xl p-4.5 shadow-lg relative overflow-hidden group hover:border-rose-500/60 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block mr-0.5" />
              Mês Mais Crítico
            </span>
            <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono tracking-tight">
            {stats.mesCritico.mesNome}
          </div>
          <div className="text-[11px] text-slate-300 mt-1 flex items-center justify-between">
            <span className="font-bold text-white font-mono">
              {formatCurrency(stats.mesCritico.valor)}
            </span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              {stats.mesCritico.percentualDoTotal.toFixed(1)}% do total
            </span>
          </div>
        </div>

        {/* Card 4: Embalagem Top */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4.5 shadow-lg relative overflow-hidden group hover:border-purple-500/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Embalagem Principal
            </span>
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono tracking-tight flex items-center gap-2">
            <span>{stats.embalagemTop.nome}</span>
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: getEmbalagemColor(stats.embalagemTop.nome) }}
            />
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span className="font-bold text-slate-200 font-mono">
              {formatCurrency(stats.embalagemTop.valor)}
            </span>
            <span className="font-semibold text-purple-400 font-mono">
              {stats.embalagemTop.percentual.toFixed(1)}% das perdas
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================
          2. GRÁFICOS DO DASHBOARD (Mês e Distribuição por Embalagem)
         ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico 1: Barras por Mês */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span>Perdas por Mês (Jan a Ago/2026)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Evolução mensal com destaque para o mês com maior prejuízo
              </p>
            </div>

            <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setMetricMode('valor')}
                className={`px-2.5 py-1 rounded font-bold cursor-pointer transition-all ${
                  metricMode === 'valor' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400'
                }`}
              >
                R$ Valor
              </button>
              <button
                onClick={() => setMetricMode('quantidade')}
                className={`px-2.5 py-1 rounded font-bold cursor-pointer transition-all ${
                  metricMode === 'quantidade' ? 'bg-sky-500 text-slate-950 font-black' : 'text-slate-400'
                }`}
              >
                Quantidade
              </button>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mesesSummary} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <XAxis
                  dataKey="mesNomeCurto"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                  tickFormatter={(val) =>
                    metricMode === 'valor'
                      ? `R$ ${(val / 1000).toFixed(0)}k`
                      : `${val}`
                  }
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as (typeof mesesSummary)[0];
                      return (
                        <div className="bg-slate-950 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{data.mesNome}</span>
                            {data.isCritico && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] bg-rose-500 text-white font-black">
                                PICO
                              </span>
                            )}
                          </div>
                          <div className="text-amber-400 font-mono font-bold text-sm">
                            {formatCurrency(data.valorTotal)}
                          </div>
                          <div className="text-slate-400 font-mono">
                            {data.qtdeTotal} unidades • {data.registros} operações
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey={metricMode === 'valor' ? 'valorTotal' : 'qtdeTotal'} radius={[6, 6, 0, 0]}>
                  {mesesSummary.map((entry) => (
                    <Cell
                      key={`cell-${entry.mesKey}`}
                      fill={entry.isCritico ? '#f43f5e' : '#f59e0b'}
                      className="cursor-pointer transition-all hover:opacity-80"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800 mt-2">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block" /> Meses Regulares
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block" /> Mês Crítico (Pico)
              </span>
            </div>
            <span className="font-mono text-slate-300">
              Pico Máximo: {stats.mesCritico.mesNome} ({formatCurrency(stats.mesCritico.valor)})
            </span>
          </div>
        </div>

        {/* Gráfico 2: Distribuição por Embalagem */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div className="mb-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-sky-400" />
              <span>Distribuição por Embalagem</span>
            </h3>
            <p className="text-xs text-slate-400">Participação de cada tipo no prejuízo total</p>
          </div>

          <div className="h-56 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={embalagensSummary}
                  dataKey="valorTotal"
                  nameKey="embalagem"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                >
                  {embalagensSummary.map((entry) => (
                    <Cell key={`emb-cell-${entry.embalagem}`} fill={entry.corHex} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as (typeof embalagensSummary)[0];
                      return (
                        <div className="bg-slate-950 border border-slate-700 p-2.5 rounded-xl shadow-2xl text-xs space-y-1">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: data.corHex }}
                            />
                            <span>{data.embalagem}</span>
                          </div>
                          <div className="text-amber-400 font-mono font-bold">
                            {formatCurrency(data.valorTotal)} ({data.percentualValor}%)
                          </div>
                          <div className="text-slate-400 font-mono">
                            {data.qtdeTotal} un • {data.registros} reg.
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Total
              </span>
              <span className="text-xs font-black text-white font-mono">
                {formatCurrency(stats.valorTotal)}
              </span>
            </div>
          </div>

          {/* Embalagens Badges */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800">
            {embalagensSummary.slice(0, 4).map((emb) => (
              <div
                key={emb.embalagem}
                className="flex items-center justify-between text-xs py-0.5 hover:bg-slate-800/50 px-1.5 rounded transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: emb.corHex }}
                  />
                  <span className="font-bold text-slate-200 truncate">{emb.embalagem}</span>
                </div>
                <div className="flex items-center gap-2 font-mono shrink-0">
                  <span className="text-slate-300">{formatCurrency(emb.valorTotal)}</span>
                  <span className="text-[10px] font-bold text-amber-400">
                    {emb.percentualValor}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================
          3. ÁRVORE DE HIERARQUIA EMBARCADA + BOTÃO TELA CHEIA
         ======================================================== */}
      <div className="space-y-4">
        {/* Banner com Botão de Abertura em Tela Cheia */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900/95 to-amber-950/30 border border-amber-500/40 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-amber-500 transition-all">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0 group-hover:scale-105 transition-transform">
                <FolderTree className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                    Árvore de Hierarquia de Perdas
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    1366 × 768 • Tela Cheia
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    {stats.totalRegistros} Lançamentos • {totalUniqueSkus} SKUs
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Navegue pela árvore abaixo na página ou abra em modo imersivo: <strong className="text-slate-200">Total Geral → Mês → Grupo → Embalagem → Produtos</strong>
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowTreeModal(true)}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm transition-all cursor-pointer shadow-lg shadow-amber-500/25 shrink-0 active:scale-95 hover:shadow-amber-500/40 transform hover:-translate-y-0.5"
            >
              <Maximize2 className="w-4 h-4" />
              <span>Abrir Árvore em Tela Cheia</span>
            </button>
          </div>
        </div>

        {/* Árvore de Hierarquia Visível Direto na Página */}
        <div className="rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
          <PerdasPorHierarchyTree
            items={dataItems}
            isModal={false}
          />
        </div>
      </div>


      {/* ========================================================
          5. PAINEL DE PADRÕES E ANOMALIAS RELEVANTES
         ======================================================== */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              Padrões & Anomalias Relevantes Identificadas
            </h3>
            <p className="text-xs text-slate-400">
              Síntese analítica dos principais desvios e oportunidades de controle
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-rose-400 text-xs font-bold">
              <AlertTriangle className="w-4 h-4" />
              <span>1. Pico Anômalo em Fevereiro</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Fevereiro atingiu <strong>R$ 9.591,80</strong> (+50,8% vs. Jan), concentrando{' '}
              <strong>15,3%</strong> de toda a perda do ano devido a avarias com Skol 600ml RGB e
              Red Bull.
            </p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
              <TrendingDown className="w-4 h-4" />
              <span>2. Concentração Pareto (58%)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Apenas 3 produtos (<strong>Red Bull</strong>, <strong>Corona LN</strong> e{' '}
              <strong>Spaten LN</strong>) somam <strong>58,0%</strong> de todo o prejuízo financeiro
              acumulado.
            </p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-sky-400 text-xs font-bold">
              <Package className="w-4 h-4" />
              <span>3. Vulnerabilidade em Latas</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              A embalagem <strong>LATA</strong> responde por <strong>42,9%</strong> das perdas (R$
              26.938,80), demandando revisão de amarração e paletização em empilhadeiras.
            </p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-purple-400 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>4. Long Necks vs Retornáveis</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Long Necks somam <strong>37,9%</strong> (R$ 23.780,81). Junto com Latas, representam{' '}
              <strong>80,8%</strong> das perdas operacionais registradas.
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================
          6. TABELA DE DADOS NORMALIZADOS
         ======================================================== */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Registros Normalizados da Planilha ({filteredItems.length} itens)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Campos: dataOperacao, emissao, produto, unidade, descricao, qtde, valor, embalagem
            </p>
          </div>

          {/* Filters and search */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar produto ou SKU..."
                value={buscaTexto}
                onChange={(e) => setBuscaTexto(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 w-44 sm:w-56"
              />
            </div>

            {/* Filter by Month */}
            <select
              value={filtroMes}
              onChange={(e) => setFiltroMes(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="todos">Todos os Meses</option>
              {mesesSummary.map((m) => (
                <option key={m.mesKey} value={m.mesKey}>
                  {m.mesNome}
                </option>
              ))}
            </select>

            {/* Filter by Packaging */}
            <select
              value={filtroEmbalagem}
              onChange={(e) => setFiltroEmbalagem(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="todas">Todas Embalagens</option>
              {embalagensSummary.map((emb) => (
                <option key={emb.embalagem} value={emb.embalagem}>
                  {emb.embalagem}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Data Op.</th>
                <th className="py-2.5 px-3">Emissão</th>
                <th className="py-2.5 px-3">SKU</th>
                <th className="py-2.5 px-3">Descrição</th>
                <th className="py-2.5 px-3">Embalagem</th>
                <th className="py-2.5 px-3 text-right">Qtde</th>
                <th className="py-2.5 px-3">UN</th>
                <th className="py-2.5 px-3 text-right">Valor (R$)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
              {filteredItems.map((item, i) => {
                const embColor = getEmbalagemColor(item.embalagem);
                return (
                  <tr key={`${item.produto}-${item.dataOperacao}-${i}`} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2 px-3 font-mono text-slate-300">{item.dataOperacao}</td>
                    <td className="py-2 px-3 font-mono text-slate-400">{item.emissao}</td>
                    <td className="py-2 px-3 font-mono font-bold text-amber-400">{item.produto}</td>
                    <td className="py-2 px-3 font-medium text-white">{item.descricao}</td>
                    <td className="py-2 px-3">
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider inline-block"
                        style={{
                          backgroundColor: `${embColor}20`,
                          color: embColor,
                          border: `1px solid ${embColor}40`,
                        }}
                      >
                        {item.embalagem}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-200">
                      {item.qtde}
                    </td>
                    <td className="py-2 px-3 uppercase text-slate-400 font-mono">{item.unidade}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400">
                      {formatCurrency(item.valor)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================
          MODAL 0: IMPORTAR DADOS POR JSON (ARQUIVO OU TEXTO)
         ======================================================== */}
      {showImportJsonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Importar Perdas por JSON</h3>
                  <p className="text-[11px] text-slate-400">
                    Carregue um arquivo .json ou cole os dados diretamente
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowImportJsonModal(false);
                  setJsonParseError(null);
                }}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-slate-800 bg-slate-950/60 px-4 pt-2 gap-2">
              <button
                onClick={() => {
                  setImportJsonTab('file');
                  setJsonParseError(null);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all cursor-pointer border-b-2 ${
                  importJsonTab === 'file'
                    ? 'bg-slate-900 text-sky-400 border-sky-400'
                    : 'text-slate-400 hover:text-slate-200 border-transparent'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>Arquivo .JSON</span>
              </button>
              <button
                onClick={() => {
                  setImportJsonTab('text');
                  setJsonParseError(null);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all cursor-pointer border-b-2 ${
                  importJsonTab === 'text'
                    ? 'bg-slate-900 text-sky-400 border-sky-400'
                    : 'text-slate-400 hover:text-slate-200 border-transparent'
                }`}
              >
                <FileCode className="w-4 h-4" />
                <span>Colar Código JSON</span>
              </button>
            </div>

            {/* Content Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4 custom-scrollbar text-xs">
              {importJsonTab === 'file' ? (
                <div className="space-y-4">
                  <div
                    onClick={() => jsonFileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-700 hover:border-sky-500/60 bg-slate-950/50 hover:bg-sky-950/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-sky-500/10 group-hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 flex items-center justify-center mb-3 transition-colors">
                      <Upload className="w-7 h-7" />
                    </div>
                    <span className="text-sm font-bold text-white mb-1">
                      Clique para selecionar o arquivo .json
                    </span>
                    <span className="text-slate-400 text-xs max-w-sm mb-4">
                      Selecione um arquivo .json contendo o array de perdas estruturado
                    </span>
                    <button
                      type="button"
                      className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-600/20 transition-all pointer-events-none"
                    >
                      Selecionar Arquivo .JSON
                    </button>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="text-slate-300 font-bold flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-sky-400" />
                        <span>Estrutura Exata Esperada</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const template = `{\n  "dataOperacao": "2026-02-07",\n  "emissao": "2026-02-09",\n  "produto": 9068,\n  "unidade": "Un",\n  "descricao": "SKOL LATA 350ML SH C/",\n  "qtde": 4,\n  "valor": 9.51,\n  "embalagem": "LATA 355ML"\n}`;
                          navigator.clipboard.writeText(template);
                          setUploadStatus({
                            message: 'Modelo JSON copiado para a área de transferência!',
                            type: 'success',
                          });
                          setTimeout(() => setUploadStatus({ message: '', type: null }), 3000);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[11px] font-bold cursor-pointer transition-colors"
                      >
                        Copiar Modelo JSON
                      </button>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-lg font-mono text-[11px] text-emerald-400 overflow-x-auto">
                      <pre>{`{
  "dataOperacao": "2026-02-07",
  "emissao": "2026-02-09",
  "produto": 9068,
  "unidade": "Un",
  "descricao": "SKOL LATA 350ML SH C/",
  "qtde": 4,
  "valor": 9.51,
  "embalagem": "LATA 355ML"
}`}</pre>
                    </div>
                    <p className="text-slate-400 leading-relaxed text-[11px]">
                      Pode ser um objeto individual ou um array <code>[{`{...}`}]</code> de múltiplos registros de perdas.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 font-semibold">
                      Cole seu array ou objeto JSON abaixo:
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const text = await navigator.clipboard.readText();
                            if (text) setJsonPastedCode(text);
                          } catch {
                            // clipboard read might be blocked in some iframes
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold border border-slate-700 cursor-pointer"
                      >
                        Colar do Clipboard
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const sample = [
                            {
                              dataOperacao: "2026-02-07",
                              emissao: "2026-02-09",
                              produto: 9068,
                              unidade: "Un",
                              descricao: "SKOL LATA 350ML SH C/",
                              qtde: 4,
                              valor: 9.51,
                              embalagem: "LATA 355ML"
                            },
                            {
                              dataOperacao: "2026-02-14",
                              emissao: "2026-02-14",
                              produto: 18512,
                              unidade: "cx",
                              descricao: "RED BULL ENERGY DRINK 250ML LT",
                              qtde: 30,
                              valor: 2376.0,
                              embalagem: "LATA"
                            },
                            {
                              dataOperacao: "2026-02-18",
                              emissao: "2026-02-18",
                              produto: 1894,
                              unidade: "cx",
                              descricao: "SKOL PILSEN 600ML RGB",
                              qtde: 34,
                              valor: 2448.0,
                              embalagem: "RGB"
                            }
                          ];
                          setJsonPastedCode(JSON.stringify(sample, null, 2));
                          setJsonParseError(null);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold cursor-pointer"
                      >
                        Inserir Exemplo Padrão
                      </button>
                      {jsonPastedCode && (
                        <button
                          type="button"
                          onClick={() => {
                            setJsonPastedCode('');
                            setJsonParseError(null);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-300 text-[11px] font-bold cursor-pointer"
                        >
                          Limpar
                        </button>
                      )}
                    </div>
                  </div>

                  <textarea
                    value={jsonPastedCode}
                    onChange={(e) => {
                      setJsonPastedCode(e.target.value);
                      if (jsonParseError) setJsonParseError(null);
                    }}
                    placeholder={`[\n  {\n    "dataOperacao": "2026-02-07",\n    "emissao": "2026-02-09",\n    "produto": 9068,\n    "unidade": "Un",\n    "descricao": "SKOL LATA 350ML SH C/",\n    "qtde": 4,\n    "valor": 9.51,\n    "embalagem": "LATA 355ML"\n  }\n]`}
                    rows={12}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 font-mono text-xs text-emerald-400 focus:outline-none focus:border-sky-500 placeholder:text-slate-600 custom-scrollbar resize-y"
                  />

                  {jsonParseError && (
                    <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                      <span>{jsonParseError}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowImportJsonModal(false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleImportPastedJson}
                      className="flex items-center gap-2 px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-md shadow-sky-600/30 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Carregar e Normalizar JSON</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
              <button
                type="button"
                onClick={handleResetToDefault}
                className="flex items-center gap-1.5 text-slate-400 hover:text-amber-400 text-xs font-semibold cursor-pointer transition-colors"
                title="Restaurar base original de 50 registros da AMBEV"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar Base Padrão AMBEV (50 registros)</span>
              </button>

              <span className="text-[11px] text-slate-500">
                Atualmente: {dataItems.length} registros
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 1: INSPEÇÃO E CÓPIA DO JSON RAW
         ======================================================== */}
      {showJsonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">
                  Arquivo JSON Normalizado ({dataItems.length} itens)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyJson}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 cursor-pointer"
                >
                  {copiedJson ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar JSON</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => downloadJsonFile(dataItems, 'perdas_normalizadas.json')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => setShowJsonModal(false)}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-4 overflow-y-auto flex-1 bg-slate-950 font-mono text-xs text-emerald-400 select-all custom-scrollbar">
              <pre>{JSON.stringify(dataItems, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: RESUMO EXECUTIVO (ACHADOS & ANOMALIAS)
         ======================================================== */}
      {showExecutiveSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-rose-400" />
                <h3 className="text-sm font-bold text-white">
                  Resumo Executivo: 4 Achados Mais Importantes
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopySummary}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 cursor-pointer"
                >
                  {copiedSummary ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Resumo</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowExecutiveSummary(false)}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs text-slate-200 leading-relaxed custom-scrollbar">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                    Total Acumulado
                  </div>
                  <div className="text-lg font-black text-amber-400 font-mono">
                    {formatCurrency(stats.valorTotal)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                    Volume e Operações
                  </div>
                  <div className="text-sm font-bold text-white font-mono">
                    {stats.qtdeTotal.toLocaleString('pt-BR')} un • {stats.totalRegistros} ops
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-800/40 space-y-1">
                  <div className="font-bold text-rose-300 flex items-center gap-1.5">
                    <span>1. Pico Anômalo em Fevereiro/2026</span>
                  </div>
                  <p className="text-slate-300">
                    Fevereiro foi o mês com maior prejuízo (<strong>{formatCurrency(stats.mesCritico.valor)}</strong>, equivalente a <strong>{stats.mesCritico.percentualDoTotal.toFixed(1)}%</strong> do total), gerado principalmente por avarias de alto valor em Skol Pilsen 600ml RGB (R$ 2.448,00) e Red Bull (R$ 2.376,00).
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/40 space-y-1">
                  <div className="font-bold text-amber-300 flex items-center gap-1.5">
                    <span>2. Concentração Pareto nos Top 3 Produtos</span>
                  </div>
                  <p className="text-slate-300">
                    Mais da metade do prejuízo (<strong>58,0%</strong>) está concentrado em apenas 3 produtos de alto valor unitário: Red Bull Energy Drink (R$ 18.744,00 / 29,85%), Corona Extra LN (R$ 9.833,21 / 15,66%) e Spaten Munich Helles LN (R$ 7.868,40 / 12,53%).
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-sky-950/30 border border-sky-800/40 space-y-1">
                  <div className="font-bold text-sky-300 flex items-center gap-1.5">
                    <span>3. Vulnerabilidade em Latas e Long Necks</span>
                  </div>
                  <p className="text-slate-300">
                    Embalagens <strong>LATA</strong> (42,9%) e <strong>LONG NECK</strong> (37,9%) somam <strong>80,8%</strong> de todo o valor financeiro perdido no período, indicando a necessidade de revisão urgente no processo de transporte, manuseio de empilhadeiras e cintamento de pallets.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 space-y-1">
                  <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                    <span>4. Padronização e Estrutura JSON Normalizada</span>
                  </div>
                  <p className="text-slate-300">
                    Todos os 50 registros estão com datas no formato <code>YYYY-MM-DD</code>, descrições textuais limpas sem espaços duplos e atributos alinhados para consumo por APIs corporativas e BI.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: ÁRVORE HIERÁRQUICA COMPLETA EM TELA CHEIA (1366x768)
         ======================================================== */}
      {showTreeModal && (
        <PerdasPorHierarchyTree
          items={dataItems}
          onClose={() => setShowTreeModal(false)}
          isModal={true}
        />
      )}
    </div>
  );
};
