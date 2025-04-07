#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { program } = require('commander');
const chalk = require('chalk');
const patcher = require('./index');

program
  .name('patcher')
  .description('Patch installed npm packages')
  .version('0.1.0')
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
