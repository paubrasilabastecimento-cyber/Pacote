import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  AreaChart,
} from 'recharts';
import { ConsumoInternoItem } from '../../types/consumoInterno';
import { formatCurrency } from '../../utils/formatters';
import { TrendingUp } from 'lucide-react';

interface ConsumoMonthlyLineChartProps {
  data: ConsumoInternoItem[];
  onSelectMonth?: (mes: string | null) => void;
  selectedMonth?: string | null;
}

const MONTH_NAMES: Record<string, string> = {
  '01': 'Jan',
  '02': 'Fev',
  '03': 'Mar',
  '04': 'Abr',
  '05': 'Mai',
  '06': 'Jun',
  '07': 'Jul',
  '08': 'Ago',
  '09': 'Set',
  '10': 'Out',
  '11': 'Nov',
  '12': 'Dez',
};

export const ConsumoMonthlyLineChart: React.FC<ConsumoMonthlyLineChartProps> = ({
  data,
  onSelectMonth,
  selectedMonth,
}) => {
  const chartData = useMemo(() => {
    const map: Record<string, { total: number; qtde: number; registros: number }> = {};

    data.forEach((item) => {
      if (!item.dtOperacao) return;
      const mesRef = item.dtOperacao.slice(0, 7); // "YYYY-MM"
      if (!map[mesRef]) map[mesRef] = { total: 0, qtde: 0, registros: 0 };
      map[mesRef].total += item.total || 0;
      map[mesRef].qtde += item.qtde || 0;
      map[mesRef].registros += 1;
    });

    const sortedMonths = Object.keys(map).sort();

    return sortedMonths.map((mes) => {
      const [year, month] = mes.split('-');
      const label = `${MONTH_NAMES[month] || month}/${year.slice(2)}`;
      return {
        mes,
        label,
        total: Number(map[mes].total.toFixed(2)),
        qtde: map[mes].qtde,
        registros: map[mes].registros,
        ticketMedio: map[mes].registros > 0 ? Number((map[mes].total / map[mes].registros).toFixed(2)) : 0,
      };
    });
  }, [data]);

  return (
    <div
      id="chart-consumo-mensal"
      className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between"
    >
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">
              Evolução Temporal do Consumo (Mês a Mês)
            </h3>
            <p className="text-[10px] text-slate-400">
              Trajetória do gasto agrupado pela data da operação (Dt. Operação)
            </p>
          </div>
        </div>

        {selectedMonth && onSelectMonth && (
          <button
            onClick={() => onSelectMonth(null)}
            className="text-[10px] bg-slate-800 hover:bg-slate-700 text-sky-400 px-2 py-1 rounded-md font-semibold transition-colors cursor-pointer"
          >
            Todos os Meses
          </button>
        )}
      </div>

      <div className="h-72 w-full">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-500">
            Nenhum dado mensal registrado
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
            >
              <defs>
                <linearGradient id="consumoLineGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="label"
                stroke="#94a3b8"
                fontSize={10}
                tickLine={false}
                tick={{ fill: '#cbd5e1', fontWeight: 600 }}
              />
              <YAxis
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                tickFormatter={(val) => `R$ ${(val / 1000).toFixed(1)}k`}
                width={65}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-slate-950 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1.5 z-50">
                        <div className="font-bold text-white border-b border-slate-800 pb-1 flex items-center justify-between gap-3">
                          <span className="text-sky-400">{d.label}</span>
                          <span className="text-slate-400 font-mono text-[10px]">{d.mes}</span>
                        </div>
                        <div className="text-emerald-400 font-bold font-mono text-sm">
                          {formatCurrency(d.total)}
                        </div>
                        <div className="text-slate-300 text-[11px] flex items-center justify-between gap-2">
                          <span>Volume Total:</span>
                          <strong className="text-white font-mono">{d.qtde.toLocaleString('pt-BR')} un</strong>
                        </div>
                        <div className="text-slate-300 text-[11px] flex items-center justify-between gap-2">
                          <span>Registros / Operações:</span>
                          <strong className="text-purple-400 font-mono">{d.registros}</strong>
                        </div>
                        <div className="text-slate-400 text-[10px] pt-1 border-t border-slate-800 flex items-center justify-between gap-2">
                          <span>Média por item:</span>
                          <strong className="text-amber-400 font-mono">{formatCurrency(d.ticketMedio)}</strong>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#38bdf8"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#consumoLineGradient)"
                activeDot={{ r: 6, fill: '#38bdf8', stroke: '#0f172a', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="pt-3 mt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
        <span>
          Média Mensal:{' '}
          <strong className="text-sky-400">
            {chartData.length > 0
              ? formatCurrency(
                  chartData.reduce((acc, c) => acc + c.total, 0) / chartData.length
                )
              : 'R$ 0,00'}
          </strong>
        </span>
        <span>
          Meses Ativos: <strong className="text-slate-200">{chartData.length}</strong>
        </span>
      </div>
    </div>
  );
};
