export interface QuebraMovimentacaoItem {
  id: string;
  data_hora: string; // e.g. "2026-01-01 11:59:15"
  data?: string;
  mes: string; // e.g. "JANEIRO", "FEVEREIRO", etc.
  codigo_produto: number | string; // e.g. 21020
  produto: string; // e.g. "BUDWEISER 350ML"
  quantidade: number; // e.g. 12
  setor: string; // e.g. "ARMAZEM", "PUXADA", etc.
  area?: string; // e.g. "ARMAZEM"
  turno: string; // e.g. "Manhã", "Tarde", "Noite"
  filial: number | string; // e.g. 524 ou 539
  cod_quebra?: number | string; // e.g. 524
  codigo_quebra?: number | string;
  motivo: string; // e.g. "FALTA NO PALETE", "QUEBRA COM MOVIMENTAÇÃO"
  funcionario: string; // e.g. "RONILDO"
  colaborador?: string; // e.g. "RONILDO"
  cargo: string; // e.g. "EMPILHADOR"
  funcao?: string; // e.g. "EMPILHADOR"
  valor: number; // e.g. 2.648683333333333
  valor_avaria?: number;
  hecto_litro?: number; // e.g. 0.0035
  hecto_perdido?: number; // e.g. 0.042
  percentual_1?: number; // e.g. 0.01
  percentual_2?: number; // e.g. 0.01
  observacao?: string;
  createdAt?: string;
  rawData?: Record<string, any>;
}

export interface QuebrasMovimentacaoMetrics {
  totalValor: number;
  totalQuantidade: number;
  totalHlPerdido: number;
  totalOcorrencias: number;
  ticketMedioValor: number;
  ticketMedioHl: number;
  topFuncionario: { nome: string; cargo: string; valor: number; qtd: number; hl: number } | null;
  topProduto: { codigo: string | number; nome: string; valor: number; qtd: number; hl: number } | null;
  topTurno: { turno: string; valor: number; qtd: number; hl: number } | null;
  topSetor: { setor: string; valor: number; qtd: number; hl: number } | null;
  topMotivo: { motivo: string; valor: number; qtd: number; hl: number } | null;
}

export interface QuebrasMovFiltros {
  busca: string;
  mes: string;
  turno: string;
  setor: string;
  cargo: string;
  funcionario: string;
  motivo: string;
  dataInicio: string;
  dataFim: string;
}
