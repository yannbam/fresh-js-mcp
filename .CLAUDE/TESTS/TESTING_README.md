# Testing the JavaScript MCP Server Tools

This document provides an overview of how to test the JavaScript MCP server tools using Claude Desktop.

## Setup

1. **Build the server**:
   ```bash
   npm run build
   ```

2. **Configure Claude Desktop**:
   - Open Claude Desktop
   - Go to Settings
   - Add the JavaScript MCP server to your configuration:
   ```json
   {
     "js-mcp-server": {
       "command": "node",
       "args": ["/absolute/path/to/fresh-js-mcp/dist/index.js"]
     }
   }
   ```
   - Restart Claude Desktop

3. **Verify Connection**:
   - Look for the MCP icon in Claude Desktop to show the server is connected
   - You can also run the status tool to verify:
   ```
   js-status
   ```

## Testing Methods

There are two primary ways to test the JavaScript MCP server:

### 1. Using Claude Desktop

This is the primary testing method. You can use tool calls directly in Claude Desktop to test all functionality:

```
js-execute
```
with parameters:
```json
{
  "code": "console.log('Hello, world!'); return 42;"
}
```

### 2. Using MCP Inspector

For more detailed debugging, you can use the MCP Inspector:

```bash
npm run inspector
```

This opens a web interface where you can:
- See all available tools
- Test tools interactively
- View detailed response data
- Monitor logs and message exchange

## Available Tools

The JavaScript MCP server provides these tools:

1. **Basic Status**
   - `js-status`: Check server status

2. **JavaScript Execution**
   - `js-execute`: Run JavaScript code

3. **REPL Session Management**
   - `js-createSession`: Create a persistent session
   - `js-executeInSession`: Run code in a session
   - `js-listSessions`: List active sessions
   - `js-deleteSession`: Delete a session
   - `js-sessionInfo`: Get session details

4. **Package Management**
   - `js-installPackage`: Install NPM packages
   - `js-findPackage`: Check if a package is installed

5. **TypeScript Support**
   - `js-transpile`: Convert TypeScript to JavaScript
   - `js-executeTypeScript`: Run TypeScript code

## Testing Flow

A typical testing flow would be:

1. Test basic JavaScript execution
2. Create a REPL session for more complex testing
3. Try persistent variables in the session
4. Install and use an NPM package
5. Test TypeScript functionality
6. Clean up by deleting test sessions

Refer to the test plan and script for detailed test cases.

## Reporting Issues

When you find issues, document them with:
1. Tool name and parameters used
2. Expected behavior
3. Actual behavior
4. Any error messages
5. Steps to reproduce

## Debugging Tips

- Check Claude console logs for MCP server errors
- Use explicit return statements in executed code
- For timeouts, start with smaller code samples
- For package issues, try a different package
- For TypeScript errors, check both syntax and type errors

## Examples

See the TEST_SCRIPT.md file for detailed examples of testing each tool.
