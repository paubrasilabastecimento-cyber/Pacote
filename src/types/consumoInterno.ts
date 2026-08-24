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
 */
export interface ConsumoInternoJSONItem {
  operacao: number;
  data_operacao?: string; // ex: "08/01/2026"
  dataOperacao?: string;  // compatibilidade
  dtOperacao?: string;
  data_emissao?: string;  // ex: "08/01/2026"
  dataEmissao?: string;
  emissao?: string;
  status: string;         // ex: "A"
  produto: number;        // ex: 18836
  unidade: string;        // ex: "cx"
  descricao: string;      // ex: "CORONA EXTRA N LONG N"
  quantidade?: number;    // ex: 1
  qtde?: number;          // alias
  valor: number;          // ex: 118.01
  embalagem: string;      // ex: "LONG NECK"
}

export interface ConsumoInternoItem {
  id: string;
  empresaId: string;
  operacao: number; // ex: 102
  dtOperacao: string; // YYYY-MM-DD (ex: "2026-01-08")
  data_operacao?: string; // alias no formato "08/01/2026"
  dataOperacao?: string; // alias
  emissao: string; // YYYY-MM-DD
  data_emissao?: string; // alias
  status: string; // ex: "A" (Aprovado / Ativo)
  produtoId: number; // SKU code, ex: 18836
  produto?: number; // alias
  unidade: string; // ex: "cx", "un", "lt", "gf", "barril"
  descricao: string; // ex: "CORONA EXTRA N LONG N"
  quantidade?: number; // alias
  qtde: number; // ex: 1
  total: number; // valor total em R$, ex: 118.01
  valor?: number; // alias
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
  data_operacao?: string;
  dataOperacao?: string;
  emissao: string;
  data_emissao?: string;
  dataEmissao?: string;
  status: string;
  produtoId: number;
  produto?: number;
  unidade: string;
  descricao: string;
  quantidade?: number;
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

