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
    <div className="bg-slate-900 border-b border-slate-800 p-4 text-slate-200 transition-all shadow-inner">
      <div className="max-w-7xl mx-auto space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-xs uppercase tracking-wider text-slate-300">
              Filtros Avançados de Operação
            </span>
            {activeCount > 0 && (
              <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] px-2 py-0.5 rounded-full font-bold">
                {activeCount} filtro(s) ativo(s)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {activeCount > 0 && (
              <button
                onClick={resetFiltros}
                className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded transition-colors font-semibold"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Limpar Filtros</span>
              </button>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Form Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
          {/* Mês */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Mês de Referência
            </label>
            <select
              value={filtros.mes}
              onChange={(e) => handleChange('mes', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:border-amber-500 focus:outline-none"
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
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Área do Armazém
            </label>
            <select
              value={filtros.area}
              onChange={(e) => handleChange('area', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:border-amber-500 focus:outline-none"
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
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Turno Operacional
            </label>
            <select
              value={filtros.turno}
              onChange={(e) => handleChange('turno', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:border-amber-500 focus:outline-none"
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
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Produto / SKU
            </label>
            <select
              value={filtros.produto}
              onChange={(e) => handleChange('produto', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:border-amber-500 focus:outline-none truncate"
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
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Motivo da Perda
            </label>
            <select
              value={filtros.motivo}
              onChange={(e) => handleChange('motivo', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:border-amber-500 focus:outline-none"
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
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Responsável / Operador
            </label>
            <input
              type="text"
              placeholder="Buscar responsável..."
              value={filtros.responsavel}
              onChange={(e) => handleChange('responsavel', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Intervalo de Datas / Período */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Período & Calendário
            </label>
            <DateRangePickerPopover
              triggerClassName="w-full justify-between bg-slate-800 border-slate-700 hover:border-amber-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
