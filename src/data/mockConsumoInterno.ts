import { ConsumoInternoItem, ConsumoInternoJSONItem } from '../types/consumoInterno';
import { classificarCategoriaProduto } from '../utils/consumoClassifier';
import rawJsonData from './consumo_interno.json';

export const DEMO_EMPRESA_ID = 'empresa-01';

// Export raw JSON items adhering strictly to user schema
export const DEFAULT_CONSUMO_JSON_ITEMS: ConsumoInternoJSONItem[] = rawJsonData as ConsumoInternoJSONItem[];

/**
 * Transforms JSON items ({ operacao, dataOperacao, emissao, status, produto, unidade, descricao, qtde, valor, embalagem })
 * into full ConsumoInternoItem objects for the application state.
 */
export function mapJsonToConsumoInternoItems(
  items: ConsumoInternoJSONItem[],
  empresaId: string = DEMO_EMPRESA_ID
): ConsumoInternoItem[] {
  return items.map((item, index) => {
    const categoria = classificarCategoriaProduto(item.descricao, item.produto);
    const dt = item.dataOperacao || (item as any).dtOperacao || '2026-01-08';
    const totalVal = Number(item.valor ?? (item as any).total ?? 0);
    const sku = Number(item.produto ?? (item as any).produtoId ?? 0);

    return {
      id: `CI-2026-${String(index + 1).padStart(4, '0')}`,
      empresaId,
      operacao: Number(item.operacao),
      dtOperacao: dt,
      dataOperacao: dt,
      emissao: item.emissao || dt,
      status: item.status || 'A',
      produtoId: sku,
      produto: sku,
      unidade: item.unidade || 'cx',
      descricao: item.descricao,
      qtde: Number(item.qtde || 1),
      total: Number(totalVal.toFixed(2)),
      valor: Number(totalVal.toFixed(2)),
      embalagem: item.embalagem || 'LONG NECK',
      categoria,
      solicitante: 'Logística / Doca Ambev',
      centroCusto: 'CC-7102 Logística Operacional',
      observacao: 'Requisição interna autorizada',
      createdAt: `${dt} 09:30:00`,
    };
  });
}

export const DEMO_CONSUMO_INTERNO_LIST: ConsumoInternoItem[] = mapJsonToConsumoInternoItems(
  DEFAULT_CONSUMO_JSON_ITEMS,
  DEMO_EMPRESA_ID
);

