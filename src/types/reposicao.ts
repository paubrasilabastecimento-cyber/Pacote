export interface ItemReposicao {
  id: string;
  item_numero?: number;
  dataOperacao: string; // YYYY-MM-DD
  data_emissao?: string; // DD/MM/YYYY ou YYYY-MM-DD
  nota_fiscal?: string;
  mapa_carga?: string;
  rota_setor?: string;
  motorista?: string;
  cpf_motorista?: string;
  ajudante_1?: string;
  cpf_ajudante_1?: string;
  ajudante_2?: string;
  cpf_ajudante_2?: string;
  equipe_completa?: string;
  status_vale?: string; // "Compensado", "Pendente", "Em Aberto", "Faturado", "Descontado"
  volume_total_hl: number; // Volume em HL
  valor: number; // Valor total do prejuízo em R$ (valor_total_prejuizo)
  valor_total_prejuizo?: number;
  total_integrantes_rateio?: string;
  valor_rateado_por_pessoa?: number;
  qtde: number; // Quantidade de itens/caixas (qtd_itens)
  qtd_itens?: number;
  codigo_cliente?: string;
  razao_social_cliente?: string;
  detalhamento_skus?: string;
  id_vale_sstr?: string;
  
  // Metadados analíticos derivados
  mesRef: string; // YYYY-MM (ex: "2026-01")
  mesNome: string; // "Jan/2026"
  descricao: string; // Descrição do Produto extraída ou fornecida
  embalagem: string; // Tipo de Embalagem (Lata, Garrafa Inteira, Litrão, Long Neck, PET, Outros)
  marca?: string; // Marca (Skol, Brahma, Antarctica, etc.)
  operacao?: number | string;
  emissao?: string;
  produto?: number | string;
  unidade?: string;
  motivo?: string;
  observacao?: string;
  createdAt: string;
}

export interface ItemReposicaoJSON {
  item_numero?: number;
  data_emissao?: string;
  nota_fiscal?: string;
  mapa_carga?: string;
  rota_setor?: string;
  motorista?: string;
  cpf_motorista?: string;
  ajudante_1?: string;
  cpf_ajudante_1?: string;
  ajudante_2?: string;
  cpf_ajudante_2?: string;
  equipe_completa?: string;
  status_vale?: string;
  volume_total_hl?: number;
  valor_total_prejuizo?: number;
  total_integrantes_rateio?: string;
  valor_rateado_por_pessoa?: number;
  qtd_itens?: number;
  codigo_cliente?: string;
  razao_social_cliente?: string;
  detalhamento_skus?: string;
  id_vale_sstr?: string;
  // Campos legados para compatibilidade
  'Operacao .'?: number | string;
  'Dt. Operacao'?: string;
  'Dt. Operação'?: string;
  'Emissao'?: string;
  'Produto'?: number | string;
  'Unidade'?: string;
  'Descrição'?: string;
  'Descricao'?: string;
  'Qtde'?: number;
  'Valor'?: number;
  'Embalagem'?: string;
}

export interface ResumoReposicaoKPI {
  valorTotal: number;
  volumeTotalHL: number;
  totalLancamentos: number;
  quantidadeTotal: number;
  ticketMedioLancamento: number;
  ticketMedioUnidade: number;
  mediaRateioPessoa: number;
  totalCompensadoR$: number;
  totalPendenteR$: number;
}

export interface FiltroReposicao {
  mes: string;
  embalagem: string;
  rota: string;
  statusVale: string;
  motorista: string;
  busca: string;
  ordenacao: 'valor-desc' | 'valor-asc' | 'volume-desc' | 'qtde-desc' | 'data-desc' | 'data-asc';
}

export interface EmbalagemResumo {
  embalagem: string;
  valorTotal: number;
  volumeHL: number;
  qtdeTotal: number;
  totalLancamentos: number;
  percentual: number;
}

export interface MesResumo {
  mesRef: string;
  mesNome: string;
  valorTotal: number;
  volumeHL: number;
  qtdeTotal: number;
  totalLancamentos: number;
  isPico?: boolean;
}

export interface ProdutoResumo {
  ranking: number;
  descricao: string;
  embalagem: string;
  valorTotal: number;
  volumeHL: number;
  qtdeTotal: number;
  percentual: number;
}

export interface RotaResumo {
  rota: string;
  valorTotal: number;
  volumeHL: number;
  totalLancamentos: number;
  percentual: number;
}

export interface StatusValeResumo {
  status: string;
  valorTotal: number;
  totalLancamentos: number;
  percentual: number;
}

export interface MotoristaResumo {
  motorista: string;
  valorTotal: number;
  volumeHL: number;
  totalLancamentos: number;
  valorRateado: number;
}
