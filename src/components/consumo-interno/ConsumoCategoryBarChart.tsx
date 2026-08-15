import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { ConsumoInternoItem } from '../../types/consumoInterno';
import { formatCurrency } from '../../utils/formatters';
import { CATEGORIAS_CONFIG } from '../../utils/consumoClassifier';
import { BarChart3 } from 'lucide-react';

interface ConsumoCategoryBarChartProps {
  data: ConsumoInternoItem[];
  onSelectCategory?: (categoria: string | null) => void;
  selectedCategory?: string | null;
}

export const ConsumoCategoryBarChart: React.FC<ConsumoCategoryBarChartProps> = ({
  data,
  onSelectCategory,
  selectedCategory,
}) => {
  const chartData = useMemo(() => {
    const totalGeral = data.reduce((acc, it) => acc + (it.total || 0), 0);
    const map: Record<string, { total: number; qtde: number; count: number }> = {};

    data.forEach((item) => {
      const cat = item.categoria || 'Outros';
      if (!map[cat]) map[cat] = { total: 0, qtde: 0, count: 0 };
      map[cat].total += item.total || 0;
      map[cat].qtde += item.qtde || 0;
      map[cat].count += 1;
    });

    return Object.entries(map)
      .map(([categoria, stats]) => {
        const percentual = totalGeral > 0 ? (stats.total / totalGeral) * 100 : 0;
        const color = CATEGORIAS_CONFIG[categoria as keyof typeof CATEGORIAS_CONFIG]?.color || '#94a3b8';
        return {
          categoria,
          total: Number(stats.total.toFixed(2)),
          qtde: stats.qtde,
          count: stats.count,
          percentual: Number(percentual.toFixed(1)),
          color,
        };
      })
      .sort((a, b) => b.total - a.total); // Ordenado decrescente
  }, [data]);

  const maxTotal = useMemo(() => {
    return Math.max(...chartData.map((d) => d.total), 100);
  }, [chartData]);

  return (
    <div
      id="chart-consumo-categoria"
      className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between"
    >
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">
              Gasto Total por Categoria
            </h3>
            <p className="text-[10px] text-slate-400">
              Distribuição decrescente de custo em R$ e representatividade
            </p>
          </div>
        </div>

        {selectedCategory && onSelectCategory && (
          <button
            onClick={() => onSelectCategory(null)}
            className="text-[10px] bg-slate-800 hover:bg-slate-700 text-amber-400 px-2 py-1 rounded-md font-semibold transition-colors cursor-pointer"
          >
            Limpar Filtro ({selectedCategory})
          </button>
        )}
      </div>

      <div className="h-72 w-full">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-500">
            Nenhum dado encontrado para o período selecionado
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis
                type="number"
                tickFormatter={(val) => `R$ ${(val / 1000).toFixed(1)}k`}
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="categoria"
                stroke="#cbd5e1"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                width={95}
                tick={{ fill: '#e2e8f0', fontWeight: 600 }}
              />
              <Tooltip
                cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-slate-950 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1.5 z-50">
                        <div className="flex items-center gap-2 font-bold text-white border-b border-slate-800 pb-1">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: d.color }}
                          />
                          <span>{d.categoria}</span>
                        </div>
                        <div className="text-amber-400 font-bold font-mono text-sm">
                          {formatCurrency(d.total)}
                        </div>
                        <div className="text-slate-300 text-[11px]">
                          Representatividade: <strong className="text-sky-400">{d.percentual}%</strong>
                        </div>
                        <div className="text-slate-400 text-[10px]">
                          Volume: <strong className="text-slate-200">{d.qtde.toLocaleString('pt-BR')} un</strong> ({d.count} operações)
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="total"
                radius={[0, 6, 6, 0]}
                onClick={(entry) => onSelectCategory && onSelectCategory(entry.categoria)}
                cursor="pointer"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    opacity={selectedCategory && selectedCategory !== entry.categoria ? 0.35 : 0.95}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Mini Legend Summary */}
      <div className="pt-3 mt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400">
        <span className="font-mono">
          Top Categoria:{' '}
          <strong className="text-amber-400">
            {chartData[0]?.categoria || '-'} ({chartData[0]?.percentual || 0}%)
          </strong>
        </span>
        <span className="font-mono">
          Total Categorizado:{' '}
          <strong className="text-white font-bold">
            {formatCurrency(chartData.reduce((a, b) => a + b.total, 0))}
          </strong>
        </span>
      </div>
    </div>
  );
};
