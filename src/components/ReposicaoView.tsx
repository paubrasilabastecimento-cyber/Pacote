import React, { useState, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  DollarSign,
  TrendingUp,
  Package,
  Boxes,
  FileSpreadsheet,
  FileJson,
  Code2,
  Upload,
  Download,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Calendar,
  AlertTriangle,
  Flame,
  Layers,
  Sparkles,
  BarChart2,
  Trash2,
  Edit2,
  X,
  RotateCcw,
  CheckCircle2,
  Info,
  Copy,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  Legend,
  PieChart,
  Pie,
} from 'recharts';
import { ItemReposicao, FiltroReposicao } from '../types/reposicao';
import { DEMO_REPOSICAO_BEBIDAS } from '../data/mockReposicao';
import {
  formatBRL,
  formatNumber,
  formatPercent,
  formatDataBR,
  calcularResumoKPI,
  calcularValorPorMes,
  calcularTop8Produtos,
  calcularValorPorEmbalagem,
  gerarAchadosRelevantes,
  processarPlanilhaReposicao,
  exportarParaCSV,
  normalizarEmbalagem,
} from '../utils/reposicaoUtils';

const CORES_EMBALAGEM: Record<string, string> = {
  Lata: '#38bdf8', // Sky 400
  'Garrafa Inteira': '#f59e0b', // Amber 500
  Litrão: '#10b981', // Emerald 500
  'Long Neck': '#a855f7', // Purple 500
  PET: '#ec4899', // Pink 500
  Outros: '#64748b', // Slate 500
};

