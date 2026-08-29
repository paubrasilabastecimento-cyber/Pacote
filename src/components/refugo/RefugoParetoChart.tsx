import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell,
} from 'recharts';
import { RefugoItem } from '../../types/refugo';
import { formatBRL, formatPercent, CATEGORIA_CORES } from '../../utils/refugoUtils';
import { BarChart3, HelpCircle } from 'lucide-react';

interface RefugoParetoChartProps {
  items: RefugoItem[];
}

export const RefugoParetoChart: React.FC<RefugoParetoChartProps> = ({ items }) => {
  const chartData = items.map((item) => ({
    name: item.material.length > 22 ? `${item.material.slice(0, 20)}...` : item.material,
    fullName: item.material,
    valor: item.valor,
    percentual: item.percentual || 0,
    acumulado: item.percentualAcumulado || 0,
    classeABC: item.classeABC,
    categoria: item.categoria,
    posicao: item.posicao,
  }));

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 mb-3 border-b border-slate-800/80 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Curva de Pareto de Refugo (R$ x % Acumulado)</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                Regra 80/20
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Estratificação de valor decrescente por material e curva de concentração acumulada
            </p>
          </div>
        </div>

        {/* Badges de Classes ABC */}
        <div className="flex items-center gap-2 text-[11px] flex-wrap">
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-500/15 border border-red-500/30 text-red-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Classe A (até 80%)
          </span>
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Classe B (80-95%)
          </span>
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Classe C (&gt;95%)
          </span>
        </div>
      </div>

      {/* Gráfico */}
      <div className="w-full h-80 sm:h-96">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 15, right: 30, left: 10, bottom: 65 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
            <XAxis
              dataKey="name"
              stroke="#94a3b8"
              tick={{ fill: '#cbd5e1', fontSize: 10 }}
              interval={0}
              angle={-35}
              textAnchor="end"
            />
            <YAxis
              yAxisId="left"
              stroke="#94a3b8"
              tick={{ fill: '#cbd5e1', fontSize: 11 }}
              tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#f59e0b"
              domain={[0, 100]}
              tick={{ fill: '#fbbf24', fontSize: 11 }}
              tickFormatter={(val) => `${val}%`}
            />
            <Tooltip
              cursor={false}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-slate-950 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1.5 min-w-[240px]">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                        <span className="font-bold text-white">#{d.posicao} {d.fullName}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            d.classeABC === 'A'
                              ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                              : d.classeABC === 'B'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          }`}
                        >
                          Classe {d.classeABC}
                        </span>
                      </div>
                      <div className="text-slate-300 flex justify-between">
                        <span>Categoria:</span>
                        <span className="font-semibold text-slate-100">{d.categoria}</span>
                      </div>
                      <div className="text-slate-300 flex justify-between">
                        <span>Valor do Refugo:</span>
                        <span className="font-mono font-bold text-amber-400">{formatBRL(d.valor)}</span>
                      </div>
                      <div className="text-slate-300 flex justify-between">
                        <span>% do Total:</span>
                        <span className="font-mono text-cyan-400">{formatPercent(d.percentual)}</span>
                      </div>
                      <div className="text-slate-300 flex justify-between border-t border-slate-800/80 pt-1">
                        <span>% Acumulado (Pareto):</span>
                        <span className="font-mono font-bold text-yellow-300">{formatPercent(d.acumulado)}</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              verticalAlign="top"
              wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
            />
            <ReferenceLine
              yAxisId="right"
              y={80}
              label={{ value: '80% (Corte Pareto)', fill: '#ef4444', fontSize: 10, position: 'right' }}
              stroke="#ef4444"
              strokeDasharray="4 4"
            />
            <ReferenceLine
              yAxisId="right"
              y={95}
              label={{ value: '95% (Corte Classe B)', fill: '#f59e0b', fontSize: 10, position: 'right' }}
              stroke="#f59e0b"
              strokeDasharray="4 4"
            />
            <Bar
              yAxisId="left"
              dataKey="valor"
              name="Valor do Refugo (R$)"
              radius={[4, 4, 0, 0]}
            >
              {chartData.map((entry, index) => {
                const color =
                  entry.classeABC === 'A'
                    ? '#ef4444'
                    : entry.classeABC === 'B'
                    ? '#f59e0b'
                    : '#10b981';
                return <Cell key={`cell-${index}`} fill={color} fillOpacity={0.85} />;
              })}
            </Bar>
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="acumulado"
              name="% Acumulado"
              stroke="#fbbf24"
              strokeWidth={3}
              dot={{ fill: '#fbbf24', r: 4, strokeWidth: 1, stroke: '#0f172a' }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
