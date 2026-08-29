import React, { useState, useMemo } from 'react';
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  Upload,
  Plus,
  RotateCcw,
  Edit2,
  Trash2,
  Filter,
  Wine,
  Package,
  Box,
  FileSpreadsheet,
} from 'lucide-react';
import { RefugoItem, CategoriaRefugo } from '../../types/refugo';
import { formatBRL, formatPercent, exportRefugoToCSV } from '../../utils/refugoUtils';

interface RefugoTableProps {
  items: RefugoItem[];
  onEditItem: (item: RefugoItem) => void;
  onDeleteItem: (id: string) => void;
  onAddNew: () => void;
  onOpenImport: () => void;
  onResetDefault: () => void;
}

type SortField = 'posicao' | 'material' | 'categoria' | 'calibre' | 'valor' | 'percentual' | 'percentualAcumulado' | 'classeABC';

export const RefugoTable: React.FC<RefugoTableProps> = ({
  items,
  onEditItem,
  onDeleteItem,
  onAddNew,
  onOpenImport,
  onResetDefault,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('all');
  const [classeABCFilter, setClasseABCFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('posicao');
  const [sortAsc, setSortAsc] = useState(true);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === 'posicao');
    }
  };

  const filteredAndSortedItems = useMemo(() => {
    return items
      .filter((item) => {
        // Busca
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const matchMaterial = item.material.toLowerCase().includes(term);
          const matchCalibre = item.calibre.toLowerCase().includes(term);
          const matchCor = item.cor.toLowerCase().includes(term);
          const matchCat = item.categoria.toLowerCase().includes(term);
          if (!matchMaterial && !matchCalibre && !matchCor && !matchCat) return false;
        }

        // Filtro Categoria
        if (categoriaFilter !== 'all' && item.categoria !== categoriaFilter) {
          return false;
        }

        // Filtro Classe ABC
        if (classeABCFilter !== 'all' && item.classeABC !== classeABCFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        let valA: any = a[sortField];
        let valB: any = b[sortField];

        if (typeof valA === 'string') {
          valA = valA.toLowerCase();
          valB = (valB || '').toString().toLowerCase();
          return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }

        return sortAsc ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
      });
  }, [items, searchTerm, categoriaFilter, classeABCFilter, sortField, sortAsc]);

  const totalFilteredValor = filteredAndSortedItems.reduce((acc, i) => acc + i.valor, 0);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col gap-4">
      {/* Barra Superior da Tabela: Título e Ações */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-amber-400" />
            <span>Matriz Estratificada de Materiais e Refugo ({filteredAndSortedItems.length} registros)</span>
          </h2>
          <p className="text-xs text-slate-400">
            Detalhamento de cada item com categoria, especificação, valor monetário, peso percentual e curva ABC
          </p>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
          <button
            onClick={() => exportRefugoToCSV(items)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-colors cursor-pointer"
            title="Exportar dados para planilha Excel / CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={onOpenImport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold transition-colors cursor-pointer"
            title="Importar dados de planilha ou texto"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Importar / Colar</span>
          </button>

          <button
            onClick={onAddNew}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-colors cursor-pointer shadow-md"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Material</span>
          </button>

          <button
            onClick={onResetDefault}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs transition-colors cursor-pointer"
            title="Restaurar dados originais Ambev"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
        {/* Campo de Busca */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar material, cor, calibre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-amber-500 text-xs"
          />
        </div>

        {/* Filtro por Categoria */}
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={categoriaFilter}
            onChange={(e) => setCategoriaFilter(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-hidden focus:border-amber-500 text-xs cursor-pointer"
          >
            <option value="all">Todas as Famílias</option>
            <option value="Garrafas de Vidro">Garrafas de Vidro</option>
            <option value="Garrafeiras Plásticas">Garrafeiras Plásticas</option>
            <option value="Paletes de Madeira">Paletes de Madeira</option>
            <option value="Outros">Outros</option>
          </select>
        </div>

        {/* Filtro por Curva ABC */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-400 shrink-0">Pareto:</span>
          <select
            value={classeABCFilter}
            onChange={(e) => setClasseABCFilter(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-hidden focus:border-amber-500 text-xs cursor-pointer"
          >
            <option value="all">Todas as Classes ABC</option>
            <option value="A">Classe A (Críticos / até 80%)</option>
            <option value="B">Classe B (Intermediários / 80-95%)</option>
            <option value="C">Classe C (Cauda / &gt;95%)</option>
          </select>
        </div>

        {/* Subtotal filtrado */}
        <div className="flex items-center justify-end px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800/80 font-mono text-xs">
          <span className="text-slate-400 mr-2">Subtotal Visível:</span>
          <span className="font-bold text-amber-400">{formatBRL(totalFilteredValor)}</span>
        </div>
      </div>

      {/* Tabela Responsiva */}
      <div className="overflow-x-auto rounded-lg border border-slate-800/80">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <th
                onClick={() => handleSort('posicao')}
                className="py-2.5 px-3 cursor-pointer hover:text-white transition-colors w-12 text-center"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>#</span>
                  {sortField === 'posicao' ? (
                    sortAsc ? <ArrowUp className="w-3 h-3 text-amber-400" /> : <ArrowDown className="w-3 h-3 text-amber-400" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-40" />
                  )}
                </div>
              </th>

              <th
                onClick={() => handleSort('material')}
                className="py-2.5 px-3 cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Material / Descrição</span>
                  {sortField === 'material' ? (
                    sortAsc ? <ArrowUp className="w-3 h-3 text-amber-400" /> : <ArrowDown className="w-3 h-3 text-amber-400" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-40" />
                  )}
                </div>
              </th>

              <th
                onClick={() => handleSort('categoria')}
                className="py-2.5 px-3 cursor-pointer hover:text-white transition-colors hidden md:table-cell"
              >
                <div className="flex items-center gap-1">
                  <span>Família</span>
                  {sortField === 'categoria' ? (
                    sortAsc ? <ArrowUp className="w-3 h-3 text-amber-400" /> : <ArrowDown className="w-3 h-3 text-amber-400" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-40" />
                  )}
                </div>
              </th>

              <th
                onClick={() => handleSort('calibre')}
                className="py-2.5 px-3 cursor-pointer hover:text-white transition-colors hidden lg:table-cell"
              >
                <div className="flex items-center gap-1">
                  <span>Calibre / Formato</span>
                  {sortField === 'calibre' ? (
                    sortAsc ? <ArrowUp className="w-3 h-3 text-amber-400" /> : <ArrowDown className="w-3 h-3 text-amber-400" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-40" />
                  )}
                </div>
              </th>

              <th
                onClick={() => handleSort('valor')}
                className="py-2.5 px-3 cursor-pointer hover:text-white transition-colors text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Valor (R$)</span>
                  {sortField === 'valor' ? (
                    sortAsc ? <ArrowUp className="w-3 h-3 text-amber-400" /> : <ArrowDown className="w-3 h-3 text-amber-400" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-40" />
                  )}
                </div>
              </th>

              <th
                onClick={() => handleSort('percentual')}
                className="py-2.5 px-3 cursor-pointer hover:text-white transition-colors text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>% Total</span>
                  {sortField === 'percentual' ? (
                    sortAsc ? <ArrowUp className="w-3 h-3 text-amber-400" /> : <ArrowDown className="w-3 h-3 text-amber-400" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-40" />
                  )}
                </div>
              </th>

              <th
                onClick={() => handleSort('percentualAcumulado')}
                className="py-2.5 px-3 cursor-pointer hover:text-white transition-colors text-right hidden sm:table-cell"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>% Acumulado</span>
                  {sortField === 'percentualAcumulado' ? (
                    sortAsc ? <ArrowUp className="w-3 h-3 text-amber-400" /> : <ArrowDown className="w-3 h-3 text-amber-400" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-40" />
                  )}
                </div>
              </th>

              <th
                onClick={() => handleSort('classeABC')}
                className="py-2.5 px-3 cursor-pointer hover:text-white transition-colors text-center w-20"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Curva ABC</span>
                  {sortField === 'classeABC' ? (
                    sortAsc ? <ArrowUp className="w-3 h-3 text-amber-400" /> : <ArrowDown className="w-3 h-3 text-amber-400" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-40" />
                  )}
                </div>
              </th>

              <th className="py-2.5 px-3 text-center w-20">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredAndSortedItems.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-8 text-slate-500">
                  Nenhum material encontrado com os filtros selecionados.
                </td>
              </tr>
            ) : (
              filteredAndSortedItems.map((item) => {
                const isClasseA = item.classeABC === 'A';
                const isClasseB = item.classeABC === 'B';

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-800/30 transition-colors group"
                  >
                    {/* # Posição */}
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-400">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md ${
                        item.posicao === 1
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : item.posicao === 2
                          ? 'bg-slate-700/60 text-slate-200'
                          : item.posicao === 3
                          ? 'bg-amber-900/40 text-amber-400'
                          : 'text-slate-400'
                      }`}>
                        {item.posicao}
                      </span>
                    </td>

                    {/* Material */}
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-white leading-tight">
                        {item.material}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>{item.tipoMaterial}</span>
                        {item.cor && <span>• Cor: {item.cor}</span>}
                        {item.unidadesEstimadas ? (
                          <span className="hidden sm:inline">• ~{item.unidadesEstimadas.toLocaleString('pt-BR')} un</span>
                        ) : null}
                      </div>
                    </td>

                    {/* Categoria */}
                    <td className="py-2.5 px-3 hidden md:table-cell">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium ${
                        item.categoria === 'Garrafas de Vidro'
                          ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                          : item.categoria === 'Garrafeiras Plásticas'
                          ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                          : item.categoria === 'Paletes de Madeira'
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : 'bg-violet-500/15 text-violet-300 border border-violet-500/30'
                      }`}>
                        {item.categoria === 'Garrafas de Vidro' && <Wine className="w-3 h-3" />}
                        {item.categoria === 'Garrafeiras Plásticas' && <Package className="w-3 h-3" />}
                        {item.categoria === 'Paletes de Madeira' && <Box className="w-3 h-3" />}
                        <span>{item.categoria}</span>
                      </span>
                    </td>

                    {/* Calibre */}
                    <td className="py-2.5 px-3 text-slate-300 font-mono text-[11px] hidden lg:table-cell">
                      {item.calibre}
                    </td>

                    {/* Valor (R$) */}
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-white whitespace-nowrap">
                      {formatBRL(item.valor)}
                    </td>

                    {/* % Total */}
                    <td className="py-2.5 px-3 text-right font-mono text-cyan-400 whitespace-nowrap font-medium">
                      {formatPercent(item.percentual || 0)}
                    </td>

                    {/* % Acumulado */}
                    <td className="py-2.5 px-3 text-right font-mono text-yellow-300 whitespace-nowrap hidden sm:table-cell">
                      <div className="flex items-center justify-end gap-1.5">
                        <span>{formatPercent(item.percentualAcumulado || 0)}</span>
                        <div className="w-12 bg-slate-800 rounded-full h-1.5 overflow-hidden hidden xl:block">
                          <div
                            className="h-full bg-yellow-400 rounded-full"
                            style={{ width: `${Math.min(item.percentualAcumulado || 0, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Curva ABC */}
                    <td className="py-2.5 px-3 text-center">
                      <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[11px] font-black ${
                        isClasseA
                          ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                          : isClasseB
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}>
                        {item.classeABC}
                      </span>
                    </td>

                    {/* Ações */}
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onEditItem(item)}
                          className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                          title="Editar material"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteItem(item.id)}
                          className="p-1 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                          title="Excluir material"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
