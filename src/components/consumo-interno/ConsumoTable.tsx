import React, { useState, useMemo } from 'react';
import { ConsumoInternoItem, CategoriaConsumo } from '../../types/consumoInterno';
import { formatCurrency, formatDateBR } from '../../utils/formatters';
import { CATEGORIAS_CONFIG } from '../../utils/consumoClassifier';
import {
  Search,
  Filter,
  Download,
  Upload,
  FileJson,
  Trash2,
  Calendar,
  Layers,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  PackageCheck,
  FileSpreadsheet,
} from 'lucide-react';

interface ConsumoTableProps {
  data: ConsumoInternoItem[];
  onDelete?: (id: string) => void;
  onOpenJsonImport?: () => void;
  selectedCategory?: string | null;
  onSelectCategory?: (categoria: string | null) => void;
  selectedMonth?: string | null;
  onSelectMonth?: (mes: string | null) => void;
}

type SortField = 'operacao' | 'dtOperacao' | 'descricao' | 'categoria' | 'qtde' | 'total';
type SortOrder = 'asc' | 'desc';

export const ConsumoTable: React.FC<ConsumoTableProps> = ({
  data,
  onDelete,
  onOpenJsonImport,
  selectedCategory,
  onSelectCategory,
  selectedMonth,
  onSelectMonth,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<SortField>('dtOperacao');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Available unique months
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    data.forEach((item) => {
      if (item.dtOperacao) months.add(item.dtOperacao.slice(0, 7));
    });
    return Array.from(months).sort().reverse();
  }, [data]);

  // Filtered & Sorted items
  const filteredData = useMemo(() => {
    return data
      .filter((item) => {
        // Category Filter
        if (selectedCategory && item.categoria !== selectedCategory) {
          return false;
        }
        // Month Filter
        if (selectedMonth && !item.dtOperacao?.startsWith(selectedMonth)) {
          return false;
        }
        // Status Filter
        if (statusFilter !== 'ALL' && item.status !== statusFilter) {
          return false;
        }
        // Search Term (sku, descricao, operacao, solicitante)
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchDesc = item.descricao?.toLowerCase().includes(q);
          const matchSku = String(item.produtoId).includes(q);
          const matchOp = String(item.operacao).includes(q);
          const matchSol = item.solicitante?.toLowerCase().includes(q);
          return matchDesc || matchSku || matchOp || matchSol;
        }
        return true;
      })
      .sort((a, b) => {
        let valA: any = a[sortField];
        let valB: any = b[sortField];

        if (sortField === 'dtOperacao') {
          valA = a.dtOperacao || '';
          valB = b.dtOperacao || '';
        } else if (sortField === 'total' || sortField === 'qtde' || sortField === 'operacao') {
          valA = Number(valA) || 0;
          valB = Number(valB) || 0;
        } else {
          valA = String(valA || '').toLowerCase();
          valB = String(valB || '').toLowerCase();
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [data, selectedCategory, selectedMonth, statusFilter, searchTerm, sortField, sortOrder]);

  const totalFilteredValue = useMemo(() => {
    return filteredData.reduce((acc, curr) => acc + (curr.total || 0), 0);
  }, [filteredData]);

  const totalFilteredQtde = useMemo(() => {
    return filteredData.reduce((acc, curr) => acc + (curr.qtde || 0), 0);
  }, [filteredData]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const pagedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Operacao',
      'Dt. Operacao',
      'Emissao',
      'Status',
      'Produto (SKU)',
      'Unidade',
      'Descricao',
      'Embalagem',
      'Qtde',
      'Total (R$)',
      'Categoria',
    ];
    const rows = filteredData.map((d) => [
      d.operacao,
      d.dtOperacao,
      d.emissao,
      d.status,
      d.produtoId,
      d.unidade,
      `"${(d.descricao || '').replace(/"/g, '""')}"`,
      `"${(d.embalagem || 'LONG NECK').replace(/"/g, '""')}"`,
      d.qtde,
      d.total.toFixed(2),
      d.categoria,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `consumo_interno_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = () => {
    const formatted = filteredData.map((d) => ({
      operacao: d.operacao,
      dataOperacao: d.dtOperacao,
      emissao: d.emissao,
      status: d.status,
      produto: d.produtoId,
      unidade: d.unidade,
      descricao: d.descricao,
      qtde: d.qtde,
      valor: Number(d.total.toFixed(2)),
      embalagem: d.embalagem || 'LONG NECK',
    }));

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(formatted, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `consumo_interno_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };


  return (
    <div
      id="tabela-consumo-detalhada"
      className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4"
    >
      {/* Table Header / Filters */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-slate-800 text-slate-300">
            <FileSpreadsheet className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Registros Analíticos de Consumo Interno
            </h3>
            <p className="text-[11px] text-slate-400">
              Detalhamento de requisições, SKUs, centros de custo e valores totais
            </p>
          </div>
        </div>

        {/* Action / Export Buttons */}
        <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
          {onOpenJsonImport && (
            <button
              id="btn-tabela-importar-json"
              onClick={onOpenJsonImport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold transition-colors border border-amber-500/30 cursor-pointer"
              title="Importar novo arquivo JSON para atualizar a base"
            >
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span>Importar JSON</span>
            </button>
          )}

          <button
            onClick={exportToJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700 cursor-pointer"
            title="Exportar no formato JSON nativo de consumo interno"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Exportar JSON</span>
          </button>

          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700 cursor-pointer"
            title="Exportar dados filtrados para CSV"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Exportar CSV</span>
          </button>
        </div>

      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar por descrição, SKU ou operação..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        {/* Category Select */}
        <div className="relative">
          <select
            value={selectedCategory || 'ALL'}
            onChange={(e) => {
              const val = e.target.value === 'ALL' ? null : e.target.value;
              if (onSelectCategory) onSelectCategory(val);
              setPage(1);
            }}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
          >
            <option value="ALL">Todas as Categorias</option>
            {Object.keys(CATEGORIAS_CONFIG).map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Month Select */}
        <div className="relative">
          <select
            value={selectedMonth || 'ALL'}
            onChange={(e) => {
              const val = e.target.value === 'ALL' ? null : e.target.value;
              if (onSelectMonth) onSelectMonth(val);
              setPage(1);
            }}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
          >
            <option value="ALL">Todos os Meses</option>
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
          >
            <option value="ALL">Status: Todos</option>
            <option value="A">Status: A (Aprovado / Ativo)</option>
          </select>
        </div>
      </div>

      {/* Active Filter Chips */}
      {(selectedCategory || selectedMonth || searchTerm || statusFilter !== 'ALL') && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <span className="text-[11px] font-semibold">Filtros ativos:</span>
          {selectedCategory && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] border border-amber-500/30">
              Categoria: {selectedCategory}
              <button
                onClick={() => onSelectCategory && onSelectCategory(null)}
                className="hover:text-white ml-0.5 cursor-pointer font-bold"
              >
                ×
              </button>
            </span>
          )}
          {selectedMonth && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[11px] border border-sky-500/30">
              Mês: {selectedMonth}
              <button
                onClick={() => onSelectMonth && onSelectMonth(null)}
                className="hover:text-white ml-0.5 cursor-pointer font-bold"
              >
                ×
              </button>
            </span>
          )}
          {searchTerm && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[11px] border border-purple-500/30">
              Busca: "{searchTerm}"
              <button
                onClick={() => setSearchTerm('')}
                className="hover:text-white ml-0.5 cursor-pointer font-bold"
              >
                ×
              </button>
            </span>
          )}
          <button
            onClick={() => {
              if (onSelectCategory) onSelectCategory(null);
              if (onSelectMonth) onSelectMonth(null);
              setSearchTerm('');
              setStatusFilter('ALL');
            }}
            className="text-[11px] text-slate-400 hover:text-white underline ml-1 cursor-pointer"
          >
            Limpar todos
          </button>
        </div>
      )}

      {/* Table Content */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
            <tr>
              <th
                onClick={() => handleSort('operacao')}
                className="py-3 px-3 cursor-pointer hover:text-white"
              >
                <div className="flex items-center gap-1">
                  <span>Operação</span>
                  {sortField === 'operacao' ? (
                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-40" />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('dtOperacao')}
                className="py-3 px-3 cursor-pointer hover:text-white"
              >
                <div className="flex items-center gap-1">
                  <span>Dt. Operação</span>
                  {sortField === 'dtOperacao' ? (
                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-40" />
                  )}
                </div>
              </th>
              <th className="py-3 px-3">Emissão</th>
              <th className="py-3 px-3">SKU</th>
              <th
                onClick={() => handleSort('descricao')}
                className="py-3 px-3 cursor-pointer hover:text-white min-w-[200px]"
              >
                <div className="flex items-center gap-1">
                  <span>Descrição do Produto</span>
                  {sortField === 'descricao' ? (
                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-40" />
                  )}
                </div>
              </th>
              <th className="py-3 px-3">Embalagem</th>
              <th
                onClick={() => handleSort('categoria')}
                className="py-3 px-3 cursor-pointer hover:text-white"
              >
                <div className="flex items-center gap-1">
                  <span>Categoria</span>
                  {sortField === 'categoria' ? (
                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-40" />
                  )}
                </div>
              </th>
              <th className="py-3 px-3 text-center">Unid.</th>
              <th
                onClick={() => handleSort('qtde')}
                className="py-3 px-3 text-right cursor-pointer hover:text-white"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Qtde</span>
                  {sortField === 'qtde' ? (
                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-40" />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('total')}
                className="py-3 px-3 text-right cursor-pointer hover:text-white"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Total (R$)</span>
                  {sortField === 'total' ? (
                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-40" />
                  )}
                </div>
              </th>
              <th className="py-3 px-3 text-center">Status</th>
              {onDelete && <th className="py-3 px-3 text-center">Ações</th>}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-850 bg-slate-900/60">
            {pagedItems.length === 0 ? (
              <tr>
                <td
                  colSpan={onDelete ? 12 : 11}
                  className="py-8 text-center text-slate-500 text-xs"
                >
                  Nenhum registro de consumo interno encontrado para estes filtros.
                </td>
              </tr>
            ) : (
              pagedItems.map((item) => {
                const catCfg = CATEGORIAS_CONFIG[item.categoria] || {
                  color: '#94a3b8',
                  bgBadge: 'bg-slate-800',
                  textBadge: 'text-slate-300',
                  borderBadge: 'border-slate-700',
                };

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-800/50 transition-colors group"
                  >
                    <td className="py-2.5 px-3 font-mono font-bold text-amber-400">
                      #{item.operacao}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-300 whitespace-nowrap">
                      {formatDateBR(item.dtOperacao)}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-400 whitespace-nowrap">
                      {formatDateBR(item.emissao)}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">
                      {item.produtoId}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-white">
                      <div className="font-semibold">{item.descricao}</div>
                      {item.solicitante && (
                        <div className="text-[10px] text-slate-400">{item.solicitante}</div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px] text-amber-200/90">
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20">
                        {item.embalagem || 'LONG NECK'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${catCfg.bgBadge} ${catCfg.textBadge} ${catCfg.borderBadge}`}
                      >
                        {item.categoria}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center uppercase font-mono text-slate-400">
                      {item.unidade}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-sky-400">
                      {item.qtde.toLocaleString('pt-BR')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                      {formatCurrency(item.total)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        {item.status}
                      </span>
                    </td>
                    {onDelete && (
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => onDelete(item.id)}
                          className="text-slate-500 hover:text-rose-400 p-1 rounded-md hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Excluir lançamento"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Footer Summary Row */}
          {filteredData.length > 0 && (
            <tfoot className="bg-slate-950 font-bold text-xs border-t-2 border-slate-800 text-white">
              <tr>
                <td colSpan={7} className="py-3 px-3 text-slate-300">
                  Total Filtrado ({filteredData.length} registros)
                </td>
                <td className="py-3 px-3 text-center text-slate-400 font-mono">-</td>
                <td className="py-3 px-3 text-right text-sky-400 font-mono">
                  {totalFilteredQtde.toLocaleString('pt-BR')} un
                </td>
                <td className="py-3 px-3 text-right text-amber-400 font-mono text-sm">
                  {formatCurrency(totalFilteredValue)}
                </td>
                <td colSpan={onDelete ? 2 : 1} />

              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 pt-2">
        <div>
          Mostrando{' '}
          <strong className="text-white font-mono">
            {filteredData.length > 0 ? (page - 1) * pageSize + 1 : 0}
          </strong>{' '}
          a{' '}
          <strong className="text-white font-mono">
            {Math.min(page * pageSize, filteredData.length)}
          </strong>{' '}
          de <strong className="text-white font-mono">{filteredData.length}</strong> registros
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            Anterior
          </button>
          <span className="px-3 py-1 font-mono text-white">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            Próxima
          </button>
        </div>
      </div>
    </div>
  );
};
