// Simple test script to validate our MCP server fixes
const { executeJavaScript } = require('./dist/core/executor');
const { SessionManager } = require('./dist/core/session-manager');
const { typescriptTranspiler } = require('./dist/core/typescript-transpiler');

// Test 1: Basic JavaScript execution with modern syntax
async function testJavaScriptExecution() {
  console.log('\n--- Test 1: JavaScript Execution ---');
  
  try {
    const result = await executeJavaScript(`
      // Using modern syntax
      const person = { name: "Alice", age: 30 };
      let numbers = [1, 2, 3, 4, 5];
      let sum = 0;
      for (const num of numbers) {
        sum += num;
      }
      console.log("Person:", person);
      console.log("Sum of numbers:", sum);
      return { person, sum };
    `);
    
    console.log("Success:", result.success);
    console.log("Result:", result.result);
    console.log("Console output:", result.consoleOutput);
  } catch (error) {
    console.error("Error in JavaScript execution:", error);
  }
}

// Test 2: Session variable tracking
async function testSessionVariables() {
  console.log('\n--- Test 2: Session Variables ---');
  
  try {
    const sessionManager = new SessionManager();
    const session = sessionManager.createSession();
    
    console.log("Created session:", session.id);
    
    // First execution: define variables
    const result1 = await sessionManager.executeInSession(session.id, `
      this.user = { name: "Bob", age: 25 };
      this.numbers = [10, 20, 30];
      this.message = "Hello, world!";
      // Log some info about what we've set
      console.log("Set variables in session");
      // Return the variables
      return Object.keys(this).filter(key => 
        !key.startsWith('_') && 
        typeof this[key] !== 'function' &&
        !['global', 'queueMicrotask', 'clearImmediate', 'setImmediate', 'structuredClone', 
         'clearInterval', 'clearTimeout', 'setInterval', 'setTimeout', 'atob', 'btoa', 
         'performance', 'fetch', 'console'].includes(key)
      );
    `);
    
    console.log("First execution result:", result1.result);
    console.log("Console output:", result1.consoleOutput);
    
    // Second execution: use previous variables
    const result2 = await sessionManager.executeInSession(session.id, `
      // Check if we can access previous variables
      console.log("User from previous execution:", this.user);
      console.log("Numbers from previous execution:", this.numbers);
      console.log("Message from previous execution:", this.message);
      
      // Modify variables
      this.user.age++;
      this.numbers.push(40);
      this.message += " Updated!";
      
      // Check _userVariables
      return { 
        variables: Object.keys(this).filter(key => 
          !key.startsWith('_') && 
          typeof this[key] !== 'function' &&
          !['global', 'queueMicrotask', 'clearImmediate', 'setImmediate', 'structuredClone', 
           'clearInterval', 'clearTimeout', 'setInterval', 'setTimeout', 'atob', 'btoa', 
           'performance', 'fetch', 'console'].includes(key)
        ),
        userVariables: this._userVariables
      };
    `);
    
    console.log("Second execution result:", result2.result);
    console.log("Console output:", result2.consoleOutput);
    
    // Check session info directly
    console.log("Session info:", {
      id: session.id,
      historyCount: session.history.length,
      contextKeys: Object.keys(session.context)
    });
    
    // Check _userVariables directly
    if (session.context._userVariables) {
      console.log("_userVariables content:", session.context._userVariables);
    } else {
      console.log("_userVariables not found in context");
    }
  } catch (error) {
    console.error("Error in session variables test:", error);
  }
}

// Test 3: TypeScript execution
async function testTypeScriptExecution() {
  console.log('\n--- Test 3: TypeScript Execution ---');
  
  try {
    // First transpile TypeScript
    const tsCode = `
      interface User {
        name: string;
        age: number;
      }
      
      // Create a variable matching the interface
      const user: User = {
        name: "Charlie",
        age: 35
      };
      
      // Log the user
      console.log("TypeScript User:", user);
      
      // Return the user
      user;
    `;
    
    console.log("Transpiling TypeScript code...");
    const transpileResult = await typescriptTranspiler.transpile(tsCode);
    
    if (transpileResult.success) {
      console.log("Transpilation successful");
      console.log("JavaScript code:", transpileResult.jsCode);
      
      // Execute the transpiled code
      console.log("\nExecuting transpiled TypeScript code...");
      
      // Wrap the transpiled code in a function to handle return values
      const jsCode = `
        (function() {
          ${transpileResult.jsCode}
          // Return undefined by default if no explicit return
          return undefined;
        })();
      `;
      
      const executeResult = await executeJavaScript(jsCode);
      
      console.log("Execution success:", executeResult.success);
      console.log("Execution result:", executeResult.result);
      console.log("Console output:", executeResult.consoleOutput);
    } else {
      console.error("Transpilation failed:", transpileResult.error);
    }
  } catch (error) {
    console.error("Error in TypeScript execution test:", error);
  }
}

// Run all tests
async function runTests() {
  try {
    await testJavaScriptExecution();
    await testSessionVariables();
    await testTypeScriptExecution();
    console.log("\nAll tests completed!");
  } catch (error) {
    console.error("Error running tests:", error);
  }
}

// Execute tests
runTests();
