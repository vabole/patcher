// Example configuration using JavaScript module
export default {
  globalNpmPackage: "is-odd",
  beautify: true,
  targetFile: "lib/main.js",
  // Replacements can use template literals for multiline strings
  replacements: [
    [
      "module.exports = function isOdd(value) {", 
      `module.exports = function isOdd(value) {
  // Custom patch to validate zero input
  if (value === 0) throw new Error('zero is not allowed');`
    ]
  ]
}