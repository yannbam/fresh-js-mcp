import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, ListResourcesRequestSchema,ListPromptsRequestSchema, ToolSchema
} from "@modelcontextprotocol/sdk/types.js";

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
    instructions: 'JavaScript MCP server for executing JavaScript code through MCP tool calls'},
    {
      capabilities: {
        resources: {listChanged: true},
        tools: {listChanged: true},
        prompts: {listChanged: true},
      }
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

  server.server.setRequestHandler(ListResourcesRequestSchema, async (request) => {
    return {resources: []};
  });

  server.server.setRequestHandler(ListPromptsRequestSchema, async (request) => {
    return {prompts: []};
  });

  return server;
}

/**
 * Start the MCP server with stdio transport
 */
export async function startServer() {
  const server = await createServer();
  const transport = new StdioServerTransport();
  
  console.error('Starting JavaScript MCP server...');
  
  try {
    await server.connect(transport);
    console.error('JavaScript MCP server running on stdio');
  } catch (error) {
    console.error('Error starting JavaScript MCP server:', error);
    process.exit(1);
  }
  
  return server;
}
