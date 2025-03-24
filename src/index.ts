#!/usr/bin/env node
/**
 * JavaScript MCP Server
 * An MCP server for executing JavaScript code.
 */

import { startServer } from './server';

async function main() {
  try {
    await startServer();
    // The server will keep running until the process is terminated
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
