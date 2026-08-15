import React from 'react';
import { useApp } from '../context/AppContext';
import { MenuItemId } from '../types';
import {
  formatCurrency,
  formatPercent,
  getStatusKPI,
  getStatusBadgeConfig,
  formatMesAno,
  formatDateBR,
} from '../utils/formatters';
import {
  Target,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  TrendingDown,
  ArrowRight,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

interface KPIIndividualViewProps {
  kpiKey?: 'scl';
}

const CONFIG_KPI = {
  scl: {
    title: 'SCL – Pacote Prejuízo (Supply Chain Loss)',
    subtitle: 'Impacto financeiro consolidado de todas as perdas e avarias físicas no armazém e distribuição',
    code: 'SCL (R$)',
    unit: 'R$',
    icon: <DollarSign className="w-8 h-8 text-emerald-400" />,
    formatter: formatCurrency,
    isHigherBetter: false,
    dataKeyAtual: 'sclAtual',
    dataKeyMeta: 'sclMeta',
    metaDesc: 'Acompanhamento rigoroso do orçamento mensal de perdas operacionais',
    impactoTexto: 'Cada R$ economizado no Pacote Prejuízo melhora diretamente a margem operacional e o EBITDA do Centro de Distribuição.',
  },
};

export const KPIIndividualView: React.FC<KPIIndividualViewProps> = ({ kpiKey = 'scl' }) => {
  const { currentMonthKPI, computedMonthKPIs, filteredPerdas, setActiveTab } = useApp();

  const cfg = CONFIG_KPI.scl;

  const valAtual = currentMonthKPI.sclAtual;
  const valMeta = currentMonthKPI.sclMeta;
  const gap = valAtual - valMeta;

  const status = getStatusKPI('scl', valAtual, valMeta);
  const badge = getStatusBadgeConfig(status);

  // Filter top contributing causes for this specific KPI
  const motiveLossMap: Record<string, { codigo: string; val: number; count: number }> = {};
  filteredPerdas.forEach((p) => {
    if (!motiveLossMap[p.motivo]) {
      motiveLossMap[p.motivo] = { codigo: p.codigoMotivo, val: 0, count: 0 };
    }
    motiveLossMap[p.motivo].val += p.valorR$;
    motiveLossMap[p.motivo].count += 1;
  });

  const totalFilteredVal = filteredPerdas.reduce((acc, p) => acc + p.valorR$, 0);

  const topCausas = Object.entries(motiveLossMap)
    .map(([motivo, d]) => ({
      motivo,
      ...d,
      pct: totalFilteredVal > 0 ? (d.val / totalFilteredVal) * 100 : 0,
    }))
    .sort((a, b) => b.val - a.val)
    .slice(0, 5);

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Big Metric Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 shadow-inner">
              {cfg.icon}
            </div>
            <div>
              <span className="text-amber-400 font-extrabold text-xs uppercase tracking-wider">
                Acompanhamento de KPI AMBEV
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">{cfg.title}</h2>
              <p className="text-xs text-slate-400">{cfg.subtitle}</p>
            </div>
          </div>

          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-extrabold border ${badge.colorClass}`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${badge.dotColor}`} />
            <span>{badge.label}</span>
          </div>
        </div>

        {/* Current Result vs Target Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              Resultado Atual ({formatMesAno(currentMonthKPI.mes)})
            </span>
            <div className="text-2xl font-black text-white font-mono mt-1">
              {cfg.formatter(valAtual)}
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              Meta do Indicador
            </span>
            <div className="text-2xl font-black text-amber-400 font-mono mt-1">
              {cfg.formatter(valMeta)}
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              Desvio para a Meta (Gap)
            </span>
            <div
              className={`text-2xl font-black font-mono mt-1 ${
                (cfg.isHigherBetter && gap >= 0) || (!cfg.isHigherBetter && gap <= 0)
                  ? 'text-emerald-400'
                  : 'text-rose-400'
              }`}
            >
              {gap >= 0 ? '+' : ''}
              {cfg.formatter(gap)}
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              Evolução vs Mês Anterior
            </span>
            <div className="text-xs text-slate-300 font-medium mt-2">
              {cfg.metaDesc}
            </div>
          </div>
        </div>
      </div>

      {/* EVOLUTION CHART OVER 4 MONTHS */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Evolução Histórica do {cfg.code} (Últimos 4 Meses)
            </h3>
            <p className="text-xs text-slate-400">
              Acompanhamento mensal do resultado apurado versus meta
            </p>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={computedMonthKPIs} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
              <XAxis dataKey="mes" tickFormatter={formatMesAno} stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={10} />
              <Tooltip
                cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;
                  const data = payload[0]?.payload;
                  if (!data) return null;
                  const real = data[cfg.dataKeyAtual] ?? 0;
                  const meta = data[cfg.dataKeyMeta] ?? 0;
                  const isDentro = real <= meta;
                  return (
                    <div className="bg-slate-950/95 backdrop-blur-md border border-slate-700/90 rounded-xl p-3.5 shadow-2xl min-w-[240px] text-xs font-sans ring-1 ring-white/10">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                        <span className="font-bold text-white text-sm">{formatMesAno(label)}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${isDentro ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border-rose-500/40'}`}>
                          {isDentro ? 'Dentro da Meta' : 'Acima da Meta'}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center bg-slate-900/90 px-2.5 py-1.5 rounded-lg">
                          <span className="text-slate-300">{cfg.code} Realizado:</span>
                          <span className={`font-mono font-bold ${isDentro ? 'text-emerald-400' : 'text-rose-400'}`}>{cfg.formatter(real)}</span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-900/90 px-2.5 py-1.5 rounded-lg">
                          <span className="text-slate-300">Meta {cfg.code}:</span>
                          <span className="font-mono font-bold text-amber-400">{cfg.formatter(meta)}</span>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey={cfg.dataKeyAtual} name={`${cfg.code} Realizado`} fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={40} />
              <Line
                type="monotone"
                dataKey={cfg.dataKeyMeta}
                name={`Meta ${cfg.code}`}
                stroke="#ef4444"
                strokeDasharray="4 4"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TOP CAUSES & IMPACT ANALYSIS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Causes */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
            Principais Motivos Ofensores deste Indicador
          </h3>

          <div className="space-y-3">
            {topCausas.map((c) => (
              <div
                key={c.motivo}
                className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-amber-400 font-mono text-xs mr-2">{c.codigo}</span>
                  <span className="font-semibold text-slate-200 text-xs">{c.motivo}</span>
                </div>
                <div className="text-right font-mono text-xs">
                  <div className="text-emerald-400 font-bold">{formatCurrency(c.val)}</div>
                  <div className="text-slate-400 text-[10px]">{c.pct.toFixed(1)}% ({c.count} reg.)</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Operational & Financial Impact */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-400" />
              <span>Impacto Operacional e Financeiro</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mt-3">
              {cfg.impactoTexto}
            </p>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={() => setActiveTab('plano-acao')}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-md shadow-amber-500/20"
            >
              <span>Tratar Desvios em Plano de Ação</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
