/**
 * APLICACIÓN PRINCIPAL
 * Navegación lateral, carga de datos y renderizado bajo demanda de cada gráfico.
 */
(function () {
  "use strict";

  const TAB_KEYS = ["interes", "iniciaciones", "lanzamientos", "ventas", "oferta"];
  const CHART_KEYS = ["iniciaciones", "lanzamientos", "ventas", "oferta"];
  const TAB_LABELS = {
    iniciaciones: "Iniciaciones",
    lanzamientos: "Lanzamientos",
    ventas: "Ventas",
    oferta: "Oferta"
  };
  let portalData = null;
  const renderedCharts = new Set();

  function activateTab(tabKey) {
    document.querySelectorAll(".tab-button").forEach(button => {
      const active = button.dataset.tab === tabKey;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", String(active));
    });
    TAB_KEYS.forEach(key => {
      const panel = document.getElementById(`tab-${key}`);
      if (!panel) return;
      const active = key === tabKey;
      panel.classList.toggle("active", active);
      panel.hidden = !active;
    });

    // Se crea cada gráfica cuando su panel ya está visible.
    if (portalData && CHART_KEYS.includes(tabKey) && !renderedCharts.has(tabKey)) {
      window.PortalCharts.renderChart(tabKey, portalData[tabKey]);
      renderedCharts.add(tabKey);
    }
  }

  function setupPortalLinks() {
    const ipcPortal = (window.PORTALS || []).find(portal => portal.id === "ipc");
    const link = document.getElementById("ipc-portal-link");
    if (ipcPortal && link) {
      link.href = ipcPortal.url;
      link.textContent = `Consultar ${ipcPortal.title} ↗`;
    }
  }

  function setupNavigation() {
    document.querySelectorAll(".tab-button").forEach(button => {
      button.addEventListener("click", () => activateTab(button.dataset.tab));
    });
  }

  function formatCutoff(date) {
    return new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric" }).format(date);
  }

  function renderComments(comments) {
    Object.keys(TAB_LABELS).forEach(key => {
      const box = document.getElementById(`comment-${key}`);
      const text = comments[key] || "";
      if (!box) return;
      box.textContent = text.trim() ? text : "";
      box.hidden = !text.trim();
    });
  }

  function setStatus(message, type = "") {
    const element = document.getElementById("status-message");
    element.textContent = message;
    element.className = `status-message ${type}`.trim();
  }

  async function init() {
    setupNavigation();
    setupPortalLinks();
    try {
      const result = await window.PortalData.loadPortalData();
      portalData = result.data;
      document.getElementById("updated-date").textContent = formatCutoff(result.cutoff);
      renderComments(result.comments);
      setStatus(
        `Datos cargados correctamente · ${result.data.lanzamientos.length} observaciones mensuales · corte ${formatCutoff(result.cutoff)}.`,
        "success"
      );
      // La primera pestaña es informativa. Los gráficos se crean al entrar a cada sección.
      activateTab("interes");
    } catch (error) {
      console.error("Error al inicializar Inteligencia Económica:", error);
      setStatus(
        `No fue posible cargar los datos. ${error.message} Comprueba que el Excel y observaciones.txt estén en la carpeta data/ y que el portal esté publicado mediante HTTPS (GitHub Pages).`,
        "error"
      );
      document.getElementById("updated-date").textContent = "Datos no disponibles";
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
