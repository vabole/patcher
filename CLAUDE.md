# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Workflow

### Branch and PR Strategy

1. **🔴 CRITICAL: NEVER commit directly to main branch 🔴**
   - All changes MUST go through pull requests
   - This includes code, documentation, and configuration changes
   - NO EXCEPTIONS for quick fixes or "minor" changes
   - CI/CD workflows depend on proper branch management

2. **ALWAYS** follow this workflow for new features, bugfixes, or improvements:
   - Create a feature branch from main: `git checkout -b feature/my-feature`
   - Make changes on that branch
   - Push the branch: `git push -u origin feature/my-feature`
   - Create a PR with a clear, concise description of the changes
   - Merge the PR to main after review

3. **Branch naming convention**:
   - `feature/` - For new features (e.g., `feature/add-config-validation`)
   - `fix/` - For bug fixes (e.g., `fix/package-name-sanitization`)
   - `docs/` - For documentation updates (e.g., `docs/improve-readme`)
   - `refactor/` - For code refactoring (e.g., `refactor/cli-structure`)

4. **PR Descriptions** should be clear and concise, explaining:
   - What was changed
   - Why it was changed
   - Any special considerations or implications for users

### Branch Protection Configuration

For repository administrators, the following branch protection rules should be configured on GitHub:

1. Go to Repository Settings → Branches → Branch protection rules → Add rule
2. Configure the following settings for the `main` branch:
   - ✅ Require pull request reviews before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - ✅ Do not allow bypassing the above settings
   - ✅ Restrict who can push to matching branches

Local git configuration to help prevent accidental commits to main:
```bash
# Add this to your .git/hooks/pre-commit file (create if it doesn't exist)
#!/bin/sh
BRANCH=$(git symbolic-ref HEAD 2>/dev/null | cut -d"/" -f 3-)
if [ "$BRANCH" = "main" ]; then
  echo "❌ ERROR: You're attempting to commit directly to the main branch"
  echo "Please create a feature branch instead:"
  echo "  git checkout -b feature/your-feature-name"
  exit 1
fi
exit 0
```

Make sure to make the hook executable:
```bash
chmod +x .git/hooks/pre-commit
```

4. **Use GitHub CLI** for PR management when possible:
   ```bash
   # Create a PR
   gh pr create --title "Your PR title" --body "Description of changes"
   
   # View a PR
   gh pr view 123
   
   # Merge a PR
   gh pr merge 123 --merge
   
   # Check PR status
   gh pr status
   ```

This workflow creates a cleaner history and makes it easier to understand changes.

## Commands
- Install: `npm install`
- Run: `node src/cli.js <package-name>` or `npm run patcher <package-name>`
- Create config: `node src/cli.js --create <package-name>` (creates in ~/.patcher)
- Run with specific config file: `node src/cli.js <package-name> --file <config-file>`
- Undo patches: `node src/cli.js --undo <package-name>`
- Test: `npm test`
- Test streamlined CLI: `npm run test:cli-streamlined`
- Patch test: `npm run test:patch`
- Undo patch test: `npm run test:undo`
- Home config test: `npm run test:home-config`
- Run single test: `node local-test-runner.js`

## Publishing
⚠️ **EXTREMELY IMPORTANT**: NEVER attempt to publish with `npm publish` directly. ALWAYS use GitHub CI for publishing.

🔴 **CRITICAL**: The package is published EXCLUSIVELY through GitHub Actions CI. NEVER use local npm commands for publishing!

The publishing process is FULLY AUTOMATED via GitHub Actions workflow:
- npm tokens are securely stored in GitHub Secrets
- Authentication and publishing happen in the CI environment
- Local credentials should NEVER be used

### Automated Publishing (Recommended)

⚠️ **IMPORTANT**: Due to branch protection, you must create a feature branch BEFORE running the publish scripts!

```bash
# First create a feature branch for version update
git checkout -b feature/version-update-x.y.z
```

#### Interactive Mode

To publish a new version using the interactive script:

```bash
# Use --branch flag to allow running on a feature branch
npm run publish:version -- --branch feature/version-update-x.y.z
```

This script will:
1. Check if you're on the specified branch (default: main)
2. Verify there are no uncommitted changes
3. Show current versions and prompt for the type of version bump (major, minor, patch, or custom)
4. Update versions in both package.json AND src/cli.js
5. Attempt to commit and push changes to GitHub (will fail if branch is protected)

