import React from 'react';
import { useApp } from '../context/AppContext';
import { TURNOS } from '../data/mockData';
import { formatMesAno } from '../utils/formatters';
import { X, RotateCcw, Filter, Calendar } from 'lucide-react';
import { DateRangePickerPopover } from './DateRangePickerPopover';

interface FilterBarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({ isOpen, setIsOpen }) => {
  const {
    filtros,
    setFiltros,
    resetFiltros,
    availableMonths,
    availableAreas,
    availableProdutos,
    availableMotivos,
  } = useApp();

  if (!isOpen) return null;

  const handleChange = (field: keyof typeof filtros, value: string) => {
    setFiltros((prev) => ({ ...prev, [field]: value }));
  };

  const activeCount = [
    filtros.mes,
    filtros.area,
    filtros.turno,
    filtros.produto,
    filtros.motivo,
    filtros.responsavel,
    filtros.dataInicio,
    filtros.dataFim,
  ].filter(Boolean).length;

  return (
    <div className="bg-white/90 backdrop-blur-md border-b border-blue-200/80 p-4 text-slate-800 transition-all shadow-sm">
      <div className="max-w-7xl mx-auto space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-blue-100">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-600" />
            <span className="font-extrabold text-xs uppercase tracking-wider text-blue-950">
              Filtros Avançados de Operação
            </span>
            {activeCount > 0 && (
              <span className="bg-blue-100 text-blue-700 border border-blue-300 text-[11px] px-2.5 py-0.5 rounded-full font-bold">
                {activeCount} filtro(s) ativo(s)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {activeCount > 0 && (
              <button
                onClick={resetFiltros}
                className="flex items-center gap-1.5 text-xs text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-xl transition-colors font-bold cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Limpar Filtros</span>
              </button>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-blue-50 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Form Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
          {/* Mês */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Mês de Referência
            </label>
            <select
              value={filtros.mes}
              onChange={(e) => handleChange('mes', e.target.value)}
              className="w-full bg-white border border-blue-200 rounded-xl px-2.5 py-1.5 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none shadow-sm"
            >
              <option value="">Todos os Meses</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {formatMesAno(m) || m}
                </option>
              ))}
            </select>
          </div>

          {/* Área */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Área do Armazém
            </label>
            <select
              value={filtros.area}
              onChange={(e) => handleChange('area', e.target.value)}
              className="w-full bg-white border border-blue-200 rounded-xl px-2.5 py-1.5 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none shadow-sm"
            >
              <option value="">Todas as Áreas</option>
              {availableAreas.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          {/* Turno */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Turno Operacional
            </label>
            <select
              value={filtros.turno}
              onChange={(e) => handleChange('turno', e.target.value)}
              className="w-full bg-white border border-blue-200 rounded-xl px-2.5 py-1.5 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none shadow-sm"
            >
              <option value="">Todos os Turnos</option>
              {TURNOS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Produto */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Produto / SKU
            </label>
            <select
              value={filtros.produto}
              onChange={(e) => handleChange('produto', e.target.value)}
              className="w-full bg-white border border-blue-200 rounded-xl px-2.5 py-1.5 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none truncate shadow-sm"
            >
              <option value="">Todos os SKUs</option>
              {availableProdutos.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Motivo */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Motivo da Perda
            </label>
            <select
              value={filtros.motivo}
              onChange={(e) => handleChange('motivo', e.target.value)}
              className="w-full bg-white border border-blue-200 rounded-xl px-2.5 py-1.5 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none shadow-sm"
            >
              <option value="">Todos os Motivos</option>
              {availableMotivos.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Responsável */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Responsável / Operador
            </label>
            <input
              type="text"
              placeholder="Buscar responsável..."
              value={filtros.responsavel}
              onChange={(e) => handleChange('responsavel', e.target.value)}
              className="w-full bg-white border border-blue-200 rounded-xl px-2.5 py-1.5 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none shadow-sm placeholder:text-slate-400"
            />
          </div>

          {/* Intervalo de Datas / Período */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Período & Calendário
            </label>
            <DateRangePickerPopover
              triggerClassName="w-full justify-between bg-white border-blue-200 text-slate-800 hover:border-blue-400 rounded-xl shadow-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
