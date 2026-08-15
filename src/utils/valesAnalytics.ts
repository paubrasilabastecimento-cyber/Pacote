import {
  ValePrejuizoItem,
  ResumoGeralVales,
  PrejuizoPorRota,
  PrejuizoPorMotorista,
  RateioPorPessoa,
  PrejuizoPorComposicao,
  PrejuizoPorSKU,
  AlertaPadrao,
  AnaliseCompletaVales,
} from '../types/vales';

// Chave para armazenamento local dos dados de vales
export const VALES_STORAGE_KEY = 'ambev_gestao_vales_prejuizo_v1';

// Dados de demonstração padrão (pacote de prejuízo de entregas AMBEV)
export const DEMO_VALES_PREJUIZO: ValePrejuizoItem[] = [
  {
    id: 'vale-001',
    itemNo: 1,
    dataEmissao: '2026-02-03',
    mesRef: '2026-02',
    notaFiscal: 'NF-104820',
    mapaCarga: 'MAPA-88210',
    rotaSetor: 'ROTA 104 - ZONA SUL',
    motorista: 'CARLOS SILVA',
    cpfMotorista: '***.482.918-**',
    ajudante1: 'MARCOS VINICIUS',
    cpfAjudante1: '***.192.834-**',
    ajudante2: 'LUCAS PEREIRA',
    cpfAjudante2: '***.938.102-**',
    equipeCompleta: 'CARLOS SILVA, MARCOS VINICIUS, LUCAS PEREIRA',
    statusVale: 'Descontado',
    volumeHL: 0.42,
    valorTotalPrejuizo: 360.0,
    totalIntegrantes: 3,
    valorRateadoPorPessoa: 120.0,
    qtdItens: 4,
    codigoCliente: 'NB-84920',
    razaoSocialCliente: 'SUPERMERCADO ALVORADA LTDA',
    detalhamentoSKUs: 'BRAHMA DUPLO MALTE 350ML (2 cx) | SPATEN LATA 350ML (2 cx)',
    motivoResumido: 'Falta no desembarque cliente',
  },
  {
    id: 'vale-002',
    itemNo: 2,
    dataEmissao: '2026-02-04',
    mesRef: '2026-02',
    notaFiscal: 'NF-104891',
    mapaCarga: 'MAPA-88245',
    rotaSetor: 'ROTA 208 - CENTRO COMERCIAL',
    motorista: 'ROBERTO ALMEIDA',
    cpfMotorista: '***.571.203-**',
    ajudante1: '',
    cpfAjudante1: '',
    ajudante2: '',
    cpfAjudante2: '',
    equipeCompleta: 'Sem Ajudantes',
    statusVale: 'Pendente',
    volumeHL: 0.70,
    valorTotalPrejuizo: 645.5,
    totalIntegrantes: 1,
    valorRateadoPorPessoa: 645.5,
    qtdItens: 5,
    codigoCliente: 'NB-12904',
    razaoSocialCliente: 'BAR E RESTAURANTE DO ZE ME',
    detalhamentoSKUs: 'CORONA EXTRA 330ML LN (3 cx) | STELLA ARTOIS 330ML (2 cx)',
    motivoResumido: 'Avaria em manobra sem ajudante',
  },
  {
    id: 'vale-003',
    itemNo: 3,
    dataEmissao: '2026-02-05',
    mesRef: '2026-02',
    notaFiscal: 'NF-104950',
    mapaCarga: 'MAPA-88310',
    rotaSetor: 'ROTA 104 - ZONA SUL',
    motorista: 'CARLOS SILVA',
    cpfMotorista: '***.482.918-**',
    ajudante1: 'MARCOS VINICIUS',
    cpfAjudante1: '***.192.834-**',
    ajudante2: '',
    cpfAjudante2: '',
    equipeCompleta: 'CARLOS SILVA, MARCOS VINICIUS',
    statusVale: 'Descontado',
    volumeHL: 0.35,
    valorTotalPrejuizo: 280.0,
    totalIntegrantes: 2,
    valorRateadoPorPessoa: 140.0,
    qtdItens: 3,
    codigoCliente: 'NB-33918',
    razaoSocialCliente: 'EMPÓRIO DAS BEBIDAS NOBRE',
    detalhamentoSKUs: 'BUDWEISER 350ML LATA (3 cx)',
    motivoResumido: 'Falta conferida na descarga',
  },
  {
    id: 'vale-004',
    itemNo: 4,
    dataEmissao: '2026-02-06',
    mesRef: '2026-02',
    notaFiscal: 'NF-105012',
    mapaCarga: 'MAPA-88390',
    rotaSetor: 'ROTA 302 - LITORAL NORTE',
    motorista: 'ANTONIO FERREIRA',
    cpfMotorista: '***.819.344-**',
    ajudante1: 'LUCAS PEREIRA',
    cpfAjudante1: '***.938.102-**',
    ajudante2: 'GABRIEL SOUZA',
    cpfAjudante2: '***.726.491-**',
    equipeCompleta: 'ANTONIO FERREIRA, LUCAS PEREIRA, GABRIEL SOUZA',
    statusVale: 'Descontado',
    volumeHL: 1.20,
    valorTotalPrejuizo: 980.0,
    totalIntegrantes: 3,
    valorRateadoPorPessoa: 326.67,
    qtdItens: 10,
    codigoCliente: 'NB-77192',
    razaoSocialCliente: 'HOTEL RESORT PRAIA BELA',
    detalhamentoSKUs: 'BEATS SENSES 269ML (4 cx) | SPATEN LATA 350ML (4 cx) | ORIGINAL 600ML (2 cx)',
    motivoResumido: 'Queda de palete em doca inclinada',
  },
  {
    id: 'vale-005',
    itemNo: 5,
    dataEmissao: '2026-02-07',
    mesRef: '2026-02',
    notaFiscal: 'NF-105120',
    mapaCarga: 'MAPA-88420',
    rotaSetor: 'ROTA 208 - CENTRO COMERCIAL',
    motorista: 'ROBERTO ALMEIDA',
    cpfMotorista: '***.571.203-**',
    ajudante1: 'DIEGO SANTOS',
    cpfAjudante1: '***.332.190-**',
    ajudante2: '',
    cpfAjudante2: '',
    equipeCompleta: 'ROBERTO ALMEIDA, DIEGO SANTOS',
    statusVale: 'Descontado',
    volumeHL: 0.28,
    valorTotalPrejuizo: 210.0,
    totalIntegrantes: 2,
    valorRateadoPorPessoa: 105.0,
    qtdItens: 2,
    codigoCliente: 'NB-99014',
    razaoSocialCliente: 'PADARIA E CONFEITARIA CENTRAL',
    detalhamentoSKUs: 'SKOL LATA 350ML (2 cx)',
    motivoResumido: 'Lata furada no baú',
  },
  {
    id: 'vale-006',
    itemNo: 6,
    dataEmissao: '2026-02-08',
    mesRef: '2026-02',
    notaFiscal: 'NF-105230',
    mapaCarga: 'MAPA-88501',
    rotaSetor: 'ROTA 405 - POLO INDUSTRIAL',
    motorista: 'FERNANDO DIAS',
    cpfMotorista: '***.662.883-**',
    ajudante1: '',
    cpfAjudante1: '',
    ajudante2: '',
    cpfAjudante2: '',
    equipeCompleta: 'Sem Ajudantes',
    statusVale: 'Pendente',
    volumeHL: 0.95,
    valorTotalPrejuizo: 820.0,
    totalIntegrantes: 1,
    valorRateadoPorPessoa: 820.0,
    qtdItens: 6,
    codigoCliente: 'NB-55410',
    razaoSocialCliente: 'DISTRIBUIDORA DE BEBIDAS EXPRESS',
    detalhamentoSKUs: 'STELLA PURE GOLD 330ML (3 cx) | CORONA EXTRA 330ML (3 cx)',
    motivoResumido: 'Tombamento de caixa na movimentação solo',
  },
  {
    id: 'vale-007',
    itemNo: 7,
    dataEmissao: '2026-02-09',
    mesRef: '2026-02',
    notaFiscal: 'NF-105314',
    mapaCarga: 'MAPA-88590',
    rotaSetor: 'ROTA 104 - ZONA SUL',
    motorista: 'CARLOS SILVA',
    cpfMotorista: '***.482.918-**',
    ajudante1: 'GABRIEL SOUZA',
    cpfAjudante1: '***.726.491-**',
    ajudante2: 'DIEGO SANTOS',
    cpfAjudante2: '***.332.190-**',
    equipeCompleta: 'CARLOS SILVA, GABRIEL SOUZA, DIEGO SANTOS',
    statusVale: 'Descontado',
    volumeHL: 0.50,
    valorTotalPrejuizo: 420.0,
    totalIntegrantes: 3,
    valorRateadoPorPessoa: 140.0,
    qtdItens: 4,
    codigoCliente: 'NB-11239',
    razaoSocialCliente: 'CHURRASCARIA TROPICAL GRILL',
    detalhamentoSKUs: 'ORIGINAL 600ML RGB (2 cx) | BRAHMA CHOPP 600ML (2 cx)',
    motivoResumido: 'Garrafa quebrada no engradado',
  },
  {
    id: 'vale-008',
    itemNo: 8,
    dataEmissao: '2026-02-10',
    mesRef: '2026-02',
    notaFiscal: 'NF-105400',
    mapaCarga: 'MAPA-88640',
    rotaSetor: 'ROTA 302 - LITORAL NORTE',
    motorista: 'ANTONIO FERREIRA',
    cpfMotorista: '***.819.344-**',
    ajudante1: 'MARCOS VINICIUS',
    cpfAjudante1: '***.192.834-**',
    ajudante2: '',
    cpfAjudante2: '',
    equipeCompleta: 'ANTONIO FERREIRA, MARCOS VINICIUS',
    statusVale: 'Descontado',
    volumeHL: 0.45,
    valorTotalPrejuizo: 350.0,
    totalIntegrantes: 2,
    valorRateadoPorPessoa: 175.0,
    qtdItens: 3,
    codigoCliente: 'NB-44820',
    razaoSocialCliente: 'QUIOSQUE ESTRELA DO MAR',
    detalhamentoSKUs: 'CORONA CERO 330ML (2 cx) | SPATEN LONG NECK (1 cx)',
    motivoResumido: 'Falta na contagem final',
  },
  {
    id: 'vale-009',
    itemNo: 9,
    dataEmissao: '2026-02-11',
    mesRef: '2026-02',
    notaFiscal: 'NF-105490',
    mapaCarga: 'MAPA-88712',
    rotaSetor: 'ROTA 501 - PERIFERIA LESTE',
    motorista: 'JOSEVALDO RAMOS',
    cpfMotorista: '***.901.442-**',
    ajudante1: 'LUCAS PEREIRA',
    cpfAjudante1: '***.938.102-**',
    ajudante2: 'GABRIEL SOUZA',
    cpfAjudante2: '***.726.491-**',
    equipeCompleta: 'JOSEVALDO RAMOS, LUCAS PEREIRA, GABRIEL SOUZA',
    statusVale: 'Descontado',
    volumeHL: 0.60,
    valorTotalPrejuizo: 510.0,
    totalIntegrantes: 3,
    valorRateadoPorPessoa: 170.0,
    qtdItens: 5,
    codigoCliente: 'NB-66019',
    razaoSocialCliente: 'ADEGA E DEPOSITO DA VILA',
    detalhamentoSKUs: 'GUARANÁ ANTARCTICA 2L (3 cx) | PEPSI BLACK 350ML (2 cx)',
    motivoResumido: 'Garrafa furada por amarração incorreta',
  },
  {
    id: 'vale-010',
    itemNo: 10,
    dataEmissao: '2026-02-12',
    mesRef: '2026-02',
    notaFiscal: 'NF-105580',
    mapaCarga: 'MAPA-88800',
    rotaSetor: 'ROTA 208 - CENTRO COMERCIAL',
    motorista: 'ROBERTO ALMEIDA',
    cpfMotorista: '***.571.203-**',
    ajudante1: '',
    cpfAjudante1: '',
    ajudante2: '',
    cpfAjudante2: '',
    equipeCompleta: 'Sem Ajudantes',
    statusVale: 'Pendente',
    volumeHL: 0.52,
    valorTotalPrejuizo: 490.0,
    totalIntegrantes: 1,
    valorRateadoPorPessoa: 490.0,
    qtdItens: 4,
    codigoCliente: 'NB-28391',
    razaoSocialCliente: 'LANCHONETE METROPOLE',
    detalhamentoSKUs: 'BUDWEISER LATA 350ML (2 cx) | STELLA ARTOIS LATA 350ML (2 cx)',
    motivoResumido: 'Falta no conferente sem ajudante',
  },
  {
    id: 'vale-011',
    itemNo: 11,
    dataEmissao: '2026-02-13',
    mesRef: '2026-02',
    notaFiscal: 'NF-105650',
    mapaCarga: 'MAPA-88890',
    rotaSetor: 'ROTA 104 - ZONA SUL',
    motorista: 'CARLOS SILVA',
    cpfMotorista: '***.482.918-**',
    ajudante1: 'DIEGO SANTOS',
    cpfAjudante1: '***.332.190-**',
    ajudante2: '',
    cpfAjudante2: '',
    equipeCompleta: 'CARLOS SILVA, DIEGO SANTOS',
    statusVale: 'Descontado',
    volumeHL: 0.38,
    valorTotalPrejuizo: 310.0,
    totalIntegrantes: 2,
    valorRateadoPorPessoa: 155.0,
    qtdItens: 3,
    codigoCliente: 'NB-84920',
    razaoSocialCliente: 'SUPERMERCADO ALVORADA LTDA',
    detalhamentoSKUs: 'CORONA EXTRA 330ML (2 cx) | BEATS GT 269ML (1 cx)',
    motivoResumido: 'Caixa molhada com avaria interna',
  },
  {
    id: 'vale-012',
    itemNo: 12,
    dataEmissao: '2026-02-14',
    mesRef: '2026-02',
    notaFiscal: 'NF-105740',
    mapaCarga: 'MAPA-88980',
    rotaSetor: 'ROTA 302 - LITORAL NORTE',
    motorista: 'ANTONIO FERREIRA',
    cpfMotorista: '***.819.344-**',
    ajudante1: 'LUCAS PEREIRA',
    cpfAjudante1: '***.938.102-**',
    ajudante2: 'MARCOS VINICIUS',
    cpfAjudante2: '***.192.834-**',
    equipeCompleta: 'ANTONIO FERREIRA, LUCAS PEREIRA, MARCOS VINICIUS',
    statusVale: 'Descontado',
    volumeHL: 1.50,
    valorTotalPrejuizo: 1240.0,
    totalIntegrantes: 3,
    valorRateadoPorPessoa: 413.33,
    qtdItens: 12,
    codigoCliente: 'NB-91024',
    razaoSocialCliente: 'SUPER ATACADISTA MARINHA',
    detalhamentoSKUs: 'CORONA EXTRA 330ML (5 cx) | SPATEN LATA 350ML (4 cx) | STELLA ARTOIS 330ML (3 cx)',
    motivoResumido: 'Falta generalizada conferida na portaria',
  },
];

