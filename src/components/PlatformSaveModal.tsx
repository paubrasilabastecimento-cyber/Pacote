import React, { useState, useEffect, useRef } from 'react';
import {
  Download,
  Upload,
  Save,
  CheckCircle2,
  AlertCircle,
  X,
  Database,
  BarChart3,
  Layers,
  Beer,
  RotateCcw,
  FileSpreadsheet,
  ShieldCheck,
  HardDrive,
  RefreshCw,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  collectCurrentPlatformData,
  downloadPlatformBackup,
  saveAllPlatformDataToServer,
  restorePlatformBackup,
  PlatformFullBackup,
} from '../utils/platformBackup';
import { useApp } from '../context/AppContext';

interface PlatformSaveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlatformSaveModal: React.FC<PlatformSaveModalProps> = ({ isOpen, onClose }) => {
  const { perdas, acoes, kpis, trocasImproprio, trocaPlanilhaItens, nomeArquivoTroca } = useApp();

  const [loading, setLoading] = useState<boolean>(false);
  const [dataStats, setDataStats] = useState<PlatformFullBackup['summary'] | null>(null);
  const [feedback, setFeedback] = useState<{
    tipo: 'sucesso' | 'erro';
    mensagem: string;
  } | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carregar sumário e estatísticas atuais
  const refreshStats = async () => {
    try {
      const full = await collectCurrentPlatformData();
      setDataStats(full.summary);
    } catch (e) {
      console.warn('Erro ao obter estatísticas:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshStats();
      setFeedback(null);
    }
  }, [isOpen, perdas, acoes, kpis, trocasImproprio, trocaPlanilhaItens]);

  if (!isOpen) return null;

  // 1. Download Backup JSON
  const handleDownloadBackup = async () => {
    try {
      setLoading(true);
      setFeedback(null);
      const res = await downloadPlatformBackup();
      setLastSaved(new Date().toLocaleTimeString());
      setFeedback({
        tipo: 'sucesso',
        mensagem: `Backup completo gerado e salvo com sucesso! (${res.totalRecords} registros exportados no arquivo ${res.filename})`,
      });
      await refreshStats();
    } catch (err: any) {
      setFeedback({
        tipo: 'erro',
        mensagem: `Erro ao exportar backup: ${err?.message || 'Falha desconhecida'}`,
      });
    } finally {
      setLoading(false);
    }
  };

  // 2. Gravar / Sincronizar Tudo no Servidor
  const handleSaveToServer = async () => {
    try {
      setLoading(true);
      setFeedback(null);
      const res = await saveAllPlatformDataToServer();
      setLastSaved(new Date().toLocaleTimeString());
      setFeedback({
        tipo: 'sucesso',
        mensagem: `${res.message || 'Todos os registros foram salvos e sincronizados com sucesso no servidor e armazenamento local!'}`,
      });
      await refreshStats();
    } catch (err: any) {
      setFeedback({
        tipo: 'erro',
        mensagem: `Erro ao salvar no servidor: ${err?.message || 'Falha de conexão'}`,
      });
    } finally {
      setLoading(false);
    }
  };

