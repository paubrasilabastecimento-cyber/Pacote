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
  Scale,
  Recycle,
} from 'lucide-react';

interface SidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, setIsMobileOpen }) => {
  const { activeTab, setActiveTab, resetDemoData, isLoading } = useApp();

  const menuItems: { id: MenuItemId; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard-geral', label: 'Dashboard Geral', icon: <LayoutDashboard className="w-5 h-5" />, badge: 'Completo' },
    { id: 'dashboard', label: 'Perdas PA', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'quebras-movimentacao', label: 'WQI', icon: <Boxes className="w-5 h-5" /> },
    { id: 'reposicao', label: 'Vales', icon: <FileSpreadsheet className="w-5 h-5" /> },
    { id: 'perdas-por', label: 'Avarias no Total', icon: <Layers className="w-5 h-5" /> },
    { id: 'refugo', label: 'Refugo', icon: <Recycle className="w-5 h-5" /> },
    { id: 'troca-improprio', label: 'Trocas de Produtos Impróprios', icon: <RotateCcw className="w-5 h-5" /> },
    { id: 'faltas-sobras', label: 'Inventário', icon: <Scale className="w-5 h-5" /> },
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
        className={`fixed top-0 left-0 bottom-0 w-72 bg-white/95 backdrop-blur-md border-r border-blue-200/80 text-slate-700 z-50 transition-transform duration-300 flex flex-col shadow-xl shadow-blue-900/10 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* PAU BRASIL / AMBEV Corporate Branding Header */}
        <div className="p-4 border-b border-blue-100 flex items-center justify-between bg-gradient-to-r from-blue-50/80 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/30">
              {/* Árvore / Logo Pau Brasil */}
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zm-1 18h2v2h-2v-2z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-blue-950 text-sm tracking-tight leading-tight">
                PAU BRASIL
              </span>
              <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">
                DISTRIBUIDORA <span className="text-amber-500">AMBEV</span>
              </span>
            </div>
          </div>
        </div>

        {/* User / Collaborator Quick Info */}
        <div className="px-4 py-3 bg-blue-50/50 border-b border-blue-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center">
              PB
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-bold text-blue-700 tracking-wider">Operação & Gestão</span>
              <span className="font-bold text-slate-800 text-[11px] leading-none">PACOTE PREJUÍZO</span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-300">
            ✓ ATIVO
          </span>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5 custom-scrollbar">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-700 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`${isActive ? 'text-white' : 'text-blue-500 group-hover:text-blue-700'} shrink-0`}>
                    {item.icon}
                  </span>
                  <span className="whitespace-nowrap">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-extrabold uppercase shrink-0 ${
                      isActive ? 'bg-white text-blue-700' : 'bg-blue-100 text-blue-700 border border-blue-200'
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
        <div className="p-3 border-t border-blue-100 bg-white/80 space-y-2">
          <button
            onClick={() => {
              if (confirm('Deseja restaurar os dados demonstrativos originais do sistema?')) {
                resetDemoData();
              }
            }}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-blue-200 transition-colors font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
            <span>Restaurar Dados Demo</span>
          </button>
          <div className="text-[10px] text-center text-slate-400 font-mono font-medium">
            Pau Brasil Distribuidora • v2.6
          </div>
        </div>
      </aside>
    </>
  );
};
