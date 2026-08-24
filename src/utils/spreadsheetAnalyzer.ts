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
  {
    "id": "JSON-1",
    "operacao": "Operação 39",
    "data": "2026-01-06",
    "status": "Aprovado",
    "codProduto": "21526",
    "unidade": "UN",
    "descricao": "JOHNNIE WALKER RED LA",
    "quantidade": 1,
    "valor": 111.9,
    "categoria": "Outros Produtos",
    "marca": "Outras Marcas",
    "mes": "2026-01"
  },
  {
    "id": "JSON-2",
    "operacao": "Operação 39",
    "data": "2026-01-06",
    "status": "Aprovado",
    "codProduto": "25160",
    "unidade": "UN",
    "descricao": "BLACK & WHITE WHISKY",
    "quantidade": 1,
    "valor": 76.48,
    "categoria": "Outros Produtos",
    "marca": "Outras Marcas",
    "mes": "2026-01"
  },
  {
    "id": "JSON-3",
    "operacao": "Operação 39",
    "data": "2026-01-08",
    "status": "Aprovado",
    "codProduto": "13205",
    "unidade": "UN",
    "descricao": "SKOL GFA VD 300ML CX",
    "quantidade": 1,
    "valor": 2.61,
    "categoria": "Cerveja",
    "marca": "Skol",
    "mes": "2026-01"
  },
  {
    "id": "JSON-4",
    "operacao": "Operação 39",
    "data": "2026-01-09",
    "status": "Aprovado",
    "codProduto": "9068",
    "unidade": "CX",
    "descricao": "SKOL LATA 350ML SH C/",
    "quantidade": 1,
    "valor": 51.15,
    "categoria": "Cerveja",
    "marca": "Skol",
    "mes": "2026-01"
  },
  {
    "id": "JSON-5",
    "operacao": "Operação 39",
    "data": "2026-01-09",
    "status": "Aprovado",
    "codProduto": "26037",
    "unidade": "UN",
    "descricao": "MONTILLA CARTA CRISTA",
    "quantidade": 1,
    "valor": 35.9,
    "categoria": "Outros Produtos",
    "marca": "Outras Marcas",
    "mes": "2026-01"
  },
  {
    "id": "JSON-6",
    "operacao": "Operação 39",
    "data": "2026-01-12",
    "status": "Aprovado",
    "codProduto": "13205",
    "unidade": "UN",
    "descricao": "SKOL GFA VD 300ML CX",
    "quantidade": 1,
    "valor": 2.61,
    "categoria": "Cerveja",
    "marca": "Skol",
    "mes": "2026-01"
  },
  {
    "id": "JSON-7",
    "operacao": "Operação 39",
    "data": "2026-01-12",
    "status": "Aprovado",
    "codProduto": "982",
    "unidade": "UN",
    "descricao": "SKOL 600ML",
    "quantidade": 1,
    "valor": 11.68,
    "categoria": "Cerveja",
    "marca": "Skol",
    "mes": "2026-01"
  },
  {
    "id": "JSON-8",
    "operacao": "Operação 39",
    "data": "2026-01-12",
    "status": "Aprovado",
    "codProduto": "35331",
    "unidade": "UN",
    "descricao": "BUDWEISER GFA VD 1L",
    "quantidade": 1,
    "valor": 10.91,
    "categoria": "Cerveja",
    "marca": "Budweiser",
    "mes": "2026-01"
  },
  {
    "id": "JSON-9",
    "operacao": "Operação 39",
    "data": "2026-01-12",
    "status": "Aprovado",
    "codProduto": "13205",
    "unidade": "UN",
    "descricao": "SKOL GFA VD 300ML CX",
    "quantidade": 1,
    "valor": 2.61,
    "categoria": "Cerveja",
    "marca": "Skol",
    "mes": "2026-01"
  },
  {
    "id": "JSON-10",
    "operacao": "Operação 39",
    "data": "2026-01-13",
    "status": "Aprovado",
    "codProduto": "988",
    "unidade": "UN",
    "descricao": "BRAHMA CHOPP 600ML",
    "quantidade": 2,
    "valor": 12.67,
    "categoria": "Cerveja",
    "marca": "Brahma",
    "mes": "2026-01"
  },
  {
    "id": "JSON-11",
    "operacao": "Operação 39",
    "data": "2026-01-14",
    "status": "Aprovado",
    "codProduto": "17808",
    "unidade": "UN",
    "descricao": "BUDWEISER OW 330ML CX",
    "quantidade": 2,
    "valor": 12.5,
    "categoria": "Cerveja",
    "marca": "Budweiser",
    "mes": "2026-01"
  },
  {
    "id": "JSON-12",
    "operacao": "Operação 39",
    "data": "2026-01-12",
    "status": "Aprovado",
    "codProduto": "2548",
    "unidade": "UN",
    "descricao": "BUDWEISER 600ML",
    "quantidade": 9,
    "valor": 112.5,
    "categoria": "Cerveja",
    "marca": "Budweiser",
    "mes": "2026-01"
  },
  {
    "id": "JSON-13",
    "operacao": "Operação 39",
    "data": "2026-01-15",
    "status": "Aprovado",
    "codProduto": "20530",
    "unidade": "UN",
    "descricao": "STELLA ARTOIS 600 ML",
    "quantidade": 1,
    "valor": 8.33,
    "categoria": "Cerveja",
    "marca": "Stella Artois",
    "mes": "2026-01"
  },
  {
    "id": "JSON-14",
    "operacao": "Operação 39",
    "data": "2026-01-15",
    "status": "Aprovado",
    "codProduto": "988",
    "unidade": "UN",
    "descricao": "BRAHMA CHOPP 600ML",
    "quantidade": 1,
    "valor": 6.33,
    "categoria": "Cerveja",
    "marca": "Brahma",
    "mes": "2026-01"
  },
  {
    "id": "JSON-15",
    "operacao": "Operação 39",
    "data": "2026-01-16",
    "status": "Aprovado",
    "codProduto": "26037",
    "unidade": "UN",
    "descricao": "MONTILLA CARTA CRISTA",
    "quantidade": 1,
    "valor": 35.9,
    "categoria": "Outros Produtos",
    "marca": "Outras Marcas",
    "mes": "2026-01"
  },
  {
    "id": "JSON-16",
    "operacao": "Operação 39",
    "data": "2026-01-16",
    "status": "Aprovado",
    "codProduto": "982",
    "unidade": "UN",
    "descricao": "SKOL 600ML",
    "quantidade": 1,
    "valor": 11.68,
    "categoria": "Cerveja",
    "marca": "Skol",
    "mes": "2026-01"
  },
  {
    "id": "JSON-17",
    "operacao": "Operação 39",
    "data": "2026-01-16",
    "status": "Aprovado",
    "codProduto": "17808",
    "unidade": "UN",
    "descricao": "BUDWEISER OW 330ML CX",
    "quantidade": 1,
    "valor": 6.25,
    "categoria": "Cerveja",
    "marca": "Budweiser",
    "mes": "2026-01"
  },
  {
    "id": "JSON-18",
    "operacao": "Operação 39",
    "data": "2026-01-21",
    "status": "Aprovado",
    "codProduto": "9067",
    "unidade": "UN",
    "descricao": "ANTARCTICA PILSEN LAT",
    "quantidade": 1,
    "valor": 5,
    "categoria": "Cerveja",
    "marca": "Antarctica",
    "mes": "2026-01"
  },
  {
    "id": "JSON-19",
    "operacao": "Operação 39",
    "data": "2026-01-22",
    "status": "Aprovado",
    "codProduto": "2538",
    "unidade": "UN",
    "descricao": "ANTARCTICA PILSEN 600",
    "quantidade": 1,
    "valor": 16.51,
    "categoria": "Cerveja",
    "marca": "Antarctica",
    "mes": "2026-01"
  },
  {
    "id": "JSON-20",
    "operacao": "Operação 39",
    "data": "2026-01-22",
    "status": "Aprovado",
    "codProduto": "1743",
    "unidade": "UN",
    "descricao": "ANTARCTICA PILSEN GFA",
    "quantidade": 2,
    "valor": 18.42,
    "categoria": "Cerveja",
    "marca": "Antarctica",
    "mes": "2026-01"
  },
  {
    "id": "JSON-21",
    "operacao": "Operação 39",
    "data": "2026-01-26",
    "status": "Aprovado",
    "codProduto": "1695",
    "unidade": "UN",
    "descricao": "BRAHMA CHOPP GFA VD 1",
    "quantidade": 1,
    "valor": 7.58,
    "categoria": "Cerveja",
    "marca": "Brahma",
    "mes": "2026-01"
  },
  {
    "id": "JSON-22",
    "operacao": "Operação 39",
    "data": "2026-01-27",
    "status": "Aprovado",
    "codProduto": "2548",
    "unidade": "UN",
    "descricao": "BUDWEISER 600ML",
    "quantidade": 4,
    "valor": 50,
    "categoria": "Cerveja",
    "marca": "Budweiser",
    "mes": "2026-01"
  },
  {
    "id": "JSON-23",
    "operacao": "Operação 39",
    "data": "2026-01-28",
    "status": "Aprovado",
    "codProduto": "2548",
    "unidade": "UN",
    "descricao": "BUDWEISER 600ML",
    "quantidade": 1,
    "valor": 12.5,
    "categoria": "Cerveja",
    "marca": "Budweiser",
    "mes": "2026-01"
  },
  {
    "id": "JSON-24",
    "operacao": "Operação 39",
    "data": "2026-02-07",
    "status": "Aprovado",
    "codProduto": "22180",
    "unidade": "UN",
    "descricao": "BUDWEISER ZERO LONG N",
    "quantidade": 1,
    "valor": 6.25,
    "categoria": "Cerveja",
    "marca": "Budweiser",
    "mes": "2026-02"
  },
  {
    "id": "JSON-25",
    "operacao": "Operação 39",
    "data": "2026-02-09",
    "status": "Aprovado",
    "codProduto": "2546",
    "unidade": "UN",
    "descricao": "ORIGINAL 600ML",
    "quantidade": 2,
    "valor": 15.83,
    "categoria": "Bebidas Mistas & Beats",
    "marca": "Antarctica Original",
    "mes": "2026-02"
  },
  {
    "id": "JSON-26",
    "operacao": "Operação 39",
    "data": "2026-02-09",
    "status": "Aprovado",
    "codProduto": "2548",
    "unidade": "UN",
    "descricao": "BUDWEISER 600ML",
    "quantidade": 2,
    "valor": 25,
    "categoria": "Cerveja",
    "marca": "Budweiser",
    "mes": "2026-02"
  },
  {
    "id": "JSON-27",
    "operacao": "Operação 39",
    "data": "2026-02-10",
    "status": "Aprovado",
    "codProduto": "20530",
    "unidade": "UN",
    "descricao": "STELLA ARTOIS 600 ML",
    "quantidade": 1,
    "valor": 8.33,
    "categoria": "Cerveja",
    "marca": "Stella Artois",
    "mes": "2026-02"
  },
  {
    "id": "JSON-28",
    "operacao": "Operação 39",
    "data": "2026-02-12",
    "status": "Aprovado",
    "codProduto": "23186",
    "unidade": "UN",
    "descricao": "SPATEN N 600ML",
    "quantidade": 1,
    "valor": 12.49,
    "categoria": "Cerveja",
    "marca": "Spaten",
    "mes": "2026-02"
  },
  {
    "id": "JSON-29",
    "operacao": "Operação 39",
    "data": "2026-02-19",
    "status": "Aprovado",
    "codProduto": "9067",
    "unidade": "UN",
    "descricao": "ANTARCTICA PILSEN LAT",
    "quantidade": 1,
    "valor": 5,
    "categoria": "Cerveja",
    "marca": "Antarctica",
    "mes": "2026-02"
  },
  {
    "id": "JSON-30",
    "operacao": "Operação 39",
    "data": "2026-02-24",
    "status": "Aprovado",
    "codProduto": "9067",
    "unidade": "CX",
    "descricao": "ANTARCTICA PILSEN LAT",
    "quantidade": 1,
    "valor": 60,
    "categoria": "Cerveja",
    "marca": "Antarctica",
    "mes": "2026-02"
  },
  {
    "id": "JSON-31",
    "operacao": "Operação 39",
    "data": "2026-02-26",
    "status": "Aprovado",
    "codProduto": "1695",
    "unidade": "UN",
    "descricao": "BRAHMA CHOPP GFA VD 1",
    "quantidade": 2,
    "valor": 15.17,
    "categoria": "Cerveja",
    "marca": "Brahma",
    "mes": "2026-02"
  },
  {
    "id": "JSON-32",
    "operacao": "Operação 39",
    "data": "2026-02-26",
    "status": "Aprovado",
    "codProduto": "1743",
    "unidade": "UN",
    "descricao": "ANTARCTICA PILSEN GFA",
    "quantidade": 4,
    "valor": 36.83,
    "categoria": "Cerveja",
    "marca": "Antarctica",
    "mes": "2026-02"
  },
  {
    "id": "JSON-33",
    "operacao": "Operação 39",
    "data": "2026-03-02",
    "status": "Aprovado",
    "codProduto": "2538",
    "unidade": "UN",
    "descricao": "ANTARCTICA PILSEN 600",
    "quantidade": 2,
    "valor": 33.03,
    "categoria": "Cerveja",
    "marca": "Antarctica",
    "mes": "2026-03"
  },
  {
    "id": "JSON-34",
    "operacao": "Operação 39",
    "data": "2026-03-05",
    "status": "Aprovado",
    "codProduto": "982",
    "unidade": "UN",
    "descricao": "SKOL 600ML",
    "quantidade": 2,
    "valor": 23.35,
    "categoria": "Cerveja",
    "marca": "Skol",
    "mes": "2026-03"
  },
  {
    "id": "JSON-35",
    "operacao": "Operação 39",
    "data": "2026-03-05",
    "status": "Aprovado",
    "codProduto": "988",
    "unidade": "UN",
    "descricao": "BRAHMA CHOPP 600ML",
    "quantidade": 1,
    "valor": 6.33,
    "categoria": "Cerveja",
    "marca": "Brahma",
    "mes": "2026-03"
  },
  {
    "id": "JSON-36",
    "operacao": "Operação 39",
    "data": "2026-03-05",
    "status": "Aprovado",
    "codProduto": "13205",
    "unidade": "UN",
    "descricao": "SKOL GFA VD 300ML CX",
    "quantidade": 1,
    "valor": 2.61,
    "categoria": "Cerveja",
    "marca": "Skol",
    "mes": "2026-03"
  },
  {
    "id": "JSON-37",
    "operacao": "Operação 39",
    "data": "2026-03-06",
    "status": "Aprovado",
    "codProduto": "13205",
    "unidade": "UN",
    "descricao": "SKOL GFA VD 300ML CX",
    "quantidade": 1,
    "valor": 2.61,
    "categoria": "Cerveja",
    "marca": "Skol",
    "mes": "2026-03"
  },
  {
    "id": "JSON-38",
    "operacao": "Operação 39",
    "data": "2026-03-09",
    "status": "Aprovado",
    "codProduto": "2538",
    "unidade": "UN",
    "descricao": "ANTARCTICA PILSEN 600",
    "quantidade": 1,
    "valor": 16.51,
    "categoria": "Cerveja",
    "marca": "Antarctica",
    "mes": "2026-03"
  },
  {
    "id": "JSON-39",
    "operacao": "Operação 39",
    "data": "2026-03-09",
    "status": "Aprovado",
    "codProduto": "988",
    "unidade": "UN",
    "descricao": "BRAHMA CHOPP 600ML",
    "quantidade": 1,
    "valor": 6.33,
    "categoria": "Cerveja",
    "marca": "Brahma",
    "mes": "2026-03"
  },
  {
    "id": "JSON-40",
    "operacao": "Operação 39",
    "data": "2026-03-09",
    "status": "Aprovado",
    "codProduto": "2538",
    "unidade": "UN",
    "descricao": "ANTARCTICA PILSEN 600",
    "quantidade": 2,
    "valor": 33.03,
    "categoria": "Cerveja",
    "marca": "Antarctica",
    "mes": "2026-03"
  },
  {
    "id": "JSON-41",
    "operacao": "Operação 39",
    "data": "2026-03-10",
    "status": "Aprovado",
    "codProduto": "2538",
    "unidade": "UN",
    "descricao": "ANTARCTICA PILSEN 600",
    "quantidade": 3,
    "valor": 49.54,
    "categoria": "Cerveja",
    "marca": "Antarctica",
    "mes": "2026-03"
  },
  {
    "id": "JSON-42",
    "operacao": "Operação 39",
    "data": "2026-03-10",
    "status": "Aprovado",
    "codProduto": "21530",
    "unidade": "UN",
    "descricao": "SMIRNOFF ORIGINAL GAR",
    "quantidade": 1,
    "valor": 41.48,
    "categoria": "Bebidas Mistas & Beats",
    "marca": "Antarctica Original",
    "mes": "2026-03"
  },
  {
    "id": "JSON-43",
    "operacao": "Operação 39",
    "data": "2026-03-10",
    "status": "Aprovado",
    "codProduto": "2538",
    "unidade": "UN",
    "descricao": "ANTARCTICA PILSEN 600",
    "quantidade": 1,
    "valor": 16.51,
    "categoria": "Cerveja",
    "marca": "Antarctica",
    "mes": "2026-03"
  },
  {
    "id": "JSON-44",
    "operacao": "Operação 39",
    "data": "2026-03-10",
    "status": "Aprovado",
    "codProduto": "982",
    "unidade": "UN",
    "descricao": "SKOL 600ML",
    "quantidade": 1,
    "valor": 11.68,
    "categoria": "Cerveja",
    "marca": "Skol",
    "mes": "2026-03"
  },
  {
    "id": "JSON-45",
    "operacao": "Operação 39",
    "data": "2026-03-10",
    "status": "Aprovado",
    "codProduto": "982",
    "unidade": "UN",
    "descricao": "SKOL 600ML",
    "quantidade": 2,
    "valor": 23.35,
    "categoria": "Cerveja",
    "marca": "Skol",
    "mes": "2026-03"
  },
  {
    "id": "JSON-46",
    "operacao": "Operação 39",
    "data": "2026-03-10",
    "status": "Aprovado",
    "codProduto": "23186",
    "unidade": "UN",
    "descricao": "SPATEN N 600ML",
    "quantidade": 1,
    "valor": 12.49,
    "categoria": "Cerveja",
    "marca": "Spaten",
    "mes": "2026-03"
  },
  {
    "id": "JSON-47",
    "operacao": "Operação 39",
    "data": "2026-03-11",
    "status": "Aprovado",
    "codProduto": "9068",
    "unidade": "CX",
    "descricao": "SKOL LATA 350ML SH C/",
    "quantidade": 1,
    "valor": 51.15,
    "categoria": "Cerveja",
    "marca": "Skol",
    "mes": "2026-03"
  },
  {
    "id": "JSON-48",
    "operacao": "Operação 39",
    "data": "2026-03-12",
    "status": "Aprovado",
    "codProduto": "18807",
    "unidade": "UN",
    "descricao": "STELLA ARTOIS LONG NE",
    "quantidade": 1,
    "valor": 7.7,
    "categoria": "Cerveja",
    "marca": "Stella Artois",
    "mes": "2026-03"
  },
  {
    "id": "JSON-49",
    "operacao": "Operação 39",
    "data": "2026-03-16",
    "status": "Aprovado",
    "codProduto": "2548",
    "unidade": "UN",
    "descricao": "BUDWEISER 600ML",
    "quantidade": 1,
    "valor": 12.5,
    "categoria": "Cerveja",
    "marca": "Budweiser",
    "mes": "2026-03"
  },
  {
    "id": "JSON-50",
    "operacao": "Operação 39",
    "data": "2026-03-16",
    "status": "Aprovado",
    "codProduto": "13205",
    "unidade": "UN",
    "descricao": "SKOL GFA VD 300ML CX",
    "quantidade": 1,
    "valor": 2.61,
    "categoria": "Cerveja",
    "marca": "Skol",
    "mes": "2026-03"
  },
  {
    "id": "JSON-51",
    "operacao": "Operação 39",
    "data": "2026-03-16",
    "status": "Aprovado",
    "codProduto": "34608",
    "unidade": "CX",
    "descricao": "SKOL LATA 350ML SH C/",
    "quantidade": 1,
    "valor": 40.68,
    "categoria": "Cerveja",
    "marca": "Skol",
    "mes": "2026-03"
  },
  {
    "id": "JSON-52",
    "operacao": "Operação 39",
    "data": "2026-03-18",
    "status": "Aprovado",
    "codProduto": "19164",
    "unidade": "CX",
    "descricao": "GUARANA CHP ANTARCTIC",
    "quantidade": 2,
    "valor": 28.8,
    "categoria": "Refrigerante",
    "marca": "Guaraná Antarctica",
    "mes": "2026-03"
  },
  {
    "id": "JSON-53",
    "operacao": "Operação 39",
    "data": "2026-03-18",
    "status": "Aprovado",
    "codProduto": "982",
    "unidade": "UN",
    "descricao": "SKOL 600ML",
    "quantidade": 1,
    "valor": 11.68,
    "categoria": "Cerveja",
    "marca": "Skol",
    "mes": "2026-03"
  },
  {
    "id": "JSON-54",
    "operacao": "Operação 39",
    "data": "2026-03-18",
    "status": "Aprovado",
    "codProduto": "2548",
    "unidade": "UN",
    "descricao": "BUDWEISER 600ML",
    "quantidade": 1,
    "valor": 12.5,
    "categoria": "Cerveja",
    "marca": "Budweiser",
    "mes": "2026-03"
  },
  {
    "id": "JSON-55",
    "operacao": "Operação 39",
    "data": "2026-03-19",
    "status": "Aprovado",
    "codProduto": "9067",
    "unidade": "CX",
    "descricao": "ANTARCTICA PILSEN LAT",
    "quantidade": 1,
    "valor": 60,
    "categoria": "Cerveja",
    "marca": "Antarctica",
    "mes": "2026-03"
  },
  {
    "id": "JSON-56",
    "operacao": "Operação 39",
    "data": "2026-03-23",
    "status": "Aprovado",
    "codProduto": "34475",
    "unidade": "CX",
    "descricao": "ELEVE AGUA MIN S GAS",
    "quantidade": 1,
    "valor": 18.96,
    "categoria": "Água & Isotônico",
    "marca": "Outras Marcas",
    "mes": "2026-03"
  },
  {
    "id": "JSON-57",
    "operacao": "Operação 39",
    "data": "2026-03-24",
    "status": "Aprovado",
    "codProduto": "2319",
    "unidade": "UN",
    "descricao": "GUARANA CHP ANTARCTIC",
    "quantidade": 1,
    "valor": 4.83,
    "categoria": "Refrigerante",
    "marca": "Guaraná Antarctica",
    "mes": "2026-03"
  },
  {
    "id": "JSON-58",
    "operacao": "Operação 39",
    "data": "2026-03-24",
    "status": "Aprovado",
    "codProduto": "2548",
    "unidade": "UN",
    "descricao": "BUDWEISER 600ML",
    "quantidade": 4,
    "valor": 50,
    "categoria": "Cerveja",
    "marca": "Budweiser",
    "mes": "2026-03"
  },
  {
    "id": "JSON-59",
    "operacao": "Operação 39",
    "data": "2026-03-25",
    "status": "Aprovado",
    "codProduto": "988",
    "unidade": "UN",
    "descricao": "BRAHMA CHOPP 600ML",
    "quantidade": 1,
    "valor": 6.33,
    "categoria": "Cerveja",
    "marca": "Brahma",
    "mes": "2026-03"
  },
  {
    "id": "JSON-60",
    "operacao": "Operação 39",
    "data": "2026-03-25",
    "status": "Aprovado",
    "codProduto": "2548",
    "unidade": "UN",
    "descricao": "BUDWEISER 600ML",
    "quantidade": 1,
    "valor": 12.5,
    "categoria": "Cerveja",
    "marca": "Budweiser",
    "mes": "2026-03"
  },
  {
    "id": "JSON-61",
    "operacao": "Operação 39",
    "data": "2026-03-27",
    "status": "Aprovado",
    "codProduto": "1695",
    "unidade": "UN",
    "descricao": "BRAHMA CHOPP GFA VD 1",
    "quantidade": 1,
    "valor": 7.58,
    "categoria": "Cerveja",
    "marca": "Brahma",
    "mes": "2026-03"
  },
  {
    "id": "JSON-62",
    "operacao": "Operação 39",
    "data": "2026-03-27",
    "status": "Aprovado",
    "codProduto": "18836",
    "unidade": "UN",
    "descricao": "CORONA EXTRA N LONG N",
    "quantidade": 1,
    "valor": 7.71,
    "categoria": "Cerveja",
    "marca": "Corona",
    "mes": "2026-03"
  },
  {
    "id": "JSON-63",
    "operacao": "Operação 39",
    "data": "2026-03-28",
    "status": "Aprovado",
    "codProduto": "2548",
    "unidade": "UN",
    "descricao": "BUDWEISER 600ML",
    "quantidade": 1,
    "valor": 12.5,
    "categoria": "Cerveja",
    "marca": "Budweiser",
    "mes": "2026-03"
  },
  {
    "id": "JSON-64",
    "operacao": "Operação 39",
    "data": "2026-03-30",
    "status": "Aprovado",
    "codProduto": "13205",
    "unidade": "UN",
    "descricao": "SKOL GFA VD 300ML CX",
    "quantidade": 8,
    "valor": 20.87,
    "categoria": "Cerveja",
    "marca": "Skol",
    "mes": "2026-03"
  },
  {
    "id": "JSON-65",
    "operacao": "Operação 39",
    "data": "2026-03-31",
    "status": "Aprovado",
    "codProduto": "13201",
    "unidade": "UN",
    "descricao": "BRAHMA CHOPP GFA VD 3",
    "quantidade": 1,
    "valor": 3.04,
    "categoria": "Cerveja",
    "marca": "Brahma",
    "mes": "2026-03"
  },
  {
    "id": "JSON-66",
    "operacao": "Operação 39",
    "data": "2026-04-01",
    "status": "Aprovado",
    "codProduto": "1695",
    "unidade": "UN",
    "descricao": "BRAHMA CHOPP GFA VD 1",
    "quantidade": 1,
    "valor": 7.58,
    "categoria": "Cerveja",
    "marca": "Brahma",
    "mes": "2026-04"
  },
  {
    "id": "JSON-67",
    "operacao": "Operação 39",
    "data": "2026-04-01",
    "status": "Aprovado",
    "codProduto": "18266",
    "unidade": "CX",
    "descricao": "PEPSI COLA PET 200ML",
    "quantidade": 1,
    "valor": 20,
    "categoria": "Refrigerante",
    "marca": "Pepsi",
    "mes": "2026-04"
  },
  {
    "id": "JSON-68",
    "operacao": "Operação 39",
    "data": "2026-04-01",
    "status": "Aprovado",
    "codProduto": "9067",
    "unidade": "CX",
    "descricao": "ANTARCTICA PILSEN LAT",
    "quantidade": 1,
    "valor": 60,
    "categoria": "Cerveja",
    "marca": "Antarctica",
    "mes": "2026-04"
  },
  {
    "id": "JSON-69",
    "operacao": "Operação 39",
    "data": "2026-04-01",
    "status": "Aprovado",
    "codProduto": "22382",
    "unidade": "UN",
    "descricao": "PASSPORT SELECTION GA",
    "quantidade": 1,
    "valor": 71.8,
    "categoria": "Outros Produtos",
    "marca": "Outras Marcas",
    "mes": "2026-04"
  },
  {
    "id": "JSON-70",
    "operacao": "Operação 39",
    "data": "2026-04-06",
    "status": "Aprovado",
    "codProduto": "13205",
    "unidade": "UN",
    "descricao": "SKOL GFA VD 300ML CX",
    "quantidade": 1,
    "valor": 2.61,
    "categoria": "Cerveja",
    "marca": "Skol",
    "mes": "2026-04"
  },
  {
    "id": "JSON-71",
    "operacao": "Operação 39",
    "data": "2026-04-07",
    "status": "Aprovado",
    "codProduto": "20530",
    "unidade": "UN",
    "descricao": "STELLA ARTOIS 600 ML",
    "quantidade": 2,
    "valor": 16.67,
    "categoria": "Cerveja",
    "marca": "Stella Artois",
    "mes": "2026-04"
  },
  {
    "id": "JSON-72",
    "operacao": "Operação 39",
    "data": "2026-04-07",
    "status": "Aprovado",
    "codProduto": "19164",
    "unidade": "CX",
    "descricao": "GUARANA CHP ANTARCTIC",
    "quantidade": 1,
    "valor": 14.4,
    "categoria": "Refrigerante",
    "marca": "Guaraná Antarctica",
    "mes": "2026-04"
  },
  {
    "id": "JSON-73",
    "operacao": "Operação 39",
    "data": "2026-04-30",
    "status": "Aprovado",
    "codProduto": "9067",
    "unidade": "UN",
    "descricao": "ANTARCTICA PILSEN LAT",
    "quantidade": 12,
    "valor": 60,
    "categoria": "Cerveja",
    "marca": "Antarctica",
    "mes": "2026-04"
  },
  {
    "id": "JSON-74",
    "operacao": "Operação 39",
    "data": "2026-05-05",
    "status": "Aprovado",
    "codProduto": "2546",
    "unidade": "UN",
    "descricao": "ORIGINAL 600ML",
    "quantidade": 3,
    "valor": 23.75,
    "categoria": "Bebidas Mistas & Beats",
    "marca": "Antarctica Original",
    "mes": "2026-05"
  },
  {
    "id": "JSON-75",
    "operacao": "Operação 39",
    "data": "2026-05-05",
    "status": "Aprovado",
    "codProduto": "23186",
    "unidade": "UN",
    "descricao": "SPATEN N 600ML",
    "quantidade": 2,
    "valor": 24.98,
    "categoria": "Cerveja",
    "marca": "Spaten",
    "mes": "2026-05"
  },
  {
    "id": "JSON-76",
    "operacao": "Operação 39",
    "data": "2026-05-05",
    "status": "Aprovado",
    "codProduto": "33734",
    "unidade": "UN",
    "descricao": "BEATS RED MIX LT 269M",
    "quantidade": 8,
    "valor": 59.62,
    "categoria": "Bebidas Mistas & Beats",
    "marca": "Skol Beats",
    "mes": "2026-05"
  },
  {
    "id": "JSON-77",
    "operacao": "Operação 39",
    "data": "2026-05-05",
    "status": "Aprovado",
    "codProduto": "2548",
    "unidade": "UN",
    "descricao": "BUDWEISER 600ML",
    "quantidade": 1,
    "valor": 12.5,
    "categoria": "Cerveja",
    "marca": "Budweiser",
    "mes": "2026-05"
  },
  {
    "id": "JSON-78",
    "operacao": "Operação 39",
    "data": "2026-05-06",
    "status": "Aprovado",
    "codProduto": "9067",
    "unidade": "UN",
    "descricao": "ANTARCTICA PILSEN LAT",
    "quantidade": 1,
    "valor": 5,
    "categoria": "Cerveja",
    "marca": "Antarctica",
    "mes": "2026-05"
  },
  {
    "id": "JSON-79",
    "operacao": "Operação 39",
    "data": "2026-05-06",
    "status": "Aprovado",
    "codProduto": "2538",
    "unidade": "UN",
    "descricao": "ANTARCTICA PILSEN 600",
    "quantidade": 1,
    "valor": 16.51,
    "categoria": "Cerveja",
    "marca": "Antarctica",
    "mes": "2026-05"
  },
  {
    "id": "JSON-80",
    "operacao": "Operação 39",
    "data": "2026-05-08",
    "status": "Aprovado",
    "codProduto": "1743",
    "unidade": "UN",
    "descricao": "ANTARCTICA PILSEN GFA",
    "quantidade": 3,
    "valor": 27.62,
    "categoria": "Cerveja",
    "marca": "Antarctica",
    "mes": "2026-05"
  },
  {
    "id": "JSON-81",
    "operacao": "Operação 39",
    "data": "2026-05-08",
    "status": "Aprovado",
    "codProduto": "1388",
    "unidade": "UN",
    "descricao": "SKOL GFA VD 1L 2,99",
    "quantidade": 1,
    "valor": 7.78,
    "categoria": "Cerveja",
    "marca": "Skol",
    "mes": "2026-05"
  },
  {
    "id": "JSON-82",
    "operacao": "Operação 39",
    "data": "2026-05-08",
    "status": "Aprovado",
    "codProduto": "13205",
    "unidade": "UN",
    "descricao": "SKOL GFA VD 300ML CX",
    "quantidade": 4,
    "valor": 10.43,
    "categoria": "Cerveja",
    "marca": "Skol",
    "mes": "2026-05"
  },
  {
    "id": "JSON-83",
    "operacao": "Operação 39",
    "data": "2026-05-18",
    "status": "Aprovado",
    "codProduto": "21787",
    "unidade": "UN",
    "descricao": "DREHER GARRAFA VIDRO",
    "quantidade": 1,
    "valor": 36.6,
    "categoria": "Outros Produtos",
    "marca": "Outras Marcas",
    "mes": "2026-05"
  },
  {
    "id": "JSON-84",
    "operacao": "Operação 39",
    "data": "2026-05-19",
    "status": "Aprovado",
    "codProduto": "982",
    "unidade": "UN",
    "descricao": "SKOL 600ML",
    "quantidade": 4,
    "valor": 46.7,
    "categoria": "Cerveja",
    "marca": "Skol",
    "mes": "2026-05"
  },
  {
    "id": "JSON-85",
    "operacao": "Operação 39",
    "data": "2026-05-20",
    "status": "Aprovado",
    "codProduto": "2546",
    "unidade": "UN",
    "descricao": "ORIGINAL 600ML",
    "quantidade": 1,
    "valor": 7.92,
    "categoria": "Bebidas Mistas & Beats",
    "marca": "Antarctica Original",
    "mes": "2026-05"
  },
  {
    "id": "JSON-86",
    "operacao": "Operação 39",
    "data": "2026-05-21",
    "status": "Aprovado",
    "codProduto": "23186",
    "unidade": "UN",
    "descricao": "SPATEN N 600ML",
    "quantidade": 1,
    "valor": 12.49,
    "categoria": "Cerveja",
    "marca": "Spaten",
    "mes": "2026-05"
  },
  {
    "id": "JSON-87",
    "operacao": "Operação 39",
    "data": "2026-05-21",
    "status": "Aprovado",
    "codProduto": "2349",
    "unidade": "UN",
    "descricao": "GUARANA CHP ANTARCTIC",
    "quantidade": 1,
    "valor": 8.5,
    "categoria": "Refrigerante",
    "marca": "Guaraná Antarctica",
    "mes": "2026-05"
  },
  {
    "id": "JSON-88",
    "operacao": "Operação 39",
    "data": "2026-05-21",
    "status": "Aprovado",
    "codProduto": "4367",
    "unidade": "UN",
    "descricao": "INDAIA AGUA MINERAL S",
    "quantidade": 1,
    "valor": 3.33,
    "categoria": "Água & Isotônico",
    "marca": "Outras Marcas",
    "mes": "2026-05"
  },
  {
    "id": "JSON-89",
    "operacao": "Operação 39",
    "data": "2026-05-21",
    "status": "Aprovado",
    "codProduto": "1695",
    "unidade": "UN",
    "descricao": "BRAHMA CHOPP GFA VD 1",
    "quantidade": 8,
    "valor": 60.67,
    "categoria": "Cerveja",
    "marca": "Brahma",
    "mes": "2026-05"
  },
  {
    "id": "JSON-90",
    "operacao": "Operação 39",
    "data": "2026-05-22",
    "status": "Aprovado",
    "codProduto": "26037",
    "unidade": "UN",
    "descricao": "MONTILLA CARTA CRISTA",
    "quantidade": 1,
    "valor": 35.9,
    "categoria": "Outros Produtos",
    "marca": "Outras Marcas",
    "mes": "2026-05"
  },
  {
    "id": "JSON-91",
    "operacao": "Operação 39",
    "data": "2026-05-26",
    "status": "Aprovado",
    "codProduto": "9068",
    "unidade": "UN",
    "descricao": "SKOL LATA 350ML SH C/",
    "quantidade": 4,
    "valor": 17.05,
    "categoria": "Cerveja",
    "marca": "Skol",
    "mes": "2026-05"
  },
  {
    "id": "JSON-92",
    "operacao": "Operação 39",
    "data": "2026-05-28",
    "status": "Aprovado",
    "codProduto": "1743",
    "unidade": "UN",
    "descricao": "ANTARCTICA PILSEN GFA",
    "quantidade": 1,
    "valor": 9.21,
    "categoria": "Cerveja",
    "marca": "Antarctica",
    "mes": "2026-05"
  },
  {
    "id": "JSON-93",
    "operacao": "Operação 39",
    "data": "2026-05-28",
    "status": "Aprovado",
    "codProduto": "9083",
    "unidade": "UN",
    "descricao": "SKOL LT 473ML SH C/12",
    "quantidade": 1,
    "valor": 5.57,
    "categoria": "Cerveja",
    "marca": "Skol",
    "mes": "2026-05"
  },
  {
    "id": "JSON-94",
    "operacao": "Operação 39",
    "data": "2026-05-28",
    "status": "Aprovado",
    "codProduto": "8791",
    "unidade": "UN",
    "descricao": "H2OH LIMAO C/GAS PET",
    "quantidade": 1,
    "valor": 4.72,
    "categoria": "Refrigerante",
    "marca": "H2OH!",
    "mes": "2026-05"
  },
  {
    "id": "JSON-95",
    "operacao": "Operação 39",
    "data": "2026-06-10",
    "status": "Aprovado",
    "codProduto": "2349",
    "unidade": "UN",
    "descricao": "GUARANA CHP ANTARCTIC",
    "quantidade": 1,
    "valor": 8.5,
    "categoria": "Refrigerante",
    "marca": "Guaraná Antarctica",
    "mes": "2026-06"
  },
  {
    "id": "JSON-96",
    "operacao": "Operação 39",
    "data": "2026-06-12",
    "status": "Aprovado",
    "codProduto": "9067",
    "unidade": "UN",
    "descricao": "ANTARCTICA PILSEN LAT",
    "quantidade": 12,
    "valor": 60,
    "categoria": "Cerveja",
    "marca": "Antarctica",
    "mes": "2026-06"
  },
  {
    "id": "JSON-97",
    "operacao": "Operação 39",
    "data": "2026-06-15",
    "status": "Aprovado",
    "codProduto": "9068",
    "unidade": "UN",
    "descricao": "SKOL LATA 350ML SH C/",
    "quantidade": 3,
    "valor": 12.79,
    "categoria": "Cerveja",
    "marca": "Skol",
    "mes": "2026-06"
  },
  {
    "id": "JSON-98",
    "operacao": "Operação 39",
    "data": "2026-06-15",
    "status": "Aprovado",
    "codProduto": "9795",
    "unidade": "UN",
    "descricao": "GUARANA ANTARCTICA ZE",
    "quantidade": 12,
    "valor": 68,
    "categoria": "Refrigerante",
    "marca": "Guaraná Antarctica",
    "mes": "2026-06"
  },
  {
    "id": "JSON-99",
    "operacao": "Operação 39",
    "data": "2026-06-17",
    "status": "Aprovado",
    "codProduto": "9068",
    "unidade": "UN",
    "descricao": "SKOL LATA 350ML SH C/",
    "quantidade": 4,
    "valor": 17.05,
    "categoria": "Cerveja",
    "marca": "Skol",
    "mes": "2026-06"
  },
  {
    "id": "JSON-100",
    "operacao": "Operação 39",
    "data": "2026-06-19",
    "status": "Aprovado",
    "codProduto": "7945",
    "unidade": "UN",
    "descricao": "PEPSI COLA PET 2,5L C",
    "quantidade": 6,
    "valor": 56,
    "categoria": "Refrigerante",
    "marca": "Pepsi",
    "mes": "2026-06"
  },
  {
    "id": "JSON-101",
    "operacao": "Operação 39",
    "data": "2026-06-19",
    "status": "Aprovado",
    "codProduto": "2546",
    "unidade": "UN",
    "descricao": "ORIGINAL 600ML",
    "quantidade": 1,
    "valor": 7.92,
    "categoria": "Bebidas Mistas & Beats",
    "marca": "Antarctica Original",
    "mes": "2026-06"
  },
  {
    "id": "JSON-102",
    "operacao": "Operação 39",
    "data": "2026-06-19",
    "status": "Aprovado",
    "codProduto": "9089",
    "unidade": "UN",
    "descricao": "SUKITA LATA 350ML SH",
    "quantidade": 12,
    "valor": 42.59,
    "categoria": "Refrigerante",
    "marca": "Sukita",
    "mes": "2026-06"
  },
  {
    "id": "JSON-103",
    "operacao": "Operação 39",
    "data": "2026-06-22",
    "status": "Aprovado",
    "codProduto": "9068",
    "unidade": "UN",
    "descricao": "SKOL LATA 350ML SH C/",
    "quantidade": 12,
    "valor": 51.15,
    "categoria": "Cerveja",
    "marca": "Skol",
    "mes": "2026-06"
  },
  {
    "id": "JSON-104",
    "operacao": "Operação 39",
    "data": "2026-06-22",
    "status": "Aprovado",
    "codProduto": "9084",
    "unidade": "UN",
    "descricao": "GUARANA CHP ANTARCTIC",
    "quantidade": 12,
    "valor": 36,
    "categoria": "Refrigerante",
    "marca": "Guaraná Antarctica",
    "mes": "2026-06"
  },
  {
    "id": "JSON-105",
    "operacao": "Operação 39",
    "data": "2026-06-22",
    "status": "Aprovado",
    "codProduto": "23186",
    "unidade": "UN",
    "descricao": "SPATEN N 600ML",
    "quantidade": 1,
    "valor": 12.49,
    "categoria": "Cerveja",
    "marca": "Spaten",
    "mes": "2026-06"
  },
  {
    "id": "JSON-106",
    "operacao": "Operação 39",
    "data": "2026-06-18",
    "status": "Aprovado",
    "codProduto": "1388",
    "unidade": "UN",
    "descricao": "SKOL GFA VD 1L 2,99",
    "quantidade": 2,
    "valor": 15.57,
    "categoria": "Cerveja",
    "marca": "Skol",
    "mes": "2026-06"
  },
  {
    "id": "JSON-107",
    "operacao": "Operação 39",
    "data": "2026-06-23",
    "status": "Aprovado",
    "codProduto": "35331",
    "unidade": "UN",
    "descricao": "BUDWEISER GFA VD 1L",
    "quantidade": 1,
    "valor": 10.91,
    "categoria": "Cerveja",
    "marca": "Budweiser",
    "mes": "2026-06"
  },
  {
    "id": "JSON-108",
    "operacao": "Operação 39",
    "data": "2026-06-25",
    "status": "Aprovado",
    "codProduto": "9085",
    "unidade": "UN",
    "descricao": "GUARANA CHP ANTARCTIC",
    "quantidade": 12,
    "valor": 45,
    "categoria": "Refrigerante",
    "marca": "Guaraná Antarctica",
    "mes": "2026-06"
  },
  {
    "id": "JSON-109",
    "operacao": "Operação 39",
    "data": "2026-06-25",
    "status": "Aprovado",
    "codProduto": "9427",
    "unidade": "UN",
    "descricao": "ANTARCTICA PILSEN LT",
    "quantidade": 12,
    "valor": 82.7,
    "categoria": "Cerveja",
    "marca": "Antarctica",
    "mes": "2026-06"
  },
  {
    "id": "JSON-110",
    "operacao": "Operação 39",
    "data": "2026-06-25",
    "status": "Aprovado",
    "codProduto": "9427",
    "unidade": "UN",
    "descricao": "ANTARCTICA PILSEN LT",
    "quantidade": 12,
    "valor": 82.7,
    "categoria": "Cerveja",
    "marca": "Antarctica",
    "mes": "2026-06"
  },
  {
    "id": "JSON-111",
    "operacao": "Operação 39",
    "data": "2026-06-23",
    "status": "Aprovado",
    "codProduto": "9067",
    "unidade": "UN",
    "descricao": "ANTARCTICA PILSEN LAT",
    "quantidade": 12,
    "valor": 60,
    "categoria": "Cerveja",
    "marca": "Antarctica",
    "mes": "2026-06"
  },
  {
    "id": "JSON-112",
    "operacao": "Operação 39",
    "data": "2026-07-02",
    "status": "Aprovado",
    "codProduto": "21020",
    "unidade": "CX",
    "descricao": "BUDWEISER LT SLEEK 35",
    "quantidade": 3,
    "valor": 148.56,
    "categoria": "Cerveja",
    "marca": "Budweiser",
    "mes": "2026-07"
  },
  {
    "id": "JSON-113",
    "operacao": "Operação 39",
    "data": "2026-07-02",
    "status": "Aprovado",
    "codProduto": "9069",
    "unidade": "CX",
    "descricao": "BRAHMA CHOPP LATA 350",
    "quantidade": 1,
    "valor": 52.65,
    "categoria": "Cerveja",
    "marca": "Brahma",
    "mes": "2026-07"
  },
  {
    "id": "JSON-114",
    "operacao": "Operação 39",
    "data": "2026-07-03",
    "status": "Aprovado",
    "codProduto": "9068",
    "unidade": "CX",
    "descricao": "SKOL LATA 350ML SH C/",
    "quantidade": 5,
    "valor": 255.75,
    "categoria": "Cerveja",
    "marca": "Skol",
    "mes": "2026-07"
  },
  {
    "id": "JSON-115",
    "operacao": "Operação 39",
    "data": "2026-07-06",
    "status": "Aprovado",
    "codProduto": "13201",
    "unidade": "CX",
    "descricao": "BRAHMA CHOPP GFA VD 3",
    "quantidade": 1,
    "valor": 70,
    "categoria": "Cerveja",
    "marca": "Brahma",
    "mes": "2026-07"
  },
  {
    "id": "JSON-116",
    "operacao": "Operação 39",
    "data": "2026-07-06",
    "status": "Aprovado",
    "codProduto": "37450",
    "unidade": "CX",
    "descricao": "BUDWEISER LT SLEEK 35",
    "quantidade": 5,
    "valor": 258,
    "categoria": "Cerveja",
    "marca": "Budweiser",
    "mes": "2026-07"
  },
  {
    "id": "JSON-117",
    "operacao": "Operação 39",
    "data": "2026-07-07",
    "status": "Aprovado",
    "codProduto": "23186",
    "unidade": "UN",
    "descricao": "SPATEN N 600ML",
    "quantidade": 2,
    "valor": 24.98,
    "categoria": "Cerveja",
    "marca": "Spaten",
    "mes": "2026-07"
  },
  {
    "id": "JSON-118",
    "operacao": "Operação 39",
    "data": "2026-07-08",
    "status": "Aprovado",
    "codProduto": "20217",
    "unidade": "CX",
    "descricao": "ORIGINAL GFA VD 300ML",
    "quantidade": 1,
    "valor": 70,
    "categoria": "Bebidas Mistas & Beats",
    "marca": "Antarctica Original",
    "mes": "2026-07"
  },
  {
    "id": "JSON-119",
    "operacao": "Operação 39",
    "data": "2026-07-08",
    "status": "Aprovado",
    "codProduto": "1695",
    "unidade": "UN",
    "descricao": "BRAHMA CHOPP GFA VD 1",
    "quantidade": 3,
    "valor": 22.75,
    "categoria": "Cerveja",
    "marca": "Brahma",
    "mes": "2026-07"
  },
  {
    "id": "JSON-120",
    "operacao": "Operação 39",
    "data": "2026-07-09",
    "status": "Aprovado",
    "codProduto": "7325",
    "unidade": "UN",
    "descricao": "PEPSI COLA PET 1L CAI",
    "quantidade": 1,
    "valor": 4.17,
    "categoria": "Refrigerante",
    "marca": "Pepsi",
    "mes": "2026-07"
  },
  {
    "id": "JSON-121",
    "operacao": "Operação 39",
    "data": "2026-07-09",
    "status": "Aprovado",
    "codProduto": "9069",
    "unidade": "CX",
    "descricao": "BRAHMA CHOPP LATA 350",
    "quantidade": 1,
    "valor": 52.65,
    "categoria": "Cerveja",
    "marca": "Brahma",
    "mes": "2026-07"
  },
  {
    "id": "JSON-122",
    "operacao": "Operação 39",
    "data": "2026-07-09",
    "status": "Aprovado",
    "codProduto": "503",
    "unidade": "CX",
    "descricao": "SUKITA PET 2L CAIXA C",
    "quantidade": 1,
    "valor": 40,
    "categoria": "Refrigerante",
    "marca": "Sukita",
    "mes": "2026-07"
  },
  {
    "id": "JSON-123",
    "operacao": "Operação 39",
    "data": "2026-07-09",
    "status": "Aprovado",
    "codProduto": "18836",
    "unidade": "CX",
    "descricao": "CORONA EXTRA N LONG N",
    "quantidade": 1,
    "valor": 185,
    "categoria": "Cerveja",
    "marca": "Corona",
    "mes": "2026-07"
  },
  {
    "id": "JSON-124",
    "operacao": "Operação 39",
    "data": "2026-07-09",
    "status": "Aprovado",
    "codProduto": "19321",
    "unidade": "CX",
    "descricao": "GUARANA ANTARCTICA ZE",
    "quantidade": 1,
    "valor": 22,
    "categoria": "Refrigerante",
    "marca": "Guaraná Antarctica",
    "mes": "2026-07"
  },
  {
    "id": "JSON-125",
    "operacao": "Operação 39",
    "data": "2026-07-15",
    "status": "Aprovado",
    "codProduto": "1388",
    "unidade": "UN",
    "descricao": "SKOL GFA VD 1L 2,99",
    "quantidade": 7,
    "valor": 54.48,
    "categoria": "Cerveja",
    "marca": "Skol",
    "mes": "2026-07"
  },
  {
    "id": "JSON-126",
    "operacao": "Operação 39",
    "data": "2026-07-16",
    "status": "Aprovado",
    "codProduto": "19164",
    "unidade": "CX",
    "descricao": "GUARANA CHP ANTARCTIC",
    "quantidade": 2,
    "valor": 28.8,
    "categoria": "Refrigerante",
    "marca": "Guaraná Antarctica",
    "mes": "2026-07"
  },
  {
    "id": "JSON-127",
    "operacao": "Operação 39",
    "data": "2026-07-16",
    "status": "Aprovado",
    "codProduto": "988",
    "unidade": "DZ",
    "descricao": "BRAHMA CHOPP 600ML",
    "quantidade": 2,
    "valor": 152,
    "categoria": "Cerveja",
    "marca": "Brahma",
    "mes": "2026-07"
  },
  {
    "id": "JSON-128",
    "operacao": "Operação 39",
    "data": "2026-07-16",
    "status": "Aprovado",
    "codProduto": "503",
    "unidade": "CX",
    "descricao": "SUKITA PET 2L CAIXA C",
    "quantidade": 1,
    "valor": 40,
    "categoria": "Refrigerante",
    "marca": "Sukita",
    "mes": "2026-07"
  },
  {
    "id": "JSON-129",
    "operacao": "Operação 39",
    "data": "2026-07-16",
    "status": "Aprovado",
    "codProduto": "19164",
    "unidade": "UN",
    "descricao": "GUARANA CHP ANTARCTIC",
    "quantidade": 2,
    "valor": 14.4,
    "categoria": "Refrigerante",
    "marca": "Guaraná Antarctica",
    "mes": "2026-07"
  },
  {
    "id": "JSON-130",
    "operacao": "Operação 39",
    "data": "2026-07-16",
    "status": "Aprovado",
    "codProduto": "9068",
    "unidade": "CX",
    "descricao": "SKOL LATA 350ML SH C/",
    "quantidade": 1,
    "valor": 51.15,
    "categoria": "Cerveja",
    "marca": "Skol",
    "mes": "2026-07"
  },
  {
    "id": "JSON-131",
    "operacao": "Operação 39",
    "data": "2026-07-16",
    "status": "Aprovado",
    "codProduto": "2538",
    "unidade": "UN",
    "descricao": "ANTARCTICA PILSEN 600",
    "quantidade": 1,
    "valor": 16.51,
    "categoria": "Cerveja",
    "marca": "Antarctica",
    "mes": "2026-07"
  },
  {
    "id": "JSON-132",
    "operacao": "Operação 39",
    "data": "2026-07-20",
    "status": "Aprovado",
    "codProduto": "20530",
    "unidade": "UN",
    "descricao": "STELLA ARTOIS 600 ML",
    "quantidade": 4,
    "valor": 33.33,
    "categoria": "Cerveja",
    "marca": "Stella Artois",
    "mes": "2026-07"
  },
  {
    "id": "JSON-133",
    "operacao": "Operação 39",
    "data": "2026-07-20",
    "status": "Aprovado",
    "codProduto": "33857",
    "unidade": "UN",
    "descricao": "STELLA ARTOIS PURE GO",
    "quantidade": 1,
    "valor": 13,
    "categoria": "Cerveja",
    "marca": "Stella Artois",
    "mes": "2026-07"
  },
  {
    "id": "JSON-134",
    "operacao": "Operação 39",
    "data": "2026-07-20",
    "status": "Aprovado",
    "codProduto": "9084",
    "unidade": "UN",
    "descricao": "GUARANA CHP ANTARCTIC",
    "quantidade": 12,
    "valor": 36,
    "categoria": "Refrigerante",
    "marca": "Guaraná Antarctica",
    "mes": "2026-07"
  },
  {
    "id": "JSON-135",
    "operacao": "Operação 39",
    "data": "2026-07-21",
    "status": "Aprovado",
    "codProduto": "24409",
    "unidade": "UN",
    "descricao": "QUINTA DO MORGADO VIN",
    "quantidade": 1,
    "valor": 30,
    "categoria": "Outros Produtos",
    "marca": "Outras Marcas",
    "mes": "2026-07"
  },
  {
    "id": "JSON-136",
    "operacao": "Operação 39",
    "data": "2026-07-21",
    "status": "Aprovado",
    "codProduto": "9068",
    "unidade": "CX",
    "descricao": "SKOL LATA 350ML SH C/",
    "quantidade": 1,
    "valor": 51.15,
    "categoria": "Cerveja",
    "marca": "Skol",
    "mes": "2026-07"
  },
  {
    "id": "JSON-137",
    "operacao": "Operação 39",
    "data": "2026-07-21",
    "status": "Aprovado",
    "codProduto": "9068",
    "unidade": "UN",
    "descricao": "SKOL LATA 350ML SH C/",
    "quantidade": 12,
    "valor": 51.15,
    "categoria": "Cerveja",
    "marca": "Skol",
    "mes": "2026-07"
  },
  {
    "id": "JSON-138",
    "operacao": "Operação 39",
    "data": "2026-07-22",
    "status": "Aprovado",
    "codProduto": "20530",
    "unidade": "UN",
    "descricao": "STELLA ARTOIS 600 ML",
    "quantidade": 1,
    "valor": 8.33,
    "categoria": "Cerveja",
    "marca": "Stella Artois",
    "mes": "2026-07"
  },
  {
    "id": "JSON-139",
    "operacao": "Operação 39",
    "data": "2026-07-23",
    "status": "Aprovado",
    "codProduto": "9068",
    "unidade": "CX",
    "descricao": "SKOL LATA 350ML SH C/",
    "quantidade": 4,
    "valor": 204.6,
    "categoria": "Cerveja",
    "marca": "Skol",
    "mes": "2026-07"
  },
  {
    "id": "JSON-140",
    "operacao": "Operação 39",
    "data": "2026-07-23",
    "status": "Aprovado",
    "codProduto": "7325",
    "unidade": "UN",
    "descricao": "PEPSI COLA PET 1L CAI",
    "quantidade": 12,
    "valor": 50,
    "categoria": "Refrigerante",
    "marca": "Pepsi",
    "mes": "2026-07"
  },
  {
    "id": "JSON-141",
    "operacao": "Operação 39",
    "data": "2026-07-27",
    "status": "Aprovado",
    "codProduto": "9083",
    "unidade": "CX",
    "descricao": "SKOL LT 473ML SH C/12",
    "quantidade": 2,
    "valor": 133.74,
    "categoria": "Cerveja",
    "marca": "Skol",
    "mes": "2026-07"
  },
  {
    "id": "JSON-142",
    "operacao": "Operação 39",
    "data": "2026-07-27",
    "status": "Aprovado",
    "codProduto": "1695",
    "unidade": "DZ",
    "descricao": "BRAHMA CHOPP GFA VD 1",
    "quantidade": 1,
    "valor": 91,
    "categoria": "Cerveja",
    "marca": "Brahma",
    "mes": "2026-07"
  },
  {
    "id": "JSON-143",
    "operacao": "Operação 39",
    "data": "2026-07-28",
    "status": "Aprovado",
    "codProduto": "1743",
    "unidade": "UN",
    "descricao": "ANTARCTICA PILSEN GFA",
    "quantidade": 1,
    "valor": 9.21,
    "categoria": "Cerveja",
    "marca": "Antarctica",
    "mes": "2026-07"
  },
  {
    "id": "JSON-144",
    "operacao": "Operação 39",
    "data": "2026-07-28",
    "status": "Aprovado",
    "codProduto": "9068",
    "unidade": "UN",
    "descricao": "SKOL LATA 350ML SH C/",
    "quantidade": 12,
    "valor": 51.15,
    "categoria": "Cerveja",
    "marca": "Skol",
    "mes": "2026-07"
  },
  {
    "id": "JSON-145",
    "operacao": "Operação 39",
    "data": "2026-07-28",
    "status": "Aprovado",
    "codProduto": "2538",
    "unidade": "UN",
    "descricao": "ANTARCTICA PILSEN 600",
    "quantidade": 1,
    "valor": 16.51,
    "categoria": "Cerveja",
    "marca": "Antarctica",
    "mes": "2026-07"
  },
  {
    "id": "JSON-146",
    "operacao": "Operação 39",
    "data": "2026-07-28",
    "status": "Aprovado",
    "codProduto": "2548",
    "unidade": "UN",
    "descricao": "BUDWEISER 600ML",
    "quantidade": 1,
    "valor": 12.5,
    "categoria": "Cerveja",
    "marca": "Budweiser",
    "mes": "2026-07"
  },
  {
    "id": "JSON-147",
    "operacao": "Operação 39",
    "data": "2026-07-28",
    "status": "Aprovado",
    "codProduto": "9068",
    "unidade": "UN",
    "descricao": "SKOL LATA 350ML SH C/",
    "quantidade": 12,
    "valor": 51.15,
    "categoria": "Cerveja",
    "marca": "Skol",
    "mes": "2026-07"
  },
  {
    "id": "JSON-148",
    "operacao": "Operação 39",
    "data": "2026-07-29",
    "status": "Aprovado",
    "codProduto": "13201",
    "unidade": "UN",
    "descricao": "BRAHMA CHOPP GFA VD 3",
    "quantidade": 12,
    "valor": 36.52,
    "categoria": "Cerveja",
    "marca": "Brahma",
    "mes": "2026-07"
  },
  {
    "id": "JSON-149",
    "operacao": "Operação 39",
    "data": "2026-07-29",
    "status": "Aprovado",
    "codProduto": "9068",
    "unidade": "UN",
    "descricao": "SKOL LATA 350ML SH C/",
    "quantidade": 12,
    "valor": 51.15,
    "categoria": "Cerveja",
    "marca": "Skol",
    "mes": "2026-07"
  },
  {
    "id": "JSON-150",
    "operacao": "Operação 39",
    "data": "2026-07-29",
    "status": "Aprovado",
    "codProduto": "9067",
    "unidade": "CX",
    "descricao": "ANTARCTICA PILSEN LAT",
    "quantidade": 5,
    "valor": 300,
    "categoria": "Cerveja",
    "marca": "Antarctica",
    "mes": "2026-07"
  },
  {
    "id": "JSON-151",
    "operacao": "Operação 39",
    "data": "2026-08-10",
    "status": "Aprovado",
    "codProduto": "2349",
    "unidade": "UN",
    "descricao": "GUARANA CHP ANTARCTIC",
    "quantidade": 6,
    "valor": 51,
    "categoria": "Refrigerante",
    "marca": "Guaraná Antarctica",
    "mes": "2026-08"
  }
];
