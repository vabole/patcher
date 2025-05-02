import path from 'node:path';
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import assert from 'node:assert';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// Set up paths
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const cliPath = path.join(projectRoot, 'src/cli.js');
const homePath = path.join(__dirname, 'fixtures/home');
const homeConfigDir = path.join(homePath, '.patcher');
const isOddPath = path.join(projectRoot, 'node_modules/is-odd/index.js');
const isOddBackupPath = path.join(projectRoot, 'node_modules/is-odd/index.js.backup');

// Backup original environment variables
const originalHome = process.env.HOME;

/**
 * Create a clean backup of the is-odd package
 */
function createCleanBackup() {
  // Read the current content
  const content = fs.readFileSync(isOddPath, 'utf8');
  
  // Create a clean version (remove the zero check)
  const cleanedContent = content.replace(/if \(value === 0\) throw new Error\('zero is not allowed'\);\n/, '');
  
  // Write the backup
  fs.writeFileSync(isOddBackupPath, cleanedContent, 'utf8');
  console.log('Created clean backup of is-odd package');
  
  // Restore clean version for testing
  fs.writeFileSync(isOddPath, cleanedContent, 'utf8');
  console.log('Restored clean version of is-odd package');
}

/**
 * Import a fresh version of is-odd
 */
function importIsOdd() {
  // Force re-importing the module by using a direct path
  delete require.cache[require.resolve('is-odd')];
  const isOdd = require('is-odd');
  return isOdd;
}

/**
 * Test home directory configuration for patcher
 */
function runTest() {
  try {
    console.log('=== Testing home directory configuration ===');
    
    // Set HOME environment variable to our test fixtures
    process.env.HOME = homePath;
    console.log(`Set HOME to ${homePath}`);
    
    // Make sure our test fixtures exist
    assert(fs.existsSync(homeConfigDir), 'Test fixtures not found');
    assert(fs.existsSync(path.join(homeConfigDir, 'is-odd.js')), 'is-odd.js not found');
    console.log('Test fixtures exist.');
    
    // Create clean backup and restore original version for testing
    createCleanBackup();
    
    // Import is-odd and test before patching
    let isOdd = importIsOdd();
    
    // Test with zero (should NOT throw before patching)
    try {
      const result = isOdd(0);
      console.log('Before patch - isOdd(0):', result);
    } catch (error) {
      console.log('Error before patching:', error.message);
      throw new Error('Should not throw error before patching. Is the package already patched?');
    }
    
    // Apply patch using package name only
    console.log('Applying patch with: node', cliPath, 'is-odd');
    try {
      execSync(`node ${cliPath} is-odd`, { stdio: 'inherit' });
    } catch (error) {
      console.error('Error applying patch:', error.message);
      throw error;
    }
    
    console.log('Patch applied. Testing...');
    
    // Test after patching - should throw for zero
    isOdd = importIsOdd();
    
    try {
      const result = isOdd(0);
      console.log('After patch - isOdd(0):', result);
      throw new Error('Expected error was not thrown after patching');
    } catch (error) {
      if (error.message.includes('zero is not allowed')) {
        console.log('Error after patching (expected):', error.message);
      } else {
        console.error('Unexpected error after patching:', error.message);
        throw error;
      }
    }
    
    // Undo patch
    console.log('Undoing patch...');
    try {
      execSync(`node ${cliPath} --undo is-odd`, { stdio: 'inherit' });
    } catch (error) {
      console.error('Error undoing patch:', error.message);
      throw error;
    }
    
    // Test after undoing patch - should NOT throw for zero
    isOdd = importIsOdd();
    
    try {
      const result = isOdd(0);
      console.log('After undo - isOdd(0):', result);
    } catch (error) {
      if (error.message.includes('zero is not allowed')) {
        console.error('Error after undoing patch - patch was not correctly undone:', error.message);
        throw new Error('Patch was not correctly undone: ' + error.message);
      } else {
        console.error('Unexpected error after undoing patch:', error.message);
        throw error;
      }
    }
    
    console.log('Test PASSED! Home directory configuration works correctly.');
    return true;
  } catch (error) {
    console.error('Test FAILED:', error.message);
    return false;
  } finally {
    // Restore original HOME
    process.env.HOME = originalHome;
    
    // Restore original content from backup if it exists
    if (fs.existsSync(isOddBackupPath)) {
      try {
        fs.copyFileSync(isOddBackupPath, isOddPath);
        console.log('Restored original is-odd package from backup');
      } catch (error) {
        console.error('Failed to restore original is-odd package:', error.message);
      }
    }
  }
}

// Run the test
runTest();
// We'll let the process exit naturally