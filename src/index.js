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
    
    // Check several possible paths for the package
    const possiblePaths = [
      // Standard path
      path.join(npmRootPath, packageName, relativePath),
      // GitHub Actions path structure (node version specific)
      path.join(npmRootPath, 'node_modules', packageName, relativePath),
      // Additional path pattern sometimes used in CI environments
      path.join(npmRootPath, 'is-odd', relativePath)
    ];
    
    for (const potentialPath of possiblePaths) {
      if (fs.existsSync(potentialPath)) {
        return potentialPath;
      }
    }
    
    // If we didn't find it in standard locations, output debug info
    console.log(`Debug info for locating package ${packageName}:`);
    console.log(`- NPM root: ${npmRootPath}`);
    console.log(`- Searched paths:`);
    possiblePaths.forEach(p => console.log(`  - ${p}`));
    
    try {
      const lsOutput = execSync(`ls -la ${npmRootPath}`).toString();
      console.log(`- Content of npm root:\n${lsOutput}`);
      
      // Try find command to locate package
      try {
        const findOutput = execSync(`find ${npmRootPath} -name ${packageName} -type d`).toString();
        console.log(`- Find results:\n${findOutput}`);
        
        if (findOutput.trim()) {
          // If find returned something, use the first result
          const foundPath = findOutput.trim().split('\n')[0];
          return path.join(foundPath, relativePath);
        }
      } catch (findErr) {
        console.log(`- Error running find: ${findErr.message}`);
      }
    } catch (lsErr) {
      console.log(`- Error listing npm root: ${lsErr.message}`);
    }
    
    // Fall back to the first path if nothing else worked
    return possiblePaths[0];
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
