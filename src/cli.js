#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Command } from 'commander';
import chalk from 'chalk';
import * as patcher from './index.js';

const program = new Command();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

program
  .name('patcher')
  .description('Patch installed npm packages')
  .version('0.2.0')
  .argument('<config>', 'Path to configuration file')
  .option('-u, --undo', 'Undo previous patches')
  .action((configPath, options) => {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      
      if (options.undo) {
        patcher.undoPatch(config);
        console.log(chalk.green('✓ Successfully undid patches'));
      } else {
        patcher.applyPatch(config);
        console.log(chalk.green('✓ Successfully applied patches'));
      }
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

program.parse();
