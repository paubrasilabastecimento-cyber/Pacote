import React, { useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import { CategoriaEstratificacao, CalibreEstratificacao } from '../../types/refugo';
import { formatBRL, formatPercent } from '../../utils/refugoUtils';
import { PieChart as PieIcon, Layers } from 'lucide-react';

interface RefugoCategoryDonutProps {
  porCategoria: CategoriaEstratificacao[];
  porCalibre: CalibreEstratificacao[];
}

const CALIBRE_CORES = ['#06b6d4', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#10b981'];

export const RefugoCategoryDonut: React.FC<RefugoCategoryDonutProps> = ({
  porCategoria,
  porCalibre,
}) => {
  const [activeMode, setActiveMode] = useState<'categoria' | 'calibre'>('categoria');

  const data = activeMode === 'categoria'
    ? porCategoria.map((c) => ({
        name: c.categoria,
        valor: c.valor,
        count: c.count,
        percentual: c.percentual,
        color: c.color,
      }))
    : porCalibre.map((c, idx) => ({
        name: c.calibre,
        valor: c.valor,
        count: c.count,
        percentual: c.percentual,
        color: CALIBRE_CORES[idx % CALIBRE_CORES.length],
      }));

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col h-full">
      {/* Header com Toggle */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
            <PieIcon className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Composição Estratificada</h2>
            <p className="text-xs text-slate-400">Distribuição percentual do refugo</p>
          </div>
        </div>

        {/* Toggle Categorias / Calibre */}
        <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
          <button
            onClick={() => setActiveMode('categoria')}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              activeMode === 'categoria'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Famílias
          </button>
          <button
            onClick={() => setActiveMode('calibre')}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              activeMode === 'calibre'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Volumes
          </button>
        </div>
      </div>

      {/* Gráfico Donut */}
      <div className="w-full h-64 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              cursor={false}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-slate-950 border border-slate-700 p-2.5 rounded-xl shadow-2xl text-xs space-y-1">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                        <span>{d.name}</span>
                      </div>
                      <div className="text-slate-300 flex justify-between gap-4">
                        <span>Impacto:</span>
                        <span className="font-mono font-bold text-amber-400">{formatBRL(d.valor)}</span>
                      </div>
                      <div className="text-slate-300 flex justify-between gap-4">
                        <span>Participação:</span>
                        <span className="font-mono text-cyan-400">{formatPercent(d.percentual)}</span>
                      </div>
                      <div className="text-slate-400 text-[10px]">
                        {d.count} tipos de materiais
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              verticalAlign="bottom"
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
            />
            <Pie
              data={data}
              dataKey="valor"
              nameKey="name"
              cx="50%"
              cy="48%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
            >
              {data.map((entry, index) => (
                <Cell key={`donut-cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Mini resumo em lista */}
      <div className="mt-2 pt-2 border-t border-slate-800/80 space-y-1.5 text-xs">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between">
            <div className="flex items-center gap-2 truncate">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-slate-300 truncate">{item.name}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0 font-mono">
              <span className="text-slate-400">{formatPercent(item.percentual)}</span>
              <span className="font-bold text-white">{formatBRL(item.valor)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
