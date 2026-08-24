import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import {
  DEMO_REGISTROS_PERDAS,
  DEMO_PLANOS_ACAO,
  HISTORICO_KPIS,
  DEMO_COMENTARIOS_REVISAO,
  DEMO_TROCAS_IMPROPRIO,
} from './src/data/mockData';
import { DEMO_REPOSICAO_BEBIDAS } from './src/data/mockReposicao';
import { DADOS_PLANILHA_DEMO } from './src/utils/spreadsheetAnalyzer';
import { DEMO_CONSUMO_INTERNO_LIST } from './src/data/mockConsumoInterno';
import { DEMO_VALES_PREJUIZO } from './src/utils/valesAnalytics';

const DATA_FILE = path.join(process.cwd(), 'data_store.json');
const PERDAS_NORMALIZADAS_FILE = path.join(process.cwd(), 'src', 'data', 'perdas_normalizadas.json');

let defaultPerdasPor: any[] = [];
try {
  if (fs.existsSync(PERDAS_NORMALIZADAS_FILE)) {
    defaultPerdasPor = JSON.parse(fs.readFileSync(PERDAS_NORMALIZADAS_FILE, 'utf-8'));
  }
} catch {
  defaultPerdasPor = [];
}

// Memory store initialized with demo data if no file exists
let db: {
  perdas: any[];
  acoes: any[];
  kpis: any[];
  comentarios: any[];
  trocasImproprio: any[];
  trocaPlanilhaItens: any[];
  reposicaoItens: any[];
  consumoInternoItens: any[];
  perdasPorItens: any[];
  valesItens: any[];
  nomeArquivoTroca: string | null;
} = {
  perdas: [...DEMO_REGISTROS_PERDAS],
  acoes: [...DEMO_PLANOS_ACAO],
  kpis: [...HISTORICO_KPIS],
  comentarios: [...DEMO_COMENTARIOS_REVISAO],
  trocasImproprio: [...DEMO_TROCAS_IMPROPRIO],
  trocaPlanilhaItens: [...DADOS_PLANILHA_DEMO],
  reposicaoItens: [...DEMO_REPOSICAO_BEBIDAS],
  consumoInternoItens: [...DEMO_CONSUMO_INTERNO_LIST],
  perdasPorItens: defaultPerdasPor.length > 0 ? [...defaultPerdasPor] : [],
  valesItens: [...DEMO_VALES_PREJUIZO],
  nomeArquivoTroca: null,
};

