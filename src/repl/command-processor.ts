/**
 * Command processor for the JavaScript MCP server REPL
 * Handles parsing and executing commands against the MCP server
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { handlers, CommandResult } from './tool-handlers';

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
    
    // Check if we have a handler for this command
    if (handlers[command]) {
      // Execute the command handler
      return await handlers[command](args);
    } else {
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
