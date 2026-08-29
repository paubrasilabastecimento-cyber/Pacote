import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  RegistroPerda,
  PlanoAcao,
  KPIStats,
  ComentarioRevisao,
  RegistroTrocaImproprio,
  FiltroGlobal,
  MenuItemId,
} from '../types';
import {
  DEMO_REGISTROS_PERDAS,
  DEMO_PLANOS_ACAO,
  HISTORICO_KPIS,
  DEMO_COMENTARIOS_REVISAO,
  DEMO_TROCAS_IMPROPRIO,
  AREAS,
  PRODUTOS_AMBEV,
  MOTIVOS_PERDA,
  META_ORCADA_ANUAL_2026,
  META_ORCADA_MENSAL_PADRAO,
  MONTHLY_METAS_MAP_2026,
} from '../data/mockData';
import { ItemPlanilha, DADOS_PLANILHA_DEMO } from '../utils/spreadsheetAnalyzer';
import { subscribeToPlatformDataFirestore, savePlatformDataToFirestore } from '../utils/firestoreService';
import { saveRefugoData } from '../utils/refugoUtils';

interface AppContextType {
  activeTab: MenuItemId;
  setActiveTab: (tab: MenuItemId) => void;
  filtros: FiltroGlobal;
  setFiltros: React.Dispatch<React.SetStateAction<FiltroGlobal>>;
  resetFiltros: () => void;
  
  // Data
  perdas: RegistroPerda[];
  acoes: PlanoAcao[];
  kpis: KPIStats[];
  comentarios: ComentarioRevisao[];
  trocasImproprio: RegistroTrocaImproprio[];
  trocaPlanilhaItens: ItemPlanilha[];
  nomeArquivoTroca: string | null;
  
  // Filtered Records
  filteredPerdas: RegistroPerda[];
  filteredAcoes: PlanoAcao[];
  filteredTrocasImproprio: RegistroTrocaImproprio[];
  
  // Actions
  addPerda: (perda: Omit<RegistroPerda, 'id' | 'createdAt'>) => Promise<void>;
  importBatchPerdas: (items: any[], overwrite?: boolean) => Promise<void>;
  importBatchTrocaPlanilha: (items: ItemPlanilha[], nomeArquivo?: string, overwrite?: boolean) => Promise<void>;
  updatePerda: (id: string, perda: Partial<RegistroPerda>) => Promise<void>;
  deletePerda: (id: string) => Promise<void>;
  
  addAcao: (acao: Omit<PlanoAcao, 'id'>) => Promise<void>;
  updateAcao: (id: string, acao: Partial<PlanoAcao>) => Promise<void>;
  deleteAcao: (id: string) => Promise<void>;
  
  updateKPI: (mes: string, kpi: Partial<KPIStats>) => Promise<void>;
  
  addComentario: (comentario: Omit<ComentarioRevisao, 'id' | 'data'>) => Promise<void>;
  deleteComentario: (id: string) => Promise<void>;

  addTrocaImproprio: (troca: Omit<RegistroTrocaImproprio, 'id' | 'createdAt'>) => Promise<void>;
  updateTrocaImproprio: (id: string, troca: Partial<RegistroTrocaImproprio>) => Promise<void>;
  deleteTrocaImproprio: (id: string) => Promise<void>;
  
  resetDemoData: () => Promise<void>;
  clearAllData: () => Promise<void>;
  isLoading: boolean;
  
  // Computed Monthly KPI for current active filter or latest month
  currentMonthKPI: KPIStats;
  computedMonthKPIs: KPIStats[];

  // Dynamic values found in registered perdas
  availableMonths: string[];
  availableAreas: string[];
  availableProdutos: string[];
  availableMotivos: string[];
}

const initialFiltros: FiltroGlobal = {
  dataInicio: '',
  dataFim: '',
  mes: '', // empty = todos/todos do período
  area: '',
  turno: '',
  produto: '',
  motivo: '',
  responsavel: '',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<MenuItemId>('dashboard-geral');
  const [filtros, setFiltros] = useState<FiltroGlobal>(initialFiltros);
  
  const [perdas, setPerdas] = useState<RegistroPerda[]>([]);
  const [acoes, setAcoes] = useState<PlanoAcao[]>([]);
  const [kpis, setKpis] = useState<KPIStats[]>([]);
  const [comentarios, setComentarios] = useState<ComentarioRevisao[]>([]);
  const [trocasImproprio, setTrocasImproprio] = useState<RegistroTrocaImproprio[]>([]);
  const [trocaPlanilhaItens, setTrocaPlanilhaItens] = useState<ItemPlanilha[]>(() => {
    try {
      const cached = localStorage.getItem('AMBEV_TROCA_PLANILHA_ITENS');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });
  const [nomeArquivoTroca, setNomeArquivoTroca] = useState<string | null>(() => {
    try {
      return localStorage.getItem('AMBEV_TROCA_PLANILHA_NOME_ARQUIVO') || null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // BroadcastChannel, Firestore Real-Time listener and window event listeners for multi-tab and platform-wide sync
  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('AMBEV_PACOTE_PREJUIZO_CHANNEL');
      bc.onmessage = (event) => {
        if (event.data && event.data.type === 'SYNC') {
          fetchData();
        } else if (event.data && event.data.type === 'CLEAR_ALL') {
          handleLocalClear();
        } else if (event.data && event.data.type === 'RESET_DEMO') {
          fetchData();
        }
      };
    } catch {
      // Fallback if BroadcastChannel not supported
    }

    // Assinatura em tempo real do banco de dados na nuvem (Firestore)
    let unsubscribeFirestore: (() => void) | null = null;
    try {
      unsubscribeFirestore = subscribeToPlatformDataFirestore((cloudData) => {
        if (!cloudData) return;
        if (Array.isArray(cloudData.perdas)) setPerdas(cloudData.perdas);
        if (Array.isArray(cloudData.acoes)) setAcoes(cloudData.acoes);
        if (Array.isArray(cloudData.kpis) && cloudData.kpis.length > 0) setKpis(cloudData.kpis);
        if (Array.isArray(cloudData.comentarios)) setComentarios(cloudData.comentarios);
        if (Array.isArray(cloudData.trocasImproprio)) setTrocasImproprio(cloudData.trocasImproprio);
        if (Array.isArray(cloudData.trocaPlanilhaItens)) {
          setTrocaPlanilhaItens(cloudData.trocaPlanilhaItens);
        }
        if (cloudData.nomeArquivoTroca !== undefined) {
          setNomeArquivoTroca(cloudData.nomeArquivoTroca);
        }
        if (Array.isArray(cloudData.refugoItens) && cloudData.refugoItens.length > 0) {
          saveRefugoData(cloudData.refugoItens);
        }
      });
    } catch (err) {
      console.warn('[Firestore] Realtime subscription fallback:', err);
    }

    const handleClearEvent = () => {
      handleLocalClear();
    };

    const handleResetEvent = () => {
      fetchData();
    };

    window.addEventListener('ambev_platform_data_cleared', handleClearEvent);
    window.addEventListener('ambev_platform_data_reset', handleResetEvent);

    return () => {
      if (bc) bc.close();
      if (unsubscribeFirestore) unsubscribeFirestore();
      window.removeEventListener('ambev_platform_data_cleared', handleClearEvent);
      window.removeEventListener('ambev_platform_data_reset', handleResetEvent);
    };
  }, []);

  const handleLocalClear = () => {
    setPerdas([]);
    setAcoes([]);
    setComentarios([]);
    setTrocasImproprio([]);
    setTrocaPlanilhaItens([]);
    setNomeArquivoTroca(null);
    setKpis([]);
  };

  const notifySync = () => {
    try {
      const bc = new BroadcastChannel('AMBEV_PACOTE_PREJUIZO_CHANNEL');
      bc.postMessage({ type: 'SYNC', timestamp: Date.now() });
      bc.close();
    } catch {
      // ignore
    }
  };

  // Fetch initial data from server
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [perdasRes, acoesRes, kpisRes, comRes, trocasRes, trocaPlanilhaRes] = await Promise.all([
        fetch('/api/perdas').then((r) => r.ok ? r.json() : null),
        fetch('/api/acoes').then((r) => r.ok ? r.json() : null),
        fetch('/api/kpis').then((r) => r.ok ? r.json() : null),
        fetch('/api/comentarios').then((r) => r.ok ? r.json() : null),
        fetch('/api/trocas-improprio').then((r) => r.ok ? r.json() : null),
        fetch('/api/troca-planilha').then((r) => r.ok ? r.json() : null),
      ]);

      if (perdasRes) setPerdas(Array.isArray(perdasRes) ? perdasRes : []);
      if (acoesRes) setAcoes(Array.isArray(acoesRes) ? acoesRes : []);
      if (kpisRes) setKpis(Array.isArray(kpisRes) ? kpisRes : []);
      if (comRes) setComentarios(Array.isArray(comRes) ? comRes : []);
      if (trocasRes) setTrocasImproprio(Array.isArray(trocasRes) ? trocasRes : []);
      if (trocaPlanilhaRes && Array.isArray(trocaPlanilhaRes.itens)) {
        setTrocaPlanilhaItens(trocaPlanilhaRes.itens);
        setNomeArquivoTroca(trocaPlanilhaRes.nomeArquivo !== undefined ? trocaPlanilhaRes.nomeArquivo : null);
        try {
          localStorage.setItem('AMBEV_TROCA_PLANILHA_ITENS', JSON.stringify(trocaPlanilhaRes.itens));
          if (trocaPlanilhaRes.nomeArquivo) {
            localStorage.setItem('AMBEV_TROCA_PLANILHA_NOME_ARQUIVO', trocaPlanilhaRes.nomeArquivo);
          } else {
            localStorage.removeItem('AMBEV_TROCA_PLANILHA_NOME_ARQUIVO');
          }
        } catch {
          // ignore
        }
      }
    } catch (error) {
      console.warn('Usando dados locais/mock devido a falha de conexão com API:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetFiltros = () => {
    setFiltros(initialFiltros);
  };

  // Filtered Perdas based on global filters
  const filteredPerdas = useMemo(() => {
    return perdas.filter((p) => {
      if (filtros.mes && p.mesRef !== filtros.mes) return false;
      if (filtros.area && p.area !== filtros.area) return false;
      if (filtros.turno && p.turno !== filtros.turno) return false;
      if (filtros.produto && p.produto !== filtros.produto) return false;
      if (filtros.motivo && p.motivo !== filtros.motivo) return false;
      if (
        filtros.responsavel &&
        !p.responsavel.toLowerCase().includes(filtros.responsavel.toLowerCase())
      ) {
        return false;
      }
      if (filtros.dataInicio && p.data < filtros.dataInicio) return false;
      if (filtros.dataFim && p.data > filtros.dataFim) return false;
      return true;
    });
  }, [perdas, filtros]);

  // Filtered Action Plans
  const filteredAcoes = useMemo(() => {
    return acoes.filter((a) => {
      if (filtros.mes && a.mesRef !== filtros.mes) return false;
      if (filtros.area && a.area && a.area !== filtros.area) return false;
      if (filtros.motivo && a.motivoRelacionado && a.motivoRelacionado !== filtros.motivo) return false;
      if (
        filtros.responsavel &&
        !a.responsavel.toLowerCase().includes(filtros.responsavel.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [acoes, filtros]);

  // Filtered Trocas de Produto Impróprio
  const filteredTrocasImproprio = useMemo(() => {
    return trocasImproprio.filter((t) => {
      if (filtros.mes && t.mesRef !== filtros.mes) return false;
      if (filtros.produto && !t.produto.toLowerCase().includes(filtros.produto.toLowerCase())) return false;
      if (filtros.responsavel && !t.responsavel.toLowerCase().includes(filtros.responsavel.toLowerCase())) return false;
      if (filtros.dataInicio && t.data < filtros.dataInicio) return false;
      if (filtros.dataFim && t.data > filtros.dataFim) return false;
      return true;
    });
  }, [trocasImproprio, filtros]);

  // Dynamic available values extracted from all registered perdas

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    kpis.forEach((k) => months.add(k.mes));
    perdas.forEach((p) => {
      if (p.mesRef) months.add(p.mesRef);
    });
    return Array.from(months).sort().reverse();
  }, [kpis, perdas]);

  const availableAreas = useMemo(() => {
    const areas = new Set<string>(AREAS);
    perdas.forEach((p) => {
      if (p.area) areas.add(p.area);
    });
    return Array.from(areas);
  }, [perdas]);

  const availableProdutos = useMemo(() => {
    const prods = new Set<string>(PRODUTOS_AMBEV.map((p) => p.nome));
    perdas.forEach((p) => {
      if (p.produto) prods.add(p.produto);
    });
    return Array.from(prods);
  }, [perdas]);

  const availableMotivos = useMemo(() => {
    const mots = new Set<string>(MOTIVOS_PERDA.map((m) => m.nome));
    perdas.forEach((p) => {
      if (p.motivo) mots.add(p.motivo);
    });
    return Array.from(mots);
  }, [perdas]);

  // Recalculate KPIs dynamically for each month based on actual registered perdas
  const computedMonthKPIs = useMemo(() => {
    const allMonthsSet = new Set<string>();
    // Ensure all 12 months of 2026 are included in chronological sequence
    for (let m = 1; m <= 12; m++) {
      allMonthsSet.add(`2026-${String(m).padStart(2, '0')}`);
    }
    kpis.forEach((k) => allMonthsSet.add(k.mes));
    perdas.forEach((p) => {
      if (p.mesRef) allMonthsSet.add(p.mesRef);
    });

    const sortedMonths = Array.from(allMonthsSet).sort();

    return sortedMonths.map((mes) => {
      const baseKPI = kpis.find((k) => k.mes === mes);
      const perdasDoMes = perdas.filter((p) => p.mesRef === mes);
      const totalHLPerdido = perdasDoMes.length > 0
        ? perdasDoMes.reduce((acc, p) => acc + p.hlPerdido, 0)
        : (baseKPI?.fgliAtual ?? 0);
      const totalValorPerdido = perdasDoMes.length > 0
        ? perdasDoMes.reduce((acc, p) => acc + p.valorR$, 0)
        : (baseKPI?.sclAtual ?? 0);

      const totalHL = baseKPI?.totalHLExpedido || 55000;
      const rsHlCalc = baseKPI && perdasDoMes.length === 0 && baseKPI.rsHlAtual
        ? baseKPI.rsHlAtual
        : totalValorPerdido / totalHL;
      const lossPercent = (totalHLPerdido / totalHL) * 100;
      const wqiCalc = baseKPI && perdasDoMes.length === 0 && baseKPI.wqiAtual
        ? baseKPI.wqiAtual
        : Math.max(0, 100 - lossPercent * 5);

      const fgliMeta = baseKPI?.fgliMeta ?? 8.0;
      const sclMeta = MONTHLY_METAS_MAP_2026[mes] ?? baseKPI?.sclMeta ?? META_ORCADA_MENSAL_PADRAO;
      const rsHlMeta = baseKPI?.rsHlMeta ?? 0.07;
      const wqiMeta = baseKPI?.wqiMeta ?? 98.5;
      const vlcHlMeta = baseKPI?.vlcHlMeta ?? 0.11;

      return {
        id: baseKPI?.id || `kpi-${mes}`,
        mes,
        fgliAtual: Number(totalHLPerdido.toFixed(2)),
        fgliMeta,
        fgliAnterior: baseKPI?.fgliAnterior ?? Number((totalHLPerdido * 0.95).toFixed(2)),
        sclAtual: Number(totalValorPerdido.toFixed(2)),
        sclMeta,
        sclAnterior: baseKPI?.sclAnterior ?? Number((totalValorPerdido * 0.95).toFixed(2)),
        rsHlAtual: Number(rsHlCalc.toFixed(3)),
        rsHlMeta,
        rsHlAnterior: baseKPI?.rsHlAnterior ?? Number((rsHlCalc * 0.95).toFixed(3)),
        wqiAtual: Number(wqiCalc.toFixed(1)),
        wqiMeta,
        wqiAnterior: baseKPI?.wqiAnterior ?? 98.5,
        vlcHlAtual: Number((rsHlCalc * 1.5).toFixed(2)),
        vlcHlMeta,
        vlcHlAnterior: baseKPI?.vlcHlAnterior ?? 0.12,
        totalHLExpedido: totalHL,
      };
    });
  }, [kpis, perdas]);

  // Current Month KPI (specific month if selected, or consolidated aggregate of filteredPerdas)
  const currentMonthKPI = useMemo(() => {
    if (filtros.mes) {
      const found = computedMonthKPIs.find((k) => k.mes === filtros.mes);
      if (found) return found;
    }

    // Consolidated across filtered records when "Todos os Meses" or no specific month is selected
    const totalHLPerdido = filteredPerdas.reduce((acc, p) => acc + p.hlPerdido, 0);
    const totalValorPerdido = filteredPerdas.reduce((acc, p) => acc + p.valorR$, 0);
    const totalHL = 55000 * Math.max(1, computedMonthKPIs.length);
    const rsHlCalc = totalValorPerdido / totalHL;
    const lossPercent = (totalHLPerdido / totalHL) * 100;
    const wqiCalc = Math.max(0, 100 - lossPercent * 5);

    const totalConsolidatedSclMeta = META_ORCADA_ANUAL_2026;
    const totalConsolidatedFgliMeta = computedMonthKPIs.reduce((acc, k) => acc + k.fgliMeta, 0) || 96.0;

    const latest = computedMonthKPIs[computedMonthKPIs.length - 1];

    return {
      id: 'kpi-consolidado',
      mes: filtros.mes || 'Consolidado',
      fgliAtual: Number(totalHLPerdido.toFixed(2)),
      fgliMeta: totalConsolidatedFgliMeta,
      fgliAnterior: Number((totalHLPerdido * 0.95).toFixed(2)),
      sclAtual: Number(totalValorPerdido.toFixed(2)),
      sclMeta: totalConsolidatedSclMeta,
      sclAnterior: Number((totalValorPerdido * 0.95).toFixed(2)),
      rsHlAtual: Number(rsHlCalc.toFixed(2)),
      rsHlMeta: latest?.rsHlMeta ?? 0.80,
      rsHlAnterior: Number((rsHlCalc * 0.95).toFixed(2)),
      wqiAtual: Number(wqiCalc.toFixed(1)),
      wqiMeta: latest?.wqiMeta ?? 99.0,
      wqiAnterior: 98.5,
      vlcHlAtual: Number((rsHlCalc * 1.5).toFixed(2)),
      vlcHlMeta: latest?.vlcHlMeta ?? 1.15,
      vlcHlAnterior: 1.20,
      totalHLExpedido: totalHL,
    };
  }, [computedMonthKPIs, filteredPerdas, filtros.mes]);

  // API Call handlers
  const addPerda = async (perdaData: Omit<RegistroPerda, 'id' | 'createdAt'>) => {
    const newPerda: RegistroPerda = {
      ...perdaData,
      id: `PERD-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setPerdas((prev) => [newPerda, ...prev]);
    try {
      await fetch('/api/perdas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPerda),
      });
      notifySync();
    } catch (err) {
      console.error('Erro ao salvar no servidor:', err);
    }
  };

  const importBatchPerdas = async (items: any[], overwrite = false) => {
    const formatted: RegistroPerda[] = items.map((item, idx) => {
      let rawArea = String(
        item.area ||
          item.Area ||
          item.AREA ||
          item['Área'] ||
          item['área'] ||
          item['ÁREA'] ||
          item.Setor ||
          item.setor ||
          item.Local ||
          item.local ||
          ''
      ).trim();
      const areaUpper = rawArea.toUpperCase();
      const codLimpo = String(item.codigoMotivo || item.codQuebra || item.CodQuebra || '').replace(/^Q-?/i, '').trim();

      let area = 'Armazém';
      if (areaUpper === 'PUXADA' || areaUpper.includes('PUXADA')) {
        area = 'Puxada';
      } else if (
        areaUpper === 'ROTA' ||
        areaUpper === 'ENTREGA' ||
        areaUpper === 'ROTA / ENTREGA' ||
        areaUpper.includes('ROTA') ||
        areaUpper.includes('ENTREGA')
      ) {
        area = 'Rota / Entrega';
      } else if (areaUpper === 'ARMAZEM' || areaUpper === 'ARMAZÉM' || areaUpper.includes('ARMAZ')) {
        area = 'Armazém';
      } else if (areaUpper.includes('PATIO') || areaUpper.includes('PÁTIO')) {
        area = 'Pátio';
      } else if (areaUpper.includes('ENVASE') || areaUpper.includes('LINHA') || areaUpper.includes('PRODUÇÃO')) {
        area = 'Envase';
      } else if (areaUpper.includes('CARREGAMENTO') || areaUpper.includes('DESCARGA')) {
        area = 'Carregamento';
      } else if (areaUpper.includes('RECEBIMENTO')) {
        area = 'Recebimento';
      } else if (rawArea) {
        area = rawArea;
      } else if (['574', '574.4', '575', '576', '577', '578', '584', '585'].includes(codLimpo)) {
        area = 'Puxada';
      } else if (['545', '547', '548', '554', '557'].includes(codLimpo)) {
        area = 'Rota / Entrega';
      } else {
        area = 'Armazém';
      }

      return {
        id: item.id || `PERD-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
        data: item.data || new Date().toISOString().slice(0, 10),
        dataHora: item.dataHora || item.data,
        mesRef: item.mesRef || (item.data ? item.data.slice(0, 7) : new Date().toISOString().slice(0, 7)),
        mesNome: item.mesNome,
        turno: item.turno || item.Turno || '1º Turno',
        area,
        produto: item.produto || (item.Descricao ? `${item.CodProduto ? item.CodProduto + ' - ' : ''}${item.Descricao}` : 'Produto Indefinido'),
        codProduto: item.codProduto || item.CodProduto,
        descricaoProduto: item.descricaoProduto || item.Descricao,
        quantidade: typeof item.quantidade === 'number' ? item.quantidade : (parseFloat(item.Quantidade) || 1),
        hlPerdido: typeof item.hlPerdido === 'number' ? item.hlPerdido : (parseFloat(item['HECTO PERDIDO'] || item['HECTO PERDIDO ']) || 0.01),
        valorR$: typeof item.valorR$ === 'number' ? item.valorR$ : (parseFloat(item['VALOR DA AVARIA'] || item['VALOR_DA_AVARIA'] || item.valor) || 0),
        codigoMotivo: item.codigoMotivo || (item.CodQuebra ? (String(item.CodQuebra).startsWith('Q-') ? String(item.CodQuebra) : `Q-${item.CodQuebra}`) : 'S/C'),
        codQuebra: item.codQuebra || item.CodQuebra,
        motivo: item.motivo || item.Motivo || 'Quebras',
        causa: item.causa || item.motivo || item.Motivo || '',
        responsavel: item.responsavel || item.Colaborador || 'Operador',
        colaborador: item.colaborador || item.Colaborador,
        funcao: item.funcao || item.Funcao,
        observacao: item.observacao || '',
        createdAt: item.createdAt || new Date().toISOString(),
      };
    });

    if (overwrite) {
      setPerdas(formatted);
    } else {
      setPerdas((prev) => [...formatted, ...prev]);
    }

    try {
      await fetch('/api/perdas/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: formatted, overwrite }),
      });
      notifySync();
    } catch (err) {
      console.error('Erro ao importar lote no servidor:', err);
    }
  };

  const importBatchTrocaPlanilha = async (items: ItemPlanilha[], nomeArquivo?: string, overwrite = true) => {
    if (overwrite) {
      setTrocaPlanilhaItens(items);
    } else {
      setTrocaPlanilhaItens((prev) => [...items, ...prev]);
    }
    if (nomeArquivo) {
      setNomeArquivoTroca(nomeArquivo);
    }

    try {
      localStorage.setItem('AMBEV_TROCA_PLANILHA_ITENS', JSON.stringify(items));
      if (nomeArquivo) {
        localStorage.setItem('AMBEV_TROCA_PLANILHA_NOME_ARQUIVO', nomeArquivo);
      }
    } catch {
      // ignore
    }

    try {
      await fetch('/api/troca-planilha/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, nomeArquivo, overwrite }),
      });
      notifySync();
    } catch (err) {
      console.error('Erro ao salvar planilha de trocas no servidor:', err);
    }
  };

  const updatePerda = async (id: string, updateData: Partial<RegistroPerda>) => {
    setPerdas((prev) => prev.map((p) => (p.id === id ? { ...p, ...updateData } : p)));
    try {
      await fetch(`/api/perdas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      notifySync();
    } catch (err) {
      console.error('Erro ao atualizar perda:', err);
    }
  };

  const deletePerda = async (id: string) => {
    setPerdas((prev) => prev.filter((p) => p.id !== id));
    try {
      await fetch(`/api/perdas/${id}`, { method: 'DELETE' });
      notifySync();
    } catch (err) {
      console.error('Erro ao excluir perda:', err);
    }
  };

  const addAcao = async (acaoData: Omit<PlanoAcao, 'id'>) => {
    const newAcao: PlanoAcao = {
      ...acaoData,
      id: `PA-${Date.now()}`,
    };
    setAcoes((prev) => [newAcao, ...prev]);
    try {
      await fetch('/api/acoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAcao),
      });
      notifySync();
    } catch (err) {
      console.error('Erro ao adicionar plano:', err);
    }
  };

  const updateAcao = async (id: string, updateData: Partial<PlanoAcao>) => {
    setAcoes((prev) => prev.map((a) => (a.id === id ? { ...a, ...updateData } : a)));
    try {
      await fetch(`/api/acoes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      notifySync();
    } catch (err) {
      console.error('Erro ao atualizar plano:', err);
    }
  };

  const deleteAcao = async (id: string) => {
    setAcoes((prev) => prev.filter((a) => a.id !== id));
    try {
      await fetch(`/api/acoes/${id}`, { method: 'DELETE' });
      notifySync();
    } catch (err) {
      console.error('Erro ao deletar plano:', err);
    }
  };

  const updateKPI = async (mes: string, updateData: Partial<KPIStats>) => {
    setKpis((prev) => prev.map((k) => (k.mes === mes ? { ...k, ...updateData } : k)));
    try {
      await fetch(`/api/kpis/${mes}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      notifySync();
    } catch (err) {
      console.error('Erro ao atualizar KPI:', err);
    }
  };

  const addComentario = async (comData: Omit<ComentarioRevisao, 'id' | 'data'>) => {
    const newComentario: ComentarioRevisao = {
      ...comData,
      id: `COM-${Date.now()}`,
      data: new Date().toISOString().slice(0, 16).replace('T', ' '),
    };
    setComentarios((prev) => [newComentario, ...prev]);
    try {
      await fetch('/api/comentarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newComentario),
      });
      notifySync();
    } catch (err) {
      console.error('Erro ao salvar comentário:', err);
    }
  };

  const deleteComentario = async (id: string) => {
    setComentarios((prev) => prev.filter((c) => c.id !== id));
    try {
      await fetch(`/api/comentarios/${id}`, { method: 'DELETE' });
      notifySync();
    } catch (err) {
      console.error('Erro ao excluir comentário:', err);
    }
  };

  const addTrocaImproprio = async (trocaData: Omit<RegistroTrocaImproprio, 'id' | 'createdAt'>) => {
    const newTroca: RegistroTrocaImproprio = {
      ...trocaData,
      id: `TR-${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
    };
    setTrocasImproprio((prev) => [newTroca, ...prev]);
    try {
      await fetch('/api/trocas-improprio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTroca),
      });
      notifySync();
    } catch (err) {
      console.error('Erro ao salvar troca de impróprio:', err);
    }
  };

  const updateTrocaImproprio = async (id: string, updateData: Partial<RegistroTrocaImproprio>) => {
    setTrocasImproprio((prev) => prev.map((t) => (t.id === id ? { ...t, ...updateData } : t)));
    try {
      await fetch(`/api/trocas-improprio/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      notifySync();
    } catch (err) {
      console.error('Erro ao atualizar troca de impróprio:', err);
    }
  };

  const deleteTrocaImproprio = async (id: string) => {
    setTrocasImproprio((prev) => prev.filter((t) => t.id !== id));
    try {
      await fetch(`/api/trocas-improprio/${id}`, { method: 'DELETE' });
      notifySync();
    } catch (err) {
      console.error('Erro ao excluir troca de impróprio:', err);
    }
  };

  const resetDemoData = async () => {
    try {
      await fetch('/api/reset-demo', { method: 'POST' });
      await fetchData();
      notifySync();
    } catch (err) {
      console.error('Erro ao resetar dados:', err);
      setPerdas(DEMO_REGISTROS_PERDAS);
      setAcoes(DEMO_PLANOS_ACAO);
      setKpis(HISTORICO_KPIS);
      setComentarios(DEMO_COMENTARIOS_REVISAO);
      setTrocasImproprio(DEMO_TROCAS_IMPROPRIO);
      setTrocaPlanilhaItens(DADOS_PLANILHA_DEMO);
      setNomeArquivoTroca(null);
    }
  };

  const clearAllData = async () => {
    try {
      await fetch('/api/clear-all', { method: 'POST' });
    } catch (err) {
      console.warn('Erro ao chamar /api/clear-all:', err);
    }
    handleLocalClear();
    notifySync();
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        filtros,
        setFiltros,
        resetFiltros,
        perdas,
        acoes,
        kpis,
        comentarios,
        trocasImproprio,
        trocaPlanilhaItens,
        nomeArquivoTroca,
        filteredPerdas,
        filteredAcoes,
        filteredTrocasImproprio,
        addPerda,
        importBatchPerdas,
        importBatchTrocaPlanilha,
        updatePerda,
        deletePerda,
        addAcao,
        updateAcao,
        deleteAcao,
        updateKPI,
        addComentario,
        deleteComentario,
        addTrocaImproprio,
        updateTrocaImproprio,
        deleteTrocaImproprio,
        resetDemoData,
        clearAllData,
        isLoading,
        currentMonthKPI,
        computedMonthKPIs,
        availableMonths,
        availableAreas,
        availableProdutos,
        availableMotivos,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp deve ser usado dentro de um AppProvider');
  }
  return context;
};
