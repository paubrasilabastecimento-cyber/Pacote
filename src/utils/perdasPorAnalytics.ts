import { PerdaItemJSON, MesPerdaSummary, ProdutoPerdaSummary, EmbalagemPerdaSummary, PerdasPorStats } from '../types/perdasPor';
import * as XLSX from 'xlsx';

export const EMBALAGEM_COLORS: Record<string, string> = {
  'LATA': '#38bdf8', // Sky 400
  'LONG NECK': '#fbbf24', // Amber 400
  'PET': '#34d399', // Emerald 400
  'RGB': '#f87171', // Rose 400
  'PACOTE': '#a78bfa', // Purple 400
  'CHOPP': '#f59e0b', // Amber 500
  'DIVERSOS': '#94a3b8', // Slate 400
  'OUTROS': '#94a3b8', // Slate 400
};

export function getEmbalagemColor(emb: string): string {
  const normalized = (emb || '').toUpperCase().trim();
  if (EMBALAGEM_COLORS[normalized]) return EMBALAGEM_COLORS[normalized];
  if (normalized.includes('LATA') || normalized.includes('LT')) return '#38bdf8';
  if (normalized.includes('LONG NECK') || normalized.includes('LN')) return '#fbbf24';
  if (normalized.includes('RGB') || normalized.includes('600ML') || normalized.includes('1L')) return '#f87171';
  if (normalized.includes('PET')) return '#34d399';
  if (normalized.includes('PACOTE') || normalized.includes('PCT') || normalized.includes('SH')) return '#a78bfa';
  if (normalized.includes('CHOPP') || normalized.includes('BARRIL')) return '#f59e0b';
  return '#94a3b8';
}

/**
 * Normalizes text: trims and collapses internal duplicate spaces.
 */
export function cleanText(str: any): string {
  if (str === null || str === undefined) return '';
  return String(str).trim().replace(/\s+/g, ' ');
}

/**
 * Normalizes date to YYYY-MM-DD.
 */
export function normalizeDate(dateVal: any): string {
  if (!dateVal) return new Date().toISOString().split('T')[0];
  
  if (typeof dateVal === 'number') {
    // Excel serial date format
    const jsDate = new Date(Math.round((dateVal - 25569) * 86400 * 1000));
    return jsDate.toISOString().split('T')[0];
  }

  const str = String(dateVal).trim();
  // If DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    const [d, m, y] = str.split('/');
    return `${y}-${m}-${d}`;
  }

  // If YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.substring(0, 10);
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return '2026-01-08';
}

/**
 * Normalizes raw items according to user specification:
 * dataOperacao, emissao, produto, unidade, descricao, qtde, valor, embalagem
 */
export function normalizePerdasItems(rawList: any[]): PerdaItemJSON[] {
  if (!Array.isArray(rawList)) return [];

  return rawList.map((item) => {
    const dataOp = normalizeDate(item.dataOperacao || item.dtOperacao || item.Data || item.DATA);
    const emiss = normalizeDate(item.emissao || item.Emissao || item.EMISSAO || dataOp);
    const prod = Number(item.produto || item.produtoId || item.Produto || item.SKU || 0);
    const unid = cleanText(item.unidade || item.Unidade || item.UN || 'cx').toLowerCase();
    const desc = cleanText(item.descricao || item.Descricao || item.DESCRICAO || item.produtoNome || 'PRODUTO');
    const qt = Number(item.qtde || item.Qtde || item.quantidade || item.QUANTIDADE || 1);
    const val = Number(item.valor || item.total || item.Valor || item.VALOR || 0);
    const emb = cleanText(item.embalagem || item.Embalagem || item.EMBALAGEM || 'DIVERSOS').toUpperCase();

    return {
      dataOperacao: dataOp,
      emissao: emiss,
      produto: prod,
      unidade: unid,
      descricao: desc,
      qtde: qt,
      valor: Number(val.toFixed(2)),
      embalagem: emb || 'DIVERSOS',
    };
  });
}

