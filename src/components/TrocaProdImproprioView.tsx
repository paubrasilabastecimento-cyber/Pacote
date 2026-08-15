import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  ItemPlanilha,
  DADOS_PLANILHA_DEMO,
  analisarDadosPlanilha,
  processarArquivoJSON,
  parseTrocaFile,
  ResultadoAnalise,
} from '../utils/spreadsheetAnalyzer';
import { formatCurrency } from '../utils/formatters';
import { DecompositionTree } from './DecompositionTree';
import {
  FileSpreadsheet,
  UploadCloud,
  FileCode,
  DollarSign,
  TrendingUp,
  Package,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronRight,
  FolderTree,
  BarChart3,
  Award,
  AlertCircle,
  Download,
  Building2,
  Tag,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Calendar,
  Target,
  BarChart2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
  Legend,
  ReferenceLine,
} from 'recharts';

const PALETA_CORES = [
  '#f59e0b', // Amber (Cerveja)
  '#38bdf8', // Sky (Refrigerante)
  '#a855f7', // Purple (Energético)
  '#10b981', // Emerald (Água & Isotônico)
  '#f43f5e', // Rose (Bebidas Mistas)
  '#ec4899', // Pink (Suco & Chá)
  '#64748b', // Slate (Outros)
];

// Dados Oficiais de Meta vs Real para o Ano Todo
export interface MetaRealItem {
  mes: string;
  mesAbrev: string;
  mesNum: number;
  meta: number;
  real: number | null;
}

export const DADOS_META_VS_REAL_ANO: MetaRealItem[] = [
  { mes: 'Janeiro', mesAbrev: 'Jan', mesNum: 1, meta: 7800, real: 14791.62 },
  { mes: 'Fevereiro', mesAbrev: 'Fev', mesNum: 2, meta: 7800, real: 8067.59 },
  { mes: 'Março', mesAbrev: 'Mar', mesNum: 3, meta: 7800, real: 7759.61 },
  { mes: 'Abril', mesAbrev: 'Abr', mesNum: 4, meta: 7800, real: 836.00 },
  { mes: 'Maio', mesAbrev: 'Mai', mesNum: 5, meta: 7800, real: 8655.30 },
  { mes: 'Junho', mesAbrev: 'Jun', mesNum: 6, meta: 12000, real: 8477.44 },
  { mes: 'Julho', mesAbrev: 'Jul', mesNum: 7, meta: 12000, real: 989.40 },
  { mes: 'Agosto', mesAbrev: 'Ago', mesNum: 8, meta: 12000, real: 3558.26 },
  { mes: 'Setembro', mesAbrev: 'Set', mesNum: 9, meta: 12000, real: null },
  { mes: 'Outubro', mesAbrev: 'Out', mesNum: 10, meta: 12000, real: null },
  { mes: 'Novembro', mesAbrev: 'Nov', mesNum: 11, meta: 12000, real: null },
  { mes: 'Dezembro', mesAbrev: 'Dez', mesNum: 12, meta: 12000, real: null },
];

