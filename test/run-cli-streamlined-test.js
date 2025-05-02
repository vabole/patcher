#!/usr/bin/env node
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testPath = path.join(__dirname, 'cli-streamlined.test.js');

try {
  console.log('Running streamlined CLI test...');
  execSync(`node ${testPath}`, { stdio: 'inherit' });
  console.log('All tests passed!');
  process.exit(0);
} catch (error) {
  console.error('Test failed:', error.message);
  process.exit(1);
}