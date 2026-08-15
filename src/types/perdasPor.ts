export interface PerdaItemJSON {
  dataOperacao: string; // YYYY-MM-DD
  emissao: string; // YYYY-MM-DD
  produto: number; // SKU code
  unidade: string; // ex: "cx", "un"
  descricao: string; // clean text description
  qtde: number; // loss quantity
  valor: number; // loss amount in R$
  embalagem: string; // ex: "LONG NECK", "LATA", "PET", "RGB", "PACOTE"
}

export interface MesPerdaSummary {
  mesKey: string; // "2026-01"
  mesNome: string; // "Jan/2026"
  mesNomeCurto: string; // "Jan"
  valorTotal: number;
  qtdeTotal: number;
  registros: number;
  isCritico?: boolean;
}

export interface ProdutoPerdaSummary {
  produtoId: number;
  descricao: string;
  embalagem: string;
  valorTotal: number;
  qtdeTotal: number;
  registros: number;
  percentualTotal: number;
  ticketMedioPorUnidade: number;
}

export interface EmbalagemPerdaSummary {
  embalagem: string;
  valorTotal: number;
  qtdeTotal: number;
  registros: number;
  percentualValor: number;
  percentualQtde: number;
  corHex: string;
}

export interface PerdasPorStats {
  valorTotal: number;
  qtdeTotal: number;
  totalRegistros: number;
  mesCritico: {
    mesKey: string;
    mesNome: string;
    valor: number;
    qtde: number;
    percentualDoTotal: number;
  };
  embalagemTop: {
    nome: string;
    valor: number;
    percentual: number;
  };
  produtoTop: {
    descricao: string;
    valor: number;
    percentual: number;
  };
  ticketMedioItem: number;
}
