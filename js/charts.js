/**
 * GRÁFICOS
 * --------
 * Cada pestaña utiliza una gráfica combinada:
 *   - VIS: área apilada.
 *   - No VIS: área apilada.
 *   - Total 19 regionales: línea con marcadores.
 *   - Bogotá & Cundinamarca TOTAL: línea.
 *   - Tasa de interés: línea en eje derecho.
 *
 * Los controles HTML se generan a partir de la configuración para que el
 * usuario pueda activar o desactivar cualquier serie sin recalcular datos.
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

  /** Presenta mes y año en formato compacto para el eje horizontal. */
  function shortMonth(date) {
    return new Intl.DateTimeFormat("es-CO", { month: "short", year: "2-digit" }).format(date);
  }

  /** Presenta números de vivienda sin decimales y tasas con dos decimales. */
  function formatUnits(value) {
    return new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(value);
  }

  /** Crea el conjunto de datos para una pestaña. */
  function makeDatasets(rows) {
    return [
      {
        label: "VIS · 19 regionales", data: rows.map(r => r.vis), yAxisID: "y",
        borderColor: COLORS.vis, backgroundColor: "rgba(47,126,158,.48)",
        pointRadius: 0, pointHoverRadius: 4, borderWidth: 1.5, fill: true,
        stack: "vivienda", tension: .22, order: 4
      },
      {
        label: "No VIS · 19 regionales", data: rows.map(r => r.noVis), yAxisID: "y",
        borderColor: COLORS.noVis, backgroundColor: "rgba(140,169,191,.52)",
        pointRadius: 0, pointHoverRadius: 4, borderWidth: 1.5, fill: true,
        stack: "vivienda", tension: .22, order: 3
      },
      {
        label: "Total · 19 regionales", data: rows.map(r => r.total), yAxisID: "y",
        borderColor: COLORS.total, backgroundColor: COLORS.total,
        pointRadius: 2, pointHoverRadius: 5, pointBackgroundColor: COLORS.total,
        borderWidth: 2.4, fill: false, tension: .18, order: 1
      },
      {
        label: "Bogotá & Cundinamarca · Total", data: rows.map(r => r.bogota), yAxisID: "y",
        borderColor: COLORS.bogota, backgroundColor: COLORS.bogota,
        pointRadius: 0, pointHoverRadius: 4, borderWidth: 2, fill: false,
        tension: .2, spanGaps: true, order: 2
      },
      {
        label: "Tasa de interés", data: rows.map(r => r.rate), yAxisID: "y1",
        borderColor: COLORS.rate, backgroundColor: COLORS.rate,
        pointRadius: 0, pointHoverRadius: 4, borderWidth: 2, fill: false,
        tension: .2, spanGaps: true, order: 0
      }
    ];
  }

  /** Inserta controles accesibles que activan/desactivan series. */
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

  /** Construye el gráfico en el canvas de la pestaña solicitada. */
  function renderChart(portalKey, rows) {
    const canvas = document.getElementById(`chart-${portalKey}`);
    if (!canvas || !window.Chart) return;

    if (charts.has(portalKey)) charts.get(portalKey).destroy();

    const labels = rows.map(row => shortMonth(row.date));
    const chart = new Chart(canvas, {
      type: "line",
      data: { labels, datasets: makeDatasets(rows) },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#142f4f",
            padding: 12,
            callbacks: {
              title(items) {
                const row = rows[items[0].dataIndex];
                return new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric" }).format(row.date);
              },
              label(context) {
                const value = context.parsed.y;
                if (value === null || value === undefined) return `${context.dataset.label}: sin dato`;
                return context.dataset.yAxisID === "y1"
                  ? `${context.dataset.label}: ${value.toLocaleString("es-CO", { maximumFractionDigits: 2 })}%`
                  : `${context.dataset.label}: ${formatUnits(value)} unidades`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: "#667789", maxTicksLimit: 15, maxRotation: 0, autoSkip: true },
            title: { display: true, text: "Mes de observación", color: "#667789", font: { size: 11, weight: "600" } }
          },
          y: {
            type: "linear", position: "left", stacked: true, beginAtZero: true,
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
  }

  window.PortalCharts = { renderChart };
})();
