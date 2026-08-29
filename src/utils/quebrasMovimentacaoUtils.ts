import { QuebraMovimentacaoItem, QuebrasMovimentacaoMetrics } from '../types/quebrasMovimentacao';

export const formatBRL = (val: number): string => {
  return (val || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const formatNumber = (val: number): string => {
  return (val || 0).toLocaleString('pt-BR');
};

export const formatHL = (val: number, decimals: number = 3): string => {
  return `${(val || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} hl`;
};

export const formatPercent = (val: number): string => {
  return `${((val || 0) * 100).toFixed(1)}%`;
};

/**
 * Converte qualquer formato de data (número de série do Excel, ISO, BR) para o padrão "YYYY-MM-DD HH:mm:ss"
 */
export function normalizarDataHoraQuebra(val: any): string {
  if (val === null || val === undefined || val === '') {
    return new Date().toISOString().replace('T', ' ').slice(0, 19);
  }

  // Se for objeto Date nativo
  if (val instanceof Date && !Number.isNaN(val.getTime())) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    const hh = String(val.getHours()).padStart(2, '0');
    const mm = String(val.getMinutes()).padStart(2, '0');
    const ss = String(val.getSeconds()).padStart(2, '0');
    return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
  }

  // Se for número de série do Excel (ex: 46203.49947916667)
  const num = typeof val === 'number' ? val : Number(String(val).trim().replace(',', '.'));
  if (!Number.isNaN(num) && num > 20000 && num < 80000) {
    const totalMs = Math.round((num - 25569) * 86400 * 1000);
    const d = new Date(totalMs);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    const hh = String(d.getUTCHours()).padStart(2, '0');
    const mm = String(d.getUTCMinutes()).padStart(2, '0');
    const ss = String(d.getUTCSeconds()).padStart(2, '0');
    return `${y}-${m}-${day} ${hh}:${mm}:${ss}`;
  }

  const str = String(val).trim();

  // Se estiver em formato brasileiro "DD/MM/YYYY" ou "DD/MM/YYYY HH:mm:ss"
  if (/^\d{1,2}\/\d{1,2}\/\d{2,4}/.test(str)) {
    const [datePart, timePart] = str.split(' ');
    const [d, m, y] = datePart.split('/');
    const cleanY = y.length === 2 ? `20${y}` : y;
    const cleanD = d.padStart(2, '0');
    const cleanM = m.padStart(2, '0');
    const cleanTime = timePart ? (timePart.length === 5 ? `${timePart}:00` : timePart.slice(0, 8)) : '00:00:00';
    return `${cleanY}-${cleanM}-${cleanD} ${cleanTime}`;
  }

  // Se for ISO simples "YYYY-MM-DD"
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(str)) {
    const [y, m, d] = str.split('-');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')} 00:00:00`;
  }

  return str.replace('T', ' ');
}

/**
 * Formata data/hora abreviada para exibição em tabelas e cards: "DD/MM/AAAA HH:mm" (ou "DD/MM/AAAA")
 */
export function formatDataHoraAbreviada(val: any): string {
  if (!val) return '-';

  const iso = normalizarDataHoraQuebra(val);

  if (/^\d{4}-\d{2}-\d{2}/.test(iso)) {
    const [datePart, timePart] = iso.split(' ');
    const [y, m, d] = datePart.split('-');
    if (timePart && timePart !== '00:00:00') {
      const hhmm = timePart.slice(0, 5);
      return `${d}/${m}/${y} ${hhmm}`;
    }
    return `${d}/${m}/${y}`;
  }

  return String(val);
}

