# Patcher

A tool for monkey-patching installed npm packages without modifying their source code repositories.

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

## Usage

There are two ways to use patcher:

1. **Configuration File Approach**: Create and specify a configuration file
2. **Package Name Approach**: Use package names directly with configurations stored in `~/.patcher/`

### Option 1: Using Configuration Files

Create a JavaScript configuration file (e.g., `patch-config.js`):

```js
// patch-config.js
export default {
  packagePath: "/path/to/node_modules/package-to-patch/dist/index.js",
  beautify: true,
  replacements: [
    ["original string 1", "replacement string 1"],
    ["original string 2", "replacement string 2"]
  ]
}
```

Or use a global npm package name:

```js
// patch-config.js
export default {
  globalNpmPackage: "package-name",
  relativePath: "index.js",
  beautify: true,
  replacements: [
    ["original string 1", "replacement string 1"],
    ["original string 2", "replacement string 2"]
  ]
}
```

#### Apply Patches with Config File

```
npx @vabole/patcher patch-config.js
```

Or if installed globally:

```
patcher patch-config.js
```

#### Undo Patches with Config File

```
npx @vabole/patcher --undo patch-config.js
```

Or if installed globally:

```
patcher --undo patch-config.js
```

### Option 2: Using Package Names Directly

You can store package configurations in your home directory at `~/.patcher/` and use package names directly.

#### Create a Configuration File

```
patcher --create is-odd
```

This creates a default configuration file at `~/.patcher/is-odd.js` that you can edit to add your replacements.

#### Apply Patches with Package Name

```
patcher is-odd
```

#### Undo Patches with Package Name

```
patcher --undo is-odd
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

## Examples

### Basic Example

Patching the `is-odd` package to throw an error when zero is provided:

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

When the package's entry point is not the file you want to patch, or when you want to patch a different file:

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
