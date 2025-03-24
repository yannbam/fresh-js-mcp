# System Architecture

## Overview
The JavaScript MCP server follows a layered architecture to separate concerns and provide clean interfaces between components.

## Layers
1. **MCP Protocol Layer**: Handles client communication using the Model Context Protocol
2. **JavaScript Execution Layer**: Executes JavaScript code in a controlled environment
3. **Resource Management Layer**: Manages packages and TypeScript transpilation
4. **Session Management Layer**: Maintains REPL sessions with persistent state
5. **Core Infrastructure**: Provides common utilities and helpers

## Key Components

### MCP Protocol Layer (src/server.ts)
- Implements the Model Context Protocol
- Registers tools, resources and prompts
- Handles client communication

### JavaScript Execution Layer (src/core/executor.ts)
- Provides JavaScript execution environment using Function constructor
- Handles both one-time execution and REPL sessions
- Captures console output and errors
- Auto-awaits promises with timeouts
- Properly manages timeouts to prevent resource leaks

### Resource Management Layer

- **Package Manager** (src/core/package-manager.ts): Manages NPM packages
- **TypeScript Transpiler** (src/core/typescript-transpiler.ts): Transpiles TypeScript to JavaScript

### Session Management Layer (src/core/session-manager.ts)
- Maintains REPL sessions with state
- Handles session creation, listing and deletion
- Manages session timeouts and cleanup
- Preserves context between executions

## Data Flow

1. The MCP client sends a request to execute JavaScript code
2. The MCP server routes the request to the appropriate tool
3. The tool uses the execution layer to run the code
4. Results are returned through the MCP protocol

## Design Decisions

### Function Constructor for Execution
Using JavaScript's Function constructor for code execution, providing better compatibility and simpler implementation than VM2.

### Auto-awaiting Promises
All promises are automatically awaited to provide synchronous-like behavior within the tool call model.

### Session State Persistence
REPL sessions maintain state between calls, allowing for multi-step code execution.

### TypeScript Support
In-memory TypeScript transpilation with source maps for error reporting.

### Deterministic NPM Installation
Package installation with version locking for deterministic behavior.