// Helper para formatar moeda brasileira
export const formatBRL = (val: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val || 0);
};

export const formatHL = (val: number): string => {
  return `${(val || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} HL`;
};

// -------------------------------------------------------------
// ANALISADOR PRINCIPAL DO PACOTE DE PREJUÍZO (VALES)
// -------------------------------------------------------------
export function analisarPacoteVales(vales: ValePrejuizoItem[]): AnaliseCompletaVales {
  if (!vales || vales.length === 0) {
    return {
      resumo: {
        totalVales: 0,
        prejuizoTotal: 0,
        volumeTotalHL: 0,
        mediaPrejuizoPorVale: 0,
        totalIntegrantesImpactados: 0,
        valesSemAjudantesQtd: 0,
        valesSemAjudantesValor: 0,
      },
      rankingRotas: [],
      rankingMotoristas: [],
      rateioPessoas: [],
      composicaoEquipes: [],
      rankingSKUs: [],
      top5Vales: [],
      alertas: [],
      textoConclusao: ['Nenhum dado de vales de prejuízo disponível para análise.'],
    };
  }

  // 1. RESUMO GERAL
  const totalVales = vales.length;
  let prejuizoTotal = 0;
  let volumeTotalHL = 0;
  let valesSemAjudantesQtd = 0;
  let valesSemAjudantesValor = 0;

  vales.forEach((v) => {
    prejuizoTotal += v.valorTotalPrejuizo || 0;
    volumeTotalHL += v.volumeHL || 0;
    if (v.totalIntegrantes === 1 || v.equipeCompleta?.toLowerCase().includes('sem ajudante')) {
      valesSemAjudantesQtd += 1;
      valesSemAjudantesValor += v.valorTotalPrejuizo || 0;
    }
  });

  const mediaPrejuizoPorVale = totalVales > 0 ? prejuizoTotal / totalVales : 0;

  // 2. PREJUÍZO POR ROTA / SETOR
  const rotaMap: Record<
    string,
    { rota: string; totalPrejuizo: number; totalVales: number; volumeHL: number; motoristas: Set<string> }
  > = {};

  vales.forEach((v) => {
    const rota = (v.rotaSetor || 'NÃO INFORMADA').trim().toUpperCase();
    if (!rotaMap[rota]) {
      rotaMap[rota] = {
        rota,
        totalPrejuizo: 0,
        totalVales: 0,
        volumeHL: 0,
        motoristas: new Set(),
      };
    }
    rotaMap[rota].totalPrejuizo += v.valorTotalPrejuizo || 0;
    rotaMap[rota].totalVales += 1;
    rotaMap[rota].volumeHL += v.volumeHL || 0;
    if (v.motorista) rotaMap[rota].motoristas.add(v.motorista.trim().toUpperCase());
  });

  const rankingRotas: PrejuizoPorRota[] = Object.values(rotaMap)
    .map((r) => ({
      rota: r.rota,
      totalPrejuizo: r.totalPrejuizo,
      totalVales: r.totalVales,
      volumeHL: r.volumeHL,
      percentual: prejuizoTotal > 0 ? (r.totalPrejuizo / prejuizoTotal) * 100 : 0,
      mediaPorVale: r.totalVales > 0 ? r.totalPrejuizo / r.totalVales : 0,
      motoristasPrincipais: Array.from(r.motoristas),
    }))
    .sort((a, b) => b.totalPrejuizo - a.totalPrejuizo);

  // 3. PREJUÍZO POR MOTORISTA RESPONSÁVEL
  const motoristaMap: Record<
    string,
    {
      motorista: string;
      cpf?: string;
      totalVales: number;
      prejuizoTotal: number;
      valorRateadoAssumido: number;
      valesSemAjudante: number;
      valorSemAjudante: number;
      rotas: Set<string>;
    }
  > = {};

  vales.forEach((v) => {
    const mot = (v.motorista || 'MOTORISTA NÃO INFORMADO').trim().toUpperCase();
    if (!motoristaMap[mot]) {
      motoristaMap[mot] = {
        motorista: mot,
        cpf: v.cpfMotorista,
        totalVales: 0,
        prejuizoTotal: 0,
        valorRateadoAssumido: 0,
        valesSemAjudante: 0,
        valorSemAjudante: 0,
        rotas: new Set(),
      };
    }
    motoristaMap[mot].totalVales += 1;
    motoristaMap[mot].prejuizoTotal += v.valorTotalPrejuizo || 0;
    motoristaMap[mot].valorRateadoAssumido += v.valorRateadoPorPessoa || 0;
    if (v.rotaSetor) motoristaMap[mot].rotas.add(v.rotaSetor.trim().toUpperCase());

    if (v.totalIntegrantes === 1 || v.equipeCompleta?.toLowerCase().includes('sem ajudante')) {
      motoristaMap[mot].valesSemAjudante += 1;
      motoristaMap[mot].valorSemAjudante += v.valorTotalPrejuizo || 0;
    }
  });

  const rankingMotoristas: PrejuizoPorMotorista[] = Object.values(motoristaMap)
    .map((m) => ({
      motorista: m.motorista,
      cpf: m.cpf,
      totalVales: m.totalVales,
      prejuizoTotal: m.prejuizoTotal,
      valorRateadoAssumido: m.valorRateadoAssumido,
      valesSemAjudante: m.valesSemAjudante,
      valorSemAjudante: m.valorSemAjudante,
      rotasPrincipais: Array.from(m.rotas),
    }))
    .sort((a, b) => b.prejuizoTotal - a.prejuizoTotal);

  // 4. RATEIO POR PESSOA (MOTORISTAS E AJUDANTES)
  const pessoaMap: Record<
    string,
    {
      nome: string;
      cpf?: string;
      valesParticipados: number;
      valorRateadoTotal: number;
      valesComoMotorista: number;
      valesComoAjudante: number;
      valesSemAjudantes: number;
      valorSemAjudantesTotal: number;
    }
  > = {};

  vales.forEach((v) => {
    const rateio = v.valorRateadoPorPessoa || 0;
    const isSemAjudantes = v.totalIntegrantes === 1 || v.equipeCompleta?.toLowerCase().includes('sem ajudante');

    // Motorista
    if (v.motorista && v.motorista.trim()) {
      const nomeMot = v.motorista.trim().toUpperCase();
      if (!pessoaMap[nomeMot]) {
        pessoaMap[nomeMot] = {
          nome: nomeMot,
          cpf: v.cpfMotorista,
          valesParticipados: 0,
          valorRateadoTotal: 0,
          valesComoMotorista: 0,
          valesComoAjudante: 0,
          valesSemAjudantes: 0,
          valorSemAjudantesTotal: 0,
        };
      }
      pessoaMap[nomeMot].valesParticipados += 1;
      pessoaMap[nomeMot].valorRateadoTotal += rateio;
      pessoaMap[nomeMot].valesComoMotorista += 1;
      if (isSemAjudantes) {
        pessoaMap[nomeMot].valesSemAjudantes += 1;
        pessoaMap[nomeMot].valorSemAjudantesTotal += v.valorTotalPrejuizo || rateio;
      }
    }

    // Ajudante 1
    if (v.ajudante1 && v.ajudante1.trim() && !v.ajudante1.toLowerCase().includes('sem ajudante')) {
      const nomeA1 = v.ajudante1.trim().toUpperCase();
      if (!pessoaMap[nomeA1]) {
        pessoaMap[nomeA1] = {
          nome: nomeA1,
          cpf: v.cpfAjudante1,
          valesParticipados: 0,
          valorRateadoTotal: 0,
          valesComoMotorista: 0,
          valesComoAjudante: 0,
          valesSemAjudantes: 0,
          valorSemAjudantesTotal: 0,
        };
      }
      pessoaMap[nomeA1].valesParticipados += 1;
      pessoaMap[nomeA1].valorRateadoTotal += rateio;
      pessoaMap[nomeA1].valesComoAjudante += 1;
    }

    // Ajudante 2
    if (v.ajudante2 && v.ajudante2.trim() && !v.ajudante2.toLowerCase().includes('sem ajudante')) {
      const nomeA2 = v.ajudante2.trim().toUpperCase();
      if (!pessoaMap[nomeA2]) {
        pessoaMap[nomeA2] = {
          nome: nomeA2,
          cpf: v.cpfAjudante2,
          valesParticipados: 0,
          valorRateadoTotal: 0,
          valesComoMotorista: 0,
          valesComoAjudante: 0,
          valesSemAjudantes: 0,
          valorSemAjudantesTotal: 0,
        };
      }
      pessoaMap[nomeA2].valesParticipados += 1;
      pessoaMap[nomeA2].valorRateadoTotal += rateio;
      pessoaMap[nomeA2].valesComoAjudante += 1;
    }
  });

  const rateioPessoas: RateioPorPessoa[] = Object.values(pessoaMap)
    .map((p) => {
      let papel: 'Motorista' | 'Ajudante' | 'Misto' = 'Misto';
      if (p.valesComoMotorista > 0 && p.valesComoAjudante === 0) papel = 'Motorista';
      else if (p.valesComoAjudante > 0 && p.valesComoMotorista === 0) papel = 'Ajudante';

      return {
        nome: p.nome,
        cpf: p.cpf,
        papelPrincipal: papel,
        totalValesParticipados: p.valesParticipados,
        valorRateadoTotal: p.valorRateadoTotal,
        valesComoMotorista: p.valesComoMotorista,
        valesComoAjudante: p.valesComoAjudante,
        valesSemAjudantes: p.valesSemAjudantes,
        valorSemAjudantesTotal: p.valorSemAjudantesTotal,
      };
    })
    .sort((a, b) => b.valorRateadoTotal - a.valorRateadoTotal);

  // 5. PREJUÍZO POR COMPOSIÇÃO DE EQUIPE
  const compMap: Record<
    string,
    {
      composicao: '1 Integrante (Sem Ajudantes)' | '2 Integrantes (1 Mot + 1 Ajud)' | '3 Integrantes (1 Mot + 2 Ajud)' | 'Outros';
      integrantes: number;
      totalVales: number;
      prejuizoTotal: number;
      volumeHL: number;
    }
  > = {
    '1': { composicao: '1 Integrante (Sem Ajudantes)', integrantes: 1, totalVales: 0, prejuizoTotal: 0, volumeHL: 0 },
    '2': { composicao: '2 Integrantes (1 Mot + 1 Ajud)', integrantes: 2, totalVales: 0, prejuizoTotal: 0, volumeHL: 0 },
    '3': { composicao: '3 Integrantes (1 Mot + 2 Ajud)', integrantes: 3, totalVales: 0, prejuizoTotal: 0, volumeHL: 0 },
  };

  vales.forEach((v) => {
    let key = '1';
    if (v.totalIntegrantes === 2) key = '2';
    else if (v.totalIntegrantes === 3) key = '3';
    else if (v.totalIntegrantes > 3) key = '3';
    else if (v.equipeCompleta?.toLowerCase().includes('sem ajudante')) key = '1';

    if (compMap[key]) {
      compMap[key].totalVales += 1;
      compMap[key].prejuizoTotal += v.valorTotalPrejuizo || 0;
      compMap[key].volumeHL += v.volumeHL || 0;
    }
  });

  const composicaoEquipes: PrejuizoPorComposicao[] = Object.values(compMap).map((c) => ({
    ...c,
    percentual: prejuizoTotal > 0 ? (c.prejuizoTotal / prejuizoTotal) * 100 : 0,
    mediaPorVale: c.totalVales > 0 ? c.prejuizoTotal / c.totalVales : 0,
  }));

  // 6. PREJUÍZO POR PRODUTO / SKU (Rateio igual quando houver " | ")
  const skuMap: Record<string, { sku: string; ocorrencias: number; prejuizo: number; qtdEstimada: number }> = {};

  vales.forEach((v) => {
    const rawSkus = (v.detalhamentoSKUs || 'PRODUTOS NÃO ESPECIFICADOS').split('|');
    const cleanSkus = rawSkus.map((s) => s.trim()).filter(Boolean);
    const qtdParts = cleanSkus.length > 0 ? cleanSkus.length : 1;
    const valorPorParte = (v.valorTotalPrejuizo || 0) / qtdParts;

    cleanSkus.forEach((skuText) => {
      // Extrair nome limpo do produto (removendo quantidade entre parênteses para agrupar)
      let skuNome = skuText.replace(/\(\d+.*?\)/g, '').trim().toUpperCase();
      if (!skuNome) skuNome = skuText.toUpperCase();

      if (!skuMap[skuNome]) {
        skuMap[skuNome] = {
          sku: skuNome,
          ocorrencias: 0,
          prejuizo: 0,
          qtdEstimada: 0,
        };
      }
      skuMap[skuNome].ocorrencias += 1;
      skuMap[skuNome].prejuizo += valorPorParte;
      skuMap[skuNome].qtdEstimada += 1;
    });
  });

  const rankingSKUs: PrejuizoPorSKU[] = Object.values(skuMap)
    .map((s) => ({
      sku: s.sku,
      ocorrencias: s.ocorrencias,
      prejuizoEstimado: s.prejuizo,
      qtdEstimada: s.qtdEstimada,
      percentual: prejuizoTotal > 0 ? (s.prejuizo / prejuizoTotal) * 100 : 0,
    }))
    .sort((a, b) => b.prejuizoEstimado - a.prejuizoEstimado);

  // 7. MAIORES VALES INDIVIDUAIS (TOP 5)
  const top5Vales: ValePrejuizoItem[] = [...vales]
    .sort((a, b) => (b.valorTotalPrejuizo || 0) - (a.valorTotalPrejuizo || 0))
    .slice(0, 5);

  // 8. PADRÕES E ALERTAS AUTOMATIZADOS
  const alertas: AlertaPadrao[] = [];

  // Alerta 1: Vales "Sem Ajudantes" de alto impacto
  if (valesSemAjudantesQtd > 0) {
    const pctSemAjud = (valesSemAjudantesValor / (prejuizoTotal || 1)) * 100;
    alertas.push({
      id: 'alt-sem-ajudante',
      tipo: pctSemAjud > 20 ? 'critico' : 'atencao',
      titulo: 'Penalização Severa em Entregas Sem Ajudantes (100% Motorista)',
      descricao: `${valesSemAjudantesQtd} vales ocorreram na modalidade "Sem Ajudantes", somando ${formatBRL(
        valesSemAjudantesValor
      )} (${pctSemAjud.toFixed(1)}% do prejuízo total), penalizando integralmente o motorista condutor.`,
      impactoR$: valesSemAjudantesValor,
      recorrencia: valesSemAjudantesQtd,
    });
  }

  // Alerta 2: Concentração em Rotas críticas
  if (rankingRotas.length > 0 && rankingRotas[0].percentual > 30) {
    alertas.push({
      id: 'alt-rota-critica',
      tipo: 'critico',
      titulo: `Alta Concentração na Rota: ${rankingRotas[0].rota}`,
      descricao: `A rota lidera com ${formatBRL(rankingRotas[0].totalPrejuizo)} correspondendo a ${rankingRotas[0].percentual.toFixed(
        1
      )}% de todas as ocorrências de avarias/faltas da operação.`,
      impactoR$: rankingRotas[0].totalPrejuizo,
      recorrencia: rankingRotas[0].totalVales,
    });
  }

  // Alerta 3: Motorista com maior frequência/recorrência
  if (rankingMotoristas.length > 0 && rankingMotoristas[0].totalVales >= 3) {
    alertas.push({
      id: 'alt-motorista-reincidente',
      tipo: 'atencao',
      titulo: `Reincidência Elevada: Motorista ${rankingMotoristas[0].motorista}`,
      descricao: `Acumulou ${rankingMotoristas[0].totalVales} vales de prejuízo totalizando ${formatBRL(
        rankingMotoristas[0].prejuizoTotal
      )}. Necessária reciclagem de procedimentos de conferência no cliente.`,
      impactoR$: rankingMotoristas[0].prejuizoTotal,
      recorrencia: rankingMotoristas[0].totalVales,
    });
  }

  // Alerta 4: Produtos de maior valor agregado (ex: Corona, Stella, Beats, Spaten)
  const premiumSKUs = rankingSKUs.filter(
    (s) =>
      s.sku.includes('CORONA') ||
      s.sku.includes('STELLA') ||
      s.sku.includes('BEATS') ||
      s.sku.includes('SPATEN') ||
      s.sku.includes('PURE GOLD')
  );
  if (premiumSKUs.length > 0) {
    const somaPremium = premiumSKUs.reduce((acc, cur) => acc + cur.prejuizoEstimado, 0);
    const pctPremium = (somaPremium / (prejuizoTotal || 1)) * 100;
    alertas.push({
      id: 'alt-produtos-premium',
      tipo: 'informativo',
      titulo: 'Alta Frequência de Marcas Premium / Long Neck',
      descricao: `SKUs de alto valor unitário (Corona, Stella, Beats, Spaten) concentram ${formatBRL(
        somaPremium
      )} (${pctPremium.toFixed(1)}% do prejuízo). Exigem reforço na amarração e estivagem do baú.`,
      impactoR$: somaPremium,
    });
  }

  // 9. TEXTO DE CONCLUSÃO EXECUTIVA (5-6 Linhas)
  const topRotaNome = rankingRotas[0]?.rota || 'Rotas Urbanas';
  const topMotoristaNome = rankingMotoristas[0]?.motorista || 'Equipes de Distribuição';
  const topSkuNome = rankingSKUs[0]?.sku || 'Cervejas em Lata/Vidro';

  const textoConclusao: string[] = [
    `A análise consolidada revela um prejuízo acumulado de ${formatBRL(prejuizoTotal)} distribuído em ${totalVales} vales (${formatHL(
      volumeTotalHL
    )}), com média de ${formatBRL(mediaPrejuizoPorVale)} por ocorrência.`,
    `Identificou-se forte concentração na ${topRotaNome} e com o motorista ${topMotoristaNome}, que juntos representam as maiores fatias do passivo operacional.`,
    `As operações 'Sem Ajudantes' representam um ponto crítico de vulnerabilidade, onde ${valesSemAjudantesQtd} ocorrências (${formatBRL(
      valesSemAjudantesValor
    )}) sobrecarregaram individualmente condutores em descargas complexas.`,
    `No recorte de produtos, ${topSkuNome} e linhas premium (garrafas Long Neck e Latas) respondem pela maior perda financeira devido à fragilidade de embalagem e alto valor unitário.`,
    `Recomenda-se implementar duplo checklist de conferência na saída/retorno do mapa e revisar a alocação obrigatória de ajudantes em clientes com descarga pesada.`,
  ];

  return {
    resumo: {
      totalVales,
      prejuizoTotal,
      volumeTotalHL,
      mediaPrejuizoPorVale,
      totalIntegrantesImpactados: Object.keys(pessoaMap).length,
      valesSemAjudantesQtd,
      valesSemAjudantesValor,
    },
    rankingRotas,
    rankingMotoristas,
    rateioPessoas,
    composicaoEquipes,
    rankingSKUs,
    top5Vales,
    alertas,
    textoConclusao,
  };
}

