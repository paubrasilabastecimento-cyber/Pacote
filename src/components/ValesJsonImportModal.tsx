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
  Layers,
  DollarSign,
  Droplet,
  Package,
} from 'lucide-react';
import { ItemReposicao } from '../types/reposicao';
import { sanitizarEParsearValesJSON, formatBRL, formatHL } from '../utils/reposicaoUtils';

interface ValesJsonImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (items: ItemReposicao[], replaceExisting: boolean) => void;
  totalAtuais?: number;
}

export const EXEMPLO_JSON_VALES = `[
  {
    "item_numero": 1,
    "data_emissao": "14/01/2026",
    "nota_fiscal": "252161",
    "mapa_carga": "M1055",
    "rota_setor": "R111",
    "motorista": "DANILLO PEREIRA DOS SANTOS SILVA",
    "cpf_motorista": "713.650.714-64",
    "ajudante_1": "GEOVANE ARAUJO DA SILVA",
    "cpf_ajudante_1": "099.123.694-75",
    "ajudante_2": "-",
    "cpf_ajudante_2": "Ausente",
    "equipe_completa": "GEOVANE ARAUJO DA SILVA",
    "status_vale": "Compensado",
    "volume_total_hl": 0.08,
    "valor_total_prejuizo": 57.04,
    "total_integrantes_rateio": "2 Integrante(s)",
    "valor_rateado_por_pessoa": 28.52,
    "qtd_itens": 1,
    "codigo_cliente": "CLI3012",
    "razao_social_cliente": "PONTO DE VENDA (PDV)",
    "detalhamento_skus": "9068 - SKOL LATA 350ML SH C/12 NPAL (2 CX)",
    "id_vale_sstr": "vale_hist_1001"
  }
]`;

export const ValesJsonImportModal: React.FC<ValesJsonImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  totalAtuais = 0,
}) => {
  const [jsonText, setJsonText] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewItems, setPreviewItems] = useState<ItemReposicao[]>([]);
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
      const validated = sanitizarEParsearValesJSON(text);
      if (validated.length === 0) {
        setErrorMsg('Nenhum registro válido de Vales foi encontrado no JSON.');
        setPreviewItems([]);
        return;
      }
      setPreviewItems(validated);
    } catch (err: any) {
      setErrorMsg(`Erro de validação no JSON: ${err.message}`);
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
          const validated = sanitizarEParsearValesJSON(content);
          if (validated.length === 0) {
            setErrorMsg('O arquivo JSON não contém registros válidos de Vales.');
            setPreviewItems([]);
          } else {
            setPreviewItems(validated);
            setErrorMsg(null);
          }
        } catch (err: any) {
          setErrorMsg(`Erro ao ler e validar arquivo JSON: ${err.message}`);
          setPreviewItems([]);
        }
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  const handleApplyTemplate = () => {
    setJsonText(EXEMPLO_JSON_VALES);
    try {
      const validated = sanitizarEParsearValesJSON(EXEMPLO_JSON_VALES);
      setPreviewItems(validated);
      setErrorMsg(null);
    } catch {
      // ignore
    }
  };

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(EXEMPLO_JSON_VALES);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirm = () => {
    if (previewItems.length === 0) return;
    onImport(previewItems, replaceExisting);
    onClose();
  };

  const totalPreviewValor = previewItems.reduce((acc, i) => acc + (i.valor_total_prejuizo ?? i.valor ?? 0), 0);
  const totalPreviewHl = previewItems.reduce((acc, i) => acc + (i.volume_total_hl ?? 0), 0);
  const totalPreviewQtd = previewItems.reduce((acc, i) => acc + (i.qtd_itens ?? i.qtde ?? 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/95">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Importador JSON — Vales</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  Modelo Oficial SSTR
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Validação estrita linha por linha: nota fiscal, mapa de carga, motorista, ajudantes, rateio e SKUs.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer border border-slate-700 transition-colors">
                <Upload className="w-3.5 h-3.5 text-amber-400" />
                <span>Carregar Arquivo .json</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
              <button
                type="button"
                onClick={handleApplyTemplate}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Preencher Exemplo Oficial</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleCopyTemplate}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
              title="Copiar estrutura JSON modelo"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copied ? 'Copiado!' : 'Copiar Modelo JSON'}</span>
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
                  {previewItems.length} {previewItems.length === 1 ? 'linha validada com sucesso' : 'linhas validadas com sucesso'}
                </span>
              )}
            </div>
            <textarea
              value={jsonText}
              onChange={handleJsonChange}
              placeholder={`[\n  {\n    "item_numero": 1,\n    "data_emissao": "14/01/2026",\n    "nota_fiscal": "252161",\n    "mapa_carga": "M1055",\n    "rota_setor": "R111",\n    "motorista": "DANILLO PEREIRA DOS SANTOS SILVA",\n    "cpf_motorista": "713.650.714-64",\n    "ajudante_1": "GEOVANE ARAUJO DA SILVA",\n    "cpf_ajudante_1": "099.123.694-75",\n    "ajudante_2": "-",\n    "cpf_ajudante_2": "Ausente",\n    "equipe_completa": "GEOVANE ARAUJO DA SILVA",\n    "status_vale": "Compensado",\n    "volume_total_hl": 0.08,\n    "valor_total_prejuizo": 57.04,\n    "total_integrantes_rateio": "2 Integrante(s)",\n    "valor_rateado_por_pessoa": 28.52,\n    "qtd_itens": 1,\n    "codigo_cliente": "CLI3012",\n    "razao_social_cliente": "PONTO DE VENDA (PDV)",\n    "detalhamento_skus": "9068 - SKOL LATA 350ML SH C/12 NPAL (2 CX)",\n    "id_vale_sstr": "vale_hist_1001"\n  }\n]`}
              rows={8}
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl p-3.5 text-xs text-slate-100 font-mono focus:outline-none transition-colors resize-y placeholder:text-slate-600 custom-scrollbar"
            />
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-start gap-2 animate-fadeIn">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Inconsistência identificada: </span>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          {/* Validation KPIs Summary */}
          {previewItems.length > 0 && (
            <div className="space-y-3 animate-fadeIn">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <Layers className="w-3 h-3 text-amber-400" />
                    Total de Vales
                  </span>
                  <div className="text-base font-black text-white mt-0.5">
                    {previewItems.length}
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-rose-400" />
                    Prejuízo Total
                  </span>
                  <div className="text-base font-black text-rose-400 mt-0.5">
                    {formatBRL(totalPreviewValor)}
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <Droplet className="w-3 h-3 text-sky-400" />
                    Volume Total
                  </span>
                  <div className="text-base font-black text-sky-400 mt-0.5">
                    {formatHL(totalPreviewHl)}
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <Package className="w-3 h-3 text-emerald-400" />
                    Itens / Caixas
                  </span>
                  <div className="text-base font-black text-emerald-400 mt-0.5">
                    {totalPreviewQtd} cx
                  </div>
                </div>
              </div>

              {/* Data Table Preview (Top 5 lines) */}
              <div className="bg-slate-950 rounded-xl border border-slate-800/80 overflow-hidden">
                <div className="p-2.5 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300">
                    Prévia dos Registros Validados (primeiras {Math.min(5, previewItems.length)} linhas):
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Todos os campos foram verificados
                  </span>
                </div>
                <div className="overflow-x-auto max-h-48 custom-scrollbar">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-900/40 text-slate-400 font-semibold border-b border-slate-800 sticky top-0">
                      <tr>
                        <th className="p-2">Item</th>
                        <th className="p-2">Data</th>
                        <th className="p-2">NF</th>
                        <th className="p-2">Mapa</th>
                        <th className="p-2">Rota</th>
                        <th className="p-2">Motorista</th>
                        <th className="p-2">Ajudante 1</th>
                        <th className="p-2">Prejuízo R$</th>
                        <th className="p-2">Vol. HL</th>
                        <th className="p-2">Rateio R$</th>
                        <th className="p-2">SKU / Detalhamento</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50 text-slate-300">
                      {previewItems.slice(0, 5).map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-slate-900/50">
                          <td className="p-2 font-mono text-slate-400">{item.item_numero || idx + 1}</td>
                          <td className="p-2 whitespace-nowrap">{item.data_emissao || item.dataOperacao}</td>
                          <td className="p-2 font-mono text-amber-300">{item.nota_fiscal || '-'}</td>
                          <td className="p-2 font-mono">{item.mapa_carga || '-'}</td>
                          <td className="p-2 font-bold text-sky-300">{item.rota_setor || '-'}</td>
                          <td className="p-2 truncate max-w-[140px]">{item.motorista || '-'}</td>
                          <td className="p-2 truncate max-w-[130px]">{item.ajudante_1 || '-'}</td>
                          <td className="p-2 font-bold text-rose-400">{formatBRL(item.valor_total_prejuizo || item.valor || 0)}</td>
                          <td className="p-2 text-sky-400">{formatHL(item.volume_total_hl || 0)}</td>
                          <td className="p-2 text-amber-400">{formatBRL(item.valor_rateado_por_pessoa || 0)}</td>
                          <td className="p-2 truncate max-w-[200px]" title={item.detalhamento_skus || item.descricao}>
                            {item.detalhamento_skus || item.descricao}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Fields Reference Guide */}
          <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/60 text-[11px] text-slate-400 space-y-1">
            <div className="font-bold text-amber-400 flex items-center gap-1">
              <Info className="w-3.5 h-3.5" />
              <span>Esquema Oficial Esperado (22 campos por linha):</span>
            </div>
            <p className="font-mono text-[10px] text-slate-300 leading-relaxed break-all">
              item_numero, data_emissao, nota_fiscal, mapa_carga, rota_setor, motorista, cpf_motorista, ajudante_1, cpf_ajudante_1, ajudante_2, cpf_ajudante_2, equipe_completa, status_vale, volume_total_hl, valor_total_prejuizo, total_integrantes_rateio, valor_rateado_por_pessoa, qtd_itens, codigo_cliente, razao_social_cliente, detalhamento_skus, id_vale_sstr
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/95 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="radio"
                name="replaceModeVales"
                checked={replaceExisting}
                onChange={() => setReplaceExisting(true)}
                className="text-amber-500 focus:ring-amber-500 bg-slate-950 border-slate-700"
              />
              <span>Substituir base existente ({totalAtuais} vales)</span>
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="radio"
                name="replaceModeVales"
                checked={!replaceExisting}
                onChange={() => setReplaceExisting(false)}
                className="text-amber-500 focus:ring-amber-500 bg-slate-950 border-slate-700"
              />
              <span>Acrescentar aos registros existentes</span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={previewItems.length === 0}
              onClick={handleConfirm}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Importar {previewItems.length} {previewItems.length === 1 ? 'Vale' : 'Vales'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
