#!/usr/bin/env node
import path from 'node:path';
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import os from 'node:os';

// Set up paths
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const cliPath = path.join(projectRoot, 'src/cli.js');

// Use a temporary test directory to avoid polluting the actual home directory
const testHome = path.join(os.tmpdir(), 'patcher-exact-issue-test-' + Date.now());
const patcherConfigDir = path.join(testHome, '.patcher');

// Save original environment variables
const originalHome = process.env.HOME;
const originalPatcherTestHome = process.env.PATCHER_TEST_HOME;

/**
 * Simulate the exact command that's failing
 */
function runTest() {
  try {
    console.log('=== Testing exact issue reproduction ===');
    
    // Create test home directory
    if (!fs.existsSync(testHome)) {
      fs.mkdirSync(testHome, { recursive: true });
    }
    
    // Set environment variables to use our test home
    process.env.HOME = testHome;
    process.env.PATCHER_TEST_HOME = testHome;
    console.log(`Set test home directory to ${testHome}`);
    
    // Define the exact command the user tried
    const packageName = '@aasdf/asdfa';
    
    // First try with the command directly without special handling
    try {
      console.log(`\n1. Testing direct command without quotes: patcher --create ${packageName}`);
      
      const cmd = `cd ${projectRoot} && node ${cliPath} --create ${packageName}`;
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
      
      if (fs.existsSync(configPath)) {
        console.log(`✓ Configuration file created at ${configPath}`);
        fs.unlinkSync(configPath);
        console.log('Removed test configuration file for next test');
      } else {
        console.error(`✗ Configuration file not created at ${configPath}`);
      }
    } catch (error) {
      console.error(`Error with direct command:`, error.message);
      console.error('Command output:', error.stdout?.toString() || 'no output', error.stderr?.toString() || 'no stderr');
    }
    
    // Next try: run the command, but using it as the package name
    try {
      console.log(`\n2. Testing command simulating confusion of arg order: patcher ${packageName} --create`);
      
      const cmd = `cd ${projectRoot} && node ${cliPath} ${packageName} --create`;
      console.log(`Running: ${cmd}`);
      
      const output = execSync(cmd, { 
        stdio: 'pipe',
        env: { ...process.env }
      }).toString();
      
      console.log('Command output:', output);
    } catch (error) {
      console.error(`Error with reversed args:`, error.message);
      console.error('Command output:', error.stdout?.toString() || 'no output', error.stderr?.toString() || 'no stderr');
    }
    
    // Next try: as if it was invoked with the package name being interpreted as a config file
    try {
      console.log(`\n3. Testing as if interpreted as config file: patcher --file ${packageName}`);
      
      const cmd = `cd ${projectRoot} && node ${cliPath} --file ${packageName}`;
      console.log(`Running: ${cmd}`);
      
      const output = execSync(cmd, { 
        stdio: 'pipe',
        env: { ...process.env }
      }).toString();
      
      console.log('Command output:', output);
    } catch (error) {
      console.error(`Error with file interpretation:`, error.message);
      console.error('Command output:', error.stdout?.toString() || 'no output', error.stderr?.toString() || 'no stderr');
      
      if (error.stderr?.toString().includes('Only JavaScript (.js) configuration files are supported')) {
        console.log('🔴 ISSUE REPRODUCED! The package name is incorrectly being treated as a configuration file.');
        return true;
      }
    }
    
    console.log('\n❓ Could not reproduce the exact issue in our testing');
    return false;
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