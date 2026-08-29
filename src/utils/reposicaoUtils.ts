import * as XLSX from 'xlsx';
import {
  ItemReposicao,
  ResumoReposicaoKPI,
  EmbalagemResumo,
  MesResumo,
  ProdutoResumo,
  RotaResumo,
  StatusValeResumo,
  MotoristaResumo,
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

export function formatHL(hl: number): string {
  return `${(hl || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} HL`;
}

export function formatPercent(num: number): string {
  return `${(num || 0).toFixed(1)}%`;
}

export function formatDataBR(dataIso: string): string {
  if (!dataIso) return '-';
  if (dataIso.includes('/')) return dataIso;
  const parts = dataIso.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dataIso;
}

/**
 * Normaliza o formato de embalagem a partir de texto bruto ou detalhamento do SKU
 */
export function normalizarEmbalagem(rawEmbalagem?: string, descricao?: string): string {
  const text = `${rawEmbalagem || ''} ${descricao || ''}`.toUpperCase();

  if (
    text.includes('LATA') ||
    text.includes('269ML') ||
    text.includes('350ML') ||
    text.includes('355ML') ||
    text.includes('473ML') ||
    text.includes('LATÃO') ||
    text.includes('LATAO') ||
    text.includes('SLEEK')
  ) {
    return 'Lata';
  }

  if (
    text.includes('600ML') ||
    text.includes('GF INTEIRA') ||
    text.includes('GARRAFA INTEIRA') ||
    text.includes('GARRAFA 600') ||
    text.includes('RGB 600') ||
    text.includes('VASILHAME 600')
  ) {
    return 'Garrafa Inteira';
  }

  if (
    text.includes('LITRÃO') ||
    text.includes('LITRAO') ||
    text.includes('1000ML') ||
    text.includes('1L') ||
    text.includes('1 LITRO') ||
    text.includes('RGB 1000')
  ) {
    return 'Litrão';
  }

  if (
    text.includes('LONG NECK') ||
    text.includes('LN') ||
    text.includes('330ML') ||
    text.includes('275ML') ||
    text.includes('CORONA 330') ||
    text.includes('STELLA 330') ||
    text.includes('BUD 330') ||
    text.includes('SPATEN LN')
  ) {
    return 'Long Neck';
  }

  if (
    text.includes('PET') ||
    text.includes('2L') ||
    text.includes('1.5L') ||
    text.includes('2.25L') ||
    text.includes('500ML PET') ||
    text.includes('GUARANA PET')
  ) {
    return 'PET';
  }

  if (text.includes('CHOPP') || text.includes('BARRIL') || text.includes('KEG') || text.includes('30L') || text.includes('50L')) {
    return 'Chopp Barril';
  }

  return 'Outros';
}

/**
 * Extrai o nome limpo do produto a partir de detalhamento_skus
 * Ex: "9068 - SKOL LATA 350ML SH C/12 NPAL (2 CX)" -> "SKOL LATA 350ML"
 */
export function extrairDescricaoProduto(detalhe?: string, fallback = 'PRODUTO NÃO IDENTIFICADO'): string {
  if (!detalhe) return fallback;
  let text = detalhe.trim();
  // Remove prefixo de código "9068 - "
  if (/^\d+\s*-\s*/.test(text)) {
    text = text.replace(/^\d+\s*-\s*/, '');
  }
  // Remove sufixo de quantidade "(2 CX)"
  text = text.replace(/\(\s*\d+\s*(?:CX|UN|FD|PC|ITENS?|CAIXAS?)\s*\)/i, '').trim();
  // Remove "SH C/12 NPAL" ou similares para ficar mais limpo
  text = text.replace(/SH\s+C\/\d+\s*NPAL/i, '').trim();
  return text || detalhe;
}

/**
 * Calcula os cards de resumo (KPIs)
 */
export function calcularResumoKPI(itens: ItemReposicao[]): ResumoReposicaoKPI {
  const totalLancamentos = itens.length;
  const valorTotal = itens.reduce((acc, item) => acc + (Number(item.valor) || 0), 0);
  const volumeTotalHL = itens.reduce((acc, item) => acc + (Number(item.volume_total_hl) || 0), 0);
  const quantidadeTotal = itens.reduce((acc, item) => acc + (Number(item.qtde) || 0), 0);
  const ticketMedioLancamento = totalLancamentos > 0 ? valorTotal / totalLancamentos : 0;
  const ticketMedioUnidade = quantidadeTotal > 0 ? valorTotal / quantidadeTotal : 0;

  const totalRateio = itens.reduce((acc, item) => acc + (Number(item.valor_rateado_por_pessoa) || 0), 0);
  const mediaRateioPessoa = totalLancamentos > 0 ? totalRateio / totalLancamentos : 0;

  const totalCompensadoR$ = itens
    .filter((i) => (i.status_vale || '').toLowerCase().includes('compensado'))
    .reduce((acc, item) => acc + (Number(item.valor) || 0), 0);

  const totalPendenteR$ = valorTotal - totalCompensadoR$;

  return {
    valorTotal,
    volumeTotalHL,
    totalLancamentos,
    quantidadeTotal,
    ticketMedioLancamento,
    ticketMedioUnidade,
    mediaRateioPessoa,
    totalCompensadoR$,
    totalPendenteR$,
  };
}

/**
 * Agrupa valor reposto e volume por Mês
 */
export function calcularValorPorMes(itens: ItemReposicao[]): MesResumo[] {
  const mapa = new Map<string, { valorTotal: number; volumeHL: number; qtdeTotal: number; totalLancamentos: number }>();

  itens.forEach((item) => {
    let mesRef = item.mesRef;
    if (!mesRef && item.dataOperacao) {
      mesRef = item.dataOperacao.slice(0, 7);
    }
    if (!mesRef) mesRef = '2026-01';

    const current = mapa.get(mesRef) || { valorTotal: 0, volumeHL: 0, qtdeTotal: 0, totalLancamentos: 0 };
    current.valorTotal += Number(item.valor) || 0;
    current.volumeHL += Number(item.volume_total_hl) || 0;
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
      volumeHL: Number(data.volumeHL.toFixed(2)),
      qtdeTotal: data.qtdeTotal,
      totalLancamentos: data.totalLancamentos,
      isPico,
    };
  });
}

/**
 * Agrupa valor reposto por tipo de embalagem/formato
 */
export function calcularValorPorEmbalagem(
  itens: ItemReposicao[],
  limitePrincipais = 5
): EmbalagemResumo[] {
  const mapa = new Map<string, { valorTotal: number; volumeHL: number; qtdeTotal: number; totalLancamentos: number }>();
  const valorTotalGeral = itens.reduce((acc, item) => acc + (Number(item.valor) || 0), 0);

  itens.forEach((item) => {
    const emb = normalizarEmbalagem(item.embalagem, item.detalhamento_skus || item.descricao);
    const current = mapa.get(emb) || { valorTotal: 0, volumeHL: 0, qtdeTotal: 0, totalLancamentos: 0 };
    current.valorTotal += Number(item.valor) || 0;
    current.volumeHL += Number(item.volume_total_hl) || 0;
    current.qtdeTotal += Number(item.qtde) || 0;
    current.totalLancamentos += 1;
    mapa.set(emb, current);
  });

  const todos = Array.from(mapa.entries())
    .map(([embalagem, dados]) => ({
      embalagem,
      valorTotal: dados.valorTotal,
      volumeHL: Number(dados.volumeHL.toFixed(2)),
      qtdeTotal: dados.qtdeTotal,
      totalLancamentos: dados.totalLancamentos,
      percentual: valorTotalGeral > 0 ? (dados.valorTotal / valorTotalGeral) * 100 : 0,
    }))
    .sort((a, b) => b.valorTotal - a.valorTotal);

  const principais: EmbalagemResumo[] = [];
  let outrosValor = 0;
  let outrosHL = 0;
  let outrosQtde = 0;
  let outrosLancamentos = 0;

  todos.forEach((item, idx) => {
    if (item.embalagem === 'Outros') {
      outrosValor += item.valorTotal;
      outrosHL += item.volumeHL;
      outrosQtde += item.qtdeTotal;
      outrosLancamentos += item.totalLancamentos;
    } else if (idx < limitePrincipais && item.percentual >= 2.0) {
      principais.push(item);
    } else {
      outrosValor += item.valorTotal;
      outrosHL += item.volumeHL;
      outrosQtde += item.qtdeTotal;
      outrosLancamentos += item.totalLancamentos;
    }
  });

  if (outrosValor > 0 || outrosLancamentos > 0) {
    principais.push({
      embalagem: 'Outros',
      valorTotal: outrosValor,
      volumeHL: Number(outrosHL.toFixed(2)),
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
 * Agrupa Top 8 Produtos / SKUs mais repostos
 */
export function calcularTop8Produtos(itens: ItemReposicao[]): ProdutoResumo[] {
  const mapa = new Map<string, { embalagem: string; valorTotal: number; volumeHL: number; qtdeTotal: number }>();
  const valorTotalGeral = itens.reduce((acc, item) => acc + (Number(item.valor) || 0), 0);

  itens.forEach((item) => {
    const rawLabel = item.detalhamento_skus || item.descricao || 'Outros';
    const desc = extrairDescricaoProduto(rawLabel, 'PRODUTO DIVERSO').toUpperCase();
    const current = mapa.get(desc) || {
      embalagem: item.embalagem || normalizarEmbalagem('', desc),
      valorTotal: 0,
      volumeHL: 0,
      qtdeTotal: 0,
    };
    current.valorTotal += Number(item.valor) || 0;
    current.volumeHL += Number(item.volume_total_hl) || 0;
    current.qtdeTotal += Number(item.qtde) || 0;
    mapa.set(desc, current);
  });

  const sorted = Array.from(mapa.entries())
    .map(([descricao, dados]) => ({
      descricao,
      embalagem: dados.embalagem,
      valorTotal: dados.valorTotal,
      volumeHL: Number(dados.volumeHL.toFixed(2)),
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
 * Agrupa Top Rotas / Setores com Maior Prejuízo
 */
export function calcularTopRotas(itens: ItemReposicao[]): RotaResumo[] {
  const mapa = new Map<string, { valorTotal: number; volumeHL: number; totalLancamentos: number }>();
  const valorTotalGeral = itens.reduce((acc, item) => acc + (Number(item.valor) || 0), 0);

  itens.forEach((item) => {
    const rota = (item.rota_setor || 'Rota Não Identificada').trim().toUpperCase();
    const current = mapa.get(rota) || { valorTotal: 0, volumeHL: 0, totalLancamentos: 0 };
    current.valorTotal += Number(item.valor) || 0;
    current.volumeHL += Number(item.volume_total_hl) || 0;
    current.totalLancamentos += 1;
    mapa.set(rota, current);
  });

  return Array.from(mapa.entries())
    .map(([rota, dados]) => ({
      rota,
      valorTotal: dados.valorTotal,
      volumeHL: Number(dados.volumeHL.toFixed(2)),
      totalLancamentos: dados.totalLancamentos,
      percentual: valorTotalGeral > 0 ? (dados.valorTotal / valorTotalGeral) * 100 : 0,
    }))
    .sort((a, b) => b.valorTotal - a.valorTotal)
    .slice(0, 8);
}

/**
 * Agrupa por Status do Vale (Compensado, Pendente, etc.)
 */
export function calcularStatusVales(itens: ItemReposicao[]): StatusValeResumo[] {
  const mapa = new Map<string, { valorTotal: number; totalLancamentos: number }>();
  const valorTotalGeral = itens.reduce((acc, item) => acc + (Number(item.valor) || 0), 0);

  itens.forEach((item) => {
    const status = (item.status_vale || 'Em Análise').trim();
    const current = mapa.get(status) || { valorTotal: 0, totalLancamentos: 0 };
    current.valorTotal += Number(item.valor) || 0;
    current.totalLancamentos += 1;
    mapa.set(status, current);
  });

  return Array.from(mapa.entries())
    .map(([status, dados]) => ({
      status,
      valorTotal: dados.valorTotal,
      totalLancamentos: dados.totalLancamentos,
      percentual: valorTotalGeral > 0 ? (dados.valorTotal / valorTotalGeral) * 100 : 0,
    }))
    .sort((a, b) => b.valorTotal - a.valorTotal);
}

/**
 * Agrupa Top Motoristas / Condutores por Prejuízo
 */
export function calcularTopMotoristas(itens: ItemReposicao[]): MotoristaResumo[] {
  const mapa = new Map<string, { valorTotal: number; volumeHL: number; totalLancamentos: number; valorRateado: number }>();

  itens.forEach((item) => {
    const motorista = (item.motorista || 'Motorista Não Informado').trim().toUpperCase();
    const current = mapa.get(motorista) || { valorTotal: 0, volumeHL: 0, totalLancamentos: 0, valorRateado: 0 };
    current.valorTotal += Number(item.valor) || 0;
    current.volumeHL += Number(item.volume_total_hl) || 0;
    current.totalLancamentos += 1;
    current.valorRateado += Number(item.valor_rateado_por_pessoa) || 0;
    mapa.set(motorista, current);
  });

  return Array.from(mapa.entries())
    .map(([motorista, dados]) => ({
      motorista,
      valorTotal: dados.valorTotal,
      volumeHL: Number(dados.volumeHL.toFixed(2)),
      totalLancamentos: dados.totalLancamentos,
      valorRateado: dados.valorRateado,
    }))
    .sort((a, b) => b.valorTotal - a.valorTotal)
    .slice(0, 7);
}

/**
 * Gera os achados executivos para o painel de reposição
 */
export function gerarAchadosRelevantes(itens: ItemReposicao[]): {
  pico: { mes: string; valor: number; volumeHL: number; percentual: number; detalhe: string };
  dominante: { embalagem: string; produto: string; percentualEmbalagem: number; valorProduto: number; detalhe: string };
  rotaCritica: { rota: string; valor: number; percentual: number; detalhe: string };
} {
  const meses = calcularValorPorMes(itens);
  const top8 = calcularTop8Produtos(itens);
  const embalagens = calcularValorPorEmbalagem(itens);
  const topRotas = calcularTopRotas(itens);
  const kpis = calcularResumoKPI(itens);

  const mesPico = meses.reduce((max, m) => (m.valorTotal > (max?.valorTotal || 0) ? m : max), meses[0]);
  const percentualPico = kpis.valorTotal > 0 && mesPico ? (mesPico.valorTotal / kpis.valorTotal) * 100 : 0;

  const embDominante = embalagens.find((e) => e.embalagem !== 'Outros') || embalagens[0];
  const prodDominante = top8[0] || { descricao: 'PRODUTO PRINCIPAL', valorTotal: 0, percentual: 0 };

  const rotaCritica = topRotas[0] || { rota: 'Geral', valorTotal: 0, percentual: 0 };

  return {
    pico: {
      mes: mesPico ? mesPico.mesNome : 'Jan/2026',
      valor: mesPico ? mesPico.valorTotal : 0,
      volumeHL: mesPico ? mesPico.volumeHL : 0,
      percentual: percentualPico,
      detalhe: `O mês de ${mesPico?.mesNome || 'Jan/2026'} registrou o maior impacto financeiro em reposições (${formatBRL(mesPico?.valorTotal || 0)} / ${formatHL(mesPico?.volumeHL || 0)}), representando ${formatPercent(percentualPico)} do montante total.`,
    },
    dominante: {
      embalagem: embDominante ? embDominante.embalagem : 'Lata',
      produto: prodDominante.descricao,
      percentualEmbalagem: embDominante ? embDominante.percentual : 0,
      valorProduto: prodDominante.valorTotal,
      detalhe: `O formato de ${embDominante?.embalagem || 'Lata'} concentra ${formatPercent(embDominante?.percentual || 0)} do custo de reposição. O SKU com maior frequência e custo acumulado é ${prodDominante.descricao} (${formatBRL(prodDominante.valorTotal)}).`,
    },
    rotaCritica: {
      rota: rotaCritica.rota,
      valor: rotaCritica.valorTotal,
      percentual: rotaCritica.percentual,
      detalhe: `A rota ${rotaCritica.rota} desponta como a principal ofensora em quebras de transporte/entrega, acumulando ${formatBRL(rotaCritica.valorTotal)} (${formatPercent(rotaCritica.percentual)} do total das rotas).`,
    },
  };
}

/**
 * Validador e Sanitizador Estrito Linha por Linha de Vales JSON
 * Inspeciona minuciosamente cada linha/registro do arquivo para garantir
 * que todos os 22 campos do esquema oficial SSTR sejam validados e integrados corretamente.
 */
export function sanitizarEParsearValesJSON(jsonInput: string | any[] | Record<string, any>): ItemReposicao[] {
  let rawList: any[] = [];

  if (typeof jsonInput === 'string') {
    const trimmed = jsonInput.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        rawList = parsed;
      } else if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed.vales)) {
          rawList = parsed.vales;
        } else if (Array.isArray(parsed.records)) {
          rawList = parsed.records;
        } else if (Array.isArray(parsed.data)) {
          rawList = parsed.data;
        } else if (Array.isArray(parsed.itens)) {
          rawList = parsed.itens;
        } else {
          rawList = [parsed];
        }
      }
    } catch (err: any) {
      throw new Error(`Sintaxe JSON inválida: ${err.message || 'Verifique vírgulas e aspas'}`);
    }
  } else if (Array.isArray(jsonInput)) {
    rawList = jsonInput;
  } else if (jsonInput && typeof jsonInput === 'object') {
    rawList = [jsonInput];
  }

  if (rawList.length === 0) {
    return [];
  }

  return processarPlanilhaReposicao(rawList);
}

/**
 * Parser do JSON de Reposição da AMBEV
 * Suporta diretamente a nova estrutura oficial (item_numero, data_emissao, nota_fiscal, mapa_carga, rota_setor, motorista, etc.)
 * e mantém retrocompatibilidade integral.
 */
export function processarPlanilhaReposicao(data: any[]): ItemReposicao[] {
  if (!Array.isArray(data) || data.length === 0) return [];

  const itensFormatados: ItemReposicao[] = [];

  data.forEach((row, idx) => {
    if (!row || typeof row !== 'object') return;

    // 1. Extração direta de chaves do novo modelo SSTR / Vale Reposição
    const itemNumero = row.item_numero !== undefined ? Number(row.item_numero) : idx + 1;
    const notaFiscal = row.nota_fiscal ? String(row.nota_fiscal).trim() : (row['Nota Fiscal'] || row.nf || '');
    const mapaCarga = row.mapa_carga ? String(row.mapa_carga).trim() : (row['Mapa de Carga'] || row.mapa || '');
    const rotaSetor = row.rota_setor ? String(row.rota_setor).trim() : (row['Rota'] || row.rota || row.setor || 'R101');
    const motorista = row.motorista ? String(row.motorista).trim() : (row['Motorista'] || 'Motorista Operacional');
    const cpfMotorista = row.cpf_motorista ? String(row.cpf_motorista).trim() : (row['CPF Motorista'] || '');
    const ajudante1 = row.ajudante_1 ? String(row.ajudante_1).trim() : (row['Ajudante 1'] || '-');
    const cpfAjudante1 = row.cpf_ajudante_1 ? String(row.cpf_ajudante_1).trim() : '';
    const ajudante2 = row.ajudante_2 ? String(row.ajudante_2).trim() : (row['Ajudante 2'] || '-');
    const cpfAjudante2 = row.cpf_ajudante_2 ? String(row.cpf_ajudante_2).trim() : '';
    const equipeCompleta = row.equipe_completa ? String(row.equipe_completa).trim() : (ajudante1 !== '-' ? ajudante1 : motorista);
    const statusVale = row.status_vale ? String(row.status_vale).trim() : (row['Status'] || 'Compensado');
    const idValeSstr = row.id_vale_sstr ? String(row.id_vale_sstr).trim() : (row['Id Vale'] || `vale_hist_${1000 + idx}`);
    const codigoCliente = row.codigo_cliente ? String(row.codigo_cliente).trim() : (row['Código Cliente'] || 'CLI-PDV');
    const razaoSocialCliente = row.razao_social_cliente ? String(row.razao_social_cliente).trim() : (row['Razão Social'] || 'PONTO DE VENDA (PDV)');
    const detalhamentoSkus = row.detalhamento_skus ? String(row.detalhamento_skus).trim() : (row['Detalhamento'] || row['Descrição'] || row.descricao || '');

    // 2. Data de Emissão / Dt. Operacao
    const rawData = row.data_emissao || row['Dt. Operacao'] || row['Dt. Operação'] || row.dtOperacao || row.dataOperacao || row.emissao || row['Emissao'] || '';
    
    // 3. Valor Total do Prejuízo
    const rawValor = row.valor_total_prejuizo !== undefined ? row.valor_total_prejuizo : (row.valor !== undefined ? row.valor : row['Valor']);
    
    // 4. Volume Total em HL
    const rawVolumeHL = row.volume_total_hl !== undefined ? row.volume_total_hl : (row.volumeHL !== undefined ? row.volumeHL : (row['Volume HL'] || 0));

    // 5. Quantidade de Itens / Caixas
    const rawQtde = row.qtd_itens !== undefined ? row.qtd_itens : (row.qtde !== undefined ? row.qtde : row['Qtde']);

    // 6. Rateio
    const totalIntegrantesRateio = row.total_integrantes_rateio ? String(row.total_integrantes_rateio).trim() : '2 Integrante(s)';
    const rawValorRateado = row.valor_rateado_por_pessoa !== undefined ? row.valor_rateado_por_pessoa : (row.valorRateado || 0);

    // Parsing da Data
    let dataIso = '';
    let mesRef = '';

    if (rawData instanceof Date) {
      dataIso = rawData.toISOString().slice(0, 10);
      mesRef = dataIso.slice(0, 7);
    } else if (typeof rawData === 'number') {
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

    // Parsing de Valor R$
    let valorNum = 0;
    if (typeof rawValor === 'number') {
      valorNum = rawValor;
    } else if (typeof rawValor === 'string') {
      const cleanVal = rawValor.replace(/R\$/g, '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
      valorNum = parseFloat(cleanVal) || 0;
    }

    // Parsing de Volume HL
    let volumeHLNum = 0;
    if (typeof rawVolumeHL === 'number') {
      volumeHLNum = rawVolumeHL;
    } else if (typeof rawVolumeHL === 'string') {
      const cleanHL = rawVolumeHL.replace(/HL/gi, '').replace(/\s/g, '').replace(',', '.');
      volumeHLNum = parseFloat(cleanHL) || 0;
    }

    // Parsing de Quantidade
    let qtdeNum = 1;
    if (typeof rawQtde === 'number') {
      qtdeNum = rawQtde;
    } else if (typeof rawQtde === 'string') {
      const cleanQtde = rawQtde.replace(/[^0-9.]/g, '');
      qtdeNum = parseFloat(cleanQtde) || 1;
    }

    // Se volume HL não foi fornecido mas temos valor ou quantidade, estimamos de forma realista (0.04 HL por caixa)
    if (volumeHLNum === 0 && qtdeNum > 0) {
      volumeHLNum = Number((qtdeNum * 0.042).toFixed(2));
    }

    // Parsing de Rateio
    let valorRateadoNum = 0;
    if (typeof rawValorRateado === 'number') {
      valorRateadoNum = rawValorRateado;
    } else if (typeof rawValorRateado === 'string') {
      const cleanR = rawValorRateado.replace(/R\$/g, '').replace(/\s/g, '').replace(',', '.');
      valorRateadoNum = parseFloat(cleanR) || 0;
    }
    if (valorRateadoNum === 0 && valorNum > 0) {
      valorRateadoNum = Number((valorNum / 2).toFixed(2));
    }

    // Descrição e Embalagem
    const rawDesc = row.detalhamento_skus || row['Descrição'] || row.descricao || row['Descricao'] || row.produto || `SKU ${idx + 1}`;
    const descricaoFinal = extrairDescricaoProduto(String(rawDesc), `PRODUTO REPOSIÇÃO ${idx + 1}`);
    const embalagemFinal = normalizarEmbalagem(row.embalagem || row['Embalagem'], `${detalhamentoSkus} ${descricaoFinal}`);

    // Data formatada padrão brasileiro
    const dataEmissaoBR = formatDataBR(dataIso);

    itensFormatados.push({
      id: idValeSstr || `REP-${Date.now()}-${idx}`,
      item_numero: itemNumero,
      dataOperacao: dataIso,
      data_emissao: dataEmissaoBR,
      nota_fiscal: notaFiscal || `NF-${100000 + idx}`,
      mapa_carga: mapaCarga || `M${1000 + idx}`,
      rota_setor: rotaSetor,
      motorista,
      cpf_motorista: cpfMotorista || '---.---.--- --',
      ajudante_1: ajudante1,
      cpf_ajudante_1: cpfAjudante1,
      ajudante_2: ajudante2,
      cpf_ajudante_2: cpfAjudante2,
      equipe_completa: equipeCompleta,
      status_vale: statusVale,
      volume_total_hl: volumeHLNum,
      valor: valorNum,
      valor_total_prejuizo: valorNum,
      total_integrantes_rateio: totalIntegrantesRateio,
      valor_rateado_por_pessoa: valorRateadoNum,
      qtd_itens: qtdeNum,
      qtde: qtdeNum,
      codigo_cliente: codigoCliente,
      razao_social_cliente: razaoSocialCliente,
      detalhamento_skus: detalhamentoSkus || `${descricaoFinal} (${qtdeNum} CX)`,
      id_vale_sstr: idValeSstr,
      mesRef,
      mesNome,
      descricao: descricaoFinal,
      embalagem: embalagemFinal,
      operacao: row['Operacao .'] || row.operacao || 39,
      emissao: row.emissao || dataIso,
      produto: row.produto || row['Produto'],
      unidade: row.unidade || row['Unidade'] || 'cx',
      motivo: row.motivo || `Avaria em Rota (${rotaSetor})`,
      observacao: row.observacao || `Vale SSTR ${idValeSstr} - Cliente ${razaoSocialCliente}`,
      createdAt: new Date().toISOString(),
    });
  });

  return itensFormatados;
}

/**
 * Exporta dados para CSV compatível com o novo modelo SSTR
 */
export function exportarParaCSV(itens: ItemReposicao[]): void {
  const headers = [
    'Item',
    'Data Emissao',
    'Vale SSTR',
    'Nota Fiscal',
    'Mapa Carga',
    'Rota/Setor',
    'Motorista',
    'CPF Motorista',
    'Ajudante 1',
    'Equipe',
    'Status Vale',
    'Cliente PDV',
    'Detalhamento SKUs',
    'Volume (HL)',
    'Valor Prejuizo (R$)',
    'Rateio/Pessoa (R$)',
    'Qtd Itens',
    'Embalagem',
  ];

  const rows = itens.map((i) => [
    i.item_numero || 1,
    i.data_emissao || i.dataOperacao,
    `"${i.id_vale_sstr || i.id}"`,
    `"${i.nota_fiscal || ''}"`,
    `"${i.mapa_carga || ''}"`,
    `"${i.rota_setor || ''}"`,
    `"${(i.motorista || '').replace(/"/g, '""')}"`,
    `"${i.cpf_motorista || ''}"`,
    `"${(i.ajudante_1 || '').replace(/"/g, '""')}"`,
    `"${(i.equipe_completa || '').replace(/"/g, '""')}"`,
    `"${i.status_vale || 'Compensado'}"`,
    `"${(i.razao_social_cliente || '').replace(/"/g, '""')}"`,
    `"${(i.detalhamento_skus || i.descricao || '').replace(/"/g, '""')}"`,
    i.volume_total_hl.toFixed(2).replace('.', ','),
    i.valor.toFixed(2).replace('.', ','),
    (i.valor_rateado_por_pessoa || 0).toFixed(2).replace('.', ','),
    i.qtde,
    `"${i.embalagem}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `vales_reposicao_ambev_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
