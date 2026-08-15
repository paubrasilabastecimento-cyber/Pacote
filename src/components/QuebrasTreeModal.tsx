import React from 'react';
import { RegistroPerda } from '../types';
import { QuebrasHierarchyTree } from './QuebrasHierarchyTree';
import { X, Network, ExternalLink } from 'lucide-react';

interface QuebrasTreeModalProps {
  isOpen: boolean;
  onClose: () => void;
  perdas: RegistroPerda[];
}

export const QuebrasTreeModal: React.FC<QuebrasTreeModalProps> = ({
  isOpen,
  onClose,
  perdas,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="modal-quebras-hierarchy-tree"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[96vh] flex flex-col overflow-hidden ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>Árvore de Decomposição de Prejuízo por Motivo</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {perdas.length} quebras
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Desdobramento hierárquico das avarias: Total (Raiz) → Motivo (Pareto) → Área Operacional → Produto / SKU
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="Fechar (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 custom-scrollbar">
          <QuebrasHierarchyTree perdas={perdas} />
        </div>
      </div>
    </div>
  );
};
