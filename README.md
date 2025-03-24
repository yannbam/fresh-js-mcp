# JavaScript MCP Server

A JavaScript execution server for the Model Context Protocol (MCP), allowing AI models to run JavaScript code through MCP tool calls.

## Features

- **JavaScript Execution**: Run JavaScript code in one-time script execution mode
- **REPL Sessions**: Maintain stateful REPL sessions across multiple interactions
- **TypeScript Support**: Run TypeScript code with automatic transpilation
- **NPM Integration**: Import and use npm packages dynamically

- **Module Importing**: Import modules from Node.js and local files
- **Error Handling**: Comprehensive error handling with formatted stack traces

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
# Start the MCP server
npm start
```

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
