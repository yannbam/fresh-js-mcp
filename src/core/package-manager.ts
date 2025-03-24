import * as childProcess from 'child_process';
import * as path from 'path';
import { PackageResult } from '../types';
import * as fs from 'fs/promises';
import * as os from 'os';

/**
 * Directory where npm packages will be cached
 */
const PACKAGE_CACHE_DIR = path.join(os.tmpdir(), 'js-mcp-packages');

/**
 * Manage NPM packages
 */
export class PackageManager {
  private initialized: boolean = false;
  
  /**
   * Initialize the package manager
   */
  public async initialize(): Promise<void> {
    // Create cache directory if it doesn't exist
    try {
      await fs.mkdir(PACKAGE_CACHE_DIR, { recursive: true });
      this.initialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize package cache: ${error}`);
    }
  }
  
  /**
   * Install an NPM package
   * 
   * @param packageName Name of the package to install
   * @param version Specific version to install
   * @param timeout Installation timeout in milliseconds
   * @returns Result of the installation
   */
  public async installPackage(
    packageName: string,
    version?: string,
    timeout: number = 60000,
  ): Promise<PackageResult> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const startTime = Date.now();
    const result: PackageResult = {
      success: false,
      packageName,
      version,
    };
    
    // Format the package spec
    const packageSpec = version ? `${packageName}@${version}` : packageName;
    
    // Try to find package in cache first
    const cachedPath = await this.findPackageInCache(packageName, version);
    if (cachedPath) {
      result.success = true;
      result.operationTime = Date.now() - startTime;
      return result;
    }
    
    // Install the package
    try {
      await this.executeNpmCommand(['install', packageSpec, '--no-save'], timeout);
      
      result.success = true;
      result.operationTime = Date.now() - startTime;
      return result;
    } catch (error) {
      result.error = error as Error;
      result.operationTime = Date.now() - startTime;
      return result;
    }
  }
  
  /**
   * Find a package in the package cache directory
   * 
   * @param packageName Name of the package to find
   * @returns Path to the package or undefined if not found
   */
  public async findPackage(packageName: string): Promise<string | undefined> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    // First check in the cache directory - this is where we install packages
    return this.findPackageInCache(packageName);
  }
  
  /**
   * Find a package in the cache directory
   * 
   * @param packageName Name of the package to find
   * @param version Specific version to find
   * @returns Path to the package or undefined if not found
   */
  private async findPackageInCache(
    packageName: string,
    version?: string,
  ): Promise<string | undefined> {
    // Check in cache directory
    try {
      const packageDir = path.join(PACKAGE_CACHE_DIR, 'node_modules', packageName);
      await fs.access(packageDir);
      
      // If no specific version requested, return the cached version
      if (!version) {
        return packageDir;
      }
      
      // Check if this is the requested version
      try {
        const packageJson = JSON.parse(
          await fs.readFile(path.join(packageDir, 'package.json'), 'utf8'),
        );
        
        if (packageJson.version === version) {
          return packageDir;
        }
      } catch {
        // If we can't read the package.json, just return undefined
      }
    } catch {
      // Package not found in cache
    }
    
    return undefined;
  }
  
  /**
   * Execute an npm command
   * 
   * @param args Command arguments
   * @param timeout Command timeout in milliseconds
   * @returns Command output
   */
  private executeNpmCommand(args: string[], timeout: number): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const cmdArgs = [...args, '--prefix', PACKAGE_CACHE_DIR];
      const process = childProcess.spawn('npm', cmdArgs);
      
      let output = '';
      let errorOutput = '';
      
      process.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      process.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      // Handle timeout
      const timer = setTimeout(() => {
        process.kill();
        reject(new Error(`Command timed out after ${timeout}ms: npm ${args.join(' ')}`));
      }, timeout);
      
      process.on('close', (code) => {
        clearTimeout(timer);
        
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`Command failed with code ${code}: ${errorOutput}`));
        }
      });
      
      process.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });
  }
}

// Create a singleton instance
export const packageManager = new PackageManager();
