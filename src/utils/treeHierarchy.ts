import { RegistroPerda } from '../types';

export interface TreeDataRecord {
  id: string;
  data: string;
  mesRef: string;
  turno: string;
  area: string;
  produto: string;
  quantidade: number;
  hlPerdido: number;
  valorR$: number;
  codigoMotivo: string;
  motivo: string;
  causa?: string;
  responsavel?: string;
  observacao?: string;
}

export type HierarchyLevelType =
  | 'root'
  | 'area_principal' // Armazém, Falta no Palete, Rota / Entrega, Qualidade / WQI, etc.
  | 'sub_area'        // Sub-área (quando aplicável)
  | 'motivo'          // Motivo da Perda (ex: Quebra com Movimentação, Falta no Palete, etc.)
  | 'embalagem'       // Tipo de Embalagem (Lata 350ml, Garrafa 600ml, etc.)
  | 'produto'         // SKU do Produto
  | 'impacto';        // Card de Impacto Financeiro Consolidado

/**
 * Classifica um registro seguindo a regra operacional:
 * "Tudo que for quebra com movimentação é armazem. o resto são as outras áreas."
 */
export function classifyRecord(r: RegistroPerda): {
  areaPrincipal: string;
  subArea?: string;
} {
  const motRaw = (r.motivo || '').toUpperCase().trim();
  const causaRaw = (r.causa || '').toUpperCase().trim();
  const obsRaw = (r.observacao || '').toUpperCase().trim();
  const codRaw = String(r.codQuebra || r.codigoMotivo || '').toUpperCase().trim();
  const areaRaw = (r.area || '').toUpperCase().trim();
  const respRaw = (r.responsavel || '').toUpperCase().trim();

  // 1. REGRA PRINCIPAL: Tudo que for quebra com movimentação é ARMAZÉM
  const isQuebraMovimentacao =
    motRaw.includes('MOVIMENTAÇÃO') ||
    motRaw.includes('MOVIMENTACAO') ||
    motRaw.includes('MOVIME') ||
    motRaw.includes('QUEBRA COM MOVIMENTAÇÃO') ||
    motRaw.includes('QUEBRA COM MOVIMENTACAO') ||
    causaRaw.includes('MOVIMENTAÇÃO') ||
    causaRaw.includes('MOVIMENTACAO') ||
    causaRaw.includes('MOVIME') ||
    causaRaw.includes('MANUSEIO INTERNO') ||
    causaRaw.includes('EMPILHADEIRA') ||
    codRaw === '539' ||
    codRaw === 'Q-539' ||
    (motRaw.includes('QUEBRA') && !motRaw.includes('ROTA') && !motRaw.includes('ENTREGA') && !motRaw.includes('FALTA'));

  if (isQuebraMovimentacao) {
    return { areaPrincipal: 'ARMAZÉM', subArea: 'MOVIMENTAÇÃO' };
  }

  // 2. FALTA NO PALETE (Inconsistência de Palete / Recebimento / Fábrica)
  const isFaltaPalete =
    motRaw.includes('FALTA NO PALETE') ||
    motRaw.includes('FALTA PALETE') ||
    causaRaw.includes('FALTA NO PALETE') ||
    codRaw === '524' ||
    codRaw === 'Q-524' ||
    codRaw === '576' ||
    codRaw === 'Q-576' ||
    (motRaw.includes('FALTA') && motRaw.includes('PALETE'));

  if (isFaltaPalete) {
    return { areaPrincipal: 'FALTA NO PALETE' };
  }

  // 3. ROTA / ENTREGA
  const isEntrega =
    areaRaw.includes('ENTREGA') ||
    areaRaw.includes('ROTA') ||
    areaRaw.includes('DISTRIBUIÇÃO') ||
    areaRaw.includes('DISTRIBUICAO') ||
    motRaw.includes('ROTA') ||
    motRaw.includes('ENTREGA') ||
    obsRaw.includes('ENTREGA') ||
    obsRaw.includes('ROTA') ||
    obsRaw.includes('MOTORISTA') ||
    respRaw.includes('MOTORISTA') ||
    respRaw.includes('ROTA');

  if (isEntrega) {
    return { areaPrincipal: 'ROTA / ENTREGA' };
  }

  // 4. QUALIDADE / SHELF (WQI)
  const isQualidade =
    motRaw.includes('SHELF') ||
    motRaw.includes('VALIDADE') ||
    motRaw.includes('VENCIMENTO') ||
    motRaw.includes('ESTUFADO') ||
    motRaw.includes('VAZAMENTO') ||
    motRaw.includes('DESVIO') ||
    motRaw.includes('REFUGO') ||
    motRaw.includes('QUALIDADE') ||
    causaRaw.includes('SHELF') ||
    causaRaw.includes('FEFO') ||
    causaRaw.includes('VENCIMENTO');

  if (isQualidade) {
    return { areaPrincipal: 'QUALIDADE / WQI' };
  }

  // 5. CARREGAMENTO / PÁTIO
  const isPatioCarregamento =
    areaRaw.includes('CARREGAMENTO') ||
    areaRaw.includes('DESCARGA') ||
    areaRaw.includes('PÁTIO') ||
    areaRaw.includes('PATIO') ||
    motRaw.includes('CARREGAMENTO') ||
    motRaw.includes('DESCARGA');

  if (isPatioCarregamento) {
    return { areaPrincipal: 'CARREGAMENTO / PÁTIO' };
  }

  // 6. ENVASE / LINHA
  const isEnvase =
    areaRaw.includes('ENVASE') ||
    areaRaw.includes('LINHA') ||
    areaRaw.includes('PRODUÇÃO') ||
    areaRaw.includes('PRODUCAO');

  if (isEnvase) {
    return { areaPrincipal: 'ENVASE' };
  }

  // 7. RECEBIMENTO
  if (areaRaw.includes('RECEBIMENTO')) {
    return { areaPrincipal: 'RECEBIMENTO' };
  }

  // 8. O RESTO SÃO AS OUTRAS ÁREAS
  if (areaRaw && areaRaw !== 'ARMAZEM' && areaRaw !== 'ARMAZÉM') {
    return { areaPrincipal: areaRaw };
  }

  return { areaPrincipal: 'OUTRAS ÁREAS' };
}

