import React, { useState } from 'react';
import {
  Scale,
  Upload,
  FileJson,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  ArrowRight,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Boxes,
} from 'lucide-react';
import { sanitizarEParsearFaltasSobrasJSON, processarImportacaoFaltasSobras } from '../utils/faltasSobrasImporter';
import { InventarioFaltasSobrasData } from '../data/mockFaltasSobras';

interface ModalImportacaoFaltasSobrasProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: InventarioFaltasSobrasData) => void;
}

const EXEMPLO_JSON_FALTAS_SOBRAS = `[
  {
    "numero_item": 260,
    "promax": 33738,
    "material": 106699,
    "produto": "BEATS RED MIX LONG NECK 269ML SIX-PACK SH C/2",
    "grupo": "LONG-NECK",
    "unidade": "CX",
    "disponivel": 102.91666666666667,
    "consignado": 0,
    "transito": 0,
    "fisico": 186,
    "diferenca": -83.08333333333333,
    "preco_medio": 67.23,
    "valor_estoque": 6919.087500000001,
    "valor_justificado": 0,
    "valor_diferenca": -5585.6925,
    "percentual_diferenca": -0.8072874493927125,
    "status": "Sobra"
  },
  {
    "numero_item": 32,
    "promax": 7983,
    "material": 38954,
    "produto": "GATORADE MORANGO-MARACUJA PET 500ML SIXPACK",
    "grupo": "PET 500",
    "unidade": "CX",
    "disponivel": 87.66666666666667,
    "consignado": 0,
    "transito": 0,
    "fisico": 81.66666666666667,
    "diferenca": 6,
    "preco_medio": 23.3211,
    "valor_estoque": 2044.4831000000001,
    "valor_justificado": 0,
    "valor_diferenca": 139.9266,
    "percentual_diferenca": 0.06844106463878327,
    "status": "Falta"
  }
]`;

export const ModalImportacaoFaltasSobras: React.FC<ModalImportacaoFaltasSobrasProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [jsonInput, setJsonInput] = useState<string>('');
  const [periodo, setPeriodo] = useState<string>('MARÇO 2026');
  const [unidade, setUnidade] = useState<string>('CDD AMBEV — UNIDADE 539');
  const [erro, setErro] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<InventarioFaltasSobrasData | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleCopyExemplo = () => {
    navigator.clipboard.writeText(EXEMPLO_JSON_FALTAS_SOBRAS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleColarExemplo = () => {
    setJsonInput(EXEMPLO_JSON_FALTAS_SOBRAS);
    validarEPrever(EXEMPLO_JSON_FALTAS_SOBRAS);
  };

  const validarEPrever = (texto: string) => {
    if (!texto.trim()) {
      setPreviewData(null);
      setErro(null);
      return;
    }
    try {
      const parsed = JSON.parse(texto);
      const resultado = processarImportacaoFaltasSobras(parsed, { periodo, unidade });
      setPreviewData(resultado);
      setErro(null);
    } catch (err: any) {
      setPreviewData(null);
      setErro(err?.message || 'JSON inválido. Verifique se os dados estão formatados corretamente.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setJsonInput(val);
    validarEPrever(val);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        setJsonInput(text);
        validarEPrever(text);
      } catch (err: any) {
        setErro('Erro ao ler o arquivo JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  const handleConfirmar = () => {
    if (!previewData && !jsonInput.trim()) {
      setErro('Por favor, cole ou selecione o arquivo JSON de Faltas & Sobras.');
      return;
    }
    try {
      const parsed = JSON.parse(jsonInput);
      const resultado = processarImportacaoFaltasSobras(parsed, { periodo, unidade });
      onSuccess(resultado);
      onClose();
    } catch (err: any) {
      setErro('Falha ao processar dados: ' + (err?.message || 'Erro desconhecido'));
    }
  };

  const formatBRL = (val: number) => {
    return Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                Alimentar Faltas &amp; Sobras — Inventário
              </h2>
              <p className="text-xs text-slate-400">
                Importe a lista conjunta contendo Faltas e Sobras do inventário físico vs disponível
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg font-bold px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Inputs de Período e Unidade */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Período de Referência
            </label>
            <input
              type="text"
              value={periodo}
              onChange={(e) => {
                setPeriodo(e.target.value);
                if (jsonInput) validarEPrever(jsonInput);
              }}
              placeholder="Ex: MARÇO 2026"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Unidade / Filial Ambev
            </label>
            <input
              type="text"
              value={unidade}
              onChange={(e) => {
                setUnidade(e.target.value);
                if (jsonInput) validarEPrever(jsonInput);
              }}
              placeholder="Ex: CDD AMBEV — UNIDADE 539"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Actions bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 relative z-10">
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 cursor-pointer transition-all">
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              Carregar Arquivo .JSON
              <input type="file" accept=".json,application/json" onChange={handleFileUpload} className="hidden" />
            </label>

            <button
              type="button"
              onClick={handleColarExemplo}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Preencher com Modelo
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyExemplo}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
            <span>{copied ? 'Copiado!' : 'Copiar formato JSON'}</span>
          </button>
        </div>

        {/* Textarea */}
        <div className="flex-1 min-h-[160px] relative z-10">
          <textarea
            value={jsonInput}
            onChange={handleInputChange}
            placeholder={`Cole aqui o JSON contendo faltas e sobras juntas no formato:\n[\n  {\n    "numero_item": 260,\n    "promax": 33738,\n    "material": 106699,\n    "produto": "BEATS RED MIX...",\n    "grupo": "LONG-NECK",\n    "disponivel": 102.91,\n    "fisico": 186,\n    "diferenca": -83.08,\n    "preco_medio": 67.23,\n    "valor_estoque": 6919.08,\n    "valor_diferenca": -5585.69,\n    "status": "Sobra"\n  },\n  ...\n]`}
            className="w-full h-full min-h-[160px] bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500 resize-none shadow-inner"
          />
        </div>

        {/* Erro */}
        {erro && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs flex items-center gap-2 relative z-10 animate-shake">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        {/* Preview dos Dados Reconhecidos */}
        {previewData && !erro && (
          <div className="p-3 bg-slate-950/80 border border-emerald-500/30 rounded-xl space-y-2 relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Dados Reconhecidos com Sucesso ({previewData.total_itens} SKUs)
              </span>
              <span className="text-[11px] font-mono text-slate-300">
                Estoque Total: <strong className="text-amber-400">{formatBRL(previewData.total_estoque)}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Diferença Líquida</span>
                <span
                  className={`font-mono font-bold ${
                    previewData.total_diferenca < 0 ? 'text-red-400' : 'text-emerald-400'
                  }`}
                >
                  {formatBRL(previewData.total_diferenca)}
                </span>
              </div>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-red-400 block">Faltas ({previewData.itens_falta})</span>
                <span className="font-mono font-bold text-red-400">{formatBRL(previewData.valor_falta)}</span>
              </div>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-emerald-400 block">Sobras ({previewData.itens_sobra})</span>
                <span className="font-mono font-bold text-emerald-400">+{formatBRL(previewData.valor_sobra)}</span>
              </div>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-blue-400 block">Itens 100% OK</span>
                <span className="font-mono font-bold text-blue-400">{previewData.itens_ok} SKUs</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800 relative z-10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirmar}
            disabled={!jsonInput.trim()}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/25 transition-all cursor-pointer active:scale-95"
          >
            <span>Alimentar Dashboard de Inventário</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
