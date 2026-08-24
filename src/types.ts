export type Turno = '1º Turno' | '2º Turno' | '3º Turno' | 'ADM';

export type Area =
  | 'Armazém'
  | 'Rota / Entrega'
  | 'Envase'
  | 'Pátio'
  | 'Recebimento'
  | 'Carregamento';

export type MotivoPerda = string;

export interface ProdutoSKU {
  id: string;
  nome: string;
  categoria: 'Cerveja RGB' | 'Cerveja One-Way' | 'Lata' | 'Refrigerante' | 'Chopp';
  volumeHLPerUnit: number; // HL por caixa/unidade
  custoPorHL: number; // R$ por HL
}

export interface RegistroPerda {
  id: string;
  data: string; // YYYY-MM-DD
  dataHora?: string; // Full date + time (e.g. "2026-01-01 11:59:15")
  mesRef: string; // YYYY-MM
  mesNome?: string; // e.g. "JANEIRO"
  turno: Turno | string;
  area: Area | string;
  codProduto?: number | string; // e.g. 21020
  descricaoProduto?: string; // e.g. "BUDWEISER 350ML"
  produto: string; // e.g. "21020 - BUDWEISER 350ML" or "BUDWEISER 350ML"
  quantidade: number;
  codQuebra?: number | string; // e.g. 524
  codigoMotivo: string; // e.g. "Q-524" or "524"
  motivo: MotivoPerda; // e.g. "FALTA NO PALETE"
  colaborador?: string; // e.g. "RONILDO"
  funcao?: string; // e.g. "EMPILHADOR"
  responsavel: string; // e.g. "RONILDO (EMPILHADOR)" or "RONILDO"
  valorR$: number; // e.g. 2.648683333333333
  hectoLitro?: number; // e.g. 0.0035 (HL unitário)
  hlPerdido: number; // e.g. 0.0035 (HL total perdido)
  causa: string;
  observacao: string;
  createdAt: string;
  rawData?: Record<string, any>; // Complete original object preserving any extra fields
}

export type StatusPlanoAcao = 'Não iniciado' | 'Em andamento' | 'Concluído' | 'Atrasado';

export interface PlanoAcao {
  id: string;
  problema: string;
  causa: string;
  acao: string;
  responsavel: string;
  dataCriacao: string;
  prazo: string;
  status: StatusPlanoAcao;
  resultadoEsperado: string;
  resultadoAlcancado?: string;
  evidencia?: string;
  observacao?: string;
  mesRef: string;
  area?: Area;
  motivoRelacionado?: MotivoPerda;
}

export interface KPIStats {
  id?: string;
  mes: string;
  wqiMeta: number; // ex: 98.5%
  wqiAtual: number;
  wqiAnterior: number;
  fgliMeta: number; // ex: 110 HL
  fgliAtual: number;
  fgliAnterior: number;
  sclMeta: number; // ex: 45000 R$
  sclAtual: number;
  sclAnterior: number;
  rsHlMeta: number; // ex: 0.85 R$/HL
  rsHlAtual: number;
  rsHlAnterior: number;
  vlcHlMeta: number; // ex: 1.20 R$/HL
  vlcHlAtual: number;
  vlcHlAnterior: number;
  totalHLExpedido: number;
}

export interface ComentarioRevisao {
  id: string;
  mesRef: string;
  autor: string;
  cargo: string;
  data: string;
  texto: string;
  tipo: 'Análise de Desvio' | 'Diagnóstico Operacional' | 'Direcionamento Estratégico';
}

export interface FiltroGlobal {
  dataInicio: string;
  dataFim: string;
  mes: string;
  area: string;
  turno: string;
  produto: string;
  motivo: string;
  responsavel: string;
}

export interface RegistroTrocaImproprio {
  id: string;
  data: string;
  mesRef: string;
  pdv?: string;
  canal: string;
  produto: string;
  codProduto?: number | string;
  categoria?: string;
  quantidade: number;
  unidade: string;
  hlTrocado: number;
  valorR$: number;
  motivoImproprio: string;
  lote?: string;
  fabricante?: string;
  destino: string;
  responsavel: string;
  observacao?: string;
  createdAt: string;
}

export type MenuItemId =
  | 'dashboard-geral'
  | 'dashboard'
  | 'reposicao'
  | 'perdas-por'
  | 'consumo-interno'
  | 'troca-improprio'
  | 'arvore-decomposicao'
  | 'registrar'
  | 'analise'
  | 'scl'
  | 'plano-acao'
  | 'revisao'
  | 'historico';

export * from './types/consumoInterno';
export * from './types/reposicao';
export * from './types/vales';

