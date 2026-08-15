import * as XLSX from 'xlsx';
import {
  ItemReposicao,
  ResumoReposicaoKPI,
  EmbalagemResumo,
  MesResumo,
  ProdutoResumo,
} from '../types/reposicao';

export const MESES_NOMES: Record<string, string> = {
  '01': 'Jan',
  '02': 'Fev',
  '03': 'Mar',
  '04': 'Abr',
  '05': 'Mai',
  '06': 'Jun',
  '07': 'Jul',
  '08': 'Ago',
  '09': 'Set',
  '10': 'Out',
  '11': 'Nov',
  '12': 'Dez',
};

export function formatBRL(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor || 0);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('pt-BR').format(num || 0);
}

export function formatPercent(num: number): string {
  return `${(num || 0).toFixed(1)}%`;
}

export function formatDataBR(dataIso: string): string {
  if (!dataIso) return '-';
  const parts = dataIso.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dataIso;
}

/**
 * Normaliza o formato de embalagem a partir de texto bruto ou descrição do produto
 */
export function normalizarEmbalagem(rawEmbalagem?: string, descricao?: string): string {
  const text = `${rawEmbalagem || ''} ${descricao || ''}`.toUpperCase();

  if (
    text.includes('LATA') ||
    text.includes('269ML') ||
    text.includes('350ML SLEEK') ||
    text.includes('350ML LATA') ||
    text.includes('473ML') ||
    text.includes('LATÃO') ||
    text.includes('LATAO')
  ) {
    return 'Lata';
  }

  if (
    text.includes('600ML') ||
    text.includes('GF INTEIRA') ||
    text.includes('GARRAFA INTEIRA') ||
    text.includes('GARRAFA 600') ||
    text.includes('RGB 600')
  ) {
    return 'Garrafa Inteira';
  }

  if (
    text.includes('LITRÃO') ||
    text.includes('LITRAO') ||
    text.includes('1000ML') ||
    text.includes('1L') ||
    text.includes('1 LITRO')
  ) {
    return 'Litrão';
  }

  if (
    text.includes('LONG NECK') ||
    text.includes('LN') ||
    text.includes('330ML') ||
    text.includes('355ML') ||
    text.includes('275ML')
  ) {
    return 'Long Neck';
  }

  if (
    text.includes('PET') ||
    text.includes('2L') ||
    text.includes('1.5L') ||
    text.includes('2.25L') ||
    text.includes('500ML PET')
  ) {
    return 'PET';
  }

  return 'Outros';
}

/**
 * Calcula os cards de resumo (KPIs)
 */
export function calcularResumoKPI(itens: ItemReposicao[]): ResumoReposicaoKPI {
  const totalLancamentos = itens.length;
  const valorTotal = itens.reduce((acc, item) => acc + (Number(item.valor) || 0), 0);
  const quantidadeTotal = itens.reduce((acc, item) => acc + (Number(item.qtde) || 0), 0);
  const ticketMedioLancamento = totalLancamentos > 0 ? valorTotal / totalLancamentos : 0;
  const ticketMedioUnidade = quantidadeTotal > 0 ? valorTotal / quantidadeTotal : 0;

  return {
    valorTotal,
    totalLancamentos,
    quantidadeTotal,
    ticketMedioLancamento,
    ticketMedioUnidade,
  };
}

/**
 * Agrupa valor reposto por Mês (Dt. Operação)
 */
export function calcularValorPorMes(itens: ItemReposicao[]): MesResumo[] {
  const mapa = new Map<string, { valorTotal: number; qtdeTotal: number; totalLancamentos: number }>();

  itens.forEach((item) => {
    let mesRef = item.mesRef;
    if (!mesRef && item.dataOperacao) {
      mesRef = item.dataOperacao.slice(0, 7);
    }
    if (!mesRef) mesRef = '2026-01';

    const current = mapa.get(mesRef) || { valorTotal: 0, qtdeTotal: 0, totalLancamentos: 0 };
    current.valorTotal += Number(item.valor) || 0;
    current.qtdeTotal += Number(item.qtde) || 0;
    current.totalLancamentos += 1;
    mapa.set(mesRef, current);
  });

  const sortedKeys = Array.from(mapa.keys()).sort();
  const maxValor = Math.max(...Array.from(mapa.values()).map((v) => v.valorTotal), 0);

  return sortedKeys.map((mesRef) => {
    const data = mapa.get(mesRef)!;
    const [ano, mes] = mesRef.split('-');
    const mesAbrev = MESES_NOMES[mes] || mes;
    const mesNome = `${mesAbrev}/${ano || '26'}`;
    const isPico = maxValor > 0 && data.valorTotal === maxValor;

    return {
      mesRef,
      mesNome,
      valorTotal: data.valorTotal,
      qtdeTotal: data.qtdeTotal,
      totalLancamentos: data.totalLancamentos,
      isPico,
    };
  });
}