/**
 * Identifica e extrai a categoria de Embalagem a partir da descrição e campos do produto no JSON.
 */
export function extractEmbalagem(produtoNome: string): string {
  const p = (produtoNome || '').toUpperCase().trim();

  if (p.includes('LATA 350') || (p.includes('350ML') && p.includes('LATA')) || p.includes('LATA 350ML')) {
    return 'Lata 350ml';
  }
  if (p.includes('LATA 473') || p.includes('473ML') || p.includes('LATÃO') || p.includes('LATAO')) {
    return 'Lata 473ml';
  }
  if (p.includes('LATA 269') || p.includes('269ML') || p.includes('SLEEK')) {
    return 'Lata 269ml Sleek';
  }
  if (p.includes('LATA 355') || (p.includes('355ML') && p.includes('LATA'))) {
    return 'Lata 355ml';
  }
  if (p.includes('LATA')) {
    return 'Lata Padrão';
  }

  if (p.includes('600ML') || (p.includes('600') && (p.includes('RGB') || p.includes('GARRAFA') || p.includes('CX24')))) {
    return 'Garrafa 600ml RGB';
  }
  if (
    p.includes('LONG NECK') ||
    p.includes('LN') ||
    ((p.includes('330ML') || p.includes('355ML')) &&
      (p.includes('CORONA') || p.includes('SPATEN') || p.includes('BECK') || p.includes('BUD') || p.includes('STELLA') || p.includes('HEINEKEN')))
  ) {
    return 'Long Neck 330ml/355ml';
  }
  if (p.includes('LITRÃO') || p.includes('LITRAO') || p.includes('1 LITRO') || p.includes('1L') || p.includes('1000ML')) {
    return 'Garrafa 1L (Litrão)';
  }
  if (p.includes('LITRINHO') || p.includes('300ML')) {
    return 'Garrafa 300ml (Litrinho)';
  }
  if (p.includes('BARRIL') || p.includes('CHOPP') || p.includes('30L') || p.includes('50L')) {
    return 'Barril Chopp (30L/50L)';
  }
  if (p.includes('PET 2L') || p.includes('2 LITROS') || p.includes('2L')) {
    return 'Pet 2L';
  }
  if (p.includes('PET 1.5L') || p.includes('1,5L') || p.includes('1.5L')) {
    return 'Pet 1.5L';
  }
  if (p.includes('PET')) {
    return 'Garrafa Pet';
  }
  if (p.includes('GARRAFA') || p.includes('RGB') || p.includes('ONE-WAY') || p.includes('VIDRO')) {
    return 'Garrafa de Vidro';
  }

  // Extrai texto em parênteses, caso exista (ex: "(Lata Cx24)")
  const match = produtoNome.match(/\(([^)]+)\)/);
  if (match && match[1]) {
    return match[1].trim();
  }

  return 'Outras Embalagens';
}

