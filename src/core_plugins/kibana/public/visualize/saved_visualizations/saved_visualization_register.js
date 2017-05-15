export function savedVisualizationProvider(savedVisualizations) {
  return {
    name: 'visualizations',
    savedObjects: savedVisualizations
  };
}
