import { fileURLToPath } from 'node:url';
import parser from '@typescript-eslint/parser';

export default [
  {
    files: ['*.ts'],
    languageOptions: {
      parser,
      parserOptions: {
        projectService: { allowDefaultProject: ['b.config.ts'] },
        tsconfigRootDir: fileURLToPath(new URL('.', import.meta.url))
      }
    }
  }
];