/**
 * Interface para os nós da árvore
 */
export interface TreeNodeSummary {
  id: string;
  label: string;
  subLabel?: string;
  valorR$: number;
  quantidade: number;
  hlPerdido: number;
  percentOfTotal: number;
  percentOfParent: number;
  recordsCount: number;
  records: RegistroPerda[];
  level: HierarchyLevelType;
  pathKey: string;
}

/**
 * Calcula os nós filhos dependendo do nó pai ativo e do caminho percorrido.
 */
export function getChildNodesForPath(
  allRecords: RegistroPerda[],
  selectedPath: string[],
  totalGrandValor: number,
  totalGrandHL: number,
  metricMode: 'valor' | 'hl'
): {
  levelIndex: number;
  levelName: string;
  nodes: TreeNodeSummary[];
}[] {
  const result: { levelIndex: number; levelName: string; nodes: TreeNodeSummary[] }[] = [];

  // Se nenhum nó selecionado além da raiz, não há colunas abertas
  if (selectedPath.length === 0) {
    return result;
  }

  const grandBase = metricMode === 'valor' ? totalGrandValor : totalGrandHL;

  // 1. PRIMEIRO NÍVEL: ÁREAS PRINCIPAIS
  // (Aberto quando TOTAL AVARIAS é clicado, ou seja, selectedPath inclui 'ROOT')
  if (selectedPath.includes('ROOT')) {
    const areaMap: Record<string, RegistroPerda[]> = {};

    allRecords.forEach((r) => {
      const cls = classifyRecord(r);
      const area = cls.areaPrincipal;
      if (!areaMap[area]) areaMap[area] = [];
      areaMap[area].push(r);
    });

    const getAreaSubLabel = (area: string, count: number) => {
      if (area === 'ARMAZÉM') return `Quebras com Movimentação (${count} reg)`;
      if (area === 'FALTA NO PALETE') return `Inconsistência de Palete (${count} reg)`;
      if (area === 'ROTA / ENTREGA') return `Rota de Distribuição (${count} reg)`;
      if (area === 'QUALIDADE / WQI') return `Qualidade / Shelf (${count} reg)`;
      if (area === 'CARREGAMENTO / PÁTIO') return `Pátio / Expedição (${count} reg)`;
      if (area === 'ENVASE') return `Linha de Produção (${count} reg)`;
      if (area === 'RECEBIMENTO') return `Recebimento de Cargas (${count} reg)`;
      return `Ocorrências da Área (${count} reg)`;
    };

    const areaNodes: TreeNodeSummary[] = Object.entries(areaMap).map(([areaName, records]) => {
      const val = records.reduce((s, r) => s + r.valorR$, 0);
      const hl = records.reduce((s, r) => s + r.hlPerdido, 0);
      const qtd = records.reduce((s, r) => s + r.quantidade, 0);
      const metricVal = metricMode === 'valor' ? val : hl;

      return {
        id: `AREA-${areaName.replace(/\s+/g, '_')}`,
        label: areaName,
        subLabel: getAreaSubLabel(areaName, records.length),
        valorR$: val,
        hlPerdido: hl,
        quantidade: qtd,
        recordsCount: records.length,
        percentOfTotal: grandBase > 0 ? (metricVal / grandBase) * 100 : 0,
        percentOfParent: grandBase > 0 ? (metricVal / grandBase) * 100 : 0,
        records,
        level: 'area_principal',
        pathKey: `AREA:${areaName}`,
      };
    });

    areaNodes.sort((a, b) => (metricMode === 'valor' ? b.valorR$ - a.valorR$ : b.hlPerdido - a.hlPerdido));

    result.push({
      levelIndex: 1,
      levelName: 'ÁREA PRINCIPAL',
      nodes: areaNodes,
    });
  }

  // 2. SELEÇÃO DA ÁREA PRINCIPAL -> ABRIR MOTIVOS DA ÁREA
  const selectedAreaPath = selectedPath.find(
    (p) => p.startsWith('AREA:') || p === 'ARMAZEM' || p === 'ENTREGA'
  );

  if (selectedAreaPath) {
    let selectedAreaName = selectedAreaPath.startsWith('AREA:')
      ? selectedAreaPath.replace('AREA:', '')
      : selectedAreaPath === 'ARMAZEM'
      ? 'ARMAZÉM'
      : 'ROTA / ENTREGA';

    const areaRecords = allRecords.filter(
      (r) => classifyRecord(r).areaPrincipal === selectedAreaName
    );

    const areaBase =
      metricMode === 'valor'
        ? areaRecords.reduce((s, r) => s + r.valorR$, 0)
        : areaRecords.reduce((s, r) => s + r.hlPerdido, 0);

    const motivosNodes = buildMotivosNodes(
      areaRecords,
      selectedAreaName,
      areaBase,
      grandBase,
      metricMode
    );

    result.push({
      levelIndex: 2,
      levelName: `MOTIVOS (${selectedAreaName})`,
      nodes: motivosNodes,
    });

    // 3. SELEÇÃO DO MOTIVO -> ABRIR EMBALAGENS
    const selectedMotivoPath = selectedPath.find((p) => p.startsWith('MOTIVO:'));
    if (selectedMotivoPath) {
      const selectedMotivoNome = selectedMotivoPath.replace('MOTIVO:', '');
      const motivoRecords = areaRecords.filter(
        (r) => (r.motivo || 'OUTROS').trim().toUpperCase() === selectedMotivoNome
      );
      const motivoBase =
        metricMode === 'valor'
          ? motivoRecords.reduce((s, r) => s + r.valorR$, 0)
          : motivoRecords.reduce((s, r) => s + r.hlPerdido, 0);

      const embalagemNodes = buildEmbalagemNodes(
        motivoRecords,
        selectedMotivoNome,
        motivoBase,
        grandBase,
        metricMode
      );

      result.push({
        levelIndex: 3,
        levelName: 'EMBALAGENS',
        nodes: embalagemNodes,
      });

      // 4. SELEÇÃO DA EMBALAGEM -> ABRIR PRODUTOS
      const selectedEmbPath = selectedPath.find((p) => p.startsWith('EMB:'));
      if (selectedEmbPath) {
        const selectedEmbNome = selectedEmbPath.replace('EMB:', '');
        const embRecords = motivoRecords.filter(
          (r) => extractEmbalagem(r.produto) === selectedEmbNome
        );
        const embBase =
          metricMode === 'valor'
            ? embRecords.reduce((s, r) => s + r.valorR$, 0)
            : embRecords.reduce((s, r) => s + r.hlPerdido, 0);

        const produtoNodes = buildProdutoNodes(
          embRecords,
          selectedEmbNome,
          embBase,
          grandBase,
          metricMode
        );

        result.push({
          levelIndex: 4,
          levelName: 'PRODUTOS',
          nodes: produtoNodes,
        });

        // 5. SELEÇÃO DO PRODUTO -> ABRIR IMPACTO FINANCEIRO
        const selectedProdPath = selectedPath.find((p) => p.startsWith('PROD:'));
        if (selectedProdPath) {
          const selectedProdNome = selectedProdPath.replace('PROD:', '');
          const prodRecords = embRecords.filter((r) => r.produto === selectedProdNome);

          const impactoNodes = buildImpactoFinanceiroNode(
            prodRecords,
            selectedProdNome,
            grandBase,
            totalGrandValor,
            totalGrandHL,
            metricMode
          );

          result.push({
            levelIndex: 5,
            levelName: 'IMPACTO FINANCEIRO',
            nodes: impactoNodes,
          });
        }
      }
    }
  }

  return result;
}

