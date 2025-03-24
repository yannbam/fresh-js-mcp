# Development Tools

## CLI Testing Tool: js-mcp-runner.js

The `js-mcp-runner.js` is a command-line tool for testing JavaScript MCP server functionality directly, without going through the MCP protocol layer. It's useful for development, debugging, and verifying fixes.

### Features

- Execute JavaScript code directly
- Run JavaScript code from files
- Execute TypeScript code
- Create and manage REPL sessions
- Install and find NPM packages
- Run batch tests from JSON files

### Usage

```bash
# Basic usage
node js-mcp-runner.js [options]

# Options
--help, -h                  Show help message
--exec, -e <code>           Execute JavaScript code
--file, -f <filename>       Execute JavaScript code from a file
--ts, -t <code>             Execute TypeScript code
--session-create, -sc <n>   Create a new session with a name
--session-exec, -se <n> <c> Execute code in a named session
--session-info, -si <n>     Show information about a session
--list-sessions, -ls        List all active sessions
--batch, -b <filename>      Execute a batch of commands from JSON file
--install-package, -ip <n>  Install an NPM package
--find-package, -fp <n>     Check if a package is installed
```

### Examples

```bash
# Execute JavaScript code
node js-mcp-runner.js --exec "const x = 42; return x;"

# Execute TypeScript code
node js-mcp-runner.js --ts "interface User { name: string; }; const user: User = {name: 'Alice'}; user;"

# Create a session and use it
node js-mcp-runner.js --session-create mySession
node js-mcp-runner.js --session-exec mySession "this.count = 1; return this.count;"
node js-mcp-runner.js --session-info mySession

# Run batch tests
node js-mcp-runner.js --batch test-batch.json
```

### Batch Test Files

You can create JSON files with sequences of commands to test functionality:

```json
[
  {
    "type": "execute",
    "code": "const x = 42; return x;"
  },
  {
    "type": "session-create",
    "name": "testSession"
  },
  {
    "type": "session-execute",
    "name": "testSession",
    "code": "this.counter = 1; return this.counter;"
  }
]
```

### Important Notes

- **In-Process Execution**: All commands within a batch file execute in the same process, maintaining session state
- **Session Persistence**: Sessions are tracked in `.js-mcp-sessions.json` but are not persisted between Node.js processes
- **Direct Testing**: The tool bypasses the MCP protocol layer and directly tests core functionality

## Available Test Files

- **simple-tests.json**: Basic tests for JavaScript, TypeScript, and sessions
- **test-fixes.json**: Comprehensive tests for all fixed issues
