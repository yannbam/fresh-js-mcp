# Known Issues and Considerations

> **Note**: Some previously identified issues have been resolved in the latest version. See the 'Resolved Issues' section at the end of this document.

This document tracks known issues, open questions, and technical challenges.

## Open Questions

1. **Handling of Long-Running Operations**
   - How should we handle operations that exceed timeout limits?
   - What's the appropriate timeout duration for different operations?
   - How can we provide meaningful feedback for timeout errors?
   
2. **NPM Package Security**
   - How to handle potentially malicious npm packages?
   - Should we implement a package allowlist/blocklist?
   - Can we scan packages for security issues before installation?

3. **File System Security**
   - What file system access restrictions should be implemented?
   - How to prevent access to sensitive system files?
   - Should relative paths be restricted to a specific directory?

4. **Memory Management**
   - How to handle memory-intensive operations?
   - Should we implement memory limits per session?
   - What cleanup strategy ensures optimal resource usage?

## Technical Challenges

1. **Asynchronous Code Handling**
   - Challenge: Executing asynchronous code in a synchronous MCP tool call
   - Current approach: Auto-awaiting promises with timeouts
   - Potential issues: Deep promise chains, infinite loops, etc.

2. **Module Resolution**
   - Challenge: Resolving and loading modules in isolated environment
   - Current approach: Direct file system access
   - Potential issues: Compatibility with certain modules, circular dependencies

3. **Error Handling Clarity**
   - Challenge: Providing clear error messages for AI consumption
   - Current approach: Enhanced error formatting with stack traces
   - Potential issues: Stack traces can still be complex for AI interpretation

4. **TypeScript Return Values**
   - Challenge: Properly returning values from TypeScript execution
   - Current approach: In-memory transpilation with TypeScript API
   - Potential issues: Expression evaluation in TypeScript vs JavaScript

## Known Limitations

1. **Browser API Incompatibility**
   - Node.js environment doesn't support browser APIs
   - No DOM manipulation possible
   - Web APIs unavailable

2. **Resource Intensive Operations**
   - Large file operations may be slow
   - Memory-intensive operations might crash
   - Network-dependent operations subject to connectivity

3. **Native Module Limitations**
   - Direct require calls aren't supported in execution environment
   - Some npm packages can't be loaded directly
   - Need alternative module loading mechanism

4. **Security Boundaries**
   - Function constructor provides limited isolation
   - Potential for resource exhaustion attacks
   - Need for additional security measures

5. **Session Variable Tracking**
   - Session variables defined with `this.varName` persist but aren't visible in session info
   - Local variables defined with const/let/var don't persist between executions
   - Need improved context capture mechanism

## Resolved Issues

1. **Modern JavaScript Syntax Support**
   - ✅ RESOLVED: Execution engine now supports modern JavaScript syntax (const, let)
   - ✅ RESOLVED: Top-level return and throw statements now work correctly
   - ✅ RESOLVED: Complex object and array literals are now supported

2. **Package Management**
   - ✅ RESOLVED: Package installation and discovery now work consistently
   - ✅ RESOLVED: Packages can be found in the correct directory after installation

3. **Console Output Capture**
   - ✅ RESOLVED: All console methods (log, error, warn, info) are now properly captured and displayed
   - ✅ RESOLVED: Console output formatting improved for readability

4. **Session Variable Management**
   - ✅ RESOLVED: Variables defined with this.x = y persist correctly between executions
   - ✅ RESOLVED: Variables are properly tracked in session context
   - ✅ RESOLVED: Session state is maintained properly across executions

5. **TypeScript Execution**
   - ✅ RESOLVED: TypeScript code with modern syntax now executes correctly
   - ✅ RESOLVED: TypeScript transpilation properly preserves code semantics
   - ✅ RESOLVED: Error handling improved for TypeScript execution