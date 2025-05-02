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
const testHome = path.join(os.tmpdir(), 'patcher-fix-verification-' + Date.now());
const patcherConfigDir = path.join(testHome, '.patcher');

// Save original environment variables
const originalHome = process.env.HOME;
const originalPatcherTestHome = process.env.PATCHER_TEST_HOME;

/**
 * Test that our fix correctly handles the problematic case
 */
function runTest() {
  try {
    console.log('=== Testing fix for scoped package issue ===');
    
    // Create test home directory
    if (!fs.existsSync(testHome)) {
      fs.mkdirSync(testHome, { recursive: true });
    }
    
    // Set environment variables to use our test home
    process.env.HOME = testHome;
    process.env.PATCHER_TEST_HOME = testHome;
    console.log(`Set test home directory to ${testHome}`);
    
    // This is the command that was failing - it should now work
    const packageName = '@aasdf/asdfa';
    
    console.log(`\nTesting the exact command that was failing: patcher --create ${packageName}`);
    
    try {
      // Execute the problematic command
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
      
      if (!fs.existsSync(configPath)) {
        throw new Error(`Configuration file not created at ${configPath}`);
      }
      
      console.log(`✓ Configuration file created at ${configPath}`);
      console.log(`✓ Fix SUCCESSFULLY resolves the issue with scoped packages`);
      
      // Now try the edge case that was reproducing the issue
      console.log(`\nVerifying that the edge case is also fixed: patcher ${packageName} --file ${packageName}`);
      
      try {
        const edgeCaseCmd = `cd ${projectRoot} && node ${cliPath} ${packageName} --file ${packageName}`;
        execSync(edgeCaseCmd, { 
          stdio: 'pipe',
          env: { ...process.env }
        });
        
        // We expect this to fail, but NOT with the "Only JavaScript (.js)" error
      } catch (error) {
        const stderr = error.stderr?.toString() || '';
        
        if (stderr.includes('Only JavaScript (.js) configuration files are supported')) {
          throw new Error('Edge case still fails with the same error - fix is incomplete');
        } else {
          console.log(`✓ Edge case now fails with a different, expected error: ${error.message}`);
        }
      }
      
      return true;
    } catch (error) {
      console.error(`Error running test:`, error.message);
      console.error('Command output:', error.stdout?.toString() || 'no output', error.stderr?.toString() || 'no stderr');
      console.log('❌ Fix did NOT resolve the issue');
      return false;
    }
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
const success = runTest();
process.exit(success ? 0 : 1);