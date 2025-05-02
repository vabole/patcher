#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import readline from 'node:readline';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// Paths
const packageJsonPath = path.join(rootDir, 'package.json');
const cliJsPath = path.join(rootDir, 'src', 'cli.js');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Ask a question and get user input
 * @param {string} question The question to ask
 * @returns {Promise<string>} The user's answer
 */
function askQuestion(question) {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer);
    });
  });
}

/**
 * Read package.json and parse it
 * @returns {object} The parsed package.json
 */
function getPackageJson() {
  const content = fs.readFileSync(packageJsonPath, 'utf8');
  return JSON.parse(content);
}

/**
 * Read cli.js and extract the version
 * @returns {string} The current version in cli.js
 */
function getCliVersion() {
  const content = fs.readFileSync(cliJsPath, 'utf8');
  const versionMatch = content.match(/\.version\(['"]([^'"]+)['"]\)/);
  if (!versionMatch) {
    throw new Error('Could not extract version from cli.js');
  }
  return versionMatch[1];
}

/**
 * Update the version in package.json
 * @param {string} newVersion The new version to set
 */
function updatePackageJson(newVersion) {
  const pkg = getPackageJson();
  pkg.version = newVersion;
  fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  console.log(`✓ Updated version in package.json to ${newVersion}`);
}

/**
 * Update the version in cli.js
 * @param {string} newVersion The new version to set
 */
function updateCliJs(newVersion) {
  let content = fs.readFileSync(cliJsPath, 'utf8');
  content = content.replace(
    /\.version\(['"]([^'"]+)['"]\)/,
    `.version('${newVersion}')`
  );
  fs.writeFileSync(cliJsPath, content, 'utf8');
  console.log(`✓ Updated version in cli.js to ${newVersion}`);
}

/**
 * Create and push a Git tag for the version
 * @param {string} version The version to tag
 */
function createAndPushTag(version) {
  try {
    // Check if we're on main branch
    const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    if (currentBranch !== 'main') {
      throw new Error(`You are on branch '${currentBranch}'. You need to be on 'main' branch to publish.`);
    }
    
    // Stage changes
    console.log('Committing version changes...');
    execSync('git add package.json src/cli.js', { stdio: 'inherit' });
    execSync(`git commit -m "Update version to ${version}"`, { stdio: 'inherit' });
    
    // Push changes to main
    console.log('Pushing changes to main...');
    execSync('git push origin main', { stdio: 'inherit' });
    
    // Create and push tag
    console.log(`Creating tag v${version}...`);
    execSync(`git tag v${version}`, { stdio: 'inherit' });
    execSync(`git push origin v${version}`, { stdio: 'inherit' });
    
    console.log(`✓ Successfully created and pushed tag v${version}`);
    console.log('GitHub Actions will now run tests and publish the package to npm.');
  } catch (error) {
    console.error('Error in Git operations:', error.message);
    process.exit(1);
  }
}

/**
 * Check if there are uncommitted changes
 * @returns {boolean} True if there are uncommitted changes
 */
function hasUncommittedChanges() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    return status.trim() !== '';
  } catch (error) {
    console.error('Error checking Git status:', error.message);
    process.exit(1);
  }
}

/**
 * Calculate the next version based on the current version and bump type
 * @param {string} currentVersion The current version
 * @param {string} bumpType The type of bump (major, minor, patch)
 * @returns {string} The next version
 */
function calculateNextVersion(currentVersion, bumpType) {
  const [major, minor, patch] = currentVersion.split('.').map(Number);
  
  switch (bumpType) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    default:
      return currentVersion;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('=== Patcher Publishing Tool ===');
    
    // Check for uncommitted changes
    if (hasUncommittedChanges()) {
      console.error('❌ Error: You have uncommitted changes. Please commit or stash them before publishing.');
      process.exit(1);
    }
    
    // Get current versions
    const pkgVersion = getPackageJson().version;
    const cliVersion = getCliVersion();
    
    console.log(`Current version in package.json: ${pkgVersion}`);
    console.log(`Current version in cli.js: ${cliVersion}`);
    
    // Ensure versions match
    if (pkgVersion !== cliVersion) {
      console.error(`❌ Error: Version mismatch between package.json (${pkgVersion}) and cli.js (${cliVersion})`);
      process.exit(1);
    }
    
    // Ask for version bump type
    console.log('\nWhat kind of version bump would you like to make?');
    console.log('1. major (x.0.0) - Breaking changes');
    console.log('2. minor (0.x.0) - New features, no breaking changes');
    console.log('3. patch (0.0.x) - Bug fixes, no new features or breaking changes');
    console.log('4. custom - Enter a custom version number');
    
    const bumpChoice = await askQuestion('\nEnter your choice (1-4): ');
    
    let newVersion;
    
    switch (bumpChoice) {
      case '1':
        newVersion = calculateNextVersion(pkgVersion, 'major');
        break;
      case '2':
        newVersion = calculateNextVersion(pkgVersion, 'minor');
        break;
      case '3':
        newVersion = calculateNextVersion(pkgVersion, 'patch');
        break;
      case '4':
        newVersion = await askQuestion('\nEnter custom version (e.g., 1.2.3): ');
        // Validate version format
        if (!/^\d+\.\d+\.\d+$/.test(newVersion)) {
          console.error('❌ Error: Invalid version format. Expected format: x.y.z (e.g., 1.2.3)');
          process.exit(1);
        }
        break;
      default:
        console.error('❌ Error: Invalid choice');
        process.exit(1);
    }
    
    console.log(`\nUpdating from ${pkgVersion} to ${newVersion}`);
    
    // Confirm before proceeding
    const confirm = await askQuestion('\nDo you want to proceed with the version update and publish? (y/n): ');
    
    if (confirm.toLowerCase() !== 'y') {
      console.log('Publishing aborted.');
      process.exit(0);
    }
    
    // Update versions
    updatePackageJson(newVersion);
    updateCliJs(newVersion);
    
    // Create and push tag
    createAndPushTag(newVersion);
    
    console.log('\n✅ Publishing process initiated successfully!');
    console.log('The package will be published by GitHub Actions once the workflow completes.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run the main function
main();