export const ReposicaoView: React.FC = () => {
  // Estado principal de dados com persistência local
  const [itens, setItens] = useState<ItemReposicao[]>(() => {
    try {
      const cached = localStorage.getItem('AMBEV_REPOSICAO_BEBIDAS');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return DEMO_REPOSICAO_BEBIDAS;
  });

  // Filtros locais
  const [filtroMes, setFiltroMes] = useState<string>('');
  const [filtroEmbalagem, setFiltroEmbalagem] = useState<string>('');
  const [buscaTermo, setBuscaTermo] = useState<string>('');
  const [ordenacao, setOrdenacao] = useState<'valor-desc' | 'valor-asc' | 'qtde-desc' | 'data-desc' | 'data-asc'>('valor-desc');

  // Modais
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState<boolean>(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState<boolean>(false);
  const [editItem, setEditItem] = useState<ItemReposicao | null>(null);
  const [textoColado, setTextoColado] = useState<string>('');
  const [jsonColado, setJsonColado] = useState<string>('');
  const [importStatus, setImportStatus] = useState<{ tipo: 'sucesso' | 'erro' | null; msg: string }>({ tipo: null, msg: '' });
  const [jsonImportStatus, setJsonImportStatus] = useState<{ tipo: 'sucesso' | 'erro' | null; msg: string }>({ tipo: null, msg: '' });

  // Formulário de Novo/Edição
  const [formNovo, setFormNovo] = useState<{
    dataOperacao: string;
    descricao: string;
    valor: string;
    qtde: string;
    embalagem: string;
    motivo: string;
    observacao: string;
  }>({
    dataOperacao: new Date().toISOString().slice(0, 10),
    descricao: '',
    valor: '',
    qtde: '',
    embalagem: 'Lata',
    motivo: 'Avaria em Movimentação',
    observacao: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);

  // Sincronizar com a API se disponível
  React.useEffect(() => {
    fetch('/api/reposicao')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setItens(data);
          try {
            localStorage.setItem('AMBEV_REPOSICAO_BEBIDAS', JSON.stringify(data));
          } catch {
            // ignore
          }
        }
      })
      .catch(() => {
        // use local
      });
  }, []);

  // Salvar no localStorage e sincronizar com o backend
  const persistData = (newItens: ItemReposicao[]) => {
    setItens(newItens);
    try {
      localStorage.setItem('AMBEV_REPOSICAO_BEBIDAS', JSON.stringify(newItens));
    } catch (e) {
      console.warn('Erro ao salvar no cache:', e);
    }

    fetch('/api/reposicao/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: newItens, overwrite: true }),
    }).catch(() => {
      // ignore
    });
  };

  // Itens filtrados para cálculo e tabela
  const itensFiltrados = useMemo(() => {
    return itens.filter((item) => {
      if (filtroMes && item.mesRef !== filtroMes && !item.dataOperacao.startsWith(filtroMes)) {
        return false;
      }
      if (filtroEmbalagem && item.embalagem !== filtroEmbalagem) {
        return false;
      }
      if (buscaTermo) {
        const termo = buscaTermo.toLowerCase();
        const matchDesc = (item.descricao || '').toLowerCase().includes(termo);
        const matchEmb = (item.embalagem || '').toLowerCase().includes(termo);
        const matchMot = (item.motivo || '').toLowerCase().includes(termo);
        if (!matchDesc && !matchEmb && !matchMot) return false;
      }
      return true;
    });
  }, [itens, filtroMes, filtroEmbalagem, buscaTermo]);

  // Lista ordenada para a tabela
  const itensOrdenados = useMemo(() => {
    return [...itensFiltrados].sort((a, b) => {
      if (ordenacao === 'valor-desc') return b.valor - a.valor;
      if (ordenacao === 'valor-asc') return a.valor - b.valor;
      if (ordenacao === 'qtde-desc') return b.qtde - a.qtde;
      if (ordenacao === 'data-desc') return b.dataOperacao.localeCompare(a.dataOperacao);
      if (ordenacao === 'data-asc') return a.dataOperacao.localeCompare(b.dataOperacao);
      return 0;
    });
  }, [itensFiltrados, ordenacao]);

  // Cálculos analíticos
  const kpis = useMemo(() => calcularResumoKPI(itensFiltrados), [itensFiltrados]);
  const dadosPorMes = useMemo(() => calcularValorPorMes(itensFiltrados), [itensFiltrados]);
  const dadosTop8 = useMemo(() => calcularTop8Produtos(itensFiltrados), [itensFiltrados]);
  const dadosPorEmbalagem = useMemo(() => calcularValorPorEmbalagem(itensFiltrados), [itensFiltrados]);
  const achados = useMemo(() => gerarAchadosRelevantes(itensFiltrados), [itensFiltrados]);

  // Lista de meses disponíveis para o dropdown
  const mesesDisponiveis = useMemo(() => {
    const setMeses = new Set<string>();
    itens.forEach((i) => {
      if (i.mesRef) setMeses.add(i.mesRef);
      else if (i.dataOperacao) setMeses.add(i.dataOperacao.slice(0, 7));
    });
    return Array.from(setMeses).sort().reverse();
  }, [itens]);

  // Lista de tipos de embalagem disponíveis
  const embalagensDisponiveis = useMemo(() => {
    const setEmb = new Set<string>();
    itens.forEach((i) => setEmb.add(i.embalagem || 'Outros'));
    return Array.from(setEmb);
  }, [itens]);

  // Handler para Upload de Planilha Excel ou CSV
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus({ tipo: null, msg: '' });
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const rawJson = XLSX.utils.sheet_to_json(ws, { raw: false, defval: '' });

        if (!rawJson || rawJson.length === 0) {
          setImportStatus({ tipo: 'erro', msg: 'A planilha selecionada está vazia ou sem dados legíveis.' });
          return;
        }

        const itensProcessados = processarPlanilhaReposicao(rawJson);
        if (itensProcessados.length === 0) {
          setImportStatus({
            tipo: 'erro',
            msg: 'Nenhuma coluna correspondente encontrada. Verifique se a planilha possui: Dt. Operacao, Descrição, Valor, Qtde e Embalagem.',
          });
          return;
        }

        persistData(itensProcessados);
        setImportStatus({
          tipo: 'sucesso',
          msg: `${itensProcessados.length} lançamentos importados e processados com sucesso!`,
        });
        setTimeout(() => {
          setIsImportModalOpen(false);
          setImportStatus({ tipo: null, msg: '' });
        }, 1200);
      } catch (err) {
        console.error(err);
        setImportStatus({ tipo: 'erro', msg: 'Erro ao ler arquivo Excel/CSV. Verifique o formato do arquivo.' });
      }
    };

    reader.readAsBinaryString(file);
    if (e.target) e.target.value = '';
  };

  // Handler para Colar Texto / CSV
  const handleColarTexto = () => {
    if (!textoColado.trim()) {
      setImportStatus({ tipo: 'erro', msg: 'Cole os dados da planilha na caixa de texto.' });
      return;
    }

    try {
      const linhas = textoColado.trim().split('\n');
      if (linhas.length < 2) {
        setImportStatus({ tipo: 'erro', msg: 'Cole ao menos o cabeçalho e 1 linha de dados.' });
        return;
      }

      // Detecta separador (tab ou ponto e vírgula ou vírgula)
      const primeiraLinha = linhas[0];
      const sep = primeiraLinha.includes('\t') ? '\t' : primeiraLinha.includes(';') ? ';' : ',';
      const cabecalhos = primeiraLinha.split(sep).map((c) => c.trim().replace(/^"|"$/g, ''));

      const objetos: any[] = [];
      for (let i = 1; i < linhas.length; i++) {
        const cols = linhas[i].split(sep).map((c) => c.trim().replace(/^"|"$/g, ''));
        if (cols.length === 0 || (cols.length === 1 && !cols[0])) continue;
        const obj: Record<string, any> = {};
        cabecalhos.forEach((cab, cIdx) => {
          obj[cab] = cols[cIdx] || '';
        });
        objetos.push(obj);
      }

      const itensProcessados = processarPlanilhaReposicao(objetos);
      if (itensProcessados.length === 0) {
        setImportStatus({
          tipo: 'erro',
          msg: 'Não foi possível identificar as colunas (Dt. Operacao, Descrição, Valor, Qtde, Embalagem).',
        });
        return;
      }

      persistData(itensProcessados);
      setImportStatus({
        tipo: 'sucesso',
        msg: `${itensProcessados.length} lançamentos importados a partir do texto!`,
      });
      setTextoColado('');
      setTimeout(() => {
        setIsImportModalOpen(false);
        setImportStatus({ tipo: null, msg: '' });
      }, 1200);
    } catch (err) {
      console.error(err);
      setImportStatus({ tipo: 'erro', msg: 'Falha ao processar texto colado. Verifique o padrão de colunas.' });
    }
  };

  // Handler para Upload de Arquivo JSON
  const handleJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setJsonImportStatus({ tipo: null, msg: '' });
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const parsed = JSON.parse(text);
        const dataArray = Array.isArray(parsed) ? parsed : [parsed];

        if (dataArray.length === 0) {
          setJsonImportStatus({ tipo: 'erro', msg: 'O arquivo JSON está vazio.' });
          return;
        }

        const itensProcessados = processarPlanilhaReposicao(dataArray);
        if (itensProcessados.length === 0) {
          setJsonImportStatus({
            tipo: 'erro',
            msg: 'Nenhum lançamento válido encontrado no JSON. Verifique as chaves: Dt. Operacao, Descrição, Valor, Qtde, Embalagem.',
          });
          return;
        }

        persistData(itensProcessados);
        setJsonImportStatus({
          tipo: 'sucesso',
          msg: `${itensProcessados.length} lançamentos JSON importados e processados com sucesso!`,
        });
        setTimeout(() => {
          setIsJsonModalOpen(false);
          setJsonImportStatus({ tipo: null, msg: '' });
        }, 1200);
      } catch (err) {
        console.error(err);
        setJsonImportStatus({ tipo: 'erro', msg: 'Formato JSON inválido. Certifique-se de que a sintaxe está correta.' });
      }
    };

    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  // Handler para Colar / Processar JSON
  const handleProcessarJsonColado = () => {
    if (!jsonColado.trim()) {
      setJsonImportStatus({ tipo: 'erro', msg: 'Cole a estrutura JSON na caixa de texto.' });
      return;
    }

    try {
      let trimmed = jsonColado.trim();
      // Permite tanto objeto único quanto array de objetos ou múltiplos objetos
      let parsed: any;
      if (trimmed.startsWith('{') && !trimmed.endsWith(']')) {
        // Se colar múltiplos objetos soltos tipo { ... }, { ... }
        if (!trimmed.endsWith('}')) {
          trimmed = `[${trimmed}]`;
        } else if (trimmed.includes('}\n{') || trimmed.includes('},\n{') || trimmed.includes('},{')) {
          trimmed = `[${trimmed}]`;
        }
      }

      try {
        parsed = JSON.parse(trimmed);
      } catch {
        // Tenta envolver entre colchetes caso seja objeto solto
        parsed = JSON.parse(`[${trimmed}]`);
      }

      const dataArray = Array.isArray(parsed) ? parsed : [parsed];
      if (dataArray.length === 0) {
        setJsonImportStatus({ tipo: 'erro', msg: 'Nenhum dado encontrado no JSON.' });
        return;
      }

      const itensProcessados = processarPlanilhaReposicao(dataArray);
      if (itensProcessados.length === 0) {
        setJsonImportStatus({
          tipo: 'erro',
          msg: 'Não foi possível reconhecer os campos (Dt. Operacao, Descrição, Valor, Qtde, Embalagem).',
        });
        return;
      }

      persistData(itensProcessados);
      setJsonImportStatus({
        tipo: 'sucesso',
        msg: `${itensProcessados.length} registro(s) JSON importado(s) com sucesso!`,
      });
      setJsonColado('');
      setTimeout(() => {
        setIsJsonModalOpen(false);
        setJsonImportStatus({ tipo: null, msg: '' });
      }, 1200);
    } catch (err) {
      console.error(err);
      setJsonImportStatus({ tipo: 'erro', msg: 'Erro de sintaxe no JSON. Verifique as vírgulas e aspas duplas.' });
    }
  };

  // Salvar Novo Lançamento / Editar
  const handleSalvarItem = (e: React.FormEvent) => {
    e.preventDefault();
    const valorNum = parseFloat(formNovo.valor.replace(',', '.')) || 0;
    const qtdeNum = parseFloat(formNovo.qtde.replace(',', '.')) || 1;

    if (!formNovo.descricao.trim() || valorNum <= 0) {
      alert('Preencha a descrição do produto e um valor válido.');
      return;
    }

    const dataIso = formNovo.dataOperacao || new Date().toISOString().slice(0, 10);
    const mesRef = dataIso.slice(0, 7);
    const [ano, mes] = mesRef.split('-');
    const mesNome = `${mes}/${ano}`;

    if (editItem) {
      const atualizados = itens.map((item) =>
        item.id === editItem.id
          ? {
              ...item,
              dataOperacao: dataIso,
              mesRef,
              mesNome,
              descricao: formNovo.descricao.trim().toUpperCase(),
              valor: valorNum,
              qtde: qtdeNum,
              embalagem: formNovo.embalagem || normalizarEmbalagem('', formNovo.descricao),
              motivo: formNovo.motivo || 'Reposição Operacional',
              observacao: formNovo.observacao || '',
            }
          : item
      );
      persistData(atualizados);
      setEditItem(null);
    } else {
      const novoItem: ItemReposicao = {
        id: `REP-${Date.now()}`,
        dataOperacao: dataIso,
        mesRef,
        mesNome,
        descricao: formNovo.descricao.trim().toUpperCase(),
        valor: valorNum,
        qtde: qtdeNum,
        embalagem: formNovo.embalagem || normalizarEmbalagem('', formNovo.descricao),
        motivo: formNovo.motivo || 'Reposição Operacional',
        observacao: formNovo.observacao || '',
        createdAt: new Date().toISOString(),
      };
      persistData([novoItem, ...itens]);
    }

    setIsNewModalOpen(false);
    setFormNovo({
      dataOperacao: new Date().toISOString().slice(0, 10),
      descricao: '',
      valor: '',
      qtde: '',
      embalagem: 'Lata',
      motivo: 'Avaria em Movimentação',
      observacao: '',
    });
  };

  const handleAbrirEditar = (item: ItemReposicao) => {
    setEditItem(item);
    setFormNovo({
      dataOperacao: item.dataOperacao,
      descricao: item.descricao,
      valor: String(item.valor),
      qtde: String(item.qtde),
      embalagem: item.embalagem,
      motivo: item.motivo || '',
      observacao: item.observacao || '',
    });
    setIsNewModalOpen(true);
  };

  const handleExcluirItem = (id: string) => {
    if (confirm('Deseja realmente excluir este lançamento de reposição?')) {
      const filtrados = itens.filter((i) => i.id !== id);
      persistData(filtrados);
    }
  };

  const handleRestaurarDemo = () => {
    if (confirm('Deseja restaurar a planilha de reposição padrão de bebidas (dados 2026)?')) {
      persistData(DEMO_REPOSICAO_BEBIDAS);
      setFiltroMes('');
      setFiltroEmbalagem('');
      setBuscaTermo('');
    }
  };

  return (
    <div className="space-y-6 w-full pb-16">
      {/* Header Principal do Painel */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-6 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Módulo de Reposição de Bebidas
              </span>
              <span className="text-xs text-slate-400 font-mono">
                AMBEV Logística & Armazém
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>Painel de Reposição de Bebidas</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Análise financeira de reposições por data de operação, identificação de produtos críticos, 
              distribuição por formato de embalagem e diagnóstico executivo de anomalias.
            </p>
          </div>

          {/* Ações Rápidas */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Botão de Importar JSON */}
            <button
              onClick={() => {
                setJsonImportStatus({ tipo: null, msg: '' });
                setIsJsonModalOpen(true);
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-md shadow-amber-500/25 transition-all cursor-pointer transform hover:-translate-y-0.5"
              title="Importar dados em formato JSON (Operacao ., Dt. Operacao, Emissao, Produto, Unidade, Descrição, Qtde, Valor, Embalagem)"
            >
              <FileJson className="w-4 h-4 text-slate-950" />
              <span>Importar JSON</span>
            </button>

            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold text-xs border border-amber-500/30 transition-all cursor-pointer"
              title="Importar planilha Excel (.xlsx) ou CSV com as colunas Dt. Operacao, Descrição, Valor, Qtde e Embalagem"
            >
              <FileSpreadsheet className="w-4 h-4 text-amber-400" />
              <span>Importar Planilha</span>
            </button>

            <button
              onClick={() => {
                setEditItem(null);
                setFormNovo({
                  dataOperacao: new Date().toISOString().slice(0, 10),
                  descricao: '',
                  valor: '',
                  qtde: '',
                  embalagem: 'Lata',
                  motivo: 'Avaria em Movimentação',
                  observacao: '',
                });
                setIsNewModalOpen(true);
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Novo Lançamento</span>
            </button>

            <button
              onClick={() => exportarParaCSV(itensFiltrados)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs border border-slate-700 transition-all cursor-pointer"
              title="Exportar dados atuais para arquivo CSV"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Exportar CSV</span>
            </button>

            <button
              onClick={handleRestaurarDemo}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs border border-slate-700/60 transition-all cursor-pointer"
              title="Restaurar dados demonstrativos padrão"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Restaurar Demo</span>
            </button>
          </div>
        </div>
      </div>

      {/* 1. CARDS DE RESUMO (KPI CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Valor Total Reposto */}
        <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-5 shadow-lg relative overflow-hidden group hover:border-amber-500/60 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-xl group-hover:bg-amber-500/20 transition-all pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400/90">
              Valor Total Reposto
            </span>
            <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {formatBRL(kpis.valorTotal)}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
              <span className="text-amber-400 font-semibold">
                {dadosPorMes.length > 0 ? formatBRL(kpis.valorTotal / dadosPorMes.length) : 'R$ 0'}
              </span>
              <span>média mensal</span>
            </div>
          </div>
        </div>

        {/* Card 2: Número de Lançamentos */}
        <div className="bg-slate-900 border border-sky-500/30 rounded-xl p-5 shadow-lg relative overflow-hidden group hover:border-sky-500/60 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/10 rounded-full blur-xl group-hover:bg-sky-500/20 transition-all pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-400/90">
              Número de Lançamentos
            </span>
            <div className="w-9 h-9 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {formatNumber(kpis.totalLancamentos)}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
              <span className="text-sky-400 font-semibold">
                {dadosPorMes.length > 0 ? (kpis.totalLancamentos / dadosPorMes.length).toFixed(1) : 0}
              </span>
              <span>ocorrências / mês</span>
            </div>
          </div>
        </div>

        {/* Card 3: Quantidade Total */}
        <div className="bg-slate-900 border border-emerald-500/30 rounded-xl p-5 shadow-lg relative overflow-hidden group hover:border-emerald-500/60 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400/90">
              Quantidade Total
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {formatNumber(kpis.quantidadeTotal)}{' '}
              <span className="text-xs font-semibold text-slate-400">un/cx</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
              <span className="text-emerald-400 font-semibold">
                {kpis.totalLancamentos > 0 ? formatNumber(Math.round(kpis.quantidadeTotal / kpis.totalLancamentos)) : 0}
              </span>
              <span>unidades por registro</span>
            </div>
          </div>
        </div>

        {/* Card 4: Ticket Médio */}
        <div className="bg-slate-900 border border-purple-500/30 rounded-xl p-5 shadow-lg relative overflow-hidden group hover:border-purple-500/60 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-xl group-hover:bg-purple-500/20 transition-all pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400/90">
              Ticket Médio
            </span>
            <div className="w-9 h-9 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {formatBRL(kpis.ticketMedioLancamento)}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
              <span className="text-purple-300 font-semibold">
                {formatBRL(kpis.ticketMedioUnidade)}
              </span>
              <span>custo unitário médio</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2 & 3 & 4. SEÇÃO DE GRÁFICOS VISUAIS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* GRÁFICO 1: Valor Reposto por Mês (Dt. Operacao) */}
        <div className="lg:col-span-12 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-amber-400" />
                <span>Valor Reposto por Mês (Dt. Operação)</span>
              </h2>
              <p className="text-xs text-slate-400">
                Evolução mensal do montante financeiro reposto com destaque para o mês de pico
              </p>
            </div>
            {achados.pico && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/15 border border-amber-500/30 rounded-lg text-xs font-bold text-amber-300 self-start sm:self-auto">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Pico: {achados.pico.mes} ({formatBRL(achados.pico.valor)})</span>
              </div>
            )}
          </div>

          <div className="h-72 w-full">
            {dadosPorMes.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosPorMes} margin={{ top: 15, right: 20, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis
                    dataKey="mesNome"
                    stroke="#94a3b8"
                    tick={{ fill: '#cbd5e1', fontSize: 12 }}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    tick={{ fill: '#cbd5e1', fontSize: 11 }}
                    tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-slate-950 border border-slate-700 p-3 rounded-lg shadow-xl text-xs space-y-1">
                            <div className="font-bold text-amber-400 flex items-center gap-1">
                              <span>Mês: {d.mesNome}</span>
                              {d.isPico && (
                                <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded text-[10px]">
                                  PICO
                                </span>
                              )}
                            </div>
                            <div className="text-white font-semibold">
                              Valor Reposto: <span className="text-amber-300">{formatBRL(d.valorTotal)}</span>
                            </div>
                            <div className="text-slate-300">
                              Quantidade: {formatNumber(d.qtdeTotal)} un/cx
                            </div>
                            <div className="text-slate-400">
                              Lançamentos: {d.totalLancamentos} registros
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="valorTotal" name="Valor Reposto (R$)" radius={[6, 6, 0, 0]}>
                    {dadosPorMes.map((entry, index) => (
                      <Cell
                        key={`cell-mes-${index}`}
                        fill={entry.isPico ? '#f59e0b' : '#38bdf8'}
                        className="hover:opacity-80 transition-opacity"
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Nenhum dado mensal disponível no filtro atual.
              </div>
            )}
          </div>
        </div>

        {/* GRÁFICO 2: Top 8 Produtos de Maior Valor Reposto (Horizontal) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-400" />
                <span>Top 8 Produtos de Maior Valor Reposto</span>
              </h2>
              <p className="text-xs text-slate-400">
                Ranking dos SKUs mais críticos com ordenação horizontal e participação percentual
              </p>
            </div>
            <span className="text-[11px] font-mono font-bold text-slate-400 px-2 py-0.5 bg-slate-800 rounded">
              TOP 8 SKUs
            </span>
          </div>

          <div className="h-80 w-full">
            {dadosTop8.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dadosTop8}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                  <XAxis
                    type="number"
                    stroke="#94a3b8"
                    tick={{ fill: '#cbd5e1', fontSize: 11 }}
                    tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                  />
                  <YAxis
                    type="category"
                    dataKey="descricao"
                    stroke="#94a3b8"
                    tick={{ fill: '#e2e8f0', fontSize: 10 }}
                    width={140}
                    tickFormatter={(str) => (str.length > 18 ? `${str.slice(0, 18)}...` : str)}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-slate-950 border border-slate-700 p-3 rounded-lg shadow-xl text-xs space-y-1">
                            <div className="font-bold text-white">
                              #{d.ranking} - {d.descricao}
                            </div>
                            <div className="text-amber-300 font-semibold">
                              Valor Reposto: {formatBRL(d.valorTotal)} ({formatPercent(d.percentual)})
                            </div>
                            <div className="text-slate-300">
                              Quantidade: {formatNumber(d.qtdeTotal)} unidades
                            </div>
                            <div className="text-slate-400">
                              Embalagem: {d.embalagem}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="valorTotal" name="Valor Reposto (R$)" radius={[0, 6, 6, 0]}>
                    {dadosTop8.map((entry, index) => {
                      const colors = [
                        '#ef4444', // 1º Red 500
                        '#f97316', // 2º Orange 500
                        '#f59e0b', // 3º Amber 500
                        '#eab308', // 4º Yellow 500
                        '#10b981', // 5º Emerald 500
                        '#06b6d4', // 6º Cyan 500
                        '#3b82f6', // 7º Blue 500
                        '#8b5cf6', // 8º Violet 500
                      ];
                      return <Cell key={`cell-top-${index}`} fill={colors[index % colors.length]} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Nenhum produto registrado.
              </div>
            )}
          </div>
        </div>

        {/* GRÁFICO 3: Valor Reposto por Tipo de Embalagem / Formato (Agrupado em Outros) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Boxes className="w-4 h-4 text-emerald-400" />
                <span>Valor Reposto por Embalagem</span>
              </h2>
              <p className="text-xs text-slate-400">
                Lata, Garrafa Inteira, Litrão etc. (menores agrupados em "Outros")
              </p>
            </div>
            <span className="text-[11px] font-mono font-bold text-emerald-400 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded">
              Formatos
            </span>
          </div>

          <div className="h-80 w-full">
            {dadosPorEmbalagem.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dadosPorEmbalagem}
                  margin={{ top: 10, right: 15, left: 10, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                  <XAxis
                    dataKey="embalagem"
                    stroke="#94a3b8"
                    tick={{ fill: '#cbd5e1', fontSize: 10 }}
                    angle={-20}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    tick={{ fill: '#cbd5e1', fontSize: 11 }}
                    tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-slate-950 border border-slate-700 p-3 rounded-lg shadow-xl text-xs space-y-1">
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: CORES_EMBALAGEM[d.embalagem] || '#64748b' }}
                              />
                              <span>{d.embalagem}</span>
                            </div>
                            <div className="text-amber-300 font-semibold">
                              Valor Reposto: {formatBRL(d.valorTotal)} ({formatPercent(d.percentual)})
                            </div>
                            <div className="text-slate-300">
                              Quantidade: {formatNumber(d.qtdeTotal)} un/cx
                            </div>
                            <div className="text-slate-400">
                              Lançamentos: {d.totalLancamentos} ocorrências
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="valorTotal" name="Valor Reposto" radius={[6, 6, 0, 0]}>
                    {dadosPorEmbalagem.map((entry, index) => (
                      <Cell
                        key={`cell-emb-${index}`}
                        fill={CORES_EMBALAGEM[entry.embalagem] || '#64748b'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Nenhum formato de embalagem disponível.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL 1: IMPORTAR PLANILHA EXCEL / CSV / COLAR */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Importar Planilha de Reposição</h3>
                  <p className="text-xs text-slate-400">
                    Carregue arquivo Excel (.xlsx, .xls) ou CSV com as colunas requeridas
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportStatus({ tipo: null, msg: '' });
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status de Notificação */}
            {importStatus.tipo && (
              <div
                className={`mb-4 p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                  importStatus.tipo === 'sucesso'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                {importStatus.tipo === 'sucesso' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                )}
                <span>{importStatus.msg}</span>
              </div>
            )}

            {/* Mapeamento de Colunas Explicativo */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 mb-4 text-xs text-slate-300 space-y-1">
              <div className="font-bold text-amber-400 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                <span>Colunas Reconhecidas Automaticamente:</span>
              </div>
              <p className="text-slate-400">
                • <strong>Dt. Operacao</strong> (ou Data, Data Operacao)<br />
                • <strong>Descrição</strong> (ou Descricao, Produto, Mercadoria)<br />
                • <strong>Valor</strong> (ou Valor Reposicao, Custo, Preço)<br />
                • <strong>Qtde</strong> (ou Quantidade, Qtd, Unidades)<br />
                • <strong>Embalagem</strong> (ou Formato, Tipo - caso não preenchido, será inferido do produto)
              </p>
            </div>

            {/* Upload de Arquivo */}
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-amber-500/60 bg-slate-950/40 hover:bg-amber-500/5 rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-sm font-semibold text-white">
                  Clique ou arraste a planilha Excel ou CSV aqui
                </div>
                <div className="text-xs text-slate-400">
                  Suporta arquivos .XLSX, .XLS e .CSV padrão
                </div>
              </div>

              {/* Divisor */}
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-800" />
                <span className="flex-shrink mx-4 text-xs text-slate-500 uppercase font-semibold">
                  ou cole dados copiados do Excel
                </span>
                <div className="flex-grow border-t border-slate-800" />
              </div>

              {/* Área de Colar */}
              <div>
                <textarea
                  value={textoColado}
                  onChange={(e) => setTextoColado(e.target.value)}
                  placeholder="Copie as células do Excel (incluindo o cabeçalho) e cole aqui..."
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-500 placeholder:text-slate-600 custom-scrollbar"
                />
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={handleColarTexto}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Processar Texto Colado
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: IMPORTAR JSON */}
      {isJsonModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <FileJson className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Importar Lançamentos via JSON</span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                      Estruturado
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Carregue um arquivo .json ou cole os objetos/array com a estrutura da planilha
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsJsonModalOpen(false);
                  setJsonImportStatus({ tipo: null, msg: '' });
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status de Notificação JSON */}
            {jsonImportStatus.tipo && (
              <div
                className={`mb-4 p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                  jsonImportStatus.tipo === 'sucesso'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                {jsonImportStatus.tipo === 'sucesso' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                )}
                <span>{jsonImportStatus.msg}</span>
              </div>
            )}

            {/* Exemplo de Formato Aceito */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 mb-4 text-xs">
              <div className="flex items-center justify-between mb-2">
                <div className="font-bold text-amber-400 flex items-center gap-1.5">
                  <Code2 className="w-4 h-4" />
                  <span>Formato JSON Suportado:</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const exemplo = `[\n  {\n    "Operacao .": 39,\n    "Dt. Operacao": "2026-01-09",\n    "Emissao": "2026-01-12",\n    "Produto": 9068,\n    "Unidade": "cx",\n    "Descrição": "SKOL LATA 350ML SH C/",\n    "Qtde": 1,\n    "Valor": 51.15,\n    "Embalagem": "LATA 355ML"\n  }\n]`;
                    setJsonColado(exemplo);
                  }}
                  className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>Preencher Exemplo</span>
                </button>
              </div>

              <pre className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 font-mono text-[11px] overflow-x-auto leading-tight custom-scrollbar">
{`[
  {
    "Operacao .": 39,
    "Dt. Operacao": "2026-01-09",
    "Emissao": "2026-01-12",
    "Produto": 9068,
    "Unidade": "cx",
    "Descrição": "SKOL LATA 350ML SH C/",
    "Qtde": 1,
    "Valor": 51.15,
    "Embalagem": "LATA 355ML"
  }
]`}
              </pre>
            </div>

            {/* Upload de Arquivo JSON */}
            <div className="space-y-4">
              <div
                onClick={() => jsonFileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-amber-500/60 bg-slate-950/40 hover:bg-amber-500/5 rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5"
              >
                <input
                  ref={jsonFileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleJsonUpload}
                  className="hidden"
                />
                <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="text-xs sm:text-sm font-semibold text-white">
                  Clique ou arraste um arquivo .JSON aqui
                </div>
                <div className="text-[11px] text-slate-400">
                  Importa automaticamente todos os registros do arquivo
                </div>
              </div>

              {/* Divisor */}
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-800" />
                <span className="flex-shrink mx-4 text-[11px] text-slate-500 uppercase font-semibold">
                  ou cole o código JSON abaixo
                </span>
                <div className="flex-grow border-t border-slate-800" />
              </div>

              {/* Área de Colar JSON */}
              <div>
                <textarea
                  value={jsonColado}
                  onChange={(e) => setJsonColado(e.target.value)}
                  placeholder={`Cole aqui o JSON no formato:\n{\n  "Operacao .": 39,\n  "Dt. Operacao": "2026-01-09",\n  "Emissao": "2026-01-12",\n  "Produto": 9068,\n  "Unidade": "cx",\n  "Descrição": "SKOL LATA 350ML SH C/",\n  "Qtde": 1,\n  "Valor": 51.15,\n  "Embalagem": "LATA 355ML"\n}`}
                  rows={6}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-500 placeholder:text-slate-600 custom-scrollbar"
                />
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Aceita objeto único <code>{`{...}`}</code> ou lista <code>{`[{...}, {...}]`}</code>
                  </span>
                  <button
                    onClick={handleProcessarJsonColado}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-lg transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                  >
                    Importar Dados JSON
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: NOVO LANÇAMENTO MANUAL / EDITAR */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-400" />
                <span>{editItem ? 'Editar Lançamento' : 'Novo Lançamento de Reposição'}</span>
              </h3>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarItem} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Dt. Operação *
                </label>
                <input
                  type="date"
                  required
                  value={formNovo.dataOperacao}
                  onChange={(e) => setFormNovo((p) => ({ ...p, dataOperacao: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Descrição (Produto) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: BRAHMA DUPLO MALTE 350ML LATA"
                  value={formNovo.descricao}
                  onChange={(e) => setFormNovo((p) => ({ ...p, descricao: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-amber-500 uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Valor Reposto (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={formNovo.valor}
                    onChange={(e) => setFormNovo((p) => ({ ...p, valor: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Quantidade (Qtde) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="1"
                    value={formNovo.qtde}
                    onChange={(e) => setFormNovo((p) => ({ ...p, qtde: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Embalagem / Formato
                  </label>
                  <select
                    value={formNovo.embalagem}
                    onChange={(e) => setFormNovo((p) => ({ ...p, embalagem: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="Lata">Lata</option>
                    <option value="Garrafa Inteira">Garrafa Inteira</option>
                    <option value="Litrão">Litrão</option>
                    <option value="Long Neck">Long Neck</option>
                    <option value="PET">PET</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Motivo da Reposição
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Avaria de Rota"
                    value={formNovo.motivo}
                    onChange={(e) => setFormNovo((p) => ({ ...p, motivo: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Observações
                </label>
                <textarea
                  rows={2}
                  placeholder="Informações adicionais da ocorrência..."
                  value={formNovo.observacao}
                  onChange={(e) => setFormNovo((p) => ({ ...p, observacao: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-amber-500 custom-scrollbar"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
                >
                  {editItem ? 'Salvar Alterações' : 'Criar Lançamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
