import React, { useState, useMemo, useEffect } from 'react';
import {
  Boxes,
  Package,
  DollarSign,
  TrendingUp,
  FileSpreadsheet,
  FileCode,
  Upload,
  Download,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Layers,
  Sparkles,
  BarChart2,
  Trash2,
  Edit2,
  User,
  Clock,
  Building,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Info,
  Calendar,
  Truck,
  Hash,
  Droplet,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  Legend,
  PieChart,
  Pie,
} from 'recharts';
import { QuebraMovimentacaoItem, QuebrasMovFiltros } from '../../types/quebrasMovimentacao';
import { DEMO_QUEBRAS_MOVIMENTACAO } from '../../data/mockQuebrasMovimentacao';
import {
  formatBRL,
  formatNumber,
  formatHL,
  formatPercent,
  formatDataHoraAbreviada,
  calcularMetricasQuebrasMov,
  agruparPorMes,
  agruparPorFuncionario,
  agruparPorProduto,
  agruparPorMotivo,
  agruparPorTurno,
  agruparPorSetor,
  normalizarTurno,
  exportarQuebrasMovCSV,
} from '../../utils/quebrasMovimentacaoUtils';
import { QuebrasMovJsonImportModal } from './QuebrasMovJsonImportModal';
import { QuebrasMovModalForm } from './QuebrasMovModalForm';
import { TabHeaderBanner } from '../common/TabHeaderBanner';

const CORES_GRAFICOS = ['#f59e0b', '#38bdf8', '#10b981', '#a855f7', '#f43f5e', '#6366f1', '#14b8a6', '#eab308'];

