import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { typescriptTranspiler } from '../core/typescript-transpiler';
import { executeJavaScript } from '../core/executor';

/**
 * Register TypeScript tools with the MCP server
 * 
 * @param server The MCP server
 */
export function registerTypeScriptTools(server: McpServer) {
  // Transpile TypeScript to JavaScript
  server.tool(
    'js-transpile',
    'Transpile TypeScript code to JavaScript',
    {
      code: z.string().describe('TypeScript code to transpile'),
      filename: z.string().optional().default('script.ts').describe('Optional filename for source maps'),
      checkTypes: z.boolean().optional().default(true).describe('Whether to check types'),
      sourceMap: z.boolean().optional().default(true).describe('Whether to generate source maps'),
    },
    async ({ code, filename, checkTypes, sourceMap }) => {
      try {
        const result = await typescriptTranspiler.transpile(code, filename, {
          checkTypes,
          sourceMap,
        });
        
        if (result.success && result.jsCode) {
          return {
            content: [
              {
                type: 'text',
                text: `// Transpiled JavaScript code:\n${result.jsCode}${
                  result.sourceMap
                    ? '\n\n// Source Map:\n' + result.sourceMap
                    : ''
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
                text: `TypeScript transpilation failed:\n${errorMessage}`,
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
              text: `Error transpiling TypeScript: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
  
  // Execute TypeScript code directly
  server.tool(
    'js-executeTypeScript',
    'Execute TypeScript code (transpile + execute)',
    {
      code: z.string().describe('TypeScript code to execute'),
      timeout: z.number().optional().describe('Maximum execution time in milliseconds'),
      awaitPromises: z.boolean().optional().describe('Whether to automatically await promises'),
      checkTypes: z.boolean().optional().default(true).describe('Whether to check types during transpilation'),
    },
    async ({ code, timeout, awaitPromises, checkTypes }) => {
      try {
        // First transpile TypeScript to JavaScript
        const transpileResult = await typescriptTranspiler.transpile(code, 'script.ts', {
          checkTypes,
          sourceMap: true,
        });
        
        if (!transpileResult.success || !transpileResult.jsCode) {
          const errorMessage = transpileResult.error?.message || 'Unknown error';
          return {
            content: [
              {
                type: 'text',
                text: `TypeScript transpilation failed:\n${errorMessage}`,
              },
            ],
            isError: true,
          };
        }
        
        // Now modify the JavaScript code to add a return statement if needed
        // If the last line looks like an expression but doesn't have a return or semicolon, add a return
        let jsCode = transpileResult.jsCode;
        const lines = jsCode.split('\n').filter(line => line.trim() !== '');
        if (lines.length > 0) {
          const lastLine = lines[lines.length - 1].trim();
          // If last non-empty line doesn't end with semicolon and doesn't have return, add return
          if (!lastLine.endsWith(';') && !lastLine.startsWith('return ') && 
              !lastLine.includes('function') && !lastLine.includes('class') && 
              !lastLine.includes('{') && !lastLine.includes('}')) {
            // Replace the last line with 'return' + lastLine
            lines[lines.length - 1] = 'return ' + lastLine;
            jsCode = lines.join('\n');
          }
        }
        
        // Then execute the JavaScript
        const executeResult = await executeJavaScript(
          jsCode,
          {},
          { timeout, awaitPromises },
        );
        
        // Format the result for display
        let resultStr: string;
        try {
          resultStr = JSON.stringify(executeResult.result, null, 2);
        } catch (err) {
          resultStr = String(executeResult.result);
        }
        
        // Build the response
        let response = '';
        
        // Add console output if any
        if (executeResult.consoleOutput && executeResult.consoleOutput.trim()) {
          response += `Console Output:\n${executeResult.consoleOutput}\n\n`;
        }
        
        // Add execution result
        response += `Execution Result (${executeResult.resultType}):\n${resultStr}\n\n`;
        
        // Add execution time
        response += `Execution Time: ${executeResult.executionTime}ms`;
        
        // If there was an error, include it
        if (!executeResult.success && executeResult.error) {
          response += `\n\nError: ${executeResult.error.message}\n`;
          if ('stack' in executeResult.error) {
            response += `\nStack Trace:\n${executeResult.error.stack}\n`;
          }
        }
        
        return {
          content: [
            {
              type: 'text',
              text: response,
            },
          ],
          isError: !executeResult.success,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text',
              text: `Error executing TypeScript: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
