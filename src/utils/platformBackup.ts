import { RegistroPerda, PlanoAcao, KPIStats, ComentarioRevisao, RegistroTrocaImproprio } from '../types';
import { ItemPlanilha } from '../utils/spreadsheetAnalyzer';
import { getStoredRefugoData, saveRefugoData, REFUGO_STORAGE_KEY } from './refugoUtils';
import { savePlatformDataToFirestore, loadPlatformDataFromFirestore } from './firestoreService';

export interface PlatformFullBackup {
  appName: string;
  version: string;
  exportedAt: string;
  summary: {
    totalQuebras: number;
    totalReposicao: number;
    totalPerdasPor: number;
    totalConsumoInterno: number;
    totalQuebrasMov: number;
    totalTrocasImproprio: number;
    totalTrocaPlanilha: number;
    totalPlanosAcao: number;
    totalVales: number;
    totalKPIs: number;
    totalComentarios: number;
    totalRefugo: number;
    totalRegistrosGerais: number;
  };
  data: {
    perdas: RegistroPerda[];
    reposicaoItens: any[];
    perdasPorItens: any[];
    consumoInternoItens: any[];
    quebrasMovItens: any[];
    trocasImproprio: RegistroTrocaImproprio[];
    trocaPlanilhaItens: ItemPlanilha[];
    nomeArquivoTroca: string | null;
    acoes: PlanoAcao[];
    kpis: KPIStats[];
    comentarios: ComentarioRevisao[];
    valesItens: any[];
    refugoItens: any[];
  };
}

/**
 * Coleta todos os dados de todas as abas e fontes da plataforma
 */
