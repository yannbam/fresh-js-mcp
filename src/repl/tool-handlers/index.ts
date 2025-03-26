/**
 * Tool handlers for the REPL and pipe interfaces
 * 
 * These handlers duplicate the functionality of the MCP tools, allowing
 * us to execute them directly without going through the MCP protocol.
 */

import { executeJavaScript } from '../../core/executor';
import { sessionManager } from '../../core/session-manager';
import { typescriptTranspiler } from '../../core/typescript-transpiler';
import { packageManager } from '../../core/package-manager';
import { ExecutionOptions } from '../../types';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

/**
 * Interface for command result containing MCP-compatible format
 */
export interface CommandResult {
  success: boolean;
  data?: {
    content?: Array<{
      type: string;
      text: string;
    }>;
    isError?: boolean;
  };
  error?: Error | string;
}

/**
 * Get the status of the JavaScript MCP server
 */
export async function handleStatus(): Promise<CommandResult> {
  return {
    success: true,
    data: {
      content: [
        {
          type: 'text',
          text: 'JavaScript MCP server is running.',
        },
      ],
    },
  };
}

/**
 * Execute JavaScript code
 */
export async function handleExecute(
  params: { code: string; timeout?: number; awaitPromises?: boolean }
): Promise<CommandResult> {
  try {
    const { code, timeout, awaitPromises } = params;
    
    if (!code) {
      return {
        success: false, 
        error: 'Code parameter is required'
      };
    }
    
    const options: ExecutionOptions = {
      timeout,
      awaitPromises,
    };
    
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
    if (result.consoleOutput && result.consoleOutput.trim()) {
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
      success: true,
      data: {
        content: [
          {
            type: 'text',
            text: response,
          },
        ],
        isError: !result.success,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Error executing JavaScript code: ${errorMessage}`,
    };
  }
}

/**
 * Create a new session
 */
export async function handleCreateSession(
  params: { expiresIn?: number }
): Promise<CommandResult> {
  try {
    const session = sessionManager.createSession({
      expiresIn: params.expiresIn,
    });
    
    return {
      success: true,
      data: {
        content: [
          {
            type: 'text',
            text: `Created new session with ID: ${session.id}\n`
              + `Session will expire after ${params.expiresIn || 3600000}ms of inactivity.`,
          },
        ],
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Error creating session: ${errorMessage}`,
    };
  }
}

/**
 * Execute code in a session
 */
export async function handleExecuteInSession(
  params: { sessionId: string; code: string; timeout?: number; awaitPromises?: boolean }
): Promise<CommandResult> {
  try {
    const { sessionId, code, timeout, awaitPromises } = params;
    
    if (!sessionId) {
      return {
        success: false,
        error: 'sessionId parameter is required',
      };
    }
    
    if (!code) {
      return {
        success: false,
        error: 'code parameter is required',
      };
    }
    
    // Check if session exists
    const session = sessionManager.getSession(sessionId);
    if (!session) {
      return {
        success: false,
        error: `Session not found: ${sessionId}`,
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
    if (result.consoleOutput && result.consoleOutput.trim()) {
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
      success: true,
      data: {
        content: [
          {
            type: 'text',
            text: response,
          },
        ],
        isError: !result.success,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Error executing code in session: ${errorMessage}`,
    };
  }
}

/**
 * List all active sessions
 */
export async function handleListSessions(): Promise<CommandResult> {
  try {
    const sessions = sessionManager.getAllSessions();
    
    if (sessions.length === 0) {
      return {
        success: true,
        data: {
          content: [
            {
              type: 'text',
              text: 'No active sessions found.',
            },
          ],
        },
      };
    }
    
    const sessionInfo = sessions.map((session) => {
      const age = new Date().getTime() - session.createdAt.getTime();
      const lastAccessed = new Date().getTime() - session.lastAccessedAt.getTime();
      
      // Check for user variables
      const context = session.context as Record<string, unknown>;
      let userVars: string[] = [];
      
      // First check for _userVariables property
      if (context._userVariables && typeof context._userVariables === 'object') {
        userVars = Object.keys(context._userVariables as Record<string, unknown>);
      }
      
      // If no variables found in _userVariables, fall back to checking context directly
      if (userVars.length === 0) {
        userVars = Object.keys(context).filter(key => 
          !key.startsWith('_') && 
          typeof context[key] !== 'function' &&
          ![
            'global', 'queueMicrotask', 'clearImmediate', 'setImmediate', 'structuredClone', 
            'clearInterval', 'clearTimeout', 'setInterval', 'setTimeout', 'atob', 'btoa', 
            'performance', 'fetch', 'console'
          ].includes(key)
        );
      }
      
      return `Session ID: ${session.id}
Created: ${session.createdAt.toISOString()} (${formatDuration(age)} ago)
Last Accessed: ${session.lastAccessedAt.toISOString()} (${formatDuration(lastAccessed)} ago)
History Entries: ${session.history.length}
Variables: ${userVars.join(', ') || 'none'}
`;
    });
    
    return {
      success: true,
      data: {
        content: [
          {
            type: 'text',
            text: `Found ${sessions.length} active session(s):\n\n${sessionInfo.join('\n')}`,
          },
        ],
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Error listing sessions: ${errorMessage}`,
    };
  }
}

/**
 * Get session details
 */
export async function handleSessionInfo(
  params: { sessionId: string }
): Promise<CommandResult> {
  try {
    const { sessionId } = params;
    
    if (!sessionId) {
      return {
        success: false,
        error: 'sessionId parameter is required',
      };
    }
    
    const session = sessionManager.getSession(sessionId);
    
    if (!session) {
      return {
        success: false,
        error: `Session ${sessionId} not found.`,
      };
    }
    
    const age = new Date().getTime() - session.createdAt.getTime();
    const lastAccessed = new Date().getTime() - session.lastAccessedAt.getTime();
    
    // Get variables in the context
    // Check for user variables in the _userVariables container
    let variables = 'No user-defined variables';
    const context = session.context as Record<string, unknown>;
    
    // Check if the session has a _userVariables property and if it has any entries
    if (context._userVariables && typeof context._userVariables === 'object') {
      const userVarsObj = context._userVariables as Record<string, unknown>;
      const userVarsEntries = Object.entries(userVarsObj);
      
      if (userVarsEntries.length > 0) {
        variables = userVarsEntries
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
      }
    } else {
      // Fallback: Look for variables directly in the context
      const userVarEntries = Object.entries(context)
        .filter(([key, value]) => 
          !key.startsWith('_') && 
          typeof value !== 'function' &&
          ![
            'global', 'queueMicrotask', 'clearImmediate', 'setImmediate', 'structuredClone', 
            'clearInterval', 'clearTimeout', 'setInterval', 'setTimeout', 'atob', 'btoa', 
            'performance', 'fetch', 'console'
          ].includes(key)
        );
      
      if (userVarEntries.length > 0) {
        variables = userVarEntries
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
      }
    }
    
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
      success: true,
      data: {
        content: [
          {
            type: 'text',
            text: response,
          },
        ],
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Error getting session info: ${errorMessage}`,
    };
  }
}

/**
 * Delete a session
 */
export async function handleDeleteSession(
  params: { sessionId: string }
): Promise<CommandResult> {
  try {
    const { sessionId } = params;
    
    if (!sessionId) {
      return {
        success: false,
        error: 'sessionId parameter is required',
      };
    }
    
    const deleted = sessionManager.deleteSession(sessionId);
    
    if (deleted) {
      return {
        success: true,
        data: {
          content: [
            {
              type: 'text',
              text: `Session ${sessionId} has been deleted.`,
            },
          ],
        },
      };
    } else {
      return {
        success: false,
        error: `Session ${sessionId} not found.`,
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Error deleting session: ${errorMessage}`,
    };
  }
}

// Add other handlers as needed, following the same pattern

/**
 * Execute TypeScript code
 */
export async function handleExecuteTypeScript(
  params: { code: string; timeout?: number; awaitPromises?: boolean; checkTypes?: boolean }
): Promise<CommandResult> {
  try {
    const { code, timeout, awaitPromises, checkTypes } = params;
    
    if (!code) {
      return {
        success: false,
        error: 'code parameter is required',
      };
    }
    
    // First transpile TypeScript to JavaScript
    const transpileResult = await typescriptTranspiler.transpile(code, 'script.ts', {
      checkTypes,
      sourceMap: true,
    });
    
    if (!transpileResult.success || !transpileResult.jsCode) {
      const errorMessage = transpileResult.error?.message || 'Unknown error';
      return {
        success: false,
        error: `TypeScript transpilation failed:\n${errorMessage}`,
      };
    }
    
    // Analyze the TypeScript output to see if the last statement is an expression
    const lines = transpileResult.jsCode.trim().split('\n');
    let jsCode = transpileResult.jsCode;
    
    if (lines.length > 0) {
      const lastLine = lines[lines.length - 1].trim();
      // If the last line is an expression (not ending with semicolon), make it a return
      if (lastLine && !lastLine.endsWith(';') && !lastLine.endsWith('}') && 
          !lastLine.includes('function') && !lastLine.includes('class')) {
        // Replace the last line with a return statement
        lines[lines.length - 1] = `return ${lastLine};`;
        jsCode = lines.join('\n');
      }
    }
    
    // Wrap in a function to execute
    jsCode = `
      (function() {
        ${jsCode}
      })();
    `;
    
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
      success: true,
      data: {
        content: [
          {
            type: 'text',
            text: response,
          },
        ],
        isError: !executeResult.success,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Error executing TypeScript: ${errorMessage}`,
    };
  }
}

/**
 * Transpile TypeScript to JavaScript
 */
export async function handleTranspile(
  params: { code: string; filename?: string; checkTypes?: boolean; sourceMap?: boolean }
): Promise<CommandResult> {
  try {
    const { code, filename, checkTypes, sourceMap } = params;
    
    if (!code) {
      return {
        success: false,
        error: 'code parameter is required',
      };
    }
    
    const result = await typescriptTranspiler.transpile(code, filename, {
      checkTypes,
      sourceMap,
    });
    
    if (result.success && result.jsCode) {
      return {
        success: true,
        data: {
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
        },
      };
    } else {
      const errorMessage = result.error?.message || 'Unknown error';
      return {
        success: false,
        error: `TypeScript transpilation failed:\n${errorMessage}`,
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Error transpiling TypeScript: ${errorMessage}`,
    };
  }
}

// Format duration helper
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

/**
 * Map from command names to handler functions
 */
export const handlers: Record<string, (params: any) => Promise<CommandResult>> = {
  'js-status': handleStatus,
  'js-execute': handleExecute,
  'js-createSession': handleCreateSession,
  'js-executeInSession': handleExecuteInSession,
  'js-listSessions': handleListSessions,
  'js-sessionInfo': handleSessionInfo,
  'js-deleteSession': handleDeleteSession,
  'js-executeTypeScript': handleExecuteTypeScript,
  'js-transpile': handleTranspile,
  // Add other handlers as needed
};
