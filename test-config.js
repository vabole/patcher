/**
 * Shared test configuration for patching is-odd package
 * Used by all test scripts to ensure consistent behavior
 */
export default {
  // Package details
  globalNpmPackage: "is-odd",
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