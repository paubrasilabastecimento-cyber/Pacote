import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { DecompositionTree } from './DecompositionTree';
import {
  ItemPlanilha,
  DADOS_PLANILHA_DEMO,
  analisarDadosPlanilha,
} from '../utils/spreadsheetAnalyzer';
import { formatCurrency } from '../utils/formatters';
import {
  DollarSign,
  Package,
  Layers,
  FolderTree,
  ExternalLink,
  RotateCw,
  Sparkles,
} from 'lucide-react';

export const StandaloneTreeView: React.FC = () => {
  const { trocaPlanilhaItens, nomeArquivoTroca } = useApp();
  const itens: ItemPlanilha[] = trocaPlanilhaItens || DADOS_PLANILHA_DEMO;

  const analise = useMemo(() => {
    return analisarDadosPlanilha(itens);
  }, [itens]);

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-sky-500 selection:text-slate-950 flex flex-col p-3 sm:p-5 md:p-6 space-y-4">
      {/* Top Header Bar for Standalone Tab */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800/90 p-4 rounded-2xl shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-sky-500/20">
            <FolderTree className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Árvore de Decomposição Financeira
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-[10px] font-bold uppercase tracking-wider">
                Guia Exclusiva
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Sincronizado em tempo real
              </span>
              {nomeArquivoTroca && (
                <>
                  <span>•</span>
                  <span className="text-slate-300 font-medium truncate max-w-xs">
                    Arquivo: {nomeArquivoTroca}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action & Metric Stats */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Metrics */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs">
            <DollarSign className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400 font-medium">Total:</span>
            <span className="font-mono font-black text-amber-400">
              {formatCurrency(analise.valorTotal)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs">
            <Package className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-slate-400 font-medium">Volume:</span>
            <span className="font-mono font-black text-sky-400">
              {analise.quantidadeTotal.toLocaleString('pt-BR')} un
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs">
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-slate-400 font-medium">Categorias:</span>
            <span className="font-mono font-bold text-white">
              {analise.categorias.length}
            </span>
          </div>

          {/* Refresh Action */}
          <button
            onClick={handleReload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition-all cursor-pointer shadow-sm"
            title="Recarregar dados do servidor"
          >
            <RotateCw className="w-3.5 h-3.5 text-sky-400" />
            <span>Recarregar</span>
          </button>

          {/* Link back to Main Application */}
          <a
            href={window.location.pathname || '/'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition-all cursor-pointer shadow-sm"
            title="Voltar ao Painel Completo"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            <span>Abrir Painel Completo</span>
          </a>
        </div>
      </div>

      {/* Full Screen Dedicated Tree Canvas */}
      <div className="flex-1 w-full">
        <DecompositionTree itens={itens} />
      </div>
    </div>
  );
};
