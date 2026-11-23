/**
 * APLICACIÓN PRINCIPAL
 * --------------------
 * Coordina la navegación, carga de datos, fecha de actualización,
 * renderizado de gráficos y observaciones. Mantener aquí solo la
 * coordinación general; la lectura de Excel y los gráficos están
 * separados en data-loader.js y charts.js.
 */
(function () {
  "use strict";

  const TAB_KEYS = ["interes", "iniciaciones", "lanzamientos", "ventas", "oferta"];
  const TAB_LABELS = {
    iniciaciones: "Iniciaciones",
    lanzamientos: "Lanzamientos",
    ventas: "Ventas",
    oferta: "Oferta"
  };

  /** Cambia la pestaña visible y mantiene los atributos de accesibilidad. */
  function activateTab(tabKey) {
    document.querySelectorAll(".tab-button").forEach((button) => {
      const active = button.dataset.tab === tabKey;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", String(active));
    });

    TAB_KEYS.forEach((key) => {
      const panel = document.getElementById(`tab-${key}`);
      if (!panel) return;
      const active = key === tabKey;
      panel.classList.toggle("active", active);
      panel.hidden = !active;
    });
  }

  /**
   * Completa los enlaces externos a otros portales desde el catálogo central.
   * Así, al cambiar una URL, basta con editar js/portals.js.
   */
  function setupPortalLinks() {
    const ipcPortal = (window.PORTALS || []).find((portal) => portal.id === "ipc");
    const link = document.getElementById("ipc-portal-link");
    if (ipcPortal && link) {
      link.href = ipcPortal.url;
      link.textContent = `Consultar ${ipcPortal.title} ↗`;
    }
  }

  /** Registra los eventos de la navegación principal. */
  function setupNavigation() {
    document.querySelectorAll(".tab-button").forEach((button) => {
      button.addEventListener("click", () => activateTab(button.dataset.tab));
    });
  }

  /** Convierte fecha de corte en una etiqueta legible en español. */
  function formatCutoff(date) {
    return new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric" }).format(date);
  }

  /** Muestra u oculta cada bloque de observaciones según su contenido. */
  function renderComments(comments) {
    Object.entries(TAB_LABELS).forEach(([key, label]) => {
      const box = document.getElementById(`comment-${key}`);
      const text = comments[key] || "";
      if (!box) return;

      // textContent evita interpretar el TXT como HTML ejecutable.
      if (text.trim()) {
        box.textContent = text;
        box.hidden = false;
      } else {
        box.textContent = "";
        box.hidden = true;
      }
    });
  }

  /** Muestra un mensaje de estado sin interrumpir la interfaz. */
  function setStatus(message, type = "") {
    const element = document.getElementById("status-message");
    element.textContent = message;
    element.className = `status-message ${type}`.trim();
  }

  /** Inicia la aplicación una vez que el DOM y las librerías están disponibles. */
  async function init() {
    setupNavigation();
    setupPortalLinks();
    try {
      const result = await window.PortalData.loadPortalData();
      document.getElementById("updated-date").textContent = formatCutoff(result.cutoff);

      // Cada pestaña se dibuja con su serie mensual y el mismo corte de datos.
      ["iniciaciones", "lanzamientos", "ventas", "oferta"].forEach((key) => {
        window.PortalCharts.renderChart(key, result.data[key]);
      });

      renderComments(result.comments);
      setStatus(
        `Datos cargados correctamente · ${result.data.lanzamientos.length} observaciones mensuales · corte ${formatCutoff(result.cutoff)}.`,
        "success"
      );
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