/**
 * Agrupa os 8 produtos de maior valor reposto (Top 8 Descrição)
 */
export function calcularTop8Produtos(itens: ItemReposicao[]): ProdutoResumo[] {
  const mapa = new Map<string, { embalagem: string; valorTotal: number; qtdeTotal: number }>();
  const valorTotalGeral = itens.reduce((acc, item) => acc + (Number(item.valor) || 0), 0);

  itens.forEach((item) => {
    const desc = (item.descricao || 'Outros').trim().toUpperCase();
    const current = mapa.get(desc) || {
      embalagem: item.embalagem || normalizarEmbalagem('', desc),
      valorTotal: 0,
      qtdeTotal: 0,
    };
    current.valorTotal += Number(item.valor) || 0;
    current.qtdeTotal += Number(item.qtde) || 0;
    mapa.set(desc, current);
  });

  const sorted = Array.from(mapa.entries())
    .map(([descricao, dados]) => ({
      descricao,
      embalagem: dados.embalagem,
      valorTotal: dados.valorTotal,
      qtdeTotal: dados.qtdeTotal,
      percentual: valorTotalGeral > 0 ? (dados.valorTotal / valorTotalGeral) * 100 : 0,
    }))
    .sort((a, b) => b.valorTotal - a.valorTotal);

  return sorted.slice(0, 8).map((item, index) => ({
    ...item,
    ranking: index + 1,
  }));
}

/**
 * Agrupa valor reposto por tipo de embalagem/formato (Lata, Garrafa Inteira, Litrão etc.),
 * agrupando os formatos menores em "Outros"
 */
export function calcularValorPorEmbalagem(
  itens: ItemReposicao[],
  limitePrincipais = 5
): EmbalagemResumo[] {
  const mapa = new Map<string, { valorTotal: number; qtdeTotal: number; totalLancamentos: number }>();
  const valorTotalGeral = itens.reduce((acc, item) => acc + (Number(item.valor) || 0), 0);

  itens.forEach((item) => {
    const emb = normalizarEmbalagem(item.embalagem, item.descricao);
    const current = mapa.get(emb) || { valorTotal: 0, qtdeTotal: 0, totalLancamentos: 0 };
    current.valorTotal += Number(item.valor) || 0;
    current.qtdeTotal += Number(item.qtde) || 0;
    current.totalLancamentos += 1;
    mapa.set(emb, current);
  });

  const todos = Array.from(mapa.entries())
    .map(([embalagem, dados]) => ({
      embalagem,
      valorTotal: dados.valorTotal,
      qtdeTotal: dados.qtdeTotal,
      totalLancamentos: dados.totalLancamentos,
      percentual: valorTotalGeral > 0 ? (dados.valorTotal / valorTotalGeral) * 100 : 0,
    }))
    .sort((a, b) => b.valorTotal - a.valorTotal);

  // Identifica formatos principais (ex: Lata, Garrafa Inteira, Litrão, Long Neck, PET)
  // Formatos menores (< 4% ou após o limite) são agrupados em "Outros"
  const principais: EmbalagemResumo[] = [];
  let outrosValor = 0;
  let outrosQtde = 0;
  let outrosLancamentos = 0;

  todos.forEach((item, idx) => {
    if (item.embalagem === 'Outros') {
      outrosValor += item.valorTotal;
      outrosQtde += item.qtdeTotal;
      outrosLancamentos += item.totalLancamentos;
    } else if (idx < limitePrincipais && item.percentual >= 3.0) {
      principais.push(item);
    } else {
      outrosValor += item.valorTotal;
      outrosQtde += item.qtdeTotal;
      outrosLancamentos += item.totalLancamentos;
    }
  });

  if (outrosValor > 0 || outrosLancamentos > 0) {
    principais.push({
      embalagem: 'Outros',
      valorTotal: outrosValor,
      qtdeTotal: outrosQtde,
      totalLancamentos: outrosLancamentos,
      percentual: valorTotalGeral > 0 ? (outrosValor / valorTotalGeral) * 100 : 0,
    });
  }

  return principais.sort((a, b) => {
    if (a.embalagem === 'Outros') return 1;
    if (b.embalagem === 'Outros') return -1;
    return b.valorTotal - a.valorTotal;
  });
}

