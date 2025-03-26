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
      
      case 'js-createSession':
        return await executeTool(server, 'js-createSession', args);
      
      case 'js-executeInSession':
        if (!args.sessionId) {
          return { success: false, error: 'sessionId parameter is required' };
        }
        if (!args.code) {
          return { success: false, error: 'code parameter is required' };
        }
        return await executeTool(server, 'js-executeInSession', args);
      
      case 'js-deleteSession':
        if (!args.sessionId) {
          return { success: false, error: 'sessionId parameter is required' };
        }
        return await executeTool(server, 'js-deleteSession', args);
      
      case 'js-sessionInfo':
        if (!args.sessionId) {
          return { success: false, error: 'sessionId parameter is required' };
        }
        return await executeTool(server, 'js-sessionInfo', args);
      
      case 'js-listSessions':
        return await executeTool(server, 'js-listSessions', args);
      
      case 'js-transpile':
        if (!args.code) {
          return { success: false, error: 'code parameter is required' };
        }
        return await executeTool(server, 'js-transpile', args);
      
      case 'js-executeTypeScript':
        if (!args.code) {
          return { success: false, error: 'code parameter is required' };
        }
        return await executeTool(server, 'js-executeTypeScript', args);
      
      case 'js-installPackage':
        if (!args.name) {
          return { success: false, error: 'name parameter is required' };
        }
        return await executeTool(server, 'js-installPackage', args);
      
      case 'js-findPackage':
        if (!args.name) {
          return { success: false, error: 'name parameter is required' };
        }
        return await executeTool(server, 'js-findPackage', args);
      
      case 'js-installModule':
        if (!args.sessionId) {
          return { success: false, error: 'sessionId parameter is required' };
        }
        if (!args.name) {
          return { success: false, error: 'name parameter is required' };
        }
        return await executeTool(server, 'js-installModule', args);
      
      case 'js-listModules':
        if (!args.sessionId) {
          return { success: false, error: 'sessionId parameter is required' };
        }
        return await executeTool(server, 'js-listModules', args);
        
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
  // Check if arguments are in JSON format
  const trimmedCmd = commandStr.trim();
  const jsonStartIndex = trimmedCmd.indexOf('{');
  
  if (jsonStartIndex > 0) {
    try {
      // Extract command and JSON arguments
      const command = trimmedCmd.substring(0, jsonStartIndex).trim();
      const jsonArgsStr = trimmedCmd.substring(jsonStartIndex);
      const args = JSON.parse(jsonArgsStr);
      
      return { command, args };
    } catch (error) {
      // If JSON parsing fails, fall back to regular parsing
      console.error('Failed to parse JSON arguments, falling back to regular parsing:', error);
    }
  }
  
  // Regular command parsing
  const parts = trimmedCmd.split(/\s+/);
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
  } else if (command === 'js-createSession') {
    // No arguments needed
  } else if (command === 'js-deleteSession' && parts.length > 1) {
    args.sessionId = parts[1];
  } else if (command === 'js-sessionInfo' && parts.length > 1) {
    args.sessionId = parts[1];
  } else if (command === 'js-listSessions') {
    // No arguments needed
  } else if (command === 'js-listModules' && parts.length > 1) {
    args.sessionId = parts[1];
  } else if (command === 'js-installModule' && parts.length > 2) {
    args.sessionId = parts[1];
    args.name = parts[2];
    if (parts.length > 3) {
      args.version = parts[3];
    }
  } else if (command === 'js-installPackage' && parts.length > 1) {
    args.name = parts[1];
    if (parts.length > 2) {
      args.version = parts[2];
    }
  } else if (command === 'js-findPackage' && parts.length > 1) {
    args.name = parts[1];
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

/**
 * Execute any MCP tool by name
 */
async function executeTool(
  server: McpServer,
  toolName: string,
  args: Record<string, unknown>
): Promise<CommandResult> {
  try {
    // Get the tool execution function
    const tools = server.getTools();
    const tool = tools.find(t => t.name === toolName);
    
    if (!tool) {
      return { 
        success: false, 
        error: `Tool ${toolName} not found on server` 
      };
    }
    
    // Call the tool directly
    const result = await tool.handler(args);
    
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
