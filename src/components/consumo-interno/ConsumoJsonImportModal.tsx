import React, { useState, useRef } from 'react';
import { ConsumoInternoJSONItem } from '../../types/consumoInterno';
import { classificarCategoriaProduto } from '../../utils/consumoClassifier';
import { formatCurrency } from '../../utils/formatters';
import {
  X,
  Upload,
  FileJson,
  CheckCircle2,
  AlertCircle,
  Download,
  Database,
  Layers,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface ConsumoJsonImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (items: ConsumoInternoJSONItem[], overwrite: boolean) => Promise<void>;
}

export const ConsumoJsonImportModal: React.FC<ConsumoJsonImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [fileContent, setFileContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [parsedItems, setParsedItems] = useState<ConsumoInternoJSONItem[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [overwrite, setOverwrite] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const parseAndValidateJson = (jsonString: string, name?: string) => {
    setParseError(null);
    setIsSuccess(false);

    try {
      const parsed = JSON.parse(jsonString);
      let list: any[] = [];

      if (Array.isArray(parsed)) {
        list = parsed;
      } else if (typeof parsed === 'object' && parsed !== null) {
        if (Array.isArray(parsed.items)) list = parsed.items;
        else if (Array.isArray(parsed.data)) list = parsed.data;
        else if (Array.isArray(parsed.consumo)) list = parsed.consumo;
        else if (Array.isArray(parsed.consumoInterno)) list = parsed.consumoInterno;
        else list = [parsed];
      }

      if (!list || list.length === 0) {
        throw new Error('O arquivo JSON está vazio ou não contém registros válidos.');
      }

      // Format to exact required schema
      const normalized: ConsumoInternoJSONItem[] = list.map((item, idx) => {
        const sku = Number(item.produto ?? item.produtoId ?? 0);
        const dt = item.dataOperacao || item.dtOperacao || new Date().toISOString().slice(0, 10);
        const em = item.emissao || dt;
        const totalVal = Number(item.valor ?? item.total ?? 0);
        const op = Number(item.operacao || 100 + idx);
        const desc = item.descricao || 'PRODUTO CONSUMO INTERNO';
        const un = item.unidade || 'cx';
        const emb = item.embalagem || 'LONG NECK';
        const st = item.status || 'A';
        const q = Number(item.qtde || 1);

        return {
          operacao: op,
          dataOperacao: dt,
          emissao: em,
          status: st,
          produto: sku,
          unidade: un,
          descricao: desc,
          qtde: q,
          valor: Number(totalVal.toFixed(2)),
          embalagem: emb,
        };
      });

      setParsedItems(normalized);
      setFileContent(jsonString);
      if (name) setFileName(name);
    } catch (err: any) {
      setParseError(err.message || 'Erro ao processar arquivo JSON. Verifique a formatação.');
      setParsedItems([]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (text) {
        parseAndValidateJson(text, file.name);
      }
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        if (text) {
          parseAndValidateJson(text, file.name);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleImportSubmit = async () => {
    if (parsedItems.length === 0) return;
    setIsSubmitting(true);
    setParseError(null);

    try {
      await onImport(parsedItems, overwrite);
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
        setParsedItems([]);
        setFileContent('');
        setFileName('');
      }, 1200);
    } catch (err: any) {
      setParseError(`Falha ao gravar registros: ${err.message || 'Erro de rede ou banco'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadSampleTemplate = () => {
    const sample: ConsumoInternoJSONItem[] = [
      {
        operacao: 102,
        dataOperacao: '2026-01-08',
        emissao: '2026-01-08',
        status: 'A',
        produto: 18836,
        unidade: 'cx',
        descricao: 'CORONA EXTRA N LONG N',
        qtde: 1,
        valor: 118.01,
        embalagem: 'LONG NECK',
      },
      {
        operacao: 103,
        dataOperacao: '2026-01-12',
        emissao: '2026-01-12',
        status: 'A',
        produto: 21020,
        unidade: 'cx',
        descricao: 'BUDWEISER 350ML LATA',
        qtde: 12,
        valor: 680.4,
        embalagem: 'LATA',
      },
    ];

    const blob = new Blob([JSON.stringify(sample, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modelo_consumo_interno.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalValor = parsedItems.reduce((acc, curr) => acc + (curr.valor || 0), 0);
  const totalQtde = parsedItems.reduce((acc, curr) => acc + (curr.qtde || 0), 0);

  return (
    <div
      id="modal-importar-json-consumo"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <FileJson className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Importar Arquivo JSON</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  Consumo Interno
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Alimente a aba de consumo interno importando o arquivo JSON estruturado.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-amber-400 bg-amber-500/10 scale-[1.01]'
                : parsedItems.length > 0
                ? 'border-emerald-500/40 bg-emerald-500/5'
                : 'border-slate-700 hover:border-slate-500 bg-slate-950/50 hover:bg-slate-950/80'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 shadow-inner">
                <Upload className="w-6 h-6" />
              </div>
              <div className="text-sm font-semibold text-white">
                {fileName ? (
                  <span className="text-emerald-400 flex items-center gap-1.5 justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                    Arquivo: {fileName}
                  </span>
                ) : (
                  'Clique para selecionar ou arraste o arquivo .json aqui'
                )}
              </div>
              <p className="text-xs text-slate-400 max-w-md">
                Formato aceito: array JSON com <code className="text-amber-300 font-mono">operacao</code>, <code className="text-amber-300 font-mono">dataOperacao</code>, <code className="text-amber-300 font-mono">produto</code>, <code className="text-amber-300 font-mono">descricao</code>, <code className="text-amber-300 font-mono">qtde</code>, <code className="text-amber-300 font-mono">valor</code>, <code className="text-amber-300 font-mono">embalagem</code>.
              </p>
            </div>
          </div>

          {/* Quick Sample Download & Paste Accordion */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Deseja um arquivo de modelo?</span>
            <button
              type="button"
              onClick={downloadSampleTemplate}
              className="inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-300 underline font-medium cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Baixar Modelo JSON (.json)
            </button>
          </div>

          {/* Parse Error Notification */}
          {parseError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div>
                <p className="font-semibold">Erro ao carregar o JSON:</p>
                <p className="mt-0.5 text-rose-200">{parseError}</p>
              </div>
            </div>
          )}

          {/* Success Notification */}
          {isSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="font-bold">Importação Concluída com Sucesso!</p>
                <p className="text-emerald-200">
                  {parsedItems.length} registros inseridos na base de Consumo Interno.
                </p>
              </div>
            </div>
          )}

          {/* Preview Section */}
          {parsedItems.length > 0 && (
            <div className="space-y-3">
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[11px] text-slate-400">Total de Registros</div>
                  <div className="text-lg font-black text-white font-mono">
                    {parsedItems.length}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[11px] text-slate-400">Volume Total</div>
                  <div className="text-lg font-black text-amber-400 font-mono">
                    {totalQtde} un/cx
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[11px] text-slate-400">Valor Total</div>
                  <div className="text-lg font-black text-emerald-400 font-mono">
                    {formatCurrency(totalValor)}
                  </div>
                </div>
              </div>

              {/* Table Preview */}
              <div className="border border-slate-800 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 sticky top-0 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-2">Op.</th>
                      <th className="p-2">Data</th>
                      <th className="p-2">SKU</th>
                      <th className="p-2">Descrição</th>
                      <th className="p-2">Embalagem</th>
                      <th className="p-2 text-right">Qtde</th>
                      <th className="p-2 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/60 font-mono text-[11px]">
                    {parsedItems.slice(0, 15).map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="p-2 text-amber-400">#{it.operacao}</td>
                        <td className="p-2 text-slate-400">{it.dataOperacao}</td>
                        <td className="p-2 text-slate-300">{it.produto}</td>
                        <td className="p-2 font-sans font-medium text-white truncate max-w-[180px]">
                          {it.descricao}
                        </td>
                        <td className="p-2 text-slate-400">{it.embalagem}</td>
                        <td className="p-2 text-right">{it.qtde} {it.unidade}</td>
                        <td className="p-2 text-right text-emerald-400 font-bold">
                          {formatCurrency(it.valor)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedItems.length > 15 && (
                  <div className="p-2 text-center text-[10px] text-slate-500 bg-slate-950/60 border-t border-slate-800">
                    + {parsedItems.length - 15} outros registros carregados no arquivo
                  </div>
                )}
              </div>

              {/* Overwrite or Append Selection */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-white">Modo de Gravação:</div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="radio"
                      name="mode"
                      checked={overwrite}
                      onChange={() => setOverwrite(true)}
                      className="accent-amber-500"
                    />
                    <span>
                      <strong className="text-amber-300">Substituir base existente</strong> (Recomenda-se para sincronização completa)
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="radio"
                      name="mode"
                      checked={!overwrite}
                      onChange={() => setOverwrite(false)}
                      className="accent-amber-500"
                    />
                    <span>
                      <strong className="text-sky-300">Acrescentar</strong> aos registros atuais
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={parsedItems.length === 0 || isSubmitting}
            onClick={handleImportSubmit}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 text-xs font-bold transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Importando {parsedItems.length} itens...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmar e Importar {parsedItems.length > 0 ? `(${parsedItems.length} itens)` : ''}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
