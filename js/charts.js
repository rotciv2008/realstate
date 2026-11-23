/**
 * GRÁFICOS DEL PORTAL DE VIVIENDA
 * VIS y No VIS se dibujan como bandas apiladas mediante relleno entre series.
 * El eje Y queda SIN apilamiento global para que Bogotá y el total conserven
 * sus valores reales y no se sumen visualmente a las áreas.
 */
(function () {
  "use strict";

  const COLORS = {
    vis: "#3B1D2A",
    noVis: "#C5A3AE",
    total: "#2A2A2E",
    bogota: "#8D99AE",
    rate: "#A58BD9"
  };

  const SERIES = [
    { key: "vis", label: "VIS · 19 regionales", color: COLORS.vis },
    { key: "noVis", label: "No VIS · 19 regionales", color: COLORS.noVis },
    { key: "total", label: "Total · 19 regionales", color: COLORS.total },
    { key: "bogota", label: "Bogotá & Cundinamarca · Total", color: COLORS.bogota },
    { key: "rate", label: "Tasa de interés", color: COLORS.rate }
  ];

  const charts = new Map();
  const sourceRows = new Map();
  const windows = new Map();

  function shortMonth(date) {
    return new Intl.DateTimeFormat("es-CO", { month: "short", year: "2-digit" }).format(date);
  }
  function monthYear(date) {
    return new Intl.DateTimeFormat("es-CO", { month: "short", year: "numeric" }).format(date);
  }
  function formatUnits(value) {
    return new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(value);
  }

  function makeDatasets(rows) {
    const vis = rows.map(r => r.vis);
    const noVis = rows.map((r, i) => (r.vis ?? 0) + (r.noVis ?? 0));
    return [
      {
        label: "VIS · 19 regionales", key: "vis", data: vis, yAxisID: "y",
        borderColor: COLORS.vis, backgroundColor: COLORS.vis,
        pointRadius: 0, pointHoverRadius: 3, borderWidth: 1.2,
        fill: "origin", tension: 0, order: 5
      },
      {
        label: "No VIS · 19 regionales", key: "noVis", data: noVis, yAxisID: "y",
        borderColor: COLORS.noVis, backgroundColor: COLORS.noVis,
        pointRadius: 0, pointHoverRadius: 3, borderWidth: 1.2,
        fill: "-1", tension: 0, order: 4
      },
      {
        label: "Total · 19 regionales", key: "total", data: rows.map(r => r.total), yAxisID: "y",
        borderColor: COLORS.total, backgroundColor: COLORS.total,
        pointRadius: 1, pointHoverRadius: 4, pointBackgroundColor: COLORS.total,
        borderWidth: 1.8, fill: false, tension: 0, order: 1
      },
      {
        label: "Bogotá & Cundinamarca · Total", key: "bogota", data: rows.map(r => r.bogota), yAxisID: "y",
        borderColor: COLORS.bogota, backgroundColor: COLORS.bogota,
        pointRadius: 0, pointHoverRadius: 4, borderWidth: 2, fill: false,
        tension: 0, order: 2
      },
      {
        label: "Tasa de interés", key: "rate", data: rows.map(r => r.rate), yAxisID: "y1",
        borderColor: COLORS.rate, backgroundColor: COLORS.rate,
        pointRadius: 0, pointHoverRadius: 4, borderWidth: 2, fill: false,
        tension: 0, spanGaps: true, order: 0
      }
    ];
  }

  function buildControls(portalKey, chart) {
    const container = document.querySelector(`[data-controls="${portalKey}"]`);
    if (!container) return;
    container.innerHTML = "";
    SERIES.forEach((series, index) => {
      const label = document.createElement("label");
      label.className = "series-toggle";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = true;
      checkbox.setAttribute("aria-label", `Mostrar ${series.label}`);
      checkbox.addEventListener("change", () => {
        chart.setDatasetVisibility(index, checkbox.checked);
        chart.update();
      });
      const swatch = document.createElement("span");
      swatch.className = "legend-swatch";
      swatch.style.background = series.color;
      label.append(checkbox, swatch, document.createTextNode(series.label));
      container.appendChild(label);
    });
  }

  function updateChartWindow(portalKey, startIndex, endIndex) {
    const rows = sourceRows.get(portalKey);
    const chart = charts.get(portalKey);
    if (!rows || !chart) return;

    const start = Math.max(0, Math.min(startIndex, rows.length - 1));
    const end = Math.max(start, Math.min(endIndex, rows.length - 1));
    windows.set(portalKey, { start, end });
    const selected = rows.slice(start, end + 1);
    chart.data.labels = selected.map(r => shortMonth(r.date));
    chart.data.datasets = makeDatasets(selected);
    chart.update("none");

    const startLabel = document.querySelector(`[data-range-start-label="${portalKey}"]`);
    const endLabel = document.querySelector(`[data-range-end-label="${portalKey}"]`);
    if (startLabel) startLabel.textContent = monthYear(rows[start].date);
    if (endLabel) endLabel.textContent = monthYear(rows[end].date);
  }

  function buildDateRange(portalKey, rows) {
    const startInput = document.querySelector(`[data-range-start="${portalKey}"]`);
    const endInput = document.querySelector(`[data-range-end="${portalKey}"]`);
    if (!startInput || !endInput || !rows.length) return;

    const last = rows.length - 1;
    [startInput, endInput].forEach(input => {
      input.min = "0";
      input.max = String(last);
      input.step = "1";
    });
    startInput.value = "0";
    endInput.value = String(last);

    const sync = (changed) => {
      let start = Number(startInput.value);
      let end = Number(endInput.value);
      if (start > end) {
        if (changed === "start") end = start;
        else start = end;
        startInput.value = String(start);
        endInput.value = String(end);
      }
      updateChartWindow(portalKey, start, end);
    };
    startInput.oninput = () => sync("start");
    endInput.oninput = () => sync("end");
    updateChartWindow(portalKey, 0, last);
  }

  function renderChart(portalKey, rows) {
    const canvas = document.getElementById(`chart-${portalKey}`);
    if (!canvas) throw new Error(`No se encontró el lienzo del gráfico: ${portalKey}.`);
    if (!window.Chart) throw new Error("No se pudo cargar Chart.js desde el CDN.");
    if (!rows || !rows.length) throw new Error(`No hay observaciones para el gráfico ${portalKey}.`);

    if (charts.has(portalKey)) charts.get(portalKey).destroy();
    sourceRows.set(portalKey, rows);
    const chart = new Chart(canvas, {
      type: "line",
      data: { labels: [], datasets: makeDatasets(rows) },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#0f2338",
            padding: 12,
            callbacks: {
              title(items) {
                const selected = sourceRows.get(portalKey);
                const windowState = windows.get(portalKey) || { start: 0, end: selected.length - 1 };
                return monthYear(selected[windowState.start + items[0].dataIndex].date);
              },
              label(context) {
                const rowSet = sourceRows.get(portalKey);
                const state = windows.get(portalKey) || { start: 0, end: rowSet.length - 1 };
                const row = rowSet[state.start + context.dataIndex];
                const key = context.dataset.key;
                const value = key === "noVis" ? row.noVis : row[key];
                if (value === null || value === undefined) return `${context.dataset.label}: sin dato`;
                return key === "rate"
                  ? `${context.dataset.label}: ${value.toLocaleString("es-CO", { maximumFractionDigits: 2 })}%`
                  : `${context.dataset.label}: ${formatUnits(value)} unidades`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: "#667789", maxTicksLimit: 18, minRotation: 90, maxRotation: 90, autoSkip: true },
            title: { display: true, text: "Mes de observación", color: "#667789", font: { size: 11, weight: "600" } }
          },
          y: {
            type: "linear", position: "left", stacked: false, beginAtZero: true,
            grid: { color: "rgba(20,47,79,.08)" },
            ticks: { color: "#536579", callback: value => formatUnits(value) },
            title: { display: true, text: "Unidades de vivienda", color: "#536579", font: { size: 11, weight: "600" } }
          },
          y1: {
            type: "linear", position: "right", beginAtZero: false,
            grid: { drawOnChartArea: false },
            ticks: { color: COLORS.rate, callback: value => `${value}%` },
            title: { display: true, text: "Tasa de interés (%)", color: COLORS.rate, font: { size: 11, weight: "700" } }
          }
        }
      }
    });
    charts.set(portalKey, chart);
    buildControls(portalKey, chart);
    buildDateRange(portalKey, rows);
  }

  window.PortalCharts = { renderChart };
})();
