import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerExecutionTools } from './tools/execute';
import { registerSessionTools } from './tools/repl';
// File system operations removed as Claude already has filesystem tools
import { registerPackageTools } from './tools/packages';
import { registerTypeScriptTools } from './tools/typescript';
import { registerModuleTools } from './tools/modules';

/**
 * Create and configure the MCP server
 */
export async function createServer() {
  // Create the MCP server
  const server = new McpServer({
    name: 'js-mcp',
    version: '0.1.0',
    instructions: 'JavaScript MCP server for executing JavaScript code through MCP tool calls',
  });

  // Add a simple status tool for testing
  server.tool(
    'js-status',
    'Get the current status of the JavaScript MCP server',
    {},
    async () => {
      return {
        content: [
          {
            type: 'text',
            text: 'JavaScript MCP server is running.',
          },
        ],
      };
    },
  );

  // Register tools
  registerExecutionTools(server);
  registerSessionTools(server);
  // File tools removed as Claude already has filesystem tools
  registerPackageTools(server);
  registerTypeScriptTools(server);
  registerModuleTools(server);

  return server;
}

/**
 * Start the MCP server with stdio transport (standard MCP mode)
 */
export async function startMcpServer(server: McpServer) {
  const transport = new StdioServerTransport();
  
  console.error('Starting JavaScript MCP server in standard mode...');
  
  try {
    await server.connect(transport);
    console.error('JavaScript MCP server running on stdio');
  } catch (error) {
    console.error('Error starting JavaScript MCP server:', error);
    process.exit(1);
  }
  
  return server;
}

/**
 * Legacy function maintained for backward compatibility
 * @deprecated Use createServer() and startMcpServer() separately
 */
export async function startServer() {
  const server = await createServer();
  return startMcpServer(server);
}
