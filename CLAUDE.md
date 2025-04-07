# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands
- Install: `npm install`
- Run: `node src/cli.js <config-file>` or `npm run patcher <config-file>`
- Test: `npm test`
- Patch test: `npm run test:patch`
- Undo patch test: `npm run test:undo`

## Publishing
⚠️ **EXTREMELY IMPORTANT**: NEVER attempt to publish with `npm publish` directly. ALWAYS use GitHub CI for publishing.

The package MUST be published ONLY through GitHub Actions CI. npm tokens are securely stored in GitHub Secrets.

To publish a new version:
1. Update the version in both package.json AND src/cli.js
2. Commit and push changes to GitHub
3. Create a new tag: `git tag v0.3.x && git push origin v0.3.x`
4. GitHub CI will automatically publish the package to npm

❌ NEVER run `npm publish` or `npm login` locally - this will fail and potentially expose credentials.

## Code Style Guidelines
- **Formatting**: Use 2-space indentation for JavaScript
- **Imports**: Use ES Modules (`import`/`export`) pattern
- **Error handling**: Use try/catch with descriptive error messages
- **Documentation**: Use JSDoc for function documentation
- **Naming**: Use camelCase for variables/functions
- **Structure**: Keep modules focused on single responsibilities
- **String replacement**: Use direct string replacement (`string.replace`)
- **Input validation**: Validate inputs at function start
- **Configuration**: JSON-based configuration for patching rules

## Project Structure
- **src/index.js**: Core patching functionality
- **src/cli.js**: Command-line interface
- **local-config.json**: Example config for patching local packages
- **local-test-runner.js**: Script to test the patching results

## Testing
- `npm test`: Test without patches
- `npm run test:patch`: Apply patches to local is-odd package
- `npm run test:undo`: Revert patches

When testing, ensure you:
1. Use same runtime (npm/node) for patching and testing
2. Clear Node.js module cache when testing modifications 
3. Run tests in expected order (test → patch → test → undo → test)