export interface ItemReposicao {
  id: string;
  dataOperacao: string; // YYYY-MM-DD ou formato de data Dt. Operacao
  mesRef: string;       // YYYY-MM (ex: "2026-03")
  mesNome: string;      // "Março/2026" ou "Março"
  descricao: string;    // Descrição do Produto
  valor: number;        // Valor reposto em R$
  qtde: number;         // Quantidade de unidades / caixas
  embalagem: string;    // Tipo de Embalagem (ex: "Lata", "Garrafa Inteira", "Litrão", etc.)
  operacao?: number | string; // Operação (ex: 39)
  emissao?: string;           // Data de emissão (ex: "2026-01-12")
  produto?: number | string;  // Código do produto (ex: 9068)
  unidade?: string;           // Unidade de medida (ex: "cx", "un")
  motivo?: string;      // Motivo opcional (ex: "Avaria de Rota", "Quebra Armazém")
  observacao?: string;  // Observação opcional
  createdAt: string;
}

export interface ResumoReposicaoKPI {
  valorTotal: number;
  totalLancamentos: number;
  quantidadeTotal: number;
  ticketMedioLancamento: number;
  ticketMedioUnidade: number;
}

export interface FiltroReposicao {
  mes: string;
  embalagem: string;
  busca: string;
  ordenacao: 'valor-desc' | 'valor-asc' | 'qtde-desc' | 'data-desc' | 'data-asc';
}

export interface EmbalagemResumo {
  embalagem: string;
  valorTotal: number;
  qtdeTotal: number;
  totalLancamentos: number;
  percentual: number;
}

export interface MesResumo {
  mesRef: string;
  mesNome: string;
  valorTotal: number;
  qtdeTotal: number;
  totalLancamentos: number;
  isPico?: boolean;
}

export interface ProdutoResumo {
  ranking: number;
  descricao: string;
  embalagem: string;
  valorTotal: number;
  qtdeTotal: number;
  percentual: number;
}
