import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PlanoAcao, StatusPlanoAcao, Area, MotivoPerda } from '../types';
import { AREAS, MOTIVOS_PERDA } from '../data/mockData';
import { formatDateBR, formatMesAno } from '../utils/formatters';
import {
  CheckSquare,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  Edit,
  Trash2,
  Filter,
  X,
  Save,
  Search,
} from 'lucide-react';

export const PlanoAcaoView: React.FC = () => {
  const { filteredAcoes, addAcao, updateAcao, deleteAcao } = useApp();

  const [searchFilter, setSearchFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingAcao, setEditingAcao] = useState<PlanoAcao | null>(null);

  // Form State
  const today = new Date().toISOString().slice(0, 10);
  const [problema, setProblema] = useState<string>('');
  const [causa, setCausa] = useState<string>('');
  const [acao, setAcao] = useState<string>('');
  const [responsavel, setResponsavel] = useState<string>('');
  const [dataCriacao, setDataCriacao] = useState<string>(today);
  const [prazo, setPrazo] = useState<string>(today);
  const [status, setStatus] = useState<StatusPlanoAcao>('Em andamento');
  const [resultadoEsperado, setResultadoEsperado] = useState<string>('');
  const [resultadoAlcancado, setResultadoAlcancado] = useState<string>('');
  const [evidencia, setEvidencia] = useState<string>('');
  const [observacao, setObservacao] = useState<string>('');
  const [area, setArea] = useState<Area>('Armazém');
  const [motivoRelacionado, setMotivoRelacionado] = useState<MotivoPerda>('Quebras');

  // Stats Counters
  const totalAcoes = filteredAcoes.length;
  const concluidas = filteredAcoes.filter((a) => a.status === 'Concluído').length;
  const emAndamento = filteredAcoes.filter((a) => a.status === 'Em andamento').length;
  const atrasadas = filteredAcoes.filter((a) => a.status === 'Atrasado').length;
  const naoIniciadas = filteredAcoes.filter((a) => a.status === 'Não iniciado').length;
  const percentConcluido = totalAcoes > 0 ? Math.round((concluidas / totalAcoes) * 100) : 0;

  // Filter List
  const displayedAcoes = filteredAcoes.filter((a) => {
    if (statusFilter && a.status !== statusFilter) return false;
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      const matchText = `${a.problema} ${a.causa} ${a.acao} ${a.responsavel}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }
    return true;
  });

  const handleOpenNewModal = () => {
    setEditingAcao(null);
    setProblema('');
    setCausa('');
    setAcao('');
    setResponsavel('');
    setDataCriacao(today);
    setPrazo(today);
    setStatus('Em andamento');
    setResultadoEsperado('');
    setResultadoAlcancado('');
    setEvidencia('');
    setObservacao('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: PlanoAcao) => {
    setEditingAcao(p);
    setProblema(p.problema);
    setCausa(p.causa);
    setAcao(p.acao);
    setResponsavel(p.responsavel);
    setDataCriacao(p.dataCriacao);
    setPrazo(p.prazo);
    setStatus(p.status);
    setResultadoEsperado(p.resultadoEsperado);
    setResultadoAlcancado(p.resultadoAlcancado || '');
    setEvidencia(p.evidencia || '');
    setObservacao(p.observacao || '');
    if (p.area) setArea(p.area);
    if (p.motivoRelacionado) setMotivoRelacionado(p.motivoRelacionado);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const mesRef = dataCriacao.slice(0, 7);

    if (editingAcao) {
      await updateAcao(editingAcao.id, {
        problema,
        causa,
        acao,
        responsavel,
        dataCriacao,
        prazo,
        status,
        resultadoEsperado,
        resultadoAlcancado,
        evidencia,
        observacao,
        mesRef,
        area,
        motivoRelacionado,
      });
    } else {
      await addAcao({
        problema,
        causa,
        acao,
        responsavel,
        dataCriacao,
        prazo,
        status,
        resultadoEsperado,
        resultadoAlcancado,
        evidencia,
        observacao,
        mesRef,
        area,
        motivoRelacionado,
      });
    }
    setIsModalOpen(false);
  };

  const handleQuickStatusChange = async (id: string, newStatus: StatusPlanoAcao) => {
    await updateAcao(id, { status: newStatus });
  };

  const getStatusBadge = (st: StatusPlanoAcao) => {
    switch (st) {
      case 'Concluído':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'Em andamento':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'Atrasado':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'Não iniciado':
        return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full">
            Metodologia 5W2H / DPO AMBEV
          </span>
          <h2 className="text-xl font-black text-white mt-1">
            Plano de Ação de Eliminação de Perdas
          </h2>
          <p className="text-xs text-slate-400">
            Controle dos últimos 4 meses de ações corretivas e preventivas do Pacote Prejuízo.
          </p>
        </div>

        <button
          onClick={handleOpenNewModal}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all shadow-md shadow-amber-500/20"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Criar Novo Plano de Ação</span>
        </button>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              Total de Ações
            </span>
            <div className="text-2xl font-black text-white font-mono mt-1">{totalAcoes}</div>
          </div>
          <CheckSquare className="w-8 h-8 text-slate-500" />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-emerald-400 uppercase font-bold block">
              Ações Concluídas
            </span>
            <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
              {concluidas}
            </div>
          </div>
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-amber-400 uppercase font-bold block">
              Em Andamento
            </span>
            <div className="text-2xl font-black text-amber-400 font-mono mt-1">
              {emAndamento}
            </div>
          </div>
          <PlayCircle className="w-8 h-8 text-amber-500" />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-rose-400 uppercase font-bold block">
              Ações Atrasadas
            </span>
            <div className="text-2xl font-black text-rose-400 font-mono mt-1">
              {atrasadas}
            </div>
          </div>
          <AlertCircle className="w-8 h-8 text-rose-500" />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              % de Conclusão
            </span>
            <div className="text-2xl font-black text-sky-400 font-mono mt-1">
              {percentConcluido}%
            </div>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-sky-400 flex items-center justify-center font-mono font-bold text-[10px] text-sky-400">
            {percentConcluido}%
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por problema, causa ou responsável..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white focus:border-amber-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-slate-400 font-semibold whitespace-nowrap">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
          >
            <option value="">Todos os Status</option>
            <option value="Não iniciado">Não iniciado</option>
            <option value="Em andamento">Em andamento</option>
            <option value="Concluído">Concluído</option>
            <option value="Atrasado">Atrasado</option>
          </select>
        </div>
      </div>

      {/* ACTION PLANS TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-4">
        {displayedAcoes.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            Nenhum plano de ação encontrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider font-bold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3">Problema & Causa Raiz</th>
                  <th className="py-3 px-3">Ação Proposta</th>
                  <th className="py-3 px-3">Responsável</th>
                  <th className="py-3 px-3">Criação / Prazo</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                {displayedAcoes.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 max-w-xs">
                      <div className="font-bold text-white text-xs leading-tight">
                        {a.problema}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                        <strong className="text-amber-400 font-mono">Causa:</strong> {a.causa}
                      </div>
                      {a.motivoRelacionado && (
                        <span className="inline-block bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded text-[9px] mt-1">
                          Motivo: {a.motivoRelacionado}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 max-w-xs">
                      <div className="text-slate-200 leading-snug line-clamp-2">{a.acao}</div>
                      {a.resultadoEsperado && (
                        <div className="text-[10px] text-emerald-400 mt-1">
                          Goal: {a.resultadoEsperado}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap text-amber-400 font-semibold">
                      {a.responsavel}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px]">
                      <div className="text-slate-400">Criado: {formatDateBR(a.dataCriacao)}</div>
                      <div className="text-slate-200 font-bold">Prazo: {formatDateBR(a.prazo)}</div>
                    </td>

                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${getStatusBadge(
                          a.status
                        )}`}
                      >
                        {a.status}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEditModal(a)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                          title="Editar Plano"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Deseja excluir este plano de ação?')) deleteAcao(a.id);
                          }}
                          className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingAcao ? 'Editar Plano de Ação' : 'Novo Plano de Ação (5W2H)'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-400 font-semibold mb-1">
                    Problema Identificado <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Recorrência de quebras no tombamento de paletes de lata"
                    value={problema}
                    onChange={(e) => setProblema(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-400 font-semibold mb-1">
                    Causa Raiz (5 Porquês) <span className="text-amber-400">*</span>
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Ex: Sub-estiramento do filme stretch por falha mecânica da catraca..."
                    value={causa}
                    onChange={(e) => setCausa(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-400 font-semibold mb-1">
                    Ação Preventiva/Corretiva <span className="text-amber-400">*</span>
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Ex: Instalar pré-estirador motorizado e calibração semanal..."
                    value={acao}
                    onChange={(e) => setAcao(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Responsável <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nome e Cargo"
                    value={responsavel}
                    onChange={(e) => setResponsavel(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Status Atual <span className="text-amber-400">*</span>
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as StatusPlanoAcao)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:border-amber-500 focus:outline-none font-bold"
                  >
                    <option value="Não iniciado">Não iniciado</option>
                    <option value="Em andamento">Em andamento</option>
                    <option value="Concluído">Concluído</option>
                    <option value="Atrasado">Atrasado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Data Criação</label>
                  <input
                    type="date"
                    value={dataCriacao}
                    onChange={(e) => setDataCriacao(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Prazo de Conclusão</label>
                  <input
                    type="date"
                    value={prazo}
                    onChange={(e) => setPrazo(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Resultado Esperado</label>
                  <input
                    type="text"
                    placeholder="Ex: Reduzir quebras em 85%"
                    value={resultadoEsperado}
                    onChange={(e) => setResultadoEsperado(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Resultado Alcançado</label>
                  <input
                    type="text"
                    placeholder="Ex: Queda de 40% obtida no mês"
                    value={resultadoAlcancado}
                    onChange={(e) => setResultadoAlcancado(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-black hover:bg-amber-400 shadow-md shadow-amber-500/20"
                >
                  Salvar Plano
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
