# JavaScript MCP Server Testing Script

This document provides step-by-step instructions for testing each tool in the JavaScript MCP server implementation.

## Prerequisites
- Ensure the JavaScript MCP server is built (`npm run build`)
- Claude Desktop is running with the server connected
- IDE or text editor for preparing test inputs

## Testing Procedure

For each test:
1. Use a tool call in Claude
2. Document the input parameters
3. Document the expected result
4. Document the actual result
5. Note any discrepancies or issues

## 1. Status Tool Tests

### Test 1.1: Basic Status Check
```javascript
js-status
```
**Expected**: Server should return a status message indicating it's running.

## 2. JavaScript Execution Tests

### Test 2.1: Basic Arithmetic
```javascript
js-execute
```
Parameters:
```json
{
  "code": "2 + 3 * 4"
}
```
**Expected**: Result should be 14 with execution details.

### Test 2.2: Console Output
```javascript
js-execute
```
Parameters:
```json
{
  "code": "console.log('Hello'); console.error('World'); console.warn('Warning'); return 'Done'"
}
```
**Expected**: Console output should show logs and "Done" as the result.

### Test 2.3: Complex Data Structures
```javascript
js-execute
```
Parameters:
```json
{
  "code": "const obj = { name: 'Test', values: [1, 2, 3], nested: { key: 'value' } }; return obj;"
}
```
**Expected**: Should return the complex object formatted as JSON.

### Test 2.4: Async Code
```javascript
js-execute
```
Parameters:
```json
{
  "code": "return new Promise(resolve => setTimeout(() => resolve('Async result'), 500))",
  "awaitPromises": true
}
```
**Expected**: Should wait for the promise and return "Async result".

### Test 2.5: Error Handling
```javascript
js-execute
```
Parameters:
```json
{
  "code": "throw new Error('Test error')"
}
```
**Expected**: Should return an error with appropriate stack trace.

### Test 2.6: Timeout Test
```javascript
js-execute
```
Parameters:
```json
{
  "code": "let i = 0; while(true) { i++; }",
  "timeout": 1000
}
```
**Expected**: Should abort execution after timeout and return an error.

## 3. REPL Session Tests

### Test 3.1: Create Session
```javascript
js-createSession
```
**Expected**: Should create and return a new session ID.

### Test 3.2: Execute in Session
```javascript
js-executeInSession
```
Parameters:
```json
{
  "sessionId": "<ID from previous test>",
  "code": "const x = 42; return x;"
}
```
**Expected**: Should execute and return 42.

### Test 3.3: Variable Persistence
```javascript
js-executeInSession
```
Parameters:
```json
{
  "sessionId": "<ID from previous test>",
  "code": "x + 10"
}
```
**Expected**: Should return 52, showing x was persisted.

### Test 3.4: List Sessions
```javascript
js-listSessions
```
**Expected**: Should show at least one active session.

### Test 3.5: Session Info
```javascript
js-sessionInfo
```
Parameters:
```json
{
  "sessionId": "<ID from previous test>"
}
```
**Expected**: Should show session details including variables and history.

### Test 3.6: Delete Session
```javascript
js-deleteSession
```
Parameters:
```json
{
  "sessionId": "<ID from previous test>"
}
```
**Expected**: Should confirm deletion.

### Test 3.7: Invalid Session
```javascript
js-executeInSession
```
Parameters:
```json
{
  "sessionId": "<ID from deleted session>",
  "code": "return 'hello'"
}
```
**Expected**: Should return an error about non-existent session.

## 4. Package Management Tests

### Test 4.1: Find Non-existent Package
```javascript
js-findPackage
```
Parameters:
```json
{
  "name": "lodash"
}
```
**Expected**: Should indicate the package is not installed.

### Test 4.2: Install Package
```javascript
js-installPackage
```
Parameters:
```json
{
  "name": "lodash"
}
```
**Expected**: Should install and confirm success.

### Test 4.3: Find Installed Package
```javascript
js-findPackage
```
Parameters:
```json
{
  "name": "lodash"
}
```
**Expected**: Should confirm the package is installed.

### Test 4.4: Use Installed Package
```javascript
js-execute
```
Parameters:
```json
{
  "code": "const _ = require('lodash'); return _.chunk(['a', 'b', 'c', 'd'], 2);"
}
```
**Expected**: Should return chunked array using lodash.

## 5. TypeScript Tests

### Test 5.1: Transpile Basic TypeScript
```javascript
js-transpile
```
Parameters:
```json
{
  "code": "interface Person { name: string; age: number; } const p: Person = { name: 'Alice', age: 30 }; p;"
}
```
**Expected**: Should return valid JavaScript with interfaces removed.

### Test 5.2: Type Error Detection
```javascript
js-transpile
```
Parameters:
```json
{
  "code": "interface Person { name: string; age: number; } const p: Person = { name: 'Alice' }; p;",
  "checkTypes": true
}
```
**Expected**: Should detect missing property "age" and report type error.

### Test 5.3: Execute TypeScript
```javascript
js-executeTypeScript
```
Parameters:
```json
{
  "code": "interface Person { name: string; age: number; } const p: Person = { name: 'Alice', age: 30 }; p;"
}
```
**Expected**: Should transpile and execute, returning the object.

### Test 5.4: Execute TypeScript with Type Error
```javascript
js-executeTypeScript
```
Parameters:
```json
{
  "code": "interface Person { name: string; age: number; } const p: Person = { name: 'Alice' }; p;"
}
```
**Expected**: Should fail with type error.

## 6. Advanced Use Cases

### Test 6.1: Complex Session Workflow
1. Create a new session
2. Define a class and methods in the session
3. Create instance and use methods
4. Check session info to see the structure

### Test 6.2: TypeScript Class Transpilation
```javascript
js-transpile
```
Parameters:
```json
{
  "code": "class Calculator { add(a: number, b: number): number { return a + b; } subtract(a: number, b: number): number { return a - b; } } const calc = new Calculator(); return calc.add(5, 3);"
}
```
**Expected**: Should transpile successfully.

### Test 6.3: Advanced Async Code
```javascript
js-execute
```
Parameters:
```json
{
  "code": "async function processData() { const data = await new Promise(resolve => setTimeout(() => resolve([1, 2, 3]), 100)); return data.map(x => x * 2); } return processData();",
  "awaitPromises": true
}
```
**Expected**: Should return [2, 4, 6] after resolving promises.

## Result Tracking

Create a table to track all test results:

| Test ID | Status | Notes/Issues |
|---------|--------|--------------|
| 1.1     |        |              |
| 2.1     |        |              |
| ...     |        |              |

## Issues Log

Record any issues discovered during testing:

1. Issue: [Description]
   - Severity: [Low/Medium/High]
   - Steps to reproduce: [Steps]
   - Expected behavior: [Description]
   - Actual behavior: [Description]
