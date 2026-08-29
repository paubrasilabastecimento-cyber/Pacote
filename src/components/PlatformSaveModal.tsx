import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
      const res = await downloadPlatformBackup({
        perdas,
        acoes,
        kpis,
        trocasImproprio,
        trocaPlanilhaItens,
        nomeArquivoTroca,
      });
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
      const res = await saveAllPlatformDataToServer({
        perdas,
        acoes,
        kpis,
        trocasImproprio,
        trocaPlanilhaItens,
        nomeArquivoTroca,
      });
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

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <input
        type="file"
        ref={fileInputRef}
        accept=".json,application/json"
        onChange={handleRestoreFile}
        className="hidden"
      />

      <div className="bg-white border border-blue-200 rounded-2xl w-full max-w-3xl shadow-2xl shadow-blue-950/20 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-blue-100 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-md text-white shadow-md border border-white/20">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white tracking-tight">
                  Salvar Dados & Backup Geral da Plataforma
                </h3>
                <span className="bg-emerald-400/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                  100% Persistente
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5">
                Exporte, sincronize e faça a guarda segura de todas as abas e módulos operacionais.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
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
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {feedback.tipo === 'sucesso' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <div className="flex-1">{feedback.mensagem}</div>
            </div>
          )}

          {/* Cards de Resumo dos Módulos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-blue-600" />
                Resumo Geral de Registros Cadastrados
              </span>
              {dataStats && (
                <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                  Total: {dataStats.totalRegistrosGerais.toLocaleString('pt-BR')} registros
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {/* Quebras */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <BarChart3 className="w-3 h-3 text-blue-600" />
                  Quebras / Ocorrências
                </span>
                <span className="text-lg font-black text-blue-950 font-mono mt-1">
                  {dataStats?.totalQuebras ?? '...'}
                </span>
              </div>

              {/* Reposição */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <FileSpreadsheet className="w-3 h-3 text-amber-600" />
                  Reposição
                </span>
                <span className="text-lg font-black text-blue-950 font-mono mt-1">
                  {dataStats?.totalReposicao ?? '...'}
                </span>
              </div>

              {/* Avarias no Total */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-sky-600" />
                  Avarias no Total
                </span>
                <span className="text-lg font-black text-blue-950 font-mono mt-1">
                  {dataStats?.totalPerdasPor ?? '...'}
                </span>
              </div>

              {/* Consumo Interno */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Beer className="w-3 h-3 text-emerald-600" />
                  Consumo Interno
                </span>
                <span className="text-lg font-black text-emerald-600 font-mono mt-1">
                  {dataStats?.totalConsumoInterno ?? '...'}
                </span>
              </div>

              {/* Trocas Impróprio */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <RotateCcw className="w-3 h-3 text-purple-600" />
                  Troca Impróprio
                </span>
                <span className="text-lg font-black text-purple-600 font-mono mt-1">
                  {(dataStats?.totalTrocasImproprio || 0) + (dataStats?.totalTrocaPlanilha || 0)}
                </span>
              </div>

              {/* Planos 5W2H */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-rose-600" />
                  Planos 5W2H
                </span>
                <span className="text-lg font-black text-rose-600 font-mono mt-1">
                  {dataStats?.totalPlanosAcao ?? '...'}
                </span>
              </div>

              {/* Vales de Prejuízo */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <FileSpreadsheet className="w-3 h-3 text-yellow-600" />
                  Vales de Prejuízo
                </span>
                <span className="text-lg font-black text-yellow-700 font-mono mt-1">
                  {dataStats?.totalVales ?? '...'}
                </span>
              </div>

              {/* KPIs & Comentários */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-blue-600" />
                  KPIs & Revisão
                </span>
                <span className="text-lg font-black text-blue-600 font-mono mt-1">
                  {(dataStats?.totalKPIs || 0) + (dataStats?.totalComentarios || 0)}
                </span>
              </div>

              {/* Refugo */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Database className="w-3 h-3 text-emerald-600" />
                  Refugo (Ativos)
                </span>
                <span className="text-lg font-black text-emerald-600 font-mono mt-1">
                  {dataStats?.totalRefugo ?? '...'}
                </span>
              </div>
            </div>
          </div>

          {/* Seção Principal de Ações de Salvamento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Opção 1: Salvar e Baixar Arquivo JSON */}
            <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 flex flex-col justify-between hover:border-blue-400 transition-all">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-blue-950">Baixar Arquivo de Backup (JSON)</h4>
                    <p className="text-[11px] text-slate-500">Gera um arquivo com todos os dados para guardar no seu computador</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Exporta um pacote completo contendo todas as tabelas, lançamentos, planilhas, histórico e planos de ação.
                </p>
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={handleDownloadBackup}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50"
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
            <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 flex flex-col justify-between hover:border-emerald-400 transition-all">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                    <Save className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-950">Sincronizar no Servidor</h4>
                    <p className="text-[11px] text-slate-500">Persistência imediata no banco de dados e nuvem</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Força a gravação de todos os dados atuais em memória e no banco de dados Firestore da plataforma.
                </p>
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={handleSaveToServer}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
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
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-blue-950">Restaurar Backup Anterior</h4>
                <p className="text-[11px] text-slate-500">
                  Carregue um arquivo <code className="text-blue-700 font-bold font-mono">.json</code> salvo anteriormente para restaurar todas as bases
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold transition-all cursor-pointer border border-slate-300 shrink-0 shadow-sm"
            >
              <Upload className="w-4 h-4 text-blue-600" />
              <span>Selecionar Arquivo de Backup</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Última ação: {lastSaved ? `às ${lastSaved}` : 'Pronto para salvar'}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
