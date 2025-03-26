#!/usr/bin/env node
/**
 * JavaScript MCP Server
 * An MCP server for executing JavaScript code.
 */

import { createServer, startMcpServer } from './server';
import { startRepl, ServerMode, ReplOptions } from './repl';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

/**
 * Parse command line arguments
 */
function parseArgs(): ReplOptions {
  const args = process.argv.slice(2);
  const options: ReplOptions = {
    mode: ServerMode.MCP, // Default mode
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--mode' || arg === '-m') {
      const modeValue = args[++i];
      if (modeValue === 'interactive' || modeValue === 'i') {
        options.mode = ServerMode.INTERACTIVE;
      } else if (modeValue === 'pipe' || modeValue === 'p') {
        options.mode = ServerMode.PIPE;
      } else if (modeValue === 'mcp') {
        options.mode = ServerMode.MCP;
      } else {
        console.error(`Unknown mode: ${modeValue}, using default (mcp)`)
      }
    } else if (arg === '--pipes' || arg === '-p') {
      options.pipePath = args[++i];
    } else if (arg === '--interactive' || arg === '-i') {
      options.mode = ServerMode.INTERACTIVE;
    } else if (arg === '--pipe') {
      options.mode = ServerMode.PIPE;
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
  }

  return options;
}

/**
 * Print help information
 */
function printHelp(): void {
  console.log('JavaScript MCP Server');
  console.log('\nUsage:');
  console.log('  js-mcp [options]\n');
  console.log('Options:');
  console.log('  --mode, -m <mode>      Server mode: mcp, interactive, pipe (default: mcp)');
  console.log('  --interactive, -i      Start in interactive mode (shorthand)');
  console.log('  --pipe                 Start in pipe mode (shorthand)');
  console.log('  --pipes <path>         Custom path for named pipes');
  console.log('  --help, -h             Show this help\n');
  console.log('Modes:');
  console.log('  mcp         Standard MCP server mode using stdio protocol');
  console.log('  interactive  Interactive REPL with readline interface');
  console.log('  pipe         Named pipe interface for external control\n');
}

async function main() {
  try {
    // Parse command line arguments
    const options = parseArgs();
    
    // Create the MCP server (shared across all modes)
    const server = await createServer();
    
    // Start the server in the appropriate mode
    if (options.mode === ServerMode.MCP) {
      // Standard MCP mode
      await startMcpServer(server);
    } else {
      // Interactive or pipe mode
      await startRepl(server, options);
    }
  } catch (error) {
    console.error('Fatal error starting JavaScript MCP server:', error);
    process.exit(1);
  }
}

// Start the server
main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
