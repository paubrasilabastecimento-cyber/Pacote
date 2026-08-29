import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { ItemPlanilha } from '../utils/spreadsheetAnalyzer';
import { formatCurrency } from '../utils/formatters';
import { useApp } from '../context/AppContext';
import {
  ChevronRight,
  ChevronLeft,
  DollarSign,
  Package,
  Maximize2,
  Minimize2,
  ExternalLink,
  X,
} from 'lucide-react';

interface DecompositionTreeProps {
  itens: ItemPlanilha[];
}

interface TreeNodeData {
  id: string;
  label: string;
  sublabel?: string;
  valor: number;
  quantidade: number;
  percentual: number;
  percentualTotal: number;
  registros: number;
}

export const DecompositionTree: React.FC<DecompositionTreeProps> = ({ itens }) => {
  const { activeTab, setActiveTab } = useApp();
  // Metric toggle: 'valor' (R$) or 'quantidade' (unidades)
  const [metric, setMetric] = useState<'valor' | 'quantidade'>('valor');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Interactive arrow-based tree expansion states
  const [isRootOpen, setIsRootOpen] = useState<boolean>(true);
  const [selectedCategoria, setSelectedCategoria] = useState<string | null>(null);
  const [selectedMarca, setSelectedMarca] = useState<string | null>(null);
  const [selectedProduto, setSelectedProduto] = useState<string | null>(null);

  // Limit per column to keep the view tight and clean
  const [limitCat, setLimitCat] = useState<number>(6);
  const [limitMarca, setLimitMarca] = useState<number>(6);
  const [limitProd, setLimitProd] = useState<number>(8);

  // Container refs for dynamic SVG connector lines
  const containerRef = useRef<HTMLDivElement>(null);
  const rootNodeRef = useRef<HTMLDivElement>(null);
  const catNodesRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const marcaNodesRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const prodNodesRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const isInitializedRef = useRef<boolean>(false);

  const colCatRef = useRef<HTMLDivElement>(null);
  const colMarcaRef = useRef<HTMLDivElement>(null);
  const colProdRef = useRef<HTMLDivElement>(null);

  const [lines, setLines] = useState<{
    level1: { x1: number; y1: number; x2: number; y2: number; active: boolean; id: string }[];
    level2: { x1: number; y1: number; x2: number; y2: number; active: boolean; id: string }[];
    level3: { x1: number; y1: number; x2: number; y2: number; active: boolean; id: string }[];
  }>({ level1: [], level2: [], level3: [] });

  // 1. Calculate Totals
  const totalBase = useMemo(() => {
    const valor = itens.reduce((acc, i) => acc + (i.valor || 0), 0);
    const quantidade = itens.reduce((acc, i) => acc + (i.quantidade || 0), 0);
    return {
      valor,
      quantidade,
      registros: itens.length,
    };
  }, [itens]);

  // 2. Group by Categoria (Level 1)
  const categoriasList = useMemo(() => {
    const map: Record<string, { valor: number; quantidade: number; registros: number }> = {};
    itens.forEach((item) => {
      const cat = item.categoria || 'Outros';
      if (!map[cat]) map[cat] = { valor: 0, quantidade: 0, registros: 0 };
      map[cat].valor += item.valor || 0;
      map[cat].quantidade += item.quantidade || 0;
      map[cat].registros += 1;
    });

    const list: TreeNodeData[] = Object.entries(map).map(([cat, d]) => {
      const metricVal = metric === 'valor' ? d.valor : d.quantidade;
      const totalMetric = metric === 'valor' ? totalBase.valor : totalBase.quantidade;
      const pct = totalMetric > 0 ? (metricVal / totalMetric) * 100 : 0;
      const pctTotal = totalBase.valor > 0 ? (d.valor / totalBase.valor) * 100 : 0;
      return {
        id: cat,
        label: cat,
        valor: d.valor,
        quantidade: d.quantidade,
        percentual: pct,
        percentualTotal: pctTotal,
        registros: d.registros,
      };
    });

    return list.sort((a, b) => {
      return metric === 'valor' ? b.valor - a.valor : b.quantidade - a.quantidade;
    });
  }, [itens, metric, totalBase]);

  // Maintain active category selection so tree is never left with an empty right side
  useEffect(() => {
    if (categoriasList.length > 0) {
      if (!selectedCategoria || !categoriasList.some((c) => c.id === selectedCategoria)) {
        setSelectedCategoria(categoriasList[0].id);
      }
    }
  }, [categoriasList, selectedCategoria]);

  // 3. Group by Marca for Selected Categoria (Level 2)
  const marcasList = useMemo(() => {
    if (!selectedCategoria) return [];
    const catItens = itens.filter((i) => (i.categoria || 'Outros') === selectedCategoria);
    const catTotalVal = catItens.reduce((acc, i) => acc + (i.valor || 0), 0);
    const catTotalQtd = catItens.reduce((acc, i) => acc + (i.quantidade || 0), 0);

    const map: Record<string, { valor: number; quantidade: number; registros: number }> = {};
    catItens.forEach((item) => {
      const m = item.marca || 'Outras';
      if (!map[m]) map[m] = { valor: 0, quantidade: 0, registros: 0 };
      map[m].valor += item.valor || 0;
      map[m].quantidade += item.quantidade || 0;
      map[m].registros += 1;
    });

    const list: TreeNodeData[] = Object.entries(map).map(([marca, d]) => {
      const metricVal = metric === 'valor' ? d.valor : d.quantidade;
      const catMetric = metric === 'valor' ? catTotalVal : catTotalQtd;
      const pct = catMetric > 0 ? (metricVal / catMetric) * 100 : 0;
      const pctTotal = totalBase.valor > 0 ? (d.valor / totalBase.valor) * 100 : 0;
      return {
        id: marca,
        label: marca,
        valor: d.valor,
        quantidade: d.quantidade,
        percentual: pct,
        percentualTotal: pctTotal,
        registros: d.registros,
      };
    });

    return list.sort((a, b) => {
      return metric === 'valor' ? b.valor - a.valor : b.quantidade - a.quantidade;
    });
  }, [itens, selectedCategoria, metric, totalBase]);

  // Maintain active brand selection for the current category
  useEffect(() => {
    if (selectedCategoria && marcasList.length > 0) {
      if (!selectedMarca || !marcasList.some((m) => m.id === selectedMarca)) {
        setSelectedMarca(marcasList[0].id);
      }
    }
  }, [selectedCategoria, marcasList, selectedMarca]);

  // 4. Group by Produto for Selected Marca (Level 3)
  const produtosList = useMemo(() => {
    if (!selectedCategoria || !selectedMarca) return [];
    const marcaItens = itens.filter(
      (i) => (i.categoria || 'Outros') === selectedCategoria && (i.marca || 'Outras') === selectedMarca
    );
    const marcaTotalVal = marcaItens.reduce((acc, i) => acc + (i.valor || 0), 0);
    const marcaTotalQtd = marcaItens.reduce((acc, i) => acc + (i.quantidade || 0), 0);

    const map: Record<
      string,
      { codProduto: string; descricao: string; unidade: string; valor: number; quantidade: number; registros: number }
    > = {};
    marcaItens.forEach((item) => {
      const key = item.codProduto || item.descricao;
      if (!map[key]) {
        map[key] = {
          codProduto: item.codProduto,
          descricao: item.descricao,
          unidade: item.unidade,
          valor: 0,
          quantidade: 0,
          registros: 0,
        };
      }
      map[key].valor += item.valor || 0;
      map[key].quantidade += item.quantidade || 0;
      map[key].registros += 1;
    });

    const list: TreeNodeData[] = Object.values(map).map((p) => {
      const metricVal = metric === 'valor' ? p.valor : p.quantidade;
      const marcaMetric = metric === 'valor' ? marcaTotalVal : marcaTotalQtd;
      const pct = marcaMetric > 0 ? (metricVal / marcaMetric) * 100 : 0;
      const pctTotal = totalBase.valor > 0 ? (p.valor / totalBase.valor) * 100 : 0;
      return {
        id: p.codProduto,
        label: p.descricao,
        sublabel: `Cód. ${p.codProduto} • ${p.unidade}`,
        valor: p.valor,
        quantidade: p.quantidade,
        percentual: pct,
        percentualTotal: pctTotal,
        registros: p.registros,
      };
    });

    return list.sort((a, b) => {
      return metric === 'valor' ? b.valor - a.valor : b.quantidade - a.quantidade;
    });
  }, [itens, selectedCategoria, selectedMarca, metric, totalBase]);

  // Max values for bar progression
  const maxCatMetric = useMemo(() => {
    return Math.max(...categoriasList.map((c) => (metric === 'valor' ? c.valor : c.quantidade)), 1);
  }, [categoriasList, metric]);

  const maxMarcaMetric = useMemo(() => {
    return Math.max(...marcasList.map((m) => (metric === 'valor' ? m.valor : m.quantidade)), 1);
  }, [marcasList, metric]);

  const maxProdMetric = useMemo(() => {
    return Math.max(...produtosList.map((p) => (metric === 'valor' ? p.valor : p.quantidade)), 1);
  }, [produtosList, metric]);

  // Recalculate SVG connector lines on DOM changes
  const updateConnectorLines = useCallback(() => {
    if (!containerRef.current || !rootNodeRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();

    const getAnchorRight = (el: HTMLElement) => {
      const rect = el.getBoundingClientRect();
      return {
        x: rect.right - containerRect.left,
        y: rect.top + rect.height / 2 - containerRect.top,
      };
    };

    const getAnchorLeft = (el: HTMLElement) => {
      const rect = el.getBoundingClientRect();
      return {
        x: rect.left - containerRect.left,
        y: rect.top + rect.height / 2 - containerRect.top,
      };
    };

    const rootAnchor = getAnchorRight(rootNodeRef.current);

    // Level 1 Lines (Root -> Categorias)
    const l1: { x1: number; y1: number; x2: number; y2: number; active: boolean; id: string }[] = [];
    if (isRootOpen) {
      catNodesRef.current.forEach((el, catId) => {
        if (el) {
          const childAnchor = getAnchorLeft(el);
          l1.push({
            x1: rootAnchor.x,
            y1: rootAnchor.y,
            x2: childAnchor.x,
            y2: childAnchor.y,
            active: catId === selectedCategoria,
            id: `root-${catId}`,
          });
        }
      });
    }

    // Level 2 Lines (Selected Categoria -> Marcas)
    const l2: { x1: number; y1: number; x2: number; y2: number; active: boolean; id: string }[] = [];
    if (isRootOpen && selectedCategoria) {
      const selectedCatEl = catNodesRef.current.get(selectedCategoria);
      if (selectedCatEl) {
        const catAnchor = getAnchorRight(selectedCatEl);
        marcaNodesRef.current.forEach((el, marcaId) => {
          if (el) {
            const childAnchor = getAnchorLeft(el);
            l2.push({
              x1: catAnchor.x,
              y1: catAnchor.y,
              x2: childAnchor.x,
              y2: childAnchor.y,
              active: marcaId === selectedMarca,
              id: `${selectedCategoria}-${marcaId}`,
            });
          }
        });
      }
    }

    // Level 3 Lines (Selected Marca -> Produtos)
    const l3: { x1: number; y1: number; x2: number; y2: number; active: boolean; id: string }[] = [];
    if (isRootOpen && selectedCategoria && selectedMarca) {
      const selectedMarcaEl = marcaNodesRef.current.get(selectedMarca);
      if (selectedMarcaEl) {
        const marcaAnchor = getAnchorRight(selectedMarcaEl);
        prodNodesRef.current.forEach((el, prodId) => {
          if (el) {
            const childAnchor = getAnchorLeft(el);
            l3.push({
              x1: marcaAnchor.x,
              y1: marcaAnchor.y,
              x2: childAnchor.x,
              y2: childAnchor.y,
              active: prodId === selectedProduto,
              id: `${selectedMarca}-${prodId}`,
            });
          }
        });
      }
    }

    setLines({ level1: l1, level2: l2, level3: l3 });
  }, [
    isRootOpen,
    selectedCategoria,
    selectedMarca,
    selectedProduto,
  ]);

  // Hook resize and update lines
  useEffect(() => {
    const handleUpdate = () => {
      requestAnimationFrame(updateConnectorLines);
    };

    const timer1 = setTimeout(handleUpdate, 50);
    const timer2 = setTimeout(handleUpdate, 200);
    window.addEventListener('resize', handleUpdate);

    let resizeObserver: ResizeObserver | null = null;
    if (containerRef.current && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        requestAnimationFrame(updateConnectorLines);
      });
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener('resize', handleUpdate);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [
    updateConnectorLines,
    categoriasList,
    marcasList,
    produtosList,
    selectedCategoria,
    selectedMarca,
    selectedProduto,
    isRootOpen,
    limitCat,
    limitMarca,
    limitProd,
    metric,
  ]);

  // Smooth scroll to column when user clicks arrow
  const scrollToCol = (colRef: React.RefObject<HTMLDivElement | null>) => {
    setTimeout(() => {
      if (colRef.current && containerRef.current) {
        colRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      }
    }, 40);
  };

  // Helper to render Bezier Curve path
  const renderBezier = (x1: number, y1: number, x2: number, y2: number) => {
    const deltaX = (x2 - x1) * 0.5;
    return `M ${x1} ${y1} C ${x1 + deltaX} ${y1}, ${x2 - deltaX} ${y2}, ${x2} ${y2}`;
  };

  // Arrow click handlers
  const handleToggleRoot = () => {
    if (isRootOpen) {
      setIsRootOpen(false);
      setSelectedCategoria(null);
      setSelectedMarca(null);
      setSelectedProduto(null);
    } else {
      setIsRootOpen(true);
      if (categoriasList.length > 0) {
        const firstCat = categoriasList[0].id;
        setSelectedCategoria(firstCat);
        const catItens = itens.filter((i) => (i.categoria || 'Outros') === firstCat);
        if (catItens.length > 0 && catItens[0].marca) {
          setSelectedMarca(catItens[0].marca);
        }
      }
    }
  };

  const handleToggleCategoria = (catId: string) => {
    setSelectedCategoria(catId);
    const catItens = itens.filter((i) => (i.categoria || 'Outros') === catId);
    const firstMarca = catItens[0]?.marca || null;
    setSelectedMarca(firstMarca);
    setSelectedProduto(null);
    scrollToCol(colMarcaRef);
  };

  const handleToggleMarca = (marcaId: string) => {
    setSelectedMarca(marcaId);
    setSelectedProduto(null);
    scrollToCol(colProdRef);
  };

  return (
    <div
      id="decomposition-tree-wrapper"
      className={`w-full bg-slate-900/90 border border-slate-800/90 rounded-2xl shadow-2xl relative transition-all duration-300 ${
        isFullscreen
          ? 'fixed inset-0 z-50 p-4 sm:p-6 bg-slate-950 overflow-y-auto flex flex-col justify-between'
          : 'p-4 sm:p-5 overflow-hidden'
      }`}
    >
      {/* Top Header with Metric switcher & Fullscreen Button */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse" />
          <span className="text-xs sm:text-sm font-bold text-white tracking-wide">
            Árvore de Decomposição Financeira
          </span>
          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
            (Clique nas setinhas para abrir/fechar os ramos)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Minimal Metric Switcher */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
            <button
              onClick={() => setMetric('valor')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                metric === 'valor'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <DollarSign className="w-3 h-3" />
              <span>R$ Valor</span>
            </button>
            <button
              onClick={() => setMetric('quantidade')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                metric === 'quantidade'
                  ? 'bg-sky-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Package className="w-3 h-3" />
              <span>Volume</span>
            </button>
          </div>

          {/* Dedicated New Tab / Expand Buttons */}
          <a
            id="btn-open-tree-tab"
            href="?view=arvore"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              // Try window.open first, fallback to standard link
              try {
                const targetUrl = `${window.location.origin}${window.location.pathname}?view=arvore`;
                const newWin = window.open(targetUrl, '_blank', 'noopener,noreferrer');
                if (newWin) {
                  e.preventDefault();
                }
              } catch {
                // let default <a> behavior handle it
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs transition-all cursor-pointer shadow-md no-underline group"
            title="Abrir a Árvore de Decomposição em uma nova guia exclusiva do navegador"
          >
            <ExternalLink className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            <span>Abrir em Outra Guia</span>
          </a>

          {activeTab === 'arvore-decomposicao' && (
            <button
              id="btn-fullscreen-tree"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 hover:text-sky-300 border border-sky-500/30 font-bold text-xs transition-all cursor-pointer shadow-sm"
              title={isFullscreen ? 'Sair da Tela Cheia' : 'Expandir Tela Cheia'}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Sair da Tela Cheia</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Expandir Tela Cheia</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Main Tree Canvas Area */}
      <div
        ref={containerRef}
        className={`relative overflow-x-auto custom-scrollbar py-2 px-1 select-none w-full ${
          isFullscreen ? 'flex-1 min-h-[560px]' : 'min-h-[420px]'
        }`}
        style={{ scrollBehavior: 'smooth' }}
      >
        {/* Dynamic SVG Bezier Connecting Lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
          <defs>
            <filter id="treeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Level 1 Lines (Root to Categories) */}
          {lines.level1.map((l) => (
            <path
              key={l.id}
              d={renderBezier(l.x1, l.y1, l.x2, l.y2)}
              fill="none"
              stroke={l.active ? '#38bdf8' : '#334155'}
              strokeWidth={l.active ? 2.5 : 1.2}
              strokeOpacity={l.active ? 1 : 0.4}
              filter={l.active ? 'url(#treeGlow)' : undefined}
            />
          ))}

          {/* Level 2 Lines (Category to Brands) */}
          {lines.level2.map((l) => (
            <path
              key={l.id}
              d={renderBezier(l.x1, l.y1, l.x2, l.y2)}
              fill="none"
              stroke={l.active ? '#38bdf8' : '#334155'}
              strokeWidth={l.active ? 2.5 : 1.2}
              strokeOpacity={l.active ? 1 : 0.4}
              filter={l.active ? 'url(#treeGlow)' : undefined}
            />
          ))}

          {/* Level 3 Lines (Brand to SKUs) */}
          {lines.level3.map((l) => (
            <path
              key={l.id}
              d={renderBezier(l.x1, l.y1, l.x2, l.y2)}
              fill="none"
              stroke={l.active ? '#38bdf8' : '#334155'}
              strokeWidth={l.active ? 2.5 : 1.2}
              strokeOpacity={l.active ? 1 : 0.4}
              filter={l.active ? 'url(#treeGlow)' : undefined}
            />
          ))}
        </svg>

        {/* Tree Columns Flex Layout - Fluid and fills 100% of container width */}
        <div className="flex items-stretch gap-4 sm:gap-6 md:gap-8 relative z-20 w-full min-w-full">
          
          {/* ========================================================
              COLUNA 0: TOTAL GERAL (Root Node) - Centralizado no meio
             ======================================================== */}
          <div className="flex-1 min-w-[190px] max-w-[260px] shrink-0 flex flex-col justify-center items-center">
            <div
              ref={rootNodeRef}
              className={`w-full bg-slate-900 border-2 rounded-xl p-4 shadow-xl relative transition-all text-center ${
                isRootOpen
                  ? 'border-sky-500 ring-1 ring-sky-500/30'
                  : 'border-slate-700/80 hover:border-slate-600'
              }`}
            >
              {/* Horizontal Progress Bar */}
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-2.5">
                <div className="bg-sky-500 h-full w-full rounded-full" />
              </div>

              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                  Total Geral
                </span>
                <h4 className="text-xs sm:text-sm font-black text-white leading-tight mt-0.5">
                  Trocas de Produtos Impróprios
                </h4>
                <div className="text-xs font-mono font-bold text-sky-400 mt-1">
                  100.0% do Total
                </div>
                <div className="text-sm sm:text-base font-black text-amber-400 font-mono mt-0.5">
                  {metric === 'valor'
                    ? formatCurrency(totalBase.valor)
                    : `${totalBase.quantidade.toLocaleString('pt-BR')} un`}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  {totalBase.registros} registros
                </div>

                {/* Arrow Button to expand/collapse categories */}
                <button
                  id="btn-toggle-tree-root"
                  onClick={handleToggleRoot}
                  className={`mt-3 flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-md ${
                    isRootOpen
                      ? 'bg-sky-500 text-slate-950 hover:bg-sky-400'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  }`}
                  title={isRootOpen ? 'Clique para recolher categorias' : 'Clique para expandir categorias'}
                >
                  <span>{isRootOpen ? 'Categorias' : 'Expandir'}</span>
                  <ChevronRight
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isRootOpen ? 'rotate-90 text-slate-950' : 'text-sky-400'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* ========================================================
              COLUNA 1: CATEGORIAS (Abre ao clicar na setinha do Root)
             ======================================================== */}
          {isRootOpen && (
            <div ref={colCatRef} className="flex-1 min-w-[210px] flex flex-col space-y-2.5">
              <div className="flex items-center justify-between pb-1 border-b border-sky-500/80">
                <span className="text-xs font-black text-slate-200 uppercase tracking-wider">
                  Categoria
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {categoriasList.length} itens
                </span>
              </div>

              <div className="space-y-2.5">
                {categoriasList.slice(0, limitCat).map((cat) => {
                  const isSelected = cat.id === selectedCategoria;
                  const curMetric = metric === 'valor' ? cat.valor : cat.quantidade;
                  const barWidth = `${Math.min(100, Math.max(6, (curMetric / maxCatMetric) * 100))}%`;

                  return (
                    <div
                      key={cat.id}
                      ref={(el) => {
                        if (el) catNodesRef.current.set(cat.id, el);
                        else catNodesRef.current.delete(cat.id);
                      }}
                      onClick={() => handleToggleCategoria(cat.id)}
                      className={`rounded-xl p-2.5 border transition-all cursor-pointer relative group ${
                        isSelected
                          ? 'bg-slate-900 border-sky-500 shadow-lg shadow-sky-500/10 ring-1 ring-sky-500/40'
                          : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
                      }`}
                    >
                      {/* Top Proportional Bar */}
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-1.5">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isSelected ? 'bg-sky-400' : 'bg-sky-600/70 group-hover:bg-sky-500'
                          }`}
                          style={{ width: barWidth }}
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                            {cat.label}
                          </h4>
                          <div className="text-[11px] font-mono font-semibold text-sky-400">
                            {cat.percentual.toFixed(1)}% <span className="text-[9px] text-slate-500 font-sans">do total</span>
                          </div>
                          <div className="text-xs font-bold text-amber-400 font-mono">
                            {metric === 'valor'
                              ? formatCurrency(cat.valor)
                              : `${cat.quantidade.toLocaleString('pt-BR')} un`}
                          </div>
                        </div>

                        {/* Interactive Arrow Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleCategoria(cat.id);
                          }}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-sky-500 text-slate-950 shadow-md ring-2 ring-sky-400/40'
                              : 'bg-slate-800 text-sky-400 hover:bg-sky-500 hover:text-slate-950 border border-slate-700'
                          }`}
                          title={isSelected ? 'Categoria selecionada (exibindo marcas)' : 'Clique para ver as marcas desta categoria'}
                        >
                          <ChevronRight
                            className={`w-4 h-4 transition-transform duration-200 ${
                              isSelected ? 'rotate-90 text-slate-950' : ''
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {categoriasList.length > limitCat && (
                  <button
                    onClick={() => setLimitCat(limitCat + 6)}
                    className="w-full py-1 text-center text-[11px] text-sky-400 hover:text-sky-300 bg-slate-900/50 hover:bg-slate-900 border border-slate-800 rounded-lg transition-colors cursor-pointer font-semibold"
                  >
                    + Ver mais {categoriasList.length - limitCat} categorias
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ========================================================
              COLUNA 2: MARCAS (Abre ao clicar na setinha da Categoria)
             ======================================================== */}
          {isRootOpen && selectedCategoria && (
            <div ref={colMarcaRef} className="flex-1 min-w-[210px] flex flex-col space-y-2.5">
              <div className="flex items-center justify-between pb-1 border-b border-sky-500/80">
                <span className="text-xs font-black text-slate-200 uppercase tracking-wider">
                  Marca
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {marcasList.length} itens
                </span>
              </div>

              <div className="space-y-2.5">
                {marcasList.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-400">
                    Nenhuma marca nesta categoria
                  </div>
                ) : (
                  marcasList.slice(0, limitMarca).map((marca) => {
                    const isSelected = marca.id === selectedMarca;
                    const curMetric = metric === 'valor' ? marca.valor : marca.quantidade;
                    const barWidth = `${Math.min(100, Math.max(6, (curMetric / maxMarcaMetric) * 100))}%`;

                    return (
                      <div
                        key={marca.id}
                        ref={(el) => {
                          if (el) marcaNodesRef.current.set(marca.id, el);
                          else marcaNodesRef.current.delete(marca.id);
                        }}
                        onClick={() => handleToggleMarca(marca.id)}
                        className={`rounded-xl p-2.5 border transition-all cursor-pointer relative group ${
                          isSelected
                            ? 'bg-slate-900 border-sky-500 shadow-lg shadow-sky-500/10 ring-1 ring-sky-500/40'
                            : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
                        }`}
                      >
                        {/* Top Proportional Bar */}
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-1.5">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isSelected ? 'bg-sky-400' : 'bg-sky-600/70 group-hover:bg-sky-500'
                            }`}
                            style={{ width: barWidth }}
                          />
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h4 className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                              {marca.label}
                            </h4>
                            <div className="text-[11px] font-mono font-semibold text-sky-400">
                              {marca.percentual.toFixed(1)}% <span className="text-[9px] text-slate-500 font-sans">da cat.</span>
                            </div>
                            <div className="text-xs font-bold text-emerald-400 font-mono">
                              {metric === 'valor'
                                ? formatCurrency(marca.valor)
                                : `${marca.quantidade.toLocaleString('pt-BR')} un`}
                            </div>
                          </div>

                          {/* Interactive Arrow Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleMarca(marca.id);
                            }}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-sky-500 text-slate-950 shadow-md ring-2 ring-sky-400/40'
                                : 'bg-slate-800 text-sky-400 hover:bg-sky-500 hover:text-slate-950 border border-slate-700'
                            }`}
                            title={isSelected ? 'Marca selecionada (exibindo SKUs)' : 'Clique para ver os SKUs desta marca'}
                          >
                            <ChevronRight
                              className={`w-4 h-4 transition-transform duration-200 ${
                                isSelected ? 'rotate-90 text-slate-950' : ''
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}

                {marcasList.length > limitMarca && (
                  <button
                    onClick={() => setLimitMarca(limitMarca + 6)}
                    className="w-full py-1 text-center text-[11px] text-sky-400 hover:text-sky-300 bg-slate-900/50 hover:bg-slate-900 border border-slate-800 rounded-lg transition-colors cursor-pointer font-semibold"
                  >
                    + Ver mais {marcasList.length - limitMarca} marcas
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ========================================================
              COLUNA 3: PRODUTOS / SKUs (Abre ao clicar na setinha da Marca)
             ======================================================== */}
          {isRootOpen && selectedCategoria && selectedMarca && (
            <div ref={colProdRef} className="flex-[1.2] min-w-[240px] flex flex-col space-y-2.5">
              <div className="flex items-center justify-between pb-1 border-b border-sky-500/80">
                <span className="text-xs font-black text-slate-200 uppercase tracking-wider">
                  Produto / SKU
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {produtosList.length} SKUs
                </span>
              </div>

              <div className="space-y-2.5">
                {produtosList.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-400">
                    Nenhum SKU encontrado
                  </div>
                ) : (
                  produtosList.slice(0, limitProd).map((prod) => {
                    const isSelected = prod.id === selectedProduto;
                    const curMetric = metric === 'valor' ? prod.valor : prod.quantidade;
                    const barWidth = `${Math.min(100, Math.max(6, (curMetric / maxProdMetric) * 100))}%`;

                    return (
                      <div
                        key={prod.id}
                        ref={(el) => {
                          if (el) prodNodesRef.current.set(prod.id, el);
                          else prodNodesRef.current.delete(prod.id);
                        }}
                        onClick={() => setSelectedProduto(isSelected ? null : prod.id)}
                        className={`rounded-xl p-2.5 border transition-all cursor-pointer relative group ${
                          isSelected
                            ? 'bg-slate-900 border-purple-500 shadow-lg shadow-purple-500/10 ring-1 ring-purple-500/40'
                            : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
                        }`}
                      >
                        {/* Top Proportional Bar */}
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-1.5">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isSelected ? 'bg-purple-400' : 'bg-purple-600/70 group-hover:bg-purple-500'
                            }`}
                            style={{ width: barWidth }}
                          />
                        </div>

                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h4
                              className={`text-xs font-bold line-clamp-2 leading-tight ${
                                isSelected ? 'text-white' : 'text-slate-200'
                              }`}
                              title={prod.label}
                            >
                              {prod.label}
                            </h4>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                              {prod.sublabel}
                            </div>
                            <div className="flex items-center justify-between gap-2 mt-1">
                              <span className="text-[11px] font-mono font-semibold text-purple-400">
                                {prod.percentual.toFixed(1)}% <span className="text-[9px] text-slate-500 font-sans">da marca</span>
                              </span>
                              <span className="text-xs font-bold text-amber-400 font-mono">
                                {metric === 'valor'
                                  ? formatCurrency(prod.valor)
                                  : `${prod.quantidade.toLocaleString('pt-BR')} un`}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                {produtosList.length > limitProd && (
                  <button
                    onClick={() => setLimitProd(limitProd + 8)}
                    className="w-full py-1 text-center text-[11px] text-purple-400 hover:text-purple-300 bg-slate-900/50 hover:bg-slate-900 border border-slate-800 rounded-lg transition-colors cursor-pointer font-semibold"
                  >
                    + Ver mais {produtosList.length - limitProd} produtos
                  </button>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
