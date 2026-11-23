# AI_CONTEXT.md · Reglas para mantener este portal

## Objetivo
Mantener un portal estático de análisis de vivienda en Colombia, independiente de otros portales de Inteligencia Económica.

## Reglas obligatorias
1. Antes de modificar, leer `README.md`, este archivo y los comentarios del módulo que se va a intervenir.
2. No reconstruir el portal completo para resolver cambios localizados.
3. No cambiar la estructura del Excel ni asumir columnas diferentes sin verificar el archivo real.
4. Mantener separadas estructura HTML, estilos CSS, lectura de datos, gráficos y coordinación de la aplicación.
5. No inventar datos, periodos, definiciones ni fuentes. Si hay diferencias entre el texto metodológico y el Excel, señalarlas.
6. Mantener la fecha de actualización vinculada a la última observación mensual válida de la hoja `Lanzamientos`.
7. Las observaciones se cargan desde `data/observaciones.txt`; no codificarlas directamente en el HTML.
8. Insertar comentarios del TXT mediante `textContent`, nunca como HTML.
9. Conservar navegación por pestañas, accesibilidad básica, diseño adaptable y metadatos SEO.
10. Después de cada cambio, verificar rutas relativas, carga del Excel, carga del TXT, funcionamiento de las cuatro gráficas y controles de series.

## Mapa de módulos
- `index.html`: estructura y contenido.
- `css/main.css`: identidad visual y diseño responsive.
- `js/portals.js`: URLs de otros portales.
- `js/data-loader.js`: configuración de hojas/columnas y lectura de datos.
- `js/charts.js`: datasets, ejes, colores y controles de series.
- `js/app.js`: navegación, fecha, comentarios y estados de carga.