/**
 * Construtores de Nós Específicos
 */
function buildMotivosNodes(
  records: RegistroPerda[],
  parentKey: string,
  parentBase: number,
  grandBase: number,
  metricMode: 'valor' | 'hl'
): TreeNodeSummary[] {
  const map: Record<string, RegistroPerda[]> = {};

  records.forEach((r) => {
    const mot = (r.motivo || 'OUTROS').trim().toUpperCase();
    if (!map[mot]) map[mot] = [];
    map[mot].push(r);
  });

  const nodes: TreeNodeSummary[] = Object.entries(map).map(([motivoNome, list]) => {
    const val = list.reduce((s, r) => s + r.valorR$, 0);
    const hl = list.reduce((s, r) => s + r.hlPerdido, 0);
    const qtd = list.reduce((s, r) => s + r.quantidade, 0);
    const metricVal = metricMode === 'valor' ? val : hl;

    return {
      id: `MOT-${parentKey}-${motivoNome}`,
      label: motivoNome,
      subLabel: `${list[0]?.codigoMotivo ? list[0].codigoMotivo + ' • ' : ''}${list.length} ocorrência(s)`,
      valorR$: val,
      hlPerdido: hl,
      quantidade: qtd,
      recordsCount: list.length,
      percentOfTotal: grandBase > 0 ? (metricVal / grandBase) * 100 : 0,
      percentOfParent: parentBase > 0 ? (metricVal / parentBase) * 100 : 0,
      records: list,
      level: 'motivo',
      pathKey: `MOTIVO:${motivoNome}`,
    };
  });

  nodes.sort((a, b) => (metricMode === 'valor' ? b.valorR$ - a.valorR$ : b.hlPerdido - a.hlPerdido));
  return nodes;
}

