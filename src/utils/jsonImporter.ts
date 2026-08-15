import { RegistroPerda, Turno, Area, MotivoPerda } from '../types';

export interface ParseResult {
  records: RegistroPerda[];
  errors: string[];
  totalParsed: number;
}

export const parseQuebrasJSON = (jsonInput: string | object): ParseResult => {
  const records: RegistroPerda[] = [];
  const errors: string[] = [];

  let rawData: any;

  try {
    if (typeof jsonInput === 'string') {
      rawData = JSON.parse(jsonInput);
    } else {
      rawData = jsonInput;
    }
  } catch (err: any) {
    return {
      records: [],
      errors: [`Erro ao analisar JSON: ${err.message || 'Sintaxe JSON inválida'}`],
      totalParsed: 0,
    };
  }

  // Handle wrapped objects like { data: [...] } or { quebras: [...] }
  let itemsArray: any[] = [];
  if (Array.isArray(rawData)) {
    itemsArray = rawData;
  } else if (typeof rawData === 'object' && rawData !== null) {
    if (Array.isArray(rawData.quebras)) itemsArray = rawData.quebras;
    else if (Array.isArray(rawData.data)) itemsArray = rawData.data;
    else if (Array.isArray(rawData.items)) itemsArray = rawData.items;
    else if (Array.isArray(rawData.perdas)) itemsArray = rawData.perdas;
    else itemsArray = [rawData]; // Single object
  }

  if (itemsArray.length === 0) {
    return {
      records: [],
      errors: ['Nenhum registro encontrado no arquivo JSON.'],
      totalParsed: 0,
    };
  }

  itemsArray.forEach((item, index) => {
    try {
      if (typeof item !== 'object' || item === null) {
        errors.push(`Item na posição ${index + 1} não é um objeto válido.`);
        return;
      }

      // Normalize all keys of the item (trim whitespace from key names)
      const norm: Record<string, any> = {};
      for (const [k, v] of Object.entries(item)) {
        norm[k.trim()] = v;
      }

      // 1. DATE & MES_REF
      let rawDateStr =
        norm['Data'] ||
        norm['data'] ||
        norm['DATA'] ||
        norm['Date'] ||
        norm['date'] ||
        new Date().toISOString().slice(0, 10);

      let dateFormatted = new Date().toISOString().slice(0, 10);

      if (typeof rawDateStr === 'string') {
        const cleanStr = rawDateStr.trim();
        // Check YYYY-MM-DD (e.g. "2026-01-01 11:59:15" or "2026-01-01")
        if (/^\d{4}-\d{2}-\d{2}/.test(cleanStr)) {
          dateFormatted = cleanStr.slice(0, 10);
        }
        // Check DD/MM/YYYY
        else if (/^\d{2}\/\d{2}\/\d{4}/.test(cleanStr)) {
          const parts = cleanStr.slice(0, 10).split('/');
          dateFormatted = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      }

      let mesRef = dateFormatted.slice(0, 7);

      // Check "Mês" string if provided (e.g. "JANEIRO", "FEVEREIRO", etc.)
      const mesStrRaw = norm['Mês'] || norm['Mes'] || norm['mes'] || norm['MÊS'] || norm['MES'];
      if (mesStrRaw) {
        const mesStr = String(mesStrRaw).toUpperCase().trim();
        const monthMap: Record<string, string> = {
          JANEIRO: '01',
          FEVEREIRO: '02',
          MARÇO: '03',
          MARCO: '03',
          ABRIL: '04',
          MAIO: '05',
          JUNHO: '06',
          JULHO: '07',
          AGOSTO: '08',
          SETEMBRO: '09',
          OUTUBRO: '10',
          NOVEMBRO: '11',
          DEZEMBRO: '12',
        };
        if (monthMap[mesStr]) {
          const yearPart = dateFormatted.slice(0, 4) || '2026';
          mesRef = `${yearPart}-${monthMap[mesStr]}`;
        }
      }

      // 2. PRODUCT & SKU
      const codProd =
        norm['CodProduto'] !== undefined
          ? norm['CodProduto']
          : norm['codProduto'] !== undefined
          ? norm['codProduto']
          : norm['cod_produto'] !== undefined
          ? norm['cod_produto']
          : norm['codigoProduto'] !== undefined
          ? norm['codigoProduto']
          : norm['COD_PRODUTO'] !== undefined
          ? norm['COD_PRODUTO']
          : '';

      const descProd =
        norm['Descricao'] ||
        norm['descricao'] ||
        norm['DESCRICAO'] ||
        norm['Descrição'] ||
        norm['descrição'] ||
        norm['produto'] ||
        norm['Produto'] ||
        norm['PRODUTO'] ||
        'PRODUTO NÃO ESPECIFICADO';

      const produtoFinal = codProd ? `${codProd} - ${descProd}` : String(descProd);

      // 3. QUANTIDADE
      const quantidade = Math.max(
        1,
        parseInt(
          norm['Quantidade'] ||
            norm['quantidade'] ||
            norm['QUANTIDADE'] ||
            norm['qtd'] ||
            norm['Qtd'] ||
            norm['QTD'] ||
            1,
          10
        )
      );

      // 4. VALOR R$ (VALOR DA AVARIA)
      const rawValor =
        norm['VALOR DA AVARIA'] !== undefined
          ? norm['VALOR DA AVARIA']
          : norm['Valor da Avaria'] !== undefined
          ? norm['Valor da Avaria']
          : norm['valorAvaria'] !== undefined
          ? norm['valorAvaria']
          : norm['VALOR_DA_AVARIA'] !== undefined
          ? norm['VALOR_DA_AVARIA']
          : norm['valor_avaria'] !== undefined
          ? norm['valor_avaria']
          : norm['valorR$'] !== undefined
          ? norm['valorR$']
          : norm['Valor'] !== undefined
          ? norm['Valor']
          : norm['valor'] !== undefined
          ? norm['valor']
          : 0;

      const valorR$ = Math.max(0, parseFloat(String(rawValor).replace(',', '.')) || 0);

      // 5. VOLUME HL (HECTOLITROS)
      let hlPerdido = 0;
      const rawHectPerdido =
        norm['HECTO PERDIDO'] !== undefined
          ? norm['HECTO PERDIDO']
          : norm['Hecto Perdido'] !== undefined
          ? norm['Hecto Perdido']
          : norm['hecto perdido'] !== undefined
          ? norm['hecto perdido']
          : norm['HECTO_PERDIDO'] !== undefined
          ? norm['HECTO_PERDIDO']
          : norm['hlPerdido'] !== undefined
          ? norm['hlPerdido']
          : norm['Hectolitros'] !== undefined
          ? norm['Hectolitros']
          : norm['hectolitros'] !== undefined
          ? norm['hectolitros']
          : norm['VolumeHL'] !== undefined
          ? norm['VolumeHL']
          : undefined;

      const rawHectLitro =
        norm['HECTO LITRO'] !== undefined
          ? norm['HECTO LITRO']
          : norm['Hecto Litro'] !== undefined
          ? norm['Hecto Litro']
          : norm['hecto litro'] !== undefined
          ? norm['hecto litro']
          : norm['HECTO_LITRO'] !== undefined
          ? norm['HECTO_LITRO']
          : norm['HL'] !== undefined
          ? norm['HL']
          : norm['hl'] !== undefined
          ? norm['hl']
          : undefined;

      if (rawHectPerdido !== undefined && rawHectPerdido !== null && rawHectPerdido !== '') {
        hlPerdido = parseFloat(String(rawHectPerdido).replace(',', '.')) || 0;
      } else if (rawHectLitro !== undefined && rawHectLitro !== null && rawHectLitro !== '') {
        const unitHL = parseFloat(String(rawHectLitro).replace(',', '.')) || 0;
        hlPerdido = Number((unitHL * quantidade).toFixed(4));
      } else {
        // Estimate HL based on description, packaging and quantity
        const descUpper = descProd.toUpperCase();
        let hlUnit = 0.0035; // Default 350ml lata (0.0035 HL)

        // Try extracting ml or L directly from description using regex
        const mlMatch = descUpper.match(/(\d+)\s*ML/);
        const lMatch = descUpper.match(/(\d+(?:[.,]\d+)?)\s*L(?:ITRO|TR)?/);

        if (mlMatch && mlMatch[1]) {
          const ml = parseFloat(mlMatch[1]);
          if (!isNaN(ml) && ml > 0) {
            hlUnit = ml / 100000; // 1 HL = 100,000 ml
          }
        } else if (lMatch && lMatch[1]) {
          const l = parseFloat(lMatch[1].replace(',', '.'));
          if (!isNaN(l) && l > 0) {
            hlUnit = l / 100; // 1 HL = 100 L
          }
        } else if (descUpper.includes('269')) {
          hlUnit = 0.00269;
        } else if (descUpper.includes('330')) {
          hlUnit = 0.0033;
        } else if (descUpper.includes('350')) {
          hlUnit = 0.0035;
        } else if (descUpper.includes('355')) {
          hlUnit = 0.00355;
        } else if (descUpper.includes('473') || descUpper.includes('500')) {
          hlUnit = 0.00473;
        } else if (descUpper.includes('600')) {
          hlUnit = 0.006;
        } else if (descUpper.includes('1000') || descUpper.includes('1 LITRO')) {
          hlUnit = 0.01;
        }

        hlPerdido = Number((quantidade * hlUnit).toFixed(4));
        if (hlPerdido <= 0 && valorR$ > 0) {
          hlPerdido = Number((valorR$ / 450).toFixed(4));
        }
      }

      // 6. TURNO
      let rawTurno = String(norm['Turno'] || norm['turno'] || norm['TURNO'] || '').trim();
      let turno: Turno | string = rawTurno || '1º Turno';
      const turnoUpper = rawTurno.toUpperCase();
      if (turnoUpper.includes('NOITE') || turnoUpper.includes('3') || turnoUpper.includes('MADRUGADA'))
        turno = rawTurno || '3º Turno';
      else if (turnoUpper.includes('TARDE') || turnoUpper.includes('2') || turnoUpper.includes('VESPERTINO'))
        turno = rawTurno || '2º Turno';
      else if (
        turnoUpper.includes('MANHÃ') ||
        turnoUpper.includes('MANHA') ||
        turnoUpper.includes('1') ||
        turnoUpper.includes('MATUTINO')
      )
        turno = rawTurno || '1º Turno';
      else if (turnoUpper.includes('ADM')) turno = 'ADM';

      // 8. CODIGO E MOTIVO DA PERDA (Q-CODQUEBRA & MOTIVO DO JSON)
      const rawCodQuebra =
        norm['CodQuebra'] !== undefined
          ? norm['CodQuebra']
          : norm['codQuebra'] !== undefined
          ? norm['codQuebra']
          : norm['COD_QUEBRA'] !== undefined
          ? norm['COD_QUEBRA']
          : norm['cod_quebra'] !== undefined
          ? norm['cod_quebra']
          : norm['codigoMotivo'] !== undefined
          ? norm['codigoMotivo']
          : '524';

      const codQuebraStr = String(rawCodQuebra).trim();
      const codigoMotivo = codQuebraStr.toUpperCase().startsWith('Q-')
        ? codQuebraStr.toUpperCase()
        : `Q-${codQuebraStr}`;

      const rawMotivo = String(
        norm['Motivo'] ||
          norm['motivo'] ||
          norm['MOTIVO'] ||
          norm['DescMotivo'] ||
          norm['descMotivo'] ||
          'AVARIA / QUEBRA'
      ).trim();

      // Motivo receives exactly the value from JSON Motivo (e.g. "FALTA NO PALETE", "QUEBRA COM MOVIMENTAÇÃO", etc.)
      const motivo: MotivoPerda = rawMotivo.toUpperCase();

      // 7. AREA - Regra: "Tudo que for quebra com movimentação é armazém. O resto são as outras áreas."
      let rawArea = String(
        norm['Area'] || norm['area'] || norm['AREA'] || norm['Área'] || norm['área'] || ''
      ).trim();
      const areaUpper = rawArea.toUpperCase();
      const motivoUpper = motivo.toUpperCase();

      let area: Area | string = 'Armazém';
      if (
        motivoUpper.includes('MOVIMENTAÇÃO') ||
        motivoUpper.includes('MOVIMENTACAO') ||
        motivoUpper.includes('MOVIME') ||
        codQuebraStr === '539' ||
        (motivoUpper.includes('QUEBRA') && !motivoUpper.includes('ROTA') && !motivoUpper.includes('ENTREGA') && !motivoUpper.includes('FALTA'))
      ) {
        area = 'Armazém';
      } else if (
        motivoUpper.includes('FALTA NO PALETE') ||
        motivoUpper.includes('FALTA PALETE') ||
        codQuebraStr === '524' ||
        codQuebraStr === '576'
      ) {
        area = areaUpper && areaUpper !== 'ARMAZEM' && areaUpper !== 'ARMAZÉM' ? rawArea : 'Falta no Palete';
      } else if (
        areaUpper.includes('ROTA') ||
        areaUpper.includes('ENTREGA') ||
        motivoUpper.includes('ROTA') ||
        motivoUpper.includes('ENTREGA')
      ) {
        area = 'Rota / Entrega';
      } else if (
        motivoUpper.includes('SHELF') ||
        motivoUpper.includes('VALIDADE') ||
        motivoUpper.includes('VENCIMENTO') ||
        motivoUpper.includes('ESTUFADO') ||
        motivoUpper.includes('VAZAMENTO')
      ) {
        area = 'Qualidade / WQI';
      } else if (areaUpper.includes('ENVASE') || areaUpper.includes('LINHA')) {
        area = rawArea || 'Envase';
      } else if (areaUpper.includes('PATIO') || areaUpper.includes('PÁTIO')) {
        area = rawArea || 'Pátio';
      } else if (areaUpper.includes('RECEBIMENTO')) {
        area = rawArea || 'Recebimento';
      } else if (areaUpper.includes('CARREGAMENTO') || areaUpper.includes('DESCARGA')) {
        area = rawArea || 'Carregamento';
      } else {
        area = areaUpper && areaUpper !== 'ARMAZEM' && areaUpper !== 'ARMAZÉM' ? rawArea : 'Outras Áreas';
      }

      // 9. RESPONSÁVEL / COLABORADOR / FUNÇÃO
      const colab = String(
        norm['Colaborador'] ||
          norm['colaborador'] ||
          norm['COLABORADOR'] ||
          norm['responsavel'] ||
          norm['Responsavel'] ||
          'Operador'
      ).trim();
      const func = String(
        norm['Funcao'] ||
          norm['funcao'] ||
          norm['FUNCAO'] ||
          norm['Função'] ||
          norm['função'] ||
          norm['cargo'] ||
          ''
      ).trim();
      const responsavel = func ? `${colab} (${func})` : colab;

      // 10. CAUSA & OBSERVAÇÃO
      const causa =
        norm['causa'] ||
        norm['Causa'] ||
        norm['CAUSA'] ||
        norm['CausaRaiz'] ||
        norm['Detalhe'] ||
        rawMotivo ||
        'Ocorrência identificada na rotina';

      const observacao =
        norm['observacao'] ||
        norm['Observacao'] ||
        norm['OBSERVACAO'] ||
        `Cód Quebra: ${codQuebraStr} | Motivo: ${rawMotivo}${func ? ` | Função: ${func}` : ''}`;

      const unitHLValue = rawHectLitro !== undefined && rawHectLitro !== null && rawHectLitro !== ''
        ? parseFloat(String(rawHectLitro).replace(',', '.'))
        : (hlPerdido > 0 && quantidade > 0 ? Number((hlPerdido / quantidade).toFixed(4)) : 0.0035);

      records.push({
        id: norm['id'] || `PERD-QBR-${Date.now()}-${index}`,
        data: dateFormatted,
        dataHora: typeof rawDateStr === 'string' ? rawDateStr.trim() : dateFormatted,
        mesRef,
        mesNome: mesStrRaw ? String(mesStrRaw).trim().toUpperCase() : undefined,
        turno,
        area,
        codProduto: codProd || undefined,
        descricaoProduto: descProd || undefined,
        produto: produtoFinal,
        quantidade,
        codQuebra: rawCodQuebra,
        codigoMotivo,
        motivo,
        colaborador: colab || undefined,
        funcao: func || undefined,
        responsavel,
        valorR$,
        hectoLitro: unitHLValue,
        hlPerdido,
        causa,
        observacao,
        createdAt: new Date().toISOString(),
        rawData: norm,
      });
    } catch (err: any) {
      errors.push(`Erro ao processar linha ${index + 1}: ${err.message || 'Dados inválidos'}`);
    }
  });

  return {
    records,
    errors,
    totalParsed: records.length,
  };
};
