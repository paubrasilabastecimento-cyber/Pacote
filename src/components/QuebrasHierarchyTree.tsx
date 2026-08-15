import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { RegistroPerda } from '../types';
import { formatCurrency } from '../utils/formatters';
import {
  ChevronRight,
  DollarSign,
  Package,
  Maximize2,
  Minimize2,
  Layers,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

interface QuebrasHierarchyTreeProps {
  perdas: RegistroPerda[];
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
  meta?: any;
}

export const QuebrasHierarchyTree: React.FC<QuebrasHierarchyTreeProps> = ({ perdas }) => {
  // Metric toggle: 'valor' (R$) or 'quantidade' (unidades / volumes)
  const [metric, setMetric] = useState<'valor' | 'quantidade'>('valor');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Interactive arrow-based tree expansion states
  const [isRootOpen, setIsRootOpen] = useState<boolean>(true);
  const [selectedMotivo, setSelectedMotivo] = useState<string | null>(null);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [selectedProduto, setSelectedProduto] = useState<string | null>(null);

  // Limit per column
  const [limitMotivo, setLimitMotivo] = useState<number>(8);
  const [limitArea, setLimitArea] = useState<number>(8);
  const [limitProd, setLimitProd] = useState<number>(10);

  // Container refs for dynamic SVG connector lines
  const containerRef = useRef<HTMLDivElement>(null);
  const rootNodeRef = useRef<HTMLDivElement>(null);
  const motivoNodesRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const areaNodesRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const prodNodesRef = useRef<Map<string, HTMLDivElement>>(new Map());

  const colMotivoRef = useRef<HTMLDivElement>(null);
  const colAreaRef = useRef<HTMLDivElement>(null);
  const colProdRef = useRef<HTMLDivElement>(null);

  const [lines, setLines] = useState<{
    level1: { x1: number; y1: number; x2: number; y2: number; active: boolean; id: string }[];
    level2: { x1: number; y1: number; x2: number; y2: number; active: boolean; id: string }[];
    level3: { x1: number; y1: number; x2: number; y2: number; active: boolean; id: string }[];
  }>({ level1: [], level2: [], level3: [] });

  // 1. Calculate Totals (Level 0: Root)
  const totalBase = useMemo(() => {
    const valor = perdas.reduce((acc, p) => acc + (p.valorR$ || 0), 0);
    const quantidade = perdas.reduce((acc, p) => acc + (p.quantidade || 0), 0);
    const hl = perdas.reduce((acc, p) => acc + (p.hlPerdido || 0), 0);
    return {
      valor,
      quantidade,
      hl,
      registros: perdas.length,
    };
  }, [perdas]);

  // 2. Group by Motivo (Level 1)
  const motivosList = useMemo(() => {
    const map: Record<string, { codigo: string; valor: number; quantidade: number; registros: number }> = {};
    perdas.forEach((p) => {
      const mot = p.motivo || 'OUTROS MOTIVOS';
      if (!map[mot]) {
        map[mot] = { codigo: p.codigoMotivo || 'S/C', valor: 0, quantidade: 0, registros: 0 };
      }
      map[mot].valor += p.valorR$ || 0;
      map[mot].quantidade += p.quantidade || 0;
      map[mot].registros += 1;
    });

    const list: TreeNodeData[] = Object.entries(map).map(([motivo, d]) => {
      const metricVal = metric === 'valor' ? d.valor : d.quantidade;
      const totalMetric = metric === 'valor' ? totalBase.valor : totalBase.quantidade;
      const pct = totalMetric > 0 ? (metricVal / totalMetric) * 100 : 0;
      const pctTotal = totalBase.valor > 0 ? (d.valor / totalBase.valor) * 100 : 0;
      return {
        id: motivo,
        label: motivo,
        sublabel: `Cód. ${d.codigo} • ${d.registros} reg.`,
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
  }, [perdas, metric, totalBase]);

  // Auto-select first motivo if none selected
  useEffect(() => {
    if (motivosList.length > 0) {
      if (!selectedMotivo || !motivosList.some((m) => m.id === selectedMotivo)) {
        setSelectedMotivo(motivosList[0].id);
      }
    }
  }, [motivosList, selectedMotivo]);

  // 3. Group by Área for Selected Motivo (Level 2)
  const areasList = useMemo(() => {
    if (!selectedMotivo) return [];
    const motivoPerdas = perdas.filter((p) => (p.motivo || 'OUTROS MOTIVOS') === selectedMotivo);
    const motivoTotalVal = motivoPerdas.reduce((acc, p) => acc + (p.valorR$ || 0), 0);
    const motivoTotalQtd = motivoPerdas.reduce((acc, p) => acc + (p.quantidade || 0), 0);

    const map: Record<string, { valor: number; quantidade: number; registros: number }> = {};
    motivoPerdas.forEach((p) => {
      const area = p.area || 'ARMAZÉM';
      if (!map[area]) map[area] = { valor: 0, quantidade: 0, registros: 0 };
      map[area].valor += p.valorR$ || 0;
      map[area].quantidade += p.quantidade || 0;
      map[area].registros += 1;
    });

    const list: TreeNodeData[] = Object.entries(map).map(([area, d]) => {
      const metricVal = metric === 'valor' ? d.valor : d.quantidade;
      const motMetric = metric === 'valor' ? motivoTotalVal : motivoTotalQtd;
      const pct = motMetric > 0 ? (metricVal / motMetric) * 100 : 0;
      const pctTotal = totalBase.valor > 0 ? (d.valor / totalBase.valor) * 100 : 0;
      return {
        id: area,
        label: area,
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
  }, [perdas, selectedMotivo, metric, totalBase]);

  // Auto-select first area
  useEffect(() => {
    if (selectedMotivo && areasList.length > 0) {
      if (!selectedArea || !areasList.some((a) => a.id === selectedArea)) {
        setSelectedArea(areasList[0].id);
      }
    }
  }, [selectedMotivo, areasList, selectedArea]);

  // 4. Group by Produto / SKU for Selected Área (Level 3)
  const produtosList = useMemo(() => {
    if (!selectedMotivo || !selectedArea) return [];
    const filteredPerdas = perdas.filter(
      (p) => (p.motivo || 'OUTROS MOTIVOS') === selectedMotivo && (p.area || 'ARMAZÉM') === selectedArea
    );
    const areaTotalVal = filteredPerdas.reduce((acc, p) => acc + (p.valorR$ || 0), 0);
    const areaTotalQtd = filteredPerdas.reduce((acc, p) => acc + (p.quantidade || 0), 0);

    const map: Record<
      string,
      {
        keyId: string;
        codProduto: string;
        produto: string;
        valor: number;
        quantidade: number;
        hlPerdido: number;
        registros: number;
      }
    > = {};

    filteredPerdas.forEach((p, idx) => {
      const code = p.codProduto ? String(p.codProduto).trim() : ((p as any).codigoProduto ? String((p as any).codigoProduto).trim() : '');
      const prodName = (p.descricaoProduto || p.produto || `PROD_${idx}`).trim();
      const uniqueKey = code && code !== 'S/C' ? `sku_${code}` : `prod_${prodName.replace(/\s+/g, '_')}`;

      if (!map[uniqueKey]) {
        map[uniqueKey] = {
          keyId: uniqueKey,
          codProduto: code || 'S/C',
          produto: prodName,
          valor: 0,
          quantidade: 0,
          hlPerdido: 0,
          registros: 0,
        };
      }
      map[uniqueKey].valor += p.valorR$ || 0;
      map[uniqueKey].quantidade += p.quantidade || 0;
      map[uniqueKey].hlPerdido += p.hlPerdido || 0;
      map[uniqueKey].registros += 1;
    });

    const list: TreeNodeData[] = Object.values(map).map((p) => {
      const metricVal = metric === 'valor' ? p.valor : p.quantidade;
      const areaMetric = metric === 'valor' ? areaTotalVal : areaTotalQtd;
      const pct = areaMetric > 0 ? (metricVal / areaMetric) * 100 : 0;
      const pctTotal = totalBase.valor > 0 ? (p.valor / totalBase.valor) * 100 : 0;
      return {
        id: p.keyId,
        label: p.produto,
        sublabel: `Cód. ${p.codProduto} • ${p.hlPerdido.toFixed(4)} HL`,
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
  }, [perdas, selectedMotivo, selectedArea, metric, totalBase]);

  // Max values for proportional bars
  const maxMotivoMetric = useMemo(() => {
    return Math.max(...motivosList.map((m) => (metric === 'valor' ? m.valor : m.quantidade)), 1);
  }, [motivosList, metric]);

  const maxAreaMetric = useMemo(() => {
    return Math.max(...areasList.map((a) => (metric === 'valor' ? a.valor : a.quantidade)), 1);
  }, [areasList, metric]);

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

    // Level 1 Lines (Root -> Motivos)
    const l1: { x1: number; y1: number; x2: number; y2: number; active: boolean; id: string }[] = [];
    if (isRootOpen) {
      motivoNodesRef.current.forEach((el, motId) => {
        if (el) {
          const childAnchor = getAnchorLeft(el);
          l1.push({
            x1: rootAnchor.x,
            y1: rootAnchor.y,
            x2: childAnchor.x,
            y2: childAnchor.y,
            active: motId === selectedMotivo,
            id: `root-${motId}`,
          });
        }
      });
    }

    // Level 2 Lines (Selected Motivo -> Áreas)
    const l2: { x1: number; y1: number; x2: number; y2: number; active: boolean; id: string }[] = [];
    if (isRootOpen && selectedMotivo) {
      const selectedMotEl = motivoNodesRef.current.get(selectedMotivo);
      if (selectedMotEl) {
        const motAnchor = getAnchorRight(selectedMotEl);
        areaNodesRef.current.forEach((el, areaId) => {
          if (el) {
            const childAnchor = getAnchorLeft(el);
            l2.push({
              x1: motAnchor.x,
              y1: motAnchor.y,
              x2: childAnchor.x,
              y2: childAnchor.y,
              active: areaId === selectedArea,
              id: `${selectedMotivo}-${areaId}`,
            });
          }
        });
      }
    }

    // Level 3 Lines (Selected Área -> Produtos)
    const l3: { x1: number; y1: number; x2: number; y2: number; active: boolean; id: string }[] = [];
    if (isRootOpen && selectedMotivo && selectedArea) {
      const selectedAreaEl = areaNodesRef.current.get(selectedArea);
      if (selectedAreaEl) {
        const areaAnchor = getAnchorRight(selectedAreaEl);
        prodNodesRef.current.forEach((el, prodId) => {
          if (el) {
            const childAnchor = getAnchorLeft(el);
            l3.push({
              x1: areaAnchor.x,
              y1: areaAnchor.y,
              x2: childAnchor.x,
              y2: childAnchor.y,
              active: prodId === selectedProduto,
              id: `${selectedArea}-${prodId}`,
            });
          }
        });
      }
    }

    setLines({ level1: l1, level2: l2, level3: l3 });
  }, [isRootOpen, selectedMotivo, selectedArea, selectedProduto]);

  // Hook resize and update lines
  useEffect(() => {
    const handleUpdate = () => {
      requestAnimationFrame(updateConnectorLines);
    };

    const timer1 = setTimeout(handleUpdate, 60);
    const timer2 = setTimeout(handleUpdate, 220);
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
    motivosList,
    areasList,
    produtosList,
    selectedMotivo,
    selectedArea,
    selectedProduto,
    isRootOpen,
    limitMotivo,
    limitArea,
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
      setSelectedMotivo(null);
      setSelectedArea(null);
      setSelectedProduto(null);
    } else {
      setIsRootOpen(true);
      if (motivosList.length > 0) {
        const firstMot = motivosList[0].id;
        setSelectedMotivo(firstMot);
        const motPerdas = perdas.filter((p) => (p.motivo || 'OUTROS MOTIVOS') === firstMot);
        if (motPerdas.length > 0) {
          setSelectedArea(motPerdas[0].area || 'ARMAZÉM');
        }
      }
    }
  };

  const handleToggleMotivo = (motId: string) => {
    setSelectedMotivo(motId);
    const motPerdas = perdas.filter((p) => (p.motivo || 'OUTROS MOTIVOS') === motId);
    const firstArea = motPerdas[0]?.area || 'ARMAZÉM';
    setSelectedArea(firstArea);
    setSelectedProduto(null);
    scrollToCol(colAreaRef);
  };

  const handleToggleArea = (areaId: string) => {
    setSelectedArea(areaId);
    setSelectedProduto(null);
    scrollToCol(colProdRef);
  };

  return (
    <div
      id="quebras-decomposition-tree-wrapper"
      className={`w-full bg-slate-900/90 border border-slate-800/90 rounded-2xl shadow-2xl relative transition-all duration-300 ${
        isFullscreen
          ? 'fixed inset-0 z-50 p-4 sm:p-6 bg-slate-950 overflow-y-auto flex flex-col justify-between'
          : 'p-4 sm:p-5 overflow-hidden'
      }`}
    >
      {/* Top Header with Metric switcher & Fullscreen Button */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
          <span className="text-xs sm:text-sm font-bold text-white tracking-wide">
            Árvore de Decomposição Financeira – Prejuízo & Quebras (SCL)
          </span>
          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
            (Clique nas setinhas para abrir/fechar os ramos)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Metric Switcher */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
            <button
              onClick={() => setMetric('valor')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                metric === 'valor'
                  ? 'bg-rose-500 text-white shadow-sm font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <DollarSign className="w-3 h-3" />
              <span>R$ Prejuízo</span>
            </button>
            <button
              onClick={() => setMetric('quantidade')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                metric === 'quantidade'
                  ? 'bg-sky-500 text-slate-950 shadow-sm font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Package className="w-3 h-3" />
              <span>Volume</span>
            </button>
          </div>

          {/* Fullscreen Button */}
          <button
            id="btn-fullscreen-quebras-tree"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 font-bold text-xs transition-all cursor-pointer shadow-sm"
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
            <filter id="treeGlowRose" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Level 1 Lines (Root to Motivos) */}
          {lines.level1.map((l) => (
            <path
              key={l.id}
              d={renderBezier(l.x1, l.y1, l.x2, l.y2)}
              fill="none"
              stroke={l.active ? '#f43f5e' : '#334155'}
              strokeWidth={l.active ? 2.5 : 1.2}
              strokeOpacity={l.active ? 1 : 0.4}
              filter={l.active ? 'url(#treeGlowRose)' : undefined}
            />
          ))}

          {/* Level 2 Lines (Motivo to Áreas) */}
          {lines.level2.map((l) => (
            <path
              key={l.id}
              d={renderBezier(l.x1, l.y1, l.x2, l.y2)}
              fill="none"
              stroke={l.active ? '#f43f5e' : '#334155'}
              strokeWidth={l.active ? 2.5 : 1.2}
              strokeOpacity={l.active ? 1 : 0.4}
              filter={l.active ? 'url(#treeGlowRose)' : undefined}
            />
          ))}

          {/* Level 3 Lines (Área to Produtos) */}
          {lines.level3.map((l) => (
            <path
              key={l.id}
              d={renderBezier(l.x1, l.y1, l.x2, l.y2)}
              fill="none"
              stroke={l.active ? '#f43f5e' : '#334155'}
              strokeWidth={l.active ? 2.5 : 1.2}
              strokeOpacity={l.active ? 1 : 0.4}
              filter={l.active ? 'url(#treeGlowRose)' : undefined}
            />
          ))}
        </svg>

        {/* Tree Columns Flex Layout */}
        <div className="flex items-stretch gap-4 sm:gap-6 md:gap-8 relative z-20 w-full min-w-full">
          {/* ========================================================
              COLUNA 0: TOTAL GERAL (Root Node)
             ======================================================== */}
          <div className="flex-1 min-w-[190px] max-w-[260px] shrink-0 flex flex-col justify-center items-center">
            <div
              ref={rootNodeRef}
              className={`w-full bg-slate-900 border-2 rounded-xl p-4 shadow-xl relative transition-all text-center ${
                isRootOpen
                  ? 'border-rose-500 ring-1 ring-rose-500/30'
                  : 'border-slate-700/80 hover:border-slate-600'
              }`}
            >
              {/* Horizontal Progress Bar */}
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-2.5">
                <div className="bg-rose-500 h-full w-full rounded-full" />
              </div>

              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                  Total Geral
                </span>
                <h4 className="text-xs sm:text-sm font-black text-white leading-tight mt-0.5">
                  Prejuízo Operacional Total
                </h4>
                <div className="text-xs font-mono font-bold text-rose-400 mt-1">
                  100.0% do Prejuízo
                </div>
                <div className="text-sm sm:text-base font-black text-amber-400 font-mono mt-0.5">
                  {metric === 'valor'
                    ? formatCurrency(totalBase.valor)
                    : `${totalBase.quantidade.toLocaleString('pt-BR')} un`}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  {totalBase.registros} quebras • {totalBase.hl.toFixed(3)} HL
                </div>

                {/* Arrow Button to expand/collapse motivos */}
                <button
                  id="btn-toggle-quebras-root"
                  onClick={handleToggleRoot}
                  className={`mt-3 flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-md ${
                    isRootOpen
                      ? 'bg-rose-500 text-white hover:bg-rose-400 font-black'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  }`}
                  title={isRootOpen ? 'Clique para recolher motivos' : 'Clique para expandir motivos'}
                >
                  <span>{isRootOpen ? 'Motivos' : 'Expandir'}</span>
                  <ChevronRight
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isRootOpen ? 'rotate-90 text-white' : 'text-rose-400'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* ========================================================
              COLUNA 1: MOTIVOS (Abre ao clicar na setinha do Root)
             ======================================================== */}
          {isRootOpen && (
            <div ref={colMotivoRef} className="flex-1 min-w-[220px] flex flex-col space-y-2.5">
              <div className="flex items-center justify-between pb-1 border-b border-rose-500/80">
                <span className="text-xs font-black text-slate-200 uppercase tracking-wider">
                  Motivo de Perda
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {motivosList.length} motivos
                </span>
              </div>

              <div className="space-y-2.5">
                {motivosList.slice(0, limitMotivo).map((mot) => {
                  const isSelected = mot.id === selectedMotivo;
                  const curMetric = metric === 'valor' ? mot.valor : mot.quantidade;
                  const barWidth = `${Math.min(100, Math.max(6, (curMetric / maxMotivoMetric) * 100))}%`;

                  return (
                    <div
                      key={mot.id}
                      ref={(el) => {
                        if (el) motivoNodesRef.current.set(mot.id, el);
                        else motivoNodesRef.current.delete(mot.id);
                      }}
                      onClick={() => handleToggleMotivo(mot.id)}
                      className={`rounded-xl p-2.5 border transition-all cursor-pointer relative group ${
                        isSelected
                          ? 'bg-slate-900 border-rose-500 shadow-lg shadow-rose-500/10 ring-1 ring-rose-500/40'
                          : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
                      }`}
                    >
                      {/* Top Proportional Bar */}
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-1.5">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isSelected ? 'bg-rose-500' : 'bg-rose-600/70 group-hover:bg-rose-500'
                          }`}
                          style={{ width: barWidth }}
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4
                            className={`text-xs font-bold truncate ${
                              isSelected ? 'text-white' : 'text-slate-200'
                            }`}
                          >
                            {mot.label}
                          </h4>
                          <div className="text-[10px] font-mono text-slate-400 truncate">
                            {mot.sublabel}
                          </div>
                          <div className="flex items-center justify-between mt-1 pt-0.5">
                            <span className="text-[11px] font-mono font-semibold text-rose-400">
                              {mot.percentual.toFixed(1)}%{' '}
                              <span className="text-[9px] text-slate-500 font-sans">do total</span>
                            </span>
                            <span className="text-xs font-bold text-amber-400 font-mono">
                              {metric === 'valor'
                                ? formatCurrency(mot.valor)
                                : `${mot.quantidade.toLocaleString('pt-BR')} un`}
                            </span>
                          </div>
                        </div>

                        {/* Interactive Arrow Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleMotivo(mot.id);
                          }}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-rose-500 text-white shadow-md ring-2 ring-rose-400/40 font-black'
                              : 'bg-slate-800 text-rose-400 hover:bg-rose-500 hover:text-white border border-slate-700'
                          }`}
                          title={
                            isSelected
                              ? 'Motivo selecionado (exibindo áreas)'
                              : 'Clique para ver as áreas deste motivo'
                          }
                        >
                          <ChevronRight
                            className={`w-4 h-4 transition-transform duration-200 ${
                              isSelected ? 'rotate-90 text-white' : ''
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {motivosList.length > limitMotivo && (
                  <button
                    onClick={() => setLimitMotivo(limitMotivo + 6)}
                    className="w-full py-1 text-center text-[11px] text-rose-400 hover:text-rose-300 bg-slate-900/50 hover:bg-slate-900 border border-slate-800 rounded-lg transition-colors cursor-pointer font-semibold"
                  >
                    + Ver mais {motivosList.length - limitMotivo} motivos
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ========================================================
              COLUNA 2: ÁREA / SETOR (Abre ao clicar na setinha do Motivo)
             ======================================================== */}
          {isRootOpen && selectedMotivo && (
            <div ref={colAreaRef} className="flex-1 min-w-[210px] flex flex-col space-y-2.5">
              <div className="flex items-center justify-between pb-1 border-b border-rose-500/80">
                <span className="text-xs font-black text-slate-200 uppercase tracking-wider">
                  Área / Setor
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {areasList.length} áreas
                </span>
              </div>

              <div className="space-y-2.5">
                {areasList.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-400">
                    Nenhuma área registrada
                  </div>
                ) : (
                  areasList.slice(0, limitArea).map((area) => {
                    const isSelected = area.id === selectedArea;
                    const curMetric = metric === 'valor' ? area.valor : area.quantidade;
                    const barWidth = `${Math.min(100, Math.max(6, (curMetric / maxAreaMetric) * 100))}%`;

                    return (
                      <div
                        key={area.id}
                        ref={(el) => {
                          if (el) areaNodesRef.current.set(area.id, el);
                          else areaNodesRef.current.delete(area.id);
                        }}
                        onClick={() => handleToggleArea(area.id)}
                        className={`rounded-xl p-2.5 border transition-all cursor-pointer relative group ${
                          isSelected
                            ? 'bg-slate-900 border-rose-500 shadow-lg shadow-rose-500/10 ring-1 ring-rose-500/40'
                            : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
                        }`}
                      >
                        {/* Top Proportional Bar */}
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-1.5">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isSelected ? 'bg-rose-400' : 'bg-rose-600/70 group-hover:bg-rose-500'
                            }`}
                            style={{ width: barWidth }}
                          />
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h4
                              className={`text-xs font-bold truncate ${
                                isSelected ? 'text-white' : 'text-slate-200'
                              }`}
                            >
                              {area.label}
                            </h4>
                            <div className="text-[11px] font-mono font-semibold text-rose-400">
                              {area.percentual.toFixed(1)}%{' '}
                              <span className="text-[9px] text-slate-500 font-sans">do motivo</span>
                            </div>
                            <div className="text-xs font-bold text-amber-400 font-mono">
                              {metric === 'valor'
                                ? formatCurrency(area.valor)
                                : `${area.quantidade.toLocaleString('pt-BR')} un`}
                            </div>
                          </div>

                          {/* Interactive Arrow Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleArea(area.id);
                            }}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-rose-500 text-white shadow-md ring-2 ring-rose-400/40 font-black'
                                : 'bg-slate-800 text-rose-400 hover:bg-rose-500 hover:text-white border border-slate-700'
                            }`}
                            title={
                              isSelected
                                ? 'Área selecionada (exibindo produtos)'
                                : 'Clique para ver os produtos desta área'
                            }
                          >
                            <ChevronRight
                              className={`w-4 h-4 transition-transform duration-200 ${
                                isSelected ? 'rotate-90 text-white' : ''
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}

                {areasList.length > limitArea && (
                  <button
                    onClick={() => setLimitArea(limitArea + 6)}
                    className="w-full py-1 text-center text-[11px] text-rose-400 hover:text-rose-300 bg-slate-900/50 hover:bg-slate-900 border border-slate-800 rounded-lg transition-colors cursor-pointer font-semibold"
                  >
                    + Ver mais {areasList.length - limitArea} áreas
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ========================================================
              COLUNA 3: PRODUTOS / SKUs (Abre ao clicar na setinha da Área)
             ======================================================== */}
          {isRootOpen && selectedMotivo && selectedArea && (
            <div ref={colProdRef} className="flex-[1.2] min-w-[240px] flex flex-col space-y-2.5">
              <div className="flex items-center justify-between pb-1 border-b border-rose-500/80">
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
                            ? 'bg-slate-900 border-rose-500 shadow-lg shadow-rose-500/10 ring-1 ring-rose-500/40'
                            : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
                        }`}
                      >
                        {/* Top Proportional Bar */}
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-1.5">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isSelected ? 'bg-rose-400' : 'bg-rose-600/70 group-hover:bg-rose-500'
                            }`}
                            style={{ width: barWidth }}
                          />
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h4
                              className={`text-xs font-bold truncate ${
                                isSelected ? 'text-white' : 'text-slate-200'
                              }`}
                            >
                              {prod.label}
                            </h4>
                            <div className="text-[10px] text-slate-400 font-mono truncate">
                              {prod.sublabel}
                            </div>
                            <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-800/80">
                              <span className="text-[11px] font-mono font-semibold text-rose-400">
                                {prod.percentual.toFixed(1)}%{' '}
                                <span className="text-[9px] text-slate-500 font-sans">da área</span>
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
                    className="w-full py-1 text-center text-[11px] text-rose-400 hover:text-rose-300 bg-slate-900/50 hover:bg-slate-900 border border-slate-800 rounded-lg transition-colors cursor-pointer font-semibold"
                  >
                    + Ver mais {produtosList.length - limitProd} SKUs
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