// Load persistent data from file if available
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed.perdas && parsed.acoes && parsed.kpis) {
        if (Array.isArray(parsed.perdas) && parsed.perdas.length === 0 && DEMO_REGISTROS_PERDAS.length > 0) {
          parsed.perdas = [...DEMO_REGISTROS_PERDAS];
        }
        if (Array.isArray(parsed.perdas)) {
          parsed.perdas = parsed.perdas.map((p: any) => {
            let trueMotivo = p.motivo;
            if (p.observacao && p.observacao.includes('Motivo:')) {
              const match = p.observacao.match(/Motivo:\s*([^|]+)/i);
              if (match && match[1]) {
                trueMotivo = match[1].trim().toUpperCase();
              }
            } else if (p.causa && p.causa.trim() && p.causa !== 'Ocorrência identificada na rotina' && p.causa !== 'Avaria ou divergência identificada na rotina') {
              trueMotivo = p.causa.trim().toUpperCase();
            }

            let cod = String(p.codigoMotivo || '524').trim();
            if (!cod.toUpperCase().startsWith('Q-')) {
              cod = `Q-${cod}`;
            }

            const motUpper = String(trueMotivo || p.motivo || '').toUpperCase();
            let area = p.area || 'Armazém';
            if (
              motUpper.includes('MOVIMENTAÇÃO') ||
              motUpper.includes('MOVIMENTACAO') ||
              motUpper.includes('MOVIME') ||
              cod === 'Q-539' ||
              (motUpper.includes('QUEBRA') && !motUpper.includes('ROTA') && !motUpper.includes('ENTREGA') && !motUpper.includes('FALTA'))
            ) {
              area = 'Armazém';
            } else if (motUpper.includes('FALTA NO PALETE') || cod === 'Q-524' || cod === 'Q-576') {
              area = p.area && p.area.toUpperCase() !== 'ARMAZEM' && p.area.toUpperCase() !== 'ARMAZÉM' ? p.area : 'Falta no Palete';
            } else if (motUpper.includes('ROTA') || motUpper.includes('ENTREGA')) {
              area = 'Rota / Entrega';
            } else if (motUpper.includes('SHELF') || motUpper.includes('VALIDADE') || motUpper.includes('VENCIMENTO')) {
              area = 'Qualidade / WQI';
            }

            return {
              ...p,
              area,
              codigoMotivo: cod,
              motivo: trueMotivo || p.motivo,
            };
          });
        }
        // Refresh KPIs with official monthly targets
        parsed.kpis = [...HISTORICO_KPIS];
        // If perdas has older demo generation, ensure records match updated target perdas
        if (Array.isArray(parsed.perdas) && (parsed.perdas.length === 0 || parsed.perdas[0]?.id?.startsWith('PERD-2026-'))) {
          parsed.perdas = [...DEMO_REGISTROS_PERDAS];
        }
        if (!Array.isArray(parsed.trocasImproprio) || parsed.trocasImproprio.length === 0) {
          parsed.trocasImproprio = [...DEMO_TROCAS_IMPROPRIO];
        }
        if (!Array.isArray(parsed.trocaPlanilhaItens) || parsed.trocaPlanilhaItens.length === 0) {
          parsed.trocaPlanilhaItens = [...DADOS_PLANILHA_DEMO];
        }
        if (!Array.isArray(parsed.reposicaoItens) || parsed.reposicaoItens.length === 0) {
          parsed.reposicaoItens = [...DEMO_REPOSICAO_BEBIDAS];
        }
        if (!Array.isArray(parsed.consumoInternoItens) || parsed.consumoInternoItens.length === 0) {
          parsed.consumoInternoItens = [...DEMO_CONSUMO_INTERNO_LIST];
        }
        if (!Array.isArray(parsed.perdasPorItens) || parsed.perdasPorItens.length === 0) {
          parsed.perdasPorItens = defaultPerdasPor.length > 0 ? [...defaultPerdasPor] : [];
        }
        if (!Array.isArray(parsed.valesItens) || parsed.valesItens.length === 0) {
          parsed.valesItens = [...DEMO_VALES_PREJUIZO];
        }
        db = parsed;
        saveData();
        console.log('[SERVER] Data loaded and synchronized from data_store.json');
      }
    } else {
      saveData();
    }
  } catch (err) {
    console.error('[SERVER] Error loading data_store.json:', err);
  }
}


function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('[SERVER] Error saving data_store.json:', err);
  }
}

