import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  Truck,
  User,
  Users,
  MapPin,
  FileText,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Droplet,
  Globe,
  Link as LinkIcon,
  Loader2,
  DownloadCloud,
} from 'lucide-react';
import {
  fetchDataFromGitHubOrUrl,
  isWebOrGitHubUrl,
} from '../utils/githubUrlFetcher';
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
import { ItemReposicao } from '../types/reposicao';
import { DEMO_REPOSICAO_BEBIDAS } from '../data/mockReposicao';
import {
  formatBRL,
  formatNumber,
  formatHL,
  formatPercent,
  formatDataBR,
  calcularResumoKPI,
  calcularValorPorMes,
  calcularTop8Produtos,
  calcularValorPorEmbalagem,
  calcularTopRotas,
  calcularStatusVales,
  calcularTopMotoristas,
  gerarAchadosRelevantes,
  processarPlanilhaReposicao,
  sanitizarEParsearValesJSON,
  exportarParaCSV,
  normalizarEmbalagem,
} from '../utils/reposicaoUtils';

const CORES_EMBALAGEM: Record<string, string> = {
  Lata: '#38bdf8', // Sky 400
  'Garrafa Inteira': '#f59e0b', // Amber 500
  Litrão: '#10b981', // Emerald 500
  'Long Neck': '#a855f7', // Purple 500
  PET: '#ec4899', // Pink 500
  'Chopp Barril': '#eab308', // Yellow 500
  Outros: '#64748b', // Slate 500
};

const CORES_STATUS: Record<string, string> = {
  Compensado: '#10b981', // Emerald 500
  Pendente: '#f59e0b', // Amber 500
  'Em Aberto': '#38bdf8', // Sky 400
  Faturado: '#8b5cf6', // Purple 500
  Descontado: '#ef4444', // Red 500
};

const EXEMPLO_JSON_OFICIAL = `{
  "item_numero": 1,
  "data_emissao": "14/01/2026",
  "nota_fiscal": "252161",
  "mapa_carga": "M1055",
  "rota_setor": "R111",
  "motorista": "DANILLO PEREIRA DOS SANTOS SILVA",
  "cpf_motorista": "713.650.714-64",
  "ajudante_1": "GEOVANE ARAUJO DA SILVA",
  "cpf_ajudante_1": "099.123.694-75",
  "ajudante_2": "-",
  "cpf_ajudante_2": "Ausente",
  "equipe_completa": "GEOVANE ARAUJO DA SILVA",
  "status_vale": "Compensado",
  "volume_total_hl": 0.08,
  "valor_total_prejuizo": 57.04,
  "total_integrantes_rateio": "2 Integrante(s)",
  "valor_rateado_por_pessoa": 28.52,
  "qtd_itens": 1,
  "codigo_cliente": "CLI3012",
  "razao_social_cliente": "PONTO DE VENDA (PDV)",
  "detalhamento_skus": "9068 - SKOL LATA 350ML SH C/12 NPAL (2 CX)",
  "id_vale_sstr": "vale_hist_1001"
}`;

