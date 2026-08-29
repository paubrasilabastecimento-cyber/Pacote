import React, { useState, useEffect } from 'react';
import { X, Save, Plus, AlertCircle } from 'lucide-react';
import { RefugoItem, CategoriaRefugo } from '../../types/refugo';

interface RefugoModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Partial<RefugoItem>) => void;
  itemToEdit: RefugoItem | null;
}

export const RefugoModalForm: React.FC<RefugoModalFormProps> = ({
  isOpen,
  onClose,
  onSave,
  itemToEdit,
}) => {
  const [material, setMaterial] = useState('');
  const [valorStr, setValorStr] = useState('');
  const [categoria, setCategoria] = useState<CategoriaRefugo>('Garrafas de Vidro');
  const [calibre, setCalibre] = useState('');
  const [tipoMaterial, setTipoMaterial] = useState('');
  const [cor, setCor] = useState('');
  const [unidadesEstimadasStr, setUnidadesEstimadasStr] = useState('');
  const [observacao, setObservacao] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (itemToEdit) {
      setMaterial(itemToEdit.material);
      setValorStr(itemToEdit.valor.toString());
      setCategoria(itemToEdit.categoria);
      setCalibre(itemToEdit.calibre);
      setTipoMaterial(itemToEdit.tipoMaterial);
      setCor(itemToEdit.cor);
      setUnidadesEstimadasStr(itemToEdit.unidadesEstimadas ? itemToEdit.unidadesEstimadas.toString() : '');
      setObservacao(itemToEdit.observacao || '');
    } else {
      setMaterial('');
      setValorStr('');
      setCategoria('Garrafas de Vidro');
      setCalibre('');
      setTipoMaterial('');
      setCor('');
      setUnidadesEstimadasStr('');
      setObservacao('');
    }
    setError('');
  }, [itemToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!material.trim()) {
      setError('Por favor, informe a descrição do material.');
      return;
    }

    const valor = parseFloat(valorStr.replace(',', '.'));
    if (isNaN(valor) || valor <= 0) {
      setError('Por favor, informe um valor financeiro válido maior que zero.');
      return;
    }

    const unidades = unidadesEstimadasStr ? parseInt(unidadesEstimadasStr, 10) : undefined;

    onSave({
      id: itemToEdit ? itemToEdit.id : undefined,
      material: material.trim().toUpperCase(),
      valor,
      categoria,
      calibre: calibre.trim() || 'Padrão',
      tipoMaterial: tipoMaterial.trim() || material.trim(),
      cor: cor.trim() || 'Padrão',
      unidadesEstimadas: isNaN(unidades || NaN) ? undefined : unidades,
      observacao: observacao.trim(),
      retornavel: true,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              {itemToEdit ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                {itemToEdit ? 'Editar Material de Refugo' : 'Novo Lançamento de Refugo'}
              </h2>
              <p className="text-[11px] text-slate-400">
                Cadastro e estratificação de ativos e materiais de descarte
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-xs">
          {error && (
            <div className="p-2.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Material */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Descrição do Material <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="Ex: GFA VIDRO 635ML AMBAR TIPO A RETORN"
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
            />
          </div>

          {/* Grid: Valor R$ e Categoria */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Valor Total (R$) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="Ex: 115612.71"
                value={valorStr}
                onChange={(e) => setValorStr(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Família / Categoria <span className="text-red-400">*</span>
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as CategoriaRefugo)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-hidden focus:border-amber-500"
              >
                <option value="Garrafas de Vidro">Garrafas de Vidro</option>
                <option value="Garrafeiras Plásticas">Garrafeiras Plásticas</option>
                <option value="Paletes de Madeira">Paletes de Madeira</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
          </div>

          {/* Grid: Calibre e Cor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Calibre / Formato
              </label>
              <input
                type="text"
                placeholder="Ex: 635ml, 24x600ml, 1,00x1,20m"
                value={calibre}
                onChange={(e) => setCalibre(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Cor / Padrão
              </label>
              <input
                type="text"
                placeholder="Ex: Âmbar, Preto, Azul, Natural"
                value={cor}
                onChange={(e) => setCor(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
              />
            </div>
          </div>

          {/* Unidades Estimadas e Tipo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Tipo / Especificação
              </label>
              <input
                type="text"
                placeholder="Ex: Vidro Âmbar Tipo A"
                value={tipoMaterial}
                onChange={(e) => setTipoMaterial(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Unidades Estimadas (Opcional)
              </label>
              <input
                type="number"
                placeholder="Ex: 154150"
                value={unidadesEstimadasStr}
                onChange={(e) => setUnidadesEstimadasStr(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500 font-mono"
              />
            </div>
          </div>

          {/* Observação */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Observações Operacionais
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Identificado descarte na triagem de vasilhame..."
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500 resize-none"
            />
          </div>

          {/* Footer Botões */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
            >
              <Save className="w-4 h-4" />
              <span>{itemToEdit ? 'Atualizar' : 'Salvar Material'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
