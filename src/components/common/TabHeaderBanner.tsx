import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface TabHeaderBannerProps {
  categoryBadge?: string;
  categoryIcon?: React.ReactNode;
  companyBadge?: string;
  title: string;
  description: React.ReactNode;
  rightContent?: React.ReactNode;
  className?: string;
}

export const TabHeaderBanner: React.FC<TabHeaderBannerProps> = ({
  categoryBadge = 'ÍNDICE DA CATEGORIA',
  categoryIcon,
  companyBadge = 'PAU BRASIL • DISTRIBUIDORA AMBEV',
  title,
  description,
  rightContent,
  className = '',
}) => {
  return (
    <div
      className={`bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-blue-900/50 rounded-3xl p-6 md:p-8 shadow-2xl shadow-blue-950/20 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 text-white relative overflow-hidden ${className}`}
    >
      {/* Glow de fundo */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="space-y-2 relative z-10">
        <div className="flex flex-wrap items-center gap-2">
          {categoryBadge && (
            <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-blue-600/30 text-blue-300 border border-blue-400/30 flex items-center gap-1.5 shadow-xs">
              {categoryIcon}
              <span>{categoryBadge}</span>
            </span>
          )}
          {companyBadge && (
            <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{companyBadge}</span>
            </span>
          )}
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
          {title}
        </h1>
        <div className="text-xs md:text-sm text-blue-200/80 max-w-4xl font-normal leading-relaxed">
          {description}
        </div>
      </div>

      {/* Ações / Filtros no canto direito */}
      {rightContent && (
        <div className="flex flex-wrap items-center gap-2.5 bg-slate-900/90 backdrop-blur-md p-2.5 rounded-2xl border border-blue-800/60 shrink-0 w-full lg:w-auto relative z-10 shadow-lg justify-start lg:justify-end">
          {rightContent}
        </div>
      )}
    </div>
  );
};
