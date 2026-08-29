import React, { useState, useMemo } from 'react';
import {
  Scale,
  TrendingDown,
  TrendingUp,
  Boxes,
  CheckCircle2,
  AlertTriangle,
  Download,
  Upload,
  FileCode,
  Search,
  Building2,
  Calendar,
  Layers,
  Sparkles,
  BarChart3,
  PieChart as PieIcon,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';
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
} from 'recharts';
import {
  DADOS_INVENTARIO_MARCO_2026,
  EMPTY_INVENTARIO_DATA,
  InventarioFaltasSobrasData,
  ItemFaltaSobra,
} from '../data/mockFaltasSobras';
import { gerarHtmlAutocontido } from '../utils/faltasSobrasHtmlGenerator';
import { ModalImportacaoFaltasSobras } from './ModalImportacaoFaltasSobras';

const CORES = {
  amber: '#f59e0b',
  faltaRed: '#ef4444',
  sobraGreen: '#22c55e',
  neutralBlue: '#3b82f6',
  slate900: '#0f172a',
  slate800: '#1e293b',
  slate400: '#94a3b8',
};

export const FaltasSobrasView: React.FC = () => {
  const [data, setData] = useState<InventarioFaltasSobrasData>(() => {
    const saved = localStorage.getItem('ambev_inventario_faltas_sobras');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return EMPTY_INVENTARIO_DATA;
      }
    }
    return EMPTY_INVENTARIO_DATA;
  });

  // Listen to platform-wide clear and reset events
  React.useEffect(() => {
    const handleClear = () => setData(EMPTY_INVENTARIO_DATA);
    const handleReset = () => {
      try {
        const saved = localStorage.getItem('ambev_inventario_faltas_sobras');
        if (saved) {
          const parsed = JSON.parse(saved);
          setData(parsed);
        } else {
          setData(DADOS_INVENTARIO_MARCO_2026);
        }
      } catch {
        setData(DADOS_INVENTARIO_MARCO_2026);
      }
    };
    window.addEventListener('ambev_platform_data_cleared', handleClear);
    window.addEventListener('ambev_platform_data_reset', handleReset);
    return () => {
      window.removeEventListener('ambev_platform_data_cleared', handleClear);
      window.removeEventListener('ambev_platform_data_reset', handleReset);
    };
  }, []);

  const [activeTab, setActiveTab] = useState<'faltas' | 'sobras'>('faltas');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedGrupo, setSelectedGrupo] = useState<string>('TODOS');
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);

  const formatBRL = (val: number) => {
    return Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatNumber = (val: number, decimals = 0) => {
    return Number(val || 0).toLocaleString('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  // Salvar no localStorage quando atualizar
  const handleSaveData = (newData: InventarioFaltasSobrasData) => {
    setData(newData);
    localStorage.setItem('ambev_inventario_faltas_sobras', JSON.stringify(newData));
  };

  // Baixar HTML autocontido
  const handleDownloadHtml = () => {
    const htmlContent = gerarHtmlAutocontido(data);
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventario-faltas-sobras-${(data.periodo || 'periodo').toLowerCase().replace(/\s+/g, '-')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Lista de grupos únicos para filtro
  const listaGrupos = useMemo(() => {
    const todosItens = [...(data.top_faltas || []), ...(data.top_sobras || [])];
    const grupos = Array.from(new Set(todosItens.map((i) => i.grupo).filter(Boolean)));
    return ['TODOS', ...grupos.sort()];
  }, [data]);

  // Itens da tabela ativa e filtrada
  const tabelaFiltrada = useMemo(() => {
    const listaBase: ItemFaltaSobra[] = activeTab === 'faltas' ? data.top_faltas || [] : data.top_sobras || [];
    return listaBase.filter((item) => {
      const matchSearch =
        searchTerm === '' ||
        item.produto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.grupo.toLowerCase().includes(searchTerm.toLowerCase());
      const matchGrupo = selectedGrupo === 'TODOS' || item.grupo === selectedGrupo;
      return matchSearch && matchGrupo;
    });
  }, [data, activeTab, searchTerm, selectedGrupo]);

  // Dados para Gráfico Falta vs Sobra R$
  const dadosFaltaVsSobra = useMemo(() => {
    return [
      {
        categoria: 'Faltas (Perdas)',
        valor: Math.abs(data.valor_falta || 0),
        fill: CORES.faltaRed,
        corTexto: 'text-red-400',
      },
      {
        categoria: 'Sobras (Excedentes)',
        valor: Math.abs(data.valor_sobra || 0),
        fill: CORES.sobraGreen,
        corTexto: 'text-emerald-400',
      },
    ];
  }, [data]);

  // Dados para Gráfico Horizontal de Grupos
  const gruposOrdenados = useMemo(() => {
    const listaGrupos = data.grupos || (data as any).resumo_grupos || [];
    return [...listaGrupos].sort(
      (a, b) => a.valor_diferenca - b.valor_diferenca
    );
  }, [data]);

  // Dados para Gráfico de Rosca Status
  const dadosStatusRosca = useMemo(() => {
    return [
      { name: 'Itens 100% OK', value: data.itens_ok || 0, fill: CORES.neutralBlue },
      { name: 'Itens em Falta', value: data.itens_falta || 0, fill: CORES.faltaRed },
      { name: 'Itens em Sobra', value: data.itens_sobra || 0, fill: CORES.sobraGreen },
    ];
  }, [data]);

  const acuracidadePct = data.total_itens > 0 ? ((data.itens_ok / data.total_itens) * 100).toFixed(1) : '0.0';

  return (
    <div id="view-faltas-sobras" className="space-y-6 animate-fadeIn pb-16">
      {/* 1. Header Executivo */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-2xl relative overflow-hidden flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-1.5 relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1.5 shadow-xs">
              <Scale className="w-3.5 h-3.5" />
              Inventário de Produto Acabado
            </span>
            <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center gap-1.5">
              <Boxes className="w-3.5 h-3.5" />
              Físico vs Disponível
            </span>
          </div>

          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Dashboard de Faltas &amp; Sobras — Estoque de Produto Acabado
          </h1>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-medium pt-0.5">
            <span className="flex items-center gap-1 text-slate-300">
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              {data.unidade || 'CDD AMBEV'}
            </span>
            <span>•</span>
            <span className="text-slate-300 font-mono font-bold">{data.total_itens || 0}</span> itens auditados
            <span>•</span>
            <span>Estoque Total: <strong className="text-amber-400 font-mono font-bold">{formatBRL(data.total_estoque)}</strong></span>
          </div>
        </div>

        {/* Action Controls & Badge */}
        <div className="flex flex-wrap items-center gap-2.5 relative z-10 shrink-0">
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-2 rounded-xl text-xs font-black tracking-wider uppercase flex items-center gap-1.5 shadow-xs">
            <Calendar className="w-3.5 h-3.5" />
            {data.periodo || 'MARÇO 2026'}
          </div>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all active:scale-95 cursor-pointer"
            title="Importar e alimentar dados de Faltas & Sobras"
          >
            <Upload className="w-3.5 h-3.5" />
            Alimentar Faltas &amp; Sobras
          </button>

          <button
            onClick={handleDownloadHtml}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
            title="Exportar como arquivo HTML independente"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            Baixar HTML Single-File
          </button>
        </div>
      </div>

      {/* 2. Grid de 5 Cards de KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Estoque Total */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg relative overflow-hidden border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Valor do Estoque</span>
            <Boxes className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-black text-white font-mono tracking-tight">
            {formatBRL(data.total_estoque)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span className="font-semibold text-slate-300">{data.total_itens}</span> SKUs inventariados
          </div>
        </div>

        {/* Card 2: Diferença Líquida */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg relative overflow-hidden border-l-4 border-l-amber-400">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Diferença Líquida</span>
            <Scale className="w-4 h-4 text-amber-400" />
          </div>
          <div
            className={`text-xl font-black font-mono tracking-tight ${
              data.total_diferenca < 0 ? 'text-red-400' : 'text-emerald-400'
            }`}
          >
            {formatBRL(data.total_diferenca)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {data.total_diferenca < 0 ? 'Déficit no inventário' : 'Superávit no inventário'}
          </div>
        </div>

        {/* Card 3: Faltas Totais */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg relative overflow-hidden border-l-4 border-l-red-500">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-400/90">Faltas Totais (R$)</span>
            <TrendingDown className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-xl font-black text-red-400 font-mono tracking-tight">
            {formatBRL(data.valor_falta)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>{data.itens_falta} produtos</span>
            <span className="text-red-400/80 font-mono text-[10px]">
              {data.total_estoque > 0 ? ((Math.abs(data.valor_falta) / data.total_estoque) * 100).toFixed(2) : '0.00'}% do estoque
            </span>
          </div>
        </div>

        {/* Card 4: Sobras Totais */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg relative overflow-hidden border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400/90">Sobras Totais (R$)</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-emerald-400 font-mono tracking-tight">
            +{formatBRL(data.valor_sobra)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>{data.itens_sobra} produtos</span>
            <span className="text-emerald-400/80 font-mono text-[10px]">
              {data.total_estoque > 0 ? ((Math.abs(data.valor_sobra) / data.total_estoque) * 100).toFixed(2) : '0.00'}% do estoque
            </span>
          </div>
        </div>

        {/* Card 5: Acuracidade de Itens */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg relative overflow-hidden border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400/90">Acuracidade SKUs</span>
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-black text-blue-400 font-mono tracking-tight">
            {acuracidadePct}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>{data.itens_ok} de {data.total_itens} OK</span>
            <span className="text-[10px] text-slate-400 font-mono">100% batimento</span>
          </div>
        </div>
      </div>

      {/* 3. Seção Visual: Gráficos de Análise de Faltas e Sobras */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Gráfico 1: Comparativo Falta vs Sobra (R$) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-400" />
                Impacto Financeiro Bruto (R$)
              </h2>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Faltas vs Sobras
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Comparativo em valor monetário absoluto apurado no inventário físico
            </p>

            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosFaltaVsSobra} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <XAxis dataKey="categoria" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                    formatter={(value: any) => [formatBRL(Number(value)), 'Valor']}
                  />
                  <Bar dataKey="valor" radius={[8, 8, 0, 0]}>
                    {dadosFaltaVsSobra.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800 text-xs">
            <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
              <div className="text-[10px] text-red-400 uppercase font-bold">Faltas</div>
              <div className="text-sm font-mono font-bold text-red-400">{formatBRL(data.valor_falta)}</div>
            </div>
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <div className="text-[10px] text-emerald-400 uppercase font-bold">Sobras</div>
              <div className="text-sm font-mono font-bold text-emerald-400">+{formatBRL(data.valor_sobra)}</div>
            </div>
          </div>
        </div>

        {/* Gráfico 2: Divergência por Grupo de Produto (R$) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                Diferença Líquida por Grupo
              </h2>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Posição Líquida
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Saldo financeiro (R$) acumulado por categoria de embalagem
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {gruposOrdenados.map((g, idx) => {
                const isNeg = g.valor_diferenca < 0;
                return (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between hover:border-slate-700 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-slate-200">{g.grupo}</div>
                      <div className="text-[10px] text-slate-400">
                        {g.itens} SKUs • Estoque: {formatBRL(g.valor_estoque)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-xs font-mono font-bold ${
                          isNeg ? 'text-red-400' : 'text-emerald-400'
                        }`}
                      >
                        {isNeg ? '' : '+'}
                        {formatBRL(g.valor_diferenca)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {g.valor_estoque > 0
                          ? ((g.valor_diferenca / g.valor_estoque) * 100).toFixed(2)
                          : '0.00'}
                        %
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-[11px] text-slate-400 pt-3 border-t border-slate-800 text-center">
            Total de {gruposOrdenados.length} grupos mapeados na unidade
          </div>
        </div>

        {/* Gráfico 3: Distribuição de SKUs por Status (Rosca) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-amber-400" />
                Acuracidade de Itens (SKUs)
              </h2>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Contagem
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-2">
              Proporção de itens sem divergência versus itens com falta ou sobra
            </p>

            <div className="h-44 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dadosStatusRosca}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                  >
                    {dadosStatusRosca.map((entry, index) => (
                      <Cell key={`slice-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [`${val} SKUs`, 'Quantidade']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-lg font-black text-white font-mono">{acuracidadePct}%</span>
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Acuracidade</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                Itens 100% Corretos
              </span>
              <span className="font-mono font-bold text-blue-400">{data.itens_ok} SKUs</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                Itens em Falta
              </span>
              <span className="font-mono font-bold text-red-400">{data.itens_falta} SKUs</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Itens em Sobra
              </span>
              <span className="font-mono font-bold text-emerald-400">{data.itens_sobra} SKUs</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Tabela Interativa de Top Faltas & Top Sobras */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl space-y-4">
        {/* Sub-Header da Tabela */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          {/* Abas Alternadoras Faltas / Sobras */}
          <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl">
            <button
              onClick={() => setActiveTab('faltas')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'faltas'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingDown className="w-4 h-4" />
              <span>Top Faltas (Perdas)</span>
              <span className="px-1.5 py-0.2 bg-red-500/30 text-red-300 rounded text-[10px] font-mono">
                {data.top_faltas?.length || 0}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('sobras')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'sobras'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Top Sobras (Excedentes)</span>
              <span className="px-1.5 py-0.2 bg-emerald-500/30 text-emerald-300 rounded text-[10px] font-mono">
                {data.top_sobras?.length || 0}
              </span>
            </button>
          </div>

          {/* Filtros de Busca e Grupo */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar produto ou grupo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <select
              value={selectedGrupo}
              onChange={(e) => setSelectedGrupo(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-amber-500 transition-colors"
            >
              {listaGrupos.map((grp) => (
                <option key={grp} value={grp}>
                  {grp === 'TODOS' ? 'Todos os Grupos' : grp}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Container da Tabela */}
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Produto (SKU)</th>
                <th className="py-3 px-4">Grupo</th>
                <th className="py-3 px-4 text-right">Físico</th>
                <th className="py-3 px-4 text-right">Disponível</th>
                <th className="py-3 px-4 text-right">Dif. Qtd</th>
                <th className="py-3 px-4 text-right">Dif. %</th>
                <th className="py-3 px-4 text-right">Impacto R$</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {tabelaFiltrada.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Nenhum item encontrado com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                tabelaFiltrada.map((item, idx) => {
                  const isFalta = activeTab === 'faltas';
                  return (
                    <tr
                      key={idx}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                      <td className="py-3 px-4 text-slate-100 font-semibold max-w-xs truncate" title={item.produto}>
                        {item.produto}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {item.grupo}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-300">
                        {formatNumber(item.fisico, 0)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-300">
                        {formatNumber(item.disponivel, 0)}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-mono font-bold ${
                          item.diferenca_qtd < 0 ? 'text-red-400' : 'text-emerald-400'
                        }`}
                      >
                        {item.diferenca_qtd > 0 ? `+${formatNumber(item.diferenca_qtd, 0)}` : formatNumber(item.diferenca_qtd, 0)}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-mono ${
                          item.pct_diferenca < 0 ? 'text-red-400' : 'text-emerald-400'
                        }`}
                      >
                        {item.pct_diferenca > 0 ? `+${formatNumber(item.pct_diferenca, 1)}%` : `${formatNumber(item.pct_diferenca, 1)}%`}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-mono font-bold ${
                          isFalta ? 'text-red-400' : 'text-emerald-400'
                        }`}
                      >
                        {item.valor_diferenca > 0 ? `+${formatBRL(item.valor_diferenca)}` : formatBRL(item.valor_diferenca)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                            isFalta
                              ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {isFalta ? (
                            <>
                              <TrendingDown className="w-3 h-3" /> Falta
                            </>
                          ) : (
                            <>
                              <TrendingUp className="w-3 h-3" /> Sobra
                            </>
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="text-right text-[11px] text-slate-400 pt-1">
          Exibindo os maiores impactos de {activeTab === 'faltas' ? 'Faltas' : 'Sobras'}
        </div>
      </div>

      {/* Modal de Alimentação de Dados Faltas & Sobras */}
      <ModalImportacaoFaltasSobras
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={handleSaveData}
      />
    </div>
  );
};
