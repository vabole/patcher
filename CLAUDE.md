# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

To publish a new version:
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
- **local-config.js**: Example JS config for patching local packages
- **example-config.js**: Example JavaScript module config with template literals
- **local-test-runner.js**: Script to test the patching results
- **test.js**: Simple test script for verifying patching functionality
- **test/home-config.test.js**: Test for home directory configuration feature

## Testing
- `npm test`: Run full test suite (patch, verify, undo)
- `npm run test:patch`: Apply patches to local is-odd package
- `npm run test:undo`: Revert patches
- `node local-test-runner.js`: Test if patching was successful

When testing, ensure you:
1. Use same runtime (npm/node) for patching and testing
2. Clear Node.js module cache when testing modifications 
3. Run tests in expected order (test → patch → test → undo → test)
4. Verify that patches can be applied and undone correctly