#!/usr/bin/env node
import path from 'node:path';
import fs from 'node:fs';
import { execSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import readline from 'node:readline';

// Set up paths
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const cliPath = path.join(projectRoot, 'src/cli.js');

/**
 * Simulates the exact error by directly manipulating process.argv
 */
function simulateDirectCLI() {
  console.log('=== Directly testing CLI.js with simulated process.argv ===');
  
  // THIS IS THE CRITICAL TEST - we directly modify process.argv to simulate
  // exactly what happens when the CLI parses the command without npm's help
  
  // Save original process.argv
  const originalArgv = process.argv;
  
  // Try different configurations to reproduce the issue
  const testCases = [
    {
      name: "Basic pattern",
      args: ["patcher", "--create", "@aasdf/asdfa"]
    },
    {
      name: "Using package name as first arg",
      args: ["patcher", "@aasdf/asdfa", "--create"]
    },
    {
      name: "Using package name as first arg with file flag",
      args: ["patcher", "@aasdf/asdfa", "--file", "@aasdf/asdfa"]
    },
    {
      name: "Weird edge case to try",
      args: ["patcher", "--create", "@aasdf/asdfa", "--file", "@aasdf/asdfa"]
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\nTest Case: ${testCase.name}`);
    console.log(`Command: ${testCase.args.join(' ')}`);
    
    const child = spawn('node', [cliPath, ...testCase.args.slice(1)], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env }
    });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    child.on('close', (code) => {
      console.log(`Exit code: ${code}`);
      console.log(`stdout: ${stdout}`);
      console.log(`stderr: ${stderr}`);
      
      if (stderr.includes('Only JavaScript (.js) configuration files are supported')) {
        console.log('🔴 ISSUE REPRODUCED! This matches the user reported error.');
      }
    });
  }
}

// Run the test
simulateDirectCLI();