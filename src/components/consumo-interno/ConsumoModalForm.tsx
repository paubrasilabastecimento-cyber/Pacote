import React, { useState } from 'react';
import { ConsumoInternoInput, CategoriaConsumo } from '../../types/consumoInterno';
import { classificarCategoriaProduto, CATEGORIAS_CONFIG } from '../../utils/consumoClassifier';
import { PRODUTOS_AMBEV } from '../../data/mockData';
import { formatCurrency } from '../../utils/formatters';
import {
  X,
  Plus,
  Upload,
  FileJson,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
} from 'lucide-react';

interface ConsumoModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSingle: (item: ConsumoInternoInput) => Promise<void>;
  onBatchImport: (items: ConsumoInternoInput[], overwrite?: boolean) => Promise<void>;
  onOpenJsonImport?: () => void;
}

export const ConsumoModalForm: React.FC<ConsumoModalFormProps> = ({
  isOpen,
  onClose,
  onAddSingle,
  onBatchImport,
  onOpenJsonImport,
}) => {
  const [activeTab, setActiveTab] = useState<'single' | 'import'>('single');
  const [submitting, setSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Single Form State
  const today = new Date().toISOString().slice(0, 10);
  const [operacao, setOperacao] = useState<number>(() => Math.floor(10000 + Math.random() * 90000));
  const [dtOperacao, setDtOperacao] = useState<string>(today);
  const [emissao, setEmissao] = useState<string>(today);
  const [status, setStatus] = useState<string>('A');
  const [produtoId, setProdutoId] = useState<number>(21020);
  const [descricao, setDescricao] = useState<string>('BUDWEISER 350ML (LATA CX24)');
  const [unidade, setUnidade] = useState<string>('cx');
  const [qtde, setQtde] = useState<number>(10);
  const [total, setTotal] = useState<number>(560.00);
  const [categoria, setCategoria] = useState<CategoriaConsumo>('Cerveja');
  const [solicitante, setSolicitante] = useState<string>('Operação Armazém Fácil');
  const [centroCusto, setCentroCusto] = useState<string>('CC-7102 Logística Operacional');

  // Import State
  const [rawText, setRawText] = useState<string>('');
  const [parsedPreview, setParsedPreview] = useState<ConsumoInternoInput[]>([]);
  const [overwriteOption, setOverwriteOption] = useState<boolean>(false);

  if (!isOpen) return null;

  // Auto classification when description changes
  const handleDescricaoChange = (val: string) => {
    setDescricao(val);
    const autoCat = classificarCategoriaProduto(val, produtoId);
    setCategoria(autoCat);
  };

  const handleProdutoSelect = (skuStr: string) => {
    const matched = PRODUTOS_AMBEV.find((p) => p.id === skuStr);
    if (matched) {
      setProdutoId(Number(matched.id.replace(/\D/g, '')) || 20001);
      setDescricao(matched.nome);
      const autoCat = classificarCategoriaProduto(matched.nome, matched.id);
      setCategoria(autoCat);
      setUnidade(matched.categoria.toLowerCase().includes('chopp') ? 'barril' : 'cx');
      const unitCost = Number((matched.volumeHLPerUnit * matched.custoPorHL).toFixed(2)) || 56.0;
      setTotal(Number((unitCost * qtde).toFixed(2)));
    }
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedbackMsg(null);

    try {
      await onAddSingle({
        operacao: Number(operacao),
        dtOperacao,
        emissao,
        status,
        produtoId: Number(produtoId),
        unidade,
        descricao,
        qtde: Number(qtde),
        total: Number(total),
        categoria,
        solicitante,
        centroCusto,
      });

      setFeedbackMsg({
        type: 'success',
        text: `Operação #${operacao} de consumo interno lançada com sucesso!`,
      });
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: `Erro ao salvar: ${err.message || 'Falha na gravação'}`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Parse TSV / CSV / JSON / Spreadsheet pasted content
  const handleParseRaw = () => {
    if (!rawText.trim()) return;

    const trimmed = rawText.trim();
    const items: ConsumoInternoInput[] = [];

    // Try parsing as JSON array first
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        const list = Array.isArray(parsed) ? parsed : [parsed];
        list.forEach((item: any) => {
          const sku = Number(item.produto || item.produtoId || 0);
          const dt = item.dataOperacao || item.dtOperacao || today;
          const em = item.emissao || dt;
          const desc = item.descricao || 'PRODUTO CONSUMO INTERNO';
          const cat = classificarCategoriaProduto(desc, sku);
          const tot = Number(item.valor ?? item.total ?? 0);

          items.push({
            operacao: Number(item.operacao || Math.floor(10000 + Math.random() * 90000)),
            dtOperacao: dt,
            dataOperacao: dt,
            emissao: em,
            status: item.status || 'A',
            produtoId: sku,
            produto: sku,
            unidade: item.unidade || 'cx',
            descricao: desc,
            qtde: Number(item.qtde || 1),
            total: tot,
            valor: tot,
            embalagem: item.embalagem || 'LONG NECK',
            categoria: cat,
            solicitante: 'Importação JSON',
          });
        });

        setParsedPreview(items);
        return;
      } catch (err) {
        console.warn('Não foi possível interpretar como JSON, tentando linhas CSV/TSV...', err);
      }
    }

    const lines = trimmed.split('\n');

    lines.forEach((line, idx) => {
      // Split by tab or semicolon or comma
      const delimiter = line.includes('\t') ? '\t' : line.includes(';') ? ';' : ',';
      const cols = line.split(delimiter).map((c) => c.trim().replace(/^"|"$/g, ''));

      // Check if header line
      if (idx === 0 && (cols[0]?.toLowerCase().includes('op') || cols[6]?.toLowerCase().includes('desc'))) {
        return;
      }

      if (cols.length >= 4) {
        // Mapping: Operacao (0), Dt. Operacao (1), Emissao (2), Status (3), Produto (4), Unidade (5), Descricao (6), Qtde (7), Total (8), Embalagem (9)
        const op = Number(cols[0]?.replace(/\D/g, '')) || Math.floor(10000 + Math.random() * 90000);
        const dt = cols[1] || today;
        const em = cols[2] || dt;
        const st = cols[3] || 'A';
        const sku = Number(cols[4]?.replace(/\D/g, '')) || 20001;
        const un = cols[5] || 'cx';
        const desc = cols[6] || cols[4] || 'PRODUTO CONSUMO INTERNO';
        const q = Number(cols[7]?.replace(/[^\d.,]/g, '').replace(',', '.')) || 1;
        const tot = Number(cols[8]?.replace(/[^\d.,]/g, '').replace(',', '.')) || 50.0;
        const emb = cols[9] || 'LONG NECK';

        const cat = classificarCategoriaProduto(desc, sku);

        items.push({
          operacao: op,
          dtOperacao: dt,
          dataOperacao: dt,
          emissao: em,
          status: st,
          produtoId: sku,
          produto: sku,
          unidade: un,
          descricao: desc,
          qtde: q,
          total: tot,
          valor: tot,
          embalagem: emb,
          categoria: cat,
          solicitante: 'Importação em Lote Planilha',
        });
      }
    });

    setParsedPreview(items);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        setRawText(content);
      }
    };
    reader.readAsText(file);
  };


  const handleBatchSubmit = async () => {
    if (parsedPreview.length === 0) return;
    setSubmitting(true);
    setFeedbackMsg(null);

    try {
      await onBatchImport(parsedPreview, overwriteOption);
      setFeedbackMsg({
        type: 'success',
        text: `${parsedPreview.length} registros importados com sucesso para o Firestore!`,
      });
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: `Erro ao importar lote: ${err.message}`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-750 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Lançar Consumo Interno
              </h3>
              <p className="text-[11px] text-slate-400">
                Alimentar base do Firestore para acompanhamento de despesas operacionais
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex flex-wrap border-b border-slate-800 bg-slate-900/50 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('single')}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'single'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Lançamento Individual</span>
          </button>

          <button
            onClick={() => setActiveTab('import')}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'import'
                ? 'border-purple-400 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Colar Texto / CSV</span>
          </button>

          {onOpenJsonImport && (
            <button
              onClick={onOpenJsonImport}
              className="pb-3 px-4 text-xs font-bold transition-all border-b-2 border-transparent text-amber-400 hover:text-amber-300 flex items-center gap-2 cursor-pointer hover:border-amber-400/50"
              title="Abrir importador dedicado para arquivo .JSON"
            >
              <FileJson className="w-3.5 h-3.5 text-amber-400" />
              <span>Importar Arquivo JSON</span>
              <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 text-[10px] rounded font-mono">.json</span>
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {feedbackMsg && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                feedbackMsg.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
              }`}
            >
              {feedbackMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{feedbackMsg.text}</span>
            </div>
          )}

          {activeTab === 'single' ? (
            <form onSubmit={handleSingleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Nº Operação
                  </label>
                  <input
                    type="number"
                    required
                    value={operacao}
                    onChange={(e) => setOperacao(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Dt. Operação
                  </label>
                  <input
                    type="date"
                    required
                    value={dtOperacao}
                    onChange={(e) => setDtOperacao(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Emissão
                  </label>
                  <input
                    type="date"
                    required
                    value={emissao}
                    onChange={(e) => setEmissao(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Quick Select from Ambev Catalog */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Catálogo Ambev Rápido (Opcional)
                </label>
                <select
                  onChange={(e) => handleProdutoSelect(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
                >
                  <option value="">Selecione um produto do catálogo Ambev...</option>
                  {PRODUTOS_AMBEV.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.id} - {p.nome} ({p.categoria})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Cód. SKU
                  </label>
                  <input
                    type="number"
                    required
                    value={produtoId}
                    onChange={(e) => setProdutoId(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Descrição do Produto
                  </label>
                  <input
                    type="text"
                    required
                    value={descricao}
                    onChange={(e) => handleDescricaoChange(e.target.value)}
                    placeholder="Ex: CORONA EXTRA 330ML"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Categoria (Auto)
                  </label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value as CategoriaConsumo)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-400 font-bold focus:outline-none focus:border-amber-500"
                  >
                    {Object.keys(CATEGORIAS_CONFIG).map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Unidade
                  </label>
                  <input
                    type="text"
                    required
                    value={unidade}
                    onChange={(e) => setUnidade(e.target.value)}
                    placeholder="cx, un, lt"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white uppercase focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Qtde
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={qtde}
                    onChange={(e) => {
                      const q = Number(e.target.value);
                      setQtde(q);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-sky-400 font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Total (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={total}
                    onChange={(e) => setTotal(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-emerald-400 font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Solicitante / Doca
                  </label>
                  <input
                    type="text"
                    value={solicitante}
                    onChange={(e) => setSolicitante(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Centro de Custo
                  </label>
                  <input
                    type="text"
                    value={centroCusto}
                    onChange={(e) => setCentroCusto(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{submitting ? 'Salvando...' : 'Salvar Registro'}</span>
                </button>
              </div>
            </form>
          ) : (
            /* Batch Import from Tabular / CSV Data */
            <div className="space-y-3">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-[11px] text-slate-400 space-y-1">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Formato Esperado da Planilha:</span>
                </div>
                <p>
                  Cole as colunas na ordem: <br />
                  <code className="text-slate-300 font-mono">
                    Operacao [Tab] Dt. Operacao [Tab] Emissao [Tab] Status [Tab] Produto [Tab] Unidade [Tab] Descrição [Tab] Qtde [Tab] Total
                  </code>
                </p>
              </div>

              <textarea
                rows={6}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={`10401\t2026-08-10\t2026-08-10\tA\t21020\tcx\tBUDWEISER 350ML\t10\t560.00\n10402\t2026-08-11\t2026-08-11\tA\t18450\tcx\tSTELLA ARTOIS 330ML\t8\t733.44`}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-purple-500"
              />

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleParseRaw}
                  className="px-4 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 text-xs font-bold transition-colors cursor-pointer"
                >
                  Pré-visualizar e Categorizar ({parsedPreview.length} lidos)
                </button>

                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={overwriteOption}
                    onChange={(e) => setOverwriteOption(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-purple-500 focus:ring-0"
                  />
                  <span>Substituir base existente</span>
                </label>
              </div>

              {parsedPreview.length > 0 && (
                <div className="max-h-48 overflow-y-auto border border-slate-800 rounded-xl bg-slate-950 p-2 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 px-2 pb-1 border-b border-slate-850">
                    Prévia ({parsedPreview.length} registros prontos):
                  </div>
                  {parsedPreview.slice(0, 5).map((p, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-[11px] text-slate-300 px-2 py-1 bg-slate-900/50 rounded-lg"
                    >
                      <div className="truncate mr-2">
                        <span className="font-mono text-amber-400 mr-2">#{p.operacao}</span>
                        <span>{p.descricao}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] px-1.5 py-0.2 bg-purple-500/20 text-purple-300 rounded font-mono">
                          {p.categoria}
                        </span>
                        <span className="font-mono text-emerald-400 font-bold">
                          {formatCurrency(p.total)}
                        </span>
                      </div>
                    </div>
                  ))}
                  {parsedPreview.length > 5 && (
                    <div className="text-[10px] text-slate-500 text-center py-1 font-mono">
                      + {parsedPreview.length - 5} outros itens no lote
                    </div>
                  )}
                </div>
              )}

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleBatchSubmit}
                  disabled={submitting || parsedPreview.length === 0}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-lg shadow-purple-600/20 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>
                    {submitting
                      ? 'Importando...'
                      : `Importar ${parsedPreview.length} Registros`}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
