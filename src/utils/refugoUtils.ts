import {
  RefugoItem,
  RefugoMetrics,
  CategoriaRefugo,
  CategoriaEstratificacao,
  CalibreEstratificacao,
  CurvaABCSummary,
} from '../types/refugo';
import { INITIAL_REFUGO_DATA } from '../data/mockRefugo';

export const REFUGO_STORAGE_KEY = 'ambev_refugo_estratificado_v1';

export const CATEGORIA_CORES: Record<string, string> = {
  'Garrafas de Vidro': '#06b6d4', // Cyan
  'Garrafeiras Plásticas': '#3b82f6', // Blue
  'Paletes de Madeira': '#f59e0b', // Amber
  'Outros': '#8b5cf6', // Violet
};

export const CATEGORIA_ICONS: Record<string, string> = {
  'Garrafas de Vidro': 'Wine',
  'Garrafeiras Plásticas': 'Package',
  'Paletes de Madeira': 'Box',
  'Outros': 'Layers',
};

/**
 * Obtém os dados de refugo salvos no LocalStorage ou retorna os iniciais
 */
export function getStoredRefugoData(): RefugoItem[] {
  if (typeof window === 'undefined') return INITIAL_REFUGO_DATA;
  try {
    const saved = localStorage.getItem(REFUGO_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Erro ao carregar dados de refugo do localStorage:', err);
  }
  return INITIAL_REFUGO_DATA;
}

/**
 * Salva os dados de refugo no LocalStorage
 */
export function saveRefugoData(items: RefugoItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(REFUGO_STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('Erro ao salvar dados de refugo:', err);
  }
}

/**
 * Formata moeda BRL
 */
export function formatBRL(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor || 0);
}

/**
 * Formata percentual com 1 ou 2 casas decimais
 */
export function formatPercent(valor: number, decimals: number = 1): string {
  return `${(valor || 0).toFixed(decimals).replace('.', ',')}%`;
}

/**
 * Processa a lista de itens, calculando posição, % individual, % acumulado e classificação ABC (80-15-5)
 */
export function processarItensRefugo(items: RefugoItem[]): RefugoItem[] {
  if (!items || items.length === 0) return [];

  // Ordenar decrescente por valor
  const ordenados = [...items].sort((a, b) => (b.valor || 0) - (a.valor || 0));
  const total = ordenados.reduce((acc, item) => acc + (Number(item.valor) || 0), 0);

  let acumulado = 0;

  return ordenados.map((item, index) => {
    const valor = Number(item.valor) || 0;
    const percentual = total > 0 ? (valor / total) * 100 : 0;
    acumulado += percentual;

    // Curva ABC: A (até 80%), B (80% a 95%), C (acima de 95%)
    let classeABC: 'A' | 'B' | 'C' = 'A';
    if (acumulado > 95.01) {
      classeABC = 'C';
    } else if (acumulado > 80.01) {
      classeABC = 'B';
    }

    return {
      ...item,
      posicao: index + 1,
      valor,
      percentual,
      percentualAcumulado: Math.min(acumulado, 100),
      classeABC,
    };
  });
}

/**
 * Calcula todas as métricas analíticas e estratificações
 */
