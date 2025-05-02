# Patcher

Ever needed to fix a bug in a dependency but didn't want to fork the whole repo? Patcher lets you modify npm packages in your node_modules without touching the original source.

It's like hot-patching in production, but for your dependencies:

- Fix that one annoying bug in a package that's blocking you
- Add that missing feature you need without maintaining a fork
- Test your changes before submitting a PR upstream
- Apply the same patches across your team or in CI

Patcher makes it easy to:

1. Create a configuration for a package: `patcher --create package-name`
2. Edit the generated config file to define your patches
3. Apply patches with a simple command: `patcher package-name`
4. Undo patches when needed: `patcher --undo package-name`

And when the package finally gets updated, just remove the patch and move on.

## Installation

```
npm install -g @vabole/patcher
```

**Note:** Requires Node.js 22 or newer.

For local development:
```
git clone https://github.com/vabole/patcher.git
cd patcher
npm install
```

### Developer Setup

When you install the package locally with `npm install`, git hooks will be automatically set up to protect the main branch from direct commits. If you need to set them up manually:

```
npm run setup-git-hooks
```

This configures a pre-commit hook that prevents accidental direct commits to the main branch, enforcing the proper workflow through pull requests.

#### Development Workflow

1. Create a feature branch for your changes:
   ```
   git checkout -b feature/my-feature
   ```

2. Make your changes and commit them to your branch:
   ```
   git add .
   git commit -m "Description of your changes"
   ```

3. Push your branch and create a PR:
   ```
   git push -u origin feature/my-feature
   gh pr create
   ```

## Usage

Patcher uses package names directly with configurations stored in `~/.patcher/`. You can also use specific configuration files with the `--file` option.

> **Migration Note (v2.0.0)**: The CLI has been streamlined to use package names as the primary approach. If you were previously using the configuration file approach directly, you now need to specify the `--file` flag: `patcher package-name --file config-file.js`.

### Create a Configuration File

```
patcher --create is-odd
```

This creates a default configuration file at `~/.patcher/is-odd.js` that you can edit to add your replacements.

### Apply Patches

```
patcher is-odd
```

### Undo Patches

```
patcher --undo is-odd
```

### Using a Specific Configuration File

You can also use a specific configuration file instead of the one in `~/.patcher/`:

```
patcher is-odd --file ./my-is-odd-config.js
```

This is useful for one-off patches or when sharing configurations across teams without modifying `~/.patcher/`.

### Configuration File Format

Create a JavaScript configuration file (e.g., `is-odd-config.js`):

```js
// JavaScript module format (.js files)
export default {
  globalNpmPackage: "is-odd",
  beautify: true,
  replacements: [
    ["original string 1", "replacement string 1"],
    ["original string 2", "replacement string 2"]
  ]
}
```

Or specify a direct path:

```js
export default {
  packagePath: "/path/to/node_modules/is-odd/index.js",
  beautify: true,
  replacements: [
    ["original string 1", "replacement string 1"],
    ["original string 2", "replacement string 2"]
  ]
}
```

## Configuration Options

| Option | Type | Description |
| ------ | ---- | ----------- |
| `packagePath` | string | Path to the file you want to patch |
| `globalNpmPackage` | string | Name of the global npm package to patch (alternative to packagePath) |
| `relativePath` | string | (Optional) Relative path within the package (default: 'index.js') |
| `targetFile` | string | (Optional) Specific file to patch, overriding normal entry point resolution |
| `beautify` | boolean | (Optional) Whether to beautify the code before patching (default: true) |
| `replacements` | array | Array of [original, replacement] string pairs |

## Home Directory Configuration

When using package names directly, patcher looks for configuration files in the `~/.patcher/` directory:

- `~/.patcher/<package-name>.js` - JavaScript module configuration file

### Creating Default Configuration

You can create a default configuration file with:

```
patcher --create <package-name>
```

This generates a JavaScript configuration file that you can edit to add your specific replacements.

## Configuration Format

Configuration files must use JavaScript module format (`.js` files):

```js
// package-name.js
export default {
  globalNpmPackage: "package-name",
  // or packagePath: "/path/to/file.js",
  beautify: true,  // optional, defaults to true
  relativePath: "path/within/package", // optional, defaults to "index.js"
  targetFile: "specific/file.js", // optional, overrides default path resolution
  replacements: [
    [
      "original string", 
      `replacement string
      with multiple lines
      without escaping`
    ],
    ["another string to replace", "replacement"]
  ]
}
```

## Real-World Use Cases

Patcher shines when you need to make quick modifications to dependencies without forking them or waiting for upstream changes. Here are some common scenarios where Patcher is invaluable:

### Customizing Error Messages

Improve error messages to be more user-friendly by patching the `validator` package:

```js
// validator-error-message.js
export default {
  globalNpmPackage: "validator",
  targetFile: "lib/util/assertString.js",
  replacements: [
    [
      `throw new TypeError("Expected a string but received a ".concat(invalidType));`,
      `throw new TypeError("Validation failed: Please provide a valid text value instead of a ".concat(invalidType));`
    ]
  ]
}
```

### Enhancing Security Requirements

Strengthen password requirements in your application by patching validation defaults:

```js
// stronger-password-requirements.js
export default {
  globalNpmPackage: "validator",
  targetFile: "lib/isStrongPassword.js",
  replacements: [
    [
      `minLength: 8,
  minLowercase: 1,
  minUppercase: 1,
  minNumbers: 1,
  minSymbols: 1,`,
      `minLength: 12,
  minLowercase: 1,
  minUppercase: 1,
  minNumbers: 2,
  minSymbols: 2,`
    ]
  ]
}
```

### Enforcing Company Email Policies

Restrict email validation to only allow specific company domains:

```js
// company-email-policy.js
export default {
  globalNpmPackage: "validator",
  targetFile: "lib/isEmail.js", 
  replacements: [
    [
      `host_whitelist: []`,
      `host_whitelist: ['yourcompany.com', 'yourcompany.org']  // Only allow company domains`
    ]
  ]
}
```

### Fixing Bugs in Dependencies

Add missing functionality to packages while waiting for official fixes:

```js
// is-odd.js
export default {
  globalNpmPackage: "is-odd",
  replacements: [
    [
      "module.exports = function isOdd(value) {", 
      `module.exports = function isOdd(value) {
  if (value === 0) throw new Error('zero is not allowed');`
    ]
  ]
}
```

### Patching a Specific File

When the package's entry point is not the file you want to patch:

```js
// claude-code.js
export default {
  globalNpmPackage: "@anthropic-ai/claude-code",
  targetFile: "lib/main.js",
  replacements: [
    [
      "function processInput(", 
      `function processInput(
  // Add custom validation`
    ]
  ]
}
```

## Important Notes

- Patcher creates a backup file (`.backup`) before applying patches
- Only the first occurrence of each original string is replaced
- If any string is not found, the patch operation fails
- When patching global npm packages, use the same runtime (npm/node) for both patching and running your code
- For consistent results with globally installed packages, use `npm` for installation and `node` for execution
