#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import * as homeConfig from '../src/home-config.js';
import * as patcher from '../src/index.js';

// Set up paths
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_PACKAGE_DIR = path.join(__dirname, 'fixtures', 'packages', 'is-even');
const HOME_DIR = path.join(__dirname, 'fixtures', 'home');

// Set the environment variable for testing
process.env.PATCHER_TEST_HOME = HOME_DIR;

// Create the mock home directory
if (!fs.existsSync(HOME_DIR)) {
  fs.mkdirSync(HOME_DIR, { recursive: true });
}

// Create the .patcher directory in the mock home dir
const configDir = homeConfig.getConfigDir();
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
}

/**
 * Clean up temporary files
 */
function cleanup() {
  console.log('Cleaning up...');
  
  // Remove node_modules
  try {
    execSync(`rm -rf ${path.join(__dirname, 'node_modules')}`);
  } catch (error) {
    console.error('Failed to remove node_modules:', error.message);
  }
  
  // Remove the test configuration
  try {
    const safeName = homeConfig.sanitizePackageName('@patcher-test/is-even');
    const configFile = path.join(configDir, `${safeName}.js`);
    if (fs.existsSync(configFile)) {
      fs.unlinkSync(configFile);
    }
  } catch (error) {
    console.error('Failed to remove test configuration:', error.message);
  }
}

/**
 * Install the test package locally
 */
function installTestPackage() {
  console.log('Installing test package...');
  try {
    // First, switch to the test directory
    process.chdir(__dirname);
    
    // Install the local package
    execSync(`npm install ${TEST_PACKAGE_DIR}`, { stdio: 'inherit' });
    
    console.log('Test package installed successfully');
  } catch (error) {
    console.error('Failed to install test package:', error.message);
    cleanup();
    process.exit(1);
  }
}

/**
 * Create a configuration file for the test package
 */
async function createTestConfig() {
  console.log('Creating test configuration...');
  try {
    const packageName = '@patcher-test/is-even';
    const configPath = await homeConfig.createDefaultConfig(packageName);
    
    // Update the configuration with our desired patches
    const configContent = `// Configuration for ${packageName} package
export default {
  globalNpmPackage: "${packageName}",
  beautify: true,
  replacements: [
    [
      "export function isEven(value) {",
      "export function isEven(value) {\\n  // Add special handling for negative numbers\\n  if (value < 0) {\\n    return isEven(Math.abs(value));\\n  }"
    ]
  ]
}`;
    
    fs.writeFileSync(configPath, configContent, 'utf8');
    console.log(`Test configuration created at ${configPath}`);
    
    return configPath;
  } catch (error) {
    console.error('Failed to create test configuration:', error.message);
    cleanup();
    process.exit(1);
  }
}

/**
 * Apply the patch to the test package
 */
async function applyPatch(configPath) {
  console.log('Applying patch...');
  try {
    const config = (await import(configPath)).default;
    patcher.applyPatch(config);
    console.log('Patch applied successfully');
  } catch (error) {
    console.error('Failed to apply patch:', error.message);
    cleanup();
    process.exit(1);
  }
}

/**
 * Test the patched package
 */
function testPatchedPackage() {
  console.log('Testing patched package...');
  try {
    // Create a simple test script
    const testCode = `
import { isEven } from '@patcher-test/is-even';

// Test with a negative number to verify our patch
const result = isEven(-3);
console.log('isEven(-3) =', result);

// The original package might have handled this differently or thrown an error
// Our patched version should return false for -3
if (result !== false) {
  throw new Error(\`Expected isEven(-3) to be false, got \${result}\`);
}

console.log('Test passed!');
`;
    
    // Write the test script to a temporary file
    const testScriptPath = path.join(__dirname, 'temp-test.js');
    fs.writeFileSync(testScriptPath, testCode, 'utf8');
    
    // Run the test
    execSync(`node ${testScriptPath}`, { stdio: 'inherit' });
    
    // Clean up the test script
    fs.unlinkSync(testScriptPath);
    
    console.log('Patched package tested successfully');
  } catch (error) {
    console.error('Failed to test patched package:', error.message);
    cleanup();
    process.exit(1);
  }
}

/**
 * Undo the patch
 */
async function undoPatch(configPath) {
  console.log('Undoing patch...');
  try {
    const config = (await import(configPath)).default;
    patcher.undoPatch(config);
    console.log('Patch undone successfully');
  } catch (error) {
    console.error('Failed to undo patch:', error.message);
    cleanup();
    process.exit(1);
  }
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('=== Starting special package patching test ===');
    
    // Install the test package
    installTestPackage();
    
    // Create a configuration file
    const configPath = await createTestConfig();
    
    // Apply the patch
    await applyPatch(configPath);
    
    // Test the patched package
    testPatchedPackage();
    
    // Undo the patch
    await undoPatch(configPath);
    
    // Clean up
    cleanup();
    
    console.log('=== Special package patching test completed successfully ===');
  } catch (error) {
    console.error('Test failed:', error.message);
    cleanup();
    process.exit(1);
  }
}

// Run the test
main();