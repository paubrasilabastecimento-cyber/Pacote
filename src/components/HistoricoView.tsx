import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { parseQuebrasJSON } from '../utils/jsonImporter';
import { processarPlanilhaReposicao, sanitizarEParsearValesJSON } from '../utils/reposicaoUtils';
import { parseExcelOrCsvFile, parseJsonFile } from '../utils/perdasPorAnalytics';
import { parseTrocaFile } from '../utils/spreadsheetAnalyzer';
import {
  Upload,
  FileJson,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Database,
  BarChart3,
  Boxes,
  Layers,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  FolderUp,
  Save,
  Download,
  HardDrive,
  RefreshCw,
  Scale,
} from 'lucide-react';
import { PlatformSaveModal } from './PlatformSaveModal';
import { downloadPlatformBackup, saveAllPlatformDataToServer } from '../utils/platformBackup';
import { sanitizarEParsearQuebrasMovJSON } from '../utils/quebrasMovimentacaoUtils';
import { ModalImportacaoFaltasSobras } from './ModalImportacaoFaltasSobras';
import { processarImportacaoFaltasSobras } from '../utils/faltasSobrasImporter';
import { InventarioFaltasSobrasData } from '../data/mockFaltasSobras';
import { QuebrasMovJsonImportModal } from './quebras-movimentacao/QuebrasMovJsonImportModal';
import { QuebraMovimentacaoItem } from '../types/quebrasMovimentacao';
import { ValesJsonImportModal } from './ValesJsonImportModal';
import { ItemReposicao } from '../types/reposicao';