/**
 * Reads a JSON text and normalizes items
 */
export function parseJsonText(text: string): PerdaItemJSON[] {
  const parsed = JSON.parse(text);
  const list = Array.isArray(parsed) ? parsed : (parsed.items || parsed.data || parsed.perdas || [parsed]);
  return normalizePerdasItems(list);
}

/**
 * Reads a JSON file and returns normalized PerdaItemJSON array
 */
export async function parseJsonFile(file: File): Promise<PerdaItemJSON[]> {
  const text = await file.text();
  return parseJsonText(text);
}

/**
 * Reads an Excel (.xlsx / .xls) or CSV file and outputs normalized PerdaItemJSON array
 */
export async function parseExcelOrCsvFile(file: File): Promise<PerdaItemJSON[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonRaw = XLSX.utils.sheet_to_json(worksheet);
        const normalized = normalizePerdasItems(jsonRaw);
        resolve(normalized);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
}

const MES_NOMES: Record<string, { nome: string; curto: string }> = {
  '01': { nome: 'Janeiro/2026', curto: 'Jan' },
  '02': { nome: 'Fevereiro/2026', curto: 'Fev' },
  '03': { nome: 'Março/2026', curto: 'Mar' },
  '04': { nome: 'Abril/2026', curto: 'Abr' },
  '05': { nome: 'Maio/2026', curto: 'Mai' },
  '06': { nome: 'Junho/2026', curto: 'Jun' },
  '07': { nome: 'Julho/2026', curto: 'Jul' },
  '08': { nome: 'Agosto/2026', curto: 'Ago' },
  '09': { nome: 'Setembro/2026', curto: 'Set' },
  '10': { nome: 'Outubro/2026', curto: 'Out' },
  '11': { nome: 'Novembro/2026', curto: 'Nov' },
  '12': { nome: 'Dezembro/2026', curto: 'Dez' },
};

/**
 * Comprehensive analytical calculations
 */
