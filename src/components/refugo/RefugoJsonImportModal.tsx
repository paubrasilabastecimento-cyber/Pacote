import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';
import { RefugoItem } from '../../types/refugo';
import { parseRefugoTextOrCSV, formatBRL } from '../../utils/refugoUtils';

interface RefugoJsonImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (items: RefugoItem[], replace: boolean) => void;
}

export const RefugoJsonImportModal: React.FC<RefugoJsonImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [inputText, setInputText] = useState('');
  const [replaceExisting, setReplaceExisting] = useState(true);
  const [previewItems, setPreviewItems] = useState<RefugoItem[]>([]);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleProcessText = () => {
    setError('');
    try {
      // 1. Tenta como JSON
      if (inputText.trim().startsWith('[') || inputText.trim().startsWith('{')) {
        const parsed = JSON.parse(inputText);
        const array = Array.isArray(parsed) ? parsed : [parsed];
        const converted = array.map((item, idx) => ({
          id: item.id || `ref-json-${Date.now()}-${idx}`,
          posicao: item.posicao || idx + 1,
          material: String(item.material || item.Material || item.descricao || item.nome || 'Material').toUpperCase(),
          valor: typeof item.valor === 'number' ? item.valor : parseFloat(String(item.valor || item.Valor || 0).replace(/R\$/gi, '').replace(/\./g, '').replace(',', '.')),
          categoria: item.categoria || 'Garrafas de Vidro',
          calibre: item.calibre || 'Padrão',
          tipoMaterial: item.tipoMaterial || item.material || 'Padrão',
          cor: item.cor || 'Padrão',
          retornavel: item.retornavel !== false,
          dataCriacao: item.dataCriacao || new Date().toISOString().slice(0, 10),
        }));
        setPreviewItems(converted);
        return;
      }

      // 2. Tenta como texto / tabela copiada do Excel / TSV / CSV
      const items = parseRefugoTextOrCSV(inputText);
      if (items.length === 0) {
        setError('Nenhum dado estruturado válido foi identificado. Cole linhas com o formato: Material e Valor.');
        return;
      }
      setPreviewItems(items);
    } catch (err: any) {
      setError(`Erro ao analisar conteúdo: ${err.message || 'Formato inválido'}`);
    }
  };

  const handleConfirmImport = () => {
    if (previewItems.length === 0) {
      setError('Processe os dados primeiro antes de confirmar a importação.');
      return;
    }
    onImport(previewItems, replaceExisting);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Importar Dados de Refugo</h2>
              <p className="text-[11px] text-slate-400">
                Cole dados copiados do Excel, CSV ou JSON para estratificação automática
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

        {/* Corpo */}
        <div className="p-4 space-y-4 text-xs overflow-y-auto grow">
          {error && (
            <div className="p-2.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span>Cole o texto da tabela ou JSON abaixo:</span>
              </label>
              <span className="text-[10px] text-slate-500">Ex: 1 GFA VIDRO 635ML... R$ 115.612,71</span>
            </div>
            <textarea
              rows={6}
              placeholder={`#\tMaterial\tValor\n1\tGFA VIDRO 635ML AMBAR TIPO A RETORN\tR$ 115.612,71\n2\tGFA VIDRO 1L AMBAR RETORNO GFA VIDRO\tR$ 59.077,54`}
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                setPreviewItems([]);
              }}
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 focus:outline-hidden focus:border-blue-500 font-mono text-xs resize-none"
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleProcessText}
              disabled={!inputText.trim()}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs transition-colors cursor-pointer shadow-md"
            >
              Analisar e Pré-visualizar
            </button>

            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={replaceExisting}
                onChange={(e) => setReplaceExisting(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-0 w-4 h-4 cursor-pointer"
              />
              <span>Substituir registros atuais</span>
            </label>
          </div>

          {/* Pré-visualização */}
          {previewItems.length > 0 && (
            <div className="space-y-2 border-t border-slate-800 pt-3">
              <div className="flex items-center justify-between text-slate-300 font-semibold">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  {previewItems.length} materiais identificados com sucesso
                </span>
                <span className="font-mono text-white">
                  Total: {formatBRL(previewItems.reduce((a, b) => a + b.valor, 0))}
                </span>
              </div>

              <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950/60 divide-y divide-slate-800/80">
                {previewItems.map((item, idx) => (
                  <div key={idx} className="p-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span className="w-5 text-slate-500 font-mono">{idx + 1}.</span>
                      <span className="font-semibold text-slate-200 truncate">{item.material}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {item.categoria}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-amber-400 shrink-0">
                      {formatBRL(item.valor)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-end gap-2 bg-slate-950/60 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmImport}
            disabled={previewItems.length === 0}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirmar e Importar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