export function calcularMetricasQuebrasMov(items: QuebraMovimentacaoItem[]): QuebrasMovimentacaoMetrics {
  if (!items || items.length === 0) {
    return {
      totalValor: 0,
      totalQuantidade: 0,
      totalHlPerdido: 0,
      totalOcorrencias: 0,
      ticketMedioValor: 0,
      ticketMedioHl: 0,
      topFuncionario: null,
      topProduto: null,
      topTurno: null,
      topSetor: null,
      topMotivo: null,
    };
  }

  let totalValor = 0;
  let totalQuantidade = 0;
  let totalHlPerdido = 0;

  const funcMap: Record<string, { cargo: string; valor: number; qtd: number; hl: number }> = {};
  const prodMap: Record<string, { codigo: string | number; nome: string; valor: number; qtd: number; hl: number }> = {};
  const turnoMap: Record<string, { valor: number; qtd: number; hl: number }> = {};
  const setorMap: Record<string, { valor: number; qtd: number; hl: number }> = {};
  const motivoMap: Record<string, { valor: number; qtd: number; hl: number }> = {};

  items.forEach((item) => {
    const val = Number(item.valor ?? item.valor_avaria) || 0;
    const qtd = Number(item.quantidade) || 0;
    const hl = Number(item.hecto_perdido) || 0;

    totalValor += val;
    totalQuantidade += qtd;
    totalHlPerdido += hl;

    // Funcionario / Colaborador
    const funcNome = (item.colaborador || item.funcionario || 'NÃO INFORMADO').toUpperCase();
    const cargoNome = (item.funcao || item.cargo || 'EMPILHADOR').toUpperCase();
    if (!funcMap[funcNome]) {
      funcMap[funcNome] = { cargo: cargoNome, valor: 0, qtd: 0, hl: 0 };
    }
    funcMap[funcNome].valor += val;
    funcMap[funcNome].qtd += qtd;
    funcMap[funcNome].hl += hl;

    // Produto
    const prodKey = String(item.codigo_produto || item.produto || 'SEM CÓDIGO');
    if (!prodMap[prodKey]) {
      prodMap[prodKey] = {
        codigo: item.codigo_produto || '-',
        nome: item.produto || 'Produto Não Informado',
        valor: 0,
        qtd: 0,
        hl: 0,
      };
    }
    prodMap[prodKey].valor += val;
    prodMap[prodKey].qtd += qtd;
    prodMap[prodKey].hl += hl;

    // Turno
    const turnoKey = item.turno || 'Não Definido';
    if (!turnoMap[turnoKey]) {
      turnoMap[turnoKey] = { valor: 0, qtd: 0, hl: 0 };
    }
    turnoMap[turnoKey].valor += val;
    turnoMap[turnoKey].qtd += qtd;
    turnoMap[turnoKey].hl += hl;

    // Setor / Area
    const setorKey = (item.area || item.setor || 'ARMAZEM').toUpperCase();
    if (!setorMap[setorKey]) {
      setorMap[setorKey] = { valor: 0, qtd: 0, hl: 0 };
    }
    setorMap[setorKey].valor += val;
    setorMap[setorKey].qtd += qtd;
    setorMap[setorKey].hl += hl;

    // Motivo
    const motivoKey = (item.motivo || 'AVARIA / QUEBRA').toUpperCase();
    if (!motivoMap[motivoKey]) {
      motivoMap[motivoKey] = { valor: 0, qtd: 0, hl: 0 };
    }
    motivoMap[motivoKey].valor += val;
    motivoMap[motivoKey].qtd += qtd;
    motivoMap[motivoKey].hl += hl;
  });

  // Top Funcionario
  let topFunc: { nome: string; cargo: string; valor: number; qtd: number; hl: number } | null = null;
  Object.entries(funcMap).forEach(([nome, data]) => {
    if (!topFunc || data.valor > topFunc.valor) {
      topFunc = { nome, ...data };
    }
  });

  // Top Produto
  let topProd: { codigo: string | number; nome: string; valor: number; qtd: number; hl: number } | null = null;
  Object.entries(prodMap).forEach(([, data]) => {
    if (!topProd || data.valor > topProd.valor) {
      topProd = { ...data };
    }
  });

  // Top Turno
  let topTurno: { turno: string; valor: number; qtd: number; hl: number } | null = null;
  Object.entries(turnoMap).forEach(([turno, data]) => {
    if (!topTurno || data.valor > topTurno.valor) {
      topTurno = { turno, ...data };
    }
  });

  // Top Setor
  let topSetor: { setor: string; valor: number; qtd: number; hl: number } | null = null;
  Object.entries(setorMap).forEach(([setor, data]) => {
    if (!topSetor || data.valor > topSetor.valor) {
      topSetor = { setor, ...data };
    }
  });

  // Top Motivo
  let topMotivo: { motivo: string; valor: number; qtd: number; hl: number } | null = null;
  Object.entries(motivoMap).forEach(([motivo, data]) => {
    if (!topMotivo || data.valor > topMotivo.valor) {
      topMotivo = { motivo, ...data };
    }
  });

  return {
    totalValor,
    totalQuantidade,
    totalHlPerdido: Number(totalHlPerdido.toFixed(4)),
    totalOcorrencias: items.length,
    ticketMedioValor: items.length > 0 ? totalValor / items.length : 0,
    ticketMedioHl: items.length > 0 ? totalHlPerdido / items.length : 0,
    topFuncionario: topFunc,
    topProduto: topProd,
    topTurno: topTurno,
    topSetor: topSetor,
    topMotivo: topMotivo,
  };
}

