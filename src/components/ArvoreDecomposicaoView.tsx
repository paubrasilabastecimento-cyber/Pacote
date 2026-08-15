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
  ArrowLeft,
  DollarSign,
  Package,
  Layers,
  FolderTree,
  Tag,
  Building2,
} from 'lucide-react';

export const ArvoreDecomposicaoView: React.FC = () => {
  const { setActiveTab, trocaPlanilhaItens } = useApp();
  const itens: ItemPlanilha[] = trocaPlanilhaItens || DADOS_PLANILHA_DEMO;

  const analise = useMemo(() => {
    return analisarDadosPlanilha(itens);
  }, [itens]);

  return (
    <div className="space-y-4 pb-12 w-full animate-fadeIn">
      {/* Top Navigation & Breadcrumbs Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('troca-improprio')}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs transition-all cursor-pointer border border-slate-700 shadow-md group"
            title="Voltar para Troca de Produto Impróprio"
          >
            <ArrowLeft className="w-4 h-4 text-sky-400 group-hover:-translate-x-0.5 transition-transform" />
            <span>Voltar para Troca Prod. Impróprio</span>
          </button>

          <div className="h-6 w-[1px] bg-slate-800 hidden sm:block" />

          <div>
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-sky-400" />
              <span>Árvore de Decomposição Financeira</span>
            </h2>
            <p className="text-xs text-slate-400 hidden sm:block">
              Página dedicada para exploração hierárquica completa em tela cheia (Total → Categoria → Marca → SKU)
            </p>
          </div>
        </div>

        {/* Quick KPI Badges */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs">
            <DollarSign className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">Total:</span>
            <span className="font-mono font-black text-amber-400">
              {formatCurrency(analise.valorTotal)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs">
            <Package className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-slate-400">Volume:</span>
            <span className="font-mono font-black text-sky-400">
              {analise.quantidadeTotal.toLocaleString('pt-BR')} un
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs">
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-slate-400">Categorias:</span>
            <span className="font-mono font-bold text-white">
              {analise.categorias.length}
            </span>
          </div>
        </div>
      </div>

      {/* Main Full-Width Tree */}
      <div className="w-full">
        <DecompositionTree itens={itens} />
      </div>
    </div>
  );
};
