#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import readline from 'node:readline';
import { Command } from 'commander';

// Set up command-line interface
const program = new Command();

program
  .name('publish-version')
  .description('Automate version updates and publishing for patcher')
  .option('-t, --type <type>', 'Version bump type (major, minor, patch)', 'patch')
  .option('-v, --version <version>', 'Specific version to set (overrides type)')
  .option('-y, --yes', 'Skip confirmation prompt', false)
  .option('-b, --branch <branch>', 'Allow publishing from specified branch instead of main')
  .option('--dry-run', 'Show what would be done without making changes', false)
  .option('--git', 'Perform git operations (commit, tagging, and pushing)', true)
  .option('--no-git', 'Skip git operations (commit, tagging, and pushing)')
  .addHelpText('after', `
Examples:
  # Interactive mode (recommended for manual use)
  $ node scripts/publish.js
  
  # Non-interactive mode with automatic patch version bump
  $ node scripts/publish.js --type patch --yes
  
  # Non-interactive mode with specific version
  $ node scripts/publish.js --version 1.2.3 --yes
  
  # Test what would happen without making changes
  $ node scripts/publish.js --dry-run
  
  # Allow publishing from a different branch
  $ node scripts/publish.js --type minor --branch feature/my-branch --yes
  
  # Skip git operations
  $ node scripts/publish.js --type patch --no-git --yes
  `)
  .parse(process.argv);

const options = program.opts();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// Paths
const packageJsonPath = path.join(rootDir, 'package.json');
const cliJsPath = path.join(rootDir, 'src', 'cli.js');

// Create readline interface for user input (only used in interactive mode)
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
 * @param {object} options Command line options
 */