// -------------------------------------------------------------
// PARSER DE ARQUIVOS (EXCEL / CSV / JSON) PARA VALES
// -------------------------------------------------------------
export async function parseValesFile(file: File): Promise<ValePrejuizoItem[]> {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.json')) {
    const text = await file.text();
    const json = JSON.parse(text);
    const array = Array.isArray(json) ? json : json.vales || json.records || [json];
    return processarLinhasRawVales(array);
  }

  // Excel ou CSV
  const XLSX = await import('xlsx');
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { cellDates: true });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows: any[] = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });
  return processarLinhasRawVales(rawRows);
}

export function processarLinhasRawVales(rows: any[]): ValePrejuizoItem[] {
  if (!rows || rows.length === 0) return [];

  const itens: ValePrejuizoItem[] = [];

  rows.forEach((row, idx) => {
    // Normalizar chaves para lowercase sem acentos e sem caracteres especiais
    const normalized: Record<string, any> = {};
    Object.keys(row).forEach((k) => {
      const cleanKey = k
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
      normalized[cleanKey] = row[k];
    });

    const getVal = (...keys: string[]): any => {
      for (const k of keys) {
        const clean = k
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '');
        if (normalized[clean] !== undefined && normalized[clean] !== '') {
          return normalized[clean];
        }
      }
      return '';
    };

    const numVal = (...keys: string[]): number => {
      const val = getVal(...keys);
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
        const clean = val.replace('R$', '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
        const parsed = parseFloat(clean);
        return isNaN(parsed) ? 0 : parsed;
      }
      return 0;
    };

    const itemNo = getVal('itemno', 'itemn', 'item', 'n', 'numero') || idx + 1;
    const rawDataEmissao = getVal('dataemissao', 'data', 'dtemissao', 'emissao');
    let dataEmissao = '';
    if (rawDataEmissao instanceof Date) {
      dataEmissao = rawDataEmissao.toISOString().slice(0, 10);
    } else if (typeof rawDataEmissao === 'string' && rawDataEmissao.includes('/')) {
      const parts = rawDataEmissao.split('/');
      if (parts.length === 3) {
        dataEmissao = `${parts[2].padStart(4, '2026')}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      } else {
        dataEmissao = rawDataEmissao;
      }
    } else if (rawDataEmissao) {
      dataEmissao = String(rawDataEmissao);
    } else {
      dataEmissao = new Date().toISOString().slice(0, 10);
    }

    const notaFiscal = String(getVal('notafiscal', 'nf', 'nota', 'numeronf') || `NF-${104000 + idx}`);
    const mapaCarga = String(getVal('mapadecarga', 'mapacarga', 'mapa', 'carga') || `MAPA-${88000 + idx}`);
    const rotaSetor = String(getVal('rotasetor', 'rota', 'setor', 'linha') || 'ROTA DISTRIBUIÇÃO');
    const motorista = String(getVal('motorista', 'condutor', 'nomemotorista') || 'MOTORISTA OPERAÇÃO');
    const cpfMotorista = String(getVal('cpfmotorista', 'cpf') || '');
    const ajudante1 = String(getVal('ajudante1', 'ajudante1cpfajudante1', 'ajudante', 'primeiroajudante') || '');
    const cpfAjudante1 = String(getVal('cpfajudante1', 'cpf1') || '');
    const ajudante2 = String(getVal('ajudante2', 'ajudante2cpfajudante2', 'segundoajudante') || '');
    const cpfAjudante2 = String(getVal('cpfajudante2', 'cpf2') || '');

    let equipeCompleta = String(getVal('equipecompleta', 'equipe', 'integrantesnomes') || '');
    if (!equipeCompleta) {
      const nomes = [motorista, ajudante1, ajudante2].filter((n) => n && !n.toLowerCase().includes('sem ajudante'));
      equipeCompleta = nomes.length > 1 ? nomes.join(', ') : (nomes.length === 1 ? `${nomes[0]} (Sem Ajudantes)` : 'Sem Ajudantes');
    }

    const statusVale = String(getVal('statusdovale', 'statusvale', 'status', 'situacao') || 'Emitido');
    const volumeHL = numVal('volumetotalhl', 'volumehl', 'volume', 'hl', 'hectolitros');
    const valorTotalPrejuizo = numVal('valortotalprejuizor', 'valortotalprejuizo', 'valortotal', 'prejuizor', 'valorprejuizo', 'valor');
    let totalIntegrantes = numVal('totalintegrantesequipe', 'totalintegrantes', 'integrantes', 'qtdequipe');
    
    if (totalIntegrantes <= 0) {
      if (equipeCompleta.toLowerCase().includes('sem ajudante')) totalIntegrantes = 1;
      else {
        const count = [motorista, ajudante1, ajudante2].filter((n) => n && !n.toLowerCase().includes('sem ajudante')).length;
        totalIntegrantes = count > 0 ? count : 1;
      }
    }

    let valorRateado = numVal('valorrateadoppessoar', 'valorrateadopessoa', 'valorrateado', 'rateio');
    if (valorRateado <= 0 && valorTotalPrejuizo > 0) {
      valorRateado = valorTotalPrejuizo / (totalIntegrantes || 1);
    }

    const qtdItens = numVal('qtditens', 'quantidadeitens', 'qtd', 'quantidade') || 1;
    const codigoCliente = String(getVal('codigoclientenb', 'codigocliente', 'nb', 'codcliente') || '');
    const razaoSocialCliente = String(getVal('razaosocialcliente', 'razaosocial', 'cliente', 'nomecliente') || '');
    const detalhamentoSKUs = String(
      getVal('detalhamentodosskusfaltas', 'detalhamentoskus', 'detalhamento', 'skus', 'produtos', 'faltas') ||
        'BEBIDAS DIVERSAS AMBEV'
    );

    const mesRef = dataEmissao.slice(0, 7);

    itens.push({
      id: `vale-${idx + 1}-${Date.now().toString(36)}`,
      itemNo,
      dataEmissao,
      mesRef,
      notaFiscal,
      mapaCarga,
      rotaSetor,
      motorista,
      cpfMotorista,
      ajudante1,
      cpfAjudante1,
      ajudante2,
      cpfAjudante2,
      equipeCompleta,
      statusVale,
      volumeHL,
      valorTotalPrejuizo,
      totalIntegrantes,
      valorRateadoPorPessoa: valorRateado,
      qtdItens,
      codigoCliente,
      razaoSocialCliente,
      detalhamentoSKUs,
      rawData: row,
    });
  });

  return itens;
}
