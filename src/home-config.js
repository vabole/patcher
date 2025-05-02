import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

/**
 * Gets the home directory path, with support for test override
 * @returns {string} The home directory path
 */
export function getHomeDir() {
  return process.env.PATCHER_TEST_HOME || os.homedir();
}

/**
 * Gets the path to the patcher configuration directory in the user's home directory
 * @returns {string} Path to the configuration directory
 */
export function getConfigDir() {
  const homeDir = getHomeDir();
  return path.join(homeDir, '.patcher');
}

/**
 * Sanitizes a package name to create a valid filename
 * Converts special characters like @ and / to _ and -
 * @param {string} packageName The package name to sanitize
 * @returns {string} A sanitized filename-safe version of the package name
 */
export function sanitizePackageName(packageName) {
  // Replace @ with _at_
  // Replace / with --
  // Replace any other invalid characters with _
  return packageName
    .replace(/@/g, '_at_')
    .replace(/\//g, '--')
    .replace(/[^a-zA-Z0-9_\-]/g, '_');
}

/**
 * Checks if a configuration file exists for the given package
 * @param {string} packageName Name of the npm package
 * @returns {string|null} Path to the configuration file, or null if none exists
 */
export function findPackageConfig(packageName) {
  const configDir = getConfigDir();
  
  // Check if the configuration directory exists
  if (!fs.existsSync(configDir)) {
    return null;
  }
  
  // Sanitize package name for filename
  const safePackageName = sanitizePackageName(packageName);
  
  // Only use JavaScript module format
  const jsPath = path.join(configDir, `${safePackageName}.js`);
  if (fs.existsSync(jsPath)) {
    return jsPath;
  }
  
  return null;
}

/**
 * Loads the configuration for the given package
 * @param {string} packageName Name of the npm package
 * @returns {Promise<Object|null>} Configuration object or null if not found
 */
export async function loadPackageConfig(packageName) {
  const configPath = findPackageConfig(packageName);
  
  if (!configPath) {
    return null;
  }
  
  try {
    // Import JavaScript module
    const config = (await import(path.resolve(configPath))).default;
    
    // Ensure globalNpmPackage is set if it isn't already
    if (!config.globalNpmPackage && !config.packagePath) {
      config.globalNpmPackage = packageName;
    }
    
    return config;
  } catch (error) {
    throw new Error(`Failed to load configuration for ${packageName}: ${error.message}`);
  }
}

/**
 * Creates a default configuration file for the given package
 * @param {string} packageName Name of the npm package
 * @returns {Promise<string>} Path to the created configuration file
 */
export async function createDefaultConfig(packageName) {
  const configDir = getConfigDir();
  
  // Create the configuration directory if it doesn't exist
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  // Sanitize package name for filename
  const safePackageName = sanitizePackageName(packageName);
  const configPath = path.join(configDir, `${safePackageName}.js`);
  
  // Create a default configuration file
  const defaultConfigContent = `// Configuration for ${packageName} package
export default {
  globalNpmPackage: "${packageName}",
  beautify: true,
  replacements: [
    [
      "// Add your replacements here", 
      "// Modified by patcher"
    ]
  ]
}`;
  
  fs.writeFileSync(configPath, defaultConfigContent, 'utf8');
  
  return configPath;
}