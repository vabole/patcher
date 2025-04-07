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

Create a configuration file (e.g., `patch-config.json` or `patch-config.js`):

```json
{
  "packagePath": "/path/to/node_modules/package-to-patch/dist/index.js",
  "beautify": true,
  "replacements": [
    ["original string 1", "replacement string 1"],
    ["original string 2", "replacement string 2"]
  ]
}
```

Or use a global npm package name:

```json
{
  "globalNpmPackage": "package-name",
  "relativePath": "index.js",
  "beautify": true,
  "replacements": [
    ["original string 1", "replacement string 1"],
    ["original string 2", "replacement string 2"]
  ]
}
```

### Apply Patches

```
npx @vabole/patcher patch-config.json
```

Or if installed globally:

```
patcher patch-config.json
```

### Undo Patches

```
npx @vabole/patcher --undo patch-config.json
```

Or if installed globally:

```
patcher --undo patch-config.json
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

## Configuration Formats

You can use either JSON or JavaScript module format for your configuration.

### JSON Format

```json
{
  "globalNpmPackage": "is-odd",
  "replacements": [
    ["original string", "replacement string"]
  ]
}
```

### JavaScript Module Format

```js
// patch-config.js
export default {
  globalNpmPackage: "is-odd",
  replacements: [
    [
      "original string", 
      `replacement string
      with multiple lines
      without escaping`
    ]
  ]
}
```

## Examples

### Basic Example

Patching the `is-odd` package to throw an error when zero is provided:

```json
{
  "globalNpmPackage": "is-odd",
  "replacements": [
    ["module.exports = function isOdd(value) {", "module.exports = function isOdd(value) {\n  if (value === 0) throw new Error('zero is not allowed');"]
  ]
}
```

### Patching a Specific File

When the package's entry point is not the file you want to patch, or when you want to patch a different file:

```json
{
  "globalNpmPackage": "@anthropic-ai/claude-code",
  "targetFile": "lib/main.js",
  "replacements": [
    ["function processInput(", "function processInput(\n  // Add custom validation\n"]
  ]
}
```

## Important Notes

- Patcher creates a backup file (`.backup`) before applying patches
- Only the first occurrence of each original string is replaced
- If any string is not found, the patch operation fails
- When patching global npm packages, use the same runtime (npm/node) for both patching and running your code
- For consistent results with globally installed packages, use `npm` for installation and `node` for execution
