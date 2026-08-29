import React, { useState } from 'react';
import { useConsumoInternoData } from '../hooks/useConsumoInternoData';
import { ConsumoMetricsCards } from './consumo-interno/ConsumoMetricsCards';
import { ConsumoCategoryBarChart } from './consumo-interno/ConsumoCategoryBarChart';
import { ConsumoMonthlyLineChart } from './consumo-interno/ConsumoMonthlyLineChart';
import { ConsumoHierarchyTree } from './consumo-interno/ConsumoHierarchyTree';
import { ConsumoTable } from './consumo-interno/ConsumoTable';
import { ConsumoModalForm } from './consumo-interno/ConsumoModalForm';
import { ConsumoJsonImportModal } from './consumo-interno/ConsumoJsonImportModal';
import { TabHeaderBanner } from './common/TabHeaderBanner';
import {
  Beer,
  Plus,
  FileSpreadsheet,
  RotateCcw,
  Database,
  Wifi,
  FileJson,
  UploadCloud,
  Sparkles,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';

export const ConsumoInternoView: React.FC = () => {
  const {
    data,
    metrics,
    loading,
    error,
    isFirestoreConnected,
    companyId,
    addConsumo,
    importBatchConsumo,
    importJsonData,
    deleteConsumo,
    resetDemoData,
  } = useConsumoInternoData('empresa-01');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  return (
    <div id="view-consumo-interno" className="space-y-6 pb-12">
      {/* Top Header Banner */}
      <TabHeaderBanner
        categoryBadge="MÓDULO 5 • CONTROLE OPERACIONAL"
        categoryIcon={<Beer className="w-3.5 h-3.5 text-amber-400" />}
        title="CONSUMO INTERNO — GESTÃO & ANÁLISE DE REQUISIÇÕES"
        description="Acompanhamento em tempo real de itens requisitados para consumo interno (docas, logística, eventos e operações) por SKU, categorias e impacto orçamentário."
        rightContent={
          <>
            {/* Firestore Status Badge */}
            <span
              className={`px-3 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 border ${
                isFirestoreConnected
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-sky-500/20 text-sky-300 border-sky-500/40'
              }`}
              title="Sincronização Firestore onSnapshot com Persistent Local Cache"
            >
              {isFirestoreConnected ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span>Firestore Online</span>
                </>
              ) : (
                <>
                  <Database className="w-3.5 h-3.5 text-sky-400" />
                  <span>Cache Local</span>
                </>
              )}
            </span>

            {/* Direct JSON Import Button */}
            <button
              id="btn-importar-json-header"
              onClick={() => setIsJsonModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition-all shadow-md active:scale-95 cursor-pointer"
              title="Importar dados de Consumo Interno a partir de arquivo .JSON"
            >
              <FileJson className="w-3.5 h-3.5" />
              <span>Importar JSON</span>
            </button>

            <button
              id="btn-restaurar-amostra"
              onClick={resetDemoData}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors border border-slate-700 cursor-pointer"
              title="Recarregar dados originais do arquivo consumo_interno.json"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Amostra</span>
            </button>

            <button
              id="btn-lancar-importar-consumo"
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/30 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Lançar Consumo</span>
            </button>
          </>
        }
      />

      {/* 1. Metrics Cards */}
      <ConsumoMetricsCards metrics={metrics} data={data} />

      {/* 2 & 3. Charts Grid (Bar Chart by Category + Line Chart Monthly) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ConsumoCategoryBarChart
          data={data}
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => setSelectedCategory(cat)}
        />

        <ConsumoMonthlyLineChart
          data={data}
          selectedMonth={selectedMonth}
          onSelectMonth={(m) => setSelectedMonth(m)}
        />
      </div>

      {/* 4. Hierarchy Tree (Root -> Categoria -> Top 3 Produtos) */}
      <ConsumoHierarchyTree data={data} />

      {/* 5. Detailed Analytics Table */}
      <ConsumoTable
        data={data}
        onDelete={deleteConsumo}
        onOpenJsonImport={() => setIsJsonModalOpen(true)}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        selectedMonth={selectedMonth}
        onSelectMonth={setSelectedMonth}
      />

      {/* Modal Form for Single Launch & Batch Spreadsheet Import */}
      <ConsumoModalForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddSingle={addConsumo}
        onBatchImport={importBatchConsumo}
        onOpenJsonImport={() => {
          setIsModalOpen(false);
          setIsJsonModalOpen(true);
        }}
      />

      {/* Dedicated Specialized JSON Import Modal */}
      <ConsumoJsonImportModal
        isOpen={isJsonModalOpen}
        onClose={() => setIsJsonModalOpen(false)}
        onImport={importJsonData}
      />
    </div>
  );
};
