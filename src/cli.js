#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Command } from 'commander';
import chalk from 'chalk';
import * as patcher from './index.js';
import * as homeConfig from './home-config.js';

const program = new Command();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

program
  .name('patcher')
  .description('Patch installed npm packages')
  .version('0.3.1')
  .argument('<package-or-config>', 'Package name or path to configuration file')
  .option('-u, --undo', 'Undo previous patches')
  .option('-c, --create', 'Create a default configuration file for the package in ~/.patcher')
  .action(async (packageOrConfig, options) => {
    try {
      let config;
      const isPackageName = !packageOrConfig.includes('/') && 
                           !packageOrConfig.endsWith('.js');
      
      if (isPackageName) {
        // Package name provided - look for configuration in ~/.patcher
        const packageName = packageOrConfig;
        console.log(chalk.blue(`Looking for configuration for ${packageName} in ~/.patcher`));
        
        if (options.create) {
          // Create a default configuration file
          const configPath = await homeConfig.createDefaultConfig(packageName);
          console.log(chalk.green(`Created default configuration at ${configPath}`));
          console.log(chalk.yellow('Please edit this file to add your replacements before applying patches.'));
          return;
        }
        
        config = await homeConfig.loadPackageConfig(packageName);
        
        if (!config) {
          console.error(chalk.red(`No configuration found for ${packageName} in ~/.patcher`));
          console.log(chalk.blue(`Use --create to create a default configuration file, or provide a path to a configuration file.`));
          process.exit(1);
        }
      } else {
        // Configuration file path provided
        const configPath = packageOrConfig;
        console.log(chalk.blue(`Using configuration file: ${configPath}`));
        
        // Only support .js config files
        if (!configPath.endsWith('.js')) {
          console.error(chalk.red('Error: Only JavaScript (.js) configuration files are supported.'));
          console.log(chalk.blue('Please convert your configuration to a .js file.'));
          process.exit(1);
        }
        
        config = (await import(path.resolve(configPath))).default;
      }
      
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
