import config from './eslint.config.mjs';

export default config.map((entry) => ({
  ...entry,
  languageOptions: {
    ...entry.languageOptions,
    parserOptions: {
      ...entry.languageOptions.parserOptions,
      projectService: { allowDefaultProject: ['alternate.config.ts'] }
    }
  }
}));