function buildEmbalagemNodes(
  records: RegistroPerda[],
  motivoNome: string,
  parentBase: number,
  grandBase: number,
  metricMode: 'valor' | 'hl'
): TreeNodeSummary[] {
  const map: Record<string, RegistroPerda[]> = {};

  records.forEach((r) => {
    const emb = extractEmbalagem(r.produto);
    if (!map[emb]) map[emb] = [];
    map[emb].push(r);
  });

  const nodes: TreeNodeSummary[] = Object.entries(map).map(([embNome, list]) => {
    const val = list.reduce((s, r) => s + r.valorR$, 0);
    const hl = list.reduce((s, r) => s + r.hlPerdido, 0);
    const qtd = list.reduce((s, r) => s + r.quantidade, 0);
    const metricVal = metricMode === 'valor' ? val : hl;

    return {
      id: `EMB-${motivoNome}-${embNome}`,
      label: embNome,
      subLabel: `${list.length} registro(s)`,
      valorR$: val,
      hlPerdido: hl,
      quantidade: qtd,
      recordsCount: list.length,
      percentOfTotal: grandBase > 0 ? (metricVal / grandBase) * 100 : 0,
      percentOfParent: parentBase > 0 ? (metricVal / parentBase) * 100 : 0,
      records: list,
      level: 'embalagem',
      pathKey: `EMB:${embNome}`,
    };
  });

  nodes.sort((a, b) => (metricMode === 'valor' ? b.valorR$ - a.valorR$ : b.hlPerdido - a.hlPerdido));
  return nodes;
}

function buildProdutoNodes(
  records: RegistroPerda[],
  embNome: string,
  parentBase: number,
  grandBase: number,
  metricMode: 'valor' | 'hl'
): TreeNodeSummary[] {
  const map: Record<string, RegistroPerda[]> = {};

  records.forEach((r) => {
    const prod = r.produto || 'Produto Indefinido';
    if (!map[prod]) map[prod] = [];
    map[prod].push(r);
  });

  const nodes: TreeNodeSummary[] = Object.entries(map).map(([prodNome, list]) => {
    const val = list.reduce((s, r) => s + r.valorR$, 0);
    const hl = list.reduce((s, r) => s + r.hlPerdido, 0);
    const qtd = list.reduce((s, r) => s + r.quantidade, 0);
    const metricVal = metricMode === 'valor' ? val : hl;

    return {
      id: `PROD-${embNome}-${prodNome}`,
      label: prodNome.toUpperCase(),
      subLabel: `Qtd: ${qtd.toLocaleString('pt-BR')} un • ${hl.toFixed(2)} HL`,
      valorR$: val,
      hlPerdido: hl,
      quantidade: qtd,
      recordsCount: list.length,
      percentOfTotal: grandBase > 0 ? (metricVal / grandBase) * 100 : 0,
      percentOfParent: parentBase > 0 ? (metricVal / parentBase) * 100 : 0,
      records: list,
      level: 'produto',
      pathKey: `PROD:${prodNome}`,
    };
  });

  nodes.sort((a, b) => (metricMode === 'valor' ? b.valorR$ - a.valorR$ : b.hlPerdido - a.hlPerdido));
  return nodes;
}

function buildImpactoFinanceiroNode(
  records: RegistroPerda[],
  prodNome: string,
  grandBase: number,
  totalGrandValor: number,
  totalGrandHL: number,
  metricMode: 'valor' | 'hl'
): TreeNodeSummary[] {
  const val = records.reduce((s, r) => s + r.valorR$, 0);
  const hl = records.reduce((s, r) => s + r.hlPerdido, 0);
  const qtd = records.reduce((s, r) => s + r.quantidade, 0);
  const metricVal = metricMode === 'valor' ? val : hl;

  const percentTreeTotal = grandBase > 0 ? (metricVal / grandBase) * 100 : 0;

  return [
    {
      id: `IMPACTO-${prodNome}`,
      label: 'IMPACTO FINANCEIRO',
      subLabel: `${prodNome}`,
      valorR$: val,
      hlPerdido: hl,
      quantidade: qtd,
      recordsCount: records.length,
      percentOfTotal: percentTreeTotal,
      percentOfParent: 100,
      records,
      level: 'impacto',
      pathKey: `IMPACTO:${prodNome}`,
    },
  ];
}
