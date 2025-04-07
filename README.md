# Patcher

A simple tool for monkey-patching installed npm packages.

## Installation

```
npm install -g patcher
```

## Usage

Create a configuration file (e.g., `patch-config.json`):

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

Then run:

```
patcher patch-config.json
```

To undo patches:

```
patcher --undo patch-config.json
```

## Configuration

- `packagePath`: Path to the file you want to patch
- `beautify`: (Optional) Whether to beautify the code before patching (default: true)
- `replacements`: Array of [original, replacement] string pairs

## Notes

- Patcher creates a backup file before applying patches
- Only the first occurrence of each original string is replaced
- If any string is not found, the patch operation fails
