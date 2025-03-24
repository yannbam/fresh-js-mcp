# Known Issues and Considerations

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
   - Challenge: Resolving and loading modules in VM2 environment
   - Current approach: Proxy Node.js module system
   - Potential issues: Compatibility with certain modules, circular dependencies

3. **Error Handling Clarity**
   - Challenge: Providing clear error messages for AI consumption
   - Current approach: Enhanced error formatting
   - Potential issues: Stack traces can be confusing or uninformative

4. **TypeScript Compatibility**
   - Challenge: Supporting all TypeScript features
   - Current approach: In-memory transpilation with TypeScript API
   - Potential issues: Complex TypeScript features, type definitions

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
   - C++ Node.js addons may not work in VM2
   - Some npm packages with native dependencies won't work

4. **Security Boundaries**
   - VM2 provides isolation but isn't a perfect sandbox
   - Potential for resource exhaustion attacks
   - Need for additional security measures
