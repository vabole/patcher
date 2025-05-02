# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Workflow

### Branch and PR Strategy

1. **ALWAYS** follow this workflow for new features, bugfixes, or improvements:
   - Create a feature branch from main: `git checkout -b feature/my-feature`
   - Make changes on that branch
   - Push the branch: `git push -u origin feature/my-feature`
   - Create a PR with a clear, concise description of the changes
   - Merge the PR to main after review

2. **NEVER** commit directly to main, except for:
   - Version updates for publishing (done by the publish script)
   - Documentation updates that don't affect functionality
   
3. **PR Descriptions** should be clear and concise, explaining:
   - What was changed
   - Why it was changed
   - Any special considerations or implications for users

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
- Run with config file: `node src/cli.js <config-file>` or `npm run patcher <config-file>`
- Run with package name: `node src/cli.js <package-name>` (uses config from ~/.patcher)
- Create config: `node src/cli.js --create <package-name>` (creates in ~/.patcher)
- Test: `npm test`
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

#### Interactive Mode

To publish a new version using the interactive script:

```bash
npm run publish:version
```

This script will:
1. Check if you're on the main branch
2. Verify there are no uncommitted changes
3. Show current versions and prompt for the type of version bump (major, minor, patch, or custom)
4. Update versions in both package.json AND src/cli.js
5. Commit and push changes to GitHub
6. Create and push a tag matching the version
7. GitHub Actions will then automatically run tests and publish the package

#### Non-Interactive Mode (for CI/CD)

For automated environments, use one of these non-interactive commands:

```bash
# Bump patch version (0.0.x)
npm run publish:patch

# Bump minor version (0.x.0)
npm run publish:minor

# Bump major version (x.0.0)
npm run publish:major

# Test what would happen without making changes
npm run publish:dry-run
```

You can also use the publish script directly with more options:

```bash
# Specify a custom version
node scripts/publish.js --version 1.2.3 --yes

# Allow publishing from a different branch
node scripts/publish.js --type minor --branch feature/my-branch --yes

# Skip git operations
node scripts/publish.js --type patch --no-git --yes
```

### Manual Publishing (Not Recommended)

If you need to manually publish (avoid this if possible):
1. Update the version in both package.json AND src/cli.js
2. Commit and push changes to GitHub
3. Create a new tag: `git tag v0.3.x && git push origin v0.3.x`
4. GitHub CI will automatically publish the package to npm

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