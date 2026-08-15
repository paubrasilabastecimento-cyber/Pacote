export interface ValePrejuizoItem {
  id: string;
  itemNo?: number | string;
  dataEmissao: string;
  mesRef?: string;
  notaFiscal: string;
  mapaCarga: string;
  rotaSetor: string;
  motorista: string;
  cpfMotorista?: string;
  ajudante1?: string;
  cpfAjudante1?: string;
  ajudante2?: string;
  cpfAjudante2?: string;
  equipeCompleta: string; // "Sem Ajudantes" ou lista de nomes
  statusVale?: string; // "Emitido", "Em Análise", "Descontado", "Pendente", etc.
  volumeHL: number;
  valorTotalPrejuizo: number;
  totalIntegrantes: number; // 1, 2, 3
  valorRateadoPorPessoa: number;
  qtdItens: number;
  codigoCliente?: string; // NB
  razaoSocialCliente?: string;
  detalhamentoSKUs: string; // Ex: "SKOL LATA 350ML (12 un) | BRAHMA DUPLO MALTE (6 un)"
  motivoResumido?: string;
  rawData?: Record<string, any>;
}

export interface ResumoGeralVales {
  totalVales: number;
  prejuizoTotal: number;
  volumeTotalHL: number;
  mediaPrejuizoPorVale: number;
  totalIntegrantesImpactados: number;
  valesSemAjudantesQtd: number;
  valesSemAjudantesValor: number;
}

export interface PrejuizoPorRota {
  rota: string;
  totalPrejuizo: number;
  totalVales: number;
  volumeHL: number;
  percentual: number;
  mediaPorVale: number;
  motoristasPrincipais: string[];
}

export interface PrejuizoPorMotorista {
  motorista: string;
  cpf?: string;
  totalVales: number;
  prejuizoTotal: number; // soma dos vales onde é motorista
  valorRateadoAssumido: number; // o que ele arcou individualmente
  valesSemAjudante: number; // qtd de vezes que assumiu 100%
  valorSemAjudante: number;
  rotasPrincipais: string[];
}

export interface RateioPorPessoa {
  nome: string;
  cpf?: string;
  papelPrincipal: 'Motorista' | 'Ajudante' | 'Misto';
  totalValesParticipados: number;
  valorRateadoTotal: number;
  valesComoMotorista: number;
  valesComoAjudante: number;
  valesSemAjudantes: number; // Vales onde estava sozinho e assumiu 100%
  valorSemAjudantesTotal: number;
}

export interface PrejuizoPorComposicao {
  composicao: '1 Integrante (Sem Ajudantes)' | '2 Integrantes (1 Mot + 1 Ajud)' | '3 Integrantes (1 Mot + 2 Ajud)' | 'Outros';
  integrantes: number;
  totalVales: number;
  prejuizoTotal: number;
  volumeHL: number;
  mediaPorVale: number;
  percentual: number;
}

export interface PrejuizoPorSKU {
  sku: string;
  codigo?: string;
  ocorrencias: number;
  prejuizoEstimado: number;
  qtdEstimada: number;
  percentual: number;
}

export interface AlertaPadrao {
  id: string;
  tipo: 'critico' | 'atencao' | 'informativo';
  titulo: string;
  descricao: string;
  impactoR$: number;
  recorrencia?: number;
}

export interface AnaliseCompletaVales {
  resumo: ResumoGeralVales;
  rankingRotas: PrejuizoPorRota[];
  rankingMotoristas: PrejuizoPorMotorista[];
  rateioPessoas: RateioPorPessoa[];
  composicaoEquipes: PrejuizoPorComposicao[];
  rankingSKUs: PrejuizoPorSKU[];
  top5Vales: ValePrejuizoItem[];
  alertas: AlertaPadrao[];
  textoConclusao: string[];
}