export function calcularMetricasRefugo(rawItems: RefugoItem[]): RefugoMetrics {
  const items = processarItensRefugo(rawItems);
  const totalValor = items.reduce((acc, item) => acc + item.valor, 0);
  const totalItens = items.length;
  const mediaValorPorItem = totalItens > 0 ? totalValor / totalItens : 0;

  const topItem = items.length > 0
    ? {
        material: items[0].material,
        valor: items[0].valor,
        percentual: items[0].percentual || 0,
        categoria: items[0].categoria,
      }
    : { material: '-', valor: 0, percentual: 0, categoria: '-' };

  // Top 3 concentração
  const top3Itens = items.slice(0, 3);
  const top3ConcentracaoValor = top3Itens.reduce((acc, i) => acc + i.valor, 0);
  const top3ConcentracaoPercent = totalValor > 0 ? (top3ConcentracaoValor / totalValor) * 100 : 0;

  // 1. Estratificação por Categoria
  const catMap: Record<string, { valor: number; count: number }> = {};
  items.forEach((item) => {
    const cat = item.categoria || 'Outros';
    if (!catMap[cat]) {
      catMap[cat] = { valor: 0, count: 0 };
    }
    catMap[cat].valor += item.valor;
    catMap[cat].count += 1;
  });

  const porCategoria: CategoriaEstratificacao[] = Object.entries(catMap)
    .map(([cat, dados]) => ({
      categoria: cat as CategoriaRefugo,
      valor: dados.valor,
      count: dados.count,
      percentual: totalValor > 0 ? (dados.valor / totalValor) * 100 : 0,
      color: CATEGORIA_CORES[cat] || '#8b5cf6',
      iconName: CATEGORIA_ICONS[cat] || 'Layers',
    }))
    .sort((a, b) => b.valor - a.valor);

  // 2. Estratificação por Calibre / Litragem / Formato
  const calibreMap: Record<string, { valor: number; count: number }> = {};
  items.forEach((item) => {
    let cal = item.calibre || 'Geral';
    // Normalizar calibres
    if (cal.includes('635') || cal.includes('600')) cal = '600ml / 635ml';
    else if (cal.includes('1L') || cal.includes('1 Litro') || cal.includes('1000')) cal = '1 Litro (Litrão)';
    else if (cal.includes('330') || cal.includes('300')) cal = '300ml / 330ml';
    else if (cal.includes('Palete') || cal.includes('Pallet') || cal.includes('1,00') || cal.includes('1,05')) cal = 'Paletes / Unitizadores';
    
    if (!calibreMap[cal]) {
      calibreMap[cal] = { valor: 0, count: 0 };
    }
    calibreMap[cal].valor += item.valor;
    calibreMap[cal].count += 1;
  });

  const porCalibre: CalibreEstratificacao[] = Object.entries(calibreMap)
    .map(([calibre, dados]) => ({
      calibre,
      valor: dados.valor,
      count: dados.count,
      percentual: totalValor > 0 ? (dados.valor / totalValor) * 100 : 0,
    }))
    .sort((a, b) => b.valor - a.valor);

  // 3. Estratificação por Curva ABC (Pareto)
  const itensA = items.filter((i) => i.classeABC === 'A');
  const itensB = items.filter((i) => i.classeABC === 'B');
  const itensC = items.filter((i) => i.classeABC === 'C');

  const valorA = itensA.reduce((a, b) => a + b.valor, 0);
  const valorB = itensB.reduce((a, b) => a + b.valor, 0);
  const valorC = itensC.reduce((a, b) => a + b.valor, 0);

  const curvaABC: {
    classeA: CurvaABCSummary;
    classeB: CurvaABCSummary;
    classeC: CurvaABCSummary;
  } = {
    classeA: {
      classe: 'A',
      descricao: 'Prioridade Crítica (~80% do valor total)',
      count: itensA.length,
      valor: valorA,
      percentual: totalValor > 0 ? (valorA / totalValor) * 100 : 0,
      itens: itensA,
      color: '#ef4444', // Red
    },
    classeB: {
      classe: 'B',
      descricao: 'Prioridade Intermediária (~15% do valor total)',
      count: itensB.length,
      valor: valorB,
      percentual: totalValor > 0 ? (valorB / totalValor) * 100 : 0,
      itens: itensB,
      color: '#f59e0b', // Amber
    },
    classeC: {
      classe: 'C',
      descricao: 'Cauda Longa (~5% do valor total)',
      count: itensC.length,
      valor: valorC,
      percentual: totalValor > 0 ? (valorC / totalValor) * 100 : 0,
      itens: itensC,
      color: '#10b981', // Emerald
    },
  };

  return {
    totalValor,
    totalItens,
    mediaValorPorItem,
    topItem,
    top3ConcentracaoValor,
    top3ConcentracaoPercent,
    porCategoria,
    porCalibre,
    curvaABC,
  };
}

/**
 * Converte arquivo CSV/texto ou tabela em lista de RefugoItem
 */
