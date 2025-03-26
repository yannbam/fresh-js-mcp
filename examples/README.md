# JavaScript MCP Server Interactive Modes

This directory contains examples and utilities for using the JavaScript MCP Server in interactive and pipe modes.

## Available Modes

The JavaScript MCP Server supports three operating modes:

1. **Standard MCP Mode** (default): Communicates via stdio using the Model Context Protocol
2. **Interactive Mode**: Provides a REPL interface for direct user interaction
3. **Pipe Mode**: Uses named pipes for communication with external processes

## Using Interactive Mode

Run the server with the `--interactive` or `-i` flag:

```bash
node dist/index.js --interactive
```

This starts a REPL session where you can enter commands directly:

```
js-mcp> js-status
JavaScript MCP server is running.

js-mcp> js-execute console.log('Hello, world!');
Console Output:
[log] Hello, world!

Execution Result (undefined):
undefined

Execution Time: 1ms
```

Type `help` to see available commands and `exit` to quit.

## Using Pipe Mode

### Starting the Server in Pipe Mode

Run the server with the `--pipe` flag:

```bash
node dist/index.js --pipe
```

Or use the provided example script:

```bash
./examples/start-pipe-server.sh
```

### Using the Example Client

The example client (`pipe-client.js`) demonstrates how to communicate with the server via named pipes:

```bash
./examples/pipe-client.js
```

Commands are sent in the same format as the interactive mode, or with JSON arguments:

```
js-mcp-client> js-status
Command sent, waiting for response...

Received response:
Result:
JavaScript MCP server is running.

js-mcp-client> js-execute {"code": "console.log('Hello'); return 42;"}
Command sent, waiting for response...

Received response:
Result:
Console Output:
[log] Hello

Execution Result (number):
42

Execution Time: 2ms
```

## Using Named Pipes Programmatically

For custom clients, communication happens through two named pipes:
- `.js-mcp-in` - Send commands to the server (write)
- `.js-mcp-out` - Receive responses from the server (read)

### Message Protocol

**Request Format:**
```json
{
  "id": "unique-request-id",
  "command": "js-execute",
  "args": {
    "code": "console.log('Hello, world!');"
  }
}
```

**Response Format:**
```json
{
  "id": "unique-request-id",
  "success": true,
  "data": {
    "content": [
      {
        "type": "text",
        "text": "Console Output:\n[log] Hello, world!\n\nExecution Result (undefined):\nundefined\n\nExecution Time: 1ms"
      }
    ]
  },
  "complete": true
}
```

## Available Commands

All MCP tools are available as commands in both interactive and pipe modes:

- `js-status` - Check server status
- `js-execute <code>` - Execute JavaScript code
- `js-createSession` - Create a new REPL session
- `js-executeInSession <id> <code>` - Execute code in a session
- `js-listSessions` - List all sessions
- `js-sessionInfo <id>` - Get session information
- `js-deleteSession <id>` - Delete a session
- `js-transpile <code>` - Transpile TypeScript to JavaScript
- `js-executeTypeScript <code>` - Execute TypeScript code
- `js-installPackage <name> [version]` - Install an NPM package
- `js-findPackage <name>` - Find an NPM package
- `js-installModule <sessionId> <name> [version]` - Install module for session
- `js-listModules <sessionId>` - List modules in a session

## Usage with AI Assistants

When using with AI assistants like Claude:

1. Start the server in pipe mode
2. Have the AI send commands via the input pipe
3. Read responses from the output pipe

This provides a way to test and interact with the MCP server without restarting the AI application.

Example AI interaction script:
```bash
# Send a command to the server
echo '{"id":"1","command":"js-status"}' > .js-mcp-in

# Read the response
cat .js-mcp-out
```
