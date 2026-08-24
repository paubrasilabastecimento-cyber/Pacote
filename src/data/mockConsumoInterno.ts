import { ConsumoInternoItem, ConsumoInternoJSONItem } from '../types/consumoInterno';
import { classificarCategoriaProduto } from '../utils/consumoClassifier';
import { parseDateToISO, formatDateBR } from '../utils/formatters';
import rawJsonData from './consumo_interno.json';

export const DEMO_EMPRESA_ID = 'empresa-01';

// Export raw JSON items adhering strictly to user schema
export const DEFAULT_CONSUMO_JSON_ITEMS: ConsumoInternoJSONItem[] = rawJsonData as ConsumoInternoJSONItem[];

/**
 * Transforms JSON items adhering to the exact model:
 * {
 *   "operacao": 102,
 *   "data_operacao": "08/01/2026",
 *   "data_emissao": "08/01/2026",
 *   "status": "A",
 *   "produto": 18836,
 *   "unidade": "cx",
 *   "descricao": "CORONA EXTRA N LONG N",
 *   "quantidade": 1,
 *   "valor": 118.01,
 *   "embalagem": "LONG NECK"
 * }
 * into full ConsumoInternoItem objects for the application state.
 */
export function mapJsonToConsumoInternoItems(
  items: ConsumoInternoJSONItem[],
  empresaId: string = DEMO_EMPRESA_ID
): ConsumoInternoItem[] {
  return items.map((item, index) => {
    const sku = Number(item.produto ?? (item as any).produtoId ?? 0);
    const rawDataOp = item.data_operacao || item.dataOperacao || (item as any).dtOperacao || '08/01/2026';
    const rawDataEm = item.data_emissao || (item as any).dataEmissao || item.emissao || rawDataOp;
    
    const dtOperacaoISO = parseDateToISO(rawDataOp);
    const dataEmissaoISO = parseDateToISO(rawDataEm);
    const dataOperacaoBR = formatDateBR(dtOperacaoISO);
    const dataEmissaoBR = formatDateBR(dataEmissaoISO);

    const totalVal = Number(item.valor ?? (item as any).total ?? 0);
    const qtde = Number(item.quantidade ?? item.qtde ?? (item as any).qtd ?? 1);
    const desc = item.descricao || 'PRODUTO CONSUMO INTERNO';
    const categoria = classificarCategoriaProduto(desc, sku);

    return {
      id: `CI-2026-${String(index + 1).padStart(4, '0')}`,
      empresaId,
      operacao: Number(item.operacao || 100 + index),
      dtOperacao: dtOperacaoISO,
      dataOperacao: dtOperacaoISO,
      data_operacao: dataOperacaoBR,
      emissao: dataEmissaoISO,
      data_emissao: dataEmissaoBR,
      status: item.status || 'A',
      produtoId: sku,
      produto: sku,
      unidade: item.unidade || 'cx',
      descricao: desc,
      quantidade: qtde,
      qtde,
      total: Number(totalVal.toFixed(2)),
      valor: Number(totalVal.toFixed(2)),
      embalagem: item.embalagem || 'LONG NECK',
      categoria,
      solicitante: 'Logística / Doca Ambev',
      centroCusto: 'CC-7102 Logística Operacional',
      observacao: 'Requisição interna autorizada',
      createdAt: `${dtOperacaoISO} 09:30:00`,
    };
  });
}

export const DEMO_CONSUMO_INTERNO_LIST: ConsumoInternoItem[] = mapJsonToConsumoInternoItems(
  DEFAULT_CONSUMO_JSON_ITEMS,
  DEMO_EMPRESA_ID
);

