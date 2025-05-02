#!/usr/bin/env node

/**
 * Setup Git hooks to prevent direct commits to main branch
 * 
 * This script creates a pre-commit hook that prevents commits directly to the main branch.
 * It's intended to be run as part of the project setup.
 */

import fs from 'node:fs';
import path from 'node:path';
import { chmod } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const hooksDir = path.join(projectRoot, '.git', 'hooks');
const preCommitPath = path.join(hooksDir, 'pre-commit');

// Pre-commit hook content
const preCommitContent = `#!/bin/sh
# Prevent commits directly to main branch
# This hook was installed by scripts/setup-git-hooks.js

BRANCH=\$(git symbolic-ref HEAD 2>/dev/null | cut -d"/" -f 3-)
if [ "$BRANCH" = "main" ]; then
  echo "❌ ERROR: You're attempting to commit directly to the main branch"
  echo "Please create a feature branch instead:"
  echo "  git checkout -b feature/your-feature-name"
  exit 1
fi
exit 0
`;

// Ensure hooks directory exists
if (!fs.existsSync(hooksDir)) {
  console.error('Error: .git/hooks directory not found. Are you in a git repository?');
  process.exit(1);
}

// Write the pre-commit hook
try {
  fs.writeFileSync(preCommitPath, preCommitContent, { mode: 0o755 });
  // Make the file executable
  chmod(preCommitPath, 0o755)
    .then(() => {
      console.log('✅ Git pre-commit hook installed successfully');
      console.log(`Hook location: ${preCommitPath}`);
      console.log('This hook will prevent direct commits to the main branch.');
    })
    .catch((error) => {
      console.error('Error setting file permissions:', error.message);
    });
} catch (error) {
  console.error('Error creating pre-commit hook:', error.message);
  process.exit(1);
}