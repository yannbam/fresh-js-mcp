# Technical Decisions

This document records important technical decisions made during the project, the alternatives considered, and the rationale behind each choice.

## Core Design Decisions

### 1. Function Constructor for JavaScript Execution (Revised Decision)

**Decision**: Use JavaScript's Function constructor for code execution instead of VM2.

**Alternatives Considered**:
- VM2 library
- Node.js native VM module
- Direct eval()
- Creating child processes

**Rationale**:
- Simpler implementation with fewer dependencies
- Better compatibility with Node.js APIs (setTimeout, etc.)
- Improved handling of promises and asynchronous code
- More reliable test execution
- No lingering handles or resources
- More maintainable codebase

**Tradeoffs**:
- Less sandboxing/isolation compared to VM2
- Code has full access to Node.js environment
- Appropriate for trusted code execution scenarios

### 2. Synchronous Promise Resolution

**Decision**: Auto-await all promises before returning from tool calls.

**Alternatives Considered**:
- Returning promises directly
- State preservation with follow-up requests

**Rationale**:
- MCP tool calls are inherently synchronous
- Simpler mental model for the AI
- More deterministic results
- Avoids complex state management between calls

### 3. TypeScript In-Memory Transpilation

**Decision**: Transpile TypeScript in-memory using the TypeScript compiler API.

**Alternatives Considered**:
- Pre-transpilation only
- External transpilation service
- No TypeScript support

**Rationale**:
- Provides seamless TypeScript support
- Enables source mapping for better error reporting
- Avoids file system overhead from separate transpilation step
- Simplifies user experience

### 4. Session-Based Design

**Decision**: Use a session-based approach for REPL functionality.

**Alternatives Considered**:
- Stateless execution only
- Global shared context

**Rationale**:
- Enables multi-step code execution
- Provides clearer boundaries between different code executions
- Simpler to manage resources and cleanup
- Better aligns with how developers use REPLs

### 5. Complete Console Capture

**Decision**: Capture all console output including console.log, console.error, etc.

**Alternatives Considered**:
- Partial console capture
- No capture, rely on return values only

**Rationale**:
- Provides more complete execution feedback
- Matches developer expectations
- Enables debugging through console output
- Captures side effects of code execution
