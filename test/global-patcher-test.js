#!/usr/bin/env node
import path from 'node:path';
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import os from 'node:os';

// Set up paths
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

// Use a temporary test directory to avoid polluting the actual home directory
const testHome = path.join(os.tmpdir(), 'patcher-global-bin-test-' + Date.now());
const patcherConfigDir = path.join(testHome, '.patcher');

// Save original environment variables
const originalHome = process.env.HOME;
const originalPatcherTestHome = process.env.PATCHER_TEST_HOME;

/**
 * Simulate the exact command that's failing
 */
function runTest() {
  try {
    console.log('=== Testing global patcher command with scoped packages ===');
    
    // Create test home directory
    if (!fs.existsSync(testHome)) {
      fs.mkdirSync(testHome, { recursive: true });
    }
    
    // Set environment variables to use our test home
    process.env.HOME = testHome;
    process.env.PATCHER_TEST_HOME = testHome;
    console.log(`Set test home directory to ${testHome}`);
    
    // Define the package name that's failing
    const packageName = '@aasdf/asdfa';
    
    console.log(`\nSimulating command: patcher --create ${packageName}`);
    
    // Instead of running global patcher (which might not be installed), 
    // we'll directly run the CLI but in a way that simulates how it would be executed
    // when run as a global command.
    
    try {
      // Execute command: when patcher is called globally, it receives the arguments exactly as passed
      // on the command line, without any npm extra handling
      const cmd = `cd ${projectRoot} && node ./src/cli.js --create ${packageName}`;
      console.log(`Running: ${cmd}`);
      const output = execSync(cmd, { 
        stdio: 'pipe',
        env: { ...process.env }
      }).toString();
      
      console.log('Command output:', output);
      
      // Check if configuration was created successfully
      const sanitizedName = packageName
        .replace(/@/g, '_at_')
        .replace(/\//g, '--')
        .replace(/[^a-zA-Z0-9_\-]/g, '_');
      
      const configPath = path.join(patcherConfigDir, `${sanitizedName}.js`);
      
      if (!fs.existsSync(configPath)) {
        throw new Error(`Configuration file not created at ${configPath}`);
      }
      
      console.log(`✓ Configuration file created at ${configPath}`);
      
    } catch (error) {
      console.error(`Error creating config:`, error.message);
      console.error('Command output:', error.stdout?.toString() || 'no output', error.stderr?.toString() || 'no stderr');
      console.log('TEST FAILED - This is expected as we are reproducing the issue');
      return false;
    }
    
    console.log('\n✓ TEST PASSED - But this means we did not reproduce the issue!');
    return true;
  } finally {
    // Restore original environment variables
    process.env.HOME = originalHome;
    process.env.PATCHER_TEST_HOME = originalPatcherTestHome;
    
    // Clean up test directory
    try {
      fs.rmSync(testHome, { recursive: true, force: true });
      console.log(`Cleaned up test directory: ${testHome}`);
    } catch (error) {
      console.error(`Failed to clean up test directory: ${error.message}`);
    }
  }
}

// Run the test
runTest();