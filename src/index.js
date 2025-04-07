const fs = require('fs');
const path = require('path');
const beautify = require('js-beautify').js;

/**
 * Apply patches to a file
 * @param {Object} config Configuration object
 * @param {string} config.packagePath Path to the package to patch
 * @param {Array<Array<string>>} config.replacements Array of [original, replacement] pairs
 */
function applyPatch(config) {
  if (!config.packagePath) {
    throw new Error('packagePath is required in config');
  }
  
  if (!Array.isArray(config.replacements)) {
    throw new Error('replacements must be an array');
  }
  
  // Read the file
  const filePath = path.resolve(config.packagePath);
  let fileContent = fs.readFileSync(filePath, 'utf8');
  
  // Create backup file if it doesn't exist
  const backupPath = `${filePath}.backup`;
  if (!fs.existsSync(backupPath)) {
    fs.writeFileSync(backupPath, fileContent, 'utf8');
  }
  
  // Beautify if needed
  if (config.beautify !== false) {
    fileContent = beautify(fileContent, {
      indent_size: 2,
      space_in_empty_paren: true
    });
  }
  
  // Apply each replacement
  let success = true;
  const replacementResults = [];
  
  for (const [original, replacement] of config.replacements) {
    if (!fileContent.includes(original)) {
      replacementResults.push({
        original,
        found: false,
        error: 'String not found in file'
      });
      success = false;
      continue;
    }
    
    // Replace only the first occurrence
    fileContent = fileContent.replace(original, replacement);
    replacementResults.push({
      original,
      found: true,
      replaced: true
    });
  }
  
  if (!success) {
    throw new Error('Not all replacements could be applied: ' + 
      JSON.stringify(replacementResults.filter(r => !r.found), null, 2));
  }
  
  // Write the patched file
  fs.writeFileSync(filePath, fileContent, 'utf8');
  
  return {
    success: true,
    replacements: replacementResults
  };
}

/**
 * Undo patches by restoring from backup
 * @param {Object} config Configuration object
 * @param {string} config.packagePath Path to the package to patch
 */
function undoPatch(config) {
  if (!config.packagePath) {
    throw new Error('packagePath is required in config');
  }
  
  const filePath = path.resolve(config.packagePath);
  const backupPath = `${filePath}.backup`;
  
  if (!fs.existsSync(backupPath)) {
    throw new Error('No backup file found. Cannot undo patches.');
  }
  
  const backupContent = fs.readFileSync(backupPath, 'utf8');
  fs.writeFileSync(filePath, backupContent, 'utf8');
  
  return { success: true };
}

module.exports = {
  applyPatch,
  undoPatch
};
