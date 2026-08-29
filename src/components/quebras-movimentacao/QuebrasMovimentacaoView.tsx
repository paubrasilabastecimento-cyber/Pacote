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
    <div className="space-y-6 pb-12 animate-fadeIn text-slate-100">
      {/* 1. TOP HEADER & ACTION BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
            <Boxes className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Quebras de Movimentação do Armazém
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-bold tracking-wider uppercase font-mono">
                WQI 524 / 539
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Gestão de perdas com Motivo, Colaborador, Função, Valor da Avaria e Hecto Perdido (HL) — <span className="text-amber-400 font-semibold">{items.length} registros importados</span>
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setItemEditando(null);
              setIsFormModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Lançamento</span>
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all cursor-pointer active:scale-95"
          >
            <FileCode className="w-4 h-4 text-amber-400" />
            <span>Importar JSON</span>
          </button>

          {items.length > 0 && (
            <>
              <button
                onClick={() => exportarQuebrasMovCSV(filteredItems)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Exportar CSV</span>
              </button>

              <button
                onClick={handleClearWQI}
                title="Limpar todos os registros de quebras"
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Limpar</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2. EXECUTIVE KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card 1: Total Loss R$ */}
        <div className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-4 transition-all duration-200 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Valor da Avaria</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black font-mono text-amber-400 truncate">
            {formatBRL(metricas.totalValor)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Total financeiro avariado</p>
        </div>

        {/* Card 2: Hecto Perdido HL */}
        <div className="bg-slate-900/90 border border-slate-800 hover:border-sky-500/50 rounded-2xl p-4 transition-all duration-200 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Hecto Perdido (HL)</span>
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Droplet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black font-mono text-sky-400">
            {formatHL(metricas.totalHlPerdido)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{formatNumber(metricas.totalQuantidade)} unidades físicas</p>
        </div>

        {/* Card 3: Ocorrências */}
        <div className="bg-slate-900/90 border border-slate-800 hover:border-purple-500/50 rounded-2xl p-4 transition-all duration-200 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ocorrências</span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black font-mono text-purple-400">
            {formatNumber(metricas.totalOcorrencias)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Registros de avaria</p>
        </div>

        {/* Card 4: Top Motivo */}
        <div className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-4 transition-all duration-200 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Top Motivo</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xs sm:text-sm font-black text-emerald-400 truncate" title={metricas.topMotivo?.motivo || '-'}>
            {metricas.topMotivo ? metricas.topMotivo.motivo : '-'}
          </div>
          <p className="text-[11px] font-mono text-slate-400 mt-1">
            {metricas.topMotivo ? `${formatBRL(metricas.topMotivo.valor)}` : '-'}
          </p>
        </div>

        {/* Card 5: Top Colaborador */}
        <div className="bg-slate-900/90 border border-slate-800 hover:border-rose-500/50 rounded-2xl p-4 transition-all duration-200 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Top Colaborador</span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
          </div>
          <div className="text-sm font-black text-rose-400 truncate" title={metricas.topFuncionario?.nome || '-'}>
            {metricas.topFuncionario ? metricas.topFuncionario.nome : '-'}
          </div>
          <p className="text-[11px] font-mono text-slate-400 mt-1">
            {metricas.topFuncionario ? `${formatBRL(metricas.topFuncionario.valor)} (${metricas.topFuncionario.cargo})` : '-'}
          </p>
        </div>

        {/* Card 6: Top Produto SKU */}
        <div className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-4 transition-all duration-200 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Top Produto</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-sm font-black text-indigo-400 truncate" title={metricas.topProduto?.nome || '-'}>
            {metricas.topProduto ? metricas.topProduto.nome : '-'}
          </div>
          <p className="text-[11px] font-mono text-slate-400 mt-1">
            {metricas.topProduto ? formatBRL(metricas.topProduto.valor) : '-'}
          </p>
        </div>
      </div>



      {/* 4. VISUAL ANALYTICS CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Chart 1: Evolução Mensal */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <BarChart2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Evolução de Avarias por Mês</h3>
                <p className="text-[11px] text-slate-400">Total em R$ e volume em Hectolitros (HL)</p>
              </div>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosMensais} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="mes" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${v}`} />
                <Tooltip
                  cursor={false}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem' }}
                  formatter={(value: any, name: any, props: any) => [
                    `${formatBRL(Number(value))} (${formatHL(props?.payload?.hectoPerdido || 0)})`,
                    'Valor da Avaria',
                  ]}
                />
                <Bar dataKey="valor" fill="#f59e0b" radius={[6, 6, 0, 0]}>
                  {dadosMensais.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CORES_GRAFICOS[index % CORES_GRAFICOS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Ranking por Colaborador & Função */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Prejuízo por Colaborador / Função</h3>
                <p className="text-[11px] text-slate-400">Distribuição por operador responsável</p>
              </div>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosFuncionarios} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={(v) => `R$${v}`} />
                <YAxis dataKey="funcionario" type="category" stroke="#64748b" tick={{ fontSize: 10 }} width={120} />
                <Tooltip
                  cursor={false}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem' }}
                  formatter={(value: any, name: any, props: any) => [
                    `${formatBRL(Number(value))} (${props?.payload?.cargo || 'EMPILHADOR'}) • ${formatHL(props?.payload?.hectoPerdido || 0)}`,
                    'Valor da Avaria',
                  ]}
                />
                <Bar dataKey="valor" fill="#a855f7" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Distribuição por Turno Operacional */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Distribuição por Turno Operacional</h3>
                  <p className="text-[11px] text-slate-400">Proporção de perdas em R$ por período</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700 font-mono">
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
                    stroke="#0f172a"
                    strokeWidth={2}
                  >
                    {dadosTurnos.map((_, index) => (
                      <Cell key={`cell-turno-${index}`} fill={CORES_GRAFICOS[index % CORES_GRAFICOS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
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
                <span className="text-xs font-black text-amber-400 font-mono">
                  {formatBRL(dadosTurnos.reduce((acc, t) => acc + t.valor, 0))}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-3 border-t border-slate-800/80">
            {dadosTurnos.map((t, idx) => (
              <div
                key={t.turno}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: CORES_GRAFICOS[idx % CORES_GRAFICOS.length] }}
                  />
                  <div className="truncate">
                    <div className="text-slate-200 font-bold truncate">{t.turno}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {formatHL(t.hectoPerdido)} • {t.quantidade} un
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0 pl-2">
                  <div className="font-bold text-amber-300 font-mono text-xs">{formatBRL(t.valor)}</div>
                  <div className="text-[10px] font-semibold text-emerald-400">
                    {t.porcentagem ? t.porcentagem.toFixed(1) : 0}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 4 (Ao lado do Turno): Lançamentos de Quebras de Movimentação */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col justify-between">
          {/* Table Header */}
          <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-amber-400" />
                Lançamentos de Quebras ({filteredItems.length})
              </h2>
              <p className="text-[11px] text-slate-400">
                Registros com Motivo, Colaborador, Função, Valor da Avaria e HL
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400">Linhas:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
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
              <thead className="sticky top-0 z-10 bg-slate-950 border-b border-slate-800">
                <tr className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th onClick={() => handleSort('data_hora')} className="py-2.5 px-3 cursor-pointer hover:text-white">
                    <div className="flex items-center gap-1">
                      <span>Data / Hora</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th onClick={() => handleSort('mes')} className="py-2.5 px-2 cursor-pointer hover:text-white">
                    Mês
                  </th>
                  <th onClick={() => handleSort('codigo_produto')} className="py-2.5 px-2 cursor-pointer hover:text-white">
                    Cód. SKU
                  </th>
                  <th onClick={() => handleSort('produto')} className="py-2.5 px-3 cursor-pointer hover:text-white">
                    <div className="flex items-center gap-1">
                      <span>Produto</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th onClick={() => handleSort('quantidade')} className="py-2.5 px-2 text-right cursor-pointer hover:text-white">
                    Qtd
                  </th>
                  <th onClick={() => handleSort('hecto_perdido')} className="py-2.5 px-2 text-right cursor-pointer hover:text-white">
                    HL Perdido
                  </th>
                  <th onClick={() => handleSort('valor')} className="py-2.5 px-2 text-right cursor-pointer hover:text-white">
                    Valor (R$)
                  </th>
                  <th onClick={() => handleSort('motivo')} className="py-2.5 px-3 cursor-pointer hover:text-white">
                    Motivo
                  </th>
                  <th onClick={() => handleSort('funcionario')} className="py-2.5 px-3 cursor-pointer hover:text-white">
                    Colaborador / Função
                  </th>
                  <th onClick={() => handleSort('setor')} className="py-2.5 px-2 cursor-pointer hover:text-white">
                    Área
                  </th>
                  <th onClick={() => handleSort('turno')} className="py-2.5 px-2 cursor-pointer hover:text-white">
                    Turno
                  </th>
                  <th onClick={() => handleSort('cod_quebra')} className="py-2.5 px-2 cursor-pointer hover:text-white">
                    Cód.
                  </th>
                  <th className="py-2.5 px-2">Obs</th>
                  <th className="py-2.5 px-2 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="py-8 text-center text-slate-500 italic">
                      Nenhuma ocorrência encontrada com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                      {/* Data/Hora */}
                      <td className="py-2 px-3 font-mono text-slate-300 whitespace-nowrap">
                        {formatDataHoraAbreviada(item.data_hora)}
                      </td>

                      {/* Mês */}
                      <td className="py-2 px-2 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold">
                          {item.mes}
                        </span>
                      </td>

                      {/* Código SKU */}
                      <td className="py-2 px-2 font-mono text-slate-400 font-bold whitespace-nowrap">
                        {item.codigo_produto}
                      </td>

                      {/* Produto */}
                      <td className="py-2 px-3 font-bold text-white whitespace-nowrap">
                        {item.produto}
                      </td>

                      {/* Quantidade */}
                      <td className="py-2 px-2 text-right font-mono font-bold text-slate-300 whitespace-nowrap">
                        {item.quantidade}
                      </td>

                      {/* Hecto Perdido */}
                      <td className="py-2 px-2 text-right font-mono font-bold text-sky-400 whitespace-nowrap">
                        {formatHL(item.hecto_perdido ?? 0)}
                      </td>

                      {/* Valor da Avaria R$ */}
                      <td className="py-2 px-2 text-right font-mono font-bold text-amber-400 whitespace-nowrap">
                        {formatBRL(item.valor ?? item.valor_avaria ?? 0)}
                      </td>

                      {/* Motivo */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 text-[10px] font-bold border border-amber-500/20">
                          {item.motivo || 'FALTA NO PALETE'}
                        </span>
                      </td>

                      {/* Colaborador & Função */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <div className="font-bold text-slate-200">{item.colaborador || item.funcionario}</div>
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">{item.funcao || item.cargo}</div>
                      </td>

                      {/* Área / Setor */}
                      <td className="py-2 px-2 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 text-[10px] font-semibold border border-emerald-500/20">
                          {item.area || item.setor}
                        </span>
                      </td>

                      {/* Turno */}
                      <td className="py-2 px-2 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 text-[10px] font-semibold border border-purple-500/20">
                          {item.turno}
                        </span>
                      </td>

                      {/* Cód Quebra / Filial */}
                      <td className="py-2 px-2 font-mono text-slate-400 whitespace-nowrap">
                        {item.cod_quebra ?? item.filial ?? '-'}
                      </td>

                      {/* Observação */}
                      <td className="py-2 px-2 text-slate-400 max-w-[140px] truncate" title={item.observacao}>
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
                            className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                            title="Editar"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="w-6 h-6 rounded bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-300 flex items-center justify-center transition-colors cursor-pointer"
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
          <div className="p-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-950/60">
            <div className="text-[11px] text-slate-400">
              Mostrando <span className="font-bold text-white">{sortedItems.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> a{' '}
              <span className="font-bold text-white">
                {Math.min(currentPage * itemsPerPage, sortedItems.length)}
              </span>{' '}
              de <span className="font-bold text-white">{sortedItems.length}</span> registros
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-[11px] text-slate-300 font-bold transition-colors cursor-pointer"
                >
                  Anterior
                </button>
                <span className="px-1 text-[11px] font-mono text-slate-400">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-[11px] text-slate-300 font-bold transition-colors cursor-pointer"
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
