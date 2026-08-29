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
import { TabHeaderBanner } from './common/TabHeaderBanner';
import { PALETA_AMBEV, CORES_GRAFICOS_AMBEV } from '../utils/themeStyles';

const CORES = {
  amber: PALETA_AMBEV.ambar,
  faltaRed: '#ef4444',
  sobraGreen: '#10b981',
  neutralBlue: PALETA_AMBEV.azul,
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
    <div id="view-faltas-sobras" className="space-y-6 animate-fadeIn pb-16 text-slate-900">
      {/* 1. Header Executivo */}
      <TabHeaderBanner
        categoryBadge="MÓDULO 3 • AUDITORIA DE ESTOQUE"
        categoryIcon={<Scale className="w-3.5 h-3.5 text-amber-400" />}
        title="DASHBOARD DE FALTAS & SOBRAS — PRODUTO ACABADO"
        description={
          <span>
            Inventário físico vs disponível • {data.unidade || 'CDD AMBEV'} •{' '}
            <strong className="text-amber-300 font-bold">{data.total_itens || 0} SKUs auditados</strong> — Estoque Total:{' '}
            <strong className="text-white font-bold">{formatBRL(data.total_estoque)}</strong>
          </span>
        }
        rightContent={
          <>
            <div className="bg-amber-400/20 border border-amber-400/40 text-amber-300 px-3 py-2 rounded-xl text-xs font-black tracking-wider uppercase flex items-center gap-1.5 shadow-xs">
              <Calendar className="w-3.5 h-3.5" />
              {data.periodo || 'MARÇO 2026'}
            </div>

            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer"
              title="Importar e alimentar dados de Faltas & Sobras"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Alimentar Faltas &amp; Sobras</span>
            </button>

            <button
              onClick={handleDownloadHtml}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
              title="Exportar como arquivo HTML independente"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Baixar HTML Single-File</span>
            </button>
          </>
        }
      />

      {/* 2. Grid de 5 Cards de KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Estoque Total */}
        <div className="bg-white border border-blue-200/90 hover:border-blue-500 rounded-2xl p-4 transition-all duration-200 shadow-sm hover:shadow-md shadow-blue-900/5 hover:-translate-y-0.5 group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Valor do Estoque</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-black text-slate-900 font-mono tracking-tight truncate">
            {formatBRL(data.total_estoque)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="font-semibold text-slate-700">{data.total_itens}</span> SKUs inventariados
          </div>
        </div>

        {/* Card 2: Diferença Líquida */}
        <div className="bg-white border border-blue-200/90 hover:border-blue-500 rounded-2xl p-4 transition-all duration-200 shadow-sm hover:shadow-md shadow-blue-900/5 hover:-translate-y-0.5 group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Diferença Líquida</span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-base sm:text-lg font-black font-mono tracking-tight ${
              data.total_diferenca < 0 ? 'text-rose-600' : 'text-emerald-600'
            }`}
          >
            {formatBRL(data.total_diferenca)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            {data.total_diferenca < 0 ? 'Déficit no inventário' : 'Superávit no inventário'}
          </div>
        </div>

        {/* Card 3: Faltas Totais */}
        <div className="bg-white border border-blue-200/90 hover:border-blue-500 rounded-2xl p-4 transition-all duration-200 shadow-sm hover:shadow-md shadow-blue-900/5 hover:-translate-y-0.5 group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Faltas Totais</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-black text-rose-600 font-mono tracking-tight truncate">
            {formatBRL(data.valor_falta)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
            <span>{data.itens_falta} produtos</span>
            <span className="text-rose-600 font-mono text-[10px] font-semibold">
              {data.total_estoque > 0 ? ((Math.abs(data.valor_falta) / data.total_estoque) * 100).toFixed(2) : '0.00'}%
            </span>
          </div>
        </div>

        {/* Card 4: Sobras Totais */}
        <div className="bg-white border border-blue-200/90 hover:border-blue-500 rounded-2xl p-4 transition-all duration-200 shadow-sm hover:shadow-md shadow-blue-900/5 hover:-translate-y-0.5 group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Sobras Totais</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-black text-emerald-600 font-mono tracking-tight truncate">
            +{formatBRL(data.valor_sobra)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
            <span>{data.itens_sobra} produtos</span>
            <span className="text-emerald-600 font-mono text-[10px] font-semibold">
              {data.total_estoque > 0 ? ((Math.abs(data.valor_sobra) / data.total_estoque) * 100).toFixed(2) : '0.00'}%
            </span>
          </div>
        </div>

        {/* Card 5: Acuracidade de Itens */}
        <div className="bg-white border border-blue-200/90 hover:border-blue-500 rounded-2xl p-4 transition-all duration-200 shadow-sm hover:shadow-md shadow-blue-900/5 hover:-translate-y-0.5 group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Acuracidade SKUs</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-black text-blue-950 font-mono tracking-tight">
            {acuracidadePct}%
          </div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
            <span>{data.itens_ok} de {data.total_itens} OK</span>
            <span className="text-[10px] text-emerald-600 font-bold">100% batimento</span>
          </div>
        </div>
      </div>

      {/* 3. Seção Visual: Gráficos de Análise de Faltas e Sobras */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Gráfico 1: Comparativo Falta vs Sobra (R$) */}
        <div className="bg-white border border-blue-200/90 rounded-2xl p-5 shadow-sm shadow-blue-900/5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-extrabold text-blue-950 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-500" />
                Impacto Financeiro Bruto (R$)
              </h2>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Faltas vs Sobras
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Comparativo em valor monetário absoluto apurado no inventário físico
            </p>

            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosFaltaVsSobra} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="categoria" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={10}
                    tickLine={false}
                    tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(59, 130, 246, 0.04)' }}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#cbd5e1',
                      borderRadius: '12px',
                      color: '#0f172a',
                      fontSize: '12px',
                    }}
                    formatter={(value: any) => [formatBRL(Number(value)), 'Valor']}
                  />
                  <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
                    {dadosFaltaVsSobra.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs">
            <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-center">
              <div className="text-[10px] text-rose-600 uppercase font-bold">Faltas</div>
              <div className="text-sm font-mono font-bold text-rose-700">{formatBRL(data.valor_falta)}</div>
            </div>
            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
              <div className="text-[10px] text-emerald-600 uppercase font-bold">Sobras</div>
              <div className="text-sm font-mono font-bold text-emerald-700">+{formatBRL(data.valor_sobra)}</div>
            </div>
          </div>
        </div>

        {/* Gráfico 2: Divergência por Grupo de Produto (R$) */}
        <div className="bg-white border border-blue-200/90 rounded-2xl p-5 shadow-sm shadow-blue-900/5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-extrabold text-blue-950 flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-500" />
                Diferença Líquida por Grupo
              </h2>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Posição Líquida
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Saldo financeiro (R$) acumulado por categoria de embalagem
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {gruposOrdenados.map((g, idx) => {
                const isNeg = g.valor_diferenca < 0;
                return (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between hover:border-slate-300 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-slate-800">{g.grupo}</div>
                      <div className="text-[10px] text-slate-500">
                        {g.itens} SKUs • Estoque: {formatBRL(g.valor_estoque)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-xs font-mono font-bold ${
                          isNeg ? 'text-rose-600' : 'text-emerald-600'
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

          <div className="text-[11px] text-slate-500 pt-3 border-t border-slate-100 text-center">
            Total de {gruposOrdenados.length} grupos mapeados na unidade
          </div>
        </div>

        {/* Gráfico 3: Distribuição de SKUs por Status (Rosca) */}
        <div className="bg-white border border-blue-200/90 rounded-2xl p-5 shadow-sm shadow-blue-900/5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-extrabold text-blue-950 flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-amber-500" />
                Acuracidade de Itens (SKUs)
              </h2>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Contagem
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-2">
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
                    stroke="#ffffff"
                    strokeWidth={2}
                  >
                    {dadosStatusRosca.map((entry, index) => (
                      <Cell key={`slice-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#cbd5e1',
                      borderRadius: '12px',
                      color: '#0f172a',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [`${val} SKUs`, 'Quantidade']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-lg font-black text-blue-950 font-mono">{acuracidadePct}%</span>
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Acuracidade</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center justify-between text-slate-700">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                Itens 100% Corretos
              </span>
              <span className="font-mono font-bold text-blue-800">{data.itens_ok} SKUs</span>
            </div>
            <div className="flex items-center justify-between text-slate-700">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                Itens em Falta
              </span>
              <span className="font-mono font-bold text-rose-600">{data.itens_falta} SKUs</span>
            </div>
            <div className="flex items-center justify-between text-slate-700">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Itens em Sobra
              </span>
              <span className="font-mono font-bold text-emerald-600">{data.itens_sobra} SKUs</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Tabela Interativa de Top Faltas & Top Sobras */}
      <div className="bg-white border border-blue-200/90 rounded-2xl p-5 md:p-6 shadow-sm shadow-blue-900/5 space-y-4">
        {/* Sub-Header da Tabela */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          {/* Abas Alternadoras Faltas / Sobras */}
          <div className="flex items-center p-1 bg-slate-100 border border-slate-200 rounded-xl">
            <button
              onClick={() => setActiveTab('faltas')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'faltas'
                  ? 'bg-white text-rose-700 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingDown className="w-4 h-4 text-rose-600" />
              <span>Top Faltas (Perdas)</span>
              <span className="px-1.5 py-0.2 bg-rose-100 text-rose-700 rounded text-[10px] font-mono">
                {data.top_faltas?.length || 0}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('sobras')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'sobras'
                  ? 'bg-white text-emerald-700 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Top Sobras (Excedentes)</span>
              <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-700 rounded text-[10px] font-mono">
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
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <select
              value={selectedGrupo}
              onChange={(e) => setSelectedGrupo(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-amber-500 transition-colors"
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
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
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
            <tbody className="divide-y divide-slate-100 font-medium">
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
                      className="hover:bg-slate-50 transition-colors group"
                    >
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{idx + 1}</td>
                      <td className="py-3 px-4 text-slate-900 font-semibold max-w-xs truncate" title={item.produto}>
                        {item.produto}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {item.grupo}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700">
                        {formatNumber(item.fisico, 0)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700">
                        {formatNumber(item.disponivel, 0)}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-mono font-bold ${
                          item.diferenca_qtd < 0 ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {item.diferenca_qtd > 0 ? `+${formatNumber(item.diferenca_qtd, 0)}` : formatNumber(item.diferenca_qtd, 0)}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-mono ${
                          item.pct_diferenca < 0 ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {item.pct_diferenca > 0 ? `+${formatNumber(item.pct_diferenca, 1)}%` : `${formatNumber(item.pct_diferenca, 1)}%`}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-mono font-bold ${
                          isFalta ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {item.valor_diferenca > 0 ? `+${formatBRL(item.valor_diferenca)}` : formatBRL(item.valor_diferenca)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                            isFalta
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
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

        <div className="text-right text-[11px] text-slate-500 pt-1">
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
