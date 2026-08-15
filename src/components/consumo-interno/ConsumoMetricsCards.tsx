import React, { useMemo } from 'react';
import { ConsumoInternoItem, ConsumoMetrics } from '../../types/consumoInterno';
import { formatCurrency } from '../../utils/formatters';
import { DollarSign, FolderTree, Calendar, Tag, TrendingUp, AlertTriangle } from 'lucide-react';

interface ConsumoMetricsCardsProps {
  metrics: ConsumoMetrics;
  data?: ConsumoInternoItem[];
}

export const ConsumoMetricsCards: React.FC<ConsumoMetricsCardsProps> = ({ metrics, data = [] }) => {
  // Computed analytical insights for the cards
  const analytics = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        categoriaDominante: { nome: 'N/A', valor: 0, percentual: 0, itens: 0 },
        mesCritico: { nome: 'N/A', valor: 0, percentual: 0 },
        topProduto: { descricao: 'N/A', valor: 0, qtde: 0, percentual: 0, sku: 0 },
        dataMinima: '-',
        dataMaxima: '-',
      };
    }

    const totalGasto = metrics.totalGasto || data.reduce((acc, it) => acc + (it.total || 0), 0);

    // 1. Categoria Dominante
    const catMap: { [key: string]: { valor: number; itens: number } } = {};
    // 2. Mês Mais Crítico
    const mesMap: { [key: string]: number } = {};
    // 3. Produto Mais Consumido
    const prodMap: { [key: string]: { descricao: string; valor: number; qtde: number; sku: number } } = {};

    let minDate = '';
    let maxDate = '';

    data.forEach((item) => {
      const val = item.total || 0;
      const qtde = item.qtde || 0;
      const cat = item.categoria || 'Outros';
      const dt = item.dtOperacao || item.dataOperacao || '';

      // Date range
      if (dt) {
        if (!minDate || dt < minDate) minDate = dt;
        if (!maxDate || dt > maxDate) maxDate = dt;
      }

      // Categoria
      if (!catMap[cat]) catMap[cat] = { valor: 0, itens: 0 };
      catMap[cat].valor += val;
      catMap[cat].itens += 1;

      // Mês
      if (dt) {
        const mesKey = dt.slice(0, 7); // YYYY-MM
        mesMap[mesKey] = (mesMap[mesKey] || 0) + val;
      }

      // Produto
      const prodKey = String(item.produtoId || item.descricao);
      if (!prodMap[prodKey]) {
        prodMap[prodKey] = {
          descricao: item.descricao || `Produto ${item.produtoId}`,
          valor: 0,
          qtde: 0,
          sku: item.produtoId || 0,
        };
      }
      prodMap[prodKey].valor += val;
      prodMap[prodKey].qtde += qtde;
    });

    // Sort Categoria
    const sortedCats = Object.entries(catMap).sort((a, b) => b[1].valor - a[1].valor);
    const topCat = sortedCats[0]
      ? {
          nome: sortedCats[0][0],
          valor: sortedCats[0][1].valor,
          itens: sortedCats[0][1].itens,
          percentual: totalGasto > 0 ? (sortedCats[0][1].valor / totalGasto) * 100 : 0,
        }
      : { nome: 'N/A', valor: 0, percentual: 0, itens: 0 };

    // Sort Mês
    const mesesNomes = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
    ];
    const sortedMeses = Object.entries(mesMap).sort((a, b) => b[1] - a[1]);
    let topMesFormatted = 'N/A';
    let topMesValor = 0;
    let topMesPerc = 0;

    if (sortedMeses[0]) {
      const [mesKey, val] = sortedMeses[0];
      const [ano, mesNum] = mesKey.split('-');
      const nomeMes = mesesNomes[parseInt(mesNum, 10) - 1] || mesKey;
      topMesFormatted = `${nomeMes}/${ano}`;
      topMesValor = val;
      topMesPerc = totalGasto > 0 ? (val / totalGasto) * 100 : 0;
    }

    // Sort Produto
    const sortedProds = Object.values(prodMap).sort((a, b) => b.valor - a.valor);
    const topProd = sortedProds[0]
      ? {
          descricao: sortedProds[0].descricao,
          valor: sortedProds[0].valor,
          qtde: sortedProds[0].qtde,
          sku: sortedProds[0].sku,
          percentual: totalGasto > 0 ? (sortedProds[0].valor / totalGasto) * 100 : 0,
        }
      : { descricao: 'N/A', valor: 0, qtde: 0, percentual: 0, sku: 0 };

    const formatDateBR = (d: string) => {
      if (!d) return '-';
      const parts = d.split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
      return d;
    };

    return {
      categoriaDominante: topCat,
      mesCritico: { nome: topMesFormatted, valor: topMesValor, percentual: topMesPerc },
      topProduto: topProd,
      dataMinima: formatDateBR(minDate),
      dataMaxima: formatDateBR(maxDate),
    };
  }, [data, metrics.totalGasto]);

  const ticketMedioPorLinha =
    metrics.numRegistros > 0 ? metrics.totalGasto / metrics.numRegistros : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. TOTAL GASTO CONSUMO (Mantido conforme solicitado) */}
      <div
        id="card-consumo-total-gasto"
        className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4.5 shadow-xl relative overflow-hidden group hover:border-amber-500/40 transition-all flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Gasto Consumo
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono tracking-tight">
              {formatCurrency(metrics.totalGasto)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400 font-medium">
              <span>Ticket Médio / Linha:</span>
              <span className="font-mono font-bold text-amber-300">
                {formatCurrency(ticketMedioPorLinha)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            100% interno
          </span>
          <span className="font-mono text-slate-300">
            {metrics.numRegistros} itens • {metrics.unidadesTotais} un
          </span>
        </div>
      </div>

      {/* 2. CATEGORIA DOMINANTE */}
      <div
        id="card-consumo-categoria-dominante"
        className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4.5 shadow-xl relative overflow-hidden group hover:border-sky-500/40 transition-all flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Categoria Principal
            </span>
            <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <FolderTree className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div
              className="text-2xl sm:text-3xl font-black text-sky-400 truncate"
              title={analytics.categoriaDominante.nome}
            >
              {analytics.categoriaDominante.nome}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400 font-medium">
              <span>Gasto na Categoria:</span>
              <span className="font-mono font-bold text-slate-200">
                {formatCurrency(analytics.categoriaDominante.valor)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span>Participação:</span>
          <span className="font-mono text-sky-400 font-bold">
            {analytics.categoriaDominante.percentual.toFixed(1)}% do total
          </span>
        </div>
      </div>

      {/* 3. MÊS MAIS CRÍTICO / PICO */}
      <div
        id="card-consumo-mes-critico"
        className="bg-slate-900/90 border border-rose-900/40 rounded-2xl p-4.5 shadow-xl relative overflow-hidden group hover:border-rose-500/60 transition-all flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block mr-0.5" />
              Mês Mais Crítico
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div
              className="text-2xl sm:text-3xl font-black text-rose-400 truncate"
              title={analytics.mesCritico.nome}
            >
              {analytics.mesCritico.nome}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400 font-medium">
              <span>Gasto no Mês:</span>
              <span className="font-mono font-bold text-slate-200">
                {formatCurrency(analytics.mesCritico.valor)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span className="text-rose-400/90 font-medium flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            Pico de Consumo
          </span>
          <span className="font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
            {analytics.mesCritico.percentual.toFixed(1)}% do total
          </span>
        </div>
      </div>

      {/* 4. PRODUTO MAIS CONSUMIDO / TOP SKU */}
      <div
        id="card-consumo-top-produto"
        className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4.5 shadow-xl relative overflow-hidden group hover:border-emerald-500/40 transition-all flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Produto Mais Consumido
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div
              className="text-lg sm:text-xl font-black text-emerald-400 truncate leading-tight mt-0.5"
              title={analytics.topProduto.descricao}
            >
              {analytics.topProduto.descricao}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400 font-medium">
              <span>Valor Total:</span>
              <span className="font-mono font-bold text-slate-200">
                {formatCurrency(analytics.topProduto.valor)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span className="font-mono text-slate-400">
            {analytics.topProduto.qtde} un requisitadas
          </span>
          <span className="font-mono text-emerald-400 font-bold">
            {analytics.topProduto.percentual.toFixed(1)}% do total
          </span>
        </div>
      </div>
    </div>
  );
};