  // 3. Restaurar Backup
  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setFeedback(null);
      const text = await file.text();
      const res = await restorePlatformBackup(text);
      setLastSaved(new Date().toLocaleTimeString());
      setFeedback({
        tipo: 'sucesso',
        mensagem: `Backup restaurado com sucesso! Todos os dados da plataforma foram atualizados.`,
      });
      await refreshStats();
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setFeedback({
        tipo: 'erro',
        mensagem: `Erro ao restaurar backup: ${err?.message || 'Arquivo inválido ou corrompido'}`,
      });
    } finally {
      setLoading(false);
      if (e.target) e.target.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <input
        type="file"
        ref={fileInputRef}
        accept=".json,application/json"
        onChange={handleRestoreFile}
        className="hidden"
      />

      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white tracking-tight">
                  Salvar Dados & Backup Geral da Plataforma
                </h3>
                <span className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                  100% Persistente
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Exporte, sincronize e faça a guarda segura de todas as abas e módulos operacionais AMBEV.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Feedback banner */}
          {feedback && (
            <div
              className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-semibold animate-fadeIn ${
                feedback.tipo === 'sucesso'
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
              }`}
            >
              {feedback.tipo === 'sucesso' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              )}
              <div className="flex-1">{feedback.mensagem}</div>
            </div>
          )}

          {/* Cards de Resumo dos Módulos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-amber-400" />
                Resumo Geral de Registros Cadastrados
              </span>
              {dataStats && (
                <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                  Total: {dataStats.totalRegistrosGerais.toLocaleString('pt-BR')} registros
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {/* Quebras */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <BarChart3 className="w-3 h-3 text-amber-400" />
                  Quebras / Ocorrências
                </span>
                <span className="text-lg font-black text-amber-400 font-mono mt-1">
                  {dataStats?.totalQuebras ?? '...'}
                </span>
              </div>

              {/* Reposição */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <FileSpreadsheet className="w-3 h-3 text-amber-400" />
                  Reposição
                </span>
                <span className="text-lg font-black text-white font-mono mt-1">
                  {dataStats?.totalReposicao ?? '...'}
                </span>
              </div>

              {/* Perdas por Mercadoria */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-sky-400" />
                  Perdas p/ Mercadoria
                </span>
                <span className="text-lg font-black text-sky-400 font-mono mt-1">
                  {dataStats?.totalPerdasPor ?? '...'}
                </span>
              </div>

              {/* Consumo Interno */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Beer className="w-3 h-3 text-emerald-400" />
                  Consumo Interno
                </span>
                <span className="text-lg font-black text-emerald-400 font-mono mt-1">
                  {dataStats?.totalConsumoInterno ?? '...'}
                </span>
              </div>

              {/* Trocas Impróprio */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <RotateCcw className="w-3 h-3 text-purple-400" />
                  Troca Impróprio
                </span>
                <span className="text-lg font-black text-purple-400 font-mono mt-1">
                  {(dataStats?.totalTrocasImproprio || 0) + (dataStats?.totalTrocaPlanilha || 0)}
                </span>
              </div>

              {/* Planos 5W2H */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-rose-400" />
                  Planos 5W2H
                </span>
                <span className="text-lg font-black text-rose-400 font-mono mt-1">
                  {dataStats?.totalPlanosAcao ?? '...'}
                </span>
              </div>

              {/* Vales de Prejuízo */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <FileSpreadsheet className="w-3 h-3 text-yellow-400" />
                  Vales de Prejuízo
                </span>
                <span className="text-lg font-black text-yellow-400 font-mono mt-1">
                  {dataStats?.totalVales ?? '...'}
                </span>
              </div>

              {/* KPIs & Comentários */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-blue-400" />
                  KPIs & Revisão
                </span>
                <span className="text-lg font-black text-blue-400 font-mono mt-1">
                  {(dataStats?.totalKPIs || 0) + (dataStats?.totalComentarios || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Seção Principal de Ações de Salvamento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Opção 1: Salvar e Baixar Arquivo JSON */}
            <div className="p-4 rounded-xl bg-gradient-to-b from-slate-800/80 to-slate-950 border border-slate-700/80 flex flex-col justify-between hover:border-amber-500/50 transition-all">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Baixar Arquivo de Backup (JSON)</h4>
                    <p className="text-[11px] text-slate-400">Gera um arquivo com todos os dados para guardar no seu computador</p>
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  Exporta um pacote completo contendo todas as tabelas, lançamentos, planilhas, histórico e planos de ação.
                </p>
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={handleDownloadBackup}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>Salvar e Baixar Backup Completo (.JSON)</span>
              </button>
            </div>

            {/* Opção 2: Gravar no Servidor e Local */}
            <div className="p-4 rounded-xl bg-gradient-to-b from-slate-800/80 to-slate-950 border border-slate-700/80 flex flex-col justify-between hover:border-emerald-500/50 transition-all">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <Save className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Sincronizar no Servidor</h4>
                    <p className="text-[11px] text-slate-400">Persistência imediata no banco de dados e disco local</p>
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  Força a gravação de todos os dados atuais em memória e no banco do servidor <code className="text-emerald-400 font-mono">data_store.json</code>.
                </p>
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={handleSaveToServer}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Gravar Tudo no Servidor Agora</span>
              </button>
            </div>
          </div>

          {/* Seção de Restauração */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-800 text-slate-300">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Restaurar Backup Anterior</h4>
                <p className="text-[11px] text-slate-400">
                  Carregue um arquivo <code className="text-amber-400 font-mono">.json</code> salvo anteriormente para restaurar todas as bases
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer border border-slate-700 shrink-0"
            >
              <Upload className="w-4 h-4 text-amber-400" />
              <span>Selecionar Arquivo de Backup</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Última ação: {lastSaved ? `às ${lastSaved}` : 'Pronto para salvar'}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