function createAndPushTag(version, options) {
  try {
    // Check if we're on allowed branch
    const allowedBranch = options.branch || `feature/version-update-${version}`;
    const isBranchSpecified = !!options.branch;
    const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    const isMainBranch = currentBranch === 'main';
    const isVersionBranch = currentBranch.startsWith('feature/version-update');
    
    // If we're on main and no branch is specified, auto-create a feature branch
    if (isMainBranch && !isBranchSpecified) {
      console.log(`Creating feature branch ${allowedBranch} for version update...`);
      execSync(`git checkout -b ${allowedBranch}`, { stdio: 'inherit' });
    } else if (currentBranch !== allowedBranch && !isVersionBranch) {
      throw new Error(`You are on branch '${currentBranch}'. 
To publish, either:
1. Create a feature branch first: git checkout -b feature/version-update-${version}
2. Specify your branch with --branch: npm run publish:minor -- --branch ${currentBranch}`);
    }
    
    if (options.dryRun) {
      console.log(`[DRY RUN] Would commit changes to package.json and src/cli.js`);
      console.log(`[DRY RUN] Would create and push tag v${version}`);
      console.log(`[DRY RUN] Would create PR from ${allowedBranch} to main`);
      return;
    }
    
    // Stage changes
    console.log('Committing version changes...');
    execSync('git add package.json src/cli.js', { stdio: 'inherit' });
    execSync(`git commit -m "Update version to ${version}"`, { stdio: 'inherit' });
    
    // Push the feature branch
    console.log(`Pushing branch ${currentBranch}...`);
    try {
      execSync(`git push -u origin ${currentBranch}`, { stdio: 'inherit' });
    } catch (pushError) {
      console.warn(`Warning: Could not push branch. You may need to push manually.`);
      console.warn(`Run: git push -u origin ${currentBranch}`);
    }
    
    // Create and push tag
    console.log(`Creating tag v${version}...`);
    execSync(`git tag v${version}`, { stdio: 'inherit' });
    try {
      execSync(`git push origin v${version}`, { stdio: 'inherit' });
    } catch (tagPushError) {
      console.warn(`Warning: Could not push tag. You may need to push manually.`);
      console.warn(`Run: git push origin v${version}`);
    }
    
    // Create PR automatically
    console.log(`\nCreating PR for version ${version}...`);
    try {
      const prTitle = `Update version to ${version}`;
      const prBody = `## Version ${version}

This PR updates the package version to ${version}.

The version tag has already been created and pushed, which will trigger publishing once this PR is merged.`;
      
      execSync(`gh pr create --title "${prTitle}" --body "${prBody}"`, { stdio: 'inherit' });
      console.log('\n✅ PR created successfully!');
      console.log('\nNext steps:');
      console.log('1. Wait for CI checks to pass on the PR');
      console.log('2. Merge the PR to main');
      console.log('3. The package will be automatically published by GitHub Actions');
    } catch (prError) {
      console.warn('\nCould not automatically create PR. Please create it manually:');
      console.warn(`gh pr create --title "Update version to ${version}" --body "Version update to ${version}"`);
    }
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
 * Run in interactive mode - prompts the user for input
 */
async function runInteractive() {
  try {
    console.log('=== Patcher Publishing Tool (Interactive Mode) ===');
    
    // Get current versions
    const pkgVersion = getPackageJson().version;
    const cliVersion = getCliVersion();
    
    console.log(`Current version in package.json: ${pkgVersion}`);
    console.log(`Current version in cli.js: ${cliVersion}`);
    
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
    
    return newVersion;
  } finally {
    rl.close();
  }
}

/**
 * Run in non-interactive mode - use command line options
 * @param {object} options Command line options
 * @param {string} currentVersion Current version
 * @returns {string} New version
 */
function runNonInteractive(options, currentVersion) {
  console.log('=== Patcher Publishing Tool (Non-Interactive Mode) ===');
  
  let newVersion;
  
  // If specific version is provided, use that
  if (options.version) {
    newVersion = options.version;
    // Validate version format
    if (!/^\d+\.\d+\.\d+$/.test(newVersion)) {
      console.error('❌ Error: Invalid version format. Expected format: x.y.z (e.g., 1.2.3)');
      process.exit(1);
    }
  } else {
    // Otherwise calculate based on bump type
    newVersion = calculateNextVersion(currentVersion, options.type);
  }
  
  console.log(`Updating from ${currentVersion} to ${newVersion}`);
  
  // Skip confirmation if --yes is specified
  if (!options.yes && !options.dryRun) {
    console.log('⚠️  You are running in non-interactive mode, but without --yes flag.');
    console.log('   Set --yes to skip this warning in CI environments.');
    console.log('');
    console.log('   Run with --dry-run to see what would happen without making changes.');
    console.log('');
    console.log('To proceed anyway, press Ctrl+C now to abort, or wait 5 seconds to continue...');
    
    // Wait for 5 seconds to let the user abort if needed
    try {
      execSync('sleep 5');
    } catch (err) {
      console.log('Operation aborted.');
      process.exit(1);
    }
  }
  
  return newVersion;
}

/**
 * Main function
 */
async function main() {
  try {
    // Check for uncommitted changes
    if (hasUncommittedChanges() && !options.dryRun) {
      console.error('❌ Error: You have uncommitted changes. Please commit or stash them before publishing.');
      console.error('   Use --dry-run to see what would happen without making changes.');
      process.exit(1);
    }
    
    // Get current versions
    const pkgVersion = getPackageJson().version;
    const cliVersion = getCliVersion();
    
    // Ensure versions match
    if (pkgVersion !== cliVersion) {
      console.error(`❌ Error: Version mismatch between package.json (${pkgVersion}) and cli.js (${cliVersion})`);
      process.exit(1);
    }
    
    let newVersion;
    
    // Determine if we're running in interactive or non-interactive mode
    const isNonInteractive = options.type || options.version || options.yes;
    
    if (isNonInteractive) {
      newVersion = runNonInteractive(options, pkgVersion);
    } else {
      newVersion = await runInteractive();
    }
    
    if (options.dryRun) {
      console.log(`[DRY RUN] Would update version in package.json to ${newVersion}`);
      console.log(`[DRY RUN] Would update version in cli.js to ${newVersion}`);
    } else {
      // Update versions
      updatePackageJson(newVersion);
      updateCliJs(newVersion);
    }
    
    // Create and push tag (if git operations are not disabled)
    if (options.git) {
      createAndPushTag(newVersion, options);
    } else if (options.dryRun) {
      console.log(`[DRY RUN] Git operations are disabled, would not create tag or push changes`);
    } else {
      console.log(`⚠️ Git operations are disabled with --no-git`);
      console.log(`You will need to manually commit and tag this release.`);
    }
    
    console.log('\n✅ Publishing process initiated successfully!');
    if (!options.dryRun && options.git) {
      console.log('The package will be published by GitHub Actions once the workflow completes.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the main function
main();