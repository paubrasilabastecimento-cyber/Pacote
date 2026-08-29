import React, { useState } from 'react';
import {
  X,
  FileCode,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Sparkles,
  Info,
} from 'lucide-react';
import { QuebraMovimentacaoItem } from '../../types/quebrasMovimentacao';
import { sanitizarEParsearQuebrasMovJSON, formatBRL, formatHL, formatDataHoraAbreviada } from '../../utils/quebrasMovimentacaoUtils';

interface QuebrasMovJsonImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (items: QuebraMovimentacaoItem[], replaceExisting: boolean) => void;
  totalAtuais?: number;
}

const TEMPLATE_EXEMPLO = `[
  {
    "Data": "2026-01-01 11:59:15",
    "Mês": "JANEIRO",
    "CodProduto": 21020,
    "Descricao": "BUDWEISER 350ML",
    "Quantidade": 12,
    "Area": "ARMAZEM",
    "Turno": "Noite",
    "CodQuebra": 524,
    "Motivo": "FALTA NO PALETE",
    "Colaborador": "RONILDO",
    "Funcao": "EMPILHADOR",
    "VALOR DA AVARIA": 2.648683333333333,
    "HECTO LITRO": 0.0035,
    "HECTO PERDIDO": 0.042
  }
]`;