export function parseRefugoTextOrCSV(text: string): RefugoItem[] {
  if (!text || !text.trim()) return [];

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const items: RefugoItem[] = [];

  for (const line of lines) {
    // Ignorar cabeçalhos
    if (/^(#|pos|posicao|material|item|codigo)/i.test(line) && /valor/i.test(line)) {
      continue;
    }

    // Dividir por tab (\t), ponto e vírgula (;), vírgula (,) ou espaços múltiplos
    let parts: string[] = [];
    if (line.includes('\t')) {
      parts = line.split('\t').map((p) => p.trim());
    } else if (line.includes(';')) {
      parts = line.split(';').map((p) => p.trim());
    } else {
      // Regex para linha: ex: 1 GFA VIDRO 635ML... R$ 115.612,71
      const match = line.match(/^(\d+)?\s*(.*?)\s*(?:R\$\s*)?([\d\.,]+)$/);
      if (match) {
        parts = [match[1] || '', match[2], match[3]];
      }
    }

    if (parts.length >= 2) {
      let mat = parts[1] || parts[0];
      let valStr = parts[parts.length - 1];

      // Se a primeira parte não for número, o material é parts[0]
      if (isNaN(Number(parts[0])) && parts.length === 2) {
        mat = parts[0];
        valStr = parts[1];
      }

      // Limpar valor numérico
      const cleanVal = parseFloat(
        valStr
          .replace(/R\$/gi, '')
          .replace(/\s+/g, '')
          .replace(/\./g, '')
          .replace(',', '.')
      );

      if (mat && !isNaN(cleanVal) && cleanVal > 0) {
        // Auto-categorizar
        let categoria: CategoriaRefugo = 'Outros';
        let calibre = 'Padrão';
        let cor = 'Padrão';
        let tipoMaterial = mat;

        const upper = mat.toUpperCase();
        if (upper.includes('GFA') || upper.includes('GARRAFA') || upper.includes('VIDRO')) {
          categoria = 'Garrafas de Vidro';
          cor = upper.includes('VERDE') ? 'Verde' : upper.includes('AMBAR') ? 'Âmbar' : 'Padrão';
          if (upper.includes('635') || upper.includes('600')) calibre = '635ml / 600ml';
          else if (upper.includes('1L') || upper.includes('1 LITRO') || upper.includes('1000')) calibre = '1 Litro';
          else if (upper.includes('330') || upper.includes('300')) calibre = '330ml / 300ml';
        } else if (upper.includes('GARRAFEIRA') || upper.includes('CAIXA') || upper.includes('PLAST')) {
          categoria = 'Garrafeiras Plásticas';
          cor = upper.includes('PRETO') ? 'Preto' : upper.includes('AZUL') ? 'Azul' : upper.includes('SKOL') ? 'Amarelo' : 'Padrão';
          if (upper.includes('24X600') || upper.includes('24 GFA 600')) calibre = '24x600ml';
          else if (upper.includes('23X300') || upper.includes('23 GFA 300')) calibre = '23x300ml';
          else if (upper.includes('12 GFA 1L') || upper.includes('12X1L')) calibre = '12x1L';
        } else if (upper.includes('PALET') || upper.includes('MADEIRA')) {
          categoria = 'Paletes de Madeira';
          cor = 'Natural';
          calibre = upper.includes('1,05') ? '1,05m × 1,25m' : '1,00m × 1,20m (PBR)';
        }

        items.push({
          id: `ref-imp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          posicao: items.length + 1,
          material: mat,
          valor: cleanVal,
          categoria,
          calibre,
          tipoMaterial,
          cor,
          retornavel: true,
          dataCriacao: new Date().toISOString().slice(0, 10),
        });
      }
    }
  }

  return processarItensRefugo(items);
}

/**
 * Exporta para arquivo CSV
 */
export function exportRefugoToCSV(items: RefugoItem[]): void {
  const processados = processarItensRefugo(items);
  const headers = [
    '#',
    'Material',
    'Categoria',
    'Calibre / Formato',
    'Tipo Material',
    'Cor / Padrão',
    'Valor (R$)',
    '% do Total',
    '% Acumulado (Pareto)',
    'Classificação ABC',
    'Unidades Estimadas',
    'Observações',
  ];

  const rows = processados.map((i) => [
    i.posicao,
    `"${(i.material || '').replace(/"/g, '""')}"`,
    `"${i.categoria}"`,
    `"${i.calibre}"`,
    `"${i.tipoMaterial}"`,
    `"${i.cor}"`,
    i.valor.toFixed(2).replace('.', ','),
    (i.percentual || 0).toFixed(2).replace('.', ',') + '%',
    (i.percentualAcumulado || 0).toFixed(2).replace('.', ',') + '%',
    i.classeABC || 'A',
    i.unidadesEstimadas || 0,
    `"${(i.observacao || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Estratificacao_Refugo_Ambev_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
