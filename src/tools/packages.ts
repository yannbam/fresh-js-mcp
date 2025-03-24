import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { packageManager } from '../core/package-manager';

/**
 * Register package management tools with the MCP server
 * 
 * @param server The MCP server
 */
export function registerPackageTools(server: McpServer) {
  // Initialize package manager
  packageManager.initialize().catch((error) => {
    console.error('Failed to initialize package manager:', error);
  });
  
  // Install an NPM package
  server.tool(
    'js-installPackage',
    'Install an NPM package',
    {
      name: z.string().describe('Name of the package to install'),
      version: z.string().optional().describe('Specific version to install'),
      timeout: z.number().optional().default(60000).describe('Installation timeout in milliseconds'),
    },
    async ({ name, version, timeout }) => {
      try {
        const result = await packageManager.installPackage(name, version, timeout);
        
        if (result.success) {
          return {
            content: [
              {
                type: 'text',
                text: `Successfully installed package ${name}${version ? `@${version}` : ''} in ${
                  result.operationTime ? `${result.operationTime}ms` : 'an unknown time'
                }`,
              },
            ],
          };
        } else {
          const errorMessage = result.error?.message || 'Unknown error';
          return {
            content: [
              {
                type: 'text',
                text: `Failed to install package ${name}${version ? `@${version}` : ''}: ${errorMessage}`,
              },
            ],
            isError: true,
          };
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text',
              text: `Error installing package ${name}: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
  
  // Check if a package is installed
  server.tool(
    'js-findPackage',
    'Check if an NPM package is installed',
    {
      name: z.string().describe('Name of the package to find'),
    },
    async ({ name }) => {
      try {
        const packagePath = await packageManager.findPackage(name);
        
        if (packagePath) {
          return {
            content: [
              {
                type: 'text',
                text: `Package ${name} is installed at ${packagePath}`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `Package ${name} is not installed. Use the installPackage tool to install it.`,
              },
            ],
          };
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text',
              text: `Error checking package ${name}: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
