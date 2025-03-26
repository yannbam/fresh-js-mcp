# JavaScript MCP Server

A JavaScript execution server for the Model Context Protocol (MCP), allowing AI models to run JavaScript code through MCP tool calls.

## Features

- **JavaScript Execution**: Run JavaScript code in one-time script execution mode
- **REPL Sessions**: Maintain stateful REPL sessions across multiple interactions
- **TypeScript Support**: Run TypeScript code with automatic transpilation
- **NPM Integration**: Import and use npm packages dynamically
- **Interactive Mode**: Direct command line REPL interface for interacting with the server
- **Named Pipe Interface**: Use named pipes for communication with external processes

## Installation

```bash
# Clone the repository
git clone https://github.com/yannbam/fresh-js-mcp.git
cd fresh-js-mcp

# Install dependencies
npm install

# Build the project
npm run build
```

## Usage

```bash
# Start the MCP server in standard mode
npm start

# Start in interactive REPL mode
node dist/index.js --interactive

# Start with named pipe interface
node dist/index.js --pipe

# See all options
node dist/index.js --help
```

### Operating Modes

The server supports three operating modes:

1. **Standard MCP Mode** (default): Communicates via stdio using the Model Context Protocol
2. **Interactive Mode**: Provides a REPL interface for direct user interaction
3. **Pipe Mode**: Uses named pipes for communication with external processes

See the [examples directory](./examples/README.md) for detailed instructions on using these modes.

### Available Tools

- **execute**: Run JavaScript code once and return the result
- **createSession**: Create a new REPL session
- **executeInSession**: Execute code in an existing session
- **listSessions**: List all active REPL sessions
- **deleteSession**: Delete a REPL session


## Development

```bash
# Run in development mode with hot reloading
npm run dev

# Lint the code
npm run lint

# Run tests
npm test
```

## Architecture

The JavaScript MCP server follows a layered architecture:

1. **MCP Protocol Layer**: Handles client communication
2. **JavaScript Execution Layer**: Executes code in isolated environments
3. **Resource Management Layer**: Manages packages and TypeScript
4. **Session Management Layer**: Maintains REPL sessions with state persistence

## License

MIT
