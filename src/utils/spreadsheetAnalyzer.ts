import * as XLSX from 'xlsx';

export interface ItemPlanilha {
  id: string;
  operacao: string;
  data: string; // YYYY-MM-DD
  status: string;
  codProduto: string;
  unidade: string;
  descricao: string;
  quantidade: number;
  valor: number;
  categoria: string;
  marca: string;
  mes: string; // YYYY-MM
}

export interface CategoriaResumo {
  categoria: string;
  valor: number;
  percentual: number; // 0 - 100
  quantidade: number;
  registros: number;
  marcas: MarcaResumo[];
}

export interface MarcaResumo {
  marca: string;
  valor: number;
  percentualTotal: number; // 0 - 100 em relacao ao total geral
  percentualCategoria: number; // 0 - 100 em relacao a categoria
  quantidade: number;
  registros: number;
}

export interface ProdutoTop {
  codProduto: string;
  descricao: string;
  categoria: string;
  marca: string;
  unidade: string;
  quantidade: number;
  valor: number;
  percentual: number;
  registros: number;
}

export interface MesEvolucao {
  mes: string; // YYYY-MM
  mesFormatado: string; // ex: Jan/2026
  valor: number;
  quantidade: number;
  registros: number;
  percentual: number;
}

export interface ResultadoAnalise {
  totalRegistros: number;
  quantidadeTotal: number;
  valorTotal: number;
  ticketMedio: number;
  produtosUnicos: number;
  dataMinima: string;
  dataMaxima: string;
  periodoFormatado: string;
  
  // Categorias
  categorias: CategoriaResumo[];
  categoriaDominante: CategoriaResumo | null;
  
  // Marcas
  marcasDominantes: MarcaResumo[];
  marcaDominante: MarcaResumo | null;
  marcaLiderGlobal: { marca: string; valor: number; quantidade: number; percentual: number } | null;
  top1Produto: ProdutoTop | null;

  // Top Produtos
  topProdutos: ProdutoTop[];
  concentracaoTop5: number;
  concentracaoTop10: number;
  
  // Status Operacional
  statusContagem: { status: string; count: number; percentual: number; valor: number }[];
  operacoesContagem: { operacao: string; count: number; percentual: number; valor: number }[];
  mediaPrecoUnitario: number;
  
  // Evolução Mensal
  evolucaoMensal: MesEvolucao[];
  mesPico: MesEvolucao | null;
  mesFraco: MesEvolucao | null;

  // Resumo Textual
  resumoTexto: string;
  destaques: {
    categoriaLider: string;
    marcaLider: string;
    mesPicoNome: string;
    mesFracoNome: string;
    top10Share: string;
  };
}

// -------------------------------------------------------------
// Categorizador Inteligente por Descrição de Produto
// -------------------------------------------------------------
export function classificarCategoria(desc: string): string {
  const d = (desc || '').toUpperCase();

  // Energéticos
  if (
    d.includes('MONSTER') ||
    d.includes('FUSION') ||
    d.includes('RED BULL') ||
    d.includes('REDBULL') ||
    d.includes('ENERGETICO') ||
    d.includes('ENERGÉTICO') ||
    d.includes('BURN')
  ) {
    return 'Energético';
  }

  // Água e Isotônicos
  if (
    d.includes('GATORADE') ||
    d.includes('AMA') ||
    d.includes('CRYSTAL') ||
    d.includes('BONAFONT') ||
    d.includes('MINERAL') ||
    d.includes('ISOTONICO') ||
    d.includes('ISOTÔNICO') ||
    ((d.includes('AGUA') || d.includes('ÁGUA')) && !d.includes('GUARANA') && !d.includes('GUARANÁ'))
  ) {
    return 'Água & Isotônico';
  }

  // Sucos e Chás
  if (
    d.includes('DO BEM') ||
    d.includes('LIPTON') ||
    d.includes('MATE') ||
    d.includes('MATTE') ||
    d.includes('SUCO') ||
    d.includes('CHÁ') ||
    d.includes('CHA ') ||
    d.includes('ICE TEA')
  ) {
    return 'Suco & Chá';
  }

  // Snacks & Alimentos
  if (
    d.includes('MENDORATO') ||
    d.includes('AMENDOIM') ||
    d.includes('PETISCO') ||
    d.includes('SNACK') ||
    d.includes('CASTANHA')
  ) {
    return 'Snacks & Alimentos';
  }

  // Refrigerantes
  if (
    d.includes('GUARANA') ||
    d.includes('GUARANÁ') ||
    d.includes('PEPSI') ||
    d.includes('SUKITA') ||
    d.includes('SODA') ||
    d.includes('H2OH') ||
    d.includes('H2O') ||
    d.includes('TONICA') ||
    d.includes('TÔNICA') ||
    d.includes('TEEM') ||
    d.includes('REFRI') ||
    d.includes('REFRIGERANTE')
  ) {
    return 'Refrigerante';
  }

  // Bebidas Mistas / Beats / Alcoólicos
  if (
    d.includes('BEATS') ||
    d.includes('MIKE') ||
    d.includes('SMIRNOFF') ||
    d.includes('SELTZER') ||
    d.includes('GIN') ||
    d.includes('VODKA')
  ) {
    return 'Bebidas Mistas & Beats';
  }

  // Cerveja (Maioria e padrões conhecidos)
  if (
    d.includes('BRAHMA') ||
    d.includes('SKOL') ||
    d.includes('STELLA') ||
    d.includes('BUDWEISER') ||
    d.includes('BUD') ||
    d.includes('CORONA') ||
    d.includes('SPATEN') ||
    d.includes('BECK') ||
    d.includes('ORIGINAL') ||
    d.includes('BOHEMIA') ||
    d.includes('COLORADO') ||
    d.includes('ANTARCTICA') ||
    d.includes('MICHELOB') ||
    d.includes('CHOPP') ||
    d.includes('MALZBIER') ||
    d.includes('CERV') ||
    d.includes('CERVEJA') ||
    d.includes('PILSNER') ||
    d.includes('LAGER') ||
    d.includes('IPA')
  ) {
    return 'Cerveja';
  }

  return 'Outros Produtos';
}