export const QuebrasMovimentacaoView: React.FC = () => {
  // State for items with LocalStorage cache - strictly starting with imported data (empty if nothing imported)
  const [items, setItems] = useState<QuebraMovimentacaoItem[]>(() => {
    try {
      const cached = localStorage.getItem('AMBEV_QUEBRAS_MOVIMENTACAO');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  // Helper to persist and sync across tabs and backend
  const persistAndSync = async (newItems: QuebraMovimentacaoItem[]) => {
    setItems(newItems);
    try {
      localStorage.setItem('AMBEV_QUEBRAS_MOVIMENTACAO', JSON.stringify(newItems));
    } catch {
      // ignore
    }
    await fetch('/api/quebras-movimentacao/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: newItems, overwrite: true }),
    }).catch(() => {});

    try {
      window.dispatchEvent(new CustomEvent('ambev_quebras_mov_updated'));
    } catch {}
  };

  // Fetch initial data from server on mount and listen to sync events
  useEffect(() => {
    fetch('/api/quebras-movimentacao')
      .then((res) => (res.ok ? res.json() : null))
      .then((serverData) => {
        if (Array.isArray(serverData) && serverData.length > 0) {
          setItems(serverData);
          try {
            localStorage.setItem('AMBEV_QUEBRAS_MOVIMENTACAO', JSON.stringify(serverData));
          } catch {}
        }
      })
      .catch(() => {});

    const handleUpdate = () => {
      try {
        const cached = localStorage.getItem('AMBEV_QUEBRAS_MOVIMENTACAO');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) setItems(parsed);
          else setItems([]);
        } else {
          setItems([]);
        }
      } catch {
        setItems([]);
      }
    };

    const handleClear = () => {
      setItems([]);
      try {
        localStorage.removeItem('AMBEV_QUEBRAS_MOVIMENTACAO');
      } catch {}
    };

    window.addEventListener('ambev_quebras_mov_updated', handleUpdate);
    window.addEventListener('ambev_platform_data_cleared', handleClear);
    window.addEventListener('ambev_platform_data_reset', handleUpdate);

    return () => {
      window.removeEventListener('ambev_quebras_mov_updated', handleUpdate);
      window.removeEventListener('ambev_platform_data_cleared', handleClear);
      window.removeEventListener('ambev_platform_data_reset', handleUpdate);
    };
  }, []);

  // Filters State
  const [filtros, setFiltros] = useState<QuebrasMovFiltros>({
    busca: '',
    mes: '',
    turno: '',
    setor: '',
    cargo: '',
    funcionario: '',
    motivo: '',
    dataInicio: '',
    dataFim: '',
  });

  // Modals
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [itemEditando, setItemEditando] = useState<QuebraMovimentacaoItem | null>(null);

  // Pagination & Sorting
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [sortField, setSortField] = useState<keyof QuebraMovimentacaoItem>('data_hora');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Dynamic Options for Filters
  const mesesDisponiveis = useMemo(() => {
    const s = new Set(items.map((i) => (i.mes || 'JANEIRO').toUpperCase()));
    return Array.from(s).sort();
  }, [items]);

  const turnosDisponiveis = useMemo(() => {
    const s = new Set(items.map((i) => normalizarTurno(i.turno)));
    return Array.from(s).sort();
  }, [items]);

  const setoresDisponiveis = useMemo(() => {
    const s = new Set(items.map((i) => (i.area || i.setor || 'ARMAZEM').toUpperCase()));
    return Array.from(s).sort();
  }, [items]);

  const cargosDisponiveis = useMemo(() => {
    const s = new Set(items.map((i) => (i.funcao || i.cargo || 'EMPILHADOR').toUpperCase()));
    return Array.from(s).sort();
  }, [items]);

  const motivosDisponiveis = useMemo(() => {
    const s = new Set(items.map((i) => (i.motivo || 'FALTA NO PALETE').toUpperCase()));
    return Array.from(s).sort();
  }, [items]);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Busca geral
      if (filtros.busca) {
        const query = filtros.busca.toLowerCase();
        const matchProd = (item.produto || '').toLowerCase().includes(query);
        const matchFunc = (item.colaborador || item.funcionario || '').toLowerCase().includes(query);
        const matchCargo = (item.funcao || item.cargo || '').toLowerCase().includes(query);
        const matchCod = String(item.codigo_produto || '').includes(query);
        const matchMotivo = (item.motivo || '').toLowerCase().includes(query);
        const matchArea = (item.area || item.setor || '').toLowerCase().includes(query);
        const matchObs = (item.observacao || '').toLowerCase().includes(query);
        if (!matchProd && !matchFunc && !matchCargo && !matchCod && !matchMotivo && !matchArea && !matchObs) {
          return false;
        }
      }

      // Mês
      if (filtros.mes && (item.mes || '').toUpperCase() !== filtros.mes.toUpperCase()) {
        return false;
      }

      // Turno
      if (filtros.turno && normalizarTurno(item.turno) !== filtros.turno) {
        return false;
      }

      // Setor / Área
      if (filtros.setor && (item.area || item.setor || '').toUpperCase() !== filtros.setor.toUpperCase()) {
        return false;
      }

      // Cargo / Função
      if (filtros.cargo && (item.funcao || item.cargo || '').toUpperCase() !== filtros.cargo.toUpperCase()) {
        return false;
      }

      // Motivo
      if (filtros.motivo && (item.motivo || '').toUpperCase() !== filtros.motivo.toUpperCase()) {
        return false;
      }

      // Funcionário / Colaborador
      if (
        filtros.funcionario &&
        (item.colaborador || item.funcionario || '').toUpperCase() !== filtros.funcionario.toUpperCase()
      ) {
        return false;
      }

      // Datas
      if (filtros.dataInicio) {
        const itemDate = item.data_hora.slice(0, 10);
        if (itemDate < filtros.dataInicio) return false;
      }
      if (filtros.dataFim) {
        const itemDate = item.data_hora.slice(0, 10);
        if (itemDate > filtros.dataFim) return false;
      }

      return true;
    });
  }, [items, filtros]);

  // Sorted Items
  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];

      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortAsc ? valA - valB : valB - valA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      return sortAsc ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });
  }, [filteredItems, sortField, sortAsc]);

  // Paginated Items
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedItems.slice(start, start + itemsPerPage);
  }, [sortedItems, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedItems.length / itemsPerPage) || 1;

  // Metrics
  const metricas = useMemo(() => {
    return calcularMetricasQuebrasMov(filteredItems);
  }, [filteredItems]);

  // Aggregated data for charts
  const dadosMensais = useMemo(() => agruparPorMes(filteredItems), [filteredItems]);
  const dadosProdutos = useMemo(() => agruparPorProduto(filteredItems, 8), [filteredItems]);
  const dadosFuncionarios = useMemo(() => agruparPorFuncionario(filteredItems, 8), [filteredItems]);
  const dadosMotivos = useMemo(() => agruparPorMotivo(filteredItems, 8), [filteredItems]);
  const dadosTurnos = useMemo(() => agruparPorTurno(filteredItems), [filteredItems]);
  const dadosSetores = useMemo(() => agruparPorSetor(filteredItems), [filteredItems]);

  // Handlers
  const handleSort = (field: keyof QuebraMovimentacaoItem) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const handleSaveItem = async (itemData: Omit<QuebraMovimentacaoItem, 'id'>, id?: string) => {
    if (id) {
      const updated = items.map((item) => (item.id === id ? { ...itemData, id } : item));
      await persistAndSync(updated);
    } else {
      const newItem: QuebraMovimentacaoItem = {
        ...itemData,
        id: `qm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        createdAt: new Date().toISOString(),
      };
      await persistAndSync([newItem, ...items]);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta ocorrência de quebra?')) {
      const updated = items.filter((item) => item.id !== id);
      await persistAndSync(updated);
    }
  };

  const handleImportJson = async (newItems: QuebraMovimentacaoItem[], replaceExisting: boolean = true) => {
    const finalItems = replaceExisting ? newItems : [...newItems, ...items];
    await persistAndSync(finalItems);
  };

  const handleClearWQI = async () => {
    if (window.confirm('Deseja limpar todos os registros de Quebras de Movimentação (WQI)?')) {
      await persistAndSync([]);
      setFiltros({
        busca: '',
        mes: '',
        turno: '',
        setor: '',
        cargo: '',
        funcionario: '',
        motivo: '',
        dataInicio: '',
        dataFim: '',
      });
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn text-slate-900">
      {/* 1. TOP HEADER & ACTION BAR */}
      <TabHeaderBanner
        categoryBadge="MÓDULO 2 • LOGÍSTICA & ARMAZÉM"
        categoryIcon={<Boxes className="w-3.5 h-3.5 text-amber-400" />}
        title="QUEBRAS DE MOVIMENTAÇÃO DO ARMAZÉM"
        description={
          <span>
            Gestão de perdas operacionais • WQI 524 / 539 • Motivo, Colaborador, Função, Valor da Avaria (R$) e Hecto Perdido (HL) —{' '}
            <strong className="text-amber-300 font-bold">{items.length} registros importados</strong>
          </span>
        }
        rightContent={
          <>
            <button
              onClick={() => {
                setItemEditando(null);
                setIsFormModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black shadow-md transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Lançamento</span>
            </button>

            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-md"
            >
              <FileCode className="w-4 h-4" />
              <span>Importar JSON</span>
            </button>

            {items.length > 0 && (
              <>
                <button
                  onClick={() => exportarQuebrasMovCSV(filteredItems)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Exportar CSV</span>
                </button>

                <button
                  onClick={handleClearWQI}
                  title="Limpar todos os registros de quebras"
                  className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-950/80 hover:bg-rose-950 text-rose-300 border border-rose-900/50 text-xs font-bold transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Limpar</span>
                </button>
              </>
            )}
          </>
        }
      />

      {/* 2. EXECUTIVE KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card 1: Total Loss R$ */}
        <div className="bg-white border border-blue-200/90 hover:border-blue-500 rounded-2xl p-4 transition-all duration-200 shadow-sm hover:shadow-md shadow-blue-900/5 hover:-translate-y-0.5 group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Valor Avaria</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center group-hover:scale-110 transition-transform">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-black font-mono text-slate-900 truncate">
            {formatBRL(metricas.totalValor)}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Total avariado</p>
        </div>

        {/* Card 2: Hecto Perdido HL */}
        <div className="bg-white border border-blue-200/90 hover:border-blue-500 rounded-2xl p-4 transition-all duration-200 shadow-sm hover:shadow-md shadow-blue-900/5 hover:-translate-y-0.5 group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Hecto Perdido</span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Droplet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-black font-mono text-sky-700">
            {formatHL(metricas.totalHlPerdido)}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">{formatNumber(metricas.totalQuantidade)} un. físicas</p>
        </div>

        {/* Card 3: Ocorrências */}
        <div className="bg-white border border-blue-200/90 hover:border-blue-500 rounded-2xl p-4 transition-all duration-200 shadow-sm hover:shadow-md shadow-blue-900/5 hover:-translate-y-0.5 group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Ocorrências</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-black font-mono text-blue-950">
            {formatNumber(metricas.totalOcorrencias)}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Registros de avaria</p>
        </div>

        {/* Card 4: Top Motivo */}
        <div className="bg-white border border-blue-200/90 hover:border-blue-500 rounded-2xl p-4 transition-all duration-200 shadow-sm hover:shadow-md shadow-blue-900/5 hover:-translate-y-0.5 group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Top Motivo</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xs sm:text-sm font-black text-slate-900 truncate" title={metricas.topMotivo?.motivo || '-'}>
            {metricas.topMotivo ? metricas.topMotivo.motivo : '-'}
          </div>
          <p className="text-[10px] font-mono text-slate-500 mt-1">
            {metricas.topMotivo ? `${formatBRL(metricas.topMotivo.valor)}` : '-'}
          </p>
        </div>

        {/* Card 5: Top Colaborador */}
        <div className="bg-white border border-blue-200/90 hover:border-blue-500 rounded-2xl p-4 transition-all duration-200 shadow-sm hover:shadow-md shadow-blue-900/5 hover:-translate-y-0.5 group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Top Colaborador</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center group-hover:scale-110 transition-transform">
              <User className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xs sm:text-sm font-black text-slate-900 truncate" title={metricas.topFuncionario?.nome || '-'}>
            {metricas.topFuncionario ? metricas.topFuncionario.nome : '-'}
          </div>
          <p className="text-[10px] font-mono text-slate-500 mt-1">
            {metricas.topFuncionario ? `${formatBRL(metricas.topFuncionario.valor)}` : '-'}
          </p>
        </div>

        {/* Card 6: Top Produto SKU */}
        <div className="bg-white border border-blue-200/90 hover:border-blue-500 rounded-2xl p-4 transition-all duration-200 shadow-sm hover:shadow-md shadow-blue-900/5 hover:-translate-y-0.5 group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Top Produto</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xs sm:text-sm font-black text-slate-900 truncate" title={metricas.topProduto?.nome || '-'}>
            {metricas.topProduto ? metricas.topProduto.nome : '-'}
          </div>
          <p className="text-[10px] font-mono text-slate-500 mt-1">
            {metricas.topProduto ? formatBRL(metricas.topProduto.valor) : '-'}
          </p>
        </div>
      </div>



      {/* 4. VISUAL ANALYTICS CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Chart 1: Evolução Mensal */}
        <div className="bg-white border border-blue-200/90 rounded-2xl p-5 shadow-sm shadow-blue-900/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
                <BarChart2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-blue-950">Evolução de Avarias por Mês</h3>
                <p className="text-[11px] text-slate-500">Total em R$ e volume em Hectolitros (HL)</p>
              </div>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosMensais} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="mes" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} tickFormatter={(v) => `R$ ${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                <Tooltip
                  cursor={{ fill: 'rgba(59, 130, 246, 0.04)' }}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '0.75rem', color: '#0f172a', fontSize: '12px' }}
                  formatter={(value: any, name: any, props: any) => [
                    `${formatBRL(Number(value))} (${formatHL(props?.payload?.hectoPerdido || 0)})`,
                    'Valor da Avaria',
                  ]}
                />
                <Bar dataKey="valor" fill="#f59e0b" radius={[4, 4, 0, 0]}>
                  {dadosMensais.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CORES_GRAFICOS[index % CORES_GRAFICOS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Ranking por Colaborador & Função */}
        <div className="bg-white border border-blue-200/90 rounded-2xl p-5 shadow-sm shadow-blue-900/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-blue-950">Prejuízo por Colaborador / Função</h3>
                <p className="text-[11px] text-slate-500">Distribuição por operador responsável</p>
              </div>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosFuncionarios} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 10 }} tickFormatter={(v) => `R$ ${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                <YAxis dataKey="funcionario" type="category" stroke="#64748b" tick={{ fontSize: 10 }} width={120} />
                <Tooltip
                  cursor={{ fill: 'rgba(59, 130, 246, 0.04)' }}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '0.75rem', color: '#0f172a', fontSize: '12px' }}
                  formatter={(value: any, name: any, props: any) => [
                    `${formatBRL(Number(value))} (${props?.payload?.cargo || 'EMPILHADOR'}) • ${formatHL(props?.payload?.hectoPerdido || 0)}`,
                    'Valor da Avaria',
                  ]}
                />
                <Bar dataKey="valor" fill="#a855f7" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Distribuição por Turno Operacional */}
        <div className="bg-white border border-blue-200/90 rounded-2xl p-5 shadow-sm shadow-blue-900/5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-blue-950">Distribuição por Turno Operacional</h3>
                  <p className="text-[11px] text-slate-500">Proporção de perdas em R$ por período</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 font-mono">
                {dadosTurnos.length} Turno{dadosTurnos.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="h-56 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dadosTurnos}
                    dataKey="valor"
                    nameKey="turno"
                    cx="50%"
                    cy="50%"
                    innerRadius={54}
                    outerRadius={82}
                    paddingAngle={3}
                    stroke="#ffffff"
                    strokeWidth={2}
                  >
                    {dadosTurnos.map((_, index) => (
                      <Cell key={`cell-turno-${index}`} fill={CORES_GRAFICOS[index % CORES_GRAFICOS.length]} />
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
                    formatter={(value: any, name: any, props: any) => [
                      `${formatBRL(Number(value))} (${props?.payload?.porcentagem?.toFixed(1) || '0'}%) • ${formatHL(props?.payload?.hectoPerdido || 0)}`,
                      `Turno ${name}`,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Central Donut Value Indicator */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Perda Total</span>
                <span className="text-xs font-black text-slate-900 font-mono">
                  {formatBRL(dadosTurnos.reduce((acc, t) => acc + t.valor, 0))}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-3 border-t border-slate-100">
            {dadosTurnos.map((t, idx) => (
              <div
                key={t.turno}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: CORES_GRAFICOS[idx % CORES_GRAFICOS.length] }}
                  />
                  <div className="truncate">
                    <div className="text-slate-800 font-bold truncate">{t.turno}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {formatHL(t.hectoPerdido)} • {t.quantidade} un
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0 pl-2">
                  <div className="font-bold text-slate-900 font-mono text-xs">{formatBRL(t.valor)}</div>
                  <div className="text-[10px] font-semibold text-emerald-600">
                    {t.porcentagem ? t.porcentagem.toFixed(1) : 0}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 4 (Ao lado do Turno): Lançamentos de Quebras de Movimentação */}
        <div className="bg-white border border-blue-200/90 rounded-2xl shadow-sm shadow-blue-900/5 overflow-hidden flex flex-col justify-between">
          {/* Table Header */}
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
            <div>
              <h2 className="text-sm font-bold text-blue-950 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-amber-500" />
                Lançamentos de Quebras ({filteredItems.length})
              </h2>
              <p className="text-[11px] text-slate-500">
                Registros com Motivo, Colaborador, Função, Valor da Avaria e HL
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500">Linhas:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 focus:outline-none focus:border-amber-500 shadow-sm"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto overflow-y-auto max-h-[320px] flex-1">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-200">
                <tr className="text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th onClick={() => handleSort('data_hora')} className="py-2.5 px-3 cursor-pointer hover:text-slate-900">
                    <div className="flex items-center gap-1">
                      <span>Data / Hora</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th onClick={() => handleSort('mes')} className="py-2.5 px-2 cursor-pointer hover:text-slate-900">
                    Mês
                  </th>
                  <th onClick={() => handleSort('codigo_produto')} className="py-2.5 px-2 cursor-pointer hover:text-slate-900">
                    Cód. SKU
                  </th>
                  <th onClick={() => handleSort('produto')} className="py-2.5 px-3 cursor-pointer hover:text-slate-900">
                    <div className="flex items-center gap-1">
                      <span>Produto</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th onClick={() => handleSort('quantidade')} className="py-2.5 px-2 text-right cursor-pointer hover:text-slate-900">
                    Qtd
                  </th>
                  <th onClick={() => handleSort('hecto_perdido')} className="py-2.5 px-2 text-right cursor-pointer hover:text-slate-900">
                    HL Perdido
                  </th>
                  <th onClick={() => handleSort('valor')} className="py-2.5 px-2 text-right cursor-pointer hover:text-slate-900">
                    Valor (R$)
                  </th>
                  <th onClick={() => handleSort('motivo')} className="py-2.5 px-3 cursor-pointer hover:text-slate-900">
                    Motivo
                  </th>
                  <th onClick={() => handleSort('funcionario')} className="py-2.5 px-3 cursor-pointer hover:text-slate-900">
                    Colaborador / Função
                  </th>
                  <th onClick={() => handleSort('setor')} className="py-2.5 px-2 cursor-pointer hover:text-slate-900">
                    Área
                  </th>
                  <th onClick={() => handleSort('turno')} className="py-2.5 px-2 cursor-pointer hover:text-slate-900">
                    Turno
                  </th>
                  <th onClick={() => handleSort('cod_quebra')} className="py-2.5 px-2 cursor-pointer hover:text-slate-900">
                    Cód.
                  </th>
                  <th className="py-2.5 px-2">Obs</th>
                  <th className="py-2.5 px-2 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="py-8 text-center text-slate-500 italic">
                      Nenhuma ocorrência encontrada com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      {/* Data/Hora */}
                      <td className="py-2 px-3 font-mono text-slate-600 whitespace-nowrap">
                        {formatDataHoraAbreviada(item.data_hora)}
                      </td>

                      {/* Mês */}
                      <td className="py-2 px-2 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200">
                          {item.mes}
                        </span>
                      </td>

                      {/* Código SKU */}
                      <td className="py-2 px-2 font-mono text-slate-500 font-bold whitespace-nowrap">
                        {item.codigo_produto}
                      </td>

                      {/* Produto */}
                      <td className="py-2 px-3 font-bold text-slate-900 whitespace-nowrap">
                        {item.produto}
                      </td>

                      {/* Quantidade */}
                      <td className="py-2 px-2 text-right font-mono font-bold text-slate-700 whitespace-nowrap">
                        {item.quantidade}
                      </td>

                      {/* Hecto Perdido */}
                      <td className="py-2 px-2 text-right font-mono font-bold text-sky-700 whitespace-nowrap">
                        {formatHL(item.hecto_perdido ?? 0)}
                      </td>

                      {/* Valor da Avaria R$ */}
                      <td className="py-2 px-2 text-right font-mono font-bold text-amber-600 whitespace-nowrap">
                        {formatBRL(item.valor ?? item.valor_avaria ?? 0)}
                      </td>

                      {/* Motivo */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                          {item.motivo || 'FALTA NO PALETE'}
                        </span>
                      </td>

                      {/* Colaborador & Função */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{item.colaborador || item.funcionario}</div>
                        <div className="text-[10px] text-slate-500 font-semibold uppercase">{item.funcao || item.cargo}</div>
                      </td>

                      {/* Área / Setor */}
                      <td className="py-2 px-2 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200">
                          {item.area || item.setor}
                        </span>
                      </td>

                      {/* Turno */}
                      <td className="py-2 px-2 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-semibold border border-purple-200">
                          {item.turno}
                        </span>
                      </td>

                      {/* Cód Quebra / Filial */}
                      <td className="py-2 px-2 font-mono text-slate-500 whitespace-nowrap">
                        {item.cod_quebra ?? item.filial ?? '-'}
                      </td>

                      {/* Observação */}
                      <td className="py-2 px-2 text-slate-500 max-w-[140px] truncate" title={item.observacao}>
                        {item.observacao || '-'}
                      </td>

                      {/* Ações */}
                      <td className="py-2 px-2 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setItemEditando(item);
                              setIsFormModalOpen(true);
                            }}
                            className="w-6 h-6 rounded bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200 flex items-center justify-center transition-colors cursor-pointer"
                            title="Editar"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="w-6 h-6 rounded bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 flex items-center justify-center transition-colors cursor-pointer"
                            title="Excluir"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer & Pagination */}
          <div className="p-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50">
            <div className="text-[11px] text-slate-500">
              Mostrando <span className="font-bold text-slate-900">{sortedItems.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> a{' '}
              <span className="font-bold text-slate-900">
                {Math.min(currentPage * itemsPerPage, sortedItems.length)}
              </span>{' '}
              de <span className="font-bold text-slate-900">{sortedItems.length}</span> registros
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-2 py-1 rounded bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-[11px] text-slate-600 font-bold transition-colors cursor-pointer"
                >
                  Anterior
                </button>
                <span className="px-1 text-[11px] font-mono text-slate-500">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 rounded bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-[11px] text-slate-600 font-bold transition-colors cursor-pointer"
                >
                  Próxima
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODALS */}
      <QuebrasMovJsonImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportJson}
        totalAtuais={items.length}
      />

      <QuebrasMovModalForm
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setItemEditando(null);
        }}
        onSave={handleSaveItem}
        itemToEdit={itemEditando}
      />
    </div>
  );
};