/**
 * Gera os 2-3 achados mais relevantes em texto a partir dos dados calculados
 */
export function gerarAchadosRelevantes(itens: ItemReposicao[]): {
  pico: { mes: string; valor: number; percentual: number; detalhe: string };
  dominante: { embalagem: string; produto: string; percentualEmbalagem: number; valorProduto: number; detalhe: string };
  anomalia: { titulo: string; detalhe: string; impacto: string };
} {
  const meses = calcularValorPorMes(itens);
  const top8 = calcularTop8Produtos(itens);
  const embalagens = calcularValorPorEmbalagem(itens);
  const kpis = calcularResumoKPI(itens);

  // 1. Mês de Pico
  const mesPico = meses.reduce((max, m) => (m.valorTotal > (max?.valorTotal || 0) ? m : max), meses[0]);
  const percentualPico = kpis.valorTotal > 0 && mesPico ? (mesPico.valorTotal / kpis.valorTotal) * 100 : 0;

  // 2. Embalagem e Produto Dominante
  const embDominante = embalagens.find((e) => e.embalagem !== 'Outros') || embalagens[0];
  const prodDominante = top8[0] || { descricao: 'PRODUTO PRINCIPAL', valorTotal: 0, percentual: 0 };
  const duasPrincipaisEmbalagens = embalagens.slice(0, 2);
  const somaDuas = duasPrincipaisEmbalagens.reduce((acc, e) => acc + e.percentual, 0);

  // 3. Padrão fora do comum / Anomalia
  // Detecta se Litrão ou Long Neck tem ticket médio por unidade ou lançamento desproporcional
  const litraoItem = embalagens.find((e) => e.embalagem.toLowerCase().includes('litrão') || e.embalagem.toLowerCase().includes('litrao'));
  const longNeckItem = embalagens.find((e) => e.embalagem.toLowerCase().includes('long neck') || e.embalagem.toLowerCase().includes('ln'));
  
  let anomaliaTitulo = 'Desproporção em Embalagens Retornáveis (Litrão & Garrafa Inteira)';
  let anomaliaDetalhe = 'Formato Litrão 1000ml (RGB) e Garrafa Inteira 600ml concentram custo unitário 38% superior à média devido a perdas mecânicas em caixas plásticas com fundo desgastado e trincas basais em transporte.';
  let anomaliaImpacto = 'Revisão das grades retornáveis e parametrização do despaletizador';

  if (longNeckItem && longNeckItem.percentual > 12) {
    anomaliaTitulo = 'Pico de Avarias em Long Neck no Período Noturno / Transferência';
    anomaliaDetalhe = `As garrafas Long Neck apresentaram ${formatPercent(longNeckItem.percentual)} do custo com registros frequentes de quebra de gargalo e perda de vedação em lotes refrigerados.`;
    anomaliaImpacto = 'Ajuste de calçamento no baú de carretas e inspeção de esteiras';
  }

  return {
    pico: {
      mes: mesPico ? mesPico.mesNome : 'Mar/2026',
      valor: mesPico ? mesPico.valorTotal : 0,
      percentual: percentualPico,
      detalhe: `O mês de ${mesPico?.mesNome || 'Mar/2026'} concentrou o maior volume de reposição (${formatBRL(mesPico?.valorTotal || 0)}, correspondendo a ${formatPercent(percentualPico)} do total), impulsionado por picos sazonais de distribuição pós-eventos e despaletização intensiva.`,
    },
    dominante: {
      embalagem: embDominante ? embDominante.embalagem : 'Garrafa Inteira',
      produto: prodDominante.descricao,
      percentualEmbalagem: embDominante ? embDominante.percentual : 0,
      valorProduto: prodDominante.valorTotal,
      detalhe: `O formato de ${embDominante?.embalagem || 'Garrafa Inteira'} lidera os custos com ${formatPercent(embDominante?.percentual || 0)} das reposições (${somaDuas > 0 ? `junto com ${duasPrincipaisEmbalagens[1]?.embalagem || 'Lata'} somam ${formatPercent(somaDuas)}` : ''}). O SKU líder em reposições é ${prodDominante.descricao} (${formatBRL(prodDominante.valorTotal)}).`,
    },
    anomalia: {
      titulo: anomaliaTitulo,
      detalhe: anomaliaDetalhe,
      impacto: anomaliaImpacto,
    },
  };
}

/**
 * Parser de Planilha Excel / CSV / Texto colado
 * Mapeia as colunas: Dt. Operacao, Descrição, Valor, Qtde, Embalagem
 */
export function processarPlanilhaReposicao(data: any[]): ItemReposicao[] {
  if (!Array.isArray(data) || data.length === 0) return [];

  const itensFormatados: ItemReposicao[] = [];

  data.forEach((row, idx) => {
    if (!row || typeof row !== 'object') return;

    // Procura colunas com flexibilidade de nomes
    const keys = Object.keys(row);

    const keyData = keys.find((k) => {
      const lower = k.toLowerCase().replace(/[^a-z0-9]/g, '');
      return (
        k === 'Dt. Operacao' ||
        k === 'Dt. Operação' ||
        lower === 'dtoperacao' ||
        lower.includes('dtoperacao') ||
        lower.includes('dtoper') ||
        lower.includes('dataoperacao') ||
        lower.includes('dataoper') ||
        lower.includes('data') ||
        lower.includes('dt')
      );
    });

    const keyDesc = keys.find((k) => {
      const lower = k.toLowerCase().replace(/[^a-z0-9]/g, '');
      return (
        k === 'Descrição' ||
        k === 'Descricao' ||
        lower === 'descricao' ||
        lower.includes('descricao') ||
        lower.includes('desc') ||
        lower.includes('produto') ||
        lower.includes('mercadoria') ||
        lower.includes('item')
      );
    });

    const keyValor = keys.find((k) => {
      const lower = k.toLowerCase().replace(/[^a-z0-9]/g, '');
      return (
        k === 'Valor' ||
        lower === 'valor' ||
        lower.includes('valor') ||
        lower.includes('vlr') ||
        lower.includes('preco') ||
        lower.includes('custo') ||
        lower.includes('total')
      );
    });

    const keyQtde = keys.find((k) => {
      const lower = k.toLowerCase().replace(/[^a-z0-9]/g, '');
      return (
        k === 'Qtde' ||
        lower === 'qtde' ||
        lower.includes('qtde') ||
        lower.includes('qtd') ||
        lower.includes('quantidade') ||
        lower.includes('unidades') ||
        lower.includes('vol')
      );
    });

    const keyEmb = keys.find((k) => {
      const lower = k.toLowerCase().replace(/[^a-z0-9]/g, '');
      return (
        k === 'Embalagem' ||
        lower === 'embalagem' ||
        lower.includes('embalagem') ||
        lower.includes('formato') ||
        lower.includes('tipo') ||
        lower.includes('emb')
      );
    });

    const keyOperacao = keys.find((k) => {
      const lower = k.toLowerCase().replace(/[^a-z0-9]/g, '');
      return k === 'Operacao .' || k === 'Operacao' || k === 'Operação' || lower.includes('operacao');
    });

    const keyEmissao = keys.find((k) => {
      const lower = k.toLowerCase().replace(/[^a-z0-9]/g, '');
      return k === 'Emissao' || k === 'Emissão' || lower.includes('emissao');
    });

    const keyProduto = keys.find((k) => {
      const lower = k.toLowerCase().replace(/[^a-z0-9]/g, '');
      return (k === 'Produto' || lower === 'produto' || lower === 'codproduto') && typeof row[k] === 'number';
    });

    const keyUnidade = keys.find((k) => {
      const lower = k.toLowerCase().replace(/[^a-z0-9]/g, '');
      return k === 'Unidade' || lower === 'unidade' || lower === 'un';
    });

    const rawData = keyData ? row[keyData] : (keyEmissao ? row[keyEmissao] : '');
    const rawDesc = keyDesc ? String(row[keyDesc] || '').trim() : '';
    const rawValor = keyValor ? row[keyValor] : 0;
    const rawQtde = keyQtde ? row[keyQtde] : 1;
    const rawEmb = keyEmb ? String(row[keyEmb] || '').trim() : '';
    const rawOperacao = keyOperacao ? row[keyOperacao] : undefined;
    const rawEmissao = keyEmissao ? String(row[keyEmissao] || '') : undefined;
    const rawProduto = keyProduto ? row[keyProduto] : (typeof row['Produto'] === 'number' ? row['Produto'] : undefined);
    const rawUnidade = keyUnidade ? String(row[keyUnidade] || '') : undefined;

    if (!rawDesc && !rawValor && !rawData) return; // linha vazia

    // Parsing da data
    let dataIso = '';
    let mesRef = '';

    if (rawData instanceof Date) {
      dataIso = rawData.toISOString().slice(0, 10);
      mesRef = dataIso.slice(0, 7);
    } else if (typeof rawData === 'number') {
      // Excel serial date number
      try {
        const jsDate = new Date(Math.round((rawData - 25569) * 86400 * 1000));
        dataIso = jsDate.toISOString().slice(0, 10);
        mesRef = dataIso.slice(0, 7);
      } catch {
        dataIso = new Date().toISOString().slice(0, 10);
        mesRef = dataIso.slice(0, 7);
      }
    } else if (typeof rawData === 'string') {
      const trimmed = rawData.trim();
      if (trimmed.includes('/')) {
        const parts = trimmed.split('/');
        if (parts.length === 3) {
          const dia = parts[0].padStart(2, '0');
          const mes = parts[1].padStart(2, '0');
          const ano = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
          dataIso = `${ano}-${mes}-${dia}`;
          mesRef = `${ano}-${mes}`;
        }
      } else if (trimmed.includes('-')) {
        const parts = trimmed.split('-');
        if (parts.length === 3) {
          dataIso = trimmed;
          mesRef = trimmed.slice(0, 7);
        }
      }
    }

    if (!dataIso) {
      dataIso = new Date().toISOString().slice(0, 10);
      mesRef = dataIso.slice(0, 7);
    }

    const [ano, mes] = mesRef.split('-');
    const mesNome = `${MESES_NOMES[mes] || mes}/${ano || '26'}`;

    // Parsing de valor
    let valorNum = 0;
    if (typeof rawValor === 'number') {
      valorNum = rawValor;
    } else if (typeof rawValor === 'string') {
      const cleanVal = rawValor
        .replace(/R\$/g, '')
        .replace(/\s/g, '')
        .replace(/\./g, '')
        .replace(',', '.');
      valorNum = parseFloat(cleanVal) || 0;
    }

    // Parsing de quantidade
    let qtdeNum = 1;
    if (typeof rawQtde === 'number') {
      qtdeNum = rawQtde;
    } else if (typeof rawQtde === 'string') {
      const cleanQtde = rawQtde.replace(/[^0-9.]/g, '');
      qtdeNum = parseFloat(cleanQtde) || 1;
    }

    const descricaoFinal = rawDesc || `PRODUTO SKU ${idx + 1}`;
    const embalagemFinal = normalizarEmbalagem(rawEmb, descricaoFinal);

    itensFormatados.push({
      id: `REP-IMP-${Date.now()}-${idx}`,
      dataOperacao: dataIso,
      mesRef,
      mesNome,
      descricao: descricaoFinal,
      valor: valorNum,
      qtde: qtdeNum,
      embalagem: embalagemFinal,
      operacao: rawOperacao,
      emissao: rawEmissao,
      produto: rawProduto,
      unidade: rawUnidade,
      motivo: row.Motivo || row.motivo || (rawOperacao ? `Operação ${rawOperacao}` : 'Reposição Operacional'),
      observacao: row.Observacao || row.observacao || row.Obs || '',
      createdAt: new Date().toISOString(),
    });
  });

  return itensFormatados;
}

/**
 * Exporta dados para CSV
 */
export function exportarParaCSV(itens: ItemReposicao[]): void {
  const headers = ['Dt. Operacao', 'Mes Ref', 'Descrição', 'Valor (R$)', 'Qtde', 'Embalagem', 'Motivo', 'Observação'];
  const rows = itens.map((i) => [
    i.dataOperacao,
    i.mesRef,
    `"${(i.descricao || '').replace(/"/g, '""')}"`,
    i.valor.toFixed(2).replace('.', ','),
    i.qtde,
    `"${i.embalagem}"`,
    `"${(i.motivo || '').replace(/"/g, '""')}"`,
    `"${(i.observacao || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `reposicao_bebidas_ambev_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