export function classificarMarca(desc: string): string {
  const d = (desc || '').toUpperCase();

  if (d.includes('BRAHMA') || d.includes('DUPLO MALTE') || d.includes('CHOPP BRAHMA')) return 'Brahma';
  if (d.includes('SKOL') && !d.includes('BEATS')) return 'Skol';
  if (d.includes('BEATS')) return 'Skol Beats';
  if (d.includes('STELLA') || d.includes('ARTOIS')) return 'Stella Artois';
  if (d.includes('BUDWEISER') || d.includes('BUD ') || d.includes('BUD(')) return 'Budweiser';
  if (d.includes('CORONA')) return 'Corona';
  if (d.includes('SPATEN')) return 'Spaten';
  if (d.includes('BECK')) return "Beck's";
  if (d.includes('ORIGINAL') || d.includes('ANTARCTICA ORIGINAL')) return 'Antarctica Original';
  if (d.includes('ANTARCTICA') || d.includes('BOA') || d.includes('SUB ZERO')) {
    if (d.includes('GUARANA') || d.includes('GUARANÁ')) return 'Guaraná Antarctica';
    if (d.includes('SODA')) return 'Soda Antarctica';
    return 'Antarctica';
  }
  if (d.includes('BOHEMIA')) return 'Bohemia';
  if (d.includes('COLORADO') || d.includes('APPIA') || d.includes('INDICA')) return 'Colorado';
  if (d.includes('MICHELOB')) return 'Michelob Ultra';
  if (d.includes('GUARANA') || d.includes('GUARANÁ')) return 'Guaraná Antarctica';
  if (d.includes('PEPSI')) return 'Pepsi';
  if (d.includes('SUKITA')) return 'Sukita';
  if (d.includes('SODA')) return 'Soda Antarctica';
  if (d.includes('GATORADE')) return 'Gatorade';
  if (d.includes('RED BULL') || d.includes('REDBULL')) return 'Red Bull';
  if (d.includes('MONSTER')) return 'Monster Energy';
  if (d.includes('FUSION')) return 'Fusion Energy';
  if (d.includes('H2OH') || d.includes('H2O')) return 'H2OH!';
  if (d.includes('DO BEM')) return 'do bem™';
  if (d.includes('TONICA') || d.includes('TÔNICA')) return 'Tônica Antarctica';
  if (d.includes('AMA')) return 'Água AMA';
  if (d.includes('CRYSTAL')) return 'Água Crystal';
  if (d.includes('MENDORATO') || d.includes('AMENDOIM') || d.includes('PETISCO')) return 'Mendorato';
  if (d.includes('COPO') || d.includes('DESCARTAVEL') || d.includes('GUARDANAPO')) return 'Descartáveis & Mat.';

  return 'Outras Marcas';
}

