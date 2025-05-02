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
  .version('2.1.2')
  .argument('<package-name>', 'Package name to patch')
  .option('-f, --file <config-file>', 'Use a specific configuration file instead of looking in ~/.patcher')
  .option('-u, --undo', 'Undo previous patches')
  .option('-c, --create', 'Create a default configuration file for the package in ~/.patcher')
  .action(async (packageName, options) => {
    try {
      let config;
      
      // Directly handle --create before any other processing
      // This fixes the issue with scoped packages
      if (options.create) {
        console.log(chalk.blue(`Looking for configuration for ${packageName} in ~/.patcher`));
        // Create a default configuration file
        const configPath = await homeConfig.createDefaultConfig(packageName);
        console.log(chalk.green(`Created default configuration at ${configPath}`));
        console.log(chalk.yellow('Please edit this file to add your replacements before applying patches.'));
        return;
      }
      
      if (options.file) {
        // Configuration file path provided via --file flag
        const configPath = options.file;
        console.log(chalk.blue(`Using configuration file: ${configPath}`));
        
        // Special handling for scoped packages to detect if they're being mistakenly used as config files
        if (configPath.startsWith('@') && configPath.includes('/') && !configPath.endsWith('.js')) {
          console.error(chalk.red(`Error: The value '${configPath}' appears to be a scoped package name, not a configuration file.`));
          console.log(chalk.blue(`If you meant to use a configuration file, ensure it has a .js extension.`));
          console.log(chalk.blue(`If you meant to create a configuration for this package, use: patcher --create "${configPath}"`));
          process.exit(1);
        }
        
        // Only support .js config files
        if (!configPath.endsWith('.js')) {
          console.error(chalk.red('Error: Only JavaScript (.js) configuration files are supported.'));
          console.log(chalk.blue('Please convert your configuration to a .js file.'));
          process.exit(1);
        }
        
        config = (await import(path.resolve(configPath))).default;
      } else {
        // Package name provided - look for configuration in ~/.patcher
        console.log(chalk.blue(`Looking for configuration for ${packageName} in ~/.patcher`));
        
        config = await homeConfig.loadPackageConfig(packageName);
        
        if (!config) {
          console.error(chalk.red(`No configuration found for ${packageName} in ~/.patcher`));
          console.log(chalk.blue(`Use --create to create a default configuration file, or provide a specific configuration file with --file option.`));
          process.exit(1);
        }
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
