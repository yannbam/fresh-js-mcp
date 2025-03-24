#!/usr/bin/env node

// Non-interactive test script for JS-MCP core functionality
// This runs a sequence of tests on the core modules to validate our fixes

const { executeJavaScript } = require('./dist/core/executor');
const { SessionManager } = require('./dist/core/session-manager');
const { typescriptTranspiler } = require('./dist/core/typescript-transpiler');
const { packageManager } = require('./dist/core/package-manager');

// Initialize components
const sessionManager = new SessionManager();

// Main test runner
async function runTests() {
  console.log('JavaScript MCP Core Functionality Tests');
  console.log('======================================');
  console.log('');

  try {
    // Initialize package manager
    await packageManager.initialize();

    // Run tests in sequence
    await testJavaScriptExecution();
    await testSessionVariables();
    await testTypeScriptExecution();
    await testPackageManagement();

    console.log('\n✅ All tests completed!');
  } catch (error) {
    console.error('\n❌ Test run failed:', error);
  }
}

// Test 1: JavaScript Execution with Modern Syntax
async function testJavaScriptExecution() {
  console.log('Test 1: JavaScript Execution with Modern Syntax');
  console.log('----------------------------------------------');

  // Test 1.1: Basic code with modern syntax (const, let)
  console.log('\nTest 1.1: Modern JavaScript Syntax (const, let)');
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

    if (result.success && result.result && result.result.sum === 15) {
      console.log('✅ PASS: Modern syntax executed correctly');
      console.log(`   Result: ${JSON.stringify(result.result)}`);
    } else {
      console.log('❌ FAIL: Modern syntax execution failed');
      console.log(`   Result: ${JSON.stringify(result.result)}`);
      if (result.error) console.log(`   Error: ${result.error.message}`);
    }
  } catch (error) {
    console.log(`❌ FAIL: Test threw an exception: ${error.message}`);
  }

  // Test 1.2: Top-level return statement
  console.log('\nTest 1.2: Top-level return statement');
  try {
    const result = await executeJavaScript(`
      const x = 42;
      return x;
    `);

    if (result.success && result.result === 42) {
      console.log('✅ PASS: Top-level return works correctly');
    } else {
      console.log('❌ FAIL: Top-level return failed');
      console.log(`   Result: ${JSON.stringify(result)}`);
      if (result.error) console.log(`   Error: ${result.error.message}`);
    }
  } catch (error) {
    console.log(`❌ FAIL: Test threw an exception: ${error.message}`);
  }

  // Test 1.3: Top-level throw statement
  console.log('\nTest 1.3: Top-level throw statement');
  try {
    const result = await executeJavaScript(`
      const shouldThrow = true;
      if (shouldThrow) {
        throw new Error("Test error");
      }
      return "This should not be returned";
    `);

    if (!result.success && result.error && result.error.message.includes("Test error")) {
      console.log('✅ PASS: Top-level throw works correctly');
    } else {
      console.log('❌ FAIL: Top-level throw failed');
      console.log(`   Result: ${JSON.stringify(result)}`);
    }
  } catch (error) {
    console.log(`❌ FAIL: Test threw an exception: ${error.message}`);
  }

  // Test 1.4: Console output capture
  console.log('\nTest 1.4: Console output capture');
  try {
    const result = await executeJavaScript(`
      console.log("This is a log message");
      console.error("This is an error message");
      console.warn("This is a warning message");
      return "Console test complete";
    `);

    if (result.success && 
        result.consoleOutput.includes("[log]") &&
        result.consoleOutput.includes("[error]") &&
        result.consoleOutput.includes("[warn]")) {
      console.log('✅ PASS: All console methods captured');
      console.log('   Console output:');
      console.log(`   ${result.consoleOutput.replace(/\n/g, '\n   ')}`);
    } else {
      console.log('❌ FAIL: Console capture incomplete');
      console.log(`   Console output: ${result.consoleOutput}`);
    }
  } catch (error) {
    console.log(`❌ FAIL: Test threw an exception: ${error.message}`);
  }
}

// Test 2: Session Variables
async function testSessionVariables() {
  console.log('\nTest 2: Session Variables and Persistence');
  console.log('---------------------------------------');

  let sessionId;

  // Test 2.1: Create session and set variables
  console.log('\nTest 2.1: Create session and set variables');