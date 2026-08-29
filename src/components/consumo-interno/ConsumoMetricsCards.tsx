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
      {/* 1. TOTAL GASTO CONSUMO */}
      <div
        id="card-consumo-total-gasto"
        className="bg-white border border-blue-200/90 hover:border-blue-500 rounded-2xl p-4 transition-all duration-200 shadow-sm hover:shadow-md shadow-blue-900/5 hover:-translate-y-0.5 group flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              Total Gasto Consumo
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center group-hover:scale-110 transition-transform">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-black text-blue-950 font-mono tracking-tight">
            {formatCurrency(metrics.totalGasto)}
          </div>
          <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500">
            <span>Ticket Médio:</span>
            <span className="font-mono font-bold text-amber-700">
              {formatCurrency(ticketMedioPorLinha)}
            </span>
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
          <span className="text-emerald-700 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            100% interno
          </span>
          <span className="font-mono text-slate-600 font-medium">
            {metrics.numRegistros} itens • {metrics.unidadesTotais} un
          </span>
        </div>
      </div>

      {/* 2. CATEGORIA DOMINANTE */}
      <div
        id="card-consumo-categoria-dominante"
        className="bg-white border border-blue-200/90 hover:border-blue-500 rounded-2xl p-4 transition-all duration-200 shadow-sm hover:shadow-md shadow-blue-900/5 hover:-translate-y-0.5 group flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              Categoria Principal
            </span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FolderTree className="w-4 h-4" />
            </div>
          </div>
          <div
            className="text-sm sm:text-base font-black text-sky-700 truncate"
            title={analytics.categoriaDominante.nome}
          >
            {analytics.categoriaDominante.nome}
          </div>
          <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500">
            <span>Gasto:</span>
            <span className="font-mono font-bold text-slate-800">
              {formatCurrency(analytics.categoriaDominante.valor)}
            </span>
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
          <span>Participação:</span>
          <span className="font-mono text-sky-700 font-bold">
            {analytics.categoriaDominante.percentual.toFixed(1)}% do total
          </span>
        </div>
      </div>

      {/* 3. MÊS MAIS CRÍTICO / PICO */}
      <div
        id="card-consumo-mes-critico"
        className="bg-white border border-blue-200/90 hover:border-blue-500 rounded-2xl p-4 transition-all duration-200 shadow-sm hover:shadow-md shadow-blue-900/5 hover:-translate-y-0.5 group flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              Mês de Pico
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div
            className="text-sm sm:text-base font-black text-rose-700 truncate"
            title={analytics.mesCritico.nome}
          >
            {analytics.mesCritico.nome}
          </div>
          <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500">
            <span>Gasto no Mês:</span>
            <span className="font-mono font-bold text-slate-800">
              {formatCurrency(analytics.mesCritico.valor)}
            </span>
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
          <span className="text-rose-600 font-medium flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-rose-500" />
            Pico de Consumo
          </span>
          <span className="font-mono px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
            {analytics.mesCritico.percentual.toFixed(1)}% do total
          </span>
        </div>
      </div>

      {/* 4. PRODUTO MAIS CONSUMIDO / TOP SKU */}
      <div
        id="card-consumo-top-produto"
        className="bg-white border border-blue-200/90 hover:border-blue-500 rounded-2xl p-4 transition-all duration-200 shadow-sm hover:shadow-md shadow-blue-900/5 hover:-translate-y-0.5 group flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              Produto Mais Consumido
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <div
            className="text-xs sm:text-sm font-black text-emerald-700 truncate"
            title={analytics.topProduto.descricao}
          >
            {analytics.topProduto.descricao}
          </div>
          <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500">
            <span>Valor Total:</span>
            <span className="font-mono font-bold text-slate-800">
              {formatCurrency(analytics.topProduto.valor)}
            </span>
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
          <span className="font-mono text-slate-600 font-medium">
            {analytics.topProduto.qtde} un
          </span>
          <span className="font-mono text-emerald-700 font-bold">
            {analytics.topProduto.percentual.toFixed(1)}% do total
          </span>
        </div>
      </div>
    </div>
  );
};

