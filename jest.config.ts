import type { Config } from 'jest';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config: Config = {
  setupFiles: [path.join(__dirname, 'jest.setup.ts')],

  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s', '!**/*-migration.ts'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
};
export default config;
