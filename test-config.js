/**
 * Shared test configuration for patching is-odd package
 * Used by all test scripts to ensure consistent behavior
 */
export default {
  // Package details
  packagePath: "./node_modules/is-odd", // Use local package from devDependencies
  beautify: false,
  
  // Patches to apply
  replacements: [
    [
      "module.exports = function isOdd(value) {", 
      `module.exports = function isOdd(value) {
  if (value === 0) throw new Error('zero is not allowed');`
    ]
  ]
}