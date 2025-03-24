import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { sessionManager } from '../core/session-manager';
import { ExecutionOptions, Session } from '../types';

/**
 * Register REPL session tools with the MCP server
 * 
 * @param server The MCP server
 */
export function registerSessionTools(server: McpServer) {
  // Create a new REPL session
  server.tool(
    'createSession',
    'Create a new JavaScript REPL session',
    {
      expiresIn: z.number().optional().describe('Session expiration time in milliseconds (default: 1 hour)'),
    },
    async ({ expiresIn }) => {
      try {
        const session = sessionManager.createSession({
          expiresIn,
        });
        
        return {
          content: [
            {
              type: 'text',
              text: `Created new session with ID: ${session.id}\n`
                + `Session will expire after ${expiresIn || 3600000}ms of inactivity.`,
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text',
              text: `Error creating session: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
  
  // Execute code in a session
  server.tool(
    'executeInSession',
    'Execute JavaScript code in an existing REPL session',
    {
      sessionId: z.string().describe('Session ID'),
      code: z.string().describe('The JavaScript code to execute'),
      timeout: z.number().optional().describe('Maximum execution time in milliseconds'),
      awaitPromises: z.boolean().optional().describe('Whether to automatically await promises'),
    },
    async ({ sessionId, code, timeout, awaitPromises }) => {
      try {
        // Check if session exists
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
        
        const options: ExecutionOptions = {
          timeout,
          awaitPromises,
        };
        
        const result = await sessionManager.executeInSession(sessionId, code, options);
        
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
              text: `Error executing code in session: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
  
  // List all active sessions
  server.tool(
    'listSessions',
    'List all active REPL sessions',
    {},
    async () => {
      try {
        const sessions = sessionManager.getAllSessions();
        
        if (sessions.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: 'No active sessions found.',
              },
            ],
          };
        }
        
        const sessionInfo = sessions.map((session: Session) => {
          const age = new Date().getTime() - session.createdAt.getTime();
          const lastAccessed = new Date().getTime() - session.lastAccessedAt.getTime();
          
          return `Session ID: ${session.id}
Created: ${session.createdAt.toISOString()} (${formatDuration(age)} ago)
Last Accessed: ${session.lastAccessedAt.toISOString()} (${formatDuration(lastAccessed)} ago)
History Entries: ${session.history.length}
Variables: ${Object.keys((session.context as Record<string, unknown>) || {}).join(', ') || 'none'}
`;
        });
        
        return {
          content: [
            {
              type: 'text',
              text: `Found ${sessions.length} active session(s):\n\n${sessionInfo.join('\n')}`,
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text',
              text: `Error listing sessions: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
  
  // Delete a session
  server.tool(
    'deleteSession',
    'Delete a REPL session',
    {
      sessionId: z.string().describe('Session ID'),
    },
    async ({ sessionId }) => {
      try {
        const deleted = sessionManager.deleteSession(sessionId);
        
        if (deleted) {
          return {
            content: [
              {
                type: 'text',
                text: `Session ${sessionId} has been deleted.`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `Session ${sessionId} not found.`,
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
              text: `Error deleting session: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
  
  // Get session details
  server.tool(
    'sessionInfo',
    'Get detailed information about a session',
    {
      sessionId: z.string().describe('Session ID'),
    },
    async ({ sessionId }) => {
      try {
        const session = sessionManager.getSession(sessionId);
        
        if (!session) {
          return {
            content: [
              {
                type: 'text',
                text: `Session ${sessionId} not found.`,
              },
            ],
            isError: true,
          };
        }
        
        const age = new Date().getTime() - session.createdAt.getTime();
        const lastAccessed = new Date().getTime() - session.lastAccessedAt.getTime();
        
        // Get variables in the context
        const variables = Object.entries((session.context as Record<string, unknown>) || {})
          .map(([key, value]) => {
            let valueStr: string;
            try {
              valueStr = JSON.stringify(value);
              if (valueStr.length > 100) {
                valueStr = valueStr.substring(0, 97) + '...';
              }
            } catch (err) {
              valueStr = String(value);
            }
            return `${key}: ${valueStr} (${typeof value})`;
          })
          .join('\n');
        
        // Get recent history
        const recentHistory = session.history
          .slice(-5) // Get the 5 most recent entries
          .map((entry, index) => {
            const codePreview = entry.code.length > 50
              ? entry.code.substring(0, 47) + '...'
              : entry.code;
            
            return `[${index + 1}] ${codePreview} => ${entry.result.success 
              ? String(entry.result.result).substring(0, 50) 
              : 'Error: ' + entry.result.error?.message}`;
          })
          .join('\n');
        
        const response = `Session ID: ${session.id}
Created: ${session.createdAt.toISOString()} (${formatDuration(age)} ago)
Last Accessed: ${session.lastAccessedAt.toISOString()} (${formatDuration(lastAccessed)} ago)
History Entries: ${session.history.length}

Variables:
${variables || 'No variables defined'}

Recent History:
${recentHistory || 'No history yet'}`;
        
        return {
          content: [
            {
              type: 'text',
              text: response,
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text',
              text: `Error getting session info: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}

/**
 * Format a duration in milliseconds to a human-readable string
 * 
 * @param ms Duration in milliseconds
 * @returns Formatted string
 */
function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}
