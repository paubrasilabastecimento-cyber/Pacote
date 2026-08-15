import React, { useState } from 'react';
import { useConsumoInternoData } from '../hooks/useConsumoInternoData';
import { ConsumoMetricsCards } from './consumo-interno/ConsumoMetricsCards';
import { ConsumoCategoryBarChart } from './consumo-interno/ConsumoCategoryBarChart';
import { ConsumoMonthlyLineChart } from './consumo-interno/ConsumoMonthlyLineChart';
import { ConsumoHierarchyTree } from './consumo-interno/ConsumoHierarchyTree';
import { ConsumoTable } from './consumo-interno/ConsumoTable';
import { ConsumoModalForm } from './consumo-interno/ConsumoModalForm';
import { ConsumoJsonImportModal } from './consumo-interno/ConsumoJsonImportModal';
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
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
              <Beer className="w-3 h-3" />
              Módulo de Controle Operacional
            </span>

            {/* Firestore Status Badge */}
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1 border ${
                isFirestoreConnected
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-sky-500/10 text-sky-400 border-sky-500/20'
              }`}
              title="Sincronização Firestore onSnapshot com Persistent Local Cache"
            >
              {isFirestoreConnected ? (
                <>
                  <Wifi className="w-3 h-3 text-emerald-400 animate-pulse" />
                  <span>Firestore Online (armazemfacil-b2292)</span>
                </>
              ) : (
                <>
                  <Database className="w-3 h-3 text-sky-400" />
                  <span>Cache Persistente Local</span>
                </>
              )}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Consumo Interno</span>
            <span className="text-sm font-normal text-slate-400">| Gestão & Análise de Requisições</span>
          </h1>

          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Acompanhamento em tempo real de itens requisitados para consumo interno (docas, logística, eventos e operações) por SKU, categorias e impacto orçamentário.
          </p>
        </div>

        {/* Top Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start md:justify-end">
          {/* Direct JSON Import Button */}
          <button
            id="btn-importar-json-header"
            onClick={() => setIsJsonModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold transition-all border border-amber-500/40 hover:border-amber-400 shadow-md shadow-amber-500/5 cursor-pointer"
            title="Importar dados de Consumo Interno a partir de arquivo .JSON"
          >
            <FileJson className="w-4 h-4 text-amber-400" />
            <span>Importar JSON</span>
          </button>

          <button
            id="btn-restaurar-amostra"
            onClick={resetDemoData}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors border border-slate-700 cursor-pointer"
            title="Recarregar dados originais do arquivo consumo_interno.json"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Amostra</span>
          </button>

          <button
            id="btn-lancar-importar-consumo"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Lançar / Importar Consumo</span>
          </button>
        </div>
      </div>

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
