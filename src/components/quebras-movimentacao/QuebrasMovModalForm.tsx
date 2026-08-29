import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Building,
  User,
  Clock,
  Package,
  DollarSign,
  Tag,
  FileText,
  Activity,
} from 'lucide-react';
import { QuebraMovimentacaoItem } from '../../types/quebrasMovimentacao';
import { estimarHlUnitarioPorDescricao } from '../../utils/quebrasMovimentacaoUtils';

interface QuebrasMovModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<QuebraMovimentacaoItem, 'id'>, id?: string) => void;
  itemToEdit?: QuebraMovimentacaoItem | null;
}

export const QuebrasMovModalForm: React.FC<QuebrasMovModalFormProps> = ({
  isOpen,
  onClose,
  onSave,
  itemToEdit,
}) => {
  const [dataHora, setDataHora] = useState<string>('');
  const [mes, setMes] = useState<string>('JANEIRO');
  const [codigoProduto, setCodigoProduto] = useState<string>('21020');
  const [produto, setProduto] = useState<string>('BUDWEISER 350ML');
  const [quantidade, setQuantidade] = useState<number>(12);
  const [setor, setSetor] = useState<string>('ARMAZEM');
  const [turno, setTurno] = useState<string>('Noite');
  const [filial, setFilial] = useState<string>('524');
  const [motivo, setMotivo] = useState<string>('FALTA NO PALETE');
  const [colaborador, setColaborador] = useState<string>('RONILDO');
  const [funcao, setFuncao] = useState<string>('EMPILHADOR');
  const [valorAvaria, setValorAvaria] = useState<number>(2.648683);
  const [hectoLitro, setHectoLitro] = useState<number>(0.0035);
  const [hectoPerdido, setHectoPerdido] = useState<number>(0.042);
  const [percentual1, setPercentual1] = useState<number>(0.01);
  const [percentual2, setPercentual2] = useState<number>(0.01);
  const [observacao, setObservacao] = useState<string>('');

  useEffect(() => {
    if (itemToEdit) {
      setDataHora(itemToEdit.data_hora);
      setMes(itemToEdit.mes || 'JANEIRO');
      setCodigoProduto(String(itemToEdit.codigo_produto));
      setProduto(itemToEdit.produto);
      setQuantidade(itemToEdit.quantidade);
      setSetor(itemToEdit.area || itemToEdit.setor || 'ARMAZEM');
      setTurno(itemToEdit.turno);
      setFilial(String(itemToEdit.cod_quebra ?? itemToEdit.filial ?? '524'));
      setMotivo(itemToEdit.motivo || 'FALTA NO PALETE');
      setColaborador(itemToEdit.colaborador || itemToEdit.funcionario || 'RONILDO');
      setFuncao(itemToEdit.funcao || itemToEdit.cargo || 'EMPILHADOR');
      setValorAvaria(itemToEdit.valor_avaria ?? itemToEdit.valor ?? 0);
      setHectoLitro(itemToEdit.hecto_litro ?? 0.0035);
      setHectoPerdido(itemToEdit.hecto_perdido ?? 0.042);
      setPercentual1(itemToEdit.percentual_1 ?? 0.01);
      setPercentual2(itemToEdit.percentual_2 ?? 0.01);
      setObservacao(itemToEdit.observacao || '');
    } else {
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const formattedDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

      const meses = [
        'JANEIRO',
        'FEVEREIRO',
        'MARÇO',
        'ABRIL',
        'MAIO',
        'JUNHO',
        'JULHO',
        'AGOSTO',
        'SETEMBRO',
        'OUTUBRO',
        'NOVEMBRO',
        'DEZEMBRO',
      ];
      setDataHora(formattedDate);
      setMes(meses[now.getMonth()]);
      setCodigoProduto('21020');
      setProduto('BUDWEISER 350ML');
      setQuantidade(12);
      setSetor('ARMAZEM');
      setTurno('Noite');
      setFilial('524');
      setMotivo('FALTA NO PALETE');
      setColaborador('RONILDO');
      setFuncao('EMPILHADOR');
      setValorAvaria(2.648683);
      setHectoLitro(0.0035);
      setHectoPerdido(0.042);
      setPercentual1(0.01);
      setPercentual2(0.01);
      setObservacao('');
    }
  }, [itemToEdit, isOpen]);

  // Recalculate HL Perdido when Qtd or HL Unitário changes
  const handleQtdChange = (val: number) => {
    setQuantidade(val);
    setHectoPerdido(Number((val * (hectoLitro || 0.0035)).toFixed(4)));
  };

  const handleDescricaoChange = (desc: string) => {
    setProduto(desc);
    const estimatedHl = estimarHlUnitarioPorDescricao(desc);
    setHectoLitro(estimatedHl);
    setHectoPerdido(Number((quantidade * estimatedHl).toFixed(4)));
  };

  const handleHlUnitChange = (hl: number) => {
    setHectoLitro(hl);
    setHectoPerdido(Number((quantidade * hl).toFixed(4)));
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!produto || !colaborador || quantidade <= 0 || valorAvaria < 0) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const codQuebraNum = isNaN(Number(filial)) ? filial : Number(filial);

    onSave(
      {
        data_hora: dataHora,
        data: dataHora.slice(0, 10),
        mes: mes.toUpperCase(),
        codigo_produto: isNaN(Number(codigoProduto)) ? codigoProduto : Number(codigoProduto),
        produto: produto.trim(),
        quantidade: Number(quantidade),
        setor: setor.toUpperCase(),
        area: setor.toUpperCase(),
        turno,
        filial: codQuebraNum,
        cod_quebra: codQuebraNum,
        codigo_quebra: codQuebraNum,
        motivo: motivo.trim().toUpperCase(),
        funcionario: colaborador.trim().toUpperCase(),
        colaborador: colaborador.trim().toUpperCase(),
        cargo: funcao.trim().toUpperCase(),
        funcao: funcao.trim().toUpperCase(),
        valor: Number(valorAvaria),
        valor_avaria: Number(valorAvaria),
        hecto_litro: Number(hectoLitro),
        hecto_perdido: Number(hectoPerdido),
        percentual_1: Number(percentual1),
        percentual_2: Number(percentual2),
        observacao: observacao.trim(),
      },
      itemToEdit?.id
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              {itemToEdit ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                {itemToEdit ? 'Editar Ocorrência de Quebra' : 'Registrar Quebra por Movimentação'}
              </h2>
              <p className="text-xs text-slate-400">
                Campos oficiais: Motivo, Colaborador, Função, Valor da Avaria e Hecto Perdido
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Data e Hora */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Data e Hora (AAAA-MM-DD HH:MM:SS) *
              </label>
              <input
                type="text"
                required
                value={dataHora}
                onChange={(e) => setDataHora(e.target.value)}
                placeholder="2026-01-01 11:59:15"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Mês */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Mês de Referência *</label>
              <select
                value={mes}
                onChange={(e) => setMes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                {[
                  'JANEIRO',
                  'FEVEREIRO',
                  'MARÇO',
                  'ABRIL',
                  'MAIO',
                  'JUNHO',
                  'JULHO',
                  'AGOSTO',
                  'SETEMBRO',
                  'OUTUBRO',
                  'NOVEMBRO',
                  'DEZEMBRO',
                ].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Código Produto */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">CodProduto (SKU) *</label>
              <input
                type="text"
                required
                value={codigoProduto}
                onChange={(e) => setCodigoProduto(e.target.value)}
                placeholder="21020"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Descrição Produto */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Descricao do Produto *</label>
              <input
                type="text"
                required
                value={produto}
                onChange={(e) => handleDescricaoChange(e.target.value)}
                placeholder="BUDWEISER 350ML"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Quantidade */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Quantidade *</label>
              <input
                type="number"
                required
                min={1}
                step={1}
                value={quantidade}
                onChange={(e) => handleQtdChange(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-sky-400 font-bold focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Valor da Avaria */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">VALOR DA AVARIA (R$) *</label>
              <input
                type="number"
                required
                min={0}
                step={0.0001}
                value={valorAvaria}
                onChange={(e) => setValorAvaria(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-amber-400 font-bold focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Hecto Litro */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">HECTO LITRO (Unitário HL)</label>
              <input
                type="number"
                min={0}
                step={0.0001}
                value={hectoLitro}
                onChange={(e) => handleHlUnitChange(Number(e.target.value))}
                placeholder="0.0035"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Hecto Perdido */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">HECTO PERDIDO (Total HL)</label>
              <input
                type="number"
                min={0}
                step={0.0001}
                value={hectoPerdido}
                onChange={(e) => setHectoPerdido(Number(e.target.value))}
                placeholder="0.042"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-sky-300 font-bold focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Setor / Area */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Area / Setor *</label>
              <input
                type="text"
                required
                value={setor}
                onChange={(e) => setSetor(e.target.value)}
                placeholder="ARMAZEM"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 uppercase"
              />
            </div>

            {/* Turno */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Turno *</label>
              <select
                value={turno}
                onChange={(e) => setTurno(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="Manhã">Manhã</option>
                <option value="Tarde">Tarde</option>
                <option value="Noite">Noite</option>
                <option value="Madrugada">Madrugada</option>
                <option value="1º Turno">1º Turno</option>
                <option value="2º Turno">2º Turno</option>
                <option value="3º Turno">3º Turno</option>
                <option value="ADM">ADM</option>
              </select>
            </div>

            {/* CodQuebra / Filial */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">CodQuebra / Filial *</label>
              <input
                type="text"
                required
                value={filial}
                onChange={(e) => setFilial(e.target.value)}
                placeholder="524"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Motivo */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Motivo da Quebra *</label>
              <input
                type="text"
                required
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="FALTA NO PALETE"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 uppercase"
              />
            </div>

            {/* Colaborador */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Colaborador / Operador *</label>
              <input
                type="text"
                required
                value={colaborador}
                onChange={(e) => setColaborador(e.target.value)}
                placeholder="RONILDO"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white uppercase focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Funcao */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Funcao / Cargo *</label>
              <input
                type="text"
                required
                value={funcao}
                onChange={(e) => setFuncao(e.target.value)}
                placeholder="EMPILHADOR"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white uppercase focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Observação */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Observações Operacionais</label>
            <textarea
              rows={2}
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Ex: Falta identificada na conferência de recebimento/armazenamento..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>

          {/* Footer inside form */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{itemToEdit ? 'Atualizar Ocorrência' : 'Salvar Registro'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