export const QuebrasMovJsonImportModal: React.FC<QuebrasMovJsonImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  totalAtuais = 0,
}) => {
  const [jsonText, setJsonText] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewItems, setPreviewItems] = useState<QuebraMovimentacaoItem[]>([]);
  const [copied, setCopied] = useState<boolean>(false);
  const [replaceExisting, setReplaceExisting] = useState<boolean>(true);

  if (!isOpen) return null;

  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setJsonText(text);
    setErrorMsg(null);

    if (!text.trim()) {
      setPreviewItems([]);
      return;
    }

    try {
      const validated = sanitizarEParsearQuebrasMovJSON(text);
      if (validated.length === 0) {
        setErrorMsg('O JSON fornecido não contém registros.');
        setPreviewItems([]);
        return;
      }
      setPreviewItems(validated);
    } catch (err: any) {
      setErrorMsg(`Erro de sintaxe no JSON: ${err.message}`);
      setPreviewItems([]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        setJsonText(content);
        try {
          const validated = sanitizarEParsearQuebrasMovJSON(content);
          setPreviewItems(validated);
          setErrorMsg(null);
        } catch (err: any) {
          setErrorMsg(`Erro ao ler arquivo JSON: ${err.message}`);
          setPreviewItems([]);
        }
      }
    };
    reader.readAsText(file);
  };

  const handleApplyTemplate = () => {
    setJsonText(TEMPLATE_EXEMPLO);
    try {
      const validated = sanitizarEParsearQuebrasMovJSON(TEMPLATE_EXEMPLO);
      setPreviewItems(validated);
      setErrorMsg(null);
    } catch {
      // ignore
    }
  };

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(TEMPLATE_EXEMPLO);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirm = () => {
    if (previewItems.length === 0) return;
    onImport(previewItems, replaceExisting);
    onClose();
  };

  const totalPreviewValor = previewItems.reduce((acc, i) => acc + (i.valor ?? i.valor_avaria ?? 0), 0);
  const totalPreviewHl = previewItems.reduce((acc, i) => acc + (i.hecto_perdido ?? 0), 0);
  const totalPreviewQtd = previewItems.reduce((acc, i) => acc + (i.quantidade ?? 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Importador JSON - Quebras de Movimentação
              </h2>
              <p className="text-xs text-slate-400">
                Suporta: Data, Mês, CodProduto, Descricao, Quantidade, Area, Turno, CodQuebra, Motivo, Colaborador, Funcao, VALOR DA AVARIA, HECTO LITRO e HECTO PERDIDO
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

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer border border-slate-700 transition-colors">
                <Upload className="w-3.5 h-3.5 text-amber-400" />
                <span>Carregar Arquivo .json</span>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
              <button
                type="button"
                onClick={handleApplyTemplate}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Preencher Exemplo Oficial</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleCopyTemplate}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
              title="Copiar estrutura JSON modelo"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copied ? 'Copiado!' : 'Copiar Modelo'}</span>
            </button>
          </div>

          {/* Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Cole o conteúdo JSON aqui:
              </label>
              {previewItems.length > 0 && (
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {previewItems.length} {previewItems.length === 1 ? 'registro válido' : 'registros válidos'}
                </span>
              )}
            </div>
            <textarea
              value={jsonText}
              onChange={handleJsonChange}
              placeholder={`Exemplo:\n${TEMPLATE_EXEMPLO}`}
              className="w-full h-44 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 resize-none"
            />
          </div>

          {/* Error display */}
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Import Mode: Replace vs Append */}
          {previewItems.length > 0 && (
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                Modo de Gravação dos Dados:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label
                  onClick={() => setReplaceExisting(true)}
                  className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                    replaceExisting
                      ? 'bg-amber-500/10 border-amber-500 text-amber-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="importMode"
                    checked={replaceExisting}
                    onChange={() => setReplaceExisting(true)}
                    className="text-amber-500 focus:ring-amber-500"
                  />
                  <div>
                    <div>Substituir base atual</div>
                    <div className="text-[10px] text-slate-400 font-normal">
                      Substitui todos os {totalAtuais} registros atuais pelos {previewItems.length} novos
                    </div>
                  </div>
                </label>

                <label
                  onClick={() => setReplaceExisting(false)}
                  className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                    !replaceExisting
                      ? 'bg-amber-500/10 border-amber-500 text-amber-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="importMode"
                    checked={!replaceExisting}
                    onChange={() => setReplaceExisting(false)}
                    className="text-amber-500 focus:ring-amber-500"
                  />
                  <div>
                    <div>Incrementar (Adicionar)</div>
                    <div className="text-[10px] text-slate-400 font-normal">
                      Adiciona {previewItems.length} novos itens aos {totalAtuais} já cadastrados
                    </div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Preview list */}
          {previewItems.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Info className="w-3.5 h-3.5 text-amber-400" />
                  Prévia dos Dados Processados ({previewItems.length})
                </h3>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="text-amber-400 font-bold">{formatBRL(totalPreviewValor)}</span>
                  <span className="text-sky-400 font-bold">{formatHL(totalPreviewHl)}</span>
                  <span className="text-slate-400">{totalPreviewQtd} un</span>
                </div>
              </div>

              <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/60 divide-y divide-slate-800/60">
                {previewItems.slice(0, 6).map((item, i) => (
                  <div key={i} className="p-2.5 text-xs flex items-center justify-between gap-3 hover:bg-slate-900/60">
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-white truncate flex items-center gap-2">
                        <span>{item.produto}</span>
                        <span className="text-slate-500 font-mono text-[11px]">SKU: {item.codigo_produto}</span>
                        <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px]">
                          {item.motivo}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span>📅 {formatDataHoraAbreviada(item.data_hora)}</span>
                        <span>• 📍 {item.area || item.setor}</span>
                        <span>• 🕒 {item.turno}</span>
                        <span>• 👤 {item.colaborador || item.funcionario} ({item.funcao || item.cargo})</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono font-bold text-amber-400">
                        {formatBRL(item.valor ?? item.valor_avaria ?? 0)}
                      </div>
                      <div className="text-[11px] text-sky-400 font-mono">
                        {formatHL(item.hecto_perdido ?? 0)} • {item.quantidade} un
                      </div>
                    </div>
                  </div>
                ))}
                {previewItems.length > 6 && (
                  <div className="p-2 text-center text-xs text-slate-500 italic">
                    + {previewItems.length - 6} outros itens validados e prontos para gravação
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={previewItems.length === 0}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirmar e Importar {previewItems.length > 0 ? `(${previewItems.length})` : ''}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
