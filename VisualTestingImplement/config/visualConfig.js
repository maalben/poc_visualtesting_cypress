// Configuration for visual testing

export const visualConfig = {
  UPDATE_BASELINE_TOTAL: false,
  // Las imágenes actuales capturadas por la prueba se guardan en VisualTestingImplement/evidences/visual-actual/{type}/{flow}/
  // Ejemplo: [{ type: 'Desktop', flow: 'Home' }, { type: 'Tablet', flow: 'Option new customer' }]
  UPDATE_BASELINE_ONLY: [],
  VIEWPORTS: {
    Desktop: { width: 1280, height: 800 },
    Tablet: { width: 768, height: 1024 },
    Mobile: { width: 375, height: 812 }
  },

  IGNORE_AREAS: {}
};
