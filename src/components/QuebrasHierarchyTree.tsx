import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { RegistroPerda } from '../types';
import { formatCurrency, formatMesAno, formatHL } from '../utils/formatters';
import {
  ChevronRight,
  DollarSign,
  Package,
  Maximize2,
  Minimize2,
  Calendar,
  Building2,
  AlertTriangle,
  Layers,
  Search,
  RotateCcw,
  Sparkles,
  ArrowRight,
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
  hl: number;
  percentual: number;
  percentualTotal: number;
  registros: number;
  codigo?: string;
}

export const QuebrasHierarchyTree: React.FC<QuebrasHierarchyTreeProps> = ({ perdas }) => {
  // Metric toggle: 'valor' (R$) or 'quantidade' (unidades / volumes)
  const [metric, setMetric] = useState<'valor' | 'quantidade'>('valor');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortMesBy, setSortMesBy] = useState<'valor' | 'cronologico'>('cronologico');

  // Hierarchy Selection State: Root -> Mês -> Área -> Motivo -> Produto
  const [isRootOpen, setIsRootOpen] = useState<boolean>(true);
  const [selectedMes, setSelectedMes] = useState<string | null>(null);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [selectedMotivo, setSelectedMotivo] = useState<string | null>(null);
  const [selectedProduto, setSelectedProduto] = useState<string | null>(null);

  // Pagination / Limit per column
  const [limitMes, setLimitMes] = useState<number>(12);
  const [limitArea, setLimitArea] = useState<number>(8);
  const [limitMotivo, setLimitMotivo] = useState<number>(8);
  const [limitProd, setLimitProd] = useState<number>(10);

  // Container refs for dynamic SVG connector lines
  const containerRef = useRef<HTMLDivElement>(null);
  const rootNodeRef = useRef<HTMLDivElement>(null);
  const mesNodesRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const areaNodesRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const motivoNodesRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const prodNodesRef = useRef<Map<string, HTMLDivElement>>(new Map());

  const colMesRef = useRef<HTMLDivElement>(null);
  const colAreaRef = useRef<HTMLDivElement>(null);
  const colMotivoRef = useRef<HTMLDivElement>(null);
  const colProdRef = useRef<HTMLDivElement>(null);

  const [lines, setLines] = useState<{
    level1: { x1: number; y1: number; x2: number; y2: number; active: boolean; id: string }[];
    level2: { x1: number; y1: number; x2: number; y2: number; active: boolean; id: string }[];
    level3: { x1: number; y1: number; x2: number; y2: number; active: boolean; id: string }[];
    level4: { x1: number; y1: number; x2: number; y2: number; active: boolean; id: string }[];
  }>({ level1: [], level2: [], level3: [], level4: [] });

  // Filtered dataset if search is active
  const filteredPerdas = useMemo(() => {
    if (!searchTerm.trim()) return perdas;
    const term = searchTerm.toLowerCase().trim();
    return perdas.filter((p) => {
      const prodName = (p.descricaoProduto || p.produto || '').toLowerCase();
      const codProd = String(p.codProduto || '').toLowerCase();
      const motivo = (p.motivo || '').toLowerCase();
      const codMotivo = String(p.codigoMotivo || '').toLowerCase();
      const area = (p.area || '').toLowerCase();
      const mes = (p.mesRef || p.data || '').toLowerCase();
      return (
        prodName.includes(term) ||
        codProd.includes(term) ||
        motivo.includes(term) ||
        codMotivo.includes(term) ||
        area.includes(term) ||
        mes.includes(term)
      );
    });
  }, [perdas, searchTerm]);

  // 1. Calculate Totals (Level 0: Root)
  const totalBase = useMemo(() => {
    const valor = filteredPerdas.reduce((acc, p) => acc + (p.valorR$ || 0), 0);
    const quantidade = filteredPerdas.reduce((acc, p) => acc + (p.quantidade || 0), 0);
    const hl = filteredPerdas.reduce((acc, p) => acc + (p.hlPerdido || 0), 0);
    return {
      valor,
      quantidade,
      hl,
      registros: filteredPerdas.length,
    };
  }, [filteredPerdas]);

  // 2. Group by Mês (Level 1)
  const mesesList = useMemo(() => {
    const map: Record<string, { mesRef: string; valor: number; quantidade: number; hl: number; registros: number }> = {};
    filteredPerdas.forEach((p) => {
      const mes = p.mesRef || (p.data ? p.data.slice(0, 7) : 'Sem Mês');
      if (!map[mes]) {
        map[mes] = { mesRef: mes, valor: 0, quantidade: 0, hl: 0, registros: 0 };
      }
      map[mes].valor += p.valorR$ || 0;
      map[mes].quantidade += p.quantidade || 0;
      map[mes].hl += p.hlPerdido || 0;
      map[mes].registros += 1;
    });

    const list: TreeNodeData[] = Object.entries(map).map(([mesKey, d]) => {
      const metricVal = metric === 'valor' ? d.valor : d.quantidade;
      const totalMetric = metric === 'valor' ? totalBase.valor : totalBase.quantidade;
      const pct = totalMetric > 0 ? (metricVal / totalMetric) * 100 : 0;
      const formattedLabel = formatMesAno(mesKey) || mesKey;
      return {
        id: mesKey,
        label: formattedLabel,
        sublabel: `${d.registros.toLocaleString('pt-BR')} reg. • ${d.hl.toFixed(2)} HL`,
        valor: d.valor,
        quantidade: d.quantidade,
        hl: d.hl,
        percentual: pct,
        percentualTotal: pct,
        registros: d.registros,
      };
    });

    return list.sort((a, b) => {
      if (sortMesBy === 'cronologico') {
        return a.id.localeCompare(b.id);
      }
      return metric === 'valor' ? b.valor - a.valor : b.quantidade - a.quantidade;
    });
  }, [filteredPerdas, metric, totalBase, sortMesBy]);

  // Auto-select first month if none selected
  useEffect(() => {
    if (mesesList.length > 0) {
      if (!selectedMes || !mesesList.some((m) => m.id === selectedMes)) {
        setSelectedMes(mesesList[0].id);
      }
    } else {
      setSelectedMes(null);
    }
  }, [mesesList, selectedMes]);

  // 3. Group by Área for Selected Mês (Level 2)
  const areasList = useMemo(() => {
    if (!selectedMes) return [];
    const mesPerdas = filteredPerdas.filter(
      (p) => (p.mesRef || (p.data ? p.data.slice(0, 7) : 'Sem Mês')) === selectedMes
    );
    const mesTotalVal = mesPerdas.reduce((acc, p) => acc + (p.valorR$ || 0), 0);
    const mesTotalQtd = mesPerdas.reduce((acc, p) => acc + (p.quantidade || 0), 0);

    const map: Record<string, { valor: number; quantidade: number; hl: number; registros: number }> = {};
    mesPerdas.forEach((p) => {
      const area = p.area || 'Armazém';
      if (!map[area]) map[area] = { valor: 0, quantidade: 0, hl: 0, registros: 0 };
      map[area].valor += p.valorR$ || 0;
      map[area].quantidade += p.quantidade || 0;
      map[area].hl += p.hlPerdido || 0;
      map[area].registros += 1;
    });

    const list: TreeNodeData[] = Object.entries(map).map(([area, d]) => {
      const metricVal = metric === 'valor' ? d.valor : d.quantidade;
      const mesMetric = metric === 'valor' ? mesTotalVal : mesTotalQtd;
      const pct = mesMetric > 0 ? (metricVal / mesMetric) * 100 : 0;
      const pctTotal = totalBase.valor > 0 ? (d.valor / totalBase.valor) * 100 : 0;
      return {
        id: area,
        label: area,
        sublabel: `${d.registros.toLocaleString('pt-BR')} reg. • ${d.hl.toFixed(2)} HL`,
        valor: d.valor,
        quantidade: d.quantidade,
        hl: d.hl,
        percentual: pct,
        percentualTotal: pctTotal,
        registros: d.registros,
      };
    });

    return list.sort((a, b) => {
      return metric === 'valor' ? b.valor - a.valor : b.quantidade - a.quantidade;
    });
  }, [filteredPerdas, selectedMes, metric, totalBase]);

  // Auto-select first area
  useEffect(() => {
    if (selectedMes && areasList.length > 0) {
      if (!selectedArea || !areasList.some((a) => a.id === selectedArea)) {
        setSelectedArea(areasList[0].id);
      }
    } else {
      setSelectedArea(null);
    }
  }, [selectedMes, areasList, selectedArea]);

  // 4. Group by Motivo for Selected Área and Mês (Level 3)
  const motivosList = useMemo(() => {
    if (!selectedMes || !selectedArea) return [];
    const areaPerdas = filteredPerdas.filter(
      (p) =>
        (p.mesRef || (p.data ? p.data.slice(0, 7) : 'Sem Mês')) === selectedMes &&
        (p.area || 'Armazém') === selectedArea
    );
    const areaTotalVal = areaPerdas.reduce((acc, p) => acc + (p.valorR$ || 0), 0);
    const areaTotalQtd = areaPerdas.reduce((acc, p) => acc + (p.quantidade || 0), 0);

    const map: Record<
      string,
      { codigo: string; valor: number; quantidade: number; hl: number; registros: number }
    > = {};
    areaPerdas.forEach((p) => {
      const mot = p.motivo || 'OUTROS MOTIVOS';
      if (!map[mot]) {
        map[mot] = { codigo: p.codigoMotivo || 'S/C', valor: 0, quantidade: 0, hl: 0, registros: 0 };
      }
      map[mot].valor += p.valorR$ || 0;
      map[mot].quantidade += p.quantidade || 0;
      map[mot].hl += p.hlPerdido || 0;
      map[mot].registros += 1;
    });

    const list: TreeNodeData[] = Object.entries(map).map(([motivo, d]) => {
      const metricVal = metric === 'valor' ? d.valor : d.quantidade;
      const areaMetric = metric === 'valor' ? areaTotalVal : areaTotalQtd;
      const pct = areaMetric > 0 ? (metricVal / areaMetric) * 100 : 0;
      const pctTotal = totalBase.valor > 0 ? (d.valor / totalBase.valor) * 100 : 0;
      return {
        id: motivo,
        label: motivo,
        codigo: d.codigo,
        sublabel: `Cód. ${d.codigo} • ${d.registros.toLocaleString('pt-BR')} reg. • ${d.hl.toFixed(2)} HL`,
        valor: d.valor,
        quantidade: d.quantidade,
        hl: d.hl,
        percentual: pct,
        percentualTotal: pctTotal,
        registros: d.registros,
      };
    });

    return list.sort((a, b) => {
      return metric === 'valor' ? b.valor - a.valor : b.quantidade - a.quantidade;
    });
  }, [filteredPerdas, selectedMes, selectedArea, metric, totalBase]);

  // Auto-select first motivo
  useEffect(() => {
    if (selectedMes && selectedArea && motivosList.length > 0) {
      if (!selectedMotivo || !motivosList.some((m) => m.id === selectedMotivo)) {
        setSelectedMotivo(motivosList[0].id);
      }
    } else {
      setSelectedMotivo(null);
    }
  }, [selectedMes, selectedArea, motivosList, selectedMotivo]);

  // 5. Group by Produto / SKU for Selected Motivo, Área and Mês (Level 4)
  const produtosList = useMemo(() => {
    if (!selectedMes || !selectedArea || !selectedMotivo) return [];
    const prodPerdas = filteredPerdas.filter(
      (p) =>
        (p.mesRef || (p.data ? p.data.slice(0, 7) : 'Sem Mês')) === selectedMes &&
        (p.area || 'Armazém') === selectedArea &&
        (p.motivo || 'OUTROS MOTIVOS') === selectedMotivo
    );
    const motTotalVal = prodPerdas.reduce((acc, p) => acc + (p.valorR$ || 0), 0);
    const motTotalQtd = prodPerdas.reduce((acc, p) => acc + (p.quantidade || 0), 0);

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

    prodPerdas.forEach((p, idx) => {
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
      const motMetric = metric === 'valor' ? motTotalVal : motTotalQtd;
      const pct = motMetric > 0 ? (metricVal / motMetric) * 100 : 0;
      const pctTotal = totalBase.valor > 0 ? (p.valor / totalBase.valor) * 100 : 0;
      return {
        id: p.keyId,
        label: p.produto,
        codigo: p.codProduto,
        sublabel: `Cód. ${p.codProduto} • ${p.hlPerdido.toFixed(3)} HL • ${p.quantidade.toLocaleString('pt-BR')} un`,
        valor: p.valor,
        quantidade: p.quantidade,
        hl: p.hlPerdido,
        percentual: pct,
        percentualTotal: pctTotal,
        registros: p.registros,
      };
    });

    return list.sort((a, b) => {
      return metric === 'valor' ? b.valor - a.valor : b.quantidade - a.quantidade;
    });
  }, [filteredPerdas, selectedMes, selectedArea, selectedMotivo, metric, totalBase]);

  // Max values for proportional bars
  const maxMesMetric = useMemo(() => {
    return Math.max(...mesesList.map((m) => (metric === 'valor' ? m.valor : m.quantidade)), 1);
  }, [mesesList, metric]);

  const maxAreaMetric = useMemo(() => {
    return Math.max(...areasList.map((a) => (metric === 'valor' ? a.valor : a.quantidade)), 1);
  }, [areasList, metric]);

  const maxMotivoMetric = useMemo(() => {
    return Math.max(...motivosList.map((m) => (metric === 'valor' ? m.valor : m.quantidade)), 1);
  }, [motivosList, metric]);

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

    // Level 1 Lines (Root -> Meses)
    const l1: { x1: number; y1: number; x2: number; y2: number; active: boolean; id: string }[] = [];
    if (isRootOpen) {
      mesNodesRef.current.forEach((el, mesId) => {
        if (el) {
          const childAnchor = getAnchorLeft(el);
          l1.push({
            x1: rootAnchor.x,
            y1: rootAnchor.y,
            x2: childAnchor.x,
            y2: childAnchor.y,
            active: mesId === selectedMes,
            id: `root-${mesId}`,
          });
        }
      });
    }

    // Level 2 Lines (Selected Mês -> Áreas)
    const l2: { x1: number; y1: number; x2: number; y2: number; active: boolean; id: string }[] = [];
    if (isRootOpen && selectedMes) {
      const selectedMesEl = mesNodesRef.current.get(selectedMes);
      if (selectedMesEl) {
        const mesAnchor = getAnchorRight(selectedMesEl);
        areaNodesRef.current.forEach((el, areaId) => {
          if (el) {
            const childAnchor = getAnchorLeft(el);
            l2.push({
              x1: mesAnchor.x,
              y1: mesAnchor.y,
              x2: childAnchor.x,
              y2: childAnchor.y,
              active: areaId === selectedArea,
              id: `${selectedMes}-${areaId}`,
            });
          }
        });
      }
    }

    // Level 3 Lines (Selected Área -> Motivos)
    const l3: { x1: number; y1: number; x2: number; y2: number; active: boolean; id: string }[] = [];
    if (isRootOpen && selectedMes && selectedArea) {
      const selectedAreaEl = areaNodesRef.current.get(selectedArea);
      if (selectedAreaEl) {
        const areaAnchor = getAnchorRight(selectedAreaEl);
        motivoNodesRef.current.forEach((el, motId) => {
          if (el) {
            const childAnchor = getAnchorLeft(el);
            l3.push({
              x1: areaAnchor.x,
              y1: areaAnchor.y,
              x2: childAnchor.x,
              y2: childAnchor.y,
              active: motId === selectedMotivo,
              id: `${selectedArea}-${motId}`,
            });
          }
        });
      }
    }

    // Level 4 Lines (Selected Motivo -> Produtos)
    const l4: { x1: number; y1: number; x2: number; y2: number; active: boolean; id: string }[] = [];
    if (isRootOpen && selectedMes && selectedArea && selectedMotivo) {
      const selectedMotivoEl = motivoNodesRef.current.get(selectedMotivo);
      if (selectedMotivoEl) {
        const motivoAnchor = getAnchorRight(selectedMotivoEl);
        prodNodesRef.current.forEach((el, prodId) => {
          if (el) {
            const childAnchor = getAnchorLeft(el);
            l4.push({
              x1: motivoAnchor.x,
              y1: motivoAnchor.y,
              x2: childAnchor.x,
              y2: childAnchor.y,
              active: prodId === selectedProduto,
              id: `${selectedMotivo}-${prodId}`,
            });
          }
        });
      }
    }

    setLines({ level1: l1, level2: l2, level3: l3, level4: l4 });
  }, [isRootOpen, selectedMes, selectedArea, selectedMotivo, selectedProduto]);

  // Hook resize and update lines
  useEffect(() => {
    const handleUpdate = () => {
      requestAnimationFrame(updateConnectorLines);
    };

    const timer1 = setTimeout(handleUpdate, 60);
    const timer2 = setTimeout(handleUpdate, 240);
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
    mesesList,
    areasList,
    motivosList,
    produtosList,
    selectedMes,
    selectedArea,
    selectedMotivo,
    selectedProduto,
    isRootOpen,
    limitMes,
    limitArea,
    limitMotivo,
    limitProd,
    metric,
  ]);

  // Smooth scroll helper
  const scrollToCol = (colRef: React.RefObject<HTMLDivElement | null>) => {
    setTimeout(() => {
      if (colRef.current && containerRef.current) {
        colRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      }
    }, 50);
  };

  // Helper to render Bezier Curve path
  const renderBezier = (x1: number, y1: number, x2: number, y2: number) => {
    const deltaX = (x2 - x1) * 0.5;
    return `M ${x1} ${y1} C ${x1 + deltaX} ${y1}, ${x2 - deltaX} ${y2}, ${x2} ${y2}`;
  };

  // Click & Toggle Handlers
  const handleToggleRoot = () => {
    if (isRootOpen) {
      setIsRootOpen(false);
      setSelectedMes(null);
      setSelectedArea(null);
      setSelectedMotivo(null);
      setSelectedProduto(null);
    } else {
      setIsRootOpen(true);
      if (mesesList.length > 0) {
        setSelectedMes(mesesList[0].id);
      }
    }
  };

  const handleSelectMes = (mesId: string) => {
    setSelectedMes(mesId);
    setSelectedArea(null);
    setSelectedMotivo(null);
    setSelectedProduto(null);
    scrollToCol(colAreaRef);
  };

  const handleSelectArea = (areaId: string) => {
    setSelectedArea(areaId);
    setSelectedMotivo(null);
    setSelectedProduto(null);
    scrollToCol(colMotivoRef);
  };

  const handleSelectMotivo = (motId: string) => {
    setSelectedMotivo(motId);
    setSelectedProduto(null);
    scrollToCol(colProdRef);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    if (mesesList.length > 0) {
      setSelectedMes(mesesList[0].id);
    }
  };

  return (
    <div
      id="quebras-decomposition-tree-wrapper"
      className={`w-full bg-white border border-blue-200 rounded-2xl shadow-sm shadow-blue-900/5 relative transition-all duration-300 ${
        isFullscreen
          ? 'fixed inset-0 z-50 p-4 sm:p-6 bg-slate-50 overflow-y-auto flex flex-col justify-between'
          : 'p-4 sm:p-5 overflow-hidden'
      }`}
    >
      {/* Top Header Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 mb-3 border-b border-blue-100">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
            <span className="text-xs sm:text-sm font-black text-blue-950 tracking-wide">
              Árvore de Decomposição: Total → Mês → Área → Motivo → Produtos
            </span>
          </div>

          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-200 font-bold">
            5 Níveis de Análise
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Search */}
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar SKU, motivo, área..."
              className="bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 w-36 sm:w-48 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 text-slate-400 hover:text-slate-600 text-[10px] font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Metric Switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px]">
            <button
              onClick={() => setMetric('valor')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                metric === 'valor'
                  ? 'bg-blue-600 text-white shadow-sm font-black'
                  : 'text-slate-600 hover:text-blue-950'
              }`}
            >
              <DollarSign className="w-3 h-3" />
              <span>R$ Prejuízo</span>
            </button>
            <button
              onClick={() => setMetric('quantidade')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                metric === 'quantidade'
                  ? 'bg-blue-600 text-white shadow-sm font-black'
                  : 'text-slate-600 hover:text-blue-950'
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-blue-950 border border-slate-200 font-bold text-xs transition-all cursor-pointer shadow-sm"
            title={isFullscreen ? 'Sair da Tela Cheia' : 'Expandir Tela Cheia'}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sair da Tela Cheia</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tela Cheia</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Interactive Breadcrumb Trail */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 text-[11px] text-slate-500 font-medium custom-scrollbar select-none">
        <button
          onClick={() => {
            setIsRootOpen(true);
            setSelectedMes(null);
            setSelectedArea(null);
            setSelectedMotivo(null);
            setSelectedProduto(null);
          }}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-md transition-colors ${
            !selectedMes ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200' : 'hover:text-blue-950'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-blue-600" />
          <span>Total Geral ({formatCurrency(totalBase.valor)})</span>
        </button>

        {selectedMes && (
          <>
            <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
            <button
              onClick={() => {
                setSelectedArea(null);
                setSelectedMotivo(null);
                setSelectedProduto(null);
              }}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md transition-colors ${
                selectedMes && !selectedArea
                  ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                  : 'hover:text-blue-950'
              }`}
            >
              <Calendar className="w-3 h-3 text-blue-600" />
              <span>{formatMesAno(selectedMes) || selectedMes}</span>
            </button>
          </>
        )}

        {selectedArea && (
          <>
            <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
            <button
              onClick={() => {
                setSelectedMotivo(null);
                setSelectedProduto(null);
              }}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md transition-colors ${
                selectedArea && !selectedMotivo
                  ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-200'
                  : 'hover:text-blue-950'
              }`}
            >
              <Building2 className="w-3 h-3 text-emerald-600" />
              <span>{selectedArea}</span>
            </button>
          </>
        )}

        {selectedMotivo && (
          <>
            <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
            <button
              onClick={() => setSelectedProduto(null)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md transition-colors ${
                selectedMotivo && !selectedProduto
                  ? 'bg-amber-50 text-amber-800 font-bold border border-amber-200'
                  : 'hover:text-blue-950'
              }`}
            >
              <AlertTriangle className="w-3 h-3 text-amber-600" />
              <span>{selectedMotivo}</span>
            </button>
          </>
        )}

        {selectedProduto && (
          <>
            <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold border border-purple-200">
              <Package className="w-3 h-3 text-purple-600" />
              <span>SKU Selecionado</span>
            </span>
          </>
        )}
      </div>

      {/* Main Tree Canvas Area */}
      <div
        ref={containerRef}
        className={`relative overflow-x-auto custom-scrollbar py-2 px-1 select-none w-full ${
          isFullscreen ? 'flex-1 min-h-[580px]' : 'min-h-[460px]'
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
            <linearGradient id="lineGradActive" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>

          {/* Level 1 Lines (Root to Meses) */}
          {lines.level1.map((l) => (
            <path
              key={l.id}
              d={renderBezier(l.x1, l.y1, l.x2, l.y2)}
              fill="none"
              stroke={l.active ? '#2563eb' : '#cbd5e1'}
              strokeWidth={l.active ? 2.5 : 1.2}
              strokeOpacity={l.active ? 1 : 0.6}
            />
          ))}

          {/* Level 2 Lines (Selected Mês to Áreas) */}
          {lines.level2.map((l) => (
            <path
              key={l.id}
              d={renderBezier(l.x1, l.y1, l.x2, l.y2)}
              fill="none"
              stroke={l.active ? '#10b981' : '#cbd5e1'}
              strokeWidth={l.active ? 2.5 : 1.2}
              strokeOpacity={l.active ? 1 : 0.6}
            />
          ))}

          {/* Level 3 Lines (Selected Área to Motivos) */}
          {lines.level3.map((l) => (
            <path
              key={l.id}
              d={renderBezier(l.x1, l.y1, l.x2, l.y2)}
              fill="none"
              stroke={l.active ? '#f59e0b' : '#cbd5e1'}
              strokeWidth={l.active ? 2.5 : 1.2}
              strokeOpacity={l.active ? 1 : 0.6}
            />
          ))}

          {/* Level 4 Lines (Selected Motivo to Produtos) */}
          {lines.level4.map((l) => (
            <path
              key={l.id}
              d={renderBezier(l.x1, l.y1, l.x2, l.y2)}
              fill="none"
              stroke={l.active ? '#8b5cf6' : '#cbd5e1'}
              strokeWidth={l.active ? 2.5 : 1.2}
              strokeOpacity={l.active ? 1 : 0.6}
            />
          ))}
        </svg>

        {/* Tree Columns Flex Layout */}
        <div className="flex items-stretch gap-4 sm:gap-6 md:gap-7 relative z-20 w-full min-w-max">
          {/* ========================================================
              COLUNA 0: TOTAL GERAL (Raiz)
             ======================================================== */}
          <div className="w-[200px] shrink-0 flex flex-col justify-center items-center">
            <div
              ref={rootNodeRef}
              className={`w-full bg-white border-2 rounded-2xl p-4 shadow-sm relative transition-all text-center ${
                isRootOpen
                  ? 'border-blue-600 ring-2 ring-blue-600/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Horizontal Progress Bar */}
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-2.5">
                <div className="bg-blue-600 h-full w-full rounded-full" />
              </div>

              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                  Nível 1 (Raiz)
                </span>
                <h4 className="text-xs sm:text-sm font-black text-blue-950 leading-tight mt-0.5">
                  Prejuízo Total
                </h4>
                <div className="text-xs font-mono font-bold text-blue-600 mt-1">
                  100.0% do Prejuízo
                </div>
                <div className="text-sm sm:text-base font-black text-blue-950 font-mono mt-0.5">
                  {metric === 'valor'
                    ? formatCurrency(totalBase.valor)
                    : `${totalBase.quantidade.toLocaleString('pt-BR')} un`}
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                  {totalBase.registros.toLocaleString('pt-BR')} quebras • {totalBase.hl.toFixed(2)} HL
                </div>

                {/* Arrow Button to expand/collapse */}
                <button
                  id="btn-toggle-quebras-root"
                  onClick={handleToggleRoot}
                  className={`mt-3 flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm w-full ${
                    isRootOpen
                      ? 'bg-blue-600 text-white hover:bg-blue-700 font-black'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                  }`}
                  title={isRootOpen ? 'Clique para recolher meses' : 'Clique para expandir meses'}
                >
                  <span>{isRootOpen ? 'Meses (Abertos)' : 'Expandir Meses'}</span>
                  <ChevronRight
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isRootOpen ? 'rotate-90 text-white' : 'text-blue-600'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* ========================================================
              COLUNA 1: MÊS (Total -> Mês)
             ======================================================== */}
          {isRootOpen && (
            <div ref={colMesRef} className="w-[210px] shrink-0 flex flex-col space-y-2.5">
              <div className="flex items-center justify-between pb-1 border-b border-blue-500/80">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-xs font-black text-blue-950 uppercase tracking-wider">
                    Mês
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSortMesBy(sortMesBy === 'cronologico' ? 'valor' : 'cronologico')}
                    className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors font-bold"
                    title={sortMesBy === 'cronologico' ? 'Em sequência cronológica (Jan-Dez). Clique para ordenar por valor.' : 'Ordenado por maior prejuízo. Clique para ver em sequência (Jan-Dez).'}
                  >
                    {sortMesBy === 'cronologico' ? 'Sequência (Jan-Dez)' : 'Pareto (Maior R$)'}
                  </button>
                </div>
              </div>

              <div className="space-y-2.5">
                {mesesList.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                    Nenhum mês encontrado
                  </div>
                ) : (
                  mesesList.slice(0, limitMes).map((mes) => {
                    const isSelected = mes.id === selectedMes;
                    const curMetric = metric === 'valor' ? mes.valor : mes.quantidade;
                    const barWidth = `${Math.min(100, Math.max(6, (curMetric / maxMesMetric) * 100))}%`;

                    return (
                      <div
                        key={mes.id}
                        ref={(el) => {
                          if (el) mesNodesRef.current.set(mes.id, el);
                          else mesNodesRef.current.delete(mes.id);
                        }}
                        onClick={() => handleSelectMes(mes.id)}
                        className={`rounded-xl p-2.5 border transition-all cursor-pointer relative group ${
                          isSelected
                            ? 'bg-blue-50/70 border-blue-500 shadow-md shadow-blue-500/5 ring-1 ring-blue-500/40'
                            : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50/20'
                        }`}
                      >
                        {/* Top Proportional Bar */}
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-1.5">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isSelected ? 'bg-blue-600' : 'bg-blue-400 group-hover:bg-blue-600'
                            }`}
                            style={{ width: barWidth }}
                          />
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h4
                              className={`text-xs font-bold truncate ${
                                isSelected ? 'text-blue-950' : 'text-slate-800'
                              }`}
                            >
                              {mes.label}
                            </h4>
                            <div className="text-[10px] font-mono text-slate-500 truncate">
                              {mes.sublabel}
                            </div>
                            <div className="flex items-center justify-between mt-1 pt-0.5">
                              <span className="text-[11px] font-mono font-semibold text-blue-700">
                                {mes.percentual.toFixed(1)}%{' '}
                                <span className="text-[9px] text-slate-400 font-sans">do total</span>
                              </span>
                              <span className="text-xs font-bold text-blue-950 font-mono">
                                {metric === 'valor'
                                  ? formatCurrency(mes.valor)
                                  : `${mes.quantidade.toLocaleString('pt-BR')} un`}
                              </span>
                            </div>
                          </div>

                          {/* Interactive Arrow Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectMes(mes.id);
                            }}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/40 font-black'
                                : 'bg-slate-100 text-blue-600 hover:bg-blue-600 hover:text-white border border-slate-200'
                            }`}
                            title={
                              isSelected
                                ? 'Mês selecionado (exibindo áreas)'
                                : 'Clique para desdobrar as áreas deste mês'
                            }
                          >
                            <ChevronRight
                              className={`w-4 h-4 transition-transform duration-200 ${
                                isSelected ? 'rotate-90 text-white font-black' : ''
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}

                {mesesList.length > limitMes && (
                  <button
                    onClick={() => setLimitMes(limitMes + 6)}
                    className="w-full py-1 text-center text-[11px] text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer font-bold"
                  >
                    + Ver mais {mesesList.length - limitMes} meses
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ========================================================
              COLUNA 2: ÁREA / ARMAZÉM / ENTREGA / PUXADA
             ======================================================== */}
          {isRootOpen && selectedMes && (
            <div ref={colAreaRef} className="w-[220px] shrink-0 flex flex-col space-y-2.5">
              <div className="flex items-center justify-between pb-1 border-b border-emerald-500/80">
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-xs font-black text-blue-950 uppercase tracking-wider">
                    Área / Armazém / Rota
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-700 font-bold">
                  {areasList.length} áreas
                </span>
              </div>

              <div className="space-y-2.5">
                {areasList.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                    Nenhuma área registrada para este mês
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
                        onClick={() => handleSelectArea(area.id)}
                        className={`rounded-xl p-2.5 border transition-all cursor-pointer relative group ${
                          isSelected
                            ? 'bg-emerald-50/70 border-emerald-500 shadow-md shadow-emerald-500/5 ring-1 ring-emerald-500/40'
                            : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/20'
                        }`}
                      >
                        {/* Top Proportional Bar */}
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-1.5">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isSelected ? 'bg-emerald-600' : 'bg-emerald-400 group-hover:bg-emerald-600'
                            }`}
                            style={{ width: barWidth }}
                          />
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h4
                              className={`text-xs font-bold truncate ${
                                isSelected ? 'text-emerald-950' : 'text-slate-800'
                              }`}
                            >
                              {area.label}
                            </h4>
                            <div className="text-[10px] font-mono text-slate-500 truncate">
                              {area.sublabel}
                            </div>
                            <div className="flex items-center justify-between mt-1 pt-0.5">
                              <span className="text-[11px] font-mono font-semibold text-emerald-700">
                                {area.percentual.toFixed(1)}%{' '}
                                <span className="text-[9px] text-slate-400 font-sans">do mês</span>
                              </span>
                              <span className="text-xs font-bold text-blue-950 font-mono">
                                {metric === 'valor'
                                  ? formatCurrency(area.valor)
                                  : `${area.quantidade.toLocaleString('pt-BR')} un`}
                              </span>
                            </div>
                          </div>

                          {/* Interactive Arrow Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectArea(area.id);
                            }}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400/40 font-black'
                                : 'bg-slate-100 text-emerald-600 hover:bg-emerald-600 hover:text-white border border-slate-200'
                            }`}
                            title={
                              isSelected
                                ? 'Área selecionada (exibindo motivos)'
                                : 'Clique para ver os motivos de perda desta área'
                            }
                          >
                            <ChevronRight
                              className={`w-4 h-4 transition-transform duration-200 ${
                                isSelected ? 'rotate-90 text-white font-black' : ''
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
                    className="w-full py-1 text-center text-[11px] text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer font-bold"
                  >
                    + Ver mais {areasList.length - limitArea} áreas
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ========================================================
              COLUNA 3: MOTIVO (Área -> Motivo)
             ======================================================== */}
          {isRootOpen && selectedMes && selectedArea && (
            <div ref={colMotivoRef} className="w-[220px] shrink-0 flex flex-col space-y-2.5">
              <div className="flex items-center justify-between pb-1 border-b border-amber-500/80">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span className="text-xs font-black text-blue-950 uppercase tracking-wider">
                    Motivo de Perda
                  </span>
                </div>
                <span className="text-[10px] font-mono text-amber-700 font-bold">
                  {motivosList.length} motivos
                </span>
              </div>

              <div className="space-y-2.5">
                {motivosList.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                    Nenhum motivo registrado
                  </div>
                ) : (
                  motivosList.slice(0, limitMotivo).map((mot) => {
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
                        onClick={() => handleSelectMotivo(mot.id)}
                        className={`rounded-xl p-2.5 border transition-all cursor-pointer relative group ${
                          isSelected
                            ? 'bg-amber-50/70 border-amber-500 shadow-md shadow-amber-500/5 ring-1 ring-amber-500/40'
                            : 'bg-white border-slate-200 hover:border-amber-300 hover:bg-amber-50/20'
                        }`}
                      >
                        {/* Top Proportional Bar */}
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-1.5">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isSelected ? 'bg-amber-500' : 'bg-amber-400 group-hover:bg-amber-500'
                            }`}
                            style={{ width: barWidth }}
                          />
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h4
                              className={`text-xs font-bold truncate ${
                                isSelected ? 'text-amber-950' : 'text-slate-800'
                              }`}
                            >
                              {mot.label}
                            </h4>
                            <div className="text-[10px] font-mono text-slate-500 truncate">
                              {mot.sublabel}
                            </div>
                            <div className="flex items-center justify-between mt-1 pt-0.5">
                              <span className="text-[11px] font-mono font-semibold text-amber-700">
                                {mot.percentual.toFixed(1)}%{' '}
                                <span className="text-[9px] text-slate-400 font-sans">da área</span>
                              </span>
                              <span className="text-xs font-bold text-blue-950 font-mono">
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
                              handleSelectMotivo(mot.id);
                            }}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-400/40 font-black'
                                : 'bg-slate-100 text-amber-600 hover:bg-amber-500 hover:text-white border border-slate-200'
                            }`}
                            title={
                              isSelected
                                ? 'Motivo selecionado (exibindo produtos)'
                                : 'Clique para ver os produtos/SKUs deste motivo'
                            }
                          >
                            <ChevronRight
                              className={`w-4 h-4 transition-transform duration-200 ${
                                isSelected ? 'rotate-90 text-white font-black' : ''
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}

                {motivosList.length > limitMotivo && (
                  <button
                    onClick={() => setLimitMotivo(limitMotivo + 6)}
                    className="w-full py-1 text-center text-[11px] text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer font-bold"
                  >
                    + Ver mais {motivosList.length - limitMotivo} motivos
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ========================================================
              COLUNA 4: PRODUTOS / SKUs (Motivo -> Produtos)
             ======================================================== */}
          {isRootOpen && selectedMes && selectedArea && selectedMotivo && (
            <div ref={colProdRef} className="w-[260px] shrink-0 flex flex-col space-y-2.5">
              <div className="flex items-center justify-between pb-1 border-b border-purple-500/80">
                <div className="flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-purple-600" />
                  <span className="text-xs font-black text-blue-950 uppercase tracking-wider">
                    Produtos / SKUs
                  </span>
                </div>
                <span className="text-[10px] font-mono text-purple-700 font-bold">
                  {produtosList.length} SKUs
                </span>
              </div>

              <div className="space-y-2.5">
                {produtosList.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
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
                            ? 'bg-purple-50/70 border-purple-500 shadow-md shadow-purple-500/5 ring-1 ring-purple-500/40'
                            : 'bg-white border-slate-200 hover:border-purple-300 hover:bg-purple-50/20'
                        }`}
                      >
                        {/* Top Proportional Bar */}
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-1.5">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isSelected ? 'bg-purple-600' : 'bg-purple-400 group-hover:bg-purple-600'
                            }`}
                            style={{ width: barWidth }}
                          />
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h4
                              className={`text-xs font-bold truncate ${
                                isSelected ? 'text-purple-950' : 'text-slate-800'
                              }`}
                              title={prod.label}
                            >
                              {prod.label}
                            </h4>
                            <div className="text-[10px] text-slate-500 font-mono truncate">
                              {prod.sublabel}
                            </div>
                            <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-100">
                              <span className="text-[11px] font-mono font-semibold text-purple-700">
                                {prod.percentual.toFixed(1)}%{' '}
                                <span className="text-[9px] text-slate-400 font-sans">do motivo</span>
                              </span>
                              <span className="text-xs font-bold text-blue-950 font-mono">
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
                    className="w-full py-1 text-center text-[11px] text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors cursor-pointer font-bold"
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
