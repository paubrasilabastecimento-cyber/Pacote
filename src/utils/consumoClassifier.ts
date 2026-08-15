import { CategoriaConsumo } from '../types/consumoInterno';
import { PRODUTOS_AMBEV } from '../data/mockData';

// Normalized helper to remove accents and uppercase
function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();
}

/**
 * Classifies an internal consumption product description into its business category.
 * Cross-references with the internal Ambev product catalog if available, or falls back
 * to keyword rules as requested.
 */
export function classificarCategoriaProduto(
  descricao: string,
  codProduto?: number | string
): CategoriaConsumo {
  if (!descricao) return 'Outros';

  const normDesc = normalizeText(descricao);

  // 1. Cross-reference with standard product catalog if matching SKU or name
  if (codProduto) {
    const codStr = String(codProduto);
    const matchedByCod = PRODUTOS_AMBEV.find(
      (p) => p.id.includes(codStr) || p.nome.includes(codStr)
    );
    if (matchedByCod) {
      if (matchedByCod.categoria.includes('Cerveja') || matchedByCod.categoria === 'Lata' || matchedByCod.categoria === 'Chopp') {
        return 'Cerveja';
      }
      if (matchedByCod.categoria === 'Refrigerante') {
        return 'Refrigerante';
      }
    }
  }

  // 2. Exact / Keyword Rules specified in prompt
  // Cerveja: CORONA, SPATEN, STELLA ARTOIS, BUDWEISER, SKOL, BRAHMA, etc.
  const cervejaKeywords = [
    'CORONA',
    'SPATEN',
    'STELLA',
    'STELLA ARTOIS',
    'BUDWEISER',
    'BUD',
    'SKOL',
    'BRAHMA',
    'BECKS',
    "BECK'S",
    'ORIGINAL',
    'ANTARCTICA BOA',
    'ANTARCTICA PILSEN',
    'BOHEMIA',
    'COLORADO',
    'CHOPP',
    'HEINEKEN',
    'AMSTEL',
    'EISENBAHN',
    'CERVEJA',
    'LAGER',
    'IPA',
    'MALTE',
    'LONG NECK',
    'LN',
    'RGB',
  ];
  if (cervejaKeywords.some((kw) => normDesc.includes(kw))) {
    // Make sure it's not water with beer brand or something
    if (!normDesc.includes('AGUA') && !normDesc.includes('SUCO') && !normDesc.includes('GUARANA')) {
      return 'Cerveja';
    }
  }

  // Refrigerante: GUARANA, PEPSI, SODA, SUKITA, TONICA, etc.
  const refrigeranteKeywords = [
    'GUARANA',
    'GUARANÁ',
    'PEPSI',
    'SODA',
    'SODA LIMONADA',
    'SUKITA',
    'TONICA',
    'TÔNICA',
    'COCA',
    'COCA-COLA',
    'FANTA',
    'SPRITE',
    'REFRIGERANTE',
    'REFRI',
    'SCHWEPPES',
  ];
  if (refrigeranteKeywords.some((kw) => normDesc.includes(kw))) {
    return 'Refrigerante';
  }

  // Energético: RED BULL, MONSTER, FUSION, TNT
  const energeticoKeywords = [
    'RED BULL',
    'REDBULL',
    'MONSTER',
    'FUSION',
    'TNT',
    'ENERGETICO',
    'ENERGÉTICO',
    'ENERGY',
  ];
  if (energeticoKeywords.some((kw) => normDesc.includes(kw))) {
    return 'Energético';
  }

  // Isotônico/Suco: H2OH, GATORADE, POWERADE, DO BEM, SUCO, ISOTONICO
  const isotonicoSucoKeywords = [
    'H2OH',
    'H2O',
    'GATORADE',
    'POWERADE',
    'DO BEM',
    'DEL VALLE',
    'SUCO',
    'NECTAR',
    'NÉCTAR',
    'ISOTONICO',
    'ISOTÔNICO',
    'CHA',
    'CHÁ',
    'MATTE LEAO',
    'ICE TEA',
    'ADES',
  ];
  if (isotonicoSucoKeywords.some((kw) => normDesc.includes(kw))) {
    return 'Isotônico/Suco';
  }

  // Água: AGUA MIN, AGUA MINERAL, AGUA, AMA, CRYSTAL, BONAFONT
  const aguaKeywords = [
    'AGUA MIN',
    'AGUA MINERAL',
    'ÁGUA MINERAL',
    'AGUA C/ GAS',
    'AGUA S/ GAS',
    'AGUA COM GAS',
    'AGUA SEM GAS',
    'AGUA',
    'ÁGUA',
    'AMA',
    'CRYSTAL',
    'BONAFONT',
    'LINDOYA',
  ];
  if (aguaKeywords.some((kw) => normDesc.includes(kw))) {
    return 'Água';
  }

  // Snack: MENDORATO e outros itens de conveniência
  const snackKeywords = [
    'MENDORATO',
    'AMENDOIM',
    'CASTANHA',
    'TORCIDA',
    'RUFFLES',
    'DORITOS',
    'CHEETOS',
    'LAYS',
    'LAY S',
    'FANDANGOS',
    'SALGADINHO',
    'BATATA',
    'SNACK',
    'BISCOITO',
    'BOLACHA',
    'BARRA DE CEREAL',
    'CHOCOLATE',
    'BALA',
    'CHICLETE',
  ];
  if (snackKeywords.some((kw) => normDesc.includes(kw))) {
    return 'Snack';
  }

  // Default fallback
  return 'Outros';
}

export const CATEGORIAS_CONFIG: Record<
  CategoriaConsumo,
  { label: string; color: string; bgBadge: string; textBadge: string; borderBadge: string }
> = {
  Cerveja: {
    label: 'Cerveja',
    color: '#f59e0b', // amber-500
    bgBadge: 'bg-amber-500/10',
    textBadge: 'text-amber-400',
    borderBadge: 'border-amber-500/30',
  },
  Refrigerante: {
    label: 'Refrigerante',
    color: '#38bdf8', // sky-400
    bgBadge: 'bg-sky-500/10',
    textBadge: 'text-sky-400',
    borderBadge: 'border-sky-500/30',
  },
  Energético: {
    label: 'Energético',
    color: '#a855f7', // purple-500
    bgBadge: 'bg-purple-500/10',
    textBadge: 'text-purple-400',
    borderBadge: 'border-purple-500/30',
  },
  'Isotônico/Suco': {
    label: 'Isotônico/Suco',
    color: '#10b981', // emerald-500
    bgBadge: 'bg-emerald-500/10',
    textBadge: 'text-emerald-400',
    borderBadge: 'border-emerald-500/30',
  },
  Água: {
    label: 'Água',
    color: '#06b6d4', // cyan-500
    bgBadge: 'bg-cyan-500/10',
    textBadge: 'text-cyan-400',
    borderBadge: 'border-cyan-500/30',
  },
  Snack: {
    label: 'Snack',
    color: '#f97316', // orange-500
    bgBadge: 'bg-orange-500/10',
    textBadge: 'text-orange-400',
    borderBadge: 'border-orange-500/30',
  },
  Outros: {
    label: 'Outros',
    color: '#94a3b8', // slate-400
    bgBadge: 'bg-slate-500/10',
    textBadge: 'text-slate-400',
    borderBadge: 'border-slate-500/30',
  },
};
