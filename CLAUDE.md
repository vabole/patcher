# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands
- Install: `npm install`
- Run: `node src/cli.js <config-file>` or `npm run patcher <config-file>`
- Test: `npm test`
- Patch test: `npm run test:patch`
- Undo patch test: `npm run test:undo`

## Code Style Guidelines
- **Formatting**: Use 2-space indentation for JavaScript
- **Imports**: Use CommonJS (`require`/`module.exports`) pattern
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