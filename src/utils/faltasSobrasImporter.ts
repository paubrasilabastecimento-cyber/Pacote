import { InventarioFaltasSobrasData, ItemFaltaSobra, GrupoImpacto } from '../data/mockFaltasSobras';

/**
 * Interface do item no formato bruto de importação Ambev (Faltas e Sobras juntas)
 */
export interface RawFaltaSobraItem {
  numero_item?: number;
  promax?: number | string;
  material?: number | string;
  produto: string;
  grupo?: string;
  unidade?: string;
  disponivel?: number;
  consignado?: number;
  transito?: number;
  fisico?: number;
  diferenca?: number;
  preco_medio?: number;
  valor_estoque?: number;
  valor_justificado?: number;
  valor_diferenca?: number;
  percentual_diferenca?: number;
  status?: string; // 'Falta', 'Sobra', 'OK', etc.
  [key: string]: any;
}

/**
 * Converte uma lista de itens brutos (ou JSON completo) no formato padrão `InventarioFaltasSobrasData`
 */
export function processarImportacaoFaltasSobras(
  input: any,
  options?: { periodo?: string; unidade?: string }
): InventarioFaltasSobrasData {
  let rawList: any[] = [];
  let periodo = options?.periodo || 'MARÇO 2026';
  let unidade = options?.unidade || 'CDD AMBEV — UNIDADE 539';

  // Se o input já for o objeto consolidado com a chave `top_faltas` ou `itens`
  if (input && typeof input === 'object' && !Array.isArray(input)) {
    if (input.periodo) periodo = input.periodo;
    if (input.unidade) unidade = input.unidade;

    if (Array.isArray(input.itens)) {
      rawList = input.itens;
    } else if (Array.isArray(input.data)) {
      rawList = input.data;
    } else if (Array.isArray(input.produtos)) {
      rawList = input.produtos;
    } else if (Array.isArray(input.top_faltas) || Array.isArray(input.top_sobras)) {
      // Já está no formato final consolidado
      return {
        periodo: input.periodo || periodo,
        unidade: input.unidade || unidade,
        total_estoque: Number(input.total_estoque || 0),
        total_diferenca: Number(input.total_diferenca || 0),
        total_itens: Number(input.total_itens || (input.top_faltas?.length || 0) + (input.top_sobras?.length || 0)),
        itens_falta: Number(input.itens_falta || input.top_faltas?.length || 0),
        itens_sobra: Number(input.itens_sobra || input.top_sobras?.length || 0),
        itens_ok: Number(input.itens_ok || 0),
        valor_falta: Number(input.valor_falta || 0),
        valor_sobra: Number(input.valor_sobra || 0),
        top_faltas: input.top_faltas || [],
        top_sobras: input.top_sobras || [],
        grupos: input.grupos || [],
      };
    }
  } else if (Array.isArray(input)) {
    rawList = input;
  }

  if (!rawList || rawList.length === 0) {
    throw new Error('Nenhum item válido encontrado para importação de Faltas & Sobras.');
  }

  let totalEstoque = 0;
  let totalDiferenca = 0;
  let valorFalta = 0;
  let valorSobra = 0;
  let itensFalta = 0;
  let itensSobra = 0;
  let itensOk = 0;

  const faltasFormatadas: ItemFaltaSobra[] = [];
  const sobrasFormatadas: ItemFaltaSobra[] = [];
  const gruposMap: Record<string, { valor_diferenca: number; valor_estoque: number; itens: number }> = {};

  rawList.forEach((raw) => {
    const nomeProduto = String(raw.produto || raw.descricao || raw.nome || 'PRODUTO NÃO IDENTIFICADO').trim();
    const grupo = String(raw.grupo || raw.categoria || 'DIVERSOS').trim().toUpperCase();
    const fisico = Number(raw.fisico ?? raw.qtd_fisica ?? 0);
    const disponivel = Number(raw.disponivel ?? raw.qtd_disponivel ?? 0);
    
    // Diferença de quantidade: fisico - disponivel
    let diferencaQtd = Number(raw.diferenca ?? raw.diferenca_qtd ?? (fisico - disponivel));
    let valorEstoque = Number(raw.valor_estoque ?? 0);
    let valorDiferenca = Number(raw.valor_diferenca ?? 0);
    let precoMedio = Number(raw.preco_medio ?? 0);

    // Se valorEstoque não veio, calcula com preço médio se disponível
    if (valorEstoque === 0 && precoMedio > 0) {
      valorEstoque = disponivel * precoMedio;
    }

    // Se valorDiferenca não veio, calcula com precoMedio * diferencaQtd
    if (valorDiferenca === 0 && precoMedio > 0 && diferencaQtd !== 0) {
      valorDiferenca = diferencaQtd * precoMedio;
    }

    // Percentual da diferença
    let pctDiferenca = Number(raw.percentual_diferenca ?? raw.pct_diferenca ?? 0);
    if (pctDiferenca === 0 && disponivel > 0) {
      pctDiferenca = (diferencaQtd / disponivel) * 100;
    } else if (Math.abs(pctDiferenca) <= 1 && pctDiferenca !== 0) {
      // Se veio em formato decimal (ex: -0.807), converte para percentual (-80.7%)
      pctDiferenca = pctDiferenca * 100;
    }

    // Identificação de status e apuração de grandezas
    const rawStatus = String(raw.status || '').toLowerCase().trim();
    let tipo: 'sobra' | 'falta' | 'ok' = 'ok';

    if (rawStatus.includes('sobra')) {
      tipo = 'sobra';
    } else if (rawStatus.includes('falta')) {
      tipo = 'falta';
    } else if (rawStatus.includes('ok') || rawStatus.includes('correto') || rawStatus.includes('regular')) {
      tipo = 'ok';
    } else {
      // Se não veio status explícito, calcula pela relação Físico vs Disponível
      const diffFisicoDisponivel = fisico - disponivel;
      if (diffFisicoDisponivel > 0.001) {
        tipo = 'sobra';
      } else if (diffFisicoDisponivel < -0.001) {
        tipo = 'falta';
      } else {
        tipo = 'ok';
      }
    }

    // Normalização de sinais e valores para o Dashboard
    let valorItemDiferenca = 0;
    let qtdItemDiferenca = 0;
    let pctItemDiferenca = 0;

    if (tipo === 'sobra') {
      // Sobra: Físico > Disponível (Excedente positivo)
      const absQtd = (fisico > 0 || disponivel > 0)
        ? Math.abs(fisico - disponivel)
        : Math.abs(diferencaQtd);
      const absValor = valorDiferenca !== 0
        ? Math.abs(valorDiferenca)
        : (absQtd * precoMedio);
      const absPct = pctDiferenca !== 0
        ? Math.abs(pctDiferenca)
        : (disponivel > 0 ? (absQtd / disponivel) * 100 : 0);

      qtdItemDiferenca = Number(absQtd.toFixed(2));
      valorItemDiferenca = Number(absValor.toFixed(2));
      pctItemDiferenca = Number(absPct.toFixed(2));

      itensSobra++;
      valorSobra += valorItemDiferenca;
    } else if (tipo === 'falta') {
      // Falta: Físico < Disponível (Perda negativa)
      const absQtd = (fisico > 0 || disponivel > 0)
        ? Math.abs(disponivel - fisico)
        : Math.abs(diferencaQtd);
      const absValor = valorDiferenca !== 0
        ? Math.abs(valorDiferenca)
        : (absQtd * precoMedio);
      const absPct = pctDiferenca !== 0
        ? Math.abs(pctDiferenca)
        : (disponivel > 0 ? (absQtd / disponivel) * 100 : 0);

      qtdItemDiferenca = -Number(absQtd.toFixed(2));
      valorItemDiferenca = -Number(absValor.toFixed(2));
      pctItemDiferenca = -Number(absPct.toFixed(2));

      itensFalta++;
      valorFalta += valorItemDiferenca; // Fica negativo
    } else {
      // OK: Batimento 100%
      itensOk++;
    }

    // Formatar item para tabela do dashboard
    const itemFormatado: ItemFaltaSobra = {
      produto: nomeProduto,
      grupo: grupo,
      fisico: Number(fisico.toFixed(2)),
      disponivel: Number(disponivel.toFixed(2)),
      diferenca_qtd: qtdItemDiferenca,
      valor_diferenca: valorItemDiferenca,
      pct_diferenca: pctItemDiferenca,
      valor_estoque: Number(valorEstoque.toFixed(2)),
    };

    totalEstoque += valorEstoque;
    totalDiferenca += valorItemDiferenca;

    // Estatísticas por grupo
    if (!gruposMap[grupo]) {
      gruposMap[grupo] = { valor_diferenca: 0, valor_estoque: 0, itens: 0 };
    }
    gruposMap[grupo].valor_diferenca += valorItemDiferenca;
    gruposMap[grupo].valor_estoque += valorEstoque;
    gruposMap[grupo].itens += 1;

    if (tipo === 'falta') {
      faltasFormatadas.push(itemFormatado);
    } else if (tipo === 'sobra') {
      sobrasFormatadas.push(itemFormatado);
    }
  });

  // Ordenar faltas pelo maior prejuízo (mais negativo primeiro)
  faltasFormatadas.sort((a, b) => a.valor_diferenca - b.valor_diferenca);

  // Ordenar sobras pelo maior excedente (mais positivo primeiro)
  sobrasFormatadas.sort((a, b) => b.valor_diferenca - a.valor_diferenca);

  // Converter gruposMap em Array
  const grupos: GrupoImpacto[] = Object.keys(gruposMap).map((nomeGrupo) => ({
    grupo: nomeGrupo,
    valor_diferenca: Number(gruposMap[nomeGrupo].valor_diferenca.toFixed(2)),
    valor_estoque: Number(gruposMap[nomeGrupo].valor_estoque.toFixed(2)),
    itens: gruposMap[nomeGrupo].itens,
  }));

  // Ordenar grupos do maior impacto negativo para o maior positivo
  grupos.sort((a, b) => a.valor_diferenca - b.valor_diferenca);

  const totalItens = rawList.length;

  return {
    periodo,
    unidade,
    total_estoque: Number(totalEstoque.toFixed(2)),
    total_diferenca: Number(totalDiferenca.toFixed(2)),
    total_itens: totalItens,
    itens_falta: itensFalta,
    itens_sobra: itensSobra,
    itens_ok: itensOk,
    valor_falta: Number(valorFalta.toFixed(2)),
    valor_sobra: Number(valorSobra.toFixed(2)),
    top_faltas: faltasFormatadas,
    top_sobras: sobrasFormatadas,
    grupos,
  };
}

/**
 * Faz parse de texto JSON (array de objetos ou objeto consolidado)
 */
export function sanitizarEParsearFaltasSobrasJSON(rawJson: string): InventarioFaltasSobrasData {
  const parsed = JSON.parse(rawJson);
  return processarImportacaoFaltasSobras(parsed);
}
