import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import jsBeautify from 'js-beautify';

const beautify = jsBeautify.js;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Get the file path for a global npm package
 * @param {string} packageName Name of the global npm package
 * @param {string} [relativePath='index.js'] Relative path within the package
 * @param {string} [targetFile] Specific file to patch, overriding normal entry point resolution
 * @returns {string} Absolute path to the package file
 */
export function getGlobalPackagePath(packageName, relativePath = 'index.js', targetFile) {
  try {
    const npmRootPath = execSync('npm root -g').toString().trim();
    
    // If targetFile is provided, use it directly
    if (targetFile) {
      return path.join(npmRootPath, packageName, targetFile);
    }
    
    return path.join(npmRootPath, packageName, relativePath);
  } catch (error) {
    throw new Error(`Failed to locate global package ${packageName}: ${error.message}`);
  }
}

/**
 * Apply patches to a file
 * @param {Object} config Configuration object
 * @param {string} [config.packagePath] Path to the package to patch
 * @param {string} [config.globalNpmPackage] Name of the global npm package to patch
 * @param {string} [config.relativePath] Relative path within the package (default: 'index.js')
 * @param {string} [config.targetFile] Specific file to patch, overriding normal entry point resolution
 * @param {Array<Array<string>>} config.replacements Array of [original, replacement] pairs
 */
export function applyPatch(config) {
  let filePath;
  
  if (config.globalNpmPackage) {
    filePath = getGlobalPackagePath(config.globalNpmPackage, config.relativePath, config.targetFile);
  } else if (config.packagePath) {
    filePath = path.resolve(config.packagePath);
  } else {
    throw new Error('Either packagePath or globalNpmPackage is required in config');
  }
  
  if (!Array.isArray(config.replacements)) {
    throw new Error('replacements must be an array');
  }
  
  // Read the file
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
 * @param {string} [config.packagePath] Path to the package to patch
 * @param {string} [config.globalNpmPackage] Name of the global npm package to patch
 * @param {string} [config.relativePath] Relative path within the package (default: 'index.js')
 * @param {string} [config.targetFile] Specific file to patch, overriding normal entry point resolution
 */
export function undoPatch(config) {
  let filePath;
  
  if (config.globalNpmPackage) {
    filePath = getGlobalPackagePath(config.globalNpmPackage, config.relativePath, config.targetFile);
  } else if (config.packagePath) {
    filePath = path.resolve(config.packagePath);
  } else {
    throw new Error('Either packagePath or globalNpmPackage is required in config');
  }
  
  const backupPath = `${filePath}.backup`;
  
  if (!fs.existsSync(backupPath)) {
    throw new Error('No backup file found. Cannot undo patches.');
  }
  
  const backupContent = fs.readFileSync(backupPath, 'utf8');
  fs.writeFileSync(filePath, backupContent, 'utf8');
  
  return { success: true };
}