export function agruparPorMes(items: QuebraMovimentacaoItem[]) {
  const map: Record<string, { mes: string; valor: number; quantidade: number; hectoPerdido: number; ocorrencias: number }> = {};

  items.forEach((item) => {
    const mes = (item.mes || 'JANEIRO').toUpperCase();
    if (!map[mes]) {
      map[mes] = { mes, valor: 0, quantidade: 0, hectoPerdido: 0, ocorrencias: 0 };
    }
    map[mes].valor += Number(item.valor ?? item.valor_avaria) || 0;
    map[mes].quantidade += Number(item.quantidade) || 0;
    map[mes].hectoPerdido += Number(item.hecto_perdido) || 0;
    map[mes].ocorrencias += 1;
  });

  return Object.values(map);
}

export function agruparPorFuncionario(items: QuebraMovimentacaoItem[], limit = 8) {
  const map: Record<
    string,
    { funcionario: string; cargo: string; valor: number; quantidade: number; hectoPerdido: number; ocorrencias: number }
  > = {};

  items.forEach((item) => {
    const func = (item.colaborador || item.funcionario || 'OUTROS').toUpperCase();
    const cargo = (item.funcao || item.cargo || 'EMPILHADOR').toUpperCase();
    if (!map[func]) {
      map[func] = { funcionario: func, cargo, valor: 0, quantidade: 0, hectoPerdido: 0, ocorrencias: 0 };
    }
    map[func].valor += Number(item.valor ?? item.valor_avaria) || 0;
    map[func].quantidade += Number(item.quantidade) || 0;
    map[func].hectoPerdido += Number(item.hecto_perdido) || 0;
    map[func].ocorrencias += 1;
  });

  return Object.values(map)
    .sort((a, b) => b.valor - a.valor)
    .slice(0, limit);
}

export function agruparPorProduto(items: QuebraMovimentacaoItem[], limit = 8) {
  const map: Record<
    string,
    { produto: string; codigo: string | number; valor: number; quantidade: number; hectoPerdido: number; ocorrencias: number }
  > = {};

  items.forEach((item) => {
    const prod = item.produto || 'Produto Não Informado';
    if (!map[prod]) {
      map[prod] = {
        produto: prod,
        codigo: item.codigo_produto || '-',
        valor: 0,
        quantidade: 0,
        hectoPerdido: 0,
        ocorrencias: 0,
      };
    }
    map[prod].valor += Number(item.valor ?? item.valor_avaria) || 0;
    map[prod].quantidade += Number(item.quantidade) || 0;
    map[prod].hectoPerdido += Number(item.hecto_perdido) || 0;
    map[prod].ocorrencias += 1;
  });

  return Object.values(map)
    .sort((a, b) => b.valor - a.valor)
    .slice(0, limit);
}

