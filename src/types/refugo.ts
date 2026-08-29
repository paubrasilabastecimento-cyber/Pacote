export type CategoriaRefugo = 'Garrafas de Vidro' | 'Garrafeiras Plásticas' | 'Paletes de Madeira' | 'Outros';

export interface RefugoItem {
  id: string;
  posicao: number;
  material: string;
  valor: number;
  categoria: CategoriaRefugo;
  calibre: string;
  tipoMaterial: string;
  cor: string;
  retornavel: boolean;
  unidadesEstimadas?: number;
  observacao?: string;
  dataCriacao?: string;
  // Campos calculados dinamicamente para estratificação
  classeABC?: 'A' | 'B' | 'C';
  percentual?: number;
  percentualAcumulado?: number;
}

export interface CategoriaEstratificacao {
  categoria: CategoriaRefugo;
  valor: number;
  count: number;
  percentual: number;
  color: string;
  iconName: string;
}

export interface CalibreEstratificacao {
  calibre: string;
  valor: number;
  count: number;
  percentual: number;
}

export interface CurvaABCSummary {
  classe: 'A' | 'B' | 'C';
  descricao: string;
  count: number;
  valor: number;
  percentual: number;
  itens: RefugoItem[];
  color: string;
}

export interface RefugoMetrics {
  totalValor: number;
  totalItens: number;
  mediaValorPorItem: number;
  topItem: {
    material: string;
    valor: number;
    percentual: number;
    categoria: string;
  };
  top3ConcentracaoValor: number;
  top3ConcentracaoPercent: number;
  porCategoria: CategoriaEstratificacao[];
  porCalibre: CalibreEstratificacao[];
  curvaABC: {
    classeA: CurvaABCSummary;
    classeB: CurvaABCSummary;
    classeC: CurvaABCSummary;
  };
}