loadData();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // API Routes
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Registros de Perdas
  app.get('/api/perdas', (_req, res) => {
    res.json(db.perdas);
  });

  app.post('/api/perdas/batch', (req, res) => {
    const { items, overwrite } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Array de itens é obrigatório' });
    }
    const formatted = items.map((item, idx) => ({
      ...item,
      id: item.id || `PERD-${Date.now()}-${idx}`,
      createdAt: item.createdAt || new Date().toISOString(),
    }));

    if (overwrite) {
      db.perdas = formatted;
    } else {
      db.perdas = [...formatted, ...db.perdas];
    }
    saveData();
    res.json({ success: true, count: formatted.length, total: db.perdas.length });
  });

  app.post('/api/perdas', (req, res) => {
    const nuevaPerda = req.body;
    if (!nuevaPerda.id) {
      nuevaPerda.id = `PERD-${Date.now()}`;
    }
    if (!nuevaPerda.createdAt) {
      nuevaPerda.createdAt = new Date().toISOString();
    }
    db.perdas.unshift(nuevaPerda);
    saveData();
    res.status(201).json(nuevaPerda);
  });

  app.put('/api/perdas/:id', (req, res) => {
    const { id } = req.params;
    const index = db.perdas.findIndex((p) => p.id === id);
    if (index !== -1) {
      db.perdas[index] = { ...db.perdas[index], ...req.body };
      saveData();
      return res.json(db.perdas[index]);
    }
    res.status(404).json({ error: 'Registro não encontrado' });
  });

  app.delete('/api/perdas/:id', (req, res) => {
    const { id } = req.params;
    db.perdas = db.perdas.filter((p) => p.id !== id);
    saveData();
    res.json({ success: true, id });
  });

  // Planos de Ação
  app.get('/api/acoes', (_req, res) => {
    res.json(db.acoes);
  });

  app.post('/api/acoes', (req, res) => {
    const novaAcao = req.body;
    if (!novaAcao.id) {
      novaAcao.id = `PA-${Date.now()}`;
    }
    db.acoes.unshift(novaAcao);
    saveData();
    res.status(201).json(novaAcao);
  });

  app.put('/api/acoes/:id', (req, res) => {
    const { id } = req.params;
    const index = db.acoes.findIndex((a) => a.id === id);
    if (index !== -1) {
      db.acoes[index] = { ...db.acoes[index], ...req.body };
      saveData();
      return res.json(db.acoes[index]);
    }
    res.status(404).json({ error: 'Plano de Ação não encontrado' });
  });

  app.delete('/api/acoes/:id', (req, res) => {
    const { id } = req.params;
    db.acoes = db.acoes.filter((a) => a.id !== id);
    saveData();
    res.json({ success: true, id });
  });

  // KPIs
  app.get('/api/kpis', (_req, res) => {
    res.json(db.kpis);
  });

  app.put('/api/kpis/:mes', (req, res) => {
    const { mes } = req.params;
    const index = db.kpis.findIndex((k) => k.mes === mes);
    if (index !== -1) {
      db.kpis[index] = { ...db.kpis[index], ...req.body };
    } else {
      db.kpis.push({ mes, ...req.body });
    }
    saveData();
    res.json(db.kpis);
  });

  // Comentários da Administração
  app.get('/api/comentarios', (_req, res) => {
    res.json(db.comentarios);
  });

  app.post('/api/comentarios', (req, res) => {
    const novoComentario = req.body;
    if (!novoComentario.id) {
      novoComentario.id = `COM-${Date.now()}`;
    }
    db.comentarios.unshift(novoComentario);
    saveData();
    res.status(201).json(novoComentario);
  });

  app.delete('/api/comentarios/:id', (req, res) => {
    const { id } = req.params;
    db.comentarios = db.comentarios.filter((c) => c.id !== id);
    saveData();
    res.json({ success: true, id });
  });

  // Troca de Produto Impróprio
  app.get('/api/trocas-improprio', (_req, res) => {
    res.json(db.trocasImproprio || []);
  });

  app.post('/api/trocas-improprio', (req, res) => {
    const novaTroca = req.body;
    if (!novaTroca.id) {
      novaTroca.id = `TR-${Date.now()}`;
    }
    if (!novaTroca.createdAt) {
      novaTroca.createdAt = new Date().toISOString();
    }
    if (!Array.isArray(db.trocasImproprio)) {
      db.trocasImproprio = [];
    }
    db.trocasImproprio.unshift(novaTroca);
    saveData();
    res.status(201).json(novaTroca);
  });

  app.put('/api/trocas-improprio/:id', (req, res) => {
    const { id } = req.params;
    const index = (db.trocasImproprio || []).findIndex((t) => t.id === id);
    if (index !== -1) {
      db.trocasImproprio[index] = { ...db.trocasImproprio[index], ...req.body };
      saveData();
      return res.json(db.trocasImproprio[index]);
    }
    res.status(404).json({ error: 'Troca não encontrada' });
  });

  app.delete('/api/trocas-improprio/:id', (req, res) => {
    const { id } = req.params;
    db.trocasImproprio = (db.trocasImproprio || []).filter((t) => t.id !== id);
    saveData();
    res.json({ success: true, id });
  });

  // Troca de Produto Impróprio - Planilha / JSON
  app.get('/api/troca-planilha', (_req, res) => {
    res.json({
      itens: db.trocaPlanilhaItens || DADOS_PLANILHA_DEMO,
      nomeArquivo: db.nomeArquivoTroca || null,
    });
  });

  app.post('/api/troca-planilha/batch', (req, res) => {
    const { items, nomeArquivo, overwrite } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Array de itens é obrigatório' });
    }
    if (overwrite) {
      db.trocaPlanilhaItens = items;
    } else {
      db.trocaPlanilhaItens = [...items, ...(db.trocaPlanilhaItens || [])];
    }
    if (nomeArquivo !== undefined) {
      db.nomeArquivoTroca = nomeArquivo;
    }
    saveData();
    res.json({
      success: true,
      count: items.length,
      total: db.trocaPlanilhaItens.length,
      nomeArquivo: db.nomeArquivoTroca,
    });
  });

  // Reposição de Bebidas
  app.get('/api/reposicao', (_req, res) => {
    res.json(db.reposicaoItens || DEMO_REPOSICAO_BEBIDAS);
  });

  app.post('/api/reposicao/batch', (req, res) => {
    const { items, overwrite } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Array de itens é obrigatório' });
    }
    if (overwrite) {
      db.reposicaoItens = items;
    } else {
      db.reposicaoItens = [...items, ...(db.reposicaoItens || [])];
    }
    saveData();
    res.json({ success: true, count: items.length, total: db.reposicaoItens.length });
  });

  app.post('/api/reposicao', (req, res) => {
    const novoItem = req.body;
    if (!novoItem.id) {
      novoItem.id = `REP-${Date.now()}`;
    }
    if (!novoItem.createdAt) {
      novoItem.createdAt = new Date().toISOString();
    }
    if (!Array.isArray(db.reposicaoItens)) {
      db.reposicaoItens = [];
    }
    db.reposicaoItens.unshift(novoItem);
    saveData();
    res.status(201).json(novoItem);
  });

  app.put('/api/reposicao/:id', (req, res) => {
    const { id } = req.params;
    const index = (db.reposicaoItens || []).findIndex((i) => i.id === id);
    if (index !== -1) {
      db.reposicaoItens[index] = { ...db.reposicaoItens[index], ...req.body };
      saveData();
      return res.json(db.reposicaoItens[index]);
    }
    res.status(404).json({ error: 'Item não encontrado' });
  });

  app.delete('/api/reposicao/:id', (req, res) => {
    const { id } = req.params;
    db.reposicaoItens = (db.reposicaoItens || []).filter((i) => i.id !== id);
    saveData();
    res.json({ success: true, id });
  });

  // Consumo Interno
  app.get('/api/consumo-interno', (_req, res) => {
    res.json(db.consumoInternoItens || DEMO_CONSUMO_INTERNO_LIST);
  });

  app.post('/api/consumo-interno/batch', (req, res) => {
    const { items, overwrite } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Array de itens é obrigatório' });
    }
    if (overwrite) {
      db.consumoInternoItens = items;
    } else {
      db.consumoInternoItens = [...items, ...(db.consumoInternoItens || [])];
    }
    saveData();
    res.json({ success: true, count: items.length, total: db.consumoInternoItens.length });
  });

  app.post('/api/consumo-interno', (req, res) => {
    const novoItem = req.body;
    if (!novoItem.id) {
      novoItem.id = `CI-${Date.now()}`;
    }
    if (!novoItem.createdAt) {
      novoItem.createdAt = new Date().toISOString();
    }
    if (!Array.isArray(db.consumoInternoItens)) {
      db.consumoInternoItens = [];
    }
    db.consumoInternoItens.unshift(novoItem);
    saveData();
    res.status(201).json(novoItem);
  });

  app.put('/api/consumo-interno/:id', (req, res) => {
    const { id } = req.params;
    const index = (db.consumoInternoItens || []).findIndex((i) => i.id === id);
    if (index !== -1) {
      db.consumoInternoItens[index] = { ...db.consumoInternoItens[index], ...req.body };
      saveData();
      return res.json(db.consumoInternoItens[index]);
    }
    res.status(404).json({ error: 'Item não encontrado' });
  });

  app.delete('/api/consumo-interno/:id', (req, res) => {
    const { id } = req.params;
    db.consumoInternoItens = (db.consumoInternoItens || []).filter((i) => i.id !== id);
    saveData();
    res.json({ success: true, id });
  });

  // Perdas Por Mercadoria
  app.get('/api/perdas-por', (_req, res) => {
    res.json(db.perdasPorItens || defaultPerdasPor);
  });

  app.post('/api/perdas-por/batch', (req, res) => {
    const { items, overwrite } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Array de itens é obrigatório' });
    }
    if (overwrite) {
      db.perdasPorItens = items;
    } else {
      db.perdasPorItens = [...items, ...(db.perdasPorItens || [])];
    }
    saveData();
    res.json({ success: true, count: items.length, total: db.perdasPorItens.length });
  });

  // Gestão de Vales
  app.get('/api/vales', (_req, res) => {
    res.json(db.valesItens || DEMO_VALES_PREJUIZO);
  });

  app.post('/api/vales/batch', (req, res) => {
    const { items, overwrite } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Array de itens é obrigatório' });
    }
    if (overwrite) {
      db.valesItens = items;
    } else {
      db.valesItens = [...items, ...(db.valesItens || [])];
    }
    saveData();
    res.json({ success: true, count: items.length, total: db.valesItens.length });
  });

  // Reset para Dados Demonstrativos Originais
  app.post('/api/reset-demo', (_req, res) => {
    db = {
      perdas: [...DEMO_REGISTROS_PERDAS],
      acoes: [...DEMO_PLANOS_ACAO],
      kpis: [...HISTORICO_KPIS],
      comentarios: [...DEMO_COMENTARIOS_REVISAO],
      trocasImproprio: [...DEMO_TROCAS_IMPROPRIO],
      trocaPlanilhaItens: [...DADOS_PLANILHA_DEMO],
      reposicaoItens: [...DEMO_REPOSICAO_BEBIDAS],
      consumoInternoItens: [...DEMO_CONSUMO_INTERNO_LIST],
      perdasPorItens: defaultPerdasPor.length > 0 ? [...defaultPerdasPor] : [],
      valesItens: [...DEMO_VALES_PREJUIZO],
      nomeArquivoTroca: null,
    };
    saveData();
    res.json({ success: true, message: 'Dados restaurados com sucesso!' });
  });

  // Salvar Todos os Dados da Plataforma (Backup & Persistência Completa)
  app.get('/api/backup', (_req, res) => {
    const totalQuebras = (db.perdas || []).length;
    const totalReposicao = (db.reposicaoItens || []).length;
    const totalPerdasPor = (db.perdasPorItens || []).length;
    const totalConsumoInterno = (db.consumoInternoItens || []).length;
    const totalTrocasImproprio = (db.trocasImproprio || []).length;
    const totalTrocaPlanilha = (db.trocaPlanilhaItens || []).length;
    const totalPlanosAcao = (db.acoes || []).length;
    const totalVales = (db.valesItens || []).length;
    const totalKPIs = (db.kpis || []).length;
    const totalComentarios = (db.comentarios || []).length;
    const totalRegistrosGerais =
      totalQuebras +
      totalReposicao +
      totalPerdasPor +
      totalConsumoInterno +
      totalTrocasImproprio +
      totalTrocaPlanilha +
      totalPlanosAcao +
      totalVales +
      totalKPIs +
      totalComentarios;

    res.json({
      appName: 'Armazém Fácil - Pacote Prejuízo AMBEV',
      version: '2026.1',
      exportedAt: new Date().toISOString(),
      summary: {
        totalQuebras,
        totalReposicao,
        totalPerdasPor,
        totalConsumoInterno,
        totalTrocasImproprio,
        totalTrocaPlanilha,
        totalPlanosAcao,
        totalVales,
        totalKPIs,
        totalComentarios,
        totalRegistrosGerais,
      },
      data: {
        perdas: db.perdas || [],
        reposicaoItens: db.reposicaoItens || [],
        perdasPorItens: db.perdasPorItens || [],
        consumoInternoItens: db.consumoInternoItens || [],
        trocasImproprio: db.trocasImproprio || [],
        trocaPlanilhaItens: db.trocaPlanilhaItens || [],
        nomeArquivoTroca: db.nomeArquivoTroca || null,
        acoes: db.acoes || [],
        kpis: db.kpis || [],
        comentarios: db.comentarios || [],
        valesItens: db.valesItens || [],
      },
    });
  });

  app.post('/api/backup/save-all', (req, res) => {
    const payload = req.body || {};
    const incomingData = payload.data || payload;

    if (incomingData) {
      if (Array.isArray(incomingData.perdas)) db.perdas = incomingData.perdas;
      if (Array.isArray(incomingData.reposicaoItens)) db.reposicaoItens = incomingData.reposicaoItens;
      if (Array.isArray(incomingData.perdasPorItens)) db.perdasPorItens = incomingData.perdasPorItens;
      if (Array.isArray(incomingData.consumoInternoItens)) db.consumoInternoItens = incomingData.consumoInternoItens;
      if (Array.isArray(incomingData.trocasImproprio)) db.trocasImproprio = incomingData.trocasImproprio;
      if (Array.isArray(incomingData.trocaPlanilhaItens)) db.trocaPlanilhaItens = incomingData.trocaPlanilhaItens;
      if (Array.isArray(incomingData.acoes)) db.acoes = incomingData.acoes;
      if (Array.isArray(incomingData.kpis)) db.kpis = incomingData.kpis;
      if (Array.isArray(incomingData.comentarios)) db.comentarios = incomingData.comentarios;
      if (Array.isArray(incomingData.valesItens)) db.valesItens = incomingData.valesItens;
      if (incomingData.nomeArquivoTroca !== undefined) db.nomeArquivoTroca = incomingData.nomeArquivoTroca;
    }

    saveData();

    const totalQuebras = (db.perdas || []).length;
    const totalReposicao = (db.reposicaoItens || []).length;
    const totalPerdasPor = (db.perdasPorItens || []).length;
    const totalConsumoInterno = (db.consumoInternoItens || []).length;
    const totalTrocasImproprio = (db.trocasImproprio || []).length;
    const totalTrocaPlanilha = (db.trocaPlanilhaItens || []).length;
    const totalPlanosAcao = (db.acoes || []).length;
    const totalVales = (db.valesItens || []).length;
    const totalRegistrosGerais =
      totalQuebras +
      totalReposicao +
      totalPerdasPor +
      totalConsumoInterno +
      totalTrocasImproprio +
      totalTrocaPlanilha +
      totalPlanosAcao +
      totalVales;

    res.json({
      success: true,
      message: 'Todos os dados da plataforma foram persistidos e salvos com sucesso no servidor!',
      savedAt: new Date().toISOString(),
      stats: {
        totalQuebras,
        totalReposicao,
        totalPerdasPor,
        totalConsumoInterno,
        totalTrocasImproprio,
        totalTrocaPlanilha,
        totalPlanosAcao,
        totalVales,
        totalRegistrosGerais,
      },
    });
  });

  app.post('/api/backup/restore', (req, res) => {
    const payload = req.body;
    if (!payload) {
      return res.status(400).json({ error: 'Conteúdo de backup inválido' });
    }
    const data = payload.data || payload;

    if (Array.isArray(data.perdas)) db.perdas = data.perdas;
    if (Array.isArray(data.reposicaoItens)) db.reposicaoItens = data.reposicaoItens;
    if (Array.isArray(data.perdasPorItens)) db.perdasPorItens = data.perdasPorItens;
    if (Array.isArray(data.consumoInternoItens)) db.consumoInternoItens = data.consumoInternoItens;
    if (Array.isArray(data.trocasImproprio)) db.trocasImproprio = data.trocasImproprio;
    if (Array.isArray(data.trocaPlanilhaItens)) db.trocaPlanilhaItens = data.trocaPlanilhaItens;
    if (Array.isArray(data.acoes)) db.acoes = data.acoes;
    if (Array.isArray(data.kpis)) db.kpis = data.kpis;
    if (Array.isArray(data.comentarios)) db.comentarios = data.comentarios;
    if (Array.isArray(data.valesItens)) db.valesItens = data.valesItens;
    if (data.nomeArquivoTroca !== undefined) db.nomeArquivoTroca = data.nomeArquivoTroca;

    saveData();

    res.json({
      success: true,
      message: 'Backup completo da plataforma restaurado com sucesso!',
      restoredAt: new Date().toISOString(),
      stats: {
        perdas: (db.perdas || []).length,
        reposicao: (db.reposicaoItens || []).length,
        perdasPor: (db.perdasPorItens || []).length,
        consumoInterno: (db.consumoInternoItens || []).length,
        trocas: (db.trocasImproprio || []).length,
        trocaPlanilha: (db.trocaPlanilhaItens || []).length,
        acoes: (db.acoes || []).length,
        vales: (db.valesItens || []).length,
      },
    });
  });

  // Vite Integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SERVER] Pacote Prejuízo AMBEV Backend executando em http://0.0.0.0:${PORT}`);
  });
}

startServer();
