import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Trash2,
  AlertTriangle,
  Download,
  RotateCcw,
  CheckCircle2,
  X,
  ShieldAlert,
  HardDrive,
  RefreshCw,
  Boxes,
  Package,
  Layers,
  Scale,
  DollarSign,
} from 'lucide-react';
import {
  clearAllPlatformData,
  resetPlatformToDemo,
  downloadPlatformBackup,
  collectCurrentPlatformData,
  PlatformFullBackup,
} from '../utils/platformBackup';
import { useApp } from '../context/AppContext';

interface PlatformClearModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessToast?: (msg: string) => void;
}

export const PlatformClearModal: React.FC<PlatformClearModalProps> = ({
  isOpen,
  onClose,
  onSuccessToast,
}) => {
  const { clearAllData, resetDemoData, perdas, acoes, kpis, trocasImproprio, trocaPlanilhaItens, nomeArquivoTroca } = useApp();

  const [loadingAction, setLoadingAction] = useState<'clear' | 'reset' | 'backup' | null>(null);
  const [stats, setStats] = useState<PlatformFullBackup['summary'] | null>(null);
  const [confirmedCheck, setConfirmedCheck] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null);

  // Carregar contagem atual de registros
  const refreshStats = async () => {
    try {
      const full = await collectCurrentPlatformData();
      setStats(full.summary);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshStats();
      setConfirmedCheck(false);
      setFeedback(null);
    }
  }, [isOpen, perdas, acoes, kpis, trocasImproprio, trocaPlanilhaItens]);

  if (!isOpen) return null;

  // 1. Baixar Backup de Segurança
  const handleDownloadBackup = async () => {
    try {
      setLoadingAction('backup');
      setFeedback(null);
      const res = await downloadPlatformBackup({
        perdas,
        acoes,
        kpis,
        trocasImproprio,
        trocaPlanilhaItens,
        nomeArquivoTroca,
      });
      setFeedback({
        tipo: 'sucesso',
        mensagem: `✓ Backup baixado com sucesso! (${res.totalRecords} registros exportados no arquivo ${res.filename})`,
      });
    } catch (err: any) {
      setFeedback({
        tipo: 'erro',
        mensagem: `Erro ao exportar backup: ${err?.message || 'Falha desconhecida'}`,
      });
    } finally {
      setLoadingAction(null);
    }
  };

  // 2. Limpar Tudo (Zerar Plataforma)
  const handleClearAll = async () => {
    try {
      setLoadingAction('clear');
      setFeedback(null);

      // Limpar no utilitário (Storage + Server)
      await clearAllPlatformData();

      // Limpar no contexto React
      await clearAllData();

      const msg = '✓ Toda a plataforma foi limpa com sucesso! Todos os módulos foram zerados.';
      if (onSuccessToast) onSuccessToast(msg);

      setFeedback({
        tipo: 'sucesso',
        mensagem: msg,
      });

      await refreshStats();

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Erro ao limpar plataforma:', err);
      setFeedback({
        tipo: 'erro',
        mensagem: `Erro ao limpar dados: ${err?.message || 'Falha ao executar limpeza'}`,
      });
    } finally {
      setLoadingAction(null);
    }
  };

  // 3. Restaurar Dados Demonstrativos Padrão
  const handleResetToDemo = async () => {
    try {
      setLoadingAction('reset');
      setFeedback(null);

      await resetPlatformToDemo();
      await resetDemoData();

      const msg = '✓ Dados demonstrativos originais de fábrica restaurados com sucesso!';
      if (onSuccessToast) onSuccessToast(msg);

      setFeedback({
        tipo: 'sucesso',
        mensagem: msg,
      });

      await refreshStats();

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Erro ao restaurar demo:', err);
      setFeedback({
        tipo: 'erro',
        mensagem: `Erro ao restaurar dados padrão: ${err?.message || 'Falha desconhecida'}`,
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const totalGeral = stats?.totalRegistrosGerais || (perdas.length + acoes.length + kpis.length);

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden text-slate-100 flex flex-col my-auto max-h-[92vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                Limpar Todos os Dados da Plataforma
              </h2>
              <p className="text-[11px] text-slate-400">
                Gerenciamento de limpeza global e reinicialização de base
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-300">
          {/* Feedback Alert */}
          {feedback && (
            <div
              className={`p-3 rounded-xl border flex items-start gap-2.5 animate-in fade-in duration-200 ${
                feedback.tipo === 'sucesso'
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                  : 'bg-red-500/10 border-red-500/40 text-red-300'
              }`}
            >
              {feedback.tipo === 'sucesso' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              )}
              <span className="font-medium text-xs leading-relaxed">{feedback.mensagem}</span>
            </div>
          )}

          {/* Warning Box */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-amber-300 block text-xs">
                Atenção: Ação de impacto global no sistema
              </span>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Ao confirmar a limpeza, todos os registros carregados ou inseridos em todas as 6 abas operacionais do sistema serão permanentemente removidos tanto do banco de dados quanto do cache do seu navegador.
              </p>
            </div>
          </div>

          {/* Module Summary Impact Grid */}
          <div>
            <span className="text-xs font-bold text-slate-200 block mb-1.5">
              Módulos que serão zerados ({totalGeral.toLocaleString('pt-BR')} registros totais identificados):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
              <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
                <span className="text-slate-400 block text-[10px]">1. Perdas PA</span>
                <span className="font-bold text-white">{(stats?.totalQuebras ?? perdas.length)} registros</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
                <span className="text-slate-400 block text-[10px]">2. WQI Movimentação</span>
                <span className="font-bold text-white">{(stats?.totalQuebrasMov ?? 0)} avarias</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
                <span className="text-slate-400 block text-[10px]">3. Vales & Reposição</span>
                <span className="font-bold text-white">{(stats?.totalVales ?? stats?.totalReposicao ?? 0)} itens</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
                <span className="text-slate-400 block text-[10px]">4. Perdas Mercadoria</span>
                <span className="font-bold text-white">{(stats?.totalPerdasPor ?? 0)} SKUs</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
                <span className="text-slate-400 block text-[10px]">5. Trocas Impróprios</span>
                <span className="font-bold text-white">{(stats?.totalTrocasImproprio ?? stats?.totalTrocaPlanilha ?? trocasImproprio.length)} trocas</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
                <span className="text-slate-400 block text-[10px]">6. Inventário & 5W2H</span>
                <span className="font-bold text-white">{(stats?.totalPlanosAcao ?? acoes.length)} planos</span>
              </div>
            </div>
          </div>

          {/* Backup Recommendation Box */}
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-sky-400 shrink-0" />
              <div>
                <span className="font-bold text-slate-200 block text-xs">
                  Recomendação: Baixe um backup de segurança
                </span>
                <span className="text-[10px] text-slate-400">
                  Gera um arquivo .json para você restaurar quando quiser
                </span>
              </div>
            </div>
            <button
              onClick={handleDownloadBackup}
              disabled={loadingAction !== null}
              className="px-2.5 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
            >
              {loadingAction === 'backup' ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>Baixar Backup</span>
            </button>
          </div>

          {/* Confirmation Checkbox */}
          <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-red-950/20 border border-red-900/40 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={confirmedCheck}
              onChange={(e) => setConfirmedCheck(e.target.checked)}
              className="mt-0.5 rounded border-slate-700 text-red-600 focus:ring-red-500 cursor-pointer h-4 w-4"
            />
            <span className="text-xs text-slate-200 font-medium">
              Estou ciente de que esta ação limpará todos os dados e tabelas da plataforma.
            </span>
          </label>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/70 flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
          {/* Secondary Alternative: Restaurar Demo */}
          <button
            onClick={handleResetToDemo}
            disabled={loadingAction !== null}
            className="w-full sm:w-auto px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:border-slate-600 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            title="Recarrega a base de dados de demonstração inicial"
          >
            {loadingAction === 'reset' ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
            ) : (
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>Restaurar Dados Demo</span>
          </button>

          {/* Right Buttons: Cancelar + Confirmar Limpeza */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              disabled={loadingAction !== null}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              onClick={handleClearAll}
              disabled={!confirmedCheck || loadingAction !== null}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-lg cursor-pointer ${
                confirmedCheck && loadingAction === null
                  ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-950/50 hover:scale-[1.02]'
                  : 'bg-red-950/40 text-red-400/50 border border-red-900/30 cursor-not-allowed'
              }`}
            >
              {loadingAction === 'clear' ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              <span>Limpar Toda a Plataforma</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
