// Architecture boundaries of the modular monolith (see .claude/skills/*-conventions).
module.exports = {
  forbidden: [
    {
      name: 'shared-stays-pure',
      comment: 'src/shared runs in the browser and on the server: no server, db, module, web or Node built-in imports.',
      severity: 'error',
      from: { path: '^src/shared' },
      to: { path: ['^src/(server|db|modules)', '^web/', '^node:'], dependencyTypes: ['local', 'core'] },
    },
    {
      name: 'modules-through-public-api',
      comment: 'Another module may only be reached through its index.ts.',
      severity: 'error',
      from: { path: '^src/modules/([^/]+)/' },
      to: { path: '^src/modules/([^/]+)/.+', pathNot: ['^src/modules/$1/', '^src/modules/[^/]+/index\\.ts$'] },
    },
    {
      name: 'domain-has-no-infrastructure',
      severity: 'error',
      from: { path: '^src/modules/[^/]+/domain/', pathNot: '\\.test\\.ts$' },
      to: { path: ['/application/', '/infrastructure/', '^src/server', '^src/db', 'node_modules'] },
    },
    {
      name: 'application-has-no-infrastructure',
      severity: 'error',
      from: { path: '^src/modules/[^/]+/application/' },
      to: { path: ['/infrastructure/', '^src/server', '^src/db'] },
    },
    {
      name: 'web-never-imports-server',
      severity: 'error',
      from: { path: '^web/' },
      to: { path: '^src/(server|db|modules)' },
    },
    {
      name: 'scene-engine-has-no-vue',
      comment: 'The PixiJS scene is framework-free; only SceneView.vue touches it.',
      severity: 'error',
      from: { path: '^web/src/scene-engine' },
      to: { path: ['node_modules/vue', 'node_modules/vue-router', '\\.vue$'] },
    },
    {
      name: 'features-are-isolated',
      severity: 'error',
      from: { path: '^web/src/features/([^/]+)/' },
      to: { path: '^web/src/features/([^/]+)/', pathNot: '^web/src/features/$1/' },
    },
    {
      name: 'reka-only-in-design-system',
      comment: 'Reka UI primitives are wrapped once in Base* adapters; app code uses the adapters.',
      severity: 'error',
      from: { path: '^web/src', pathNot: '^web/src/design-system/' },
      to: { path: 'node_modules/reka-ui' },
    },
    {
      name: 'atomic-atoms-import-nothing-above',
      severity: 'error',
      from: { path: '(^web/src/design-system/|/components/atoms/)' },
      to: { path: ['/components/(molecules|organisms)/', '/views/'] },
    },
    {
      name: 'atomic-molecules-import-only-atoms',
      severity: 'error',
      from: { path: '/components/molecules/' },
      to: { path: ['/components/organisms/', '/views/', '/composables/', '/api/'] },
    },
    {
      name: 'atomic-organisms-below-views',
      severity: 'error',
      from: { path: '/components/organisms/' },
      to: { path: '/views/' },
    },
    { name: 'no-circular', severity: 'error', from: {}, to: { circular: true } },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsConfig: { fileName: 'web/tsconfig.json' },
    tsPreCompilationDeps: true,
    enhancedResolveOptions: { extensions: ['.ts', '.vue', '.js'] },
  },
};
