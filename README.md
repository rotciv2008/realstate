# Inteligencia Económica · Panorama de unidades habitacionales Colombia

Portal estático para analizar iniciaciones, lanzamientos, ventas y oferta de vivienda nueva en Colombia, con datos de Camacol / Coordenada Urbana.

## Publicación en GitHub Pages

1. Sube el contenido completo de esta carpeta a la raíz del repositorio.
2. Conserva la estructura de carpetas, especialmente `data/`.
3. En GitHub, abre **Settings → Pages** y publica desde la rama principal y la carpeta raíz.
4. Abre la URL HTTPS asignada por GitHub Pages.

El portal utiliza `fetch()` para descargar el Excel y el TXT. Por eso no debe abrirse directamente con `file://`; debe servirse mediante GitHub Pages o un servidor web local.

## Actualizar el Excel

Reemplaza `data/Tablas_de_Coyuntura.xlsx` por el archivo actualizado, conservando los nombres de las hojas y las columnas utilizadas. La fecha de actualización se calcula con la última fecha válida de la hoja `Lanzamientos`.

Columnas esperadas:
- A: Fecha
- V: Bogotá & Cundinamarca · TOTAL
- FD: 19 Regionales · VIS
- FE: 19 Regionales · NO VIS
- FF: 19 Regionales · TOTAL
- Hoja `tasas de interes`: A = Fecha, B = Tasas de interés

Si Camacol cambia la estructura del libro, actualiza los índices documentados en `js/data-loader.js`.

## Actualizar observaciones

Edita `data/observaciones.txt`. Escribe el comentario debajo del encabezado correspondiente. Si el encabezado no tiene texto, la caja de observaciones no aparece.

Encabezados válidos: `Iniciaciones`, `Lanzamientos`, `Ventas`, `Oferta`.

## Archivos principales

- `index.html`: estructura, pestañas, contenido y metadatos SEO.
- `css/main.css`: colores, tipografía, tarjetas, tablas y adaptación móvil.
- `js/portals.js`: catálogo de enlaces a otros portales.
- `js/data-loader.js`: descarga y lectura del Excel y el TXT.
- `js/charts.js`: configuración de las gráficas y controles de series.
- `js/app.js`: navegación, fecha de corte y coordinación general.
- `docs/README.md`: guía rápida de mantenimiento.

## Dependencias externas

- SheetJS (`xlsx`): lectura del Excel en el navegador.
- Chart.js: visualización de series temporales.

Se cargan desde CDN; no se requiere Node.js, backend ni proceso de compilación.

## SEO

El HTML incorpora idioma `es-CO`, título y descripción específicos, metadatos Open Graph, autor, robots, estructura semántica y datos estructurados `Dataset`. Cuando se conozca la URL definitiva del repositorio, puede añadirse una etiqueta `link rel="canonical"` con esa dirección.
