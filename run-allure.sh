#!/bin/bash
# npx cypress open     
# Ejecuta Cypress para los 3 dispositivos en una sola corrida, genera y abre el reporte Allure automáticamente

echo "[run-allure.sh] Ejecutando visual tests para desktop, tablet y mobile en una sola corrida..."

BASE_REPORT_DIR="allure-report"
VISUAL_DIFF_DIR="cypress/visual-diff"
ALLURE_ATTACHMENTS_DIR="$BASE_REPORT_DIR/data/attachments"

npx cypress run --env allure=true --browser chrome --spec "cypress/e2e/registration/desktop.cy.js,cypress/e2e/registration/tablet.cy.js,cypress/e2e/registration/mobile.cy.js"

echo "[run-allure.sh] Cypress finalizado, generando reporte Allure..."
npx allure generate allure-results --clean -o "$BASE_REPORT_DIR"

# Copiar screenshots y visual-baseline a allure-report después de generar el reporte
SCREENSHOTS_DIR="cypress/screenshots"
VISUAL_BASELINE_DIR="cypress/visual-baseline"
ALLURE_SCREENSHOTS_DIR="$BASE_REPORT_DIR/screenshots"
ALLURE_BASELINE_DIR="$BASE_REPORT_DIR/visual-baseline"
if [ -d "$SCREENSHOTS_DIR" ]; then
  echo "[run-allure.sh] Copiando $SCREENSHOTS_DIR a $ALLURE_SCREENSHOTS_DIR ..."
  rm -rf "$ALLURE_SCREENSHOTS_DIR"
  mkdir -p "$ALLURE_SCREENSHOTS_DIR"
  cp -R "$SCREENSHOTS_DIR/"* "$ALLURE_SCREENSHOTS_DIR/"
else
  echo "[run-allure.sh] $SCREENSHOTS_DIR no existe, omitiendo copia."
fi
if [ -d "$VISUAL_BASELINE_DIR" ]; then
  echo "[run-allure.sh] Copiando $VISUAL_BASELINE_DIR a $ALLURE_BASELINE_DIR ..."
  rm -rf "$ALLURE_BASELINE_DIR"
  mkdir -p "$ALLURE_BASELINE_DIR"
  cp -R "$VISUAL_BASELINE_DIR/"* "$ALLURE_BASELINE_DIR/"
else
  echo "[run-allure.sh] $VISUAL_BASELINE_DIR no existe, omitiendo copia."
fi

VISUAL_DIFF_TARGET_DIR="$BASE_REPORT_DIR/visual-diff"
# Copiar visual-diff directamente a allure-report/visual-diff
node copy-visual-diff.js
if [ -d "$VISUAL_DIFF_DIR" ] && [ "$(ls -A $VISUAL_DIFF_DIR)" ]; then
  echo "[run-allure.sh] Copiando $VISUAL_DIFF_DIR completo a $VISUAL_DIFF_TARGET_DIR ..."
  rm -rf "$VISUAL_DIFF_TARGET_DIR"
  mkdir -p "$VISUAL_DIFF_TARGET_DIR"
  cp -R "$VISUAL_DIFF_DIR/"* "$VISUAL_DIFF_TARGET_DIR/"
else
  echo "[run-allure.sh] $VISUAL_DIFF_DIR está vacío o no existe, omitiendo copia."
fi

echo "[run-allure.sh] Reporte Allure generado y abriéndose..."
trap 'killall java' EXIT
npx allure open "$BASE_REPORT_DIR"