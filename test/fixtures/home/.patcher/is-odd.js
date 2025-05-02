// Configuration for is-odd package
export default {
  packagePath: "node_modules/is-odd/index.js",
  beautify: false,
  replacements: [
    [
      "module.exports = function isOdd(value) {", 
      `module.exports = function isOdd(value) {
  // From ~/.patcher/is-odd.js
  if (value === 0) throw new Error('zero is not allowed from js config');`
    ]
  ]
}