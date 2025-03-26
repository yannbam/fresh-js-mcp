/**
 * Command processor for the JavaScript MCP server REPL
 * Handles parsing and executing commands against the MCP server
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

/**
 * Command result interface
 */
export interface CommandResult {
  success: boolean;
  data?: unknown;
  error?: Error | string;
}

/**
 * Process a command string and execute it against the MCP server
 * 
 * @param server MCP server instance
 * @param commandStr Command string to process
 * @returns Result of the command execution
 */
export async function processCommand(
  server: McpServer,
  commandStr: string
): Promise<CommandResult> {
  try {
    // Parse command and arguments
    const { command, args } = parseCommand(commandStr);
    
    // Execute the command (placeholder implementation)
    console.error(`Processing command: ${command}`);
    
    switch (command) {
      case 'js-status':
        return await executeJsStatus(server);
        
      case 'js-execute':
        if (!args.code) {
          return { success: false, error: 'Code parameter is required' };
        }
        return await executeJsCode(server, args);
        
      // More commands will be implemented here
        
      default:
        return {
          success: false,
          error: `Unknown command: ${command}`
        };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : String(error)
    };
  }
}

/**
 * Parse a command string into command and arguments
 * 
 * @param commandStr Command string to parse
 * @returns Parsed command and arguments
 */
function parseCommand(commandStr: string): { command: string; args: Record<string, unknown> } {
  // Simple parsing for now
  const parts = commandStr.trim().split(/\s+/);
  const command = parts[0];
  
  // Handle different command formats
  const args: Record<string, unknown> = {};
  
  if (command === 'js-execute' && parts.length > 1) {
    // Everything after the command is the code
    args.code = parts.slice(1).join(' ');
  } else if (command === 'js-executeInSession' && parts.length > 2) {
    // First argument is sessionId, rest is code
    args.sessionId = parts[1];
    args.code = parts.slice(2).join(' ');
  } else if (command === 'js-executeTypeScript' && parts.length > 1) {
    // Everything after the command is the code
    args.code = parts.slice(1).join(' ');
  } else if (parts.length > 1) {
    // For other commands, assume simple key-value pairs
    for (let i = 1; i < parts.length; i++) {
      args[`arg${i}`] = parts[i];
    }
  }
  
  return { command, args };
}

/**
 * Execute js-status command
 */
async function executeJsStatus(server: McpServer): Promise<CommandResult> {
  try {
    // Get the tool execution function
    const tools = server.getTools();
    const statusTool = tools.find(t => t.name === 'js-status');
    
    if (!statusTool) {
      return { 
        success: false, 
        error: 'js-status tool not found on server' 
      };
    }
    
    // Call the tool directly
    const result = await statusTool.handler({});
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : String(error)
    };
  }
}

/**
 * Execute js-execute command
 */
async function executeJsCode(
  server: McpServer,
  args: Record<string, unknown>
): Promise<CommandResult> {
  try {
    // Get the tool execution function
    const tools = server.getTools();
    const executeTool = tools.find(t => t.name === 'js-execute');
    
    if (!executeTool) {
      return { 
        success: false, 
        error: 'js-execute tool not found on server' 
      };
    }
    
    // Call the tool directly
    const result = await executeTool.handler({
      code: String(args.code || ''),
      timeout: typeof args.timeout === 'number' ? args.timeout : undefined,
      awaitPromises: typeof args.awaitPromises === 'boolean' ? args.awaitPromises : undefined
    });
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : String(error)
    };
  }
}

// Additional command execution functions will be added here for other tools
