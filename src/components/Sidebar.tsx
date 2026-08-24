import React from 'react';
import { useApp } from '../context/AppContext';
import { MenuItemId } from '../types';
import {
  BarChart3,
  PlusCircle,
  PieChart,
  Target,
  Package,
  DollarSign,
  TrendingUp,
  Zap,
  CheckSquare,
  FileText,
  History,
  ShieldCheck,
  RefreshCw,
  RotateCcw,
  Beer,
  Boxes,
  Layers,
  FileSpreadsheet,
  FolderUp,
  Truck,
  ShieldAlert,
  LayoutDashboard,
} from 'lucide-react';

interface SidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, setIsMobileOpen }) => {
  const { activeTab, setActiveTab, resetDemoData, isLoading } = useApp();

  const menuItems: { id: MenuItemId; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard-geral', label: 'Dashboard Geral', icon: <LayoutDashboard className="w-5 h-5" />, badge: 'Completo' },
    { id: 'dashboard', label: 'Análise Anual de Quebras', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'reposicao', label: 'Reposição', icon: <FileSpreadsheet className="w-5 h-5" />, badge: 'Novo' },
    { id: 'perdas-por', label: 'Perdas por Mercadoria', icon: <Layers className="w-5 h-5" /> },
    { id: 'consumo-interno', label: 'Consumo Interno', icon: <Beer className="w-5 h-5" /> },
    { id: 'troca-improprio', label: 'Troca Prod. Impróprio', icon: <RotateCcw className="w-5 h-5" /> },
    { id: 'historico', label: 'Importar Dados', icon: <FolderUp className="w-5 h-5" /> },
  ];

  const handleSelectTab = (id: MenuItemId) => {
    setActiveTab(id);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 w-72 bg-slate-900 border-r border-slate-800 text-slate-200 z-50 transition-transform duration-300 flex flex-col ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* AMBEV Corporate Branding Header */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-950/50">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black text-xl shadow-md shadow-amber-500/20 tracking-tighter">
            A
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-slate-100 text-sm tracking-wide leading-tight">
              AMBEV LOGÍSTICA
            </span>
            <span className="text-[11px] text-amber-400 font-semibold uppercase tracking-wider">
              Pacote Prejuízo
            </span>
          </div>
        </div>

        {/* Sync Status Badge */}
        <div className="px-4 py-2 bg-slate-950/30 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-medium text-emerald-400">Padrão Operacional AMBEV</span>
          </div>
          <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1 custom-scrollbar">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`${isActive ? 'text-slate-950' : 'text-slate-400 group-hover:text-amber-400'} shrink-0`}>
                    {item.icon}
                  </span>
                  <span className="whitespace-nowrap">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0 ${
                      isActive ? 'bg-slate-950 text-amber-400' : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 space-y-2">
          <button
            onClick={() => {
              if (confirm('Deseja restaurar os dados demonstrativos originais do sistema?')) {
                resetDemoData();
              }
            }}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Restaurar Dados Demo</span>
          </button>
          <div className="text-[10px] text-center text-slate-500 font-mono">
            v2.5 - Sistema de Gestão de Armazém
          </div>
        </div>
      </aside>
    </>
  );
};