export const HistoricoView: React.FC = () => {
  const { importBatchPerdas, setActiveTab, importBatchTrocaPlanilha } = useApp();

  // Modal de Salvar Todos os Dados / Backup Geral
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [isQuickSaving, setIsQuickSaving] = useState<boolean>(false);

  // Modal dedicado de Faltas e Sobras
  const [isFaltasSobrasModalOpen, setIsFaltasSobrasModalOpen] = useState<boolean>(false);

  // Modal dedicado de Quebras por Movimentação
  const [isQuebrasMovModalOpen, setIsQuebrasMovModalOpen] = useState<boolean>(false);

  // Modal dedicado de Vales
  const [isValesModalOpen, setIsValesModalOpen] = useState<boolean>(false);

  // Status de cada importador
  const [feedback, setFeedback] = useState<{
    aba: string;
    tipo: 'sucesso' | 'erro';
    mensagem: string;
  } | null>(null);

  // Refs de arquivo
  const inputQuebrasRef = useRef<HTMLInputElement>(null);
  const inputReposicaoJsonRef = useRef<HTMLInputElement>(null);
  const inputReposicaoPlanilhaRef = useRef<HTMLInputElement>(null);
  const inputPerdasPorRef = useRef<HTMLInputElement>(null);
  const inputTrocaRef = useRef<HTMLInputElement>(null);
  const inputQuebrasMovRef = useRef<HTMLInputElement>(null);
  const inputFaltasSobrasRef = useRef<HTMLInputElement>(null);

  const showFeedback = (aba: string, tipo: 'sucesso' | 'erro', mensagem: string) => {
    setFeedback({ aba, tipo, mensagem });
    setTimeout(() => {
      setFeedback((prev) => (prev?.mensagem === mensagem ? null : prev));
    }, 5500);
  };

  const handleQuickDownloadBackup = async () => {
    try {
      setIsQuickSaving(true);
      const res = await downloadPlatformBackup();
      showFeedback('Backup Geral', 'sucesso', `Arquivo ${res.filename} exportado e baixado com sucesso (${res.totalRecords} registros)!`);
    } catch (e: any) {
      showFeedback('Backup Geral', 'erro', `Erro ao salvar backup: ${e?.message || 'Falha desconhecida'}`);
    } finally {
      setIsQuickSaving(false);
    }
  };

  const handleQuickSaveServer = async () => {
    try {
      setIsQuickSaving(true);
      const res = await saveAllPlatformDataToServer();
      showFeedback('Gravar Plataforma', 'sucesso', res.message || 'Todos os dados foram gravados e persistidos no servidor!');
    } catch (e: any) {
      showFeedback('Gravar Plataforma', 'erro', `Erro ao salvar no servidor: ${e?.message || 'Falha'}`);
    } finally {
      setIsQuickSaving(false);
    }
  };

  // 1. IMPORTAR ANÁLISE ANUAL DE QUEBRAS (JSON)
  const handleImportQuebras = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const res = parseQuebrasJSON(text);
        if (res.records.length === 0) {
          showFeedback('Análise Anual de Quebras', 'erro', 'Nenhum registro válido encontrado no JSON.');
          return;
        }
        await importBatchPerdas(res.records, true);
        showFeedback(
          'Análise Anual de Quebras',
          'sucesso',
          `${res.records.length} ocorrências importadas para Análise Anual de Quebras!`
        );
      } catch (err: any) {
        showFeedback('Análise Anual de Quebras', 'erro', 'Erro ao ler arquivo JSON de Quebras.');
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  // 2. IMPORTAR VALES (JSON COM VALIDAÇÃO LINHA POR LINHA)
  const handleImportReposicaoJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const itens = sanitizarEParsearValesJSON(text);
        if (itens.length === 0) {
          showFeedback('Vales', 'erro', 'O arquivo JSON não contém registros válidos no esquema de Vales.');
          return;
        }
        localStorage.setItem('AMBEV_REPOSICAO_BEBIDAS', JSON.stringify(itens));
        await fetch('/api/reposicao/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: itens, overwrite: true }),
        }).catch(() => {});

        try {
          window.dispatchEvent(new CustomEvent('ambev_reposicao_updated'));
        } catch {}

        showFeedback('Vales', 'sucesso', `${itens.length} vales verificados linha por linha e salvos com sucesso!`);
      } catch (err: any) {
        showFeedback('Vales', 'erro', `Erro ao validar JSON de Vales: ${err?.message || 'Sintaxe inválida'}`);
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  // 2B. SUCESSO DO MODAL DEDICADO DE VALES
  const handleSuccessModalVales = async (newItems: ItemReposicao[], replaceExisting: boolean) => {
    let finalItems: ItemReposicao[] = [];
    if (replaceExisting) {
      finalItems = newItems;
    } else {
      let atuais: ItemReposicao[] = [];
      try {
        const cached = localStorage.getItem('AMBEV_REPOSICAO_BEBIDAS');
        if (cached) atuais = JSON.parse(cached);
      } catch {}
      finalItems = [...newItems, ...atuais];
    }

    localStorage.setItem('AMBEV_REPOSICAO_BEBIDAS', JSON.stringify(finalItems));
    await fetch('/api/reposicao/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: finalItems, overwrite: true }),
    }).catch(() => {});

    try {
      window.dispatchEvent(new CustomEvent('ambev_reposicao_updated'));
    } catch {}

    showFeedback('Vales', 'sucesso', `${newItems.length} vales validados linha a linha e integrados à plataforma!`);
  };

  // 2C. IMPORTAR VALES (PLANILHA EXCEL / CSV)
  const handleImportReposicaoPlanilha = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const XLSX = await import('xlsx');
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { cellDates: true });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawRows: any[] = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });
      const itens = processarPlanilhaReposicao(rawRows);
      if (itens.length === 0) {
        showFeedback('Vales', 'erro', 'Nenhum lançamento reconhecido na planilha de Vales.');
        return;
      }
      localStorage.setItem('AMBEV_REPOSICAO_BEBIDAS', JSON.stringify(itens));
      await fetch('/api/reposicao/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itens, overwrite: true }),
      }).catch(() => {});

      try {
        window.dispatchEvent(new CustomEvent('ambev_reposicao_updated'));
      } catch {}

      showFeedback('Vales', 'sucesso', `${itens.length} linhas de planilha importadas e salvas na plataforma!`);
    } catch {
      showFeedback('Vales', 'erro', 'Erro ao ler arquivo Excel/CSV de Vales.');
    }
    if (e.target) e.target.value = '';
  };

  // 3. IMPORTAR PERDAS POR MERCADORIA (JSON OU EXCEL)
  const handleImportPerdasPor = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      let items: any[] = [];
      if (file.name.endsWith('.json')) {
        items = await parseJsonFile(file);
      } else {
        items = await parseExcelOrCsvFile(file);
      }
      if (items.length === 0) {
        showFeedback('Avarias no Total', 'erro', 'Nenhum item válido identificado no arquivo.');
        return;
      }
      localStorage.setItem('ambev_perdas_por_mercadoria_v1', JSON.stringify(items));
      await fetch('/api/perdas-por/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, overwrite: true }),
      }).catch(() => {});
      showFeedback('Avarias no Total', 'sucesso', `${items.length} registros importados e salvos com sucesso!`);
    } catch {
      showFeedback('Avarias no Total', 'erro', 'Falha ao processar arquivo para Avarias no Total.');
    }
    if (e.target) e.target.value = '';
  };

  // 4. IMPORTAR TROCA PROD. IMPRÓPRIO (JSON OU PLANILHA EXCEL/CSV)
  const handleImportTroca = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const items = await parseTrocaFile(file);
      if (!items || items.length === 0) {
        showFeedback('Troca Prod. Impróprio', 'erro', 'Nenhum registro válido identificado no arquivo de Troca.');
        return;
      }
      await importBatchTrocaPlanilha(items, file.name, true);
      showFeedback('Troca Prod. Impróprio', 'sucesso', `${items.length} itens importados e salvos na Troca de Produto Impróprio!`);
    } catch (err: any) {
      console.error(err);
      showFeedback('Troca Prod. Impróprio', 'erro', `Erro ao carregar arquivo de Trocas: ${err?.message || 'Formato inválido'}`);
    }
    if (e.target) e.target.value = '';
  };

  // 5. IMPORTAR QUEBRAS POR MOVIMENTAÇÃO (JSON)
  const handleImportQuebrasMov = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const validated = sanitizarEParsearQuebrasMovJSON(text);
        if (validated.length === 0) {
          showFeedback('Quebras de Movimentação', 'erro', 'JSON vazio ou sem itens.');
          return;
        }

        let atuais: any[] = [];
        try {
          const cached = localStorage.getItem('AMBEV_QUEBRAS_MOVIMENTACAO');
          if (cached) atuais = JSON.parse(cached);
        } catch {}

        const mesclados = [...validated, ...atuais];
        localStorage.setItem('AMBEV_QUEBRAS_MOVIMENTACAO', JSON.stringify(mesclados));
        await fetch('/api/quebras-movimentacao/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: mesclados, overwrite: true }),
        }).catch(() => {});

        try {
          window.dispatchEvent(new CustomEvent('ambev_quebras_mov_updated'));
        } catch {}

        showFeedback('Quebras de Movimentação', 'sucesso', `${validated.length} quebras por movimentação importadas com sucesso!`);
      } catch (err: any) {
        showFeedback('Quebras de Movimentação', 'erro', `Erro no JSON de Quebras por Movimentação: ${err?.message || 'Arquivo inválido'}`);
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  const handleSuccessModalQuebrasMov = async (items: QuebraMovimentacaoItem[], replaceExisting: boolean) => {
    let finalItems = items;
    if (!replaceExisting) {
      let atuais: any[] = [];
      try {
        const cached = localStorage.getItem('AMBEV_QUEBRAS_MOVIMENTACAO');
        if (cached) atuais = JSON.parse(cached);
      } catch {}
      finalItems = [...items, ...atuais];
    }
    localStorage.setItem('AMBEV_QUEBRAS_MOVIMENTACAO', JSON.stringify(finalItems));
    await fetch('/api/quebras-movimentacao/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: finalItems, overwrite: true }),
    }).catch(() => {});

    try {
      window.dispatchEvent(new CustomEvent('ambev_quebras_mov_updated'));
    } catch {}

    showFeedback('Quebras de Movimentação', 'sucesso', `${items.length} quebras por movimentação importadas com sucesso!`);
  };

  // 6. IMPORTAR FALTAS E SOBRAS DE INVENTÁRIO (JSON CONJUNTO)
  const handleImportFaltasSobrasDireto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const resultado = processarImportacaoFaltasSobras(parsed);
        localStorage.setItem('ambev_inventario_faltas_sobras', JSON.stringify(resultado));
        showFeedback(
          'Faltas & Sobras',
          'sucesso',
          `Inventário de Faltas & Sobras alimentado com sucesso! (${resultado.total_itens} SKUs auditados)`
        );
      } catch (err: any) {
        showFeedback('Faltas & Sobras', 'erro', `Erro ao processar Faltas & Sobras: ${err?.message || 'JSON inválido'}`);
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  const handleSucessoModalFaltasSobras = (data: InventarioFaltasSobrasData) => {
    localStorage.setItem('ambev_inventario_faltas_sobras', JSON.stringify(data));
    showFeedback(
      'Faltas & Sobras',
      'sucesso',
      `Inventário de Faltas & Sobras alimentado com sucesso! (${data.total_itens} SKUs auditados: ${data.itens_falta} Faltas / ${data.itens_sobra} Sobras)`
    );
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Hidden File Inputs */}
      <input type="file" ref={inputQuebrasRef} accept=".json,application/json" onChange={handleImportQuebras} className="hidden" />
      <input type="file" ref={inputQuebrasMovRef} accept=".json,application/json" onChange={handleImportQuebrasMov} className="hidden" />
      <input type="file" ref={inputReposicaoJsonRef} accept=".json,application/json" onChange={handleImportReposicaoJson} className="hidden" />
      <input type="file" ref={inputReposicaoPlanilhaRef} accept=".xlsx,.xls,.csv" onChange={handleImportReposicaoPlanilha} className="hidden" />
      <input type="file" ref={inputPerdasPorRef} accept=".json,.xlsx,.xls,.csv" onChange={handleImportPerdasPor} className="hidden" />
      <input type="file" ref={inputTrocaRef} accept=".json,application/json,.xlsx,.xls,.csv" onChange={handleImportTroca} className="hidden" />
      <input type="file" ref={inputFaltasSobrasRef} accept=".json,application/json" onChange={handleImportFaltasSobrasDireto} className="hidden" />

      {/* Header Central de Importação */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Database className="w-3 h-3" />
                Central de Importação e Carga de Dados
              </span>
              <span className="bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">
                Multi-Módulos AMBEV
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Importação &amp; Gestão de Dados
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-3xl mt-1">
              Importe arquivos JSON/Planilhas para alimentar cada módulo (incluindo Faltas &amp; Sobras de Inventário) ou salve todos os dados da plataforma em backup.
            </p>
          </div>

          {/* Botão Principal: Salvar Todos os Dados */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsSaveModalOpen(true)}
              className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer border border-emerald-400/30"
            >
              <HardDrive className="w-4 h-4" />
              <span>Salvar Todos os Dados</span>
            </button>
          </div>
        </div>

        {/* Notificação / Feedback de Importação / Salvamento */}
        {feedback && (
          <div
            className={`mt-4 p-3.5 rounded-xl border flex items-center gap-3 text-xs font-semibold animate-fadeIn ${
              feedback.tipo === 'sucesso'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
            }`}
          >
            {feedback.tipo === 'sucesso' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <div className="flex-1">
              <span className="font-bold uppercase tracking-wider text-[10px] mr-2 opacity-80 font-mono">
                [{feedback.aba}]
              </span>
              <span>{feedback.mensagem}</span>
            </div>
          </div>
        )}
      </div>

      {/* MASTER CARD: BACKUP GERAL & SALVAMENTO DA PLATAFORMA */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-950 border-2 border-emerald-500/40 shadow-xl shadow-emerald-950/20 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shrink-0 shadow-lg shadow-emerald-500/10">
              <HardDrive className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base sm:text-lg font-black text-white">
                  Backup Geral &amp; Salvamento de Todos os Dados
                </h3>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  Global
                </span>
              </div>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Gera um arquivo único consolidando <strong>Quebras Anuais</strong>, <strong>Reposição</strong>, <strong>Avarias no Total</strong>, <strong>Troca Prod. Impróprio</strong>, <strong>Faltas &amp; Sobras</strong> e <strong>Vales</strong>.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              disabled={isQuickSaving}
              onClick={handleQuickDownloadBackup}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              {isQuickSaving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>Baixar Backup (.JSON)</span>
            </button>

            <button
              type="button"
              disabled={isQuickSaving}
              onClick={handleQuickSaveServer}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              {isQuickSaving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Gravar no Servidor</span>
            </button>

            <button
              type="button"
              onClick={() => setIsSaveModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all cursor-pointer"
            >
              <Database className="w-4 h-4 text-emerald-400" />
              <span>Painel de Backup</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Backup Geral */}
      <PlatformSaveModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
      />

      {/* Modal de Alimentação de Faltas & Sobras */}
      <ModalImportacaoFaltasSobras
        isOpen={isFaltasSobrasModalOpen}
        onClose={() => setIsFaltasSobrasModalOpen(false)}
        onSuccess={handleSucessoModalFaltasSobras}
      />

      {/* GRID DE CARDS DOS BOTÕES DE IMPORTAÇÃO POR ABA */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* NOVO CARD DESTACADO: FALTAS & SOBRAS — INVENTÁRIO */}
        <div className="bg-slate-900/90 border-2 border-amber-500/50 hover:border-amber-400 rounded-2xl p-5 shadow-xl flex flex-col justify-between transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                <Scale className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Inventário
              </span>
            </div>
            <h3 className="text-base font-black text-white mb-1 flex items-center gap-1.5">
              Alimentar Faltas &amp; Sobras
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Importa a lista com Faltas e Sobras juntas (formato com <em>numero_item</em>, <em>promax</em>, <em>material</em>, <em>disponivel</em>, <em>fisico</em>, <em>diferenca</em>, <em>status</em>, etc.).
            </p>
          </div>

          <div className="space-y-2 pt-3 border-t border-slate-800/80">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsFaltasSobrasModalOpen(true)}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-md shadow-amber-500/25 transition-all cursor-pointer active:scale-95"
                title="Abrir editor para colar ou testar o JSON"
              >
                <Sparkles className="w-4 h-4" />
                <span>Alimentar JSON</span>
              </button>

              <button
                type="button"
                onClick={() => inputFaltasSobrasRef.current?.click()}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-bold text-xs transition-all cursor-pointer"
                title="Carregar arquivo .json do inventário"
              >
                <FileJson className="w-4 h-4" />
                <span>Subir Arquivo</span>
              </button>
            </div>

            <button
              onClick={() => setActiveTab('faltas-sobras')}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              <span>Ver Dashboard de Faltas &amp; Sobras</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
            </button>
          </div>
        </div>

        {/* 1. ANÁLISE ANUAL DE QUEBRAS */}
        <div className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all group">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <BarChart3 className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                Módulo 01
              </span>
            </div>
            <h3 className="text-base font-bold text-white mb-1">Análise Anual de Quebras</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Base oficial de quebras com data/hora, código SKU, quantidade, área, turno, motivo e valor da avaria.
            </p>
          </div>

          <div className="space-y-2 pt-3 border-t border-slate-800/80">
            <button
              onClick={() => inputQuebrasRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              <FileJson className="w-4 h-4" />
              <span>Importar JSON de Quebras</span>
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              <span>Ver Aba Análise Anual</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 2. VALES */}
        <div className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all group">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Vales
              </span>
            </div>
            <h3 className="text-base font-bold text-white mb-1">Vales</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Suporta formato completo com 22 campos: <code>item_numero</code>, <code>data_emissao</code>, <code>nota_fiscal</code>, <code>mapa_carga</code>, <code>rota_setor</code>, <code>motorista</code>, <code>ajudantes</code>, <code>status_vale</code>, <code>volume_total_hl</code>, <code>valor_total_prejuizo</code>, <code>rateio</code> e <code>detalhamento_skus</code>.
            </p>
          </div>

          <div className="space-y-2 pt-3 border-t border-slate-800/80">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsValesModalOpen(true)}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer active:scale-95"
                title="Abrir editor para colar ou validar JSON de Vales"
              >
                <Sparkles className="w-4 h-4" />
                <span>Alimentar JSON</span>
              </button>

              <button
                type="button"
                onClick={() => inputReposicaoJsonRef.current?.click()}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-bold text-xs transition-all cursor-pointer"
                title="Subir arquivo .json de Vales com validação linha por linha"
              >
                <FileJson className="w-4 h-4" />
                <span>Subir Arquivo</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => inputReposicaoPlanilhaRef.current?.click()}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700/60 transition-colors cursor-pointer"
                title="Importar planilha Excel (.xlsx) ou CSV de Vales"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
                <span>Planilha Excel</span>
              </button>

              <button
                onClick={() => setActiveTab('reposicao')}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                <span>Ver Aba Vales</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* 3. PERDAS POR MERCADORIA */}
        <div className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all group">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
                <Layers className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                Mercadoria
              </span>
            </div>
            <h3 className="text-base font-bold text-white mb-1">Avarias no Total</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Carga de dados de perdas por SKU/marca com análise de embalagens, Pareto de impacto financeiro e árvore hierárquica.
            </p>
          </div>

          <div className="space-y-2 pt-3 border-t border-slate-800/80">
            <button
              onClick={() => inputPerdasPorRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-slate-950 font-black text-xs shadow-md shadow-sky-500/20 transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Importar Dados (JSON / Excel)</span>
            </button>
            <button
              onClick={() => setActiveTab('perdas-por')}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              <span>Ver Aba Avarias no Total</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 4. TROCA PROD. IMPRÓPRIO */}
        <div className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all group">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <RotateCcw className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                Trocas
              </span>
            </div>
            <h3 className="text-base font-bold text-white mb-1">Troca Prod. Impróprio</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Histórico e dados de trocas por produtos impróprios, avarias de rota e devoluções com metas e Pareto de marcas.
            </p>
          </div>

          <div className="space-y-2 pt-3 border-t border-slate-800/80">
            <button
              onClick={() => inputTrocaRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 text-white font-black text-xs shadow-md shadow-purple-500/20 transition-all cursor-pointer"
              title="Importar arquivo JSON ou planilha Excel/CSV de Trocas"
            >
              <Upload className="w-4 h-4" />
              <span>Importar Dados (JSON / Excel)</span>
            </button>
            <button
              onClick={() => setActiveTab('troca-improprio')}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              <span>Ver Aba Troca Prod. Impróprio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 5. QUEBRAS DE MOVIMENTAÇÃO DO ARMAZÉM */}
        <div className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all group">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Boxes className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Armazém
              </span>
            </div>
            <h3 className="text-base font-bold text-white mb-1">Quebras por Movimentação</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Importa JSON oficial com: Data, Mês, CodProduto, Descricao, Quantidade, Area, Turno, CodQuebra, Motivo, Colaborador, Funcao, VALOR DA AVARIA, HECTO LITRO e HECTO PERDIDO.
            </p>
          </div>

          <div className="space-y-2 pt-3 border-t border-slate-800/80">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsQuebrasMovModalOpen(true)}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer active:scale-95"
                title="Abrir modal para colar JSON de Quebras por Movimentação"
              >
                <Sparkles className="w-4 h-4" />
                <span>Alimentar JSON</span>
              </button>

              <button
                type="button"
                onClick={() => inputQuebrasMovRef.current?.click()}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-bold text-xs transition-all cursor-pointer"
                title="Carregar arquivo .json de Quebras por Movimentação"
              >
                <FileJson className="w-4 h-4" />
                <span>Subir Arquivo</span>
              </button>
            </div>

            <button
              onClick={() => setActiveTab('quebras-movimentacao')}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              <span>Ver Aba Quebras de Movimentação</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Quebras por Movimentação */}
      <QuebrasMovJsonImportModal
        isOpen={isQuebrasMovModalOpen}
        onClose={() => setIsQuebrasMovModalOpen(false)}
        onImport={handleSuccessModalQuebrasMov}
      />

      {/* Modal Dedicado de Vales com Validação Linha por Linha */}
      <ValesJsonImportModal
        isOpen={isValesModalOpen}
        onClose={() => setIsValesModalOpen(false)}
        onImport={handleSuccessModalVales}
      />
    </div>
  );
};
