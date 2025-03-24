import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { executeJavaScript } from '../core/executor';
import { ExecutionOptions } from '../types';

/**
 * Register JavaScript execution tools with the MCP server
 * 
 * @param server The MCP server
 */
export function registerExecutionTools(server: McpServer) {
  // Tool for one-time JavaScript execution
  server.tool(
    'js-execute',
    'Execute JavaScript code and return the result',
    {
      code: z.string().describe('The JavaScript code to execute'),
      timeout: z.number().optional().describe('Maximum execution time in milliseconds'),
      awaitPromises: z.boolean().optional().describe('Whether to automatically await promises'),
    },
    async ({ code, timeout, awaitPromises }) => {
      const options: ExecutionOptions = {
        timeout,
        awaitPromises,
      };
      
      try {
        const result = await executeJavaScript(code, {}, options);
        
        // Format the result for display
        let resultStr: string;
        try {
          resultStr = JSON.stringify(result.result, null, 2);
        } catch (err) {
          resultStr = String(result.result);
        }
        
        // Build the response
        let response = '';
        
        // Add console output if any
        if (result.consoleOutput) {
          response += `Console Output:\n${result.consoleOutput}\n\n`;
        }
        
        // Add execution result
        response += `Execution Result (${result.resultType}):\n${resultStr}\n\n`;
        
        // Add execution time
        response += `Execution Time: ${result.executionTime}ms`;
        
        // If there was an error, include it
        if (!result.success && result.error) {
          response += `\n\nError: ${result.error.message}\n`;
          if ('stack' in result.error) {
            response += `\nStack Trace:\n${result.error.stack}\n`;
          }
        }
        
        return {
          content: [
            {
              type: 'text',
              text: response,
            },
          ],
          isError: !result.success,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text',
              text: `Error executing JavaScript code: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