export function agruparPorMotivo(items: QuebraMovimentacaoItem[], limit = 8) {
  const map: Record<string, { motivo: string; valor: number; quantidade: number; hectoPerdido: number; ocorrencias: number }> = {};

  items.forEach((item) => {
    const mot = (item.motivo || 'NÃO ESPECIFICADO').toUpperCase();
    if (!map[mot]) {
      map[mot] = { motivo: mot, valor: 0, quantidade: 0, hectoPerdido: 0, ocorrencias: 0 };
    }
    map[mot].valor += Number(item.valor ?? item.valor_avaria) || 0;
    map[mot].quantidade += Number(item.quantidade) || 0;
    map[mot].hectoPerdido += Number(item.hecto_perdido) || 0;
    map[mot].ocorrencias += 1;
  });

  return Object.values(map)
    .sort((a, b) => b.valor - a.valor)
    .slice(0, limit);
}

export function normalizarTurno(rawTurno?: string | null): string {
  if (!rawTurno) return 'Manhã';
  const t = String(rawTurno).trim().toLowerCase();

  if (t.includes('manh') || t.includes('manha') || t.includes('1')) return 'Manhã';
  if (t.includes('tarde') || t.includes('2') || t.includes('vesp')) return 'Tarde';
  if (t.includes('madrugada')) return 'Madrugada';
  if (t.includes('noite') || t.includes('noturno') || t.includes('3')) return 'Noite';
  if (t.includes('adm')) return 'ADM';

  return rawTurno.trim().charAt(0).toUpperCase() + rawTurno.trim().slice(1).toLowerCase();
}

export function agruparPorTurno(items: QuebraMovimentacaoItem[]) {
  const map: Record<
    string,
    { turno: string; valor: number; quantidade: number; hectoPerdido: number; ocorrencias: number; porcentagem: number }
  > = {};
  let totalValor = 0;

  items.forEach((item) => {
    const turno = normalizarTurno(item.turno);
    if (!map[turno]) {
      map[turno] = { turno, valor: 0, quantidade: 0, hectoPerdido: 0, ocorrencias: 0, porcentagem: 0 };
    }
    const v = Number(item.valor ?? item.valor_avaria) || 0;
    map[turno].valor += v;
    map[turno].quantidade += Number(item.quantidade) || 0;
    map[turno].hectoPerdido += Number(item.hecto_perdido) || 0;
    map[turno].ocorrencias += 1;
    totalValor += v;
  });

  const res = Object.values(map).sort((a, b) => b.valor - a.valor);
  res.forEach((item) => {
    item.porcentagem = totalValor > 0 ? (item.valor / totalValor) * 100 : 0;
  });

  return res;
}

export function agruparPorSetor(items: QuebraMovimentacaoItem[]) {
  const map: Record<string, { setor: string; valor: number; quantidade: number; hectoPerdido: number; ocorrencias: number }> = {};

  items.forEach((item) => {
    const setor = (item.area || item.setor || 'ARMAZEM').toUpperCase();
    if (!map[setor]) {
      map[setor] = { setor, valor: 0, quantidade: 0, hectoPerdido: 0, ocorrencias: 0 };
    }
    map[setor].valor += Number(item.valor ?? item.valor_avaria) || 0;
    map[setor].quantidade += Number(item.quantidade) || 0;
    map[setor].hectoPerdido += Number(item.hecto_perdido) || 0;
    map[setor].ocorrencias += 1;
  });

  return Object.values(map);
}

/**
 * Estima o volume unitário em Hectolitros (HL) a partir da descrição do produto
 */