// -------------------------------------------------------------
// Motor Principal de Análise
// -------------------------------------------------------------
export function analisarDadosPlanilha(itens: ItemPlanilha[]): ResultadoAnalise {
  if (!itens || itens.length === 0) {
    return {
      totalRegistros: 0,
      quantidadeTotal: 0,
      valorTotal: 0,
      ticketMedio: 0,
      produtosUnicos: 0,
      dataMinima: '-',
      dataMaxima: '-',
      periodoFormatado: 'Nenhum dado carregado',
      categorias: [],
      categoriaDominante: null,
      marcasDominantes: [],
      marcaDominante: null,
      marcaLiderGlobal: null,
      top1Produto: null,
      topProdutos: [],
      concentracaoTop5: 0,
      concentracaoTop10: 0,
      statusContagem: [],
      operacoesContagem: [],
      mediaPrecoUnitario: 0,
      evolucaoMensal: [],
      mesPico: null,
      mesFraco: null,
      resumoTexto: 'Carregue uma planilha para visualizar a análise completa.',
      destaques: {
        categoriaLider: '-',
        marcaLider: '-',
        mesPicoNome: '-',
        mesFracoNome: '-',
        top10Share: '0%',
      },
    };
  }

  const totalRegistros = itens.length;
  let quantidadeTotal = 0;
  let valorTotal = 0;
  const produtosSet = new Set<string>();
  const datas: string[] = [];

  // Mapeamentos
  const catMap: Record<
    string,
    {
      valor: number;
      quantidade: number;
      registros: number;
      marcasMap: Record<string, { valor: number; quantidade: number; registros: number }>;
    }
  > = {};

  const prodMap: Record<
    string,
    {
      codProduto: string;
      descricao: string;
      categoria: string;
      marca: string;
      unidade: string;
      quantidade: number;
      valor: number;
      registros: number;
    }
  > = {};

  const statusMap: Record<string, { count: number; valor: number }> = {};
  const opMap: Record<string, { count: number; valor: number }> = {};
  const mesMap: Record<string, { valor: number; quantidade: number; registros: number }> = {};

  itens.forEach((item) => {
    quantidadeTotal += item.quantidade || 0;
    valorTotal += item.valor || 0;
    if (item.codProduto || item.descricao) {
      produtosSet.add(item.codProduto || item.descricao);
    }
    if (item.data) {
      datas.push(item.data.slice(0, 10));
    }

    const st = item.status || 'Não Informado';
    if (!statusMap[st]) statusMap[st] = { count: 0, valor: 0 };
    statusMap[st].count += 1;
    statusMap[st].valor += item.valor || 0;

    const op = item.operacao || 'Troca Impróprio';
    if (!opMap[op]) opMap[op] = { count: 0, valor: 0 };
    opMap[op].count += 1;
    opMap[op].valor += item.valor || 0;

    const cat = item.categoria || classificarCategoria(item.descricao);
    const marca = item.marca || classificarMarca(item.descricao);
    const mes = item.mes || (item.data ? item.data.slice(0, 7) : '2026-01');

    // Categorias & Marcas
    if (!catMap[cat]) {
      catMap[cat] = { valor: 0, quantidade: 0, registros: 0, marcasMap: {} };
    }
    catMap[cat].valor += item.valor || 0;
    catMap[cat].quantidade += item.quantidade || 0;
    catMap[cat].registros += 1;

    if (!catMap[cat].marcasMap[marca]) {
      catMap[cat].marcasMap[marca] = { valor: 0, quantidade: 0, registros: 0 };
    }
    catMap[cat].marcasMap[marca].valor += item.valor || 0;
    catMap[cat].marcasMap[marca].quantidade += item.quantidade || 0;
    catMap[cat].marcasMap[marca].registros += 1;

    // Produtos
    const prodKey = item.codProduto || item.descricao;
    if (!prodMap[prodKey]) {
      prodMap[prodKey] = {
        codProduto: item.codProduto,
        descricao: item.descricao,
        categoria: cat,
        marca: marca,
        unidade: item.unidade || 'UN',
        quantidade: 0,
        valor: 0,
        registros: 0,
      };
    }
    prodMap[prodKey].quantidade += item.quantidade || 0;
    prodMap[prodKey].valor += item.valor || 0;
    prodMap[prodKey].registros += 1;

    // Mensal
    if (!mesMap[mes]) {
      mesMap[mes] = { valor: 0, quantidade: 0, registros: 0 };
    }
    mesMap[mes].valor += item.valor || 0;
    mesMap[mes].quantidade += item.quantidade || 0;
    mesMap[mes].registros += 1;
  });

  datas.sort();
  const dataMinima = datas.length > 0 ? datas[0] : '-';
  const dataMaxima = datas.length > 0 ? datas[datas.length - 1] : '-';
  const periodoFormatado =
    dataMinima !== '-' && dataMaxima !== '-'
      ? `${formatarDataSimples(dataMinima)} até ${formatarDataSimples(dataMaxima)}`
      : 'Período Completo';

  const ticketMedio = totalRegistros > 0 ? valorTotal / totalRegistros : 0;

  // Processar Categorias
  const categorias: CategoriaResumo[] = Object.entries(catMap)
    .map(([catName, data]) => {
      const marcas: MarcaResumo[] = Object.entries(data.marcasMap)
        .map(([marcaName, mData]) => ({
          marca: marcaName,
          valor: mData.valor,
          quantidade: mData.quantidade,
          registros: mData.registros,
          percentualTotal: valorTotal > 0 ? (mData.valor / valorTotal) * 100 : 0,
          percentualCategoria: data.valor > 0 ? (mData.valor / data.valor) * 100 : 0,
        }))
        .sort((a, b) => b.valor - a.valor);

      return {
        categoria: catName,
        valor: data.valor,
        quantidade: data.quantidade,
        registros: data.registros,
        percentual: valorTotal > 0 ? (data.valor / valorTotal) * 100 : 0,
        marcas,
      };
    })
    .sort((a, b) => b.valor - a.valor);

  const categoriaDominante = categorias[0] || null;
  const marcasDominantes = categoriaDominante ? categoriaDominante.marcas : [];
  const marcaDominante = marcasDominantes[0] || null;

  // Marca Líder Global (entre todas as categorias)
  const marcaGlobalMap: Record<string, { marca: string; valor: number; quantidade: number }> = {};
  itens.forEach((item) => {
    const m = item.marca || classificarMarca(item.descricao);
    if (!marcaGlobalMap[m]) marcaGlobalMap[m] = { marca: m, valor: 0, quantidade: 0 };
    marcaGlobalMap[m].valor += item.valor || 0;
    marcaGlobalMap[m].quantidade += item.quantidade || 0;
  });
  const marcasGlobaisOrdenadas = Object.values(marcaGlobalMap)
    .map((m) => ({
      marca: m.marca,
      valor: m.valor,
      quantidade: m.quantidade,
      percentual: valorTotal > 0 ? (m.valor / valorTotal) * 100 : 0,
    }))
    .sort((a, b) => b.valor - a.valor);
  const marcaLiderGlobal = marcasGlobaisOrdenadas[0] || null;

  // Top Produtos
  const topProdutos: ProdutoTop[] = Object.values(prodMap)
    .map((p) => ({
      ...p,
      percentual: valorTotal > 0 ? (p.valor / valorTotal) * 100 : 0,
    }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 10);

  const top1Produto = topProdutos[0] || null;

  const top5Valor = topProdutos.slice(0, 5).reduce((acc, p) => acc + p.valor, 0);
  const top10Valor = topProdutos.reduce((acc, p) => acc + p.valor, 0);
  const concentracaoTop5 = valorTotal > 0 ? (top5Valor / valorTotal) * 100 : 0;
  const concentracaoTop10 = valorTotal > 0 ? (top10Valor / valorTotal) * 100 : 0;

  // Evolução Mensal
  const mesesOrdenados = Object.keys(mesMap).sort();
  const evolucaoMensal: MesEvolucao[] = mesesOrdenados.map((mes) => {
    const data = mesMap[mes];
    return {
      mes,
      mesFormatado: formatarMesAnoExtenso(mes),
      valor: data.valor,
      quantidade: data.quantidade,
      registros: data.registros,
      percentual: valorTotal > 0 ? (data.valor / valorTotal) * 100 : 0,
    };
  });

  const mesPico = evolucaoMensal.length > 0 ? [...evolucaoMensal].sort((a, b) => b.valor - a.valor)[0] : null;
  const mesFraco = evolucaoMensal.length > 0 ? [...evolucaoMensal].sort((a, b) => a.valor - b.valor)[0] : null;

  // Status e Operações Processadas
  const statusContagem = Object.entries(statusMap)
    .map(([status, d]) => ({
      status,
      count: d.count,
      percentual: totalRegistros > 0 ? (d.count / totalRegistros) * 100 : 0,
      valor: d.valor,
    }))
    .sort((a, b) => b.count - a.count);

  const operacoesContagem = Object.entries(opMap)
    .map(([operacao, d]) => ({
      operacao,
      count: d.count,
      percentual: totalRegistros > 0 ? (d.count / totalRegistros) * 100 : 0,
      valor: d.valor,
    }))
    .sort((a, b) => b.count - a.count);

  const mediaPrecoUnitario = quantidadeTotal > 0 ? valorTotal / quantidadeTotal : 0;

  // Resumo Textual Automático
  const catLiderNome = categoriaDominante ? `${categoriaDominante.categoria} (${categoriaDominante.percentual.toFixed(1)}%)` : '-';
  const marcaLiderNome = marcaDominante ? `${marcaDominante.marca} (${marcaDominante.percentualTotal.toFixed(1)}% do total e ${marcaDominante.percentualCategoria.toFixed(1)}% da categoria)` : '-';
  const mesPicoStr = mesPico ? `${mesPico.mesFormatado} com R$ ${mesPico.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-';
  const mesFracoStr = mesFraco ? `${mesFraco.mesFormatado} com R$ ${mesFraco.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-';
  const top10Str = `${concentracaoTop10.toFixed(1)}%`;

  const resumoTexto = `A base analisada totaliza ${totalRegistros.toLocaleString('pt-BR')} registros, movimentando ${quantidadeTotal.toLocaleString('pt-BR')} unidades com volume financeiro total de R$ ${valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} no período de ${periodoFormatado}. A categoria ${categoriaDominante?.categoria || 'Cerveja'} exerceu liderança absoluta, concentrando ${categoriaDominante?.percentual.toFixed(1)}% da receita gerada, tendo a marca ${marcaDominante?.marca || 'Brahma'} como principal propulsor (${marcaDominante?.percentualCategoria.toFixed(1)}% do segmento). O pico financeiro ocorreu em ${mesPico?.mesFormatado || 'Novembro'}, enquanto o menor faturamento foi registrado em ${mesFraco?.mesFormatado || 'Fevereiro'}. Observa-se alta concentração no portfólio, onde os 10 principais produtos representam ${top10Str} de todo o valor movimentado.`;

  return {
    totalRegistros,
    quantidadeTotal,
    valorTotal,
    ticketMedio,
    produtosUnicos: produtosSet.size,
    dataMinima,
    dataMaxima,
    periodoFormatado,
    categorias,
    categoriaDominante,
    marcasDominantes,
    marcaDominante,
    marcaLiderGlobal,
    top1Produto,
    topProdutos,
    concentracaoTop5,
    concentracaoTop10,
    statusContagem,
    operacoesContagem,
    mediaPrecoUnitario,
    evolucaoMensal,
    mesPico,
    mesFraco,
    resumoTexto,
    destaques: {
      categoriaLider: catLiderNome,
      marcaLider: marcaLiderNome,
      mesPicoNome: mesPicoStr,
      mesFracoNome: mesFracoStr,
      top10Share: top10Str,
    },
  };
}

// -------------------------------------------------------------
// Parsers & Utilitários de Data / Excel
// -------------------------------------------------------------
function formatarDataSimples(isoDate: string): string {
  if (!isoDate || isoDate === '-') return '-';
  const parts = isoDate.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return isoDate;
}

function formatarMesAnoExtenso(mesAno: string): string {
  if (!mesAno) return '-';
  const [ano, mes] = mesAno.split('-');
  const nomesMeses: Record<string, string> = {
    '01': 'Jan',
    '02': 'Fev',
    '03': 'Mar',
    '04': 'Abr',
    '05': 'Mai',
    '06': 'Jun',
    '07': 'Jul',
    '08': 'Ago',
    '09': 'Set',
    '10': 'Out',
    '11': 'Nov',
    '12': 'Dez',
  };
  return `${nomesMeses[mes] || mes}/${ano}`;
}

// Ler arquivo binário .xlsx / .xls / .csv
export function processarArquivoExcel(buffer: ArrayBuffer): ItemPlanilha[] {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  const itens: ItemPlanilha[] = [];

  rawRows.forEach((row, index) => {
    // Normalizar chaves para busca flexível
    const keys = Object.keys(row);
    const findVal = (...aliases: string[]) => {
      for (const alias of aliases) {
        const foundKey = keys.find((k) => k.trim().toLowerCase() === alias.toLowerCase());
        if (foundKey && row[foundKey] !== undefined && row[foundKey] !== '') {
          return row[foundKey];
        }
      }
      return '';
    };

    const operacao = String(findVal('operacao', 'operação', 'tipo operacao', 'tipo de operacao', 'natureza') || 'Troca Comercial');
    let dataVal = findVal('data', 'dt', 'data emissao', 'data da operacao', 'dt_movimento', 'data movimento');
    
    // Tratamento de data
    let dataStr = '2026-01-01';
    if (dataVal instanceof Date) {
      dataStr = dataVal.toISOString().slice(0, 10);
    } else if (typeof dataVal === 'string' && dataVal.includes('/')) {
      const p = dataVal.split('/');
      if (p.length === 3) {
        const dia = p[0].padStart(2, '0');
        const mes = p[1].padStart(2, '0');
        const ano = p[2].length === 2 ? `20${p[2]}` : p[2];
        dataStr = `${ano}-${mes}-${dia}`;
      }
    } else if (typeof dataVal === 'string' && dataVal.includes('-')) {
      dataStr = dataVal.slice(0, 10);
    } else if (typeof dataVal === 'number') {
      // Excel serial date
      const dateObj = new Date((dataVal - (25567 + 2)) * 86400 * 1000);
      if (!isNaN(dateObj.getTime())) {
        dataStr = dateObj.toISOString().slice(0, 10);
      }
    }

    const status = String(findVal('status', 'situacao', 'situação', 'estado') || 'Concluído');
    const codProduto = String(findVal('codigo', 'código', 'cod produto', 'codigo do produto', 'código do produto', 'sku', 'cod') || `SKU-${index + 1}`);
    const unidade = String(findVal('unidade', 'un', 'emb', 'embalagem', 'tipo unidade') || 'UN');
    const descricao = String(findVal('descricao', 'descrição', 'produto', 'nome do produto', 'item') || 'Produto sem descrição');
    
    const qtdRaw = findVal('quantidade', 'qtd', 'qtde', 'quant', 'volume un', 'quant.');
    const quantidade = typeof qtdRaw === 'number' ? qtdRaw : parseFloat(String(qtdRaw).replace(',', '.')) || 1;

    const valorRaw = findVal('valor', 'valor total', 'valor r$', 'preco total', 'total', 'faturamento', 'prejuizo r$');
    const valor = typeof valorRaw === 'number' ? valorRaw : parseFloat(String(valorRaw).replace(/[R$\s.]/g, '').replace(',', '.')) || 0;

    const categoria = classificarCategoria(descricao);
    const marca = classificarMarca(descricao);
    const mes = dataStr.slice(0, 7);

    itens.push({
      id: `PLAN-${index + 1}`,
      operacao,
      data: dataStr,
      status,
      codProduto,
      unidade,
      descricao,
      quantidade,
      valor: isNaN(valor) ? 0 : valor,
      categoria,
      marca,
      mes,
    });
  });

  return itens;
}

// Ler arquivo JSON com suporte ao formato do usuário:
// { "Operacao .": 5, "Dt. Operacao": "2025-12-31", "Emissao": "2026-01-02", "Status": "A", "Produto": 9067, "Unidade": "cx ", "Descrição": "ANTARCTICA PILSEN LAT", "Qtde": 1, "Valor": 28.95 }
export function processarArquivoJSON(conteudo: any): ItemPlanilha[] {
  let parsed: any;
  if (typeof conteudo === 'string') {
    try {
      parsed = JSON.parse(conteudo);
    } catch (e) {
      // Tentar como NDJSON (JSON Lines)
      const lines = conteudo.split('\n').map((l) => l.trim()).filter(Boolean);
      try {
        parsed = lines.map((l) => JSON.parse(l));
      } catch {
        parsed = [];
      }
    }
  } else {
    parsed = conteudo;
  }

  let rawList: any[] = [];
  if (Array.isArray(parsed)) {
    rawList = parsed;
  } else if (parsed && typeof parsed === 'object') {
    if (Array.isArray(parsed.data)) rawList = parsed.data;
    else if (Array.isArray(parsed.itens)) rawList = parsed.itens;
    else if (Array.isArray(parsed.produtos)) rawList = parsed.produtos;
    else if (Array.isArray(parsed.trocas)) rawList = parsed.trocas;
    else if (Array.isArray(parsed.records)) rawList = parsed.records;
    else if (Array.isArray(parsed.rows)) rawList = parsed.rows;
    else if (Array.isArray(parsed.dados)) rawList = parsed.dados;
    else rawList = [parsed];
  }

  const itens: ItemPlanilha[] = [];

  rawList.forEach((row, index) => {
    if (!row || typeof row !== 'object') return;
    const keys = Object.keys(row);

    const findVal = (...aliases: string[]) => {
      for (const alias of aliases) {
        const foundKey = keys.find((k) => {
          const cleanK = k.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚçÇãõÃÕ]/g, '').toLowerCase();
          const cleanAlias = alias.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚçÇãõÃÕ]/g, '').toLowerCase();
          return cleanK === cleanAlias || k.trim().toLowerCase() === alias.toLowerCase();
        });
        if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null && row[foundKey] !== '') {
          return row[foundKey];
        }
      }
      return '';
    };

    // Operação
    const opRaw = findVal('Operacao .', 'Operacao', 'Operação', 'operacao', 'natureza', 'tipo');
    let operacao = 'Troca Impróprio';
    if (opRaw !== '') {
      if (typeof opRaw === 'number' || !isNaN(Number(opRaw))) {
        operacao = `Operação ${opRaw}`;
      } else {
        operacao = String(opRaw).trim();
      }
    }

    // Data (Dt. Operacao / Emissao / data)
    let dataVal = findVal('Dt. Operacao', 'Dt Operacao', 'Data Operacao', 'Emissao', 'Emissão', 'data', 'dt');
    let dataStr = '2026-01-01';
    if (typeof dataVal === 'string') {
      const trimmed = dataVal.trim();
      if (trimmed.includes('-')) {
        dataStr = trimmed.slice(0, 10);
      } else if (trimmed.includes('/')) {
        const p = trimmed.split('/');
        if (p.length === 3) {
          const dia = p[0].padStart(2, '0');
          const mes = p[1].padStart(2, '0');
          const ano = p[2].length === 2 ? `20${p[2]}` : p[2];
          dataStr = `${ano}-${mes}-${dia}`;
        }
      }
    } else if (dataVal instanceof Date) {
      dataStr = dataVal.toISOString().slice(0, 10);
    } else if (typeof dataVal === 'number' && dataVal > 20000) {
      const dateObj = new Date((dataVal - (25567 + 2)) * 86400 * 1000);
      if (!isNaN(dateObj.getTime())) {
        dataStr = dateObj.toISOString().slice(0, 10);
      }
    }

    // Status
    const statusRaw = String(findVal('Status', 'status', 'situacao', 'situação') || 'A').trim();
    let status = statusRaw;
    if (statusRaw.toUpperCase() === 'A') status = 'Aprovado';
    else if (statusRaw.toUpperCase() === 'C') status = 'Concluído';
    else if (statusRaw.toUpperCase() === 'P') status = 'Pendente';

    // Código do Produto
    const codProdutoRaw = findVal('Produto', 'codProduto', 'codigo', 'código', 'sku', 'cod');
    const codProduto = String(codProdutoRaw || `SKU-${index + 1}`).trim();

    // Unidade
    const unidadeRaw = String(findVal('Unidade', 'unidade', 'un', 'emb') || 'CX').trim().toUpperCase();
    const unidade = unidadeRaw || 'CX';

    // Descrição
    const descRaw = String(findVal('Descrição', 'Descricao', 'descricao', 'produto_desc', 'item', 'nome') || 'Produto sem descrição').trim();

    // Quantidade
    const qtdRaw = findVal('Qtde', 'Quantidade', 'quantidade', 'qtd', 'volume');
    const quantidade = typeof qtdRaw === 'number' ? qtdRaw : parseFloat(String(qtdRaw).replace(',', '.')) || 1;

    // Valor
    const valorRaw = findVal('Valor', 'valor', 'total', 'preco', 'preco_total');
    let valor = 0;
    if (typeof valorRaw === 'number') {
      valor = valorRaw;
    } else {
      valor = parseFloat(String(valorRaw).replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
    }

    const categoria = classificarCategoria(descRaw);
    const marca = classificarMarca(descRaw);
    const mes = dataStr.slice(0, 7);

    itens.push({
      id: `JSON-${index + 1}`,
      operacao,
      data: dataStr,
      status,
      codProduto,
      unidade,
      descricao: descRaw,
      quantidade,
      valor: isNaN(valor) ? 0 : valor,
      categoria,
      marca,
      mes,
    });
  });

  return itens;
}

