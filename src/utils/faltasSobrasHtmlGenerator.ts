import { InventarioFaltasSobrasData } from '../data/mockFaltasSobras';

export function gerarHtmlAutocontido(data: InventarioFaltasSobrasData): string {
  const jsonDataString = JSON.stringify(data, null, 2);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Dashboard de Faltas & Sobras — Estoque de Produto Acabado</title>
  <!-- Chart.js via CDN cdnjs -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js"></script>
  <style>
    :root {
      --bg-main: #020617;
      --bg-panel: #0f172a;
      --bg-card-hover: #1e293b;
      --border-color: #1e293b;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --gold-amber: #f59e0b;
      --gold-amber-dark: #b45309;
      --gold-amber-bg: rgba(245, 158, 11, 0.12);
      --red-falta: #ef4444;
      --green-sobra: #22c55e;
      --blue-neutral: #3b82f6;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Segoe UI', Arial, -apple-system, BlinkMacSystemFont, sans-serif;
    }

    body {
      background-color: var(--bg-main);
      color: var(--text-main);
      min-height: 100vh;
      padding: 24px;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    /* Header */
    header {
      background-color: var(--bg-panel);
      border: 1px solid var(--border-color);
      border-radius: 14px;
      padding: 20px 24px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.3);
    }

    .header-left h1 {
      font-size: 22px;
      font-weight: 700;
      color: var(--text-main);
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .header-left p {
      font-size: 13px;
      color: var(--text-muted);
      margin-top: 4px;
    }

    .badge-periodo {
      background: var(--gold-amber-bg);
      color: var(--gold-amber);
      border: 1px solid rgba(245, 158, 11, 0.3);
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    /* KPI Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
      gap: 16px;
    }

    .kpi-card {
      background-color: var(--bg-panel);
      border: 1px solid var(--border-color);
      border-radius: 14px;
      padding: 18px 20px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.25);
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: transform 0.2s, background-color 0.2s;
    }

    .kpi-card:hover {
      background-color: var(--bg-card-hover);
      transform: translateY(-2px);
    }

    .kpi-card::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 5px;
    }

    .kpi-card.accent-gold::before { background-color: var(--gold-amber); }
    .kpi-card.accent-red::before { background-color: var(--red-falta); }
    .kpi-card.accent-green::before { background-color: var(--green-sobra); }
    .kpi-card.accent-blue::before { background-color: var(--blue-neutral); }
    .kpi-card.accent-cyan::before { background-color: #06b6d4; }

    .kpi-title {
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.5px;
      color: var(--text-muted);
      margin-bottom: 8px;
    }

    .kpi-value {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin-bottom: 8px;
    }

    .kpi-value.gold { color: var(--gold-amber); }
    .kpi-value.red { color: var(--red-falta); }
    .kpi-value.green { color: var(--green-sobra); }
    .kpi-value.blue { color: var(--blue-neutral); }
    .kpi-value.white { color: #ffffff; }

    .kpi-footer {
      font-size: 12px;
      color: var(--text-muted);
      border-top: 1px solid rgba(255,255,255,0.06);
      padding-top: 8px;
      margin-top: 4px;
    }

    /* Charts Row */
    .charts-row-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    @media (max-width: 900px) {
      .charts-row-2 {
        grid-template-columns: 1fr;
      }
    }

    .chart-panel {
      background-color: var(--bg-panel);
      border: 1px solid var(--border-color);
      border-radius: 14px;
      padding: 20px;
      box-shadow: 0 4px 14px rgba(0,0,0,0.25);
    }

    .chart-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    .chart-header h3 {
      font-size: 15px;
      font-weight: 700;
      color: var(--text-main);
    }

    .chart-header span {
      font-size: 12px;
      color: var(--text-muted);
    }

    .chart-container {
      position: relative;
      height: 280px;
      width: 100%;
    }

    .chart-container-horizontal {
      position: relative;
      height: 380px;
      width: 100%;
    }

    /* Tabs & Table */
    .table-panel {
      background-color: var(--bg-panel);
      border: 1px solid var(--border-color);
      border-radius: 14px;
      padding: 20px;
      box-shadow: 0 4px 14px rgba(0,0,0,0.25);
    }

    .table-tabs {
      display: flex;
      gap: 12px;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 14px;
      margin-bottom: 16px;
    }

    .tab-btn {
      background: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-muted);
      padding: 8px 18px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
    }

    .tab-btn:hover {
      background-color: rgba(255,255,255,0.05);
      color: var(--text-main);
    }

    .tab-btn.active.tab-falta {
      background-color: rgba(239, 68, 68, 0.15);
      border-color: var(--red-falta);
      color: #fca5a5;
    }

    .tab-btn.active.tab-sobra {
      background-color: rgba(34, 197, 94, 0.15);
      border-color: var(--green-sobra);
      color: #86efac;
    }

    .badge-count {
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 800;
    }

    .tab-falta .badge-count {
      background: rgba(239, 68, 68, 0.25);
      color: #fca5a5;
    }

    .tab-sobra .badge-count {
      background: rgba(34, 197, 94, 0.25);
      color: #86efac;
    }

    .table-wrapper {
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }

    th {
      text-align: left;
      padding: 12px 14px;
      background-color: rgba(0,0,0,0.25);
      color: var(--text-muted);
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid var(--border-color);
    }

    th.text-right, td.text-right {
      text-align: right;
    }

    th.text-center, td.text-center {
      text-align: center;
    }

    td {
      padding: 12px 14px;
      border-bottom: 1px solid rgba(255,255,255,0.04);
      color: var(--text-main);
    }

    tr:hover td {
      background-color: rgba(255,255,255,0.03);
    }

    .prod-title {
      font-weight: 700;
      color: #ffffff;
      font-size: 13px;
    }

    .prod-group-tag {
      display: inline-block;
      margin-top: 4px;
      padding: 2px 8px;
      background: rgba(255,255,255,0.06);
      border-radius: 6px;
      font-size: 10px;
      color: var(--text-muted);
      font-weight: 600;
      text-transform: uppercase;
    }

    .val-falta {
      color: var(--red-falta);
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }

    .val-sobra {
      color: var(--green-sobra);
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }

    .val-neutral {
      color: var(--text-main);
      font-variant-numeric: tabular-nums;
    }

    /* Footer */
    footer {
      text-align: center;
      padding: 16px;
      color: var(--text-muted);
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- 1. Header -->
    <header>
      <div class="header-left">
        <h1>
          <span>📦</span>
          Dashboard de Faltas & Sobras — Estoque de Produto Acabado
        </h1>
        <p id="headerSubtitle">
          Carregando dados...
        </p>
      </div>
      <div>
        <span class="badge-periodo" id="badgePeriodo">MARÇO 2026</span>
      </div>
    </header>

    <!-- 2. Cards de KPI -->
    <div class="kpi-grid">
      <!-- 1. Total Estoque -->
      <div class="kpi-card accent-gold">
        <div>
          <div class="kpi-title">Valor Total do Estoque</div>
          <div class="kpi-value gold" id="kpiTotalEstoque">R$ 0,00</div>
        </div>
        <div class="kpi-footer" id="kpiTotalItensFooter">Total de Itens Auditados: 0</div>
      </div>

      <!-- 2. Diferença Líquida -->
      <div class="kpi-card" id="cardDiferencaLiquida">
        <div>
          <div class="kpi-title">Diferença Líquida</div>
          <div class="kpi-value" id="kpiDiferencaLiquida">R$ 0,00</div>
        </div>
        <div class="kpi-footer" id="kpiDiferencaFooter">Saldo geral de divergência</div>
      </div>

      <!-- 3. Itens em Falta -->
      <div class="kpi-card accent-red">
        <div>
          <div class="kpi-title">Itens em Falta</div>
          <div class="kpi-value red" id="kpiItensFalta">0</div>
        </div>
        <div class="kpi-footer">
          Impacto: <strong class="val-falta" id="kpiValorFalta">R$ 0,00</strong>
        </div>
      </div>

      <!-- 4. Itens em Sobra -->
      <div class="kpi-card accent-green">
        <div>
          <div class="kpi-title">Itens em Sobra</div>
          <div class="kpi-value green" id="kpiItensSobra">0</div>
        </div>
        <div class="kpi-footer">
          Impacto: <strong class="val-sobra" id="kpiValorSobra">R$ 0,00</strong>
        </div>
      </div>

      <!-- 5. Itens OK -->
      <div class="kpi-card accent-blue">
        <div>
          <div class="kpi-title">Itens 100% Acurados (OK)</div>
          <div class="kpi-value blue" id="kpiItensOk">0</div>
        </div>
        <div class="kpi-footer" id="kpiAcuracidadeFooter">
          Acuracidade de Itens: <strong>0%</strong>
        </div>
      </div>
    </div>

    <!-- 3. Dois gráficos lado a lado -->
    <div class="charts-row-2">
      <!-- Barras: Falta vs Sobra -->
      <div class="chart-panel">
        <div class="chart-header">
          <h3>Impacto Financeiro: Falta vs Sobra</h3>
          <span>Valores Absolutos (R$)</span>
        </div>
        <div class="chart-container">
          <canvas id="chartFaltaVsSobra"></canvas>
        </div>
      </div>

      <!-- Rosca: Status de Itens -->
      <div class="chart-panel">
        <div class="chart-header">
          <h3>Distribuição de Itens por Status</h3>
          <span>Proporção de SKUs</span>
        </div>
        <div class="chart-container">
          <canvas id="chartStatusRosca"></canvas>
        </div>
      </div>
    </div>

    <!-- 4. Gráfico Horizontal por Grupo -->
    <div class="chart-panel">
      <div class="chart-header">
        <h3>Impacto por Grupo de Produto (R$ Diferença)</h3>
        <span>Barras Vermelhas (Falta) / Barras Verdes (Sobra)</span>
      </div>
      <div class="chart-container-horizontal">
        <canvas id="chartGrupos"></canvas>
      </div>
    </div>

    <!-- 5. Tabela com Abas (Maiores Faltas / Maiores Sobras) -->
    <div class="table-panel">
      <div class="table-tabs">
        <button class="tab-btn active tab-falta" id="btnTabFaltas" onclick="setTab('faltas')">
          <span>📉</span>
          Maiores Faltas
          <span class="badge-count" id="badgeCountFaltas">0</span>
        </button>
        <button class="tab-btn tab-sobra" id="btnTabSobras" onclick="setTab('sobras')">
          <span>📈</span>
          Maiores Sobras
          <span class="badge-count" id="badgeCountSobras">0</span>
        </button>
      </div>

      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th style="width: 35%;">Produto & Grupo</th>
              <th class="text-right">Físico</th>
              <th class="text-right">Disponível</th>
              <th class="text-right">Diferença (Qtd)</th>
              <th class="text-right">Valor Diferença (R$)</th>
              <th class="text-right">% Diferença</th>
              <th class="text-right">Estoque Total</th>
            </tr>
          </thead>
          <tbody id="tableBody">
            <!-- Renderizado via JS -->
          </tbody>
        </table>
      </div>
    </div>

    <footer>
      Distribuidora de Bebidas Ambev — Sistema de Gestão de Perdas & Inventário de Produto Acabado
    </footer>
  </div>

  <script>
    // DADOS EMBUTIDOS (Extraídos do inventário)
    const inventarioData = ${jsonDataString};

    // Formatadores
    function formatBRL(val) {
      return Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    function formatNumber(val, decimals = 0) {
      return Number(val || 0).toLocaleString('pt-BR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    }

    // Variáveis Globais de Gráficos
    let chartFaltaSobraInstance = null;
    let chartRoscaInstance = null;
    let chartGruposInstance = null;
    let activeTab = 'faltas';

    function initDashboard() {
      // 1. Header
      document.getElementById('badgePeriodo').innerText = inventarioData.periodo || 'MARÇO 2026';
      document.getElementById('headerSubtitle').innerText = 
        (inventarioData.unidade || 'CDD AMBEV') + ' • ' +
        (inventarioData.total_itens || 0) + ' itens no inventário • ' +
        'Estoque Total: ' + formatBRL(inventarioData.total_estoque);

      // 2. KPIs
      document.getElementById('kpiTotalEstoque').innerText = formatBRL(inventarioData.total_estoque);
      document.getElementById('kpiTotalItensFooter').innerText = 'Total de Itens Auditados: ' + (inventarioData.total_itens || 0);

      const difCard = document.getElementById('cardDiferencaLiquida');
      const difElem = document.getElementById('kpiDiferencaLiquida');
      const difVal = inventarioData.total_diferenca || 0;
      difElem.innerText = formatBRL(difVal);

      if (difVal < 0) {
        difCard.className = 'kpi-card accent-red';
        difElem.className = 'kpi-value red';
      } else if (difVal > 0) {
        difCard.className = 'kpi-card accent-green';
        difElem.className = 'kpi-value green';
      } else {
        difCard.className = 'kpi-card accent-blue';
        difElem.className = 'kpi-value blue';
      }

      document.getElementById('kpiItensFalta').innerText = inventarioData.itens_falta || 0;
      document.getElementById('kpiValorFalta').innerText = formatBRL(inventarioData.valor_falta);

      document.getElementById('kpiItensSobra').innerText = inventarioData.itens_sobra || 0;
      document.getElementById('kpiValorSobra').innerText = formatBRL(inventarioData.valor_sobra);

      document.getElementById('kpiItensOk').innerText = inventarioData.itens_ok || 0;
      const pctOk = inventarioData.total_itens > 0
        ? ((inventarioData.itens_ok / inventarioData.total_itens) * 100).toFixed(1)
        : 0;
      document.getElementById('kpiAcuracidadeFooter').innerHTML = 'Acuracidade de Itens: <strong>' + pctOk + '%</strong>';

      document.getElementById('badgeCountFaltas').innerText = (inventarioData.top_faltas || []).length;
      document.getElementById('badgeCountSobras').innerText = (inventarioData.top_sobras || []).length;

      // 3. Renderizar Gráficos
      renderChartFaltaVsSobra();
      renderChartRosca();
      renderChartGrupos();

      // 4. Renderizar Tabela
      renderTable();
    }

    function renderChartFaltaVsSobra() {
      const ctx = document.getElementById('chartFaltaVsSobra').getContext('2d');
      if (chartFaltaSobraInstance) chartFaltaSobraInstance.destroy();

      const absFalta = Math.abs(inventarioData.valor_falta || 0);
      const absSobra = Math.abs(inventarioData.valor_sobra || 0);

      chartFaltaSobraInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Faltas (Perdas)', 'Sobras (Excedentes)'],
          datasets: [{
            label: 'Valor Total (R$)',
            data: [absFalta, absSobra],
            backgroundColor: ['#ef4444', '#22c55e'],
            borderRadius: 8,
            borderSkipped: false,
            barThickness: 45
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return ' ' + formatBRL(context.raw);
                }
              }
            }
          },
          scales: {
            x: {
              grid: { color: 'rgba(255,255,255,0.05)' },
              ticks: { color: '#8b949e', font: { weight: 'bold' } }
            },
            y: {
              grid: { color: 'rgba(255,255,255,0.05)' },
              ticks: {
                color: '#8b949e',
                callback: function(value) { return 'R$ ' + (value >= 1000 ? (value/1000).toFixed(0) + 'k' : value); }
              }
            }
          }
        }
      });
    }

    function renderChartRosca() {
      const ctx = document.getElementById('chartStatusRosca').getContext('2d');
      if (chartRoscaInstance) chartRoscaInstance.destroy();

      const falta = inventarioData.itens_falta || 0;
      const sobra = inventarioData.itens_sobra || 0;
      const ok = inventarioData.itens_ok || 0;

      chartRoscaInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Itens OK (Acurados)', 'Itens em Falta', 'Itens em Sobra'],
          datasets: [{
            data: [ok, falta, sobra],
            backgroundColor: ['#3b82f6', '#ef4444', '#22c55e'],
            borderColor: '#171a21',
            borderWidth: 3,
            hoverOffset: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '68%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: '#eef0f4',
                padding: 16,
                usePointStyle: true,
                font: { size: 12, weight: 'bold' }
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const total = ok + falta + sobra;
                  const pct = total > 0 ? ((context.raw / total) * 100).toFixed(1) : 0;
                  return ' ' + context.label + ': ' + context.raw + ' SKUs (' + pct + '%)';
                }
              }
            }
          }
        }
      });
    }

    function renderChartGrupos() {
      const ctx = document.getElementById('chartGrupos').getContext('2d');
      if (chartGruposInstance) chartGruposInstance.destroy();

      // Ordenar grupos do mais negativo (falta) ao mais positivo (sobra)
      const sortedGrupos = [...(inventarioData.grupos || [])].sort((a, b) => a.valor_diferenca - b.valor_diferenca);

      const labels = sortedGrupos.map(g => g.grupo);
      const values = sortedGrupos.map(g => g.valor_diferenca);
      const bgColors = values.map(v => v < 0 ? '#ef4444' : '#22c55e');

      chartGruposInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Diferença Líquida (R$)',
            data: values,
            backgroundColor: bgColors,
            borderRadius: 6,
            barThickness: 20
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const g = sortedGrupos[context.dataIndex];
                  return [
                    ' Impacto: ' + formatBRL(context.raw),
                    ' Total de Itens: ' + g.itens + ' SKUs',
                    ' Estoque do Grupo: ' + formatBRL(g.valor_estoque)
                  ];
                }
              }
            }
          },
          scales: {
            x: {
              grid: { color: 'rgba(255,255,255,0.06)' },
              ticks: {
                color: '#8b949e',
                callback: function(value) { return 'R$ ' + value.toLocaleString('pt-BR'); }
              }
            },
            y: {
              grid: { display: false },
              ticks: { color: '#eef0f4', font: { weight: 'bold', size: 12 } }
            }
          }
        }
      });
    }

    function setTab(tab) {
      activeTab = tab;
      const btnFaltas = document.getElementById('btnTabFaltas');
      const btnSobras = document.getElementById('btnTabSobras');

      if (tab === 'faltas') {
        btnFaltas.classList.add('active');
        btnSobras.classList.remove('active');
      } else {
        btnSobras.classList.add('active');
        btnFaltas.classList.remove('active');
      }

      renderTable();
    }

    function renderTable() {
      const tbody = document.getElementById('tableBody');
      const list = activeTab === 'faltas' 
        ? (inventarioData.top_faltas || []).slice(0, 15)
        : (inventarioData.top_sobras || []).slice(0, 15);

      if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center" style="padding: 30px; color: var(--text-muted);">Nenhum item registrado nesta categoria.</td></tr>';
        return;
      }

      tbody.innerHTML = list.map((item, index) => {
        const isFalta = item.valor_diferenca < 0;
        const valClass = isFalta ? 'val-falta' : 'val-sobra';
        const qtdFormatted = (item.diferenca_qtd > 0 ? '+' : '') + formatNumber(item.diferenca_qtd, 0);
        const pctFormatted = (item.pct_diferenca > 0 ? '+' : '') + formatNumber(item.pct_diferenca, 1) + '%';

        return \`
          <tr>
            <td>
              <div class="prod-title">\${index + 1}. \${item.produto}</div>
              <span class="prod-group-tag">\${item.grupo}</span>
            </td>
            <td class="text-right val-neutral">\${formatNumber(item.fisico, 0)}</td>
            <td class="text-right val-neutral">\${formatNumber(item.disponivel, 0)}</td>
            <td class="text-right \${valClass}">\${qtdFormatted}</td>
            <td class="text-right \${valClass}">\${formatBRL(item.valor_diferenca)}</td>
            <td class="text-right \${valClass}">\${pctFormatted}</td>
            <td class="text-right val-neutral">\${formatBRL(item.valor_estoque)}</td>
          </tr>
        \`;
      }).join('');
    }

    // Inicialização ao carregar a página
    window.addEventListener('DOMContentLoaded', initDashboard);
  </script>
</body>
</html>
`;
}
