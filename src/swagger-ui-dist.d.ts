declare module 'swagger-ui-dist/swagger-ui-es-bundle.js' {
  const SwaggerUIBundle: {
    (config: Record<string, unknown>): unknown;
    presets: {
      apis: unknown;
    };
  };
  export default SwaggerUIBundle;
}

declare module 'swagger-ui-dist/swagger-ui-standalone-preset.js' {
  const SwaggerUIStandalonePreset: unknown;
  export default SwaggerUIStandalonePreset;
}
