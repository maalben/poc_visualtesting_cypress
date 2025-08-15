# Visual Testing Automation - Cypress + Allure

## Descripción

Este proyecto implementa pruebas automatizadas de regresión visual para flujos de registro, utilizando **Cypress** como framework de testing y **Allure** para la generación de reportes visuales avanzados. Incluye lógica para comparación de imágenes, manejo de líneas base, generación de diffs visuales y adjuntos en el reporte.

---

## Herramientas principales

- **Cypress**: Framework de testing end-to-end.
- **Allure**: Generador de reportes avanzados con soporte para adjuntos visuales.
- **pixelmatch** y **pngjs**: Comparación de imágenes y generación de diffs.
- **@shelex/cypress-allure-plugin**: Integración de Cypress con Allure.
- **Node.js scripts**: Automatización de copias, generación de HTML autosuficiente y manejo de carpetas.

---

## Estructura relevante del proyecto

```
cypress/
  e2e/
    registration/
      desktop.cy.js
      tablet.cy.js
      mobile.cy.js
  support/
    utils/
      VisualTestHelper.js
      visualTasks.js
    visualConfig.js
  screenshots/
  visual-baseline/
  visual-diff/
scripts/
  copy-visual-diffs-to-allure-attachments.js
  patch-allure-report-html.js
  allure-report-dir.js
generateSelfContainedDiffHtml.js
```

---

## Variables de configuración para línea base

En `cypress/support/visualConfig.js`:

- `UPDATE_BASELINE_TOTAL`:  
  Si está en `true`, actualiza **todas** las líneas base en cada ejecución.
- `UPDATE_BASELINE_ONLY`:  
  Permite actualizar selectivamente la línea base solo para los flujos y tipos de dispositivo especificados.  
  Ejemplo:
  ```js
  UPDATE_BASELINE_ONLY: [
    { type: 'Desktop', flow: 'Home' },
    { type: 'Tablet', flow: 'Option new customer' }
  ]
  ```
  Si está vacío, no se actualiza ninguna línea base salvo que `UPDATE_BASELINE_TOTAL` sea `true`.

---

## Uso típico

1. **Ejecución normal (sin actualizar línea base):**
   - Deja `UPDATE_BASELINE_TOTAL: false` y `UPDATE_BASELINE_ONLY: []`.
   - Solo se comparan imágenes contra la línea base existente.

2. **Actualizar toda la línea base:**
   - Pon `UPDATE_BASELINE_TOTAL: true`.
   - Todas las imágenes generadas reemplazarán la línea base.

3. **Actualizar solo flujos específicos:**
   - Deja `UPDATE_BASELINE_TOTAL: false`.
   - Especifica los flujos y tipos en `UPDATE_BASELINE_ONLY`.

---

## Scripts y automatización

- `copy-visual-diffs-to-allure-attachments.js`: Copia los diffs visuales y HTML autosuficiente a la carpeta de adjuntos de Allure.
- `patch-allure-report-html.js`: Inserta enlaces a los diffs y adjuntos en el reporte HTML de Allure.
- `generateSelfContainedDiffHtml.js`: Genera un HTML autosuficiente con las imágenes embebidas en base64 para visualización directa.

---

## Recomendaciones de uso

- Mantén la línea base actualizada solo para los flujos que realmente cambian.
- Usa la actualización selectiva para evitar sobrescribir líneas base que no han cambiado.
- Revisa el reporte Allure tras cada ejecución para validar visualmente los diffs y adjuntos.
- Si centralizas la funcionalidad en una carpeta, actualiza todas las rutas de importación y scripts.

---

## Ejemplo de configuración para actualización selectiva

```js
export const visualConfig = {
  UPDATE_BASELINE_TOTAL: false,
  UPDATE_BASELINE_ONLY: [
    { type: 'Desktop', flow: 'Home' },
    { type: 'Tablet', flow: 'Option new customer' }
  ],
  VIEWPORTS: { /* ... */ },
  IGNORE_AREAS: { /* ... */ }
};
```

---

## Ejecución de pruebas y generación de reporte

### 1. Ejecutar las pruebas Cypress

Puedes ejecutar los tests visuales con:

```bash
npx cypress run
```

O usando el script de shell integrado:

```bash
./run-allure.sh
```

Este script automatiza todo el flujo:
- Ejecuta los tests Cypress.
- Copia los diffs visuales y HTML autosuficiente.
- Parchea el reporte para mostrar los adjuntos visuales.
- Abre el reporte generado en el navegador.

### 2. Generar el reporte Allure manualmente (alternativa)

Si prefieres los comandos npm:

```bash
npm run allure:full-report
```

Esto ejecuta:
- `allure:generate`: Genera el reporte Allure en una carpeta con timestamp.
- `allure:postprocess`: Copia los diffs visuales y HTML autosuficiente, y parchea el reporte para mostrar los adjuntos.

### 3. Visualizar el reporte

Abre el reporte generado en tu navegador:

```bash
npx allure open allure-report
```

o, si tienes un script:

```bash
npm run allure:open
```

### 4. Actualizar línea base (opcional)

- Para actualizar toda la línea base, pon `UPDATE_BASELINE_TOTAL: true` en `visualConfig.js` y repite los pasos.
- Para actualizar solo flujos específicos, usa `UPDATE_BASELINE_ONLY` y repite los pasos.

---
