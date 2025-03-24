# Project Files Overview

## Project Structure
- **src/**: Source code
  - **index.ts**: Main entry point
  - **server.ts**: MCP server implementation
  - **tools/**: MCP tool implementations
    - **execute.ts**: One-time JavaScript execution
    - **repl.ts**: REPL session management tools
    - **packages.ts**: NPM package management
    - **typescript.ts**: TypeScript transpilation tools
  - **core/**: Core functionality
    - **executor.ts**: JavaScript execution engine
    - **session-manager.ts**: REPL session management
    - **package-manager.ts**: NPM package installation
    - **typescript-transpiler.ts**: TypeScript transpilation
  - **utils/**: Utility functions
    - **error-handler.ts**: Error handling utilities
    - **output-formatter.ts**: Output formatting
  - **types/**: TypeScript type definitions
- **test/**: Test files
  - **unit/**: Unit tests
  - **integration/**: Integration tests
- **.CLAUDE/**: Documentation for Claude
- **dist/**: Compiled JavaScript (generated)

## Configuration Files
- **package.json**: NPM package configuration (uses MCP SDK 1.7.0)
- **tsconfig.json**: TypeScript configuration
- **.eslintrc.js**: ESLint configuration
- **.prettierrc**: Prettier configuration
- **jest.config.js**: Jest configuration
- **.gitignore**: Git ignore file

## Key Files Status
| File | Status | Description |
|------|--------|-------------|
| src/index.ts | Implemented | Entry point for the MCP server |
| src/server.ts | Implemented | MCP server implementation |
| src/tools/execute.ts | Implemented | JavaScript execution tools |
| src/tools/repl.ts | Implemented | REPL session management tools |
| src/tools/packages.ts | Implemented | NPM package management tools |
| src/tools/typescript.ts | Implemented | TypeScript transpilation tools |
| src/core/executor.ts | Implemented | JavaScript execution engine |
| src/core/session-manager.ts | Implemented | REPL session management |
| src/core/package-manager.ts | Implemented | NPM package installation |
| src/core/typescript-transpiler.ts | Implemented | TypeScript transpilation |
