import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { sessionManager } from '../core/session-manager';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs/promises';
import * as child_process from 'child_process';
import { promisify } from 'util';

const exec = promisify(child_process.exec);

/**
 * Register module management tools with the MCP server
 * 
 * @param server The MCP server
 */
export function registerModuleTools(server: McpServer) {
  // Install an NPM package for use in the current session
  server.tool(
    'js-installModule',
    'Install an NPM package for use in the current session',
    {
      sessionId: z.string().describe('Session ID'),
      name: z.string().describe('Name of the package to install'),
      version: z.string().optional().describe('Specific version to install'),
    },
    async ({ sessionId, name, version }) => {
      try {
        // Get the session
        const session = sessionManager.getSession(sessionId);
        if (!session) {
          return {
            content: [
              {
                type: 'text',
                text: `Session not found: ${sessionId}`,
              },
            ],
            isError: true,
          };
        }
        
        // Create a directory for the session's modules if it doesn't exist
        if (!session.modulesPath) {
          const modulesDir = path.join(os.tmpdir(), `js-mcp-modules-${session.id}`);
          await fs.mkdir(modulesDir, { recursive: true });
          session.modulesPath = modulesDir;
          
          // Create a package.json if it doesn't exist
          const packageJsonPath = path.join(modulesDir, 'package.json');
          await fs.writeFile(packageJsonPath, JSON.stringify({
            name: `session-${session.id}-modules`,
            version: '1.0.0',
            description: 'Modules for a JavaScript MCP session',
            private: true
          }, null, 2));
        }
        
        // Initialize the installed modules array if it doesn't exist
        if (!session.installedModules) {
          session.installedModules = [];
        }
        
        // Install the package
        const packageSpec = version ? `${name}@${version}` : name;
        console.log(`Installing ${packageSpec} in ${session.modulesPath}...`);
        
        const startTime = Date.now();
        const { stdout, stderr } = await exec(`npm install ${packageSpec}`, {
          cwd: session.modulesPath,
          timeout: 60000 // 60 second timeout
        });
        
        // Track the installed module
        if (!session.installedModules.includes(name)) {
          session.installedModules.push(name);
        }
        
        // Build the response
        const installTime = Date.now() - startTime;
        return {
          content: [
            {
              type: 'text',
              text: `Successfully installed ${packageSpec} in ${installTime}ms.\n` +
                `You can now use it in your code with: require('${name}')\n\n` +
                `Installation details:\n${stdout}\n${stderr ? `Warnings/Errors:\n${stderr}` : ''}`
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text',
              text: `Error installing module: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
  
  // List installed modules in a session
  server.tool(
    'js-listModules',
    'List all NPM packages installed in the current session',
    {
      sessionId: z.string().describe('Session ID'),
    },
    async ({ sessionId }) => {
      try {
        // Get the session
        const session = sessionManager.getSession(sessionId);
        if (!session) {
          return {
            content: [
              {
                type: 'text',
                text: `Session not found: ${sessionId}`,
              },
            ],
            isError: true,
          };
        }
        
        // Check if any modules are installed
        if (!session.installedModules || session.installedModules.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: `No modules installed in session ${sessionId}.`,
              },
            ],
          };
        }
        
        // List the installed modules
        return {
          content: [
            {
              type: 'text',
              text: `Modules installed in session ${sessionId}:\n` +
                session.installedModules.map(module => `- ${module}`).join('\n'),
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text',
              text: `Error listing modules: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
