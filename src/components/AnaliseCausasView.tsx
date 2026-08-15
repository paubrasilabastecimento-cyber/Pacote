import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatPercent } from '../utils/formatters';
import {
  PieChart as PieIcon,
  BarChart2,
  Layers,
  Clock,
  Package,
  TrendingDown,
  Info,
  DollarSign,
  Network,
  FolderTree,
} from 'lucide-react';
import { QuebrasHierarchyTree } from './QuebrasHierarchyTree';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
} from 'recharts';

export const AnaliseCausasView: React.FC = () => {
  const { filteredPerdas } = useApp();

  // Aggregation by Motivo
  const motivoMap: Record<string, { codigo: string; val: number; count: number }> = {};
  // Aggregation by Produto
  const produtoMap: Record<string, { val: number; count: number }> = {};
  // Aggregation by Área
  const areaMap: Record<string, { val: number }> = {};
  // Aggregation by Turno
  const turnoMap: Record<string, { val: number }> = {};

  let totalValor = 0;

  filteredPerdas.forEach((p) => {
    totalValor += p.valorR$;

    // Motivo
    if (!motivoMap[p.motivo]) {
      motivoMap[p.motivo] = { codigo: p.codigoMotivo, val: 0, count: 0 };
    }
    motivoMap[p.motivo].val += p.valorR$;
    motivoMap[p.motivo].count += 1;

    // Produto
    if (!produtoMap[p.produto]) {
      produtoMap[p.produto] = { val: 0, count: 0 };
    }
    produtoMap[p.produto].val += p.valorR$;
    produtoMap[p.produto].count += 1;

    // Área
    if (!areaMap[p.area]) {
      areaMap[p.area] = { val: 0 };
    }
    areaMap[p.area].val += p.valorR$;

    // Turno
    if (!turnoMap[p.turno]) {
      turnoMap[p.turno] = { val: 0 };
    }
    turnoMap[p.turno].val += p.valorR$;
  });

  // Limit state for Pareto chart motives
  const [paretoLimit, setParetoLimit] = useState<'top10' | 'top15' | 'all'>('top10');

  // Pareto Motivos Data
  const rawParetoSorted = Object.entries(motivoMap)
    .map(([motivo, data]) => ({
      motivo,
      codigo: data.codigo,
      val: data.val,
      count: data.count,
      percentVal: totalValor > 0 ? (data.val / totalValor) * 100 : 0,
      custoMedio: data.count > 0 ? data.val / data.count : 0,
    }))
    .sort((a, b) => b.val - a.val);

  let paretoMotivos = rawParetoSorted;
  if (paretoLimit === 'top10' && rawParetoSorted.length > 10) {
    const top = rawParetoSorted.slice(0, 10);
    const rest = rawParetoSorted.slice(10);
    const restVal = rest.reduce((s, x) => s + x.val, 0);
    const restCount = rest.reduce((s, x) => s + x.count, 0);
    const restPVal = rest.reduce((s, x) => s + x.percentVal, 0);
    if (restVal > 0) {
      top.push({
        motivo: 'DEMAIS MOTIVOS',
        codigo: 'OUT',
        val: restVal,
        count: restCount,
        percentVal: restPVal,
        custoMedio: restCount > 0 ? restVal / restCount : 0,
      });
    }
    paretoMotivos = top;
  } else if (paretoLimit === 'top15' && rawParetoSorted.length > 15) {
    const top = rawParetoSorted.slice(0, 15);
    const rest = rawParetoSorted.slice(15);
    const restVal = rest.reduce((s, x) => s + x.val, 0);
    const restCount = rest.reduce((s, x) => s + x.count, 0);
    const restPVal = rest.reduce((s, x) => s + x.percentVal, 0);
    if (restVal > 0) {
      top.push({
        motivo: 'DEMAIS MOTIVOS',
        codigo: 'OUT',
        val: restVal,
        count: restCount,
        percentVal: restPVal,
        custoMedio: restCount > 0 ? restVal / restCount : 0,
      });
    }
    paretoMotivos = top;
  }

  let acum = 0;
  const paretoChartData = paretoMotivos.map((d) => {
    acum += d.percentVal;
    return {
      ...d,
      displayMetric: d.val,
      acumulado: Number(Math.min(100, acum).toFixed(1)),
    };
  });

  // Produto Data
  const produtoData = Object.entries(produtoMap)
    .map(([nome, d]) => ({
      nome,
      val: d.val,
      count: d.count,
      percentVal: totalValor > 0 ? (d.val / totalValor) * 100 : 0,
    }))
    .sort((a, b) => b.val - a.val)
    .slice(0, 6);

  // Área Data
  const areaData = Object.entries(areaMap)
    .map(([area, d]) => ({
      area,
      val: d.val,
    }))
    .sort((a, b) => b.val - a.val);

  // Turno Data
  const turnoData = Object.entries(turnoMap).map(([turno, d]) => ({
    turno,
    val: d.val,
  }));

  const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#38bdf8', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-amber-400" />
            <span>Análise de Causas Raiz & Quebras (Visão Financeira)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Priorização e desdobramento financeiro do Pacote Prejuízo por motivo (Pareto), produto, área e turno.
          </p>
        </div>

        <div className="bg-slate-950 p-2.5 px-4 border border-slate-800 rounded-xl flex items-center gap-3 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Prejuízo Total</span>
            <strong className="text-emerald-400 font-mono text-base">{formatCurrency(totalValor)}</strong>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Registros</span>
            <strong className="text-slate-200 font-mono text-base">{filteredPerdas.length}</strong>
          </div>
        </div>
      </div>

      {/* ÁRVORE DE DECOMPOSIÇÃO HIERÁRQUICA */}
      <QuebrasHierarchyTree perdas={filteredPerdas} />

      {/* PARETO CHART SECTION */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-amber-400" />
              <span>Gráfico de Pareto Financeiro por Motivo (R$)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Regra 80/20: Identificação das causas financeiras que concentram 80% do prejuízo acumulado
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="bg-slate-950 p-0.5 rounded-lg border border-slate-800 flex text-[11px]">
              <button
                onClick={() => setParetoLimit('top10')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  paretoLimit === 'top10'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Top 10
              </button>
              <button
                onClick={() => setParetoLimit('top15')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  paretoLimit === 'top15'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Top 15
              </button>
              <button
                onClick={() => setParetoLimit('all')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  paretoLimit === 'all'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Todos ({rawParetoSorted.length})
              </button>
            </div>
          </div>
        </div>

        <div className="h-88 w-full" style={{ height: '360px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={paretoChartData} margin={{ top: 10, right: 10, left: 0, bottom: 45 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
              <XAxis
                dataKey="motivo"
                stroke="#cbd5e1"
                fontSize={10}
                interval={0}
                angle={-25}
                textAnchor="end"
                height={60}
                dy={10}
                tickFormatter={(val: string) => {
                  if (!val) return '';
                  if (val.length > 16) {
                    return `${val.slice(0, 14)}…`;
                  }
                  return val;
                }}
              />
              <YAxis
                yAxisId="left"
                stroke="#f59e0b"
                fontSize={10}
                tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#38bdf8"
                fontSize={10}
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;
                  const data = payload[0]?.payload;
                  if (!data) return null;
                  const valor = data.displayMetric ?? 0;
                  const acumulado = data.acumulado ?? 0;
                  return (
                    <div className="bg-slate-950/95 backdrop-blur-md border border-slate-700/90 rounded-xl p-3.5 shadow-2xl min-w-[250px] text-xs font-sans ring-1 ring-white/10">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 gap-2">
                        <span className="font-bold text-white text-sm truncate max-w-[170px]" title={data.motivo || label}>
                          {data.motivo || label}
                        </span>
                        {acumulado <= 80.5 ? (
                          <span className="bg-rose-500/20 text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-500/40">
                            Zona Vital (80%)
                          </span>
                        ) : (
                          <span className="bg-sky-500/20 text-sky-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-sky-500/40">
                            Cauda (20%)
                          </span>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center bg-slate-900/90 px-2.5 py-1.5 rounded-lg">
                          <span className="text-slate-300">Prejuízo Financeiro:</span>
                          <span className="font-mono font-black text-rose-400">{formatCurrency(valor)}</span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-900/90 px-2.5 py-1.5 rounded-lg">
                          <span className="text-slate-300">% Acumulado Pareto:</span>
                          <span className="font-mono font-bold text-sky-400">{acumulado.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
              <Bar
                yAxisId="left"
                dataKey="displayMetric"
                name="Prejuízo R$"
                fill="#f59e0b"
                radius={[4, 4, 0, 0]}
              >
                {paretoChartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index === 0 ? '#ef4444' : index === 1 ? '#f97316' : '#f59e0b'}
                  />
                ))}
              </Bar>
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="acumulado"
                name="% Acumulado"
                stroke="#38bdf8"
                strokeWidth={3}
                dot={{ r: 4, fill: '#38bdf8' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* DETAILED MOTIVES PARTICIPATION TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3">
          Tabela de Participação Financeira por Causa
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider font-bold border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Código / Motivo</th>
                <th className="py-2.5 px-3 text-center">Nº Ocorrências</th>
                <th className="py-2.5 px-3 text-right">Custo Médio / Ocorrência</th>
                <th className="py-2.5 px-3 text-right">Prejuízo Total (R$)</th>
                <th className="py-2.5 px-3 text-right">% do Prejuízo</th>
                <th className="py-2.5 px-3 text-right">% Acumulado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
              {paretoChartData.map((m) => (
                <tr key={m.motivo} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3">
                    <span className="font-bold text-amber-400 font-mono mr-2">{m.codigo}</span>
                    <span className="font-semibold text-white">{m.motivo}</span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-200">
                    {m.count.toLocaleString('pt-BR')}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                    {formatCurrency(m.custoMedio)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                    {formatCurrency(m.val)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-400">
                    {formatPercent(m.percentVal)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-sky-400 font-bold">
                    {m.acumulado.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* BREAKDOWN BY PRODUCT, AREA AND SHIFT */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Top Products */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-400" />
            <span>Perdas Financeiras por Produto / SKU (Top 6)</span>
          </h3>

          <div className="space-y-3">
            {produtoData.map((p) => (
              <div key={p.nome} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-200 truncate max-w-[180px]">{p.nome}</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {formatCurrency(p.val)}
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-amber-500 h-1.5 rounded-full"
                    style={{ width: `${Math.min(100, p.percentVal * 2)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Perdas por Área */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-400" />
            <span>Perdas Financeiras por Área</span>
          </h3>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={areaData} layout="vertical" margin={{ top: 5, right: 10, left: 30, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={10} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                <YAxis dataKey="area" type="category" stroke="#94a3b8" fontSize={10} />
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null;
                    const data = payload[0]?.payload;
                    if (!data) return null;
                    return (
                      <div className="bg-slate-950/95 backdrop-blur-md border border-slate-700/90 rounded-xl p-3 shadow-2xl min-w-[200px] text-xs font-sans ring-1 ring-white/10">
                        <div className="font-bold text-white mb-1.5 pb-1 border-b border-slate-800">
                          {data.area || label}
                        </div>
                        <div className="flex justify-between items-center bg-slate-900/90 px-2 py-1 rounded">
                          <span className="text-slate-400">Prejuízo R$:</span>
                          <span className="font-mono font-bold text-sky-400">{formatCurrency(data.val)}</span>
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="val" fill="#0284c7" radius={[0, 4, 4, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Perdas por Turno */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-400" />
            <span>Perdas Financeiras por Turno</span>
          </h3>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={turnoData}
                  dataKey="val"
                  nameKey="turno"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  label={(entry: any) => entry.turno || ''}
                >
                  {turnoData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const data = payload[0]?.payload;
                    if (!data) return null;
                    return (
                      <div className="bg-slate-950/95 backdrop-blur-md border border-slate-700/90 rounded-xl p-3 shadow-2xl min-w-[200px] text-xs font-sans ring-1 ring-white/10">
                        <div className="font-bold text-white mb-1.5 pb-1 border-b border-slate-800">
                          {data.turno}
                        </div>
                        <div className="flex justify-between items-center bg-slate-900/90 px-2 py-1 rounded">
                          <span className="text-slate-400">Prejuízo R$:</span>
                          <span className="font-mono font-bold text-purple-400">{formatCurrency(data.val)}</span>
                        </div>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