export const TrocaProdImproprioView: React.FC = () => {
  const { trocaPlanilhaItens, nomeArquivoTroca, importBatchTrocaPlanilha } = useApp();
  const itens = trocaPlanilhaItens || DADOS_PLANILHA_DEMO;
  const nomeArquivo = nomeArquivoTroca;

  const [isCarregando, setIsCarregando] = useState<boolean>(false);
  const [erroImportacao, setErroImportacao] = useState<string | null>(null);
  const [sucessoImportacao, setSucessoImportacao] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // GAP Mensal (Real - Meta) por Mês
  const dadosGapAno = useMemo(() => {
    return DADOS_META_VS_REAL_ANO.map((item) => {
      const hasReal = item.real !== null;
      const gap = hasReal ? Number((item.real! - item.meta).toFixed(2)) : null;
      return {
        ...item,
        gap,
      };
    });
  }, []);

  // Executar Análise
  const analise: ResultadoAnalise = useMemo(() => {
    return analisarDadosPlanilha(itens);
  }, [itens]);
  
  // Upload handler para arquivo JSON ou Planilha
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setIsCarregando(true);
    setErroImportacao(null);
    setSucessoImportacao(null);

    try {
      const itensExtraidos = await parseTrocaFile(file);
      if (!itensExtraidos || itensExtraidos.length === 0) {
        setErroImportacao('Não foi possível identificar registros válidos no arquivo informado.');
      } else {
        await importBatchTrocaPlanilha(itensExtraidos, file.name, true);
        setSucessoImportacao(`${itensExtraidos.length} registros importados e sincronizados com sucesso no sistema!`);
      }
    } catch (err: any) {
      console.error('Erro ao processar arquivo de trocas:', err);
      setErroImportacao(`Erro ao processar o arquivo: ${err?.message || 'Formato inválido'}`);
    } finally {
      setIsCarregando(false);
    }
  };

  // Exportar Dados Processados para CSV
  const handleExportCSV = () => {
    const headers = ['Operação', 'Data', 'Status', 'Código Produto', 'Unidade', 'Descrição', 'Categoria', 'Marca', 'Quantidade', 'Valor (R$)'];
    const rows = itens.map((item) => [
      `"${item.operacao}"`,
      item.data,
      `"${item.status}"`,
      `"${item.codProduto}"`,
      `"${item.unidade}"`,
      `"${item.descricao.replace(/"/g, '""')}"`,
      `"${item.categoria}"`,
      `"${item.marca}"`,
      item.quantidade,
      item.valor.toFixed(2),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Analise_Troca_Prod_Improprio_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* 1. Header & Botão de Importação JSON */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-inner">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                  Troca Prod. Impróprio
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 font-mono">
                    <FileCode className="w-3 h-3" /> Alimentado via JSON
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                  Processamento dinâmico de dados de trocas e produtos impróprios: KPIs, Pareto de Produtos, Categorias, Marcas e Árvore Hierárquica.
                </p>
              </div>
            </div>
            {nomeArquivo && (
              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-400">
                <span className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 font-mono text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Arquivo carregado: {nomeArquivo} ({itens.length} itens)
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <input
              type="file"
              ref={fileInputRef}
              accept=".json,application/json,.xlsx,.xls,.csv"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isCarregando}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              title="Importar arquivo JSON ou planilha Excel/CSV de Trocas"
            >
              <UploadCloud className="w-4 h-4 text-slate-950" />
              <span>{isCarregando ? 'Importando...' : 'Importar Dados (JSON / Excel)'}</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Exportar CSV</span>
            </button>
          </div>
        </div>

        {erroImportacao && (
          <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{erroImportacao}</span>
          </div>
        )}

        {sucessoImportacao && (
          <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{sucessoImportacao}</span>
          </div>
        )}
      </div>

      {/* 2. Cards com os Números Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Valor Total - Mantido */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Valor Total
            </span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-white font-mono">
              {formatCurrency(analise.valorTotal)}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <span>Ticket Médio por Linha:</span>
              <span className="font-mono font-bold text-amber-400">
                {formatCurrency(analise.ticketMedio)}
              </span>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <span>Período:</span>
            <span className="font-mono text-slate-300 font-bold">
              {analise.dataMinima} a {analise.dataMaxima}
            </span>
          </div>
        </div>

        {/* Categoria Dominante */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Categoria Dominante
            </span>
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <FolderTree className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-sky-400 truncate" title={analise.categoriaDominante?.categoria || '-'}>
              {analise.categoriaDominante?.categoria || '-'}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <span>Total Categoria:</span>
              <span className="font-mono font-bold text-slate-200">
                {formatCurrency(analise.categoriaDominante?.valor || 0)}
              </span>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <span>Participação:</span>
            <span className="font-mono text-sky-400 font-bold">
              {(analise.categoriaDominante?.percentual || 0).toFixed(1)}% do valor total
            </span>
          </div>
        </div>

        {/* Marca Líder Global */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Marca Líder
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-emerald-400 truncate" title={analise.marcaLiderGlobal?.marca || '-'}>
              {analise.marcaLiderGlobal?.marca || '-'}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <span>Valor da Marca:</span>
              <span className="font-mono font-bold text-slate-200">
                {formatCurrency(analise.marcaLiderGlobal?.valor || 0)}
              </span>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <span>Participação:</span>
            <span className="font-mono text-emerald-400 font-bold">
              {(analise.marcaLiderGlobal?.percentual || 0).toFixed(1)}% do total
            </span>
          </div>
        </div>

        {/* Mês de Maior Ocorrência (Pico) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Mês de Pico (Maior Valor)
            </span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-purple-400 truncate" title={analise.mesPico?.mesFormatado || '-'}>
              {analise.mesPico?.mesFormatado || '-'}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <span>Valor no Pico:</span>
              <span className="font-mono font-bold text-purple-300">
                {formatCurrency(analise.mesPico?.valor || 0)}
              </span>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <span>Impacto no Período:</span>
            <span className="font-mono text-purple-300 font-bold">
              {(analise.mesPico?.percentual || 0).toFixed(1)}% de todo o valor
            </span>
          </div>
        </div>
      </div>

      {/* 4. Dashboard Visual: Linha 1 -> Comparativo Meta vs Real (Ano Todo) + Variação GAP Mensal LADO A LADO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Card 1 (Esquerda): Gráfico Composto Meta vs Real (Ano Completo) */}
        <div className="lg:col-span-7 xl:col-span-8 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-800/80">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <h2 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-2">
                  Comparativo Meta vs Real (Ano Completo)
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30">
                    Jan - Dez
                  </span>
                </h2>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Colunas representam o valor <strong>Realizado</strong> e a linha contínua representa a <strong>Meta</strong> mensal.
              </p>
            </div>

            {/* Legend Badges */}
            <div className="flex items-center gap-3 text-xs font-medium">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300">
                <div className="w-3 h-3 rounded-sm bg-amber-500" />
                <span>Real (R$)</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-300">
                <div className="w-3 h-0.5 bg-sky-400 rounded-full" />
                <div className="w-1.5 h-1.5 rounded-full bg-sky-400 -ml-2.5" />
                <span>Meta (R$)</span>
              </div>
            </div>
          </div>

          {/* Quick Year Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
            <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Meta Acumulada YTD
              </span>
              <span className="text-sm font-black text-sky-400 font-mono">
                R$ 75.000,00
              </span>
              <span className="text-[10px] text-slate-400 block">Jan a Ago (8 meses)</span>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Realizado YTD
              </span>
              <span className="text-sm font-black text-amber-400 font-mono">
                R$ 53.135,22
              </span>
              <span className="text-[10px] text-slate-400 block">Jan a Ago (8 meses)</span>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Economia Acumulada YTD
              </span>
              <span className="text-sm font-black text-emerald-400 font-mono flex items-center gap-1">
                -R$ 21.864,78
              </span>
              <span className="text-[10px] text-emerald-400/80 block">70.8% do teto (Favorável)</span>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Meta Total Anual
              </span>
              <span className="text-sm font-black text-white font-mono">
                R$ 123.000,00
              </span>
              <span className="text-[10px] text-slate-400 block">12 Meses (Jan-Dez)</span>
            </div>
          </div>

          {/* Gráfico ComposedChart com Colunas e Linha */}
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={DADOS_META_VS_REAL_ANO}
                margin={{ top: 15, right: 20, left: 10, bottom: 10 }}
              >
                <defs>
                  <linearGradient id="barRealGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#d97706" stopOpacity={0.7} />
                  </linearGradient>
                  <linearGradient id="barPendingGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#334155" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#1e293b" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.35} vertical={false} />
                <XAxis
                  dataKey="mesAbrev"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickMargin={8}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={10}
                  tickFormatter={(v) => `R$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null;
                    const item = payload[0]?.payload as MetaRealItem;
                    if (!item) return null;
                    const hasReal = item.real !== null;
                    const diff = hasReal ? item.real! - item.meta : null;
                    const atingimento = hasReal ? (item.real! / item.meta) * 100 : null;

                    return (
                      <div className="bg-slate-950/95 backdrop-blur-md border border-slate-700/90 rounded-xl p-3.5 shadow-2xl min-w-[240px] text-xs font-sans ring-1 ring-white/10">
                        <div className="font-bold text-white text-sm border-b border-slate-800 pb-1.5 mb-2 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-sky-400" />
                            {item.mes}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                            Mês {item.mesNum}/12
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center bg-slate-900/90 px-2.5 py-1.5 rounded-lg border border-slate-800/80">
                            <span className="text-sky-300 font-medium flex items-center gap-1">
                              <Target className="w-3 h-3 text-sky-400" />
                              Meta:
                            </span>
                            <span className="font-mono font-bold text-sky-400">
                              {formatCurrency(item.meta)}
                            </span>
                          </div>

                          <div className="flex justify-between items-center bg-slate-900/90 px-2.5 py-1.5 rounded-lg border border-slate-800/80">
                            <span className="text-amber-300 font-medium flex items-center gap-1">
                              <BarChart2 className="w-3 h-3 text-amber-400" />
                              Realizado:
                            </span>
                            <span className="font-mono font-bold text-amber-400">
                              {hasReal ? formatCurrency(item.real!) : 'Não informado (Pendente)'}
                            </span>
                          </div>

                          {hasReal && (
                            <>
                              <div className="flex justify-between items-center bg-slate-900/90 px-2.5 py-1.5 rounded-lg border border-slate-800/80">
                                <span className="text-slate-300">Desvio (Real - Meta):</span>
                                <span
                                  className={`font-mono font-bold flex items-center gap-1 ${
                                    diff! > 0 ? 'text-rose-400' : 'text-emerald-400'
                                  }`}
                                >
                                  {diff! > 0 ? (
                                    <ArrowUpRight className="w-3 h-3 text-rose-400" />
                                  ) : (
                                    <ArrowDownRight className="w-3 h-3 text-emerald-400" />
                                  )}
                                  {diff! > 0 ? '+' : ''}
                                  {formatCurrency(diff!)}
                                </span>
                              </div>

                              <div className="flex justify-between items-center text-[11px] pt-1.5 border-t border-slate-800">
                                <span className="text-slate-400">Status / Atingimento:</span>
                                <span
                                  className={`font-mono font-black px-2 py-0.5 rounded border ${
                                    atingimento! <= 100
                                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                      : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                  }`}
                                >
                                  {atingimento!.toFixed(1)}% {atingimento! <= 100 ? '(Economia)' : '(Acima da Meta)'}
                                </span>
                              </div>
                            </>
                          )}

                          {!hasReal && (
                            <div className="text-[11px] text-slate-400 text-center py-1 italic">
                              * Dados do período ainda não consolidados.
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }}
                />

                {/* Colunas: Realizado (R$) */}
                <Bar
                  dataKey="real"
                  name="Real (R$)"
                  radius={[6, 6, 0, 0]}
                  fill="url(#barRealGradient)"
                  maxBarSize={40}
                >
                  {DADOS_META_VS_REAL_ANO.map((entry, index) => (
                    <Cell
                      key={`cell-bar-${index}`}
                      fill={entry.real !== null ? 'url(#barRealGradient)' : 'url(#barPendingGradient)'}
                    />
                  ))}
                </Bar>

                {/* Linha: Meta (R$) */}
                <Line
                  type="monotone"
                  dataKey="meta"
                  name="Meta (R$)"
                  stroke="#38bdf8"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#38bdf8', stroke: '#0f172a', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#38bdf8', stroke: '#fff', strokeWidth: 2 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 2 (Direita): Variação Orçamentária / GAP Mensal (R$) */}
        <div className="lg:col-span-5 xl:col-span-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div className="pb-3 mb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-sky-500" />
              <h2 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-2">
                Variação GAP Mensal (R$)
              </h2>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Desvio mensal Realizado - Meta orçada.
            </p>
          </div>

          <div className="flex-1 flex flex-col justify-between">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dadosGapAno}
                  margin={{ top: 15, right: 10, left: -10, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#334155"
                    opacity={0.3}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="mesAbrev"
                    stroke="#94a3b8"
                    fontSize={10}
                    interval={0}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={10}
                    tickFormatter={(v) =>
                      `R$${
                        Math.abs(v) >= 1000
                          ? (v / 1000).toFixed(0) + 'k'
                          : v
                      }`
                    }
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const data = payload[0]?.payload;
                      if (!data) return null;
                      const hasReal = data.real !== null;
                      const gap = data.gap;
                      const isEconomia = gap !== null && gap <= 0;
                      const ating = hasReal ? (data.real / data.meta) * 100 : null;

                      return (
                        <div className="bg-slate-950/95 backdrop-blur-md border border-slate-700/90 rounded-xl p-3 shadow-2xl min-w-[220px] text-xs font-sans ring-1 ring-white/10">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2 gap-2">
                            <span className="font-bold text-white text-xs flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-sky-400" />
                              {data.mes}
                            </span>
                            {hasReal ? (
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  isEconomia
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                }`}
                              >
                                {isEconomia ? 'Economia' : 'Acima da Meta'}
                              </span>
                            ) : (
                              <span className="bg-slate-800 text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                Pendente
                              </span>
                            )}
                          </div>

                          {hasReal && gap !== null ? (
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between bg-slate-900/90 px-2.5 py-1.5 rounded-lg border border-slate-800">
                                <span className="text-slate-300 text-xs">Variação GAP:</span>
                                <span
                                  className={`font-mono font-black text-xs ${
                                    isEconomia ? 'text-emerald-400' : 'text-rose-400'
                                  }`}
                                >
                                  {gap <= 0 ? '' : '+'}
                                  {formatCurrency(gap)}
                                </span>
                              </div>
                              <div className="flex justify-between text-[11px] text-slate-400 px-1">
                                <span>Real: <strong className="text-amber-400 font-mono">{formatCurrency(data.real)}</strong></span>
                                <span>Meta: <strong className="text-sky-400 font-mono">{formatCurrency(data.meta)}</strong></span>
                              </div>
                              <div className="flex justify-between text-[11px] text-slate-400 px-1 pt-1 border-t border-slate-800/80">
                                <span>Atingimento:</span>
                                <span className="font-mono font-bold text-white">
                                  {ating?.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-400 text-center py-1 italic">
                              Mês futuro (sem apuração)
                            </div>
                          )}
                        </div>
                      );
                    }}
                  />
                  <ReferenceLine y={0} stroke="#64748b" strokeWidth={1.5} strokeDasharray="2 2" />
                  <Bar
                    dataKey="gap"
                    name="Variação GAP (R$)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                  >
                    {dadosGapAno.map((entry, index) => {
                      if (entry.gap === null) {
                        return <Cell key={`gap-cell-${index}`} fill="transparent" />;
                      }
                      return (
                        <Cell
                          key={`gap-cell-${index}`}
                          fill={entry.gap <= 0 ? '#10b981' : '#f43f5e'}
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Legenda do GAP */}
            <div className="flex items-center justify-between text-xs text-slate-400 px-1 pt-2 border-t border-slate-800/80">
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium text-[11px]">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                Abaixo da Meta (Economia)
              </span>
              <span className="flex items-center gap-1.5 text-rose-400 font-medium text-[11px]">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
                Acima (Desvio)
              </span>
            </div>
          </div>

          {/* Total YTD Deviation Footer */}
          <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">
              Economia Acumulada (YTD):
            </span>
            <span className="font-mono font-black text-emerald-400 text-xs bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              -R$ 21.864,78 (-29.2% da meta)
            </span>
          </div>
        </div>
      </div>

      {/* 5. Detalhamento de Categorias & Impacto */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-2">
                Detalhamento de Categorias & Impacto
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Distribuição de valor por categoria e marcas líderes associadas.
              </p>
            </div>
          </div>
          <div className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
            Total: <strong className="text-amber-400">{formatCurrency(analise.valorTotal)}</strong>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] text-slate-400 uppercase tracking-wider bg-slate-950/50">
                <th className="py-2.5 px-3 rounded-l-lg">Categoria</th>
                <th className="py-2.5 px-3">Marca Líder</th>
                <th className="py-2.5 px-3 text-right">Qtd Linhas</th>
                <th className="py-2.5 px-3 text-right">Valor Total</th>
                <th className="py-2.5 px-3 text-right rounded-r-lg">Participação (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {analise.categorias.map((cat, idx) => (
                <tr key={cat.categoria} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-white flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: PALETA_CORES[idx % PALETA_CORES.length] }}
                    />
                    {cat.categoria}
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">
                    <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-mono text-[11px] text-emerald-400">
                      {cat.marcas[0]?.marca || 'N/A'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                    {cat.quantidade}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-400">
                    {formatCurrency(cat.valor)}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-24 bg-slate-800 h-1.5 rounded-full overflow-hidden hidden sm:block">
                        <div
                          className="h-full rounded-full bg-sky-500"
                          style={{ width: `${Math.min(cat.percentual, 100)}%` }}
                        />
                      </div>
                      <span className="font-mono font-bold text-sky-400 text-xs">
                        {cat.percentual.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pt-3 mt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Categoria principal: <strong className="text-white">{analise.categoriaDominante?.categoria}</strong> ({analise.categoriaDominante?.percentual.toFixed(1)}%)
          </span>
          <span className="font-mono text-[11px] text-slate-400">
            {analise.categorias.length} categorias consolidadas
          </span>
        </div>
      </div>

      {/* 5. Árvore de Hierarquia Financeira (Decomposition Tree - Power BI Style) */}
      <DecompositionTree itens={itens} />
    </div>
  );
};
