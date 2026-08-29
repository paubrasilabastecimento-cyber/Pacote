import React from 'react';
import {
  Wine,
  Package,
  Box,
} from 'lucide-react';
import { RefugoMetrics } from '../../types/refugo';
import { formatBRL, formatPercent } from '../../utils/refugoUtils';

interface RefugoKPICardsProps {
  metrics: RefugoMetrics;
}

export const RefugoKPICards: React.FC<RefugoKPICardsProps> = ({ metrics }) => {
  const vidros = metrics.porCategoria.find((c) => c.categoria === 'Garrafas de Vidro');
  const garrafeiras = metrics.porCategoria.find((c) => c.categoria === 'Garrafeiras Plásticas');
  const paletes = metrics.porCategoria.find((c) => c.categoria === 'Paletes de Madeira');

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {/* 1. Garrafas de Vidro */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-cyan-500/40 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Garrafas Vidro</span>
          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
            <Wine className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-xl font-black text-cyan-400 font-mono tracking-tight">
            {formatBRL(vidros?.valor || 0)}
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
            {formatPercent(vidros?.percentual || 0)} ({vidros?.count || 0} itens)
          </p>
        </div>
      </div>

      {/* 2. Garrafeiras Plásticas */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-blue-500/40 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Garrafeiras Plásticas</span>
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Package className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-xl font-black text-blue-400 font-mono tracking-tight">
            {formatBRL(garrafeiras?.valor || 0)}
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
            {formatPercent(garrafeiras?.percentual || 0)} ({garrafeiras?.count || 0} caixas)
          </p>
        </div>
      </div>

      {/* 3. Paletes de Madeira */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-amber-500/40 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Paletes Madeira</span>
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Box className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-xl font-black text-amber-400 font-mono tracking-tight">
            {formatBRL(paletes?.valor || 0)}
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
            {formatPercent(paletes?.percentual || 0)} ({paletes?.count || 0} unitizadores)
          </p>
        </div>
      </div>
    </div>
  );
};
