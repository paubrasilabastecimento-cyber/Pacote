import { RegistroPerda, PlanoAcao, KPIStats, ComentarioRevisao, RegistroTrocaImproprio } from '../types';
import { ItemPlanilha } from '../utils/spreadsheetAnalyzer';

export interface PlatformFullBackup {
  appName: string;
  version: string;
  exportedAt: string;
  summary: {
    totalQuebras: number;
    totalReposicao: number;
    totalPerdasPor: number;
    totalConsumoInterno: number;
    totalTrocasImproprio: number;
    totalTrocaPlanilha: number;
    totalPlanosAcao: number;
    totalVales: number;
    totalKPIs: number;
    totalComentarios: number;
    totalRegistrosGerais: number;
  };
  data: {
    perdas: RegistroPerda[];
    reposicaoItens: any[];
    perdasPorItens: any[];
    consumoInternoItens: any[];
    trocasImproprio: RegistroTrocaImproprio[];
    trocaPlanilhaItens: ItemPlanilha[];
    nomeArquivoTroca: string | null;
    acoes: PlanoAcao[];
    kpis: KPIStats[];
    comentarios: ComentarioRevisao[];
    valesItens: any[];
  };
}

/**
 * Coleta todos os dados de todas as abas e fontes da plataforma
 */
export async function collectCurrentPlatformData(): Promise<PlatformFullBackup> {
  // 1. Tentar ler do servidor primeiro (mais atualizado)
  try {
    const res = await fetch('/api/backup');
    if (res.ok) {
      const serverData = await res.json();
      if (serverData && serverData.data) {
        return serverData;
      }
    }
  } catch (err) {
    console.warn('[BACKUP] Servidor offline ou indisponível para backup direto, lendo caches locais:', err);
  }

  // 2. Fallback: Ler do localStorage e caches da plataforma
  let perdas: RegistroPerda[] = [];
  let reposicaoItens: any[] = [];
  let perdasPorItens: any[] = [];
  let consumoInternoItens: any[] = [];
  let trocasImproprio: RegistroTrocaImproprio[] = [];
  let trocaPlanilhaItens: ItemPlanilha[] = [];
  let nomeArquivoTroca: string | null = null;
  let acoes: PlanoAcao[] = [];
  let kpis: KPIStats[] = [];
  let comentarios: ComentarioRevisao[] = [];
  let valesItens: any[] = [];

  try {
    const p = localStorage.getItem('AMBEV_REGISTROS_PERDAS');
    if (p) perdas = JSON.parse(p);
  } catch {}

  try {
    const r = localStorage.getItem('AMBEV_REPOSICAO_BEBIDAS');
    if (r) reposicaoItens = JSON.parse(r);
  } catch {}

  try {
    const pp = localStorage.getItem('ambev_perdas_por_mercadoria_v1');
    if (pp) perdasPorItens = JSON.parse(pp);
  } catch {}

  try {
    const ci = localStorage.getItem('ARMAZEM_FACIL_CONSUMO_INTERNO_CACHE');
    if (ci) consumoInternoItens = JSON.parse(ci);
  } catch {}

  try {
    const tp = localStorage.getItem('AMBEV_TROCA_PLANILHA_ITENS');
    if (tp) trocaPlanilhaItens = JSON.parse(tp);
    nomeArquivoTroca = localStorage.getItem('AMBEV_TROCA_PLANILHA_NOME_ARQUIVO') || null;
  } catch {}

  try {
    const a = localStorage.getItem('AMBEV_PLANOS_ACAO');
    if (a) acoes = JSON.parse(a);
  } catch {}

  try {
    const k = localStorage.getItem('AMBEV_KPIS');
    if (k) kpis = JSON.parse(k);
  } catch {}

  try {
    const c = localStorage.getItem('AMBEV_COMENTARIOS');
    if (c) comentarios = JSON.parse(c);
  } catch {}

  try {
    const v = localStorage.getItem('AMBEV_VALES_PREJUIZO');
    if (v) valesItens = JSON.parse(v);
  } catch {}

  const totalQuebras = perdas.length;
  const totalReposicao = reposicaoItens.length;
  const totalPerdasPor = perdasPorItens.length;
  const totalConsumoInterno = consumoInternoItens.length;
  const totalTrocasImproprio = trocasImproprio.length;
  const totalTrocaPlanilha = trocaPlanilhaItens.length;
  const totalPlanosAcao = acoes.length;
  const totalVales = valesItens.length;
  const totalKPIs = kpis.length;
  const totalComentarios = comentarios.length;
  const totalRegistrosGerais =
    totalQuebras +
    totalReposicao +
    totalPerdasPor +
    totalConsumoInterno +
    totalTrocasImproprio +
    totalTrocaPlanilha +
    totalPlanosAcao +
    totalVales +
    totalKPIs +
    totalComentarios;

  return {
    appName: 'Armazém Fácil - Pacote Prejuízo AMBEV',
    version: '2026.1',
    exportedAt: new Date().toISOString(),
    summary: {
      totalQuebras,
      totalReposicao,
      totalPerdasPor,
      totalConsumoInterno,
      totalTrocasImproprio,
      totalTrocaPlanilha,
      totalPlanosAcao,
      totalVales,
      totalKPIs,
      totalComentarios,
      totalRegistrosGerais,
    },
    data: {
      perdas,
      reposicaoItens,
      perdasPorItens,
      consumoInternoItens,
      trocasImproprio,
      trocaPlanilhaItens,
      nomeArquivoTroca,
      acoes,
      kpis,
      comentarios,
      valesItens,
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
      totalTrocasImproprio: d.trocasImproprio?.length || 0,
      totalTrocaPlanilha: d.trocaPlanilhaItens?.length || 0,
      totalPlanosAcao: d.acoes?.length || 0,
      totalVales: d.valesItens?.length || 0,
      totalKPIs: d.kpis?.length || 0,
      totalComentarios: d.comentarios?.length || 0,
      totalRegistrosGerais:
        (d.perdas?.length || 0) +
        (d.reposicaoItens?.length || 0) +
        (d.perdasPorItens?.length || 0) +
        (d.consumoInternoItens?.length || 0) +
        (d.trocasImproprio?.length || 0) +
        (d.trocaPlanilhaItens?.length || 0) +
        (d.acoes?.length || 0) +
        (d.valesItens?.length || 0) +
        (d.kpis?.length || 0) +
        (d.comentarios?.length || 0),
    };
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
 * Salva e persiste todos os dados no servidor e no LocalStorage
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

  // Persistir no servidor
  const res = await fetch('/api/backup/save-all', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: fullBackup.data }),
  });

  const json = await res.json();

  // Persistir no localStorage
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
  } catch {}

  // Notificar outros navegadores/abas
  try {
    const bc = new BroadcastChannel('AMBEV_PACOTE_PREJUIZO_CHANNEL');
    bc.postMessage({ type: 'SYNC', timestamp: Date.now() });
    bc.close();
  } catch {}

  return json;
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
    if (Array.isArray(data.consumoInternoItens)) {
      localStorage.setItem('ARMAZEM_FACIL_CONSUMO_INTERNO_CACHE', JSON.stringify(data.consumoInternoItens));
    }
    if (Array.isArray(data.trocaPlanilhaItens)) {
      localStorage.setItem('AMBEV_TROCA_PLANILHA_ITENS', JSON.stringify(data.trocaPlanilhaItens));
    }
    if (data.nomeArquivoTroca) {
      localStorage.setItem('AMBEV_TROCA_PLANILHA_NOME_ARQUIVO', data.nomeArquivoTroca);
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
