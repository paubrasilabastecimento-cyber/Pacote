import React, { useState, useEffect, useMemo } from 'react';
import {
  Recycle,
  Layers,
  Sparkles,
  BarChart3,
  PieChart as PieIcon,
  Download,
  Upload,
  Plus,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { RefugoItem } from '../../types/refugo';
import { INITIAL_REFUGO_DATA } from '../../data/mockRefugo';
import {
  getStoredRefugoData,
  saveRefugoData,
  calcularMetricasRefugo,
  processarItensRefugo,
  exportRefugoToCSV,
  formatBRL,
} from '../../utils/refugoUtils';
import { RefugoKPICards } from './RefugoKPICards';
import { RefugoParetoChart } from './RefugoParetoChart';
import { RefugoCategoryDonut } from './RefugoCategoryDonut';
import { RefugoStratificationBreakdown } from './RefugoStratificationBreakdown';
import { RefugoTable } from './RefugoTable';
import { RefugoModalForm } from './RefugoModalForm';
import { RefugoJsonImportModal } from './RefugoJsonImportModal';

export const RefugoView: React.FC = () => {
  const [items, setItems] = useState<RefugoItem[]>(() => getStoredRefugoData());
  const [isModalFormOpen, setIsModalFormOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<RefugoItem | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sincronizar e salvar alterações
  const processedItems = useMemo(() => processarItensRefugo(items), [items]);
  const metrics = useMemo(() => calcularMetricasRefugo(processedItems), [processedItems]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveItem = (itemData: Partial<RefugoItem>) => {
    if (itemData.id) {
      // Edição
      const updated = items.map((i) =>
        i.id === itemData.id ? ({ ...i, ...itemData } as RefugoItem) : i
      );
      setItems(updated);
      saveRefugoData(updated);
      showToast('Material de refugo atualizado com sucesso!');
    } else {
      // Criação
      const newItem: RefugoItem = {
        id: `ref-${Date.now()}`,
        posicao: items.length + 1,
        material: itemData.material || 'Novo Material',
        valor: itemData.valor || 0,
        categoria: itemData.categoria || 'Garrafas de Vidro',
        calibre: itemData.calibre || 'Padrão',
        tipoMaterial: itemData.tipoMaterial || 'Padrão',
        cor: itemData.cor || 'Padrão',
        retornavel: true,
        unidadesEstimadas: itemData.unidadesEstimadas,
        observacao: itemData.observacao,
        dataCriacao: new Date().toISOString().slice(0, 10),
      };
      const updated = [...items, newItem];
      setItems(updated);
      saveRefugoData(updated);
      showToast('Novo material cadastrado com sucesso!');
    }
  };

  const handleDeleteItem = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    if (window.confirm(`Deseja realmente remover "${item.material}" do registro de refugo?`)) {
      const updated = items.filter((i) => i.id !== id);
      setItems(updated);
      saveRefugoData(updated);
      showToast('Material removido com sucesso!');
    }
  };

  const handleImportItems = (imported: RefugoItem[], replace: boolean) => {
    let updated: RefugoItem[];
    if (replace) {
      updated = imported;
    } else {
      updated = [...items, ...imported];
    }
    setItems(updated);
    saveRefugoData(updated);
    showToast(`${imported.length} materiais importados com sucesso!`);
  };

  const handleResetDefault = () => {
    if (window.confirm('Deseja restaurar os dados originais da estratificação de refugo da Ambev?')) {
      setItems(INITIAL_REFUGO_DATA);
      saveRefugoData(INITIAL_REFUGO_DATA);
      showToast('Dados padrão de refugo restaurados!');
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-slate-900 border border-emerald-500/50 text-emerald-300 px-4 py-3 rounded-xl shadow-2xl animate-in slide-in-from-bottom-5 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Executivo da Aba Refugo */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 shadow-inner">
              <Recycle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Estratificação de Refugo de Materiais & Ativos
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Plataforma Unificada
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Pareto 80/20
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-4xl leading-relaxed">
                Painel analítico e estratificação completa de perdas por refugo em <strong>Garrafas de Vidro</strong>, <strong>Garrafeiras Plásticas</strong> e <strong>Paletes de Madeira</strong>. Análise de causa-raiz, Curva ABC e foco prioritário nos principais geradores de descarte.
              </p>
            </div>
          </div>

          {/* Ações Rápidas de Topo */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              onClick={() => exportRefugoToCSV(processedItems)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer border border-slate-700"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Exportar</span>
            </button>
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer border border-slate-700"
            >
              <Upload className="w-3.5 h-3.5 text-blue-400" />
              <span>Importar</span>
            </button>
            <button
              onClick={() => {
                setItemToEdit(null);
                setIsModalFormOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-colors cursor-pointer shadow-lg shadow-amber-500/10"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Lançamento</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Estratificados */}
      <RefugoKPICards metrics={metrics} />

      {/* Grid de Gráficos: Pareto (80/20) + Composição Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RefugoParetoChart items={processedItems} />
        </div>
        <div className="lg:col-span-1">
          <RefugoCategoryDonut
            porCategoria={metrics.porCategoria}
            porCalibre={metrics.porCalibre}
          />
        </div>
      </div>

      {/* Estratificação das 3 Grandes Famílias (Vidros, Garrafeiras, Paletes) */}
      <RefugoStratificationBreakdown
        metrics={metrics}
        items={processedItems}
      />

      {/* Tabela Estratificada Completa com Filtros e Curva ABC */}
      <RefugoTable
        items={processedItems}
        onEditItem={(item) => {
          setItemToEdit(item);
          setIsModalFormOpen(true);
        }}
        onDeleteItem={handleDeleteItem}
        onAddNew={() => {
          setItemToEdit(null);
          setIsModalFormOpen(true);
        }}
        onOpenImport={() => setIsImportModalOpen(true)}
        onResetDefault={handleResetDefault}
      />

      {/* Modais */}
      <RefugoModalForm
        isOpen={isModalFormOpen}
        onClose={() => {
          setIsModalFormOpen(false);
          setItemToEdit(null);
        }}
        onSave={handleSaveItem}
        itemToEdit={itemToEdit}
      />

      <RefugoJsonImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportItems}
      />
    </div>
  );
};
