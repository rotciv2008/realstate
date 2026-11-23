/**
 * CARGA Y NORMALIZACIÓN DE DATOS
 * ------------------------------
 * Este módulo descarga el Excel publicado junto al sitio, lee las hojas
 * con SheetJS y transforma cada fila mensual en objetos fáciles de graficar.
 *
 * Columnas utilizadas (índice JavaScript, comenzando en cero):
 *   A  = Fecha                         -> 0
 *   V  = Bogotá & Cundinamarca TOTAL   -> 22
 *   FD = 19 Regionales VIS             -> 159
 *   FE = 19 Regionales NO VIS          -> 160
 *   FF = 19 Regionales TOTAL           -> 161
 *   Hoja "tasas de interes": A=Fecha, B=Tasa -> 0 y 1
 *
 * Si Camacol modifica la estructura del Excel, revisar primero estos índices.
 */
(function () {
  "use strict";

  const CONFIG = {
    workbookUrl: "data/Tablas_de_Coyuntura.xlsx",
    commentsUrl: "data/observaciones.txt",
    firstDataRowIndex: 6, // Fila 7 de Excel: primera observación mensual.
    columns: {
      bogotaTotal: 22,
      vis19: 159,
      noVis19: 160,
      total19: 161
    },
    sheets: {
      iniciaciones: "Iniciaciones",
      lanzamientos: "Lanzamientos",
      ventas: "Ventas",
      oferta: "Oferta",
      rates: "tasas de interes"
    }
  };

  /** Convierte fecha Excel/JavaScript/texto en una fecha válida. */
  function parseExcelDate(value) {
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
    if (typeof value === "number" && window.XLSX) {
      const parsed = XLSX.SSF.parse_date_code(value);
      if (parsed) return new Date(parsed.y, parsed.m - 1, parsed.d);
    }
    if (typeof value === "string" && value.trim()) {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }
    return null;
  }

  /** Normaliza la fecha al identificador YYYY-MM para unir las tasas. */
  function monthKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }

  /** Devuelve número o null; evita graficar celdas vacías/texto como cero. */
  function numericValue(value) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "") {
      const number = Number(value.replace(",", "."));
      return Number.isFinite(number) ? number : null;
    }
    return null;
  }

  /** Extrae la última observación con fecha válida y total numérico. */
  function readMonthlySheet(rows, sheetName) {
    const output = [];
    for (let i = CONFIG.firstDataRowIndex; i < rows.length; i += 1) {
      const row = rows[i] || [];
      const date = parseExcelDate(row[0]);
      if (!date) continue;

      const record = {
        date,
        key: monthKey(date),
        vis: numericValue(row[CONFIG.columns.vis19]),
        noVis: numericValue(row[CONFIG.columns.noVis19]),
        total: numericValue(row[CONFIG.columns.total19]),
        bogota: numericValue(row[CONFIG.columns.bogotaTotal])
      };

      // Excluye filas auxiliares, resúmenes y fechas sin total de 19 regionales.
      if (record.total !== null) output.push(record);
    }
    if (!output.length) throw new Error(`No se encontraron observaciones mensuales válidas en "${sheetName}".`);
    return output;
  }

  /** Lee tasas de interés y crea un mapa por mes para hacer el cruce temporal. */
  function readRates(rows) {
    const rates = new Map();
    for (let i = 1; i < rows.length; i += 1) {
      const row = rows[i] || [];
      const date = parseExcelDate(row[0]);
      const rate = numericValue(row[1]);
      if (date && rate !== null) rates.set(monthKey(date), rate);
    }
    return rates;
  }

  /** Convierte observaciones de un apartado a la caja correspondiente.
   *  El TXT utiliza encabezados simples: Iniciaciones, Lanzamientos, Ventas, Oferta.
   *  Solo se muestra una caja si el texto bajo el encabezado no está vacío.
   */
  async function loadComments() {
    const response = await fetch(CONFIG.commentsUrl, { cache: "no-store" });
    if (!response.ok) throw new Error(`No fue posible leer ${CONFIG.commentsUrl} (${response.status}).`);
    const text = await response.text();
    const headings = ["Iniciaciones", "Lanzamientos", "Ventas", "Oferta"];
    const comments = {};
    let current = null;

    text.split(/\r?\n/).forEach((line) => {
      const heading = headings.find((name) => line.trim().toLowerCase() === name.toLowerCase());
      if (heading) {
        current = heading.toLowerCase();
        comments[current] = [];
      } else if (current) {
        comments[current].push(line);
      }
    });

    Object.keys(comments).forEach((key) => {
      comments[key] = comments[key].join("\n").trim();
    });
    return comments;
  }

  /** Descarga el Excel y devuelve series, fecha de corte y comentarios. */
  async function loadPortalData() {
    if (!window.XLSX) throw new Error("No se pudo cargar la librería para leer Excel. Verifica tu conexión a internet.");
    const response = await fetch(CONFIG.workbookUrl, { cache: "no-store" });
    if (!response.ok) throw new Error(`No fue posible descargar ${CONFIG.workbookUrl} (${response.status}).`);
    const buffer = await response.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array", cellDates: true });

    const data = {};
    Object.entries(CONFIG.sheets).forEach(([key, sheetName]) => {
      if (key === "rates") return;
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) throw new Error(`No existe la hoja "${sheetName}" en el Excel.`);
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: null });
      data[key] = readMonthlySheet(rows, sheetName);
    });

    const ratesSheet = workbook.Sheets[CONFIG.sheets.rates];
    if (!ratesSheet) throw new Error(`No existe la hoja "${CONFIG.sheets.rates}" en el Excel.`);
    const rateRows = XLSX.utils.sheet_to_json(ratesSheet, { header: 1, raw: true, defval: null });
    const rates = readRates(rateRows);

    // El corte global lo determina la última fila mensual válida de Lanzamientos.
    const launchRows = data.lanzamientos;
    const cutoff = launchRows[launchRows.length - 1].date;
    const cutoffKey = monthKey(cutoff);

    // Limita las cuatro series al mismo corte y agrega tasa cuando exista dato del mes.
    Object.keys(data).forEach((key) => {
      data[key] = data[key]
        .filter((item) => item.date <= cutoff)
        .map((item) => ({ ...item, rate: rates.has(item.key) ? rates.get(item.key) : null }));
    });

    const comments = await loadComments().catch(() => ({}));
    return { data, cutoff, comments };
  }

  window.PortalData = { loadPortalData };
})();
