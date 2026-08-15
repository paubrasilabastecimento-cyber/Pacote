import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { PerdaItemJSON } from '../types/perdasPor';
import { calculatePerdasPorAnalytics, getEmbalagemColor } from '../utils/perdasPorAnalytics';
import { classificarCategoriaProduto, CATEGORIAS_CONFIG } from '../utils/consumoClassifier';
import { formatCurrency } from '../utils/formatters';
import {
  ChevronRight,
  DollarSign,
  Package,
  Calendar,
  Layers,
  FolderTree,
  Tag,
  Zap,
  Droplets,
  Sparkles,
  Beer,
  X,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface PerdasPorHierarchyTreeProps {
  items: PerdaItemJSON[];
  onClose?: () => void;
  isModal?: boolean;
}

export const PerdasPorHierarchyTree: React.FC<PerdasPorHierarchyTreeProps> = ({
  items,
  onClose,
  isModal = true,
}) => {
  const [metric, setMetric] = useState<'valor' | 'quantidade'>('valor');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(true);

  // States for 5 columns:
  // Total Geral -> Mes -> Grupo -> Embalagem -> Produtos
  const [isRootOpen, setIsRootOpen] = useState<boolean>(true);
  const [selectedMesKey, setSelectedMesKey] = useState<string | null>(null);
  const [selectedGrupoKey, setSelectedGrupoKey] = useState<string | null>(null);
  const [selectedEmbKey, setSelectedEmbKey] = useState<string | null>(null);
  const [selectedProdKey, setSelectedProdKey] = useState<string | null>(null);

  // Container & Node refs for Dynamic Bezier Connectors
  const containerRef = useRef<HTMLDivElement>(null);
  const rootNodeRef = useRef<HTMLDivElement>(null);
  const mesNodesRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const grupoNodesRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const embNodesRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const prodNodesRef = useRef<Map<string, HTMLDivElement>>(new Map());

  const [lines, setLines] = useState<{
    level1: { x1: number; y1: number; x2: number; y2: number; active: boolean; id: string }[];
    level2: { x1: number; y1: number; x2: number; y2: number; active: boolean; id: string }[];
    level3: { x1: number; y1: number; x2: number; y2: number; active: boolean; id: string }[];
    level4: { x1: number; y1: number; x2: number; y2: number; active: boolean; id: string }[];
  }>({ level1: [], level2: [], level3: [], level4: [] });

  // Escape key closes the modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // 1. Global Analytics & Month Summaries
  const { stats, mesesSummary } = useMemo(() => {
    return calculatePerdasPorAnalytics(items);
  }, [items]);

  // Unique SKUs per month map
  const monthSkusCount = useMemo(() => {
    const map: Record<string, number> = {};
    mesesSummary.forEach((m) => {
      const mItems = items.filter((it) => it.dataOperacao.startsWith(m.mesKey));
      const uniqueSkus = new Set(mItems.map((it) => it.produto));
      map[m.mesKey] = uniqueSkus.size;
    });
    return map;
  }, [items, mesesSummary]);

  const totalUniqueSkus = useMemo(() => {
    return new Set(items.map((it) => it.produto)).size;
  }, [items]);

  // Items for Selected Month
  const currentMonthItems = useMemo(() => {
    if (!selectedMesKey) return [];
    return items.filter((it) => it.dataOperacao.startsWith(selectedMesKey));
  }, [items, selectedMesKey]);

  // 2. GRUPOS / CATEGORIAS (do mês selecionado)
  const monthGrupos = useMemo(() => {
    if (!selectedMesKey || currentMonthItems.length === 0) return [];
    const monthTotalVal = currentMonthItems.reduce((acc, it) => acc + (it.valor || 0), 0);
    const monthTotalQt = currentMonthItems.reduce((acc, it) => acc + (it.qtde || 0), 0);

    const map: Record<
      string,
      {
        grupo: string;
        valor: number;
        qtde: number;
        registros: number;
        skus: Set<number>;
        items: PerdaItemJSON[];
      }
    > = {};

    currentMonthItems.forEach((it) => {
      const cat = classificarCategoriaProduto(it.descricao, it.produto) || 'Outros';
      if (!map[cat]) {
        map[cat] = {
          grupo: cat,
          valor: 0,
          qtde: 0,
          registros: 0,
          skus: new Set(),
          items: [],
        };
      }
      map[cat].valor += it.valor || 0;
      map[cat].qtde += it.qtde || 0;
      map[cat].registros += 1;
      map[cat].skus.add(it.produto);
      map[cat].items.push(it);
    });

    return Object.values(map)
      .map((g) => {
        const curVal = metric === 'valor' ? g.valor : g.qtde;
        const totalBase = metric === 'valor' ? monthTotalVal : monthTotalQt;
        const pctMes = totalBase > 0 ? (curVal / totalBase) * 100 : 0;
        const pctAno = stats.valorTotal > 0 ? (g.valor / stats.valorTotal) * 100 : 0;

        return {
          grupo: g.grupo,
          valor: g.valor,
          qtde: g.qtde,
          registros: g.registros,
          skusCount: g.skus.size,
          percentualMes: pctMes,
          percentualAno: pctAno,
          items: g.items,
        };
      })
      .sort((a, b) => (metric === 'valor' ? b.valor - a.valor : b.qtde - a.qtde));
  }, [currentMonthItems, selectedMesKey, metric, stats.valorTotal]);

  // 3. EMBALAGENS (do grupo selecionado no mês selecionado)
  const grupoEmbalagens = useMemo(() => {
    if (!selectedMesKey || !selectedGrupoKey) return [];
    const grupoItems = currentMonthItems.filter(
      (it) => classificarCategoriaProduto(it.descricao, it.produto) === selectedGrupoKey
    );
    if (grupoItems.length === 0) return [];

    const grupoTotalVal = grupoItems.reduce((acc, it) => acc + (it.valor || 0), 0);
    const grupoTotalQt = grupoItems.reduce((acc, it) => acc + (it.qtde || 0), 0);

    const map: Record<
      string,
      {
        embalagem: string;
        valor: number;
        qtde: number;
        registros: number;
        skus: Set<number>;
        items: PerdaItemJSON[];
      }
    > = {};

    grupoItems.forEach((it) => {
      const emb = (it.embalagem || 'DIVERSOS').toUpperCase().trim();
      if (!map[emb]) {
        map[emb] = {
          embalagem: emb,
          valor: 0,
          qtde: 0,
          registros: 0,
          skus: new Set(),
          items: [],
        };
      }
      map[emb].valor += it.valor || 0;
      map[emb].qtde += it.qtde || 0;
      map[emb].registros += 1;
      map[emb].skus.add(it.produto);
      map[emb].items.push(it);
    });

    return Object.values(map)
      .map((e) => {
        const curVal = metric === 'valor' ? e.valor : e.qtde;
        const totalBase = metric === 'valor' ? grupoTotalVal : grupoTotalQt;
        const pctGrupo = totalBase > 0 ? (curVal / totalBase) * 100 : 0;
        const pctAno = stats.valorTotal > 0 ? (e.valor / stats.valorTotal) * 100 : 0;

        return {
          embalagem: e.embalagem,
          valor: e.valor,
          qtde: e.qtde,
          registros: e.registros,
          skusCount: e.skus.size,
          percentualGrupo: pctGrupo,
          percentualAno: pctAno,
          items: e.items,
        };
      })
      .sort((a, b) => (metric === 'valor' ? b.valor - a.valor : b.qtde - a.qtde));
  }, [currentMonthItems, selectedMesKey, selectedGrupoKey, metric, stats.valorTotal]);

  // 4. PRODUTOS (da embalagem selecionada no grupo e mês selecionados)
  const embalagemProdutos = useMemo(() => {
    if (!selectedMesKey || !selectedGrupoKey || !selectedEmbKey) return [];
    const embItems = currentMonthItems.filter(
      (it) =>
        classificarCategoriaProduto(it.descricao, it.produto) === selectedGrupoKey &&
        (it.embalagem || 'DIVERSOS').toUpperCase().trim() === selectedEmbKey
    );
    if (embItems.length === 0) return [];

    const embTotalVal = embItems.reduce((acc, it) => acc + (it.valor || 0), 0);
    const embTotalQt = embItems.reduce((acc, it) => acc + (it.qtde || 0), 0);

    const map: Record<
      number,
      {
        produto: number;
        descricao: string;
        embalagem: string;
        unidade: string;
        valor: number;
        qtde: number;
        registros: number;
        transacoes: PerdaItemJSON[];
      }
    > = {};

    embItems.forEach((it) => {
      const pid = it.produto || 0;
      if (!map[pid]) {
        map[pid] = {
          produto: pid,
          descricao: it.descricao,
          embalagem: it.embalagem,
          unidade: it.unidade,
          valor: 0,
          qtde: 0,
          registros: 0,
          transacoes: [],
        };
      }
      map[pid].valor += it.valor || 0;
      map[pid].qtde += it.qtde || 0;
      map[pid].registros += 1;
      map[pid].transacoes.push(it);
    });

    return Object.values(map)
      .map((p) => {
        const curVal = metric === 'valor' ? p.valor : p.qtde;
        const totalBase = metric === 'valor' ? embTotalVal : embTotalQt;
        const pctEmb = totalBase > 0 ? (curVal / totalBase) * 100 : 0;
        const pctAno = stats.valorTotal > 0 ? (p.valor / stats.valorTotal) * 100 : 0;

        return {
          ...p,
          percentualEmb: pctEmb,
          percentualAno: pctAno,
        };
      })
      .sort((a, b) => (metric === 'valor' ? b.valor - a.valor : b.qtde - a.qtde));
  }, [currentMonthItems, selectedMesKey, selectedGrupoKey, selectedEmbKey, metric, stats.valorTotal]);

  // Automatic selections for smooth cascading navigation
  useEffect(() => {
    if (mesesSummary.length > 0) {
      if (!selectedMesKey || !mesesSummary.some((m) => m.mesKey === selectedMesKey)) {
        const critico = mesesSummary.find((m) => m.isCritico);
        setSelectedMesKey(critico ? critico.mesKey : mesesSummary[0].mesKey);
      }
    }
  }, [mesesSummary, selectedMesKey]);

  useEffect(() => {
    if (monthGrupos.length > 0) {
      if (!selectedGrupoKey || !monthGrupos.some((g) => g.grupo === selectedGrupoKey)) {
        setSelectedGrupoKey(monthGrupos[0].grupo);
      }
    } else {
      setSelectedGrupoKey(null);
    }
  }, [monthGrupos, selectedGrupoKey]);

  useEffect(() => {
    if (grupoEmbalagens.length > 0) {
      if (!selectedEmbKey || !grupoEmbalagens.some((e) => e.embalagem === selectedEmbKey)) {
        setSelectedEmbKey(grupoEmbalagens[0].embalagem);
      }
    } else {
      setSelectedEmbKey(null);
    }
  }, [grupoEmbalagens, selectedEmbKey]);

  // Recalculate dynamic SVG connector lines across all columns
  const updateConnectorLines = useCallback(() => {
    if (!containerRef.current || !rootNodeRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();

    const getAnchorRight = (el: HTMLElement) => {
      const rect = el.getBoundingClientRect();
      return {
        x: rect.right - containerRect.left + containerRef.current!.scrollLeft,
        y: rect.top + rect.height / 2 - containerRect.top + containerRef.current!.scrollTop,
      };
    };

    const getAnchorLeft = (el: HTMLElement) => {
      const rect = el.getBoundingClientRect();
      return {
        x: rect.left - containerRect.left + containerRef.current!.scrollLeft,
        y: rect.top + rect.height / 2 - containerRect.top + containerRef.current!.scrollTop,
      };
    };

    const rootAnchor = getAnchorRight(rootNodeRef.current);

    // Root -> Months
    const l1: { x1: number; y1: number; x2: number; y2: number; active: boolean; id: string }[] = [];
    if (isRootOpen) {
      mesNodesRef.current.forEach((el, mesKey) => {
        if (el) {
          const childAnchor = getAnchorLeft(el);
          l1.push({
            x1: rootAnchor.x,
            y1: rootAnchor.y,
            x2: childAnchor.x,
            y2: childAnchor.y,
            active: mesKey === selectedMesKey,
            id: `root-${mesKey}`,
          });
        }
      });
    }

    // Selected Month -> Grupos
    const l2: { x1: number; y1: number; x2: number; y2: number; active: boolean; id: string }[] = [];
    if (isRootOpen && selectedMesKey) {
      const selMesEl = mesNodesRef.current.get(selectedMesKey);
      if (selMesEl) {
        const mesAnchor = getAnchorRight(selMesEl);
        grupoNodesRef.current.forEach((el, grpKey) => {
          if (el) {
            const childAnchor = getAnchorLeft(el);
            l2.push({
              x1: mesAnchor.x,
              y1: mesAnchor.y,
              x2: childAnchor.x,
              y2: childAnchor.y,
              active: grpKey === selectedGrupoKey,
              id: `${selectedMesKey}-${grpKey}`,
            });
          }
        });
      }
    }

    // Selected Grupo -> Embalagens
    const l3: { x1: number; y1: number; x2: number; y2: number; active: boolean; id: string }[] = [];
    if (isRootOpen && selectedMesKey && selectedGrupoKey) {
      const selGrpEl = grupoNodesRef.current.get(selectedGrupoKey);
      if (selGrpEl) {
        const grpAnchor = getAnchorRight(selGrpEl);
        embNodesRef.current.forEach((el, embKey) => {
          if (el) {
            const childAnchor = getAnchorLeft(el);
            l3.push({
              x1: grpAnchor.x,
              y1: grpAnchor.y,
              x2: childAnchor.x,
              y2: childAnchor.y,
              active: embKey === selectedEmbKey,
              id: `${selectedGrupoKey}-${embKey}`,
            });
          }
        });
      }
    }

    // Selected Embalagem -> Produtos
    const l4: { x1: number; y1: number; x2: number; y2: number; active: boolean; id: string }[] = [];
    if (isRootOpen && selectedMesKey && selectedGrupoKey && selectedEmbKey) {
      const selEmbEl = embNodesRef.current.get(selectedEmbKey);
      if (selEmbEl) {
        const embAnchor = getAnchorRight(selEmbEl);
        prodNodesRef.current.forEach((el, prodId) => {
          if (el) {
            const childAnchor = getAnchorLeft(el);
            l4.push({
              x1: embAnchor.x,
              y1: embAnchor.y,
              x2: childAnchor.x,
              y2: childAnchor.y,
              active: prodId === selectedProdKey,
              id: `${selectedEmbKey}-${prodId}`,
            });
          }
        });
      }
    }

    setLines({ level1: l1, level2: l2, level3: l3, level4: l4 });
  }, [isRootOpen, selectedMesKey, selectedGrupoKey, selectedEmbKey, selectedProdKey]);

  useEffect(() => {
    const handleUpdate = () => {
      requestAnimationFrame(updateConnectorLines);
    };

    const timer1 = setTimeout(handleUpdate, 60);
    const timer2 = setTimeout(handleUpdate, 250);
    window.addEventListener('resize', handleUpdate);

    let resizeObserver: ResizeObserver | null = null;
    if (containerRef.current && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        requestAnimationFrame(updateConnectorLines);
      });
      resizeObserver.observe(containerRef.current);
    }

    const contEl = containerRef.current;
    if (contEl) {
      contEl.addEventListener('scroll', handleUpdate, { passive: true });
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener('resize', handleUpdate);
      if (contEl) {
        contEl.removeEventListener('scroll', handleUpdate);
      }
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [
    updateConnectorLines,
    mesesSummary,
    monthGrupos,
    grupoEmbalagens,
    embalagemProdutos,
    selectedMesKey,
    selectedGrupoKey,
    selectedEmbKey,
    isRootOpen,
    metric,
  ]);

  const renderBezier = (x1: number, y1: number, x2: number, y2: number) => {
    const deltaX = (x2 - x1) * 0.5;
    return `M ${x1} ${y1} C ${x1 + deltaX} ${y1}, ${x2 - deltaX} ${y2}, ${x2} ${y2}`;
  };

  const getGrupoIcon = (grupoName: string) => {
    switch (grupoName) {
      case 'Cerveja':
        return <Beer className="w-3.5 h-3.5" />;
      case 'Refrigerante':
        return <Sparkles className="w-3.5 h-3.5" />;
      case 'Energético':
        return <Zap className="w-3.5 h-3.5" />;
      case 'Água':
        return <Droplets className="w-3.5 h-3.5" />;
      default:
        return <FolderTree className="w-3.5 h-3.5" />;
    }
  };

  const selectedMonthObj = mesesSummary.find((m) => m.mesKey === selectedMesKey);

  const containerClasses = isModal
    ? 'fixed inset-0 z-50 w-screen h-screen bg-slate-950 p-3 sm:p-5 flex flex-col justify-between overflow-hidden shadow-2xl backdrop-blur-md'
    : `w-full bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl relative transition-all duration-300 ${
        isFullscreen
          ? 'fixed inset-0 z-50 p-4 sm:p-6 bg-slate-950 overflow-hidden flex flex-col justify-between'
          : 'p-3 sm:p-5 overflow-hidden'
      }`;

  return (
    <div id="perdas-por-hierarchy-tree" className={containerClasses}>
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-2 border-b border-slate-800/80 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
            <FolderTree className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-base font-black text-white tracking-wide flex flex-wrap items-center gap-2">
              <span>ÁRVORE DE HIERARQUIA DE PERDAS</span>
              <span className="text-slate-400 font-normal text-xs hidden md:inline">
                (Total Geral → Mês → Grupo → Embalagem → Produtos)
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                1366 × 768
              </span>
              {selectedMonthObj?.isCritico && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  Mês com Maior Perda
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400">
              Clique nos cards de cada coluna para navegar e filtrar instantaneamente até o produto
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Metric Selector */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-[11px]">
            <button
              onClick={() => setMetric('valor')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                metric === 'valor'
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>R$ Prejuízo</span>
            </button>
            <button
              onClick={() => setMetric('quantidade')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                metric === 'quantidade'
                  ? 'bg-sky-500 text-slate-950 shadow-sm font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Quantidade (un)</span>
            </button>
          </div>

          {/* Fullscreen toggle button if not in pure modal mode */}
          {!isModal && (
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition-all cursor-pointer shadow-sm"
              title={isFullscreen ? 'Sair da Tela Cheia' : 'Expandir Tela Cheia'}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sair</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Tela Cheia</span>
                </>
              )}
            </button>
          )}

          {/* Close Button if onClose passed */}
          {onClose && (
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold text-xs transition-all cursor-pointer shadow-sm ml-1"
              title="Fechar Árvore (Esc)"
            >
              <X className="w-4 h-4" />
              <span>Fechar (Esc)</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Horizontal Flow Canvas with Dynamic SVG Lines */}
      <div
        ref={containerRef}
        className="relative overflow-x-auto no-scrollbar py-2 px-1 select-none w-full flex-1 min-h-[520px] max-h-[calc(100vh-95px)] flex flex-col justify-center"
        style={{ scrollBehavior: 'smooth' }}
      >
        {/* SVG Curved Connectors */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
          <defs>
            <filter id="treeGlowAmber" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="treeGlowSky" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Root -> Meses */}
          {lines.level1.map((l) => (
            <path
              key={l.id}
              d={renderBezier(l.x1, l.y1, l.x2, l.y2)}
              fill="none"
              stroke={l.active ? '#f59e0b' : '#334155'}
              strokeWidth={l.active ? 2.5 : 1.2}
              strokeOpacity={l.active ? 1 : 0.4}
              filter={l.active ? 'url(#treeGlowAmber)' : undefined}
            />
          ))}

          {/* Mes -> Grupos */}
          {lines.level2.map((l) => (
            <path
              key={l.id}
              d={renderBezier(l.x1, l.y1, l.x2, l.y2)}
              fill="none"
              stroke={l.active ? '#f59e0b' : '#334155'}
              strokeWidth={l.active ? 2.5 : 1.2}
              strokeOpacity={l.active ? 1 : 0.4}
              filter={l.active ? 'url(#treeGlowAmber)' : undefined}
            />
          ))}

          {/* Grupo -> Embalagens */}
          {lines.level3.map((l) => (
            <path
              key={l.id}
              d={renderBezier(l.x1, l.y1, l.x2, l.y2)}
              fill="none"
              stroke={l.active ? '#38bdf8' : '#334155'}
              strokeWidth={l.active ? 2.5 : 1.2}
              strokeOpacity={l.active ? 1 : 0.4}
              filter={l.active ? 'url(#treeGlowSky)' : undefined}
            />
          ))}

          {/* Embalagem -> Produtos */}
          {lines.level4.map((l) => (
            <path
              key={l.id}
              d={renderBezier(l.x1, l.y1, l.x2, l.y2)}
              fill="none"
              stroke={l.active ? '#34d399' : '#334155'}
              strokeWidth={l.active ? 2.5 : 1.2}
              strokeOpacity={l.active ? 1 : 0.4}
            />
          ))}
        </svg>

        {/* Responsive 5 Columns spanning full screen width up to the right edge (close button boundary) */}
        <div className="flex items-stretch justify-between gap-3 sm:gap-4 md:gap-6 relative z-20 w-full h-full">
          {/* ========================================================
              COLUNA 1: TOTAL GERAL DE PERDAS
             ======================================================== */}
          <div className="flex-1 min-w-[150px] max-w-[210px] shrink-0 flex flex-col justify-center items-center">
            <div
              ref={rootNodeRef}
              className={`w-full bg-slate-900/95 border-2 rounded-xl p-3 shadow-xl relative transition-all text-center ${
                isRootOpen
                  ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-amber-500/10'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="absolute top-0 right-0 w-12 h-12 bg-amber-500/5 rounded-full blur-lg pointer-events-none" />

              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase tracking-wider font-black text-amber-400 flex items-center gap-1">
                  <Layers className="w-3 h-3" />
                  Total de Perdas
                </span>
                <div className="text-[9px] font-mono text-slate-400">
                  100% dos Lançamentos
                </div>
                <div className="text-base sm:text-lg font-black text-white font-mono mt-0.5">
                  {formatCurrency(stats.valorTotal)}
                </div>
                <div className="text-[11px] font-mono text-sky-400 font-bold">
                  {stats.qtdeTotal.toLocaleString('pt-BR')} un
                </div>

                <div className="w-full mt-2 pt-2 border-t border-slate-800/90 space-y-1 text-[10px] text-slate-300 font-mono text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Lançamentos:</span>
                    <span className="font-bold text-white">{stats.totalRegistros}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Meses:</span>
                    <span className="font-bold text-amber-400">{mesesSummary.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Produtos:</span>
                    <span className="font-bold text-emerald-400">{totalUniqueSkus} SKUs</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Ticket Méd.:</span>
                    <span className="font-bold text-slate-200">
                      {formatCurrency(stats.valorTotal / Math.max(1, stats.totalRegistros))}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setIsRootOpen(!isRootOpen)}
                  className={`mt-2.5 w-full flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer shadow-sm ${
                    isRootOpen
                      ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 font-black'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  }`}
                >
                  <span>{isRootOpen ? 'Meses (Abertos)' : 'Abrir Meses'}</span>
                  <ChevronRight
                    className={`w-3 h-3 transition-transform duration-300 ${
                      isRootOpen ? 'rotate-90' : ''
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* ========================================================
              COLUNA 2: MÊS
             ======================================================== */}
          {isRootOpen && (
            <div className="flex-1 min-w-[170px] max-w-[250px] shrink-0 flex flex-col space-y-1.5 h-full">
              <div className="flex items-center justify-between pb-1 border-b border-amber-500/50 shrink-0">
                <span className="text-[11px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Mês
                </span>
                <span className="text-[9px] font-mono text-slate-400">
                  {mesesSummary.length} meses
                </span>
              </div>

              <div className="space-y-1.5 flex-1 overflow-y-auto no-scrollbar pr-0.5">
                {mesesSummary.map((mes) => {
                  const isSelected = mes.mesKey === selectedMesKey;
                  const pctDoTotal = (mes.valorTotal / (stats.valorTotal || 1)) * 100;
                  const skusNoMes = monthSkusCount[mes.mesKey] || 0;

                  return (
                    <div
                      key={mes.mesKey}
                      ref={(el) => {
                        if (el) mesNodesRef.current.set(mes.mesKey, el);
                        else mesNodesRef.current.delete(mes.mesKey);
                      }}
                      onClick={() => {
                        setSelectedMesKey(mes.mesKey);
                        setSelectedProdKey(null);
                      }}
                      className={`rounded-xl p-2.5 border transition-all cursor-pointer relative group ${
                        isSelected
                          ? mes.isCritico
                            ? 'bg-slate-900 border-rose-500 shadow-lg shadow-rose-500/20 ring-1 ring-rose-500/50'
                            : 'bg-slate-900 border-amber-500 shadow-lg shadow-amber-500/20 ring-1 ring-amber-500/50'
                          : 'bg-slate-900/70 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/90'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="min-w-0 flex-1">
                          {/* Title & Badge */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4
                              className={`text-xs font-bold truncate ${
                                isSelected ? 'text-white' : 'text-slate-200'
                              }`}
                            >
                              {mes.mesNome}
                            </h4>
                            {mes.isCritico && (
                              <span className="px-1 py-0.2 rounded text-[8px] font-black uppercase tracking-wider bg-rose-500 text-white leading-tight">
                                Maior Perda
                              </span>
                            )}
                          </div>

                          {/* Values */}
                          <div className="flex items-baseline justify-between mt-1">
                            <span className="text-xs sm:text-sm font-black text-amber-400 font-mono">
                              {formatCurrency(mes.valorTotal)}
                            </span>
                            <span className="text-[10px] font-mono font-bold text-sky-400">
                              {mes.qtdeTotal.toLocaleString('pt-BR')} un
                            </span>
                          </div>

                          {/* Compact Metrics Row */}
                          <div className="mt-1.5 pt-1 border-t border-slate-800/80 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                            <span>
                              Reg: <strong className="text-slate-200">{mes.registros}</strong>
                            </span>
                            <span>
                              SKUs: <strong className="text-emerald-400">{skusNoMes}</strong>
                            </span>
                            <span>
                              Share: <strong className="text-amber-400">{pctDoTotal.toFixed(1)}%</strong>
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMesKey(mes.mesKey);
                            setSelectedProdKey(null);
                          }}
                          className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all cursor-pointer mt-0.5 ${
                            isSelected
                              ? mes.isCritico
                                ? 'bg-rose-500 text-white shadow-sm font-black'
                                : 'bg-amber-500 text-slate-950 shadow-sm font-black'
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                          }`}
                        >
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================
              COLUNA 3: GRUPO
             ======================================================== */}
          {isRootOpen && selectedMesKey && (
            <div className="flex-1 min-w-[170px] max-w-[250px] shrink-0 flex flex-col space-y-1.5 h-full">
              <div className="flex items-center justify-between pb-1 border-b border-amber-500/50 shrink-0">
                <span className="text-[11px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1">
                  <FolderTree className="w-3 h-3" />
                  Grupo
                </span>
                <span className="text-[9px] font-mono text-slate-400">
                  {monthGrupos.length} grupos
                </span>
              </div>

              <div className="space-y-1.5 flex-1 overflow-y-auto no-scrollbar pr-0.5">
                {monthGrupos.length === 0 ? (
                  <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-400">
                    Nenhum grupo encontrado
                  </div>
                ) : (
                  monthGrupos.map((grp) => {
                    const isSelected = grp.grupo === selectedGrupoKey;
                    const catConfig = CATEGORIAS_CONFIG[grp.grupo as any] || CATEGORIAS_CONFIG['Outros'];

                    return (
                      <div
                        key={grp.grupo}
                        ref={(el) => {
                          if (el) grupoNodesRef.current.set(grp.grupo, el);
                          else grupoNodesRef.current.delete(grp.grupo);
                        }}
                        onClick={() => {
                          setSelectedGrupoKey(grp.grupo);
                          setSelectedProdKey(null);
                        }}
                        className={`rounded-xl p-2.5 border transition-all cursor-pointer relative group ${
                          isSelected
                            ? 'bg-slate-900 border-amber-500 shadow-lg shadow-amber-500/20 ring-1 ring-amber-500/50'
                            : 'bg-slate-900/70 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/90'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="min-w-0 flex-1">
                            {/* Group Name & Icon */}
                            <div className="flex items-center gap-1.5">
                              <span
                                className="p-0.5 rounded"
                                style={{
                                  backgroundColor: `${catConfig?.color || '#f59e0b'}20`,
                                  color: catConfig?.color || '#f59e0b',
                                }}
                              >
                                {getGrupoIcon(grp.grupo)}
                              </span>
                              <h4
                                className={`text-xs font-bold truncate ${
                                  isSelected ? 'text-white' : 'text-slate-200'
                                }`}
                              >
                                {grp.grupo}
                              </h4>
                            </div>

                            {/* Values */}
                            <div className="flex items-baseline justify-between mt-1">
                              <span className="text-xs sm:text-sm font-black text-amber-400 font-mono">
                                {formatCurrency(grp.valor)}
                              </span>
                              <span className="text-[10px] font-mono font-bold text-sky-400">
                                {grp.qtde.toLocaleString('pt-BR')} un
                              </span>
                            </div>

                            {/* Compact Metrics Row */}
                            <div className="mt-1.5 pt-1 border-t border-slate-800/80 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                              <span>
                                Share: <strong className="text-amber-400">{grp.percentualMes.toFixed(1)}%</strong>
                              </span>
                              <span>
                                SKUs: <strong className="text-emerald-400">{grp.skusCount}</strong>
                              </span>
                              <span>
                                Ano: <strong className="text-purple-300">{grp.percentualAno.toFixed(1)}%</strong>
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedGrupoKey(grp.grupo);
                              setSelectedProdKey(null);
                            }}
                            className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all cursor-pointer mt-0.5 ${
                              isSelected
                                ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                            }`}
                          >
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ========================================================
              COLUNA 4: EMBALAGEM
             ======================================================== */}
          {isRootOpen && selectedMesKey && selectedGrupoKey && (
            <div className="flex-1 min-w-[170px] max-w-[250px] shrink-0 flex flex-col space-y-1.5 h-full">
              <div className="flex items-center justify-between pb-1 border-b border-sky-500/50 shrink-0">
                <span className="text-[11px] font-black text-sky-400 uppercase tracking-wider flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  Embalagem
                </span>
                <span className="text-[9px] font-mono text-slate-400">
                  {grupoEmbalagens.length} tipos
                </span>
              </div>

              <div className="space-y-1.5 flex-1 overflow-y-auto no-scrollbar pr-0.5">
                {grupoEmbalagens.length === 0 ? (
                  <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-400">
                    Nenhuma embalagem encontrada
                  </div>
                ) : (
                  grupoEmbalagens.map((emb) => {
                    const isSelected = emb.embalagem === selectedEmbKey;
                    const embColor = getEmbalagemColor(emb.embalagem);

                    return (
                      <div
                        key={emb.embalagem}
                        ref={(el) => {
                          if (el) embNodesRef.current.set(emb.embalagem, el);
                          else embNodesRef.current.delete(emb.embalagem);
                        }}
                        onClick={() => {
                          setSelectedEmbKey(emb.embalagem);
                          setSelectedProdKey(null);
                        }}
                        className={`rounded-xl p-2.5 border transition-all cursor-pointer relative group ${
                          isSelected
                            ? 'bg-slate-900 border-sky-500 shadow-lg shadow-sky-500/20 ring-1 ring-sky-500/50'
                            : 'bg-slate-900/70 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/90'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="min-w-0 flex-1">
                            {/* Packaging Badge */}
                            <div className="flex items-center gap-1.5">
                              <span
                                className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider truncate max-w-[130px]"
                                style={{
                                  backgroundColor: `${embColor}20`,
                                  color: embColor,
                                  border: `1px solid ${embColor}40`,
                                }}
                              >
                                {emb.embalagem}
                              </span>
                            </div>

                            {/* Values */}
                            <div className="flex items-baseline justify-between mt-1">
                              <span className="text-xs sm:text-sm font-black text-amber-400 font-mono">
                                {formatCurrency(emb.valor)}
                              </span>
                              <span className="text-[10px] font-mono font-bold text-sky-400">
                                {emb.qtde.toLocaleString('pt-BR')} un
                              </span>
                            </div>

                            {/* Compact Metrics Row */}
                            <div className="mt-1.5 pt-1 border-t border-slate-800/80 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                              <span>
                                No Grupo: <strong className="text-sky-400">{emb.percentualGrupo.toFixed(1)}%</strong>
                              </span>
                              <span>
                                SKUs: <strong className="text-emerald-400">{emb.skusCount}</strong>
                              </span>
                              <span>
                                Ano: <strong className="text-purple-300">{emb.percentualAno.toFixed(1)}%</strong>
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEmbKey(emb.embalagem);
                              setSelectedProdKey(null);
                            }}
                            className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all cursor-pointer mt-0.5 ${
                              isSelected
                                ? 'bg-sky-500 text-slate-950 shadow-sm font-black'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                            }`}
                          >
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ========================================================
              COLUNA 5: PRODUTOS
             ======================================================== */}
          {isRootOpen && selectedMesKey && selectedGrupoKey && selectedEmbKey && (
            <div className="flex-1 min-w-[180px] max-w-[280px] shrink-0 flex flex-col space-y-1.5 h-full">
              <div className="flex items-center justify-between pb-1 border-b border-emerald-500/50 shrink-0">
                <span className="text-[11px] font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  <Package className="w-3 h-3" />
                  Produtos ({selectedEmbKey})
                </span>
                <span className="text-[9px] font-mono text-slate-400">
                  {embalagemProdutos.length} produtos
                </span>
              </div>

              <div className="space-y-1.5 flex-1 overflow-y-auto no-scrollbar pr-0.5">
                {embalagemProdutos.length === 0 ? (
                  <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-400">
                    Nenhum produto registrado para esta embalagem
                  </div>
                ) : (
                  embalagemProdutos.map((prod) => {
                    const isSelected = selectedProdKey === String(prod.produto);
                    const embColor = getEmbalagemColor(prod.embalagem);
                    const precoMedioUnitario = prod.valor / Math.max(1, prod.qtde);

                    return (
                      <div
                        key={prod.produto}
                        ref={(el) => {
                          if (el) prodNodesRef.current.set(String(prod.produto), el);
                          else prodNodesRef.current.delete(String(prod.produto));
                        }}
                        onClick={() => setSelectedProdKey(isSelected ? null : String(prod.produto))}
                        className={`rounded-xl p-2 border transition-all cursor-pointer relative group ${
                          isSelected
                            ? 'bg-slate-900 border-emerald-500 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/40'
                            : 'bg-slate-900/70 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/90'
                        }`}
                      >
                        <div className="flex flex-col gap-1">
                          {/* Header: Title + Packaging badge */}
                          <div className="flex items-start justify-between gap-1">
                            <h4
                              className={`text-[11px] font-bold leading-tight truncate flex-1 ${
                                isSelected ? 'text-white' : 'text-slate-200'
                              }`}
                              title={prod.descricao}
                            >
                              {prod.descricao}
                            </h4>
                            <span
                              className="px-1.5 py-0.2 rounded text-[8px] font-bold uppercase tracking-wider shrink-0"
                              style={{
                                backgroundColor: `${embColor}20`,
                                color: embColor,
                                border: `1px solid ${embColor}40`,
                              }}
                            >
                              {prod.embalagem}
                            </span>
                          </div>

                          {/* Values: Total and Quantity */}
                          <div className="flex items-baseline justify-between">
                            <span className="text-xs sm:text-[13px] font-black text-amber-400 font-mono">
                              {formatCurrency(prod.valor)}
                            </span>
                            <span className="text-[10px] font-mono font-bold text-sky-400">
                              {prod.qtde} {prod.unidade}
                            </span>
                          </div>

                          {/* Compact Metrics Row */}
                          <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                            <span>
                              Cód: <strong className="text-amber-400">{prod.produto}</strong>
                            </span>
                            <span>
                              Emb: <strong className="text-sky-400">{prod.percentualEmb.toFixed(1)}%</strong>
                            </span>
                            <span>
                              Méd: <strong className="text-slate-200">{formatCurrency(precoMedioUnitario)}</strong>
                            </span>
                          </div>

                          {/* Expanded transaction details drawer if selected */}
                          {isSelected && prod.transacoes && prod.transacoes.length > 0 && (
                            <div className="mt-1.5 pt-1.5 border-t border-slate-800 space-y-1">
                              <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                <span>Lançamentos ({prod.transacoes.length})</span>
                                <span className="text-amber-400 text-[8px]">Fechar</span>
                              </div>
                              <div className="max-h-24 overflow-y-auto no-scrollbar space-y-1">
                                {prod.transacoes.map((tx, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between text-[8.5px] font-mono p-1 rounded bg-slate-900 border border-slate-800"
                                  >
                                    <div className="text-slate-300">
                                      <span>{tx.dataOperacao}</span>
                                      {tx.emissao && (
                                        <span className="text-slate-500 ml-1">
                                          • {tx.emissao}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-sky-300 font-semibold">
                                        {tx.qtde} {tx.unidade}
                                      </span>
                                      <span className="text-emerald-400 font-bold">
                                        {formatCurrency(tx.valor || 0)}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