export function estimarHlUnitarioPorDescricao(descricao: string): number {
  const descUpper = (descricao || '').toUpperCase();

  const mlMatch = descUpper.match(/(\d+)\s*ML/);
  const lMatch = descUpper.match(/(\d+(?:[.,]\d+)?)\s*L(?:ITRO|TR)?/);

  if (mlMatch && mlMatch[1]) {
    const ml = parseFloat(mlMatch[1]);
    if (!isNaN(ml) && ml > 0) {
      return ml / 100000; // 1 HL = 100.000 ml (ex: 350ml = 0.0035 HL)
    }
  } else if (lMatch && lMatch[1]) {
    const l = parseFloat(lMatch[1].replace(',', '.'));
    if (!isNaN(l) && l > 0) {
      return l / 100; // 1 HL = 100 L (ex: 1L = 0.01 HL)
    }
  }

  if (descUpper.includes('269')) return 0.00269;
  if (descUpper.includes('330')) return 0.0033;
  if (descUpper.includes('350')) return 0.0035;
  if (descUpper.includes('355')) return 0.00355;
  if (descUpper.includes('473') || descUpper.includes('500')) return 0.00473;
  if (descUpper.includes('600')) return 0.006;
  if (descUpper.includes('1000') || descUpper.includes('1 LITRO') || descUpper.includes(' 1L')) return 0.01;

  return 0.0035; // default 350ml lata (0.0035 HL)
}

/**
 * Sanitiza e analisa registros de Quebras por Movimentação em formato JSON
 * Trata chaves oficiais: Data, Mês, CodProduto, Descricao, Quantidade, Area, Turno, CodQuebra, Motivo, Colaborador, Funcao, VALOR DA AVARIA, HECTO LITRO, HECTO PERDIDO
 */
export function sanitizarEParsearQuebrasMovJSON(rawText: string): QuebraMovimentacaoItem[] {
  if (!rawText || !rawText.trim()) {
    throw new Error('O conteúdo fornecido está vazio.');
  }

  let cleaned = rawText.trim();

  // 1. Remove BOM and zero-width spaces
  cleaned = cleaned.replace(/^\uFEFF/, '').replace(/[\u200B-\u200D\uFEFF]/g, '');

  // 2. Normalize NaN, None, undefined, Infinity from Python/Pandas/Dataframe exports
  cleaned = cleaned.replace(/:\s*NaN\b/gi, ': null');
  cleaned = cleaned.replace(/,\s*NaN\b/gi, ', null');
  cleaned = cleaned.replace(/\[\s*NaN\b/gi, '[ null');

  cleaned = cleaned.replace(/:\s*None\b/g, ': null');
  cleaned = cleaned.replace(/,\s*None\b/g, ', null');
  cleaned = cleaned.replace(/\[\s*None\b/g, '[ null');

  cleaned = cleaned.replace(/:\s*undefined\b/g, ': null');
  cleaned = cleaned.replace(/,\s*undefined\b/g, ', null');
  cleaned = cleaned.replace(/\[\s*undefined\b/g, '[ null');

  cleaned = cleaned.replace(/:\s*-?Infinity\b/gi, ': 0');

  // 3. Remove trailing commas before closing braces/brackets
  cleaned = cleaned.replace(/,\s*([\]}])/g, '$1');

  // 4. Handle Python dictionary single quotes if standard JSON quotes are missing
  if (cleaned.startsWith("{'") || cleaned.startsWith("[{'") || cleaned.startsWith("[ {'")) {
    cleaned = cleaned.replace(/'/g, '"');
  }

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err: any) {
    // Fallback: wrap in array if user pasted comma-separated objects without outer []
    if (cleaned.startsWith('{') && cleaned.endsWith('}')) {
      try {
        parsed = JSON.parse(`[${cleaned}]`);
      } catch {
        throw new Error(`Erro ao ler JSON: ${err.message || 'Estrutura inválida'}`);
      }
    } else {
      throw new Error(`Erro ao ler JSON: ${err.message || 'Estrutura inválida'}`);
    }
  }

  // Handle wrapped structures like { data: [...] } or { items: [...] }
  let list: any[] = [];
  if (Array.isArray(parsed)) {
    list = parsed;
  } else if (typeof parsed === 'object' && parsed !== null) {
    if (Array.isArray(parsed.quebras)) list = parsed.quebras;
    else if (Array.isArray(parsed.data)) list = parsed.data;
    else if (Array.isArray(parsed.items)) list = parsed.items;
    else if (Array.isArray(parsed.records)) list = parsed.records;
    else list = [parsed];
  }

  return list.map((rawItem: any, idx: number) => {
    // Normalizar todas as chaves do objeto sem espaços extras
    const norm: Record<string, any> = {};
    if (typeof rawItem === 'object' && rawItem !== null) {
      for (const [k, v] of Object.entries(rawItem)) {
        norm[k.trim()] = v;
      }
    }

    const cleanStr = (val: any, fallback: string = '') => {
      if (val === null || val === undefined || val === 'NaN' || Number.isNaN(val)) return fallback;
      const s = String(val).trim();
      return s === 'NaN' || s === 'null' || s === 'None' || s === 'undefined' ? fallback : s;
    };

    const cleanNum = (val: any, fallback: number = 0) => {
      if (val === null || val === undefined || val === '' || val === 'NaN' || Number.isNaN(val)) return fallback;
      if (typeof val === 'number') return Number.isNaN(val) ? fallback : val;
      const numStr = String(val).replace('R$', '').replace(/\s/g, '').replace(',', '.');
      const parsedNum = Number(numStr);
      return Number.isNaN(parsedNum) ? fallback : parsedNum;
    };

    // 1. DATA / HORA
    const rawDataHora =
      norm['Data'] ??
      norm['data'] ??
      norm['DATA'] ??
      norm['data_hora'] ??
      norm['dataHora'] ??
      norm['DataHora'] ??
      norm['Date'] ??
      norm['date'] ??
      new Date().toISOString().replace('T', ' ').slice(0, 19);

    const dataHoraStr = normalizarDataHoraQuebra(rawDataHora);

    // 2. MÊS
    let mesStr = cleanStr(
      norm['Mês'] ??
        norm['Mes'] ??
        norm['mês'] ??
        norm['mes'] ??
        norm['MÊS'] ??
        norm['MES'] ??
        norm['MesRef'] ??
        norm['mesRef'],
      ''
    ).toUpperCase();

    if (!mesStr) {
      // Deduce month from dataHora
      const mesesNomes = [
        'JANEIRO',
        'FEVEREIRO',
        'MARÇO',
        'ABRIL',
        'MAIO',
        'JUNHO',
        'JULHO',
        'AGOSTO',
        'SETEMBRO',
        'OUTUBRO',
        'NOVEMBRO',
        'DEZEMBRO',
      ];
      const matchDate = dataHoraStr.match(/^\d{4}-(\d{2})/);
      if (matchDate && matchDate[1]) {
        const mIdx = parseInt(matchDate[1], 10) - 1;
        if (mIdx >= 0 && mIdx < 12) mesStr = mesesNomes[mIdx];
      }
      if (!mesStr) mesStr = 'JANEIRO';
    }

    // 3. CÓDIGO PRODUTO (SKU)
    const rawCodProd =
      norm['CodProduto'] ??
      norm['codProduto'] ??
      norm['Cod_Produto'] ??
      norm['cod_produto'] ??
      norm['codigo_produto'] ??
      norm['codigoProduto'] ??
      norm['COD_PRODUTO'] ??
      norm['SKU'] ??
      norm['sku'] ??
      norm['Cod'] ??
      norm['cod'] ??
      0;

    const codigoProduto = typeof rawCodProd === 'number' ? (Number.isNaN(rawCodProd) ? 0 : rawCodProd) : cleanStr(rawCodProd, '0');

    // 4. DESCRIÇÃO DO PRODUTO
    const descricao = cleanStr(
      norm['Descricao'] ??
        norm['descricao'] ??
        norm['DESCRICAO'] ??
        norm['Descrição'] ??
        norm['descrição'] ??
        norm['produto'] ??
        norm['Produto'] ??
        norm['PRODUTO'] ??
        norm['nome_produto'],
      'PRODUTO NÃO INFORMADO'
    );

    // 5. QUANTIDADE
    const quantidade = cleanNum(
      norm['Quantidade'] ??
        norm['quantidade'] ??
        norm['QUANTIDADE'] ??
        norm['qtd'] ??
        norm['Qtd'] ??
        norm['QTD'] ??
        norm['Qtde'] ??
        norm['qtde'],
      1
    );

    // 6. ÁREA / SETOR
    const areaStr = cleanStr(
      norm['Area'] ??
        norm['area'] ??
        norm['AREA'] ??
        norm['Área'] ??
        norm['área'] ??
        norm['setor'] ??
        norm['Setor'] ??
        norm['SETOR'] ??
        norm['Local'] ??
        norm['local'],
      'ARMAZEM'
    ).toUpperCase();

    // 7. TURNO
    const turnoStr = normalizarTurno(
      cleanStr(norm['Turno'] ?? norm['turno'] ?? norm['TURNO'], 'Manhã')
    );

    // 8. CÓDIGO DA QUEBRA / FILIAL
    const rawCodQuebra =
      norm['CodQuebra'] ??
      norm['codQuebra'] ??
      norm['Cod_Quebra'] ??
      norm['cod_quebra'] ??
      norm['COD_QUEBRA'] ??
      norm['filial'] ??
      norm['Filial'] ??
      norm['FILIAL'] ??
      524;

    const codQuebra = cleanNum(rawCodQuebra, 524);

    // 9. MOTIVO
    const motivoStr = cleanStr(
      norm['Motivo'] ??
        norm['motivo'] ??
        norm['MOTIVO'] ??
        norm['DescMotivo'] ??
        norm['descMotivo'] ??
        norm['Motivo da Quebra'] ??
        norm['TipoQuebra'] ??
        norm['tipoQuebra'] ??
        norm['Causa'] ??
        norm['causa'],
      'FALTA NO PALETE'
    ).toUpperCase();

    // 10. COLABORADOR / FUNCIONÁRIO
    const colaboradorStr = cleanStr(
      norm['Colaborador'] ??
        norm['colaborador'] ??
        norm['COLABORADOR'] ??
        norm['funcionario'] ??
        norm['Funcionario'] ??
        norm['FUNCIONARIO'] ??
        norm['operador'] ??
        norm['Operador'] ??
        norm['Nome'] ??
        norm['nome'],
      'NÃO INFORMADO'
    ).toUpperCase();

    // 11. FUNÇÃO / CARGO
    const funcaoStr = cleanStr(
      norm['Funcao'] ??
        norm['funcao'] ??
        norm['FUNCAO'] ??
        norm['Função'] ??
        norm['função'] ??
        norm['cargo'] ??
        norm['Cargo'] ??
        norm['CARGO'],
      'EMPILHADOR'
    ).toUpperCase();

    // 12. VALOR DA AVARIA (R$)
    const rawValorAvaria =
      norm['VALOR DA AVARIA'] ??
      norm['Valor da Avaria'] ??
      norm['valor_avaria'] ??
      norm['valorAvaria'] ??
      norm['VALOR_DA_AVARIA'] ??
      norm['valor'] ??
      norm['Valor'] ??
      norm['VALOR'] ??
      norm['prejuizo'] ??
      norm['Prejuizo'] ??
      norm['valor_total'] ??
      0;

    const valorAvaria = cleanNum(rawValorAvaria, 0);

    // 13. HECTO LITRO (HL unitário)
    const rawHectoLitro =
      norm['HECTO LITRO'] ??
      norm['Hecto Litro'] ??
      norm['hecto_litro'] ??
      norm['hectoLitro'] ??
      norm['HECTO_LITRO'] ??
      norm['HL'] ??
      norm['hl'];

    let hectoLitro = rawHectoLitro !== undefined && rawHectoLitro !== null && rawHectoLitro !== ''
      ? cleanNum(rawHectoLitro, 0)
      : estimarHlUnitarioPorDescricao(descricao);

    // 14. HECTO PERDIDO (HL Total)
    const rawHectoPerdido =
      norm['HECTO PERDIDO'] ??
      norm['Hecto Perdido'] ??
      norm['hecto_perdido'] ??
      norm['hectoPerdido'] ??
      norm['HECTO_PERDIDO'] ??
      norm['hl_perdido'] ??
      norm['hlPerdido'] ??
      norm['VolumeHL'] ??
      norm['volume_hl'];

    let hectoPerdido = 0;
    if (rawHectoPerdido !== undefined && rawHectoPerdido !== null && rawHectoPerdido !== '') {
      hectoPerdido = cleanNum(rawHectoPerdido, 0);
    } else {
      // Calcular: Quantidade * Hecto Litro
      hectoPerdido = Number((quantidade * hectoLitro).toFixed(4));
    }

    // Ajustar se hectoLitro for 0 mas tivermos hectoPerdido e quantidade
    if (hectoLitro <= 0 && hectoPerdido > 0 && quantidade > 0) {
      hectoLitro = Number((hectoPerdido / quantidade).toFixed(4));
    }

    // 15. Percentuais e Observação
    const percentual1 = cleanNum(norm['percentual_1'] ?? norm['perc_1'] ?? norm['Percentual 1'], 0.01);
    const percentual2 = cleanNum(norm['percentual_2'] ?? norm['perc_2'] ?? norm['Percentual 2'], 0.01);
    const observacao = cleanStr(
      norm['observacao'] ??
        norm['Observacao'] ??
        norm['OBSERVACAO'] ??
        norm['obs'] ??
        `Motivo: ${motivoStr} | Operador: ${colaboradorStr} (${funcaoStr})`,
      ''
    );

    return {
      id: norm['id'] || `qm-imp-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
      data_hora: dataHoraStr,
      data: dataHoraStr.slice(0, 10),
      mes: mesStr,
      codigo_produto: codigoProduto,
      produto: descricao,
      quantidade,
      setor: areaStr,
      area: areaStr,
      turno: turnoStr,
      filial: codQuebra,
      cod_quebra: codQuebra,
      codigo_quebra: codQuebra,
      motivo: motivoStr,
      funcionario: colaboradorStr,
      colaborador: colaboradorStr,
      cargo: funcaoStr,
      funcao: funcaoStr,
      valor: valorAvaria,
      valor_avaria: valorAvaria,
      hecto_litro: Number(hectoLitro.toFixed(4)),
      hecto_perdido: Number(hectoPerdido.toFixed(4)),
      percentual_1: percentual1,
      percentual_2: percentual2,
      observacao,
      createdAt: norm['createdAt'] || new Date().toISOString(),
      rawData: norm,
    };
  });
}

export function exportarQuebrasMovCSV(items: QuebraMovimentacaoItem[]) {
  const headers = [
    'ID',
    'Data e Hora',
    'Mês',
    'Cód. SKU',
    'Produto',
    'Quantidade',
    'Hecto Litro (HL)',
    'Hecto Perdido (HL)',
    'Valor da Avaria (R$)',
    'Área / Setor',
    'Turno',
    'Cód. Quebra / Filial',
    'Motivo',
    'Colaborador',
    'Função / Cargo',
    'Percentual 1',
    'Percentual 2',
    'Observação',
  ];

  const rows = items.map((item) => [
    item.id,
    item.data_hora,
    item.mes,
    item.codigo_produto,
    `"${(item.produto || '').replace(/"/g, '""')}"`,
    item.quantidade,
    (item.hecto_litro ?? 0).toFixed(4),
    (item.hecto_perdido ?? 0).toFixed(4),
    (item.valor ?? item.valor_avaria ?? 0).toFixed(2),
    item.area || item.setor,
    item.turno,
    item.cod_quebra ?? item.filial,
    `"${(item.motivo || '').replace(/"/g, '""')}"`,
    item.colaborador || item.funcionario,
    item.funcao || item.cargo,
    item.percentual_1 ?? '',
    item.percentual_2 ?? '',
    `"${(item.observacao || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Quebras_Movimentacao_Armazem_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
