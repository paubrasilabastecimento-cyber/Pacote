import React from 'react';
import {
  RefugoMetrics,
  RefugoItem,
} from '../../types/refugo';
import { formatBRL, formatPercent } from '../../utils/refugoUtils';
import { Wine, Package, Box, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';

interface RefugoStratificationBreakdownProps {
  metrics: RefugoMetrics;
  items: RefugoItem[];
}

export const RefugoStratificationBreakdown: React.FC<RefugoStratificationBreakdownProps> = ({
  metrics,
  items,
}) => {
  const vidros = items.filter((i) => i.categoria === 'Garrafas de Vidro');
  const garrafeiras = items.filter((i) => i.categoria === 'Garrafeiras Plásticas');
  const paletes = items.filter((i) => i.categoria === 'Paletes de Madeira');

  const totalVidros = vidros.reduce((a, b) => a + b.valor, 0);
  const totalGarrafeiras = garrafeiras.reduce((a, b) => a + b.valor, 0);
  const totalPaletes = paletes.reduce((a, b) => a + b.valor, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* 1. Estratificação de Garrafas de Vidro */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <Wine className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Garrafas de Vidro Retornáveis</h3>
                <span className="text-[11px] text-cyan-400 font-medium">
                  {vidros.length} itens mapeados • {formatPercent(metrics.totalValor > 0 ? (totalVidros / metrics.totalValor) * 100 : 0)} do refugo
                </span>
              </div>
            </div>
            <span className="font-mono font-bold text-white text-base">
              {formatBRL(totalVidros)}
            </span>
          </div>

          <div className="mt-3 space-y-2">
            {vidros.map((item) => (
              <div
                key={item.id}
                className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs hover:border-cyan-500/30 transition-colors"
              >
                <div className="flex flex-col min-w-0 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[10px] flex items-center justify-center font-bold">
                      #{item.posicao}
                    </span>
                    <span className="font-semibold text-slate-200 truncate" title={item.material}>
                      {item.material}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    Calibre: {item.calibre} • Cor: {item.cor}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono font-bold text-cyan-300 block">
                    {formatBRL(item.valor)}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {formatPercent(item.percentual || 0)} do total
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-1.5 bg-cyan-500/5 p-2 rounded-lg border border-cyan-500/10">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>Foco prioritário: garrafas 635ml e 1L concentram 64% de todo o refugo fabril/logístico.</span>
        </div>
      </div>

      {/* 2. Estratificação de Garrafeiras Plásticas */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Garrafeiras Plásticas</h3>
                <span className="text-[11px] text-blue-400 font-medium">
                  {garrafeiras.length} itens mapeados • {formatPercent(metrics.totalValor > 0 ? (totalGarrafeiras / metrics.totalValor) * 100 : 0)} do refugo
                </span>
              </div>
            </div>
            <span className="font-mono font-bold text-white text-base">
              {formatBRL(totalGarrafeiras)}
            </span>
          </div>

          <div className="mt-3 space-y-2">
            {garrafeiras.map((item) => (
              <div
                key={item.id}
                className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs hover:border-blue-500/30 transition-colors"
              >
                <div className="flex flex-col min-w-0 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded bg-blue-500/20 text-blue-300 font-mono text-[10px] flex items-center justify-center font-bold">
                      #{item.posicao}
                    </span>
                    <span className="font-semibold text-slate-200 truncate" title={item.material}>
                      {item.material}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    Formato: {item.calibre} • Cor: {item.cor}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono font-bold text-blue-300 block">
                    {formatBRL(item.valor)}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {formatPercent(item.percentual || 0)} do total
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-1.5 bg-blue-500/5 p-2 rounded-lg border border-blue-500/10">
          <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span>Garrafeira 24x600ml com alça lateral lidera as perdas em vasilhames plásticos.</span>
        </div>
      </div>

      {/* 3. Estratificação de Paletes de Madeira */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Box className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Paletes / Unitizadores</h3>
                <span className="text-[11px] text-amber-400 font-medium">
                  {paletes.length} itens mapeados • {formatPercent(metrics.totalValor > 0 ? (totalPaletes / metrics.totalValor) * 100 : 0)} do refugo
                </span>
              </div>
            </div>
            <span className="font-mono font-bold text-white text-base">
              {formatBRL(totalPaletes)}
            </span>
          </div>

          <div className="mt-3 space-y-2">
            {paletes.map((item) => (
              <div
                key={item.id}
                className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs hover:border-amber-500/30 transition-colors"
              >
                <div className="flex flex-col min-w-0 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] flex items-center justify-center font-bold">
                      #{item.posicao}
                    </span>
                    <span className="font-semibold text-slate-200 truncate" title={item.material}>
                      {item.material}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    Medida: {item.calibre}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono font-bold text-amber-300 block">
                    {formatBRL(item.valor)}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {formatPercent(item.percentual || 0)} do total
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-1.5 bg-amber-500/5 p-2 rounded-lg border border-amber-500/10">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Paletes PBR padrão (1,00m x 1,20m) respondem por 57% do refugo de madeira.</span>
        </div>
      </div>
    </div>
  );
};