// Analisador Unificado para Arquivos de Troca (JSON ou Planilhas Excel / CSV)
export async function parseTrocaFile(file: File): Promise<ItemPlanilha[]> {
  const fileName = (file.name || '').toLowerCase();
  if (fileName.endsWith('.json')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const itens = processarArquivoJSON(text);
          resolve(itens);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsText(file, 'UTF-8');
    });
  } else {
    const buffer = await file.arrayBuffer();
    return processarArquivoExcel(buffer);
  }
}

// -------------------------------------------------------------
// Base Demonstrativa Inicial Completa de Vendas e Trocas de Bebidas
// -------------------------------------------------------------
export const DADOS_PLANILHA_DEMO: ItemPlanilha[] = [
  // JANEIRO 2026
  { id: 'TR-01', operacao: 'Troca Comercial', data: '2026-01-08', status: 'Concluído', codProduto: '18450', unidade: 'CX', descricao: 'CERV STELLA ARTOIS 330ML LN CX24', quantidade: 48, valor: 3840.00, categoria: 'Cerveja', marca: 'Stella Artois', mes: '2026-01' },
  { id: 'TR-02', operacao: 'Troca Comercial', data: '2026-01-12', status: 'Concluído', codProduto: '10231', unidade: 'CX', descricao: 'CERV BRAHMA DUPLO MALTE 350ML LATA CX12', quantidade: 160, valor: 4800.00, categoria: 'Cerveja', marca: 'Brahma', mes: '2026-01' },
  { id: 'TR-03', operacao: 'Troca Impróprio', data: '2026-01-15', status: 'Aprovado', codProduto: '11540', unidade: 'CX', descricao: 'CERV SPATEN MUNICH HELLES 355ML LN CX24', quantidade: 35, valor: 3150.00, categoria: 'Cerveja', marca: 'Spaten', mes: '2026-01' },
  { id: 'TR-04', operacao: 'Devolução PDV', data: '2026-01-19', status: 'Concluído', codProduto: '22104', unidade: 'FD', descricao: 'REFRI GUARANA ANTARCTICA 2L PET CX6', quantidade: 90, valor: 2520.00, categoria: 'Refrigerante', marca: 'Guaraná Antarctica', mes: '2026-01' },
  { id: 'TR-05', operacao: 'Troca Comercial', data: '2026-01-23', status: 'Concluído', codProduto: '19045', unidade: 'CX', descricao: 'CERV CORONA EXTRA 330ML LN CX24', quantidade: 30, valor: 2850.00, categoria: 'Cerveja', marca: 'Corona', mes: '2026-01' },
  { id: 'TR-06', operacao: 'Troca Comercial', data: '2026-01-27', status: 'Concluído', codProduto: '33010', unidade: 'CX', descricao: 'ENERGETICO FUSION ENERGY DRINK 250ML CX12', quantidade: 40, valor: 1440.00, categoria: 'Energético', marca: 'Fusion Energy', mes: '2026-01' },

  // FEVEREIRO 2026 (Carnaval)
  { id: 'TR-07', operacao: 'Troca Comercial', data: '2026-02-04', status: 'Concluído', codProduto: '10231', unidade: 'CX', descricao: 'CERV BRAHMA DUPLO MALTE 350ML LATA CX12', quantidade: 210, valor: 6300.00, categoria: 'Cerveja', marca: 'Brahma', mes: '2026-02' },
  { id: 'TR-08', operacao: 'Troca Comercial', data: '2026-02-09', status: 'Concluído', codProduto: '12400', unidade: 'CX', descricao: 'CERV SKOL PILSEN 350ML LATA CX12', quantidade: 140, valor: 3920.00, categoria: 'Cerveja', marca: 'Skol', mes: '2026-02' },
  { id: 'TR-09', operacao: 'Troca Impróprio', data: '2026-02-14', status: 'Concluído', codProduto: '10890', unidade: 'CX', descricao: 'CERV BUDWEISER 330ML LN CX24', quantidade: 55, valor: 4125.00, categoria: 'Cerveja', marca: 'Budweiser', mes: '2026-02' },
  { id: 'TR-10', operacao: 'Troca Comercial', data: '2026-02-18', status: 'Concluído', codProduto: '22300', unidade: 'CX', descricao: 'REFRI PEPSI BLACK 350ML LATA CX12', quantidade: 75, valor: 1875.00, categoria: 'Refrigerante', marca: 'Pepsi', mes: '2026-02' },
  { id: 'TR-11', operacao: 'Troca Comercial', data: '2026-02-22', status: 'Concluído', codProduto: '18450', unidade: 'CX', descricao: 'CERV STELLA ARTOIS 330ML LN CX24', quantidade: 42, valor: 3360.00, categoria: 'Cerveja', marca: 'Stella Artois', mes: '2026-02' },
  { id: 'TR-12', operacao: 'Devolução PDV', data: '2026-02-26', status: 'Concluído', codProduto: '44100', unidade: 'FD', descricao: 'ISOTONICO GATORADE LIMAO 500ML CX6', quantidade: 50, valor: 1250.00, categoria: 'Água & Isotônico', marca: 'Gatorade', mes: '2026-02' },

  // MARÇO 2026
  { id: 'TR-13', operacao: 'Troca Comercial', data: '2026-03-05', status: 'Concluído', codProduto: '11540', unidade: 'CX', descricao: 'CERV SPATEN MUNICH HELLES 355ML LN CX24', quantidade: 60, valor: 5400.00, categoria: 'Cerveja', marca: 'Spaten', mes: '2026-03' },
  { id: 'TR-14', operacao: 'Troca Comercial', data: '2026-03-11', status: 'Concluído', codProduto: '10231', unidade: 'CX', descricao: 'CERV BRAHMA DUPLO MALTE 350ML LATA CX12', quantidade: 180, valor: 5400.00, categoria: 'Cerveja', marca: 'Brahma', mes: '2026-03' },
  { id: 'TR-15', operacao: 'Troca Impróprio', data: '2026-03-16', status: 'Concluído', codProduto: '14100', unidade: 'CX', descricao: 'CERV ANTARCTICA ORIGINAL 600ML GF CX24', quantidade: 45, valor: 4500.00, categoria: 'Cerveja', marca: 'Antarctica Original', mes: '2026-03' },
  { id: 'TR-16', operacao: 'Troca Comercial', data: '2026-03-21', status: 'Concluído', codProduto: '22104', unidade: 'FD', descricao: 'REFRI GUARANA ANTARCTICA 2L PET CX6', quantidade: 110, valor: 3080.00, categoria: 'Refrigerante', marca: 'Guaraná Antarctica', mes: '2026-03' },
  { id: 'TR-17', operacao: 'Troca Comercial', data: '2026-03-26', status: 'Concluído', codProduto: '16200', unidade: 'CX', descricao: "CERV BECK'S PILSEN 330ML LN CX24", quantidade: 38, valor: 3420.00, categoria: 'Cerveja', marca: "Beck's", mes: '2026-03' },
  { id: 'TR-18', operacao: 'Troca Comercial', data: '2026-03-30', status: 'Concluído', codProduto: '55010', unidade: 'CX', descricao: 'BEBIDA MISTA SKOL BEATS SENSES 269ML CX8', quantidade: 55, valor: 1925.00, categoria: 'Bebidas Mistas & Beats', marca: 'Skol Beats', mes: '2026-03' },

  // ABRIL 2026
  { id: 'TR-19', operacao: 'Troca Comercial', data: '2026-04-06', status: 'Concluído', codProduto: '10231', unidade: 'CX', descricao: 'CERV BRAHMA DUPLO MALTE 350ML LATA CX12', quantidade: 175, valor: 5250.00, categoria: 'Cerveja', marca: 'Brahma', mes: '2026-04' },
  { id: 'TR-20', operacao: 'Troca Comercial', data: '2026-04-12', status: 'Concluído', codProduto: '19045', unidade: 'CX', descricao: 'CERV CORONA EXTRA 330ML LN CX24', quantidade: 50, valor: 4750.00, categoria: 'Cerveja', marca: 'Corona', mes: '2026-04' },
  { id: 'TR-21', operacao: 'Troca Comercial', data: '2026-04-18', status: 'Concluído', codProduto: '10890', unidade: 'CX', descricao: 'CERV BUDWEISER 330ML LN CX24', quantidade: 65, valor: 4875.00, categoria: 'Cerveja', marca: 'Budweiser', mes: '2026-04' },
  { id: 'TR-22', operacao: 'Troca Impróprio', data: '2026-04-23', status: 'Concluído', codProduto: '22104', unidade: 'FD', descricao: 'REFRI GUARANA ANTARCTICA 2L PET CX6', quantidade: 85, valor: 2380.00, categoria: 'Refrigerante', marca: 'Guaraná Antarctica', mes: '2026-04' },
  { id: 'TR-23', operacao: 'Troca Comercial', data: '2026-04-28', status: 'Concluído', codProduto: '33010', unidade: 'CX', descricao: 'ENERGETICO FUSION ENERGY DRINK 250ML CX12', quantidade: 50, valor: 1800.00, categoria: 'Energético', marca: 'Fusion Energy', mes: '2026-04' },

  // MAIO 2026
  { id: 'TR-24', operacao: 'Troca Comercial', data: '2026-05-04', status: 'Concluído', codProduto: '18450', unidade: 'CX', descricao: 'CERV STELLA ARTOIS 330ML LN CX24', quantidade: 65, valor: 5200.00, categoria: 'Cerveja', marca: 'Stella Artois', mes: '2026-05' },
  { id: 'TR-25', operacao: 'Troca Comercial', data: '2026-05-10', status: 'Concluído', codProduto: '11540', unidade: 'CX', descricao: 'CERV SPATEN MUNICH HELLES 355ML LN CX24', quantidade: 55, valor: 4950.00, categoria: 'Cerveja', marca: 'Spaten', mes: '2026-05' },
  { id: 'TR-26', operacao: 'Troca Comercial', data: '2026-05-15', status: 'Concluído', codProduto: '10231', unidade: 'CX', descricao: 'CERV BRAHMA DUPLO MALTE 350ML LATA CX12', quantidade: 190, valor: 5700.00, categoria: 'Cerveja', marca: 'Brahma', mes: '2026-05' },
  { id: 'TR-27', operacao: 'Troca Impróprio', data: '2026-05-20', status: 'Concluído', codProduto: '17100', unidade: 'CX', descricao: 'CERV BOHEMIA PURO MALTE 350ML LATA CX12', quantidade: 70, valor: 1960.00, categoria: 'Cerveja', marca: 'Bohemia', mes: '2026-05' },
  { id: 'TR-28', operacao: 'Troca Comercial', data: '2026-05-26', status: 'Concluído', codProduto: '22300', unidade: 'CX', descricao: 'REFRI PEPSI BLACK 350ML LATA CX12', quantidade: 95, valor: 2375.00, categoria: 'Refrigerante', marca: 'Pepsi', mes: '2026-05' },
  { id: 'TR-29', operacao: 'Devolução PDV', data: '2026-05-30', status: 'Concluído', codProduto: '66100', unidade: 'CX', descricao: 'SUCO DO BEM LARANJA INTEGRAL 1L CX12', quantidade: 40, valor: 1520.00, categoria: 'Suco & Chá', marca: 'do bem™', mes: '2026-05' },

  // JUNHO 2026 (São João & Inverno)
  { id: 'TR-30', operacao: 'Troca Comercial', data: '2026-06-05', status: 'Concluído', codProduto: '10231', unidade: 'CX', descricao: 'CERV BRAHMA DUPLO MALTE 350ML LATA CX12', quantidade: 240, valor: 7200.00, categoria: 'Cerveja', marca: 'Brahma', mes: '2026-06' },
  { id: 'TR-31', operacao: 'Troca Comercial', data: '2026-06-11', status: 'Concluído', codProduto: '19045', unidade: 'CX', descricao: 'CERV CORONA EXTRA 330ML LN CX24', quantidade: 60, valor: 5700.00, categoria: 'Cerveja', marca: 'Corona', mes: '2026-06' },
  { id: 'TR-32', operacao: 'Troca Impróprio', data: '2026-06-16', status: 'Concluído', codProduto: '14100', unidade: 'CX', descricao: 'CERV ANTARCTICA ORIGINAL 600ML GF CX24', quantidade: 60, valor: 6000.00, categoria: 'Cerveja', marca: 'Antarctica Original', mes: '2026-06' },
  { id: 'TR-33', operacao: 'Troca Comercial', data: '2026-06-22', status: 'Concluído', codProduto: '11540', unidade: 'CX', descricao: 'CERV SPATEN MUNICH HELLES 355ML LN CX24', quantidade: 70, valor: 6300.00, categoria: 'Cerveja', marca: 'Spaten', mes: '2026-06' },
  { id: 'TR-34', operacao: 'Troca Comercial', data: '2026-06-27', status: 'Concluído', codProduto: '22104', unidade: 'FD', descricao: 'REFRI GUARANA ANTARCTICA 2L PET CX6', quantidade: 130, valor: 3640.00, categoria: 'Refrigerante', marca: 'Guaraná Antarctica', mes: '2026-06' },

  // JULHO 2026
  { id: 'TR-35', operacao: 'Troca Comercial', data: '2026-07-03', status: 'Concluído', codProduto: '18450', unidade: 'CX', descricao: 'CERV STELLA ARTOIS 330ML LN CX24', quantidade: 75, valor: 6000.00, categoria: 'Cerveja', marca: 'Stella Artois', mes: '2026-07' },
  { id: 'TR-36', operacao: 'Troca Comercial', data: '2026-07-09', status: 'Concluído', codProduto: '10231', unidade: 'CX', descricao: 'CERV BRAHMA DUPLO MALTE 350ML LATA CX12', quantidade: 200, valor: 6000.00, categoria: 'Cerveja', marca: 'Brahma', mes: '2026-07' },
  { id: 'TR-37', operacao: 'Troca Comercial', data: '2026-07-15', status: 'Concluído', codProduto: '10890', unidade: 'CX', descricao: 'CERV BUDWEISER 330ML LN CX24', quantidade: 70, valor: 5250.00, categoria: 'Cerveja', marca: 'Budweiser', mes: '2026-07' },
  { id: 'TR-38', operacao: 'Troca Impróprio', data: '2026-07-21', status: 'Concluído', codProduto: '18200', unidade: 'CX', descricao: 'CERV COLORADO APPIA 600ML GF CX12', quantidade: 35, valor: 2800.00, categoria: 'Cerveja', marca: 'Colorado', mes: '2026-07' },
  { id: 'TR-39', operacao: 'Troca Comercial', data: '2026-07-27', status: 'Concluído', codProduto: '44100', unidade: 'FD', descricao: 'ISOTONICO GATORADE LIMAO 500ML CX6', quantidade: 80, valor: 2000.00, categoria: 'Água & Isotônico', marca: 'Gatorade', mes: '2026-07' },

  // AGOSTO 2026
  { id: 'TR-40', operacao: 'Troca Comercial', data: '2026-08-04', status: 'Concluído', codProduto: '11540', unidade: 'CX', descricao: 'CERV SPATEN MUNICH HELLES 355ML LN CX24', quantidade: 80, valor: 7200.00, categoria: 'Cerveja', marca: 'Spaten', mes: '2026-08' },
  { id: 'TR-41', operacao: 'Troca Comercial', data: '2026-08-08', status: 'Concluído', codProduto: '10231', unidade: 'CX', descricao: 'CERV BRAHMA DUPLO MALTE 350ML LATA CX12', quantidade: 220, valor: 6600.00, categoria: 'Cerveja', marca: 'Brahma', mes: '2026-08' },
  { id: 'TR-42', operacao: 'Troca Comercial', data: '2026-08-11', status: 'Concluído', codProduto: '19045', unidade: 'CX', descricao: 'CERV CORONA EXTRA 330ML LN CX24', quantidade: 70, valor: 6650.00, categoria: 'Cerveja', marca: 'Corona', mes: '2026-08' },
  { id: 'TR-43', operacao: 'Troca Impróprio', data: '2026-08-13', status: 'Concluído', codProduto: '22104', unidade: 'FD', descricao: 'REFRI GUARANA ANTARCTICA 2L PET CX6', quantidade: 140, valor: 3920.00, categoria: 'Refrigerante', marca: 'Guaraná Antarctica', mes: '2026-08' },
  { id: 'TR-44', operacao: 'Troca Comercial', data: '2026-08-14', status: 'Concluído', codProduto: '33010', unidade: 'CX', descricao: 'ENERGETICO FUSION ENERGY DRINK 250ML CX12', quantidade: 60, valor: 2160.00, categoria: 'Energético', marca: 'Fusion Energy', mes: '2026-08' },
];
