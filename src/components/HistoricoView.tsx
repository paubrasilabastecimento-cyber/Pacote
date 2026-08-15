import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { parseQuebrasJSON } from '../utils/jsonImporter';
import { processarPlanilhaReposicao } from '../utils/reposicaoUtils';
import { parseExcelOrCsvFile, parseJsonFile } from '../utils/perdasPorAnalytics';
import { parseTrocaFile } from '../utils/spreadsheetAnalyzer';
import { useConsumoInternoData } from '../hooks/useConsumoInternoData';
import {
  Upload,
  FileJson,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Database,
  BarChart3,
  Layers,
  Beer,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  FolderUp,
} from 'lucide-react';

export const HistoricoView: React.FC = () => {
  const { importBatchPerdas, setActiveTab, importBatchTrocaPlanilha } = useApp();
  const { importJsonData: importConsumoJson } = useConsumoInternoData('empresa-01');

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
  const inputConsumoRef = useRef<HTMLInputElement>(null);
  const inputTrocaRef = useRef<HTMLInputElement>(null);

  const showFeedback = (aba: string, tipo: 'sucesso' | 'erro', mensagem: string) => {
    setFeedback({ aba, tipo, mensagem });
    setTimeout(() => {
      setFeedback((prev) => (prev?.mensagem === mensagem ? null : prev));
    }, 4500);
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

  // 2. IMPORTAR REPOSIÇÃO (JSON)
  const handleImportReposicaoJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const dataArray = Array.isArray(parsed) ? parsed : [parsed];
        const itens = processarPlanilhaReposicao(dataArray);
        if (itens.length === 0) {
          showFeedback('Reposição', 'erro', 'Formato incompatível com Reposição (Dt. Operacao, Descrição, Valor, Qtde, Embalagem).');
          return;
        }
        localStorage.setItem('AMBEV_REPOSICAO_BEBIDAS', JSON.stringify(itens));
        await fetch('/api/reposicao/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: itens, overwrite: true }),
        }).catch(() => {});
        showFeedback('Reposição', 'sucesso', `${itens.length} registros importados e salvos na plataforma com sucesso!`);
      } catch {
        showFeedback('Reposição', 'erro', 'JSON inválido para Reposição.');
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  // 2B. IMPORTAR REPOSIÇÃO (PLANILHA EXCEL / CSV)
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
        showFeedback('Reposição', 'erro', 'Nenhum lançamento reconhecido na planilha de Reposição.');
        return;
      }
      localStorage.setItem('AMBEV_REPOSICAO_BEBIDAS', JSON.stringify(itens));
      await fetch('/api/reposicao/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itens, overwrite: true }),
      }).catch(() => {});
      showFeedback('Reposição', 'sucesso', `${itens.length} linhas de planilha importadas e salvas na plataforma!`);
    } catch {
      showFeedback('Reposição', 'erro', 'Erro ao ler arquivo Excel/CSV de Reposição.');
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
        showFeedback('Perdas por Mercadoria', 'erro', 'Nenhum item válido identificado no arquivo.');
        return;
      }
      localStorage.setItem('ambev_perdas_por_mercadoria_v1', JSON.stringify(items));
      await fetch('/api/perdas-por/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, overwrite: true }),
      }).catch(() => {});
      showFeedback('Perdas por Mercadoria', 'sucesso', `${items.length} registros importados e salvos com sucesso!`);
    } catch {
      showFeedback('Perdas por Mercadoria', 'erro', 'Falha ao processar arquivo para Perdas por Mercadoria.');
    }
    if (e.target) e.target.value = '';
  };

  // 4. IMPORTAR CONSUMO INTERNO (JSON)
  const handleImportConsumo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const dataArray = Array.isArray(parsed) ? parsed : [parsed];
        await importConsumoJson(dataArray);
        showFeedback('Consumo Interno', 'sucesso', `${dataArray.length} requisições importadas e sincronizadas no Consumo Interno!`);
      } catch {
        showFeedback('Consumo Interno', 'erro', 'Erro de sintaxe no JSON de Consumo Interno.');
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  // 5. IMPORTAR TROCA PROD. IMPRÓPRIO (JSON OU PLANILHA EXCEL/CSV)
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

  return (
    <div className="space-y-6 pb-16">
      {/* Hidden File Inputs */}
      <input type="file" ref={inputQuebrasRef} accept=".json,application/json" onChange={handleImportQuebras} className="hidden" />
      <input type="file" ref={inputReposicaoJsonRef} accept=".json,application/json" onChange={handleImportReposicaoJson} className="hidden" />
      <input type="file" ref={inputReposicaoPlanilhaRef} accept=".xlsx,.xls,.csv" onChange={handleImportReposicaoPlanilha} className="hidden" />
      <input type="file" ref={inputPerdasPorRef} accept=".json,.xlsx,.xls,.csv" onChange={handleImportPerdasPor} className="hidden" />
      <input type="file" ref={inputConsumoRef} accept=".json,application/json" onChange={handleImportConsumo} className="hidden" />
      <input type="file" ref={inputTrocaRef} accept=".json,application/json,.xlsx,.xls,.csv" onChange={handleImportTroca} className="hidden" />

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
              Importação de Bases de Dados
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-3xl mt-1">
              Selecione o módulo operacional desejado abaixo para carregar arquivos JSON ou Planilhas (Excel/CSV). Os dados importados alimentarão instantaneamente os painéis correspondentes.
            </p>
          </div>
        </div>

        {/* Notificação / Feedback de Importação */}
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

      {/* GRID DE CARDS DOS BOTÕES DE IMPORTAÇÃO POR ABA */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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

        {/* 2. REPOSIÇÃO */}
        <div className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all group">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Reposição
              </span>
            </div>
            <h3 className="text-base font-bold text-white mb-1">Reposição</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Importa registros com Dt. Operacao, Emissao, Descrição, Qtde, Valor e Embalagem (formato padrão de reposição de bebidas).
            </p>
          </div>

          <div className="space-y-2 pt-3 border-t border-slate-800/80">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => inputReposicaoJsonRef.current?.click()}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                title="Importar arquivo JSON de Reposição"
              >
                <FileJson className="w-4 h-4" />
                <span>Importar JSON</span>
              </button>

              <button
                onClick={() => inputReposicaoPlanilhaRef.current?.click()}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-bold text-xs transition-all cursor-pointer"
                title="Importar planilha Excel (.xlsx) ou CSV de Reposição"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Planilha Excel</span>
              </button>
            </div>

            <button
              onClick={() => setActiveTab('reposicao')}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              <span>Ver Aba Reposição</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
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
            <h3 className="text-base font-bold text-white mb-1">Perdas por Mercadoria</h3>
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
              <span>Ver Aba Perdas por Mercadoria</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 4. CONSUMO INTERNO */}
        <div className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all group">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Beer className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                Consumo
              </span>
            </div>
            <h3 className="text-base font-bold text-white mb-1">Consumo Interno</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Registros e requisições de consumo interno da fábrica, armazém e logística por categoria, SKU e centro de custo.
            </p>
          </div>

          <div className="space-y-2 pt-3 border-t border-slate-800/80">
            <button
              onClick={() => inputConsumoRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <FileJson className="w-4 h-4" />
              <span>Importar JSON de Consumo Interno</span>
            </button>
            <button
              onClick={() => setActiveTab('consumo-interno')}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              <span>Ver Aba Consumo Interno</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 5. TROCA PROD. IMPRÓPRIO */}
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
      </div>
    </div>
  );
};