export async function collectCurrentPlatformData(liveOverrides?: Partial<PlatformFullBackup['data']>): Promise<PlatformFullBackup> {
  // 1. Obter dados base do servidor se disponíveis
  let serverData: Partial<PlatformFullBackup['data']> = {};
  try {
    const res = await fetch('/api/backup');
    if (res.ok) {
      const json = await res.json();
      if (json && json.data) {
        serverData = json.data;
      }
    }
  } catch (err) {
    console.warn('[BACKUP] Aviso: servidor offline ou fallback acionado:', err);
  }

  // 2. Coletar e mesclar com dados do LocalStorage e estado ao vivo
  let perdas: RegistroPerda[] = liveOverrides?.perdas || serverData.perdas || [];
  let reposicaoItens: any[] = liveOverrides?.reposicaoItens || serverData.reposicaoItens || [];
  let perdasPorItens: any[] = liveOverrides?.perdasPorItens || serverData.perdasPorItens || [];
  let consumoInternoItens: any[] = liveOverrides?.consumoInternoItens || serverData.consumoInternoItens || [];
  let quebrasMovItens: any[] = liveOverrides?.quebrasMovItens || (serverData as any)?.quebrasMovItens || [];
  let trocasImproprio: RegistroTrocaImproprio[] = liveOverrides?.trocasImproprio || serverData.trocasImproprio || [];
  let trocaPlanilhaItens: ItemPlanilha[] = liveOverrides?.trocaPlanilhaItens || serverData.trocaPlanilhaItens || [];
  let nomeArquivoTroca: string | null = liveOverrides?.nomeArquivoTroca ?? serverData.nomeArquivoTroca ?? null;
  let acoes: PlanoAcao[] = liveOverrides?.acoes || serverData.acoes || [];
  let kpis: KPIStats[] = liveOverrides?.kpis || serverData.kpis || [];
  let comentarios: ComentarioRevisao[] = liveOverrides?.comentarios || serverData.comentarios || [];
  let valesItens: any[] = liveOverrides?.valesItens || serverData.valesItens || [];
  let refugoItens: any[] = liveOverrides?.refugoItens || (serverData as any)?.refugoItens || [];

  try {
    const p = localStorage.getItem('AMBEV_REGISTROS_PERDAS');
    if (p && (!perdas || perdas.length === 0)) perdas = JSON.parse(p);
  } catch {}

  try {
    const qm = localStorage.getItem('AMBEV_QUEBRAS_MOVIMENTACAO');
    if (qm) {
      const parsedQM = JSON.parse(qm);
      if (Array.isArray(parsedQM) && parsedQM.length > 0) quebrasMovItens = parsedQM;
    }
  } catch {}

  try {
    const r = localStorage.getItem('AMBEV_REPOSICAO_BEBIDAS');
    if (r) {
      const parsedR = JSON.parse(r);
      if (Array.isArray(parsedR) && parsedR.length > 0) reposicaoItens = parsedR;
    }
  } catch {}

  try {
    const pp = localStorage.getItem('ambev_perdas_por_mercadoria_v1');
    if (pp) {
      const parsedPP = JSON.parse(pp);
      if (Array.isArray(parsedPP) && parsedPP.length > 0) perdasPorItens = parsedPP;
    }
  } catch {}

  try {
    const ci1 = localStorage.getItem('ARMAZEM_FACIL_CONSUMO_INTERNO_CACHE_ambev-filial-01');
    const ci2 = localStorage.getItem('ARMAZEM_FACIL_CONSUMO_INTERNO_CACHE');
    const ci = ci1 || ci2;
    if (ci) {
      const parsedCI = JSON.parse(ci);
      if (Array.isArray(parsedCI) && parsedCI.length > 0) consumoInternoItens = parsedCI;
    }
  } catch {}

  try {
    const tp = localStorage.getItem('AMBEV_TROCA_PLANILHA_ITENS');
    if (tp) {
      const parsedTP = JSON.parse(tp);
      if (Array.isArray(parsedTP) && parsedTP.length > 0) trocaPlanilhaItens = parsedTP;
    }
    const fn = localStorage.getItem('AMBEV_TROCA_PLANILHA_NOME_ARQUIVO');
    if (fn) nomeArquivoTroca = fn;
  } catch {}

  try {
    const a = localStorage.getItem('AMBEV_PLANOS_ACAO');
    if (a && (!acoes || acoes.length === 0)) acoes = JSON.parse(a);
  } catch {}

  try {
    const k = localStorage.getItem('AMBEV_KPIS');
    if (k && (!kpis || kpis.length === 0)) kpis = JSON.parse(k);
  } catch {}

  try {
    const c = localStorage.getItem('AMBEV_COMENTARIOS');
    if (c && (!comentarios || comentarios.length === 0)) comentarios = JSON.parse(c);
  } catch {}

  try {
    const v = localStorage.getItem('AMBEV_VALES_PREJUIZO');
    if (v) {
      const parsedV = JSON.parse(v);
      if (Array.isArray(parsedV) && parsedV.length > 0) valesItens = parsedV;
    }
  } catch {}

  try {
    if (!refugoItens || refugoItens.length === 0) {
      refugoItens = getStoredRefugoData();
    }
  } catch {}

  const totalQuebras = (perdas || []).length;
  const totalReposicao = (reposicaoItens || []).length;
  const totalPerdasPor = (perdasPorItens || []).length;
  const totalConsumoInterno = (consumoInternoItens || []).length;
  const totalQuebrasMov = (quebrasMovItens || []).length;
  const totalTrocasImproprio = (trocasImproprio || []).length;
  const totalTrocaPlanilha = (trocaPlanilhaItens || []).length;
  const totalPlanosAcao = (acoes || []).length;
  const totalVales = (valesItens || []).length;
  const totalKPIs = (kpis || []).length;
  const totalComentarios = (comentarios || []).length;
  const totalRefugo = (refugoItens || []).length;
  const totalRegistrosGerais =
    totalQuebras +
    totalReposicao +
    totalPerdasPor +
    totalConsumoInterno +
    totalQuebrasMov +
    totalTrocasImproprio +
    totalTrocaPlanilha +
    totalPlanosAcao +
    totalVales +
    totalKPIs +
    totalComentarios +
    totalRefugo;

  return {
    appName: 'Armazém Fácil - Pacote Prejuízo AMBEV',
    version: '2026.1',
    exportedAt: new Date().toISOString(),
    summary: {
      totalQuebras,
      totalReposicao,
      totalPerdasPor,
      totalConsumoInterno,
      totalQuebrasMov,
      totalTrocasImproprio,
      totalTrocaPlanilha,
      totalPlanosAcao,
      totalVales,
      totalKPIs,
      totalComentarios,
      totalRefugo,
      totalRegistrosGerais,
    },
    data: {
      perdas: perdas || [],
      reposicaoItens: reposicaoItens || [],
      perdasPorItens: perdasPorItens || [],
      consumoInternoItens: consumoInternoItens || [],
      quebrasMovItens: quebrasMovItens || [],
      trocasImproprio: trocasImproprio || [],
      trocaPlanilhaItens: trocaPlanilhaItens || [],
      nomeArquivoTroca: nomeArquivoTroca || null,
      acoes: acoes || [],
      kpis: kpis || [],
      comentarios: comentarios || [],
      valesItens: valesItens || [],
      refugoItens: refugoItens || [],
    },
  };
}