export const ReposicaoView: React.FC = () => {
  // Estado principal de dados com persistência local
  const [itens, setItens] = useState<ItemReposicao[]>(() => {
    try {
      const cached = localStorage.getItem('AMBEV_REPOSICAO_BEBIDAS');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    return [];
  });

  // Listen to platform-wide clear and reset events
  useEffect(() => {
    const handleClear = () => setItens([]);
    const handleReset = () => {
      try {
        const cached = localStorage.getItem('AMBEV_REPOSICAO_BEBIDAS');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) setItens(parsed);
        } else {
          setItens(DEMO_REPOSICAO_BEBIDAS);
        }
      } catch {
        setItens(DEMO_REPOSICAO_BEBIDAS);
      }
    };
    window.addEventListener('ambev_platform_data_cleared', handleClear);
    window.addEventListener('ambev_platform_data_reset', handleReset);
    return () => {
      window.removeEventListener('ambev_platform_data_cleared', handleClear);
      window.removeEventListener('ambev_platform_data_reset', handleReset);
    };
  }, []);

  // Filtros locais
  const [filtroMes, setFiltroMes] = useState<string>('');
  const [filtroEmbalagem, setFiltroEmbalagem] = useState<string>('');
  const [filtroRota, setFiltroRota] = useState<string>('');
  const [filtroStatus, setFiltroStatus] = useState<string>('');
  const [buscaTermo, setBuscaTermo] = useState<string>('');
  const [ordenacao, setOrdenacao] = useState<'valor-desc' | 'valor-asc' | 'volume-desc' | 'qtde-desc' | 'data-desc' | 'data-asc'>('data-desc');
  const [mostrarTabela, setMostrarTabela] = useState<boolean>(false);

  // Modais
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState<boolean>(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState<boolean>(false);
  const [itemDetalhes, setItemDetalhes] = useState<ItemReposicao | null>(null);
  const [editItem, setEditItem] = useState<ItemReposicao | null>(null);
  const [textoColado, setTextoColado] = useState<string>('');
  const [jsonColado, setJsonColado] = useState<string>('');
  const [jsonModalTab, setJsonModalTab] = useState<'github' | 'file' | 'text'>('github');
  const [githubUrlInput, setGithubUrlInput] = useState<string>('');
  const [isLoadingGithub, setIsLoadingGithub] = useState<boolean>(false);
  const [githubError, setGithubError] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<{ tipo: 'sucesso' | 'erro' | null; msg: string }>({ tipo: null, msg: '' });
  const [jsonImportStatus, setJsonImportStatus] = useState<{ tipo: 'sucesso' | 'erro' | null; msg: string }>({ tipo: null, msg: '' });

  // GitHub URL Fetch Handler
  const handleFetchGitHubReposicao = async (urlToFetch?: string) => {
    const targetUrl = (urlToFetch || githubUrlInput).trim();
    if (!targetUrl) {
      setGithubError('Informe o link do arquivo no GitHub ou URL web.');
      return;
    }

    setIsLoadingGithub(true);
    setGithubError(null);

    const result = await fetchDataFromGitHubOrUrl(targetUrl);
    setIsLoadingGithub(false);

    if (!result.success) {
      setGithubError(result.error || 'Erro ao carregar dados do link.');
      return;
    }

    try {
      const itensProcessados = sanitizarEParsearValesJSON(result.rawText);
      if (itensProcessados.length === 0) {
        setGithubError('O arquivo do link foi baixado, mas não contém registros válidos de reposição/vales.');
        return;
      }

      persistData(itensProcessados);
      setJsonImportStatus({
        tipo: 'sucesso',
        msg: `${itensProcessados.length} vale(s) importado(s) do GitHub com sucesso!`,
      });
      setGithubUrlInput('');
      setTimeout(() => {
        setIsJsonModalOpen(false);
        setJsonImportStatus({ tipo: null, msg: '' });
      }, 1200);
    } catch (err: any) {
      setGithubError('Erro ao validar dados JSON: ' + (err?.message || 'Formato inválido'));
    }
  };

  // Formulário de Novo/Edição
  const [formNovo, setFormNovo] = useState<{
    dataEmissao: string;
    notaFiscal: string;
    mapaCarga: string;
    rotaSetor: string;
    motorista: string;
    cpfMotorista: string;
    ajudante1: string;
    cpfAjudante1: string;
    ajudante2: string;
    statusVale: string;
    volumeTotalHL: string;
    valorTotalPrejuizo: string;
    qtdItens: string;
    razaoSocialCliente: string;
    detalhamentoSkus: string;
    idValeSstr: string;
    embalagem: string;
    motivo: string;
    observacao: string;
  }>({
    dataEmissao: new Date().toISOString().slice(0, 10),
    notaFiscal: '',
    mapaCarga: '',
    rotaSetor: 'R111',
    motorista: '',
    cpfMotorista: '',
    ajudante1: '',
    cpfAjudante1: '',
    ajudante2: '-',
    statusVale: 'Compensado',
    volumeTotalHL: '0.08',
    valorTotalPrejuizo: '',
    qtdItens: '1',
    razaoSocialCliente: 'PONTO DE VENDA (PDV)',
    detalhamentoSkus: '',
    idValeSstr: '',
    embalagem: 'Lata',
    motivo: 'Avaria em Transporte/Rota',
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
      if (filtroRota && item.rota_setor !== filtroRota) {
        return false;
      }
      if (filtroStatus && item.status_vale !== filtroStatus) {
        return false;
      }
      if (buscaTermo) {
        const termo = buscaTermo.toLowerCase();
        const matchDesc = (item.detalhamento_skus || item.descricao || '').toLowerCase().includes(termo);
        const matchEmb = (item.embalagem || '').toLowerCase().includes(termo);
        const matchMot = (item.motorista || '').toLowerCase().includes(termo);
        const matchRota = (item.rota_setor || '').toLowerCase().includes(termo);
        const matchNF = (item.nota_fiscal || '').toLowerCase().includes(termo);
        const matchVale = (item.id_vale_sstr || '').toLowerCase().includes(termo);
        const matchPDV = (item.razao_social_cliente || '').toLowerCase().includes(termo);
        const matchAjud = (item.ajudante_1 || '').toLowerCase().includes(termo);
        if (!matchDesc && !matchEmb && !matchMot && !matchRota && !matchNF && !matchVale && !matchPDV && !matchAjud) {
          return false;
        }
      }
      return true;
    });
  }, [itens, filtroMes, filtroEmbalagem, filtroRota, filtroStatus, buscaTermo]);

  // Lista ordenada para a tabela
  const itensOrdenados = useMemo(() => {
    return [...itensFiltrados].sort((a, b) => {
      if (ordenacao === 'valor-desc') return b.valor - a.valor;
      if (ordenacao === 'valor-asc') return a.valor - b.valor;
      if (ordenacao === 'volume-desc') return b.volume_total_hl - a.volume_total_hl;
      if (ordenacao === 'qtde-desc') return b.qtde - a.qtde;
      if (ordenacao === 'data-desc') return (b.data_emissao || b.dataOperacao).localeCompare(a.data_emissao || a.dataOperacao);
      if (ordenacao === 'data-asc') return (a.data_emissao || a.dataOperacao).localeCompare(b.data_emissao || b.dataOperacao);
      return 0;
    });
  }, [itensFiltrados, ordenacao]);

  // Cálculos analíticos
  const kpis = useMemo(() => calcularResumoKPI(itensFiltrados), [itensFiltrados]);
  const dadosPorMes = useMemo(() => calcularValorPorMes(itensFiltrados), [itensFiltrados]);
  const dadosTop8 = useMemo(() => calcularTop8Produtos(itensFiltrados), [itensFiltrados]);
  const dadosPorEmbalagem = useMemo(() => calcularValorPorEmbalagem(itensFiltrados), [itensFiltrados]);
  const dadosTopRotas = useMemo(() => calcularTopRotas(itensFiltrados), [itensFiltrados]);
  const dadosStatusVales = useMemo(() => calcularStatusVales(itensFiltrados), [itensFiltrados]);
  const dadosTopMotoristas = useMemo(() => calcularTopMotoristas(itensFiltrados), [itensFiltrados]);
  const achados = useMemo(() => gerarAchadosRelevantes(itensFiltrados), [itensFiltrados]);

  // Listas para dropdowns de filtros
  const mesesDisponiveis = useMemo(() => {
    const setMeses = new Set<string>();
    itens.forEach((i) => {
      if (i.mesRef) setMeses.add(i.mesRef);
      else if (i.dataOperacao) setMeses.add(i.dataOperacao.slice(0, 7));
    });
    return Array.from(setMeses).sort().reverse();
  }, [itens]);

  const embalagensDisponiveis = useMemo(() => {
    const setEmb = new Set<string>();
    itens.forEach((i) => setEmb.add(i.embalagem || 'Outros'));
    return Array.from(setEmb);
  }, [itens]);

  const rotasDisponiveis = useMemo(() => {
    const setR = new Set<string>();
    itens.forEach((i) => {
      if (i.rota_setor) setR.add(i.rota_setor);
    });
    return Array.from(setR).sort();
  }, [itens]);

  const statusDisponiveis = useMemo(() => {
    const setS = new Set<string>();
    itens.forEach((i) => {
      if (i.status_vale) setS.add(i.status_vale);
    });
    return Array.from(setS);
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
            msg: 'Nenhuma coluna correspondente encontrada. Verifique se a planilha possui colunas do modelo SSTR ou Dt. Operacao, Descrição, Valor, Qtde.',
          });
          return;
        }

        persistData(itensProcessados);
        setImportStatus({
          tipo: 'sucesso',
          msg: `${itensProcessados.length} vales de reposição importados e processados com sucesso!`,
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
          msg: 'Não foi possível identificar as colunas da planilha.',
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

  // Handler para Upload de Arquivo JSON com Validação Estrita Linha por Linha
  const handleJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setJsonImportStatus({ tipo: null, msg: '' });
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const itensProcessados = sanitizarEParsearValesJSON(text);

        if (itensProcessados.length === 0) {
          setJsonImportStatus({
            tipo: 'erro',
            msg: 'Nenhum lançamento válido encontrado no JSON. Verifique as 22 chaves do padrão oficial.',
          });
          return;
        }

        persistData(itensProcessados);
        setJsonImportStatus({
          tipo: 'sucesso',
          msg: `${itensProcessados.length} vales verificados linha por linha e importados com sucesso!`,
        });
        setTimeout(() => {
          setIsJsonModalOpen(false);
          setJsonImportStatus({ tipo: null, msg: '' });
        }, 1200);
      } catch (err: any) {
        console.error(err);
        setJsonImportStatus({ tipo: 'erro', msg: `Erro ao validar JSON: ${err.message || 'Sintaxe inválida'}` });
      }
    };

    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  // Handler para Colar / Processar JSON com Validação Linha por Linha
  const handleProcessarJsonColado = () => {
    if (!jsonColado.trim()) {
      setJsonImportStatus({ tipo: 'erro', msg: 'Cole a estrutura JSON na caixa de texto.' });
      return;
    }

    try {
      const itensProcessados = sanitizarEParsearValesJSON(jsonColado);

      if (itensProcessados.length === 0) {
        setJsonImportStatus({
          tipo: 'erro',
          msg: 'Não foi possível reconhecer registros válidos no JSON de Vales.',
        });
        return;
      }

      persistData(itensProcessados);
      setJsonImportStatus({
        tipo: 'sucesso',
        msg: `${itensProcessados.length} vale(s) verificado(s) linha a linha e importado(s) com sucesso!`,
      });
      setJsonColado('');
      setTimeout(() => {
        setIsJsonModalOpen(false);
        setJsonImportStatus({ tipo: null, msg: '' });
      }, 1200);
    } catch (err: any) {
      console.error(err);
      setJsonImportStatus({ tipo: 'erro', msg: `Erro de validação no JSON: ${err.message || 'Verifique vírgulas e aspas'}` });
    }
  };

  // Salvar Novo Lançamento / Editar
  const handleSalvarItem = (e: React.FormEvent) => {
    e.preventDefault();
    const valorNum = parseFloat(formNovo.valorTotalPrejuizo.replace(',', '.')) || 0;
    const volumeHLNum = parseFloat(formNovo.volumeTotalHL.replace(',', '.')) || 0.08;
    const qtdeNum = parseFloat(formNovo.qtdItens.replace(',', '.')) || 1;

    if (!formNovo.detalhamentoSkus.trim() || valorNum <= 0) {
      alert('Preencha o detalhamento do SKU e um valor de prejuízo válido.');
      return;
    }

    const dataIso = formNovo.dataEmissao || new Date().toISOString().slice(0, 10);
    const mesRef = dataIso.slice(0, 7);
    const [ano, mes] = mesRef.split('-');
    const mesNome = `${mes}/${ano}`;
    const dataEmissaoBR = formatDataBR(dataIso);
    const rateioNum = Number((valorNum / 2).toFixed(2));

    if (editItem) {
      const atualizados = itens.map((item) =>
        item.id === editItem.id
          ? {
              ...item,
              dataOperacao: dataIso,
              data_emissao: dataEmissaoBR,
              mesRef,
              mesNome,
              nota_fiscal: formNovo.notaFiscal.trim() || item.nota_fiscal,
              mapa_carga: formNovo.mapaCarga.trim() || item.mapa_carga,
              rota_setor: formNovo.rotaSetor.trim() || item.rota_setor,
              motorista: formNovo.motorista.trim().toUpperCase() || item.motorista,
              cpf_motorista: formNovo.cpfMotorista.trim() || item.cpf_motorista,
              ajudante_1: formNovo.ajudante1.trim().toUpperCase() || item.ajudante_1,
              cpf_ajudante_1: formNovo.cpfAjudante1.trim() || item.cpf_ajudante_1,
              ajudante_2: formNovo.ajudante2.trim() || item.ajudante_2,
              equipe_completa: formNovo.ajudante1 || item.equipe_completa,
              status_vale: formNovo.statusVale || item.status_vale,
              volume_total_hl: volumeHLNum,
              valor: valorNum,
              valor_total_prejuizo: valorNum,
              valor_rateado_por_pessoa: rateioNum,
              qtde: qtdeNum,
              qtd_itens: qtdeNum,
              razao_social_cliente: formNovo.razaoSocialCliente.trim().toUpperCase() || item.razao_social_cliente,
              detalhamento_skus: formNovo.detalhamentoSkus.trim().toUpperCase(),
              descricao: formNovo.detalhamentoSkus.trim().toUpperCase(),
              embalagem: formNovo.embalagem || normalizarEmbalagem('', formNovo.detalhamentoSkus),
              motivo: formNovo.motivo || item.motivo,
              observacao: formNovo.observacao || item.observacao,
            }
          : item
      );
      persistData(atualizados);
      setEditItem(null);
    } else {
      const idSstr = formNovo.idValeSstr.trim() || `vale_hist_${1000 + itens.length + 1}`;
      const novoItem: ItemReposicao = {
        id: idSstr,
        id_vale_sstr: idSstr,
        item_numero: itens.length + 1,
        dataOperacao: dataIso,
        data_emissao: dataEmissaoBR,
        mesRef,
        mesNome,
        nota_fiscal: formNovo.notaFiscal.trim() || `${250000 + itens.length}`,
        mapa_carga: formNovo.mapaCarga.trim() || `M${1050 + itens.length}`,
        rota_setor: formNovo.rotaSetor.trim() || 'R111',
        motorista: formNovo.motorista.trim().toUpperCase() || 'DANILLO PEREIRA DOS SANTOS SILVA',
        cpf_motorista: formNovo.cpfMotorista.trim() || '713.650.714-64',
        ajudante_1: formNovo.ajudante1.trim().toUpperCase() || 'GEOVANE ARAUJO DA SILVA',
        cpf_ajudante_1: formNovo.cpfAjudante1.trim() || '099.123.694-75',
        ajudante_2: formNovo.ajudante2.trim() || '-',
        cpf_ajudante_2: 'Ausente',
        equipe_completa: formNovo.ajudante1.trim() || 'GEOVANE ARAUJO DA SILVA',
        status_vale: formNovo.statusVale || 'Compensado',
        volume_total_hl: volumeHLNum,
        valor: valorNum,
        valor_total_prejuizo: valorNum,
        total_integrantes_rateio: '2 Integrante(s)',
        valor_rateado_por_pessoa: rateioNum,
        qtde: qtdeNum,
        qtd_itens: qtdeNum,
        codigo_cliente: `CLI${3000 + itens.length}`,
        razao_social_cliente: formNovo.razaoSocialCliente.trim().toUpperCase() || 'PONTO DE VENDA (PDV)',
        detalhamento_skus: formNovo.detalhamentoSkus.trim().toUpperCase(),
        descricao: formNovo.detalhamentoSkus.trim().toUpperCase(),
        embalagem: formNovo.embalagem || normalizarEmbalagem('', formNovo.detalhamentoSkus),
        motivo: formNovo.motivo || 'Avaria em Rota',
        observacao: formNovo.observacao || '',
        createdAt: new Date().toISOString(),
      };
      persistData([novoItem, ...itens]);
    }

    setIsNewModalOpen(false);
  };

  const handleAbrirEditar = (item: ItemReposicao) => {
    setEditItem(item);
    setFormNovo({
      dataEmissao: item.dataOperacao,
      notaFiscal: item.nota_fiscal || '',
      mapaCarga: item.mapa_carga || '',
      rotaSetor: item.rota_setor || 'R111',
      motorista: item.motorista || '',
      cpfMotorista: item.cpf_motorista || '',
      ajudante1: item.ajudante_1 || '',
      cpfAjudante1: item.cpf_ajudante_1 || '',
      ajudante2: item.ajudante_2 || '-',
      statusVale: item.status_vale || 'Compensado',
      volumeTotalHL: String(item.volume_total_hl || 0.08),
      valorTotalPrejuizo: String(item.valor),
      qtdItens: String(item.qtde),
      razaoSocialCliente: item.razao_social_cliente || 'PONTO DE VENDA (PDV)',
      detalhamentoSkus: item.detalhamento_skus || item.descricao,
      idValeSstr: item.id_vale_sstr || '',
      embalagem: item.embalagem,
      motivo: item.motivo || '',
      observacao: item.observacao || '',
    });
    setIsNewModalOpen(true);
  };

  const handleExcluirItem = (id: string) => {
    if (confirm('Deseja realmente excluir este vale de reposição?')) {
      const filtrados = itens.filter((i) => i.id !== id);
      persistData(filtrados);
    }
  };

  const handleRestaurarDemo = () => {
    if (confirm('Deseja restaurar a base padrão de Vales de Reposição SSTR (dados 2026)?')) {
      persistData(DEMO_REPOSICAO_BEBIDAS);
      setFiltroMes('');
      setFiltroEmbalagem('');
      setFiltroRota('');
      setFiltroStatus('');
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
                Módulo Oficial de Vales de Reposição (SSTR)
              </span>
              <span className="text-xs text-slate-400 font-mono">
                AMBEV Logística & Distribuição
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>Painel Executivo de Vales &amp; Reposição de Bebidas</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
              Análise operacional e financeira de sinistros, quebras e vales de reposição por rota, setor, 
              motoristas, formato de embalagem, PDVs e rateios de equipe.
            </p>
          </div>
        </div>
      </div>

      {/* 1. CARDS DE RESUMO OPERACIONAL E FINANCEIRO (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Valor Total Prejuízo (R$) */}
        <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-5 shadow-lg relative overflow-hidden group hover:border-amber-500/60 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-xl group-hover:bg-amber-500/20 transition-all pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400/90">
              Prejuízo Total em Reposição
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
              <span className="text-emerald-400 font-semibold">
                {formatBRL(kpis.totalCompensadoR$)}
              </span>
              <span>compensado ({formatPercent(kpis.valorTotal > 0 ? (kpis.totalCompensadoR$ / kpis.valorTotal) * 100 : 0)})</span>
            </div>
          </div>
        </div>

        {/* Card 2: Volume Total Reposto (HL) */}
        <div className="bg-slate-900 border border-sky-500/30 rounded-xl p-5 shadow-lg relative overflow-hidden group hover:border-sky-500/60 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/10 rounded-full blur-xl group-hover:bg-sky-500/20 transition-all pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-400/90">
              Volume Total Reposto
            </span>
            <div className="w-9 h-9 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Droplet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {formatHL(kpis.volumeTotalHL)}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
              <span className="text-sky-400 font-semibold">
                {formatNumber(kpis.quantidadeTotal)}
              </span>
              <span>caixas / volumes</span>
            </div>
          </div>
        </div>

        {/* Card 3: Total de Vales SSTR / Ocorrências */}
        <div className="bg-slate-900 border border-emerald-500/30 rounded-xl p-5 shadow-lg relative overflow-hidden group hover:border-emerald-500/60 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400/90">
              Vales de Reposição
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {formatNumber(kpis.totalLancamentos)}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
              <span className="text-emerald-400 font-semibold">
                {formatBRL(kpis.ticketMedioLancamento)}
              </span>
              <span>prejuízo médio / vale</span>
            </div>
          </div>
        </div>

        {/* Card 4: Rateio Médio por Pessoa */}
        <div className="bg-slate-900 border border-purple-500/30 rounded-xl p-5 shadow-lg relative overflow-hidden group hover:border-purple-500/60 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-xl group-hover:bg-purple-500/20 transition-all pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400/90">
              Rateio Médio / Pessoa
            </span>
            <div className="w-9 h-9 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {formatBRL(kpis.mediaRateioPessoa)}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
              <span className="text-purple-300 font-semibold">
                {formatBRL(kpis.ticketMedioUnidade)}
              </span>
              <span>custo unitário / caixa</span>
            </div>
          </div>
        </div>
      </div>

      {/* FILTROS E BUSCA */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Busca Rápida */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por Motorista, Rota, SKU, NF, Vale SSTR, PDV Cliente ou Ajudante..."
              value={buscaTermo}
              onChange={(e) => setBuscaTermo(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
            {buscaTermo && (
              <button
                onClick={() => setBuscaTermo('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Dropdowns de Filtro */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filtro Mês */}
            <select
              value={filtroMes}
              onChange={(e) => setFiltroMes(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg px-2.5 py-2 focus:outline-none focus:border-amber-500"
            >
              <option value="">Todos os Meses</option>
              {mesesDisponiveis.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            {/* Filtro Rota */}
            <select
              value={filtroRota}
              onChange={(e) => setFiltroRota(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg px-2.5 py-2 focus:outline-none focus:border-amber-500"
            >
              <option value="">Todas as Rotas</option>
              {rotasDisponiveis.map((r) => (
                <option key={r} value={r}>
                  Rota {r}
                </option>
              ))}
            </select>

            {/* Filtro Embalagem */}
            <select
              value={filtroEmbalagem}
              onChange={(e) => setFiltroEmbalagem(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg px-2.5 py-2 focus:outline-none focus:border-amber-500"
            >
              <option value="">Todas Embalagens</option>
              {embalagensDisponiveis.map((emb) => (
                <option key={emb} value={emb}>
                  {emb}
                </option>
              ))}
            </select>

            {/* Filtro Status */}
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg px-2.5 py-2 focus:outline-none focus:border-amber-500"
            >
              <option value="">Todos os Status</option>
              {statusDisponiveis.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            {/* Limpar Filtros */}
            {(filtroMes || filtroEmbalagem || filtroRota || filtroStatus || buscaTermo) && (
              <button
                onClick={() => {
                  setFiltroMes('');
                  setFiltroEmbalagem('');
                  setFiltroRota('');
                  setFiltroStatus('');
                  setBuscaTermo('');
                }}
                className="px-2.5 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold border border-rose-500/20 transition-colors"
                title="Limpar todos os filtros"
              >
                Limpar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2 & 3 & 4. SEÇÃO DE GRÁFICOS ANALÍTICOS REVISADOS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* GRÁFICO 1: Evolução Mensal de Reposição (Valor R$ vs Volume HL) */}
        <div className="lg:col-span-12 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-amber-400" />
                <span>Evolução Mensal do Prejuízo de Reposição e Volume (HL)</span>
              </h2>
              <p className="text-xs text-slate-400">
                Histórico temporal de vales de reposição emitidos, volume físico avariado e montante financeiro
              </p>
            </div>
            {achados.pico && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/15 border border-amber-500/30 rounded-lg text-xs font-bold text-amber-300 self-start sm:self-auto">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Pico: {achados.pico.mes} ({formatBRL(achados.pico.valor)} | {formatHL(achados.pico.volumeHL)})</span>
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
                    tickFormatter={(val) => `R$ ${val}`}
                  />
                  <Tooltip
                    cursor={false}
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
                              Prejuízo Total: <span className="text-amber-300">{formatBRL(d.valorTotal)}</span>
                            </div>
                            <div className="text-sky-300 font-semibold">
                              Volume: {formatHL(d.volumeHL)} ({formatNumber(d.qtdeTotal)} caixas)
                            </div>
                            <div className="text-slate-400">
                              Vales Emitidos: {d.totalLancamentos} ocorrências
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="valorTotal" name="Prejuízo (R$)" radius={[6, 6, 0, 0]}>
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

        {/* GRÁFICO 2: Top Rotas / Setores com Maior Prejuízo */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Truck className="w-4 h-4 text-rose-400" />
                <span>Top Rotas / Setores com Maior Prejuízo</span>
              </h2>
              <p className="text-xs text-slate-400">
                Identificação dos trechos de distribuição com maior índice de quebras
              </p>
            </div>
            <span className="text-[11px] font-mono font-bold text-rose-400 px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 rounded">
              Rotas Críticas
            </span>
          </div>

          <div className="h-72 w-full">
            {dadosTopRotas.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dadosTopRotas}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                  <XAxis
                    type="number"
                    stroke="#94a3b8"
                    tick={{ fill: '#cbd5e1', fontSize: 11 }}
                    tickFormatter={(val) => `R$ ${val}`}
                  />
                  <YAxis
                    type="category"
                    dataKey="rota"
                    stroke="#94a3b8"
                    tick={{ fill: '#e2e8f0', fontSize: 11 }}
                    width={70}
                  />
                  <Tooltip
                    cursor={false}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-slate-950 border border-slate-700 p-3 rounded-lg shadow-xl text-xs space-y-1">
                            <div className="font-bold text-rose-400">Rota {d.rota}</div>
                            <div className="text-white font-semibold">
                              Prejuízo: {formatBRL(d.valorTotal)} ({formatPercent(d.percentual)})
                            </div>
                            <div className="text-sky-300">Volume: {formatHL(d.volumeHL)}</div>
                            <div className="text-slate-400">Vales: {d.totalLancamentos} ocorrências</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="valorTotal" name="Prejuízo (R$)" radius={[0, 6, 6, 0]}>
                    {dadosTopRotas.map((entry, index) => {
                      const cores = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#38bdf8', '#8b5cf6'];
                      return <Cell key={`cell-rota-${index}`} fill={cores[index % cores.length]} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Nenhuma rota registrada.
              </div>
            )}
          </div>
        </div>

        {/* GRÁFICO 3: Prejuízo por Tipo de Embalagem / Formato */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Boxes className="w-4 h-4 text-emerald-400" />
                <span>Prejuízo por Formato de Embalagem</span>
              </h2>
              <p className="text-xs text-slate-400">
                Lata, Garrafa Inteira, Litrão, Long Neck, PET e Barril Chopp
              </p>
            </div>
            <span className="text-[11px] font-mono font-bold text-emerald-400 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded">
              Formatos
            </span>
          </div>

          <div className="h-72 w-full">
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
                    angle={-15}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    tick={{ fill: '#cbd5e1', fontSize: 11 }}
                    tickFormatter={(val) => `R$ ${val}`}
                  />
                  <Tooltip
                    cursor={false}
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
                              Prejuízo: {formatBRL(d.valorTotal)} ({formatPercent(d.percentual)})
                            </div>
                            <div className="text-sky-300">Volume: {formatHL(d.volumeHL)}</div>
                            <div className="text-slate-300">Quantidade: {formatNumber(d.qtdeTotal)} cx/un</div>
                            <div className="text-slate-400">Vales: {d.totalLancamentos} ocorrências</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="valorTotal" name="Prejuízo" radius={[6, 6, 0, 0]}>
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

        {/* GRÁFICO 4: Top 8 SKUs / Bebidas Repostas (Horizontal) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>Top 8 SKUs de Maior Impacto em Reposição</span>
              </h2>
              <p className="text-xs text-slate-400">
                Ranking detalhado por produto e formato com custos acumulados
              </p>
            </div>
            <span className="text-[11px] font-mono font-bold text-slate-400 px-2 py-0.5 bg-slate-800 rounded">
              TOP SKUs
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
                    tickFormatter={(val) => `R$ ${val}`}
                  />
                  <YAxis
                    type="category"
                    dataKey="descricao"
                    stroke="#94a3b8"
                    tick={{ fill: '#e2e8f0', fontSize: 10 }}
                    width={150}
                    tickFormatter={(str) => (str.length > 18 ? `${str.slice(0, 18)}...` : str)}
                  />
                  <Tooltip
                    cursor={false}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-slate-950 border border-slate-700 p-3 rounded-lg shadow-xl text-xs space-y-1">
                            <div className="font-bold text-white">
                              #{d.ranking} - {d.descricao}
                            </div>
                            <div className="text-amber-300 font-semibold">
                              Prejuízo: {formatBRL(d.valorTotal)} ({formatPercent(d.percentual)})
                            </div>
                            <div className="text-sky-300">Volume: {formatHL(d.volumeHL)} ({formatNumber(d.qtdeTotal)} cx)</div>
                            <div className="text-slate-400">Embalagem: {d.embalagem}</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="valorTotal" name="Prejuízo (R$)" radius={[0, 6, 6, 0]}>
                    {dadosTop8.map((entry, index) => {
                      const colors = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6'];
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

        {/* GRÁFICO 5: Status dos Vales & Motoristas em Rateio */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-purple-400" />
                  <span>Status dos Vales & Compensações</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Distribuição de vales Compensados, Pendentes e em análise
                </p>
              </div>
            </div>

            {/* Badges de Status */}
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              {dadosStatusVales.map((st) => (
                <div
                  key={st.status}
                  className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <div className="text-[11px] text-slate-400">{st.status}</div>
                    <div className="text-sm font-bold text-white">{formatBRL(st.valorTotal)}</div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    {st.totalLancamentos} vales
                  </span>
                </div>
              ))}
            </div>

            {/* Mini Ranking Motoristas */}
            <div>
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>Equipes & Condutores com Maior Rateio</span>
              </div>
              <div className="space-y-2">
                {dadosTopMotoristas.slice(0, 4).map((mot) => (
                  <div
                    key={mot.motorista}
                    className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div className="truncate max-w-[180px]">
                      <div className="font-semibold text-white truncate">{mot.motorista}</div>
                      <div className="text-[10px] text-slate-400">{mot.totalLancamentos} ocorrências | {formatHL(mot.volumeHL)}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-amber-400">{formatBRL(mot.valorTotal)}</div>
                      <div className="text-[10px] text-purple-300 font-mono">rateio {formatBRL(mot.valorRateado)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. TABELA COMPLETA DE VALES DE REPOSIÇÃO (SSTR) - RECOLHIDA POR PADRÃO */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-lg transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white">
                  Auditoria e Vales de Reposição
                </h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 border border-slate-700">
                  {itensOrdenados.length} lançamentos
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {mostrarTabela
                  ? 'Visualização expandida de todos os vales SSTR com detalhes fiscais e rateio de equipe.'
                  : 'Detalhamento individual de vales, equipes e notas fiscais oculto para priorizar os gráficos e KPIs executivos.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {mostrarTabela && (
              <div className="flex items-center gap-1.5 mr-2">
                <span className="text-[11px] text-slate-400">Ordenar:</span>
                <select
                  value={ordenacao}
                  onChange={(e: any) => setOrdenacao(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg px-2 py-1.5 focus:outline-none focus:border-amber-500"
                >
                  <option value="data-desc">Mais Recentes</option>
                  <option value="data-asc">Mais Antigos</option>
                  <option value="valor-desc">Maior Prejuízo (R$)</option>
                  <option value="valor-asc">Menor Prejuízo (R$)</option>
                  <option value="volume-desc">Maior Volume (HL)</option>
                  <option value="qtde-desc">Maior Quantidade</option>
                </select>
              </div>
            )}

            <button
              onClick={() => setMostrarTabela(!mostrarTabela)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                mostrarTabela
                  ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
              }`}
            >
              {mostrarTabela ? (
                <>
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                  <span>Ocultar Registros</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 text-amber-400" />
                  <span>Exibir Tabela de Vales ({itensOrdenados.length})</span>
                  <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tabela Responsiva exibida apenas quando expandida */}
        {mostrarTabela && (
          <div className="mt-4 overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-3">Data / Vale</th>
                  <th className="py-3 px-3">Rota / NF</th>
                  <th className="py-3 px-3">Motorista & Equipe</th>
                  <th className="py-3 px-3">PDV / Cliente</th>
                  <th className="py-3 px-3">Detalhamento SKU</th>
                  <th className="py-3 px-3 text-right">Volume</th>
                  <th className="py-3 px-3 text-right">Prejuízo</th>
                  <th className="py-3 px-3 text-right">Rateio/Pessoa</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {itensOrdenados.length > 0 ? (
                  itensOrdenados.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors group">
                      {/* Data / Vale */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-semibold text-white">{item.data_emissao || formatDataBR(item.dataOperacao)}</div>
                        <div className="text-[10px] text-amber-400 font-mono">{item.id_vale_sstr || item.id}</div>
                      </td>

                      {/* Rota / NF */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-bold text-rose-400">
                          <MapPin className="w-3 h-3 text-rose-500" />
                          <span>Rota {item.rota_setor || 'R101'}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          NF: {item.nota_fiscal || '-'} | Carga: {item.mapa_carga || '-'}
                        </div>
                      </td>

                      {/* Motorista & Equipe */}
                      <td className="py-3 px-3 max-w-[160px]">
                        <div className="font-medium text-slate-200 truncate">{item.motorista}</div>
                        <div className="text-[10px] text-slate-400 truncate">
                          Aj: {item.ajudante_1 || item.equipe_completa || '-'}
                        </div>
                      </td>

                      {/* PDV / Cliente */}
                      <td className="py-3 px-3 max-w-[150px]">
                        <div className="text-slate-300 truncate font-medium">
                          {item.razao_social_cliente || 'PDV BALCÃO'}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {item.codigo_cliente || '-'}
                        </div>
                      </td>

                      {/* Detalhamento SKU */}
                      <td className="py-3 px-3 max-w-[200px]">
                        <div className="font-medium text-white truncate" title={item.detalhamento_skus || item.descricao}>
                          {item.detalhamento_skus || item.descricao}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className="px-1.5 py-0.2 rounded text-[10px] font-semibold"
                            style={{
                              backgroundColor: `${CORES_EMBALAGEM[item.embalagem] || '#64748b'}20`,
                              color: CORES_EMBALAGEM[item.embalagem] || '#94a3b8',
                            }}
                          >
                            {item.embalagem}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {item.qtde} {item.qtde > 1 ? 'caixas' : 'caixa'}
                          </span>
                        </div>
                      </td>

                      {/* Volume HL */}
                      <td className="py-3 px-3 text-right whitespace-nowrap font-mono text-sky-400 font-semibold">
                        {formatHL(item.volume_total_hl)}
                      </td>

                      {/* Prejuízo R$ */}
                      <td className="py-3 px-3 text-right whitespace-nowrap font-bold text-amber-400">
                        {formatBRL(item.valor)}
                      </td>

                      {/* Rateio */}
                      <td className="py-3 px-3 text-right whitespace-nowrap font-mono text-purple-300">
                        {formatBRL(item.valor_rateado_por_pessoa || item.valor / 2)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                          style={{
                            backgroundColor: `${CORES_STATUS[item.status_vale || 'Compensado'] || '#10b981'}20`,
                            color: CORES_STATUS[item.status_vale || 'Compensado'] || '#10b981',
                            border: `1px solid ${CORES_STATUS[item.status_vale || 'Compensado'] || '#10b981'}40`,
                          }}
                        >
                          {item.status_vale || 'Compensado'}
                        </span>
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setItemDetalhes(item)}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 transition-colors"
                            title="Ver Detalhes do Vale SSTR"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleAbrirEditar(item)}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 transition-colors"
                            title="Editar Lançamento"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleExcluirItem(item.id)}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-rose-400 hover:text-rose-300 transition-colors"
                            title="Excluir Lançamento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-xs text-slate-500">
                      Nenhum vale de reposição encontrado com os filtros selecionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: IMPORTAR PLANILHA EXCEL / CSV / COLAR */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
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
              <p className="text-slate-400 text-[11px] leading-relaxed">
                • <strong>Data / Dt. Operacao / data_emissao</strong><br />
                • <strong>Nota Fiscal / Mapa Carga / Rota Setor</strong><br />
                • <strong>Motorista / Ajudante 1 / Ajudante 2</strong><br />
                • <strong>Valor / Prejuízo / valor_total_prejuizo</strong><br />
                • <strong>Volume HL / Qtde / Detalhamento SKUs / Embalagem</strong>
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
                  ou cole dados copiados da planilha
                </span>
                <div className="flex-grow border-t border-slate-800" />
              </div>

              {/* Área de Colar */}
              <div>
                <textarea
                  value={textoColado}
                  onChange={(e) => setTextoColado(e.target.value)}
                  placeholder="Copie as células do Excel (incluindo cabeçalho) e cole aqui..."
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

      {/* MODAL 2: IMPORTAR JSON OFICIAL SSTR */}
      {isJsonModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <FileJson className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Importar JSON Oficial de Reposição</span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                      Modelo SSTR Ambev
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Puxe diretamente do GitHub, carregue arquivo ou cole o código JSON
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsJsonModalOpen(false);
                  setJsonImportStatus({ tipo: null, msg: '' });
                  setGithubError(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Selector */}
            <div className="flex border-b border-slate-800 bg-slate-950/60 -mx-6 -mt-4 px-6 pt-2 gap-2 mb-4">
              <button
                type="button"
                onClick={() => {
                  setJsonModalTab('github');
                  setGithubError(null);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all cursor-pointer border-b-2 ${
                  jsonModalTab === 'github'
                    ? 'bg-slate-900 text-amber-400 border-amber-400'
                    : 'text-slate-400 hover:text-slate-200 border-transparent'
                }`}
              >
                <Globe className="w-4 h-4" />
                <span>Link do GitHub / Web</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">Recomendado</span>
              </button>
              <button
                type="button"
                onClick={() => setJsonModalTab('file')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all cursor-pointer border-b-2 ${
                  jsonModalTab === 'file'
                    ? 'bg-slate-900 text-amber-400 border-amber-400'
                    : 'text-slate-400 hover:text-slate-200 border-transparent'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>Arquivo .JSON</span>
              </button>
              <button
                type="button"
                onClick={() => setJsonModalTab('text')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all cursor-pointer border-b-2 ${
                  jsonModalTab === 'text'
                    ? 'bg-slate-900 text-amber-400 border-amber-400'
                    : 'text-slate-400 hover:text-slate-200 border-transparent'
                }`}
              >
                <Code2 className="w-4 h-4" />
                <span>Colar Código</span>
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

            {/* TAB 1: GITHUB */}
            {jsonModalTab === 'github' && (
              <div className="space-y-4">
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div>
                    <label className="text-xs font-bold text-white flex items-center gap-2 mb-1">
                      <Globe className="w-4 h-4 text-amber-400" />
                      Cole o Link do GitHub (Repositório, Arquivo ou Raw):
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Insira a URL do arquivo no GitHub (ex: <code className="text-amber-300 font-mono">github.com/.../blob/main/reposicao.json</code>). O sistema converte automaticamente para raw.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                    <div className="relative flex-1">
                      <LinkIcon className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="url"
                        placeholder="https://github.com/usuario/repo/blob/main/reposicao.json"
                        value={githubUrlInput}
                        onChange={(e) => {
                          setGithubUrlInput(e.target.value);
                          setGithubError(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleFetchGitHubReposicao();
                          }
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none font-mono"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={isLoadingGithub || !githubUrlInput.trim()}
                      onClick={() => handleFetchGitHubReposicao()}
                      className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    >
                      {isLoadingGithub ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Puxando Dados...</span>
                        </>
                      ) : (
                        <>
                          <DownloadCloud className="w-4 h-4" />
                          <span>Puxar do GitHub</span>
                        </>
                      )}
                    </button>
                  </div>

                  {githubError && (
                    <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-xl text-xs space-y-1.5">
                      <div className="flex items-center gap-2 font-bold text-rose-400">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        <span>Aviso de Carregamento:</span>
                      </div>
                      <p className="text-[11px] leading-relaxed">{githubError}</p>
                      <div className="text-[10px] text-rose-300/80 bg-rose-950/40 p-2 rounded-lg mt-1 space-y-0.5">
                        <p className="font-semibold">💡 Dicas para links do GitHub:</p>
                        <p>• Certifique-se de que o repositório no GitHub é <strong>Público</strong>.</p>
                        <p>• Se o repositório for privado, copie o conteúdo e use a aba <strong>"Colar Código"</strong>.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: ARQUIVO */}
            {jsonModalTab === 'file' && (
              <div className="space-y-4">
                <div
                  onClick={() => jsonFileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 hover:border-amber-500/60 bg-slate-950/40 hover:bg-amber-500/5 rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2"
                >
                  <input
                    ref={jsonFileInputRef}
                    type="file"
                    accept=".json,application/json"
                    onChange={handleJsonUpload}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-semibold text-white">
                    Clique ou arraste um arquivo .JSON aqui
                  </div>
                  <div className="text-xs text-slate-400">
                    Importa automaticamente todos os registros do arquivo
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: TEXTO */}
            {jsonModalTab === 'text' && (
              <div className="space-y-4">
                {/* Exemplo de Formato Aceito com Botão de Auto-Preenchimento */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-xs">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-bold text-amber-400 flex items-center gap-1.5">
                      <Code2 className="w-4 h-4" />
                      <span>Modelo JSON Oficial Requerido:</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setJsonColado(EXEMPLO_JSON_OFICIAL);
                      }}
                      className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 hover:underline cursor-pointer font-bold"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Preencher Exemplo Oficial</span>
                    </button>
                  </div>

                  <pre className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 font-mono text-[11px] overflow-x-auto leading-tight custom-scrollbar max-h-28">
{EXEMPLO_JSON_OFICIAL}
                  </pre>
                </div>

                {/* Banner if user pasted URL */}
                {isWebOrGitHubUrl(jsonColado.trim()) && (
                  <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-300">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <span>Detectamos um link web/GitHub colado! Deseja puxar os dados deste arquivo?</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleFetchGitHubReposicao(jsonColado.trim())}
                      disabled={isLoadingGithub}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg cursor-pointer flex items-center gap-1 text-[11px] flex-shrink-0 shadow"
                    >
                      {isLoadingGithub ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <DownloadCloud className="w-3.5 h-3.5" />}
                      Puxar do GitHub
                    </button>
                  </div>
                )}

                {/* Área de Colar JSON */}
                <div>
                  <textarea
                    value={jsonColado}
                    onChange={(e) => setJsonColado(e.target.value)}
                    placeholder={`Cole aqui o JSON de Reposição no formato:\n{\n  "item_numero": 1,\n  "data_emissao": "14/01/2026",\n  "nota_fiscal": "252161",\n  "mapa_carga": "M1055",\n  "rota_setor": "R111",\n  "motorista": "DANILLO PEREIRA DOS SANTOS SILVA",\n  "valor_total_prejuizo": 57.04,\n  "volume_total_hl": 0.08,\n  "detalhamento_skus": "9068 - SKOL LATA 350ML SH C/12 NPAL (2 CX)"\n}`}
                    rows={6}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-500 placeholder:text-slate-600 custom-scrollbar"
                  />
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Suporta objeto único <code>{`{...}`}</code> ou lista <code>{`[{...}, {...}]`}</code>
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
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: AUDITORIA / DETALHES COMPLETOS DO VALE SSTR */}
      {itemDetalhes && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Vale de Reposição: {itemDetalhes.id_vale_sstr || itemDetalhes.id}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Comprovante operacional de avaria e rateio de rota
                  </p>
                </div>
              </div>
              <button
                onClick={() => setItemDetalhes(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Bloco 1: Identificação Operacional */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="font-bold text-amber-400 uppercase text-[10px] tracking-wider">
                  Dados do Sinistro / Emissão
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-300">
                  <div>
                    <span className="text-slate-500 block">Data Emissão:</span>
                    <strong className="text-white">{itemDetalhes.data_emissao || itemDetalhes.dataOperacao}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Nota Fiscal:</span>
                    <strong className="text-white font-mono">{itemDetalhes.nota_fiscal || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Mapa de Carga:</span>
                    <strong className="text-white font-mono">{itemDetalhes.mapa_carga || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Rota / Setor:</span>
                    <strong className="text-rose-400 font-bold">{itemDetalhes.rota_setor || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Status do Vale:</span>
                    <strong className="text-emerald-400">{itemDetalhes.status_vale || 'Compensado'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Item Linha:</span>
                    <strong className="text-white font-mono">#{itemDetalhes.item_numero || 1}</strong>
                  </div>
                </div>
              </div>

              {/* Bloco 2: Equipe de Transporte e Rateio */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="font-bold text-purple-400 uppercase text-[10px] tracking-wider flex items-center justify-between">
                  <span>Equipe & Rateio Financeiro</span>
                  <span className="text-slate-400 font-normal">{itemDetalhes.total_integrantes_rateio || '2 Integrante(s)'}</span>
                </div>
                <div className="space-y-1.5 text-slate-300">
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Motorista Responsável:</span>
                    <span className="font-semibold text-white">{itemDetalhes.motorista}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">CPF Motorista:</span>
                    <span className="font-mono text-slate-300">{itemDetalhes.cpf_motorista || '-'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Ajudante 1:</span>
                    <span className="font-semibold text-white">{itemDetalhes.ajudante_1 || '-'}</span>
                  </div>
                  {itemDetalhes.ajudante_2 && itemDetalhes.ajudante_2 !== '-' && (
                    <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Ajudante 2:</span>
                      <span className="font-semibold text-white">{itemDetalhes.ajudante_2}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-1 text-purple-300 font-bold bg-purple-500/10 px-2 rounded">
                    <span>Valor Rateado por Pessoa:</span>
                    <span>{formatBRL(itemDetalhes.valor_rateado_por_pessoa || itemDetalhes.valor / 2)}</span>
                  </div>
                </div>
              </div>

              {/* Bloco 3: Cliente PDV e Produto */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="font-bold text-sky-400 uppercase text-[10px] tracking-wider">
                  Ponto de Venda & Mercadoria
                </div>
                <div className="space-y-1 text-slate-300">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Cliente Atendido:</span>
                    <strong className="text-white">{itemDetalhes.razao_social_cliente || 'PONTO DE VENDA (PDV)'}</strong>
                    <span className="text-slate-400 ml-2 font-mono text-[10px]">({itemDetalhes.codigo_cliente || 'CLI-PDV'})</span>
                  </div>
                  <div className="pt-2">
                    <span className="text-slate-500 block text-[10px]">Detalhamento SKUs:</span>
                    <p className="p-2 bg-slate-900 border border-slate-800 rounded text-amber-300 font-medium font-mono text-[11px]">
                      {itemDetalhes.detalhamento_skus || itemDetalhes.descricao}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bloco 4: Resumo Financeiro */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-center">
                  <span className="text-slate-400 block text-[10px]">Prejuízo Total</span>
                  <strong className="text-amber-400 text-sm font-bold">{formatBRL(itemDetalhes.valor)}</strong>
                </div>
                <div className="p-2.5 rounded-lg bg-sky-500/10 border border-sky-500/30 text-center">
                  <span className="text-slate-400 block text-[10px]">Volume Físico</span>
                  <strong className="text-sky-400 text-sm font-bold">{formatHL(itemDetalhes.volume_total_hl)}</strong>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-center">
                  <span className="text-slate-400 block text-[10px]">Quantidade</span>
                  <strong className="text-emerald-400 text-sm font-bold">{itemDetalhes.qtde} cx/un</strong>
                </div>
              </div>

              {itemDetalhes.observacao && (
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
                  <strong className="text-slate-300">Observações: </strong>
                  {itemDetalhes.observacao}
                </div>
              )}
            </div>

            <div className="flex justify-end mt-4 pt-3 border-t border-slate-800">
              <button
                onClick={() => setItemDetalhes(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: NOVO LANÇAMENTO MANUAL / EDITAR */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-400" />
                <span>{editItem ? 'Editar Vale de Reposição' : 'Novo Vale de Reposição (SSTR)'}</span>
              </h3>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarItem} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Data Emissão *
                  </label>
                  <input
                    type="date"
                    required
                    value={formNovo.dataEmissao}
                    onChange={(e) => setFormNovo((p) => ({ ...p, dataEmissao: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Rota / Setor *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: R111"
                    value={formNovo.rotaSetor}
                    onChange={(e) => setFormNovo((p) => ({ ...p, rotaSetor: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-amber-500 uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Nota Fiscal (NF)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 252161"
                    value={formNovo.notaFiscal}
                    onChange={(e) => setFormNovo((p) => ({ ...p, notaFiscal: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Mapa de Carga
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: M1055"
                    value={formNovo.mapaCarga}
                    onChange={(e) => setFormNovo((p) => ({ ...p, mapaCarga: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Motorista
                  </label>
                  <input
                    type="text"
                    placeholder="Nome completo do motorista"
                    value={formNovo.motorista}
                    onChange={(e) => setFormNovo((p) => ({ ...p, motorista: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-amber-500 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Ajudante 1
                  </label>
                  <input
                    type="text"
                    placeholder="Nome do 1º ajudante"
                    value={formNovo.ajudante1}
                    onChange={(e) => setFormNovo((p) => ({ ...p, ajudante1: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-amber-500 uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Detalhamento SKUs / Produto *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 9068 - SKOL LATA 350ML SH C/12 NPAL (2 CX)"
                  value={formNovo.detalhamentoSkus}
                  onChange={(e) => setFormNovo((p) => ({ ...p, detalhamentoSkus: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-amber-500 uppercase"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Cliente (PDV)
                </label>
                <input
                  type="text"
                  placeholder="Ex: PONTO DE VENDA (PDV) BAR DO ZECA"
                  value={formNovo.razaoSocialCliente}
                  onChange={(e) => setFormNovo((p) => ({ ...p, razaoSocialCliente: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-amber-500 uppercase"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Prejuízo (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="57.04"
                    value={formNovo.valorTotalPrejuizo}
                    onChange={(e) => setFormNovo((p) => ({ ...p, valorTotalPrejuizo: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Volume (HL)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.08"
                    value={formNovo.volumeTotalHL}
                    onChange={(e) => setFormNovo((p) => ({ ...p, volumeTotalHL: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Qtd Itens/Cx
                  </label>
                  <input
                    type="number"
                    placeholder="1"
                    value={formNovo.qtdItens}
                    onChange={(e) => setFormNovo((p) => ({ ...p, qtdItens: e.target.value }))}
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
                    <option value="Chopp Barril">Chopp Barril</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Status do Vale
                  </label>
                  <select
                    value={formNovo.statusVale}
                    onChange={(e) => setFormNovo((p) => ({ ...p, statusVale: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="Compensado">Compensado</option>
                    <option value="Pendente">Pendente</option>
                    <option value="Em Aberto">Em Aberto</option>
                    <option value="Faturado">Faturado</option>
                    <option value="Descontado">Descontado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Observações / Motivo
                </label>
                <textarea
                  rows={2}
                  placeholder="Informações adicionais do vale de reposição..."
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
                  {editItem ? 'Salvar Alterações' : 'Criar Vale SSTR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
