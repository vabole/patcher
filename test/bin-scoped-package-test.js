#!/usr/bin/env node
import path from 'node:path';
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import assert from 'node:assert';
import { fileURLToPath } from 'node:url';
import os from 'node:os';

// Set up paths
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

// Use a temporary test directory to avoid polluting the actual home directory
const testHome = path.join(os.tmpdir(), 'patcher-bin-scoped-test-' + Date.now());
const patcherConfigDir = path.join(testHome, '.patcher');

// Save original environment variables
const originalHome = process.env.HOME;
const originalPatcherTestHome = process.env.PATCHER_TEST_HOME;

/**
 * Test creating configuration for scoped packages using the patcher bin
 */
function runTest() {
  try {
    console.log('=== Testing scoped package configuration with patcher binary ===');
    
    // Create test home directory
    if (!fs.existsSync(testHome)) {
      fs.mkdirSync(testHome, { recursive: true });
    }
    
    // Set environment variables to use our test home
    process.env.HOME = testHome;
    process.env.PATCHER_TEST_HOME = testHome;
    console.log(`Set test home directory to ${testHome}`);
    
    // Define scoped package names to test
    const scopedPackages = [
      '@test/package',
      '@scope/with-dash',
      '@complex/name.with.dots',
    ];
    
    for (const packageName of scopedPackages) {
      console.log(`\nTesting scoped package: ${packageName}`);
      
      // Run patcher with --create flag using npm script
      try {
        console.log(`Running: npm run patcher -- --create "${packageName}"`);
        execSync(`cd ${projectRoot} && npm run patcher -- --create "${packageName}"`, { 
          stdio: 'pipe',
          env: { ...process.env }
        });
      } catch (error) {
        console.error(`Error creating config for ${packageName}:`, error.message);
        console.error('Command output:', error.stdout?.toString() || 'no output', error.stderr?.toString() || 'no stderr');
        throw new Error(`Failed to create configuration for ${packageName}`);
      }
      
      // Check if the configuration file was created
      const sanitizedName = packageName
        .replace(/@/g, '_at_')
        .replace(/\//g, '--')
        .replace(/[^a-zA-Z0-9_\-]/g, '_');
      
      const configPath = path.join(patcherConfigDir, `${sanitizedName}.js`);
      
      if (!fs.existsSync(configPath)) {
        throw new Error(`Configuration file not created at ${configPath}`);
      }
      
      console.log(`✓ Configuration file created at ${configPath}`);
      
      // Check file contents
      const content = fs.readFileSync(configPath, 'utf8');
      assert(content.includes(`globalNpmPackage: "${packageName}"`), 
        `Configuration file does not contain correct package name: ${content}`);
      
      console.log(`✓ Configuration file contains correct package name`);
    }
    
    console.log('\n✓ All binary scoped package tests PASSED!');
    return true;
  } catch (error) {
    console.error('Test FAILED:', error.message);
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
const success = runTest();
process.exit(success ? 0 : 1);