export function calculatePerdasPorAnalytics(items: PerdaItemJSON[]) {
  const valorTotal = items.reduce((acc, item) => acc + (item.valor || 0), 0);
  const qtdeTotal = items.reduce((acc, item) => acc + (item.qtde || 0), 0);
  const totalRegistros = items.length;

  // 1. Mensal breakdown
  const mesMap: Record<string, { valor: number; qtde: number; count: number }> = {};
  items.forEach((item) => {
    const mesKey = item.dataOperacao.substring(0, 7) || '2026-01';
    if (!mesMap[mesKey]) {
      mesMap[mesKey] = { valor: 0, qtde: 0, count: 0 };
    }
    mesMap[mesKey].valor += item.valor || 0;
    mesMap[mesKey].qtde += item.qtde || 0;
    mesMap[mesKey].count += 1;
  });

  const mesKeysSorted = Object.keys(mesMap).sort();
  let maxMesKey = '';
  let maxMesValor = -1;

  mesKeysSorted.forEach((k) => {
    if (mesMap[k].valor > maxMesValor) {
      maxMesValor = mesMap[k].valor;
      maxMesKey = k;
    }
  });

  const mesesSummary: MesPerdaSummary[] = mesKeysSorted.map((key) => {
    const monthNum = key.split('-')[1] || '01';
    const meta = MES_NOMES[monthNum] || { nome: key, curto: key };
    return {
      mesKey: key,
      mesNome: meta.nome,
      mesNomeCurto: meta.curto,
      valorTotal: Number(mesMap[key].valor.toFixed(2)),
      qtdeTotal: mesMap[key].qtde,
      registros: mesMap[key].count,
      isCritico: key === maxMesKey,
    };
  });

  // 2. Top Produtos por Valor
  const prodMap: Record<
    number,
    { descricao: string; embalagem: string; valor: number; qtde: number; count: number }
  > = {};

  items.forEach((item) => {
    const pid = item.produto || 0;
    if (!prodMap[pid]) {
      prodMap[pid] = {
        descricao: item.descricao,
        embalagem: item.embalagem,
        valor: 0,
        qtde: 0,
        count: 0,
      };
    }
    prodMap[pid].valor += item.valor || 0;
    prodMap[pid].qtde += item.qtde || 0;
    prodMap[pid].count += 1;
  });

  const produtosSummary: ProdutoPerdaSummary[] = Object.entries(prodMap).map(([pidStr, d]) => {
    const pid = Number(pidStr);
    const pct = valorTotal > 0 ? (d.valor / valorTotal) * 100 : 0;
    const ticket = d.qtde > 0 ? d.valor / d.qtde : 0;
    return {
      produtoId: pid,
      descricao: d.descricao,
      embalagem: d.embalagem,
      valorTotal: Number(d.valor.toFixed(2)),
      qtdeTotal: d.qtde,
      registros: d.count,
      percentualTotal: Number(pct.toFixed(2)),
      ticketMedioPorUnidade: Number(ticket.toFixed(2)),
    };
  }).sort((a, b) => b.valorTotal - a.valorTotal);

  // 3. Embalagem breakdown
  const embMap: Record<string, { valor: number; qtde: number; count: number }> = {};
  items.forEach((item) => {
    const emb = (item.embalagem || 'OUTROS').toUpperCase().trim();
    if (!embMap[emb]) {
      embMap[emb] = { valor: 0, qtde: 0, count: 0 };
    }
    embMap[emb].valor += item.valor || 0;
    embMap[emb].qtde += item.qtde || 0;
    embMap[emb].count += 1;
  });

  const embalagensSummary: EmbalagemPerdaSummary[] = Object.entries(embMap).map(([emb, d]) => {
    const pctVal = valorTotal > 0 ? (d.valor / valorTotal) * 100 : 0;
    const pctQt = qtdeTotal > 0 ? (d.qtde / qtdeTotal) * 100 : 0;
    return {
      embalagem: emb,
      valorTotal: Number(d.valor.toFixed(2)),
      qtdeTotal: d.qtde,
      registros: d.count,
      percentualValor: Number(pctVal.toFixed(2)),
      percentualQtde: Number(pctQt.toFixed(2)),
      corHex: getEmbalagemColor(emb),
    };
  }).sort((a, b) => b.valorTotal - a.valorTotal);

  // Critical month details
  const criticoMonthObj = mesesSummary.find((m) => m.mesKey === maxMesKey);
  const mesCritico = {
    mesKey: maxMesKey,
    mesNome: criticoMonthObj?.mesNome || maxMesKey,
    valor: criticoMonthObj?.valorTotal || 0,
    qtde: criticoMonthObj?.qtdeTotal || 0,
    percentualDoTotal: valorTotal > 0 ? ((criticoMonthObj?.valorTotal || 0) / valorTotal) * 100 : 0,
  };

  const stats: PerdasPorStats = {
    valorTotal: Number(valorTotal.toFixed(2)),
    qtdeTotal,
    totalRegistros,
    mesCritico,
    embalagemTop: {
      nome: embalagensSummary[0]?.embalagem || 'LATA',
      valor: embalagensSummary[0]?.valorTotal || 0,
      percentual: embalagensSummary[0]?.percentualValor || 0,
    },
    produtoTop: {
      descricao: produtosSummary[0]?.descricao || '',
      valor: produtosSummary[0]?.valorTotal || 0,
      percentual: produtosSummary[0]?.percentualTotal || 0,
    },
    ticketMedioItem: qtdeTotal > 0 ? valorTotal / qtdeTotal : 0,
  };

  return {
    stats,
    mesesSummary,
    produtosSummary,
    embalagensSummary,
    topProdutos: produtosSummary.slice(0, 10),
  };
}

/**
 * Downloads JSON as a formatted file in user browser
 */
export function downloadJsonFile(data: any, fileName = 'perdas_normalizadas.json') {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