If you don't use the --branch flag or if the script fails due to branch protection, you'll need to manually:
1. Add the changed files: `git add package.json src/cli.js`
2. Commit the changes: `git commit -m "Update version to x.y.z"`
3. Push the branch: `git push -u origin feature/version-update-x.y.z`
4. Create a tag: `git tag vx.y.z`
5. Push the tag: `git push origin vx.y.z`
6. Create a PR and merge it to main
7. GitHub Actions will publish the package when the tag is pushed

#### Non-Interactive Mode (for CI/CD)

For automated environments, use one of these non-interactive commands on a feature branch:

```bash
# Bump patch version (0.0.x)
npm run publish:patch -- --branch feature/version-update-x.y.z

# Bump minor version (0.x.0)
npm run publish:minor -- --branch feature/version-update-x.y.z

# Bump major version (x.0.0)
npm run publish:major -- --branch feature/version-update-x.y.z

# Test what would happen without making changes
npm run publish:dry-run
```

You can also use the publish script directly with more options:

```bash
# Specify a custom version
node scripts/publish.js --version 1.2.3 --yes --branch feature/version-update-1.2.3

# Allow publishing from a specific branch (REQUIRED with branch protection)
node scripts/publish.js --type minor --branch feature/my-branch --yes

# Skip git operations
node scripts/publish.js --type patch --no-git --yes
```

**IMPORTANT**: With main branch protection enabled:
1. Always use the `--branch` option to specify your feature branch name
2. When the script succeeds, create a PR to merge changes to main
3. GitHub Actions will publish when the tag is detected

### Manual Publishing (Not Recommended)

If you need to manually publish (avoid this if possible):
1. Create a feature branch: `git checkout -b feature/version-update-x.y.z`
2. Update the version in both package.json AND src/cli.js
3. Commit and push changes to GitHub
4. Create a new tag: `git tag vx.y.z && git push origin vx.y.z`
5. Create a PR and merge the changes to main
6. GitHub CI will automatically publish the package to npm when it detects the tag

❌ STRICTLY FORBIDDEN:
- NEVER run `npm publish` locally
- NEVER run `npm login` locally 
- NEVER attempt manual authentication or publishing
- NEVER share or expose npm credentials

These actions will ALWAYS fail and potentially expose credentials.

## Code Style Guidelines
- **Formatting**: Use 2-space indentation for JavaScript
- **Imports**: Use ES Modules (`import`/`export`) pattern with Node.js native modules prefixed with 'node:'
- **Error handling**: Use try/catch with descriptive error messages
- **Documentation**: Use JSDoc for function documentation with all parameters described
- **Naming**: Use camelCase for variables/functions
- **Structure**: Keep modules focused on single responsibilities
- **String replacement**: Use direct string replacement (`string.replace`)
- **Input validation**: Validate inputs at function start
- **Configuration**: Uses JavaScript module format (.js) for configuration files
- **Consistency**: Follow existing patterns in the codebase

## Project Structure
- **src/index.js**: Core patching functionality
- **src/cli.js**: Command-line interface
- **src/home-config.js**: Home directory configuration management
- **scripts/publish.js**: Automated version updating and publishing script
- **local-config.js**: Example JS config for patching local packages
- **example-config.js**: Example JavaScript module config with template literals
- **local-test-runner.js**: Script to test the patching results
- **test.js**: Simple test script for verifying patching functionality
- **test/home-config.test.js**: Test for home directory configuration feature
- **test/special-package-test.js**: Test for packages with special characters in names
- **test/fixtures/packages/is-even/**: Test package with special characters in name (@patcher-test/is-even)

## Testing
- `npm test`: Run full test suite (patch, verify, undo)
- `npm run test:patch`: Apply patches to local is-odd package
- `npm run test:undo`: Revert patches
- `npm run test:home-config`: Test home directory configuration feature
- `npm run test:special-package`: Test patching packages with special characters in names
- `node local-test-runner.js`: Test if patching was successful

When testing, ensure you:
1. Use same runtime (npm/node) for patching and testing
2. Clear Node.js module cache when testing modifications 
3. Run tests in expected order (test → patch → test → undo → test)
4. Verify that patches can be applied and undone correctly
5. Test with both regular and scoped package names (with @ and /)