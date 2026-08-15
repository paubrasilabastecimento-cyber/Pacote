import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Turno, Area, MotivoPerda } from '../types';
import {
  MOTIVOS_PERDA,
  PRODUTOS_AMBEV,
  AREAS,
  TURNOS,
} from '../data/mockData';
import {
  formatCurrency,
} from '../utils/formatters';
import {
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  Calculator,
  Save,
  Package,
  DollarSign,
  UserCheck,
  FileText,
} from 'lucide-react';

export const RegistroPerdaView: React.FC = () => {
  const { addPerda, setActiveTab } = useApp();

  // Form State
  const today = new Date().toISOString().slice(0, 10);
  const [data, setData] = useState<string>(today);
  const [turno, setTurno] = useState<Turno>('1º Turno');
  const [area, setArea] = useState<Area>('Armazém');
  const [skuId, setSkuId] = useState<string>(PRODUTOS_AMBEV[0].id);
  const [produtoCustom, setProdutoCustom] = useState<string>(PRODUTOS_AMBEV[0].nome);
  const [quantidade, setQuantidade] = useState<number>(100);
  
  const [hlPerdido, setHlPerdido] = useState<number>(8.4);
  const [valorR$, setValorR$] = useState<number>(4032.0);
  const [isAutoCalc, setIsAutoCalc] = useState<boolean>(true);

  const [motivoCodigo, setMotivoCodigo] = useState<string>('M01');
  const [motivoNome, setMotivoNome] = useState<MotivoPerda>('Quebras');
  const [causa, setCausa] = useState<string>('');
  const [responsavel, setResponsavel] = useState<string>('');
  const [observacao, setObservacao] = useState<string>('');

  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [lastSaved, setLastSaved] = useState<{ hl: number; val: number; prod: string } | null>(null);

  // Auto calculation logic when SKU or quantity changes
  useEffect(() => {
    if (!isAutoCalc) return;
    const selectedSku = PRODUTOS_AMBEV.find((p) => p.id === skuId);
    if (selectedSku && quantidade > 0) {
      const calcHL = Number((selectedSku.volumeHLPerUnit * quantidade).toFixed(2));
      const calcVal = Number((calcHL * selectedSku.custoPorHL).toFixed(2));
      setHlPerdido(calcHL);
      setValorR$(calcVal);
      setProdutoCustom(selectedSku.nome);
    }
  }, [skuId, quantidade, isAutoCalc]);

  const handleSelectMotivo = (codigo: string, nome: MotivoPerda) => {
    setMotivoCodigo(codigo);
    setMotivoNome(nome);
  };

  const handleSelectSKU = (id: string) => {
    setSkuId(id);
    const found = PRODUTOS_AMBEV.find((p) => p.id === id);
    if (found) {
      setProdutoCustom(found.nome);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!causa.trim() || !responsavel.trim()) {
      alert('Por favor, preencha a Causa da Perda e o Responsável.');
      return;
    }

    const mesRef = data.slice(0, 7); // YYYY-MM

    await addPerda({
      data,
      mesRef,
      turno,
      area,
      produto: produtoCustom,
      quantidade: Number(quantidade),
      hlPerdido: Number(hlPerdido),
      valorR$: Number(valorR$),
      codigoMotivo: motivoCodigo,
      motivo: motivoNome,
      causa,
      responsavel,
      observacao,
    });

    setLastSaved({ hl: hlPerdido, val: valorR$, prod: produtoCustom });
    setShowSuccessModal(true);

    // Reset form for next entry
    setCausa('');
    setObservacao('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
        <div className="space-y-1">
          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full">
            AMBEV - PEO Armazém
          </span>
          <h2 className="text-xl font-black text-white">Lançamento de Ocorrência de Perda</h2>
          <p className="text-xs text-slate-400">
            Registre os detalhes da avaria. Os indicadores WQI, FGLI, SCL e R$/HL serão atualizados automaticamente.
          </p>
        </div>
        <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 hidden sm:block">
          <PlusCircle className="w-8 h-8 text-amber-400" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Informações Gerais */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" />
            <span>1. Dados da Ocorrência</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {/* Data */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                Data do Evento <span className="text-amber-400">*</span>
              </label>
              <input
                type="date"
                required
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:border-amber-500 focus:outline-none"
              />
            </div>

            {/* Turno */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                Turno <span className="text-amber-400">*</span>
              </label>
              <select
                value={turno}
                onChange={(e) => setTurno(e.target.value as Turno)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:border-amber-500 focus:outline-none"
              >
                {TURNOS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Área */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                Área de Origem <span className="text-amber-400">*</span>
              </label>
              <select
                value={area}
                onChange={(e) => setArea(e.target.value as Area)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:border-amber-500 focus:outline-none"
              >
                {AREAS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Seleção de Produto e Cálculo de Impacto */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-400" />
              <span>2. Produto, Quantidade e Cálculo Automático</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsAutoCalc(!isAutoCalc)}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${
                isAutoCalc
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>{isAutoCalc ? 'Cálculo Automático Ativo' : 'Cálculo Manual'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Produto SKU Select */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                Selecionar SKU Padrão AMBEV
              </label>
              <select
                value={skuId}
                onChange={(e) => handleSelectSKU(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:border-amber-500 focus:outline-none"
              >
                {PRODUTOS_AMBEV.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome} ({p.categoria})
                  </option>
                ))}
              </select>
            </div>

            {/* Quantidade (Caixas/Unidades) */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                Quantidade Avariada (Caixas / Unidades)
              </label>
              <input
                type="number"
                min={1}
                required
                value={quantidade}
                onChange={(e) => setQuantidade(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Calculated Impact Cards */}
          <div className="pt-2">
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Impacto Financeiro Calculado (R$)
                </span>
                <div className="text-2xl font-black text-emerald-400 font-mono">
                  {formatCurrency(valorR$)}
                </div>
              </div>
              {!isAutoCalc && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Ajuste Manual:</span>
                  <input
                    type="number"
                    step="0.01"
                    value={valorR$}
                    onChange={(e) => setValorR$(parseFloat(e.target.value) || 0)}
                    className="w-32 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-right font-mono text-emerald-400 font-bold"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Motivo da Perda (os 10 Motivos AMBEV) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>3. Código e Motivo da Perda (Selecione uma categoria)</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
            {MOTIVOS_PERDA.map((m) => {
              const isSelected = motivoCodigo === m.codigo;
              return (
                <button
                  type="button"
                  key={m.codigo}
                  onClick={() => handleSelectMotivo(m.codigo, m.nome)}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-md shadow-amber-500/20'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <div className="text-[10px] uppercase font-mono opacity-80">{m.codigo}</div>
                  <div className="text-xs font-extrabold leading-tight mt-1">{m.nome}</div>
                </button>
              );
            })}
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs text-slate-300">
            <span className="font-bold text-amber-400">Descrição do Código {motivoCodigo}: </span>
            <span>
              {MOTIVOS_PERDA.find((m) => m.codigo === motivoCodigo)?.descricao}
            </span>
          </div>
        </div>

        {/* Section 4: Causa Raiz, Responsável e Observação */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-4 text-xs">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-amber-400" />
            <span>4. Causa Raiz, Responsável e Observações</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                Causa Raiz da Perda <span className="text-amber-400">*</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="Ex: Queda de filme stretch durante manobra da empilhadeira na fila 12..."
                value={causa}
                onChange={(e) => setCausa(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                Responsável / Operador <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Carlos Eduardo (Op. Empilhadeira)"
                value={responsavel}
                onChange={(e) => setResponsavel(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white font-medium focus:border-amber-500 focus:outline-none mb-3"
              />

              <label className="block text-slate-400 font-semibold mb-1">
                Observações / Ações Imediatas Tomadas
              </label>
              <input
                type="text"
                placeholder="Ex: Tensão do stretch ajustada pelo operador no ato."
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-6 py-3 rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            <span>Confirmar e Registrar Perda</span>
          </button>
        </div>
      </form>

      {/* SUCCESS MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Ocorrência Registrada com Sucesso!</h3>
              <p className="text-xs text-slate-400 mt-1">
                Os indicadores de perda e o banco de dados foram atualizados.
              </p>
            </div>

            {lastSaved && (
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono space-y-1 text-slate-300">
                <div>Produto: <strong>{lastSaved.prod}</strong></div>
                <div>Impacto Financeiro: <strong className="text-emerald-400">{formatCurrency(lastSaved.val)}</strong></div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setShowSuccessModal(false)}
                className="flex-1 bg-amber-500 text-slate-950 font-bold py-2.5 rounded-xl text-xs hover:bg-amber-400 transition-colors"
              >
                Lançar Outra Ocorrência
              </button>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  setActiveTab('dashboard');
                }}
                className="flex-1 bg-slate-800 text-slate-200 font-bold py-2.5 rounded-xl text-xs hover:bg-slate-700 transition-colors"
              >
                Ir para Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