/**
 * Salva todos os dados da plataforma e faz o download automático de um arquivo JSON estruturado
 */
export async function downloadPlatformBackup(overrideData?: Partial<PlatformFullBackup['data']>): Promise<{
  success: boolean;
  filename: string;
  totalRecords: number;
  data: PlatformFullBackup;
}> {
  let fullBackup = await collectCurrentPlatformData();

  if (overrideData) {
    fullBackup.data = {
      ...fullBackup.data,
      ...overrideData,
    };
    // Recalcula totais
    const d = fullBackup.data;
    fullBackup.summary = {
      totalQuebras: d.perdas?.length || 0,
      totalReposicao: d.reposicaoItens?.length || 0,
      totalPerdasPor: d.perdasPorItens?.length || 0,
      totalConsumoInterno: d.consumoInternoItens?.length || 0,
      totalQuebrasMov: d.quebrasMovItens?.length || 0,
      totalTrocasImproprio: d.trocasImproprio?.length || 0,
      totalTrocaPlanilha: d.trocaPlanilhaItens?.length || 0,
      totalPlanosAcao: d.acoes?.length || 0,
      totalVales: d.valesItens?.length || 0,
      totalKPIs: d.kpis?.length || 0,
      totalComentarios: d.comentarios?.length || 0,
      totalRefugo: d.refugoItens?.length || 0,
      totalRegistrosGerais:
        (d.perdas?.length || 0) +
        (d.reposicaoItens?.length || 0) +
        (d.perdasPorItens?.length || 0) +
        (d.consumoInternoItens?.length || 0) +
        (d.quebrasMovItens?.length || 0) +
        (d.trocasImproprio?.length || 0) +
        (d.trocaPlanilhaItens?.length || 0) +
        (d.acoes?.length || 0) +
        (d.valesItens?.length || 0) +
        (d.kpis?.length || 0) +
        (d.comentarios?.length || 0) +
        (d.refugoItens?.length || 0),
    };
  }

  // Sincroniza em nuvem no Firestore
  try {
    await savePlatformDataToFirestore(fullBackup.data);
  } catch (e) {
    console.warn('[BACKUP] Aviso: sincronização de backup com o Firestore falhou:', e);
  }

  // Também sincroniza com servidor para garantir persistência no disco
  try {
    await fetch('/api/backup/save-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: fullBackup.data }),
    });
  } catch (e) {
    console.warn('[BACKUP] Aviso: sincronização de backup com o servidor falhou:', e);
  }

  // Salvar no localStorage de segurança
  try {
    if (fullBackup.data.reposicaoItens?.length) {
      localStorage.setItem('AMBEV_REPOSICAO_BEBIDAS', JSON.stringify(fullBackup.data.reposicaoItens));
    }
    if (fullBackup.data.perdasPorItens?.length) {
      localStorage.setItem('ambev_perdas_por_mercadoria_v1', JSON.stringify(fullBackup.data.perdasPorItens));
    }
    if (fullBackup.data.consumoInternoItens?.length) {
      localStorage.setItem('ARMAZEM_FACIL_CONSUMO_INTERNO_CACHE', JSON.stringify(fullBackup.data.consumoInternoItens));
    }
    if (fullBackup.data.trocaPlanilhaItens?.length) {
      localStorage.setItem('AMBEV_TROCA_PLANILHA_ITENS', JSON.stringify(fullBackup.data.trocaPlanilhaItens));
    }
    if (fullBackup.data.nomeArquivoTroca) {
      localStorage.setItem('AMBEV_TROCA_PLANILHA_NOME_ARQUIVO', fullBackup.data.nomeArquivoTroca);
    }
    if (fullBackup.data.refugoItens?.length) {
      saveRefugoData(fullBackup.data.refugoItens);
    }
  } catch {}

  // Criar e disparar download do arquivo .json
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
  const filename = `backup_completo_armazem_facil_${dateStr}_${timeStr}.json`;

  const jsonStr = JSON.stringify(fullBackup, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return {
    success: true,
    filename,
    totalRecords: fullBackup.summary.totalRegistrosGerais,
    data: fullBackup,
  };
}

/**
 * Salva e persiste todos os dados no Firebase Firestore, no Servidor e no LocalStorage
 */
export async function saveAllPlatformDataToServer(customData?: Partial<PlatformFullBackup['data']>): Promise<{
  success: boolean;
  message: string;
  stats: any;
}> {
  let fullBackup = await collectCurrentPlatformData();

  if (customData) {
    fullBackup.data = {
      ...fullBackup.data,
      ...customData,
    };
  }

  // 1. Persistir no Banco de Dados em Nuvem (Firebase Firestore)
  let firestoreSaved = false;
  try {
    firestoreSaved = await savePlatformDataToFirestore(fullBackup.data);
  } catch (err) {
    console.warn('[Firestore] Aviso ao sincronizar com banco em nuvem:', err);
  }

  // 2. Persistir no Servidor
  let jsonResult: any = { success: true };
  try {
    const res = await fetch('/api/backup/save-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: fullBackup.data }),
    });
    if (res.ok) {
      jsonResult = await res.json();
    }
  } catch (e) {
    console.warn('[Server] Falha ao enviar para /api/backup/save-all:', e);
  }

  // 3. Persistir no localStorage
  try {
    if (fullBackup.data.reposicaoItens?.length) {
      localStorage.setItem('AMBEV_REPOSICAO_BEBIDAS', JSON.stringify(fullBackup.data.reposicaoItens));
    }
    if (fullBackup.data.perdasPorItens?.length) {
      localStorage.setItem('ambev_perdas_por_mercadoria_v1', JSON.stringify(fullBackup.data.perdasPorItens));
    }
    if (fullBackup.data.quebrasMovItens?.length) {
      localStorage.setItem('AMBEV_QUEBRAS_MOVIMENTACAO', JSON.stringify(fullBackup.data.quebrasMovItens));
    }
    if (fullBackup.data.consumoInternoItens?.length) {
      localStorage.setItem('ARMAZEM_FACIL_CONSUMO_INTERNO_CACHE', JSON.stringify(fullBackup.data.consumoInternoItens));
    }
    if (fullBackup.data.trocaPlanilhaItens?.length) {
      localStorage.setItem('AMBEV_TROCA_PLANILHA_ITENS', JSON.stringify(fullBackup.data.trocaPlanilhaItens));
    }
    if (fullBackup.data.nomeArquivoTroca) {
      localStorage.setItem('AMBEV_TROCA_PLANILHA_NOME_ARQUIVO', fullBackup.data.nomeArquivoTroca);
    }
    if (fullBackup.data.refugoItens?.length) {
      saveRefugoData(fullBackup.data.refugoItens);
    }
  } catch {}

  // Notificar outros navegadores/abas
  try {
    const bc = new BroadcastChannel('AMBEV_PACOTE_PREJUIZO_CHANNEL');
    bc.postMessage({ type: 'SYNC', timestamp: Date.now() });
    bc.close();
  } catch {}

  return {
    success: true,
    message: firestoreSaved
      ? 'Dados sincronizados com o Banco de Dados Firestore e Servidor!'
      : 'Dados salvos com sucesso no servidor e armazenamento local!',
    stats: jsonResult.stats || fullBackup.summary,
  };
}

/**
 * Restaura um backup completo a partir de um arquivo ou texto JSON
 */
export async function restorePlatformBackup(content: string | object): Promise<{
  success: boolean;
  message: string;
  stats?: any;
}> {
  const parsed = typeof content === 'string' ? JSON.parse(content) : content;
  const data = parsed.data || parsed;

  // Persistir no Firestore
  try {
    await savePlatformDataToFirestore(data);
  } catch (err) {
    console.warn('[Firestore] Aviso ao restaurar no Firestore:', err);
  }

  const res = await fetch('/api/backup/restore', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data }),
  });

  if (!res.ok) {
    throw new Error('Falha ao restaurar backup no servidor');
  }

  const json = await res.json();

  // Atualizar localStorage
  try {
    if (Array.isArray(data.reposicaoItens)) {
      localStorage.setItem('AMBEV_REPOSICAO_BEBIDAS', JSON.stringify(data.reposicaoItens));
    }
    if (Array.isArray(data.perdasPorItens)) {
      localStorage.setItem('ambev_perdas_por_mercadoria_v1', JSON.stringify(data.perdasPorItens));
    }
    if (Array.isArray(data.quebrasMovItens)) {
      localStorage.setItem('AMBEV_QUEBRAS_MOVIMENTACAO', JSON.stringify(data.quebrasMovItens));
    }
    if (Array.isArray(data.consumoInternoItens)) {
      localStorage.setItem('ARMAZEM_FACIL_CONSUMO_INTERNO_CACHE', JSON.stringify(data.consumoInternoItens));
    }
    if (Array.isArray(data.trocaPlanilhaItens)) {
      localStorage.setItem('AMBEV_TROCA_PLANILHA_ITENS', JSON.stringify(data.trocaPlanilhaItens));
    }
    if (data.nomeArquivoTroca) {
      localStorage.setItem('AMBEV_TROCA_PLANILHA_NOME_ARQUIVO', data.nomeArquivoTroca);
    }
    if (Array.isArray(data.refugoItens)) {
      saveRefugoData(data.refugoItens);
    }
  } catch {}

  // Notificar abas
  try {
    const bc = new BroadcastChannel('AMBEV_PACOTE_PREJUIZO_CHANNEL');
    bc.postMessage({ type: 'SYNC', timestamp: Date.now() });
    bc.close();
  } catch {}

  return json;
}

/**
 * Limpa todos os dados da plataforma (Zera todas as tabelas e módulos)
 */
