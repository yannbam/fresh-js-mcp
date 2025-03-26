/**
 * REPL interface for the JavaScript MCP server
 * Provides interactive and pipe-based interfaces to the MCP server
 */

import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { processCommand } from './command-processor';
import { setupPipeInterface } from './pipe-handler';

// Define server mode options
export enum ServerMode {
  MCP = 'mcp',         // Standard MCP protocol over stdio
  INTERACTIVE = 'interactive', // Interactive REPL using readline
  PIPE = 'pipe'        // Named pipe interface
}

// REPL interface options
export interface ReplOptions {
  mode: ServerMode;
  pipePath?: string;   // Custom path for named pipes
}

/**
 * Start the REPL interface based on the specified mode
 * 
 * @param server The MCP server instance
 * @param options REPL interface options
 */
export async function startRepl(server: McpServer, options: ReplOptions): Promise<void> {
  console.error(`Starting JavaScript MCP server in ${options.mode} mode...`);
  
  switch (options.mode) {
    case ServerMode.INTERACTIVE:
      await startInteractiveRepl(server);
      break;
    case ServerMode.PIPE:
      await startPipeRepl(server, options.pipePath);
      break;
    default:
      throw new Error(`Unsupported server mode: ${options.mode}`);
  }
}

/**
 * Start an interactive REPL using readline
 * 
 * @param server The MCP server instance
 */
async function startInteractiveRepl(server: McpServer): Promise<void> {
  console.error('Starting interactive REPL...');
  
  // Create readline interface
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'js-mcp> ',
    completer: (line: string) => {
      // Simple command completion
      const commands = [
        'js-execute',
        'js-createSession',
        'js-executeInSession',
        'js-listSessions',
        'js-deleteSession',
        'js-sessionInfo',
        'js-transpile',
        'js-executeTypeScript',
        'js-installPackage',
        'js-findPackage',
        'js-installModule',
        'js-listModules',
        'js-status',
        'help',
        'exit'
      ];
      
      const hits = commands.filter((c) => c.startsWith(line));
      return [hits.length ? hits : commands, line];
    }
  });
  
  // Display welcome message
  console.log('JavaScript MCP Interactive REPL');
  console.log('Type "help" for available commands, "exit" to quit');
  rl.prompt();
  
  // Handle commands
  rl.on('line', async (line) => {
    const trimmedLine = line.trim();
    
    if (!trimmedLine) {
      rl.prompt();
      return;
    }
    
    if (trimmedLine === 'exit') {
      rl.close();
      return;
    }
    
    if (trimmedLine === 'help') {
      displayHelp();
      rl.prompt();
      return;
    }
    
    try {
      // Process the command against the MCP server
      const result = await processCommand(server, trimmedLine);
      
      if (result.success) {
        // Format and display the result
        if (result.data) {
          const content = result.data.content || [];
          content.forEach((item: any) => {
            if (item.type === 'text') {
              console.log(item.text);
            } else {
              console.log(item);
            }
          });
        } else {
          console.log('Command executed successfully (no result data)');
        }
      } else {
        // Display error
        console.error('Error:', result.error);
      }
      
      rl.prompt();
    } catch (error) {
      console.error('Error processing command:', error);
      rl.prompt();
    }
  });
  
  rl.on('close', () => {
    console.log('Exiting JavaScript MCP REPL');
    process.exit(0);
  });
}

/**
 * Start a named pipe interface for external control
 * 
 * @param server The MCP server instance
 * @param customPipePath Optional custom path for the pipes
 */
async function startPipeRepl(server: McpServer, customPipePath?: string): Promise<void> {
  console.error('Starting named pipe interface...');
  
  // Default pipe paths
  const baseDir = customPipePath || '.';
  const inPipePath = path.join(baseDir, '.js-mcp-in');
  const outPipePath = path.join(baseDir, '.js-mcp-out');
  
  // Set up the pipe interface
  await setupPipeInterface(server, inPipePath, outPipePath);
  
  console.log('Named pipe interface is ready. Use the following paths:');
  console.log(`Input pipe (commands): ${inPipePath}`);
  console.log(`Output pipe (responses): ${outPipePath}`);
  console.log('\nExample usage:');
  console.log(`echo '{"id":"1","command":"js-status"}' > ${inPipePath}`);
  console.log(`cat ${outPipePath}`);
  
  // Keep the process running
  process.stdin.resume();
  
  // Set up basic console interaction
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.on('line', (line) => {
    if (line.trim() === 'exit') {
      console.log('Exiting pipe mode...');
      process.exit(0);
    } else if (line.trim() === 'help') {
      console.log('\nPipe Mode Commands:');
      console.log('  exit - Exit the server');
      console.log('  help - Show this help\n');
    } else {
      console.log('Server is running in pipe mode. Use named pipes for communication.');
      console.log(`Input: ${inPipePath}`);
      console.log(`Output: ${outPipePath}`);
    }
  });
}

/**
 * Display help information
 */
function displayHelp(): void {
  console.log('\nAvailable Commands:');
  console.log('  js-status                   - Check server status');
  console.log('  js-execute <code>           - Execute JavaScript code');
  console.log('  js-createSession            - Create a new REPL session');
  console.log('  js-executeInSession <id> <code> - Execute code in a session');
  console.log('  js-listSessions             - List all sessions');
  console.log('  js-sessionInfo <id>         - Get session information');
  console.log('  js-deleteSession <id>       - Delete a session');
  console.log('  js-transpile <code>         - Transpile TypeScript to JavaScript');
  console.log('  js-executeTypeScript <code> - Execute TypeScript code');
  console.log('  js-installPackage <n>    - Install an NPM package');
  console.log('  js-findPackage <n>       - Find an NPM package');
  console.log('  js-installModule <sess> <n> - Install module for session');
  console.log('  js-listModules <sessionId>  - List modules in a session');
  console.log('  help                        - Show this help');
  console.log('  exit                        - Exit the REPL');
  console.log('\nFor command details, check the MCP tool documentation.\n');
}
