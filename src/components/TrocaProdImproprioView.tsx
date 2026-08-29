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

export const TrocaProdImproprioView: React.FC = () => {
  const { trocaPlanilhaItens, nomeArquivoTroca, importBatchTrocaPlanilha } = useApp();
  const itens = trocaPlanilhaItens || [];
  const nomeArquivo = nomeArquivoTroca;

  const [isCarregando, setIsCarregando] = useState<boolean>(false);
  const [erroImportacao, setErroImportacao] = useState<string | null>(null);
  const [sucessoImportacao, setSucessoImportacao] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Computa o Realizado por mês dinamicamente a partir dos itens importados
  const dadosMetaVsRealAno: MetaRealItem[] = useMemo(() => {
    const metasPorMes: { [key: number]: number } = {
      1: 7800, 2: 7800, 3: 7800, 4: 7800, 5: 7800,
      6: 12000, 7: 12000, 8: 12000, 9: 12000, 10: 12000, 11: 12000, 12: 12000,
    };
    const nomesMeses = [
      { num: 1, nome: 'Janeiro', abrev: 'Jan' },
      { num: 2, nome: 'Fevereiro', abrev: 'Fev' },
      { num: 3, nome: 'Março', abrev: 'Mar' },
      { num: 4, nome: 'Abril', abrev: 'Abr' },
      { num: 5, nome: 'Maio', abrev: 'Mai' },
      { num: 6, nome: 'Junho', abrev: 'Jun' },
      { num: 7, nome: 'Julho', abrev: 'Jul' },
      { num: 8, nome: 'Agosto', abrev: 'Ago' },
      { num: 9, nome: 'Setembro', abrev: 'Set' },
      { num: 10, nome: 'Outubro', abrev: 'Out' },
      { num: 11, nome: 'Novembro', abrev: 'Nov' },
      { num: 12, nome: 'Dezembro', abrev: 'Dez' },
    ];

    const monthlyRealSum: { [key: number]: { count: number; sum: number } } = {};
    for (let m = 1; m <= 12; m++) monthlyRealSum[m] = { count: 0, sum: 0 };

    itens.forEach((it) => {
      let monthNum = 0;
      if (it.data) {
        if (it.data.includes('/')) {
          const parts = it.data.split('/');
          if (parts.length >= 2) monthNum = parseInt(parts[1], 10);
        } else if (it.data.includes('-')) {
          const parts = it.data.split('-');
          if (parts.length >= 2) monthNum = parseInt(parts[1], 10);
        }
      }
      if (monthNum >= 1 && monthNum <= 12) {
        monthlyRealSum[monthNum].count++;
        monthlyRealSum[monthNum].sum += it.valor || 0;
      }
    });

    return nomesMeses.map((m) => {
      const hasData = monthlyRealSum[m.num].count > 0;
      return {
        mes: m.nome,
        mesAbrev: m.abrev,
        mesNum: m.num,
        meta: metasPorMes[m.num] || 7800,
        real: hasData ? Number(monthlyRealSum[m.num].sum.toFixed(2)) : null,
      };
    });
  }, [itens]);

  // GAP Mensal (Real - Meta) por Mês
  const dadosGapAno = useMemo(() => {
    return dadosMetaVsRealAno.map((item) => {
      const hasReal = item.real !== null;
      const gap = hasReal ? Number((item.real! - item.meta).toFixed(2)) : null;
      return {
        ...item,
        gap,
      };
    });
  }, [dadosMetaVsRealAno]);

  // Economia Acumulada YTD calculada dinamicamente
  const economiaAcumulada = useMemo(() => {
    let totalMeta = 0;
    let totalReal = 0;
    let hasAnyReal = false;
    dadosMetaVsRealAno.forEach((m) => {
      if (m.real !== null) {
        hasAnyReal = true;
        totalMeta += m.meta;
        totalReal += m.real;
      }
    });
    if (!hasAnyReal) return { valor: 0, pct: 0, hasData: false };
    const diff = totalReal - totalMeta;
    const pct = totalMeta > 0 ? (diff / totalMeta) * 100 : 0;
    return { valor: diff, pct, hasData: true };
  }, [dadosMetaVsRealAno]);

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
    link.setAttribute('download', `Analise_Trocas_Produtos_Improprios_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* 1. Header & Botão de Importação JSON */}
      <div className="bg-white border border-blue-200 rounded-2xl p-5 sm:p-6 shadow-sm shadow-blue-900/5 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700 border border-blue-200 shadow-inner">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-blue-950 tracking-tight flex items-center gap-2">
                  Trocas de Produtos Impróprios
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1 font-mono">
                    <FileCode className="w-3 h-3" /> Alimentado via JSON
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Processamento dinâmico de dados de trocas e produtos impróprios: KPIs, Pareto de Produtos, Categorias, Marcas e Árvore Hierárquica.
                </p>
              </div>
            </div>
            {nomeArquivo && (
              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-500">
                <span className="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-mono text-emerald-700 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
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
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              title="Importar arquivo JSON ou planilha Excel/CSV de Trocas"
            >
              <UploadCloud className="w-4 h-4 text-white" />
              <span>{isCarregando ? 'Importando...' : 'Importar Dados (JSON / Excel)'}</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Exportar CSV</span>
            </button>
          </div>
        </div>

        {erroImportacao && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{erroImportacao}</span>
          </div>
        )}

        {sucessoImportacao && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{sucessoImportacao}</span>
          </div>
        )}
      </div>

      {/* 2. Cards com os Números Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Valor Total */}
        <div className="bg-white border border-blue-200 rounded-2xl p-4 shadow-sm shadow-blue-900/5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Valor Total
            </span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-blue-950 font-mono">
              {formatCurrency(analise.valorTotal)}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <span>Ticket Médio por Linha:</span>
              <span className="font-mono font-bold text-blue-700">
                {formatCurrency(analise.ticketMedio)}
              </span>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span>Período:</span>
            <span className="font-mono text-slate-700 font-bold">
              {analise.dataMinima} a {analise.dataMaxima}
            </span>
          </div>
        </div>

        {/* Categoria Dominante */}
        <div className="bg-white border border-blue-200 rounded-2xl p-4 shadow-sm shadow-blue-900/5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Categoria Dominante
            </span>
            <div className="p-2 rounded-lg bg-sky-50 text-sky-600 border border-sky-100">
              <FolderTree className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-sky-700 truncate" title={analise.categoriaDominante?.categoria || '-'}>
              {analise.categoriaDominante?.categoria || '-'}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <span>Total Categoria:</span>
              <span className="font-mono font-bold text-slate-800">
                {formatCurrency(analise.categoriaDominante?.valor || 0)}
              </span>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span>Participação:</span>
            <span className="font-mono text-sky-700 font-bold">
              {(analise.categoriaDominante?.percentual || 0).toFixed(1)}% do valor total
            </span>
          </div>
        </div>

        {/* Marca Líder Global */}
        <div className="bg-white border border-blue-200 rounded-2xl p-4 shadow-sm shadow-blue-900/5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Marca Líder
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-emerald-700 truncate" title={analise.marcaLiderGlobal?.marca || '-'}>
              {analise.marcaLiderGlobal?.marca || '-'}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <span>Valor da Marca:</span>
              <span className="font-mono font-bold text-slate-800">
                {formatCurrency(analise.marcaLiderGlobal?.valor || 0)}
              </span>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span>Participação:</span>
            <span className="font-mono text-emerald-700 font-bold">
              {(analise.marcaLiderGlobal?.percentual || 0).toFixed(1)}% do total
            </span>
          </div>
        </div>

        {/* Mês de Maior Ocorrência (Pico) */}
        <div className="bg-white border border-blue-200 rounded-2xl p-4 shadow-sm shadow-blue-900/5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Mês de Pico (Maior Valor)
            </span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600 border border-purple-100">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-purple-700 truncate" title={analise.mesPico?.mesFormatado || '-'}>
              {analise.mesPico?.mesFormatado || '-'}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <span>Valor no Pico:</span>
              <span className="font-mono font-bold text-purple-700">
                {formatCurrency(analise.mesPico?.valor || 0)}
              </span>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span>Impacto no Período:</span>
            <span className="font-mono text-purple-700 font-bold">
              {(analise.mesPico?.percentual || 0).toFixed(1)}% de todo o valor
            </span>
          </div>
        </div>
      </div>

      {/* 4. Dashboard Visual: Linha 1 -> Comparativo Meta vs Real (Ano Todo) + Variação GAP Mensal LADO A LADO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Card 1 (Esquerda): Gráfico Composto Meta vs Real (Ano Completo) */}
        <div className="lg:col-span-7 xl:col-span-8 bg-white border border-blue-200 rounded-2xl p-5 shadow-sm shadow-blue-900/5 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3 border-b border-blue-100">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <h2 className="text-sm sm:text-base font-bold text-blue-950 tracking-wide flex items-center gap-2">
                  Comparativo Meta vs Real (Ano Completo)
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    Jan - Dez
                  </span>
                </h2>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Colunas representam o valor <strong>Realizado</strong> e a linha contínua representa a <strong>Meta</strong> mensal.
              </p>
            </div>

            {/* Legend Badges */}
            <div className="flex items-center gap-3 text-xs font-medium">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-800">
                <div className="w-3 h-3 rounded-sm bg-blue-600" />
                <span>Real (R$)</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
                <div className="w-3 h-0.5 bg-amber-500 rounded-full" />
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 -ml-2.5" />
                <span>Meta (R$)</span>
              </div>
            </div>
          </div>

          {/* Gráfico ComposedChart com Colunas e Linha */}
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={dadosMetaVsRealAno}
                margin={{ top: 15, right: 20, left: 10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.8} vertical={false} />
                <XAxis
                  dataKey="mesAbrev"
                  stroke="#64748b"
                  fontSize={11}
                  tickMargin={8}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  tickFormatter={(v) => `R$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(59, 130, 246, 0.04)' }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null;
                    const item = payload[0]?.payload as MetaRealItem;
                    if (!item) return null;
                    const hasReal = item.real !== null;
                    const diff = hasReal ? item.real! - item.meta : null;
                    const atingimento = hasReal ? (item.real! / item.meta) * 100 : null;

                    return (
                      <div className="bg-white border border-blue-200 rounded-xl p-3.5 shadow-xl min-w-[240px] text-xs font-sans text-slate-800">
                        <div className="font-bold text-blue-950 text-sm border-b border-blue-100 pb-1.5 mb-2 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-blue-600" />
                            {item.mes}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
                            Mês {item.mesNum}/12
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
                            <span className="text-amber-700 font-medium flex items-center gap-1">
                              <Target className="w-3 h-3 text-amber-600" />
                              Meta:
                            </span>
                            <span className="font-mono font-bold text-amber-700">
                              {formatCurrency(item.meta)}
                            </span>
                          </div>

                          <div className="flex justify-between items-center bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
                            <span className="text-blue-700 font-medium flex items-center gap-1">
                              <BarChart2 className="w-3 h-3 text-blue-600" />
                              Realizado:
                            </span>
                            <span className="font-mono font-bold text-blue-700">
                              {hasReal ? formatCurrency(item.real!) : 'Não informado (Pendente)'}
                            </span>
                          </div>

                          {hasReal && (
                            <>
                              <div className="flex justify-between items-center bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
                                <span className="text-slate-600">Desvio (Real - Meta):</span>
                                <span
                                  className={`font-mono font-bold flex items-center gap-1 ${
                                    diff! > 0 ? 'text-rose-600' : 'text-emerald-600'
                                  }`}
                                >
                                  {diff! > 0 ? (
                                    <ArrowUpRight className="w-3 h-3 text-rose-600" />
                                  ) : (
                                    <ArrowDownRight className="w-3 h-3 text-emerald-600" />
                                  )}
                                  {diff! > 0 ? '+' : ''}
                                  {formatCurrency(diff!)}
                                </span>
                              </div>

                              <div className="flex justify-between items-center text-[11px] pt-1.5 border-t border-slate-100">
                                <span className="text-slate-500">Status / Atingimento:</span>
                                <span
                                  className={`font-mono font-black px-2 py-0.5 rounded border ${
                                    atingimento! <= 100
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : 'bg-rose-50 text-rose-700 border-rose-200'
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
                  fill="#2563eb"
                  maxBarSize={40}
                >
                  {dadosMetaVsRealAno.map((entry, index) => (
                    <Cell
                      key={`cell-bar-${index}`}
                      fill={entry.real !== null ? '#2563eb' : '#cbd5e1'}
                    />
                  ))}
                </Bar>

                {/* Linha: Meta (R$) */}
                <Line
                  type="monotone"
                  dataKey="meta"
                  name="Meta (R$)"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 2 (Direita): Variação Orçamentária / GAP Mensal (R$) */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white border border-blue-200 rounded-2xl p-5 shadow-sm shadow-blue-900/5 flex flex-col justify-between">
          <div className="pb-3 mb-3 border-b border-blue-100">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <h2 className="text-sm sm:text-base font-bold text-blue-950 tracking-wide flex items-center gap-2">
                Variação GAP Mensal (R$)
              </h2>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
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
                    stroke="#e2e8f0"
                    opacity={0.8}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="mesAbrev"
                    stroke="#64748b"
                    fontSize={10}
                    interval={0}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#64748b"
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
                    cursor={{ fill: 'rgba(59, 130, 246, 0.04)' }}
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const data = payload[0]?.payload;
                      if (!data) return null;
                      const hasReal = data.real !== null;
                      const gap = data.gap;
                      const isEconomia = gap !== null && gap <= 0;
                      const ating = hasReal ? (data.real / data.meta) * 100 : null;

                      return (
                        <div className="bg-white border border-blue-200 rounded-xl p-3 shadow-xl min-w-[220px] text-xs font-sans text-slate-800">
                          <div className="flex items-center justify-between border-b border-blue-100 pb-1.5 mb-2 gap-2">
                            <span className="font-bold text-blue-950 text-xs flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-blue-600" />
                              {data.mes}
                            </span>
                            {hasReal ? (
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  isEconomia
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                                }`}
                              >
                                {isEconomia ? 'Economia' : 'Acima da Meta'}
                              </span>
                            ) : (
                              <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                Pendente
                              </span>
                            )}
                          </div>

                          {hasReal && gap !== null ? (
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
                                <span className="text-slate-600 text-xs">Variação GAP:</span>
                                <span
                                  className={`font-mono font-black text-xs ${
                                    isEconomia ? 'text-emerald-600' : 'text-rose-600'
                                  }`}
                                >
                                  {gap <= 0 ? '' : '+'}
                                  {formatCurrency(gap)}
                                </span>
                              </div>
                              <div className="flex justify-between text-[11px] text-slate-500 px-1">
                                <span>Real: <strong className="text-blue-700 font-mono">{formatCurrency(data.real)}</strong></span>
                                <span>Meta: <strong className="text-amber-700 font-mono">{formatCurrency(data.meta)}</strong></span>
                              </div>
                              <div className="flex justify-between text-[11px] text-slate-500 px-1 pt-1 border-t border-slate-100">
                                <span>Atingimento:</span>
                                <span className="font-mono font-bold text-slate-800">
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
                  <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="2 2" />
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
            <div className="flex items-center justify-between text-xs text-slate-500 px-1 pt-2 border-t border-slate-100">
              <span className="flex items-center gap-1.5 text-emerald-700 font-medium text-[11px]">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                Abaixo da Meta (Economia)
              </span>
              <span className="flex items-center gap-1.5 text-rose-700 font-medium text-[11px]">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
                Acima (Desvio)
              </span>
            </div>
          </div>

          {/* Total YTD Deviation Footer */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">
              {economiaAcumulada.valor <= 0 ? 'Economia Acumulada (YTD):' : 'Desvio Acumulado (YTD):'}
            </span>
            <span
              className={`font-mono font-black text-xs px-2.5 py-1 rounded-lg border ${
                !economiaAcumulada.hasData
                  ? 'bg-slate-100 text-slate-600 border-slate-200'
                  : economiaAcumulada.valor <= 0
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  : 'text-rose-700 bg-rose-50 border-rose-200'
              }`}
            >
              {!economiaAcumulada.hasData
                ? 'R$ 0,00 (Aguardando importação)'
                : `${economiaAcumulada.valor <= 0 ? '-' : '+'}${formatCurrency(Math.abs(economiaAcumulada.valor))} (${
                    economiaAcumulada.pct <= 0 ? '' : '+'
                  }${economiaAcumulada.pct.toFixed(1)}% da meta)`}
            </span>
          </div>
        </div>
      </div>

      {/* 5. Detalhamento de Categorias & Impacto */}
      <div className="bg-white border border-blue-200 rounded-2xl p-5 shadow-sm shadow-blue-900/5 flex flex-col justify-between">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-blue-100">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <div>
              <h2 className="text-sm sm:text-base font-bold text-blue-950 tracking-wide flex items-center gap-2">
                Detalhamento de Categorias & Impacto
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Distribuição de valor por categoria e marcas líderes associadas.
              </p>
            </div>
          </div>
          <div className="text-xs font-mono px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-950 font-bold">
            Total: <strong className="text-blue-700">{formatCurrency(analise.valorTotal)}</strong>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] text-slate-600 uppercase tracking-wider bg-slate-50">
                <th className="py-2.5 px-3 rounded-l-lg">Categoria</th>
                <th className="py-2.5 px-3">Marca Líder</th>
                <th className="py-2.5 px-3 text-right">Qtd Linhas</th>
                <th className="py-2.5 px-3 text-right">Valor Total</th>
                <th className="py-2.5 px-3 text-right rounded-r-lg">Participação (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {analise.categorias.map((cat, idx) => (
                <tr key={cat.categoria} className="hover:bg-blue-50/50 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-slate-900 flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: PALETA_CORES[idx % PALETA_CORES.length] }}
                    />
                    {cat.categoria}
                  </td>
                  <td className="py-2.5 px-3 text-slate-700">
                    <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-mono text-[11px] text-emerald-700 font-bold">
                      {cat.marcas[0]?.marca || 'N/A'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                    {cat.quantidade}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-950">
                    {formatCurrency(cat.valor)}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-24 bg-slate-200 h-1.5 rounded-full overflow-hidden hidden sm:block">
                        <div
                          className="h-full rounded-full bg-blue-600"
                          style={{ width: `${Math.min(cat.percentual, 100)}%` }}
                        />
                      </div>
                      <span className="font-mono font-bold text-blue-700 text-xs">
                        {cat.percentual.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pt-3 mt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Categoria principal: <strong className="text-slate-900">{analise.categoriaDominante?.categoria}</strong> ({analise.categoriaDominante?.percentual.toFixed(1)}%)
          </span>
          <span className="font-mono text-[11px] text-slate-500">
            {analise.categorias.length} categorias consolidadas
          </span>
        </div>
      </div>

      {/* 5. Árvore de Hierarquia Financeira (Decomposition Tree - Power BI Style) */}
      <DecompositionTree itens={itens} />
    </div>
  );
};
