# JavaScript MCP Runner

## Overview

The `js-mcp-runner.js` is a general-purpose command-line tool for testing the JavaScript MCP server's core functionality directly. It allows you to execute JavaScript and TypeScript code, manage sessions, and work with packages without going through the MCP protocol layer.

This tool is invaluable for development, testing, and debugging as it provides direct access to the core modules while maintaining state between commands.

## Installation

The runner is already included in the project. Make sure you've built the project before using it:

```bash
npm run build
```

## Basic Usage

```bash
node js-mcp-runner.js [options]
```

## Available Commands

| Command | Alias | Description |
|---------|-------|-------------|
| `--help` | `-h` | Show help message |
| `--exec <code>` | `-e` | Execute JavaScript code |
| `--file <filename>` | `-f` | Execute JavaScript from a file |
| `--ts <code>` | `-t` | Execute TypeScript code |
| `--session-create <n>` | `-sc` | Create a new named session |
| `--session-exec <n> <code>` | `-se` | Execute code in a named session |
| `--session-info <n>` | `-si` | Show information about a session |
| `--list-sessions` | `-ls` | List all active sessions |
| `--batch <filename>` | `-b` | Execute a batch of commands from a JSON file |
| `--install-package <n> [version]` | `-ip` | Install an NPM package |
| `--find-package <n>` | `-fp` | Check if a package is installed |

## Examples

### Execute JavaScript

```bash
node js-mcp-runner.js --exec "const x = 42; console.log('The answer is', x); return x;"
```

### Execute TypeScript

```bash
node js-mcp-runner.js --ts "interface User { name: string; age: number; }; const user: User = {name: 'Alice', age: 30}; user;"
```

### Working with Sessions

Sessions maintain state between commands, allowing you to build up context over multiple executions:

```bash
# Create a session
node js-mcp-runner.js --session-create mySession

# Set variables in the session
node js-mcp-runner.js --session-exec mySession "this.count = 1; return this.count;"

# Increment the counter in a later execution
node js-mcp-runner.js --session-exec mySession "this.count++; return this.count;"

# Check session details
node js-mcp-runner.js --session-info mySession
```

### Package Management

```bash
# Install a package
node js-mcp-runner.js --install-package lodash

# Check if a package is installed
node js-mcp-runner.js --find-package lodash
```

### Batch Execution

You can create a JSON file with a series of commands to be executed in sequence:

```bash
node js-mcp-runner.js --batch test-batch.json
```

The batch file should be an array of command objects:

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
    "code": "this.value = 'hello'; return this.value;"
  }
]
```

## Session Persistence

The runner maintains session IDs between runs by saving them to a `.sessions.json` file in the project directory. This allows you to create a session once and continue using it across multiple command-line invocations.

## Use Cases

1. **Development Testing**: Quickly test changes to the execution engine
2. **Debugging**: Isolate and investigate issues with specific code
3. **Automation**: Create batch files for regression testing
4. **Documentation**: Generate examples for documentation

## Notes

- Variables in sessions should be assigned using `this.varName` for them to persist between executions
- TypeScript code is transpiled before execution
- Console output from executions is captured and displayed