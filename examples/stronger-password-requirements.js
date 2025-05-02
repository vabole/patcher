// stronger-password-requirements.js
export default {
  globalNpmPackage: "validator",
  targetFile: "lib/isStrongPassword.js", 
  beautify: true,
  replacements: [
    [
      `var defaultOptions = {
  minLength: 8,
  minLowercase: 1,
  minUppercase: 1,
  minNumbers: 1,
  minSymbols: 1,
  returnScore: false,
  pointsPerUnique: 1,
  pointsPerRepeat: 0.5,
  pointsForContainingLower: 10,
  pointsForContainingUpper: 10,
  pointsForContainingNumber: 10,
  pointsForContainingSymbol: 10
};`,
      `var defaultOptions = {
  minLength: 12,
  minLowercase: 1,
  minUppercase: 1,
  minNumbers: 2,
  minSymbols: 2,
  returnScore: false,
  pointsPerUnique: 1,
  pointsPerRepeat: 0.5,
  pointsForContainingLower: 10,
  pointsForContainingUpper: 10,
  pointsForContainingNumber: 10,
  pointsForContainingSymbol: 10
};` 
    ]
  ]
}