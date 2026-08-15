export type CategoriaConsumo =
  | 'Cerveja'
  | 'Refrigerante'
  | 'Energético'
  | 'Isotônico/Suco'
  | 'Água'
  | 'Snack'
  | 'Outros';

/**
 * Exact JSON format schema specified for Consumo Interno:
 * {
 *   "operacao": 102,
 *   "dataOperacao": "2026-01-08",
 *   "emissao": "2026-01-08",
 *   "status": "A",
 *   "produto": 18836,
 *   "unidade": "cx",
 *   "descricao": "CORONA EXTRA N LONG N",
 *   "qtde": 1,
 *   "valor": 118.01,
 *   "embalagem": "LONG NECK"
 * }
 */
export interface ConsumoInternoJSONItem {
  operacao: number;
  dataOperacao: string;
  emissao: string;
  status: string;
  produto: number;
  unidade: string;
  descricao: string;
  qtde: number;
  valor: number;
  embalagem: string;
}

export interface ConsumoInternoItem {
  id: string;
  empresaId: string;
  operacao: number; // ex: 102
  dtOperacao: string; // YYYY-MM-DD (ex: "2026-01-08")
  dataOperacao?: string; // alias para compatibilidade com o JSON exato
  emissao: string; // YYYY-MM-DD (ex: "2026-01-08")
  status: string; // ex: "A" (Aprovado / Ativo)
  produtoId: number; // SKU code, ex: 18836
  produto?: number; // alias para compatibilidade com o JSON exato
  unidade: string; // ex: "cx", "un", "lt", "gf", "barril"
  descricao: string; // ex: "CORONA EXTRA N LONG N"
  qtde: number; // ex: 1
  total: number; // valor total em R$, ex: 118.01
  valor?: number; // alias para compatibilidade com o JSON exato
  embalagem: string; // ex: "LONG NECK", "LATA", "PET", "RGB"
  categoria: CategoriaConsumo;
  solicitante?: string;
  centroCusto?: string;
  observacao?: string;
  createdAt?: string;
}

export interface ConsumoInternoInput {
  operacao: number;
  dtOperacao: string;
  dataOperacao?: string;
  emissao: string;
  status: string;
  produtoId: number;
  produto?: number;
  unidade: string;
  descricao: string;
  qtde: number;
  total: number;
  valor?: number;
  embalagem?: string;
  categoria?: CategoriaConsumo;
  solicitante?: string;
  centroCusto?: string;
  observacao?: string;
}

export interface ConsumoMetrics {
  totalGasto: number;
  unidadesTotais: number;
  numRegistros: number;
  ticketMedioOperacao: number;
  numOperacoes: number;
}

