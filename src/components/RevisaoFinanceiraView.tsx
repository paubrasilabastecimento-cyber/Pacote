import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatMesAno, formatDateBR, formatPercent } from '../utils/formatters';
import {
  FileText,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Percent,
  MessageSquare,
  PlusCircle,
  Trash2,
  Send,
  User,
  Building,
  Award,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

export const RevisaoFinanceiraView: React.FC = () => {
  const {
    currentMonthKPI,
    computedMonthKPIs,
    filteredPerdas,
    comentarios,
    addComentario,
    deleteComentario,
    filteredAcoes,
  } = useApp();

  // Form for new management comment
  const [autor, setAutor] = useState<string>('Fernando Vasconcelos');
  const [cargo, setCargo] = useState<string>('Gerente Operacional Logística - AMBEV');
  const [texto, setTexto] = useState<string>('');
  const [tipo, setTipo] = useState<
    'Análise de Desvio' | 'Diagnóstico Operacional' | 'Direcionamento Estratégico'
  >('Análise de Desvio');

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!texto.trim()) return;

    await addComentario({
      mesRef: currentMonthKPI.mes,
      autor,
      cargo,
      texto,
      tipo,
    });

    setTexto('');
  };

  // Top financial drivers
  const financialDriversMap: Record<string, number> = {};
  filteredPerdas.forEach((p) => {
    financialDriversMap[p.motivo] = (financialDriversMap[p.motivo] || 0) + p.valorR$;
  });

  const topDrivers = Object.entries(financialDriversMap)
    .map(([motivo, val]) => ({ motivo, val }))
    .sort((a, b) => b.val - a.val)
    .slice(0, 4);

  const totalLoss = filteredPerdas.reduce((acc, p) => acc + p.valorR$, 0);
  const gapScl = totalLoss - currentMonthKPI.sclMeta;
  const atingimentoPct = currentMonthKPI.sclMeta > 0 ? (totalLoss / currentMonthKPI.sclMeta) * 100 : 0;
  const difAnterior = totalLoss - currentMonthKPI.sclAnterior;

  // Completed actions impact
  const acoesConcluidas = filteredAcoes.filter((a) => a.status === 'Concluído');

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full">
            Ritmo de Gestão Mensal AMBEV
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
            Reunião de Revisão Financeira do Pacote Prejuízo
          </h2>
          <p className="text-xs text-slate-400">
            Ata executiva de apuração dos custos de perdas, variação orçamentária e direcionamentos estratégicos.
          </p>
        </div>

        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-right font-mono">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Mês em Análise</div>
          <div className="text-lg font-black text-amber-400">
            {formatMesAno(currentMonthKPI.mes)}
          </div>
        </div>
      </div>

      {/* 4 MAIN FINANCIAL SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Prejuízo Realizado (SCL)</span>
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{formatCurrency(totalLoss)}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            {filteredPerdas.length} registros computados
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Meta Orçada SCL</span>
            <Building className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">
            {formatCurrency(currentMonthKPI.sclMeta)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Orçamento limite do CD
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Desvio vs Meta (Gap)</span>
            {gapScl <= 0 ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            )}
          </div>
          <div className={`text-2xl font-black font-mono ${gapScl <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {gapScl <= 0 ? '-' : '+'}{formatCurrency(Math.abs(gapScl))}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {gapScl <= 0 ? (
              <span className="text-emerald-400 font-semibold">Economia orçamentária</span>
            ) : (
              <span className="text-rose-400 font-semibold">Desvio orçamentário</span>
            )}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-400 uppercase font-bold">% Atingimento da Meta</span>
            <Percent className="w-5 h-5 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-sky-400 font-mono">
            {atingimentoPct.toFixed(1)}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            vs Mês Anterior: <strong className={difAnterior <= 0 ? 'text-emerald-400' : 'text-rose-400'}>{difAnterior <= 0 ? '-' : '+'}{formatCurrency(Math.abs(difAnterior))}</strong>
          </div>
        </div>
      </div>

      {/* 4 MONTHS COMPARATIVE FINANCIAL EVOLUTION */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
          Evolução Comparativa do Pacote Prejuízo (Últimos 4 Meses)
        </h3>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={computedMonthKPIs} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
              <XAxis dataKey="mes" tickFormatter={formatMesAno} stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;
                  const data = payload[0]?.payload;
                  if (!data) return null;
                  const real = data.sclAtual ?? 0;
                  const meta = data.sclMeta ?? 0;
                  const gap = real - meta;
                  const isDentro = gap <= 0;
                  return (
                    <div className="bg-slate-950/95 backdrop-blur-md border border-slate-700/90 rounded-xl p-3.5 shadow-2xl min-w-[240px] text-xs font-sans ring-1 ring-white/10">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                        <span className="font-bold text-white text-sm">{formatMesAno(String(label ?? ''))}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${isDentro ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border-rose-500/40'}`}>
                          {isDentro ? 'Dentro da Meta' : 'Acima da Meta'}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center bg-slate-900/90 px-2.5 py-1.5 rounded-lg">
                          <span className="text-slate-300">Realizado:</span>
                          <span className={`font-mono font-bold ${isDentro ? 'text-emerald-400' : 'text-rose-400'}`}>{formatCurrency(real)}</span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-900/90 px-2.5 py-1.5 rounded-lg">
                          <span className="text-slate-300">Meta Orçada:</span>
                          <span className="font-mono font-bold text-amber-400">{formatCurrency(meta)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-1.5 border-t border-slate-800 text-[11px]">
                          <span className="text-slate-400">{isDentro ? 'Economia:' : 'Desvio:'}</span>
                          <span className={`font-mono font-bold ${isDentro ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {gap <= 0 ? '-' : '+'}{formatCurrency(Math.abs(gap))}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="sclAtual" name="Prejuízo SCL Realizado (R$)" fill="#10b981" radius={[6, 6, 0, 0]} barSize={40} />
              <Bar dataKey="sclMeta" name="Meta Orçada SCL (R$)" fill="#334155" radius={[6, 6, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TOP FINANCIAL DRIVERS & ACTION IMPACT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Financial Drivers */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Principais Causas Financeiras (Top Offenders)</span>
          </h3>

          <div className="space-y-2.5">
            {topDrivers.map((d, i) => {
              const pct = totalLoss > 0 ? (d.val / totalLoss) * 100 : 0;
              return (
                <div key={d.motivo} className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-bold text-slate-200">
                      #{i + 1} {d.motivo}
                    </span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {formatCurrency(d.val)} ({pct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-1.5 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Impact of Completed Actions */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Impacto das Ações Concluídas no Mês</span>
          </h3>

          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {acoesConcluidas.length === 0 ? (
              <div className="text-slate-500 text-xs text-center py-6">
                Nenhuma ação concluída neste período.
              </div>
            ) : (
              acoesConcluidas.map((a) => (
                <div
                  key={a.id}
                  className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1"
                >
                  <div className="font-bold text-slate-200">{a.problema}</div>
                  <div className="text-[11px] text-emerald-400">
                    <strong>Ação:</strong> {a.acao}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    <strong>Resultado:</strong> {a.resultadoAlcancado || a.resultadoEsperado}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* COMENTÁRIOS DA ADMINISTRAÇÃO */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-amber-400" />
              <span>Comentários & Parecer da Administração</span>
            </h3>
            <p className="text-xs text-slate-400">
              Atas de análise dos gestores operacionais e financeiros sobre o resultado do período
            </p>
          </div>
        </div>

        {/* Form to Add Comment */}
        <form
          onSubmit={handleAddComment}
          className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Autor do Parecer</label>
              <input
                type="text"
                required
                value={autor}
                onChange={(e) => setAutor(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Cargo / Função</label>
              <input
                type="text"
                required
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Tipo de Parecer</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white focus:border-amber-500 focus:outline-none font-semibold"
              >
                <option value="Análise de Desvio">Análise de Desvio</option>
                <option value="Diagnóstico Operacional">Diagnóstico Operacional</option>
                <option value="Direcionamento Estratégico">Direcionamento Estratégico</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">
              Análise Qualitativa e Comentários Financeiros
            </label>
            <textarea
              required
              rows={3}
              placeholder="Digite a análise do resultado mensal, diagnósticos de avaria e ações recomendadas..."
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-5 py-2 rounded-xl text-xs flex items-center gap-2 transition-all shadow-md shadow-amber-500/20"
            >
              <Send className="w-4 h-4" />
              <span>Registrar Parecer da Administração</span>
            </button>
          </div>
        </form>

        {/* Comments Feed */}
        <div className="space-y-3">
          {comentarios.map((c) => (
            <div
              key={c.id}
              className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 text-xs space-y-2 relative group"
            >
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-xs">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-extrabold text-white">{c.autor}</span>
                    <span className="text-[10px] text-slate-400 block">{c.cargo}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="bg-slate-800 text-amber-400 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-slate-700">
                    {c.tipo}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">{c.data}</span>
                  <button
                    onClick={() => deleteComentario(c.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                    title="Excluir Parecer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-slate-300 leading-relaxed pt-1 whitespace-pre-line">{c.texto}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
