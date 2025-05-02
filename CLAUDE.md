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

### Publishing a New Version

To publish a new version, just run **one** of these commands from the main branch:

```bash
npm run publish:patch  # For bug fixes (1.2.3 → 1.2.4)
npm run publish:minor  # For new features (1.2.0 → 1.3.0)
npm run publish:major  # For breaking changes (1.0.0 → 2.0.0)
```

This single command will:
1. Create a feature branch
2. Update versions in package.json and src/cli.js
3. Commit and push changes
4. Create and push a version tag
5. Create a PR using GitHub CLI

Then just:
1. Wait for CI checks to pass on the PR
2. Merge the PR to main
3. The package is automatically published when GitHub Actions detects the tag

That's it!

#### What Triggers Publishing?

Publishing happens automatically when GitHub Actions detects:
- A tag that starts with "v" (e.g., v2.1.0)

#### Options for Special Cases

For more control in special situations:
```bash
# Specify exact version
npm run publish:version -- --version 3.0.0 --yes

# Dry run (no changes)
npm run publish:dry-run
```

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

## Development Best Practices

### Safety and Quality Checks
- 🔴 **NEVER bypass or disable safety checks**, linting, or tests
- 🔴 **NEVER ignore failing tests** - always fix the underlying issue
- If a check is failing, it's likely protecting you from introducing a bug or inconsistency
- Address the root cause of issues rather than working around them

### Temporary Files
- Always clean up temporary files and branches after creating them
- Don't leave test artifacts in the repository
- Use `git clean -n` to preview what would be removed before running `git clean -f`
- Be especially careful when generating files in test directories

### Error Handling
- When encountering errors, solve the underlying issue rather than bypassing them
- If you hit a CI failure, diagnose and fix the root cause 
- Consider whether errors indicate design issues that need addressing

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