export async function clearAllPlatformData(): Promise<{ success: boolean; message: string }> {
  // 1. Limpar no Firestore
  try {
    await savePlatformDataToFirestore({
      perdas: [],
      reposicaoItens: [],
      perdasPorItens: [],
      consumoInternoItens: [],
      quebrasMovItens: [],
      trocasImproprio: [],
      trocaPlanilhaItens: [],
      nomeArquivoTroca: null,
      acoes: [],
      kpis: [],
      comentarios: [],
      valesItens: [],
      refugoItens: [],
    });
  } catch (e) {
    console.warn('[Firestore] Aviso ao limpar banco em nuvem:', e);
  }

  // 2. Limpar no Servidor
  try {
    const res = await fetch('/api/clear-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      console.warn('Aviso: Servidor retornou erro ao limpar dados:', res.statusText);
    }
  } catch (err) {
    console.warn('Aviso: Não foi possível conectar ao servidor para limpar:', err);
  }

  // 3. Limpar todas as chaves do LocalStorage
  const keysToRemove = [
    'AMBEV_REGISTROS_PERDAS',
    'AMBEV_QUEBRAS_MOVIMENTACAO',
    'AMBEV_REPOSICAO_BEBIDAS',
    'ambev_perdas_por_mercadoria_v1',
    'ambev_perdas_por_mercadoria_registros',
    'ambev_perdas_por_mercadoria',
    'ambev_inventario_faltas_sobras',
    'AMBEV_VALES_PREJUIZO',
    'ambev_gestao_vales_prejuizo_v1',
    'ARMAZEM_FACIL_CONSUMO_INTERNO_CACHE_ambev-filial-01',
    'ARMAZEM_FACIL_CONSUMO_INTERNO_CACHE',
    'AMBEV_TROCA_PLANILHA_ITENS',
    'AMBEV_TROCA_PLANILHA_NOME_ARQUIVO',
    'AMBEV_PLANOS_ACAO',
    'AMBEV_KPIS',
    'AMBEV_COMENTARIOS',
    'AMBEV_TROCAS_IMPROPRIO',
    'ambev_quebras_movimentacao_cache',
    'AMBEV_CUSTOM_PRODUCTS',
    'AMBEV_HISTORICO_FILTROS',
    REFUGO_STORAGE_KEY,
  ];

  try {
    // Remover chaves específicas
    keysToRemove.forEach((key) => {
      localStorage.removeItem(key);
    });

    // Remover qualquer outra chave dinâmica com prefixo AMBEV ou ambev
    const allKeys = Object.keys(localStorage);
    allKeys.forEach((k) => {
      if (k.startsWith('AMBEV_') || k.startsWith('ambev_') || k.startsWith('ARMAZEM_FACIL_')) {
        localStorage.removeItem(k);
      }
    });

    // Salvar estado vazio específico para inventário
    localStorage.setItem(
      'ambev_inventario_faltas_sobras',
      JSON.stringify({
        data_inventario: new Date().toLocaleDateString('pt-BR'),
        total_itens: 0,
        total_estoque: 0,
        total_diferenca: 0,
        valor_falta: 0,
        valor_sobra: 0,
        saldo_liquido: 0,
        acuracidade: 100,
        grupos: [],
        skus: [],
      })
    );
  } catch (err) {
    console.error('Erro ao limpar localStorage:', err);
  }

  // 4. Notificar abas e componentes da plataforma
  try {
    window.dispatchEvent(new CustomEvent('ambev_platform_data_cleared', { detail: { timestamp: Date.now() } }));
    window.dispatchEvent(new Event('storage'));
    const bc = new BroadcastChannel('AMBEV_PACOTE_PREJUIZO_CHANNEL');
    bc.postMessage({ type: 'CLEAR_ALL', timestamp: Date.now() });
    bc.close();
  } catch {}

  return {
    success: true,
    message: 'Todos os dados da plataforma foram limpos com sucesso!',
  };
}

/**
 * Restaura os dados padrão de demonstração do sistema
 */
export async function resetPlatformToDemo(): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/reset-demo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      console.warn('Aviso: Erro ao chamar reset-demo no backend');
    }
  } catch (err) {
    console.warn('Aviso ao resetar no servidor:', err);
  }

  // Limpar chaves locais para permitir que os componentes re-inicializem com os dados padrão
  const allKeys = Object.keys(localStorage);
  allKeys.forEach((k) => {
    if (k.startsWith('AMBEV_') || k.startsWith('ambev_') || k.startsWith('ARMAZEM_FACIL_')) {
      localStorage.removeItem(k);
    }
  });

  try {
    window.dispatchEvent(new CustomEvent('ambev_platform_data_reset', { detail: { timestamp: Date.now() } }));
    window.dispatchEvent(new Event('storage'));
    const bc = new BroadcastChannel('AMBEV_PACOTE_PREJUIZO_CHANNEL');
    bc.postMessage({ type: 'RESET_DEMO', timestamp: Date.now() });
    bc.close();
  } catch {}

  return {
    success: true,
    message: 'Dados padrão de demonstração restaurados com sucesso!',
  };
}
