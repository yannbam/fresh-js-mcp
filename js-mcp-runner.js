#!/usr/bin/env node

/**
 * JS-MCP Runner - A general solution for testing the JavaScript MCP server
 * 
 * This script can:
 * 1. Run a single JavaScript command: node js-mcp-runner.js --exec "const x = 42; return x;"
 * 2. Run a JavaScript file: node js-mcp-runner.js --file test.js
 * 3. Run TypeScript: node js-mcp-runner.js --ts "const x: number = 42; x;"
 * 4. Create a session: node js-mcp-runner.js --session-create mySession
 * 5. Execute in a session: node js-mcp-runner.js --session-exec mySession "this.x = 42; return this.x;"
 * 6. Get session info: node js-mcp-runner.js --session-info mySession
 * 7. Run multiple commands from a JSON file: node js-mcp-runner.js --batch test-batch.json
 */

const fs = require('fs');
const path = require('path');
const { executeJavaScript } = require('./dist/core/executor');
const { SessionManager } = require('./dist/core/session-manager');
const { typescriptTranspiler } = require('./dist/core/typescript-transpiler');
const { packageManager } = require('./dist/core/package-manager');

// Initialize core components
const sessionManager = new SessionManager();
let sessions = new Map(); // Track named sessions

// Initialize package manager
packageManager.initialize().catch(error => {
  console.error('Failed to initialize package manager:', error);
});

// Parse command line arguments
const args = process.argv.slice(2);
let command = null;
let params = {};

if (args.length === 0) {
  printHelp();
  process.exit(0);
}

// Process arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  
  if (arg === '--help' || arg === '-h') {
    printHelp();
    process.exit(0);
  } else if (arg === '--exec' || arg === '-e') {
    command = 'execute';
    params.code = args[++i];
  } else if (arg === '--file' || arg === '-f') {
    command = 'file';
    params.filename = args[++i];
  } else if (arg === '--ts' || arg === '-t') {
    command = 'typescript';
    params.code = args[++i];
  } else if (arg === '--session-create' || arg === '-sc') {
    command = 'session-create';
    params.name = args[++i];
  } else if (arg === '--session-exec' || arg === '-se') {
    command = 'session-execute';
    params.name = args[++i];
    params.code = args[++i];
  } else if (arg === '--session-info' || arg === '-si') {
    command = 'session-info';
    params.name = args[++i];
  } else if (arg === '--batch' || arg === '-b') {
    command = 'batch';
    params.filename = args[++i];
  } else if (arg === '--install-package' || arg === '-ip') {
    command = 'install-package';
    params.name = args[++i];
    if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
      params.version = args[++i];
    }
  } else if (arg === '--find-package' || arg === '-fp') {
    command = 'find-package';
    params.name = args[++i];
  } else if (arg === '--list-sessions' || arg === '-ls') {
    command = 'list-sessions';
  } else {
    console.error(`Unknown argument: ${arg}`);
    printHelp();
    process.exit(1);
  }
}

// Load saved sessions if they exist
loadSessions();

// Execute the command
executeCommand(command, params)
  .then(() => {
    // Save sessions for future use
    saveSessions();
    process.exit(0);
  })
  .catch(error => {
    console.error('Command execution failed:', error);
    process.exit(1);
  });

/**
 * Execute a command with parameters
 */
async function executeCommand(command, params) {
  switch (command) {
    case 'execute':
      return executeCode(params.code);
    case 'file':
      return executeFile(params.filename);
    case 'typescript':
      return executeTypeScript(params.code);
    case 'session-create':
      return createSession(params.name);
    case 'session-execute':
      return executeInSession(params.name, params.code);
    case 'session-info':
      return showSessionInfo(params.name);
    case 'list-sessions':
      return listSessions();
    case 'batch':
      return executeBatch(params.filename);
    case 'install-package':
      return installPackage(params.name, params.version);
    case 'find-package':
      return findPackage(params.name);
    default:
      console.error('Unknown command:', command);
      printHelp();
      process.exit(1);
  }
}

/**
 * Execute JavaScript code
 */
async function executeCode(code) {
  if (!code) {
    console.error('Error: No code provided');
    return;
  }
  
  console.log('Executing JavaScript code...');
  
  try {
    const result = await executeJavaScript(code);
    displayExecutionResult(result);
    return result;
  } catch (error) {
    console.error('Error executing code:', error);
    throw error;
  }
}

/**
 * Execute JavaScript code from a file
 */
async function executeFile(filename) {
  if (!filename) {
    console.error('Error: No filename provided');
    return;
  }
  
  console.log(`Executing JavaScript file: ${filename}`);
  
  try {
    const code = fs.readFileSync(filename, 'utf8');
    const result = await executeJavaScript(code);
    displayExecutionResult(result);
    return result;
  } catch (error) {
    console.error(`Error executing file ${filename}:`, error);
    throw error;
  }
}

/**
 * Execute TypeScript code
 */
async function executeTypeScript(code) {
  if (!code) {
    console.error('Error: No code provided');
    return;
  }
  
  console.log('Transpiling TypeScript code...');
  
  try {
    const transpileResult = await typescriptTranspiler.transpile(code);
    
    if (transpileResult.success && transpileResult.jsCode) {
      console.log('Transpilation successful!');
      
      // Display diagnostics if any
      if (transpileResult.diagnostics && transpileResult.diagnostics.length > 0) {
        console.log('\nDiagnostics:');
        transpileResult.diagnostics.forEach(d => {
          console.log(`- [${d.category}] ${d.message}`);
        });
      }
      
      // Execute the transpiled JavaScript
      console.log('\nExecuting transpiled code...');
      
      const jsCode = `
        (function() {
          ${transpileResult.jsCode}
          // Return undefined by default if no explicit return
          return undefined;
        })();
      `;
      
      const result = await executeJavaScript(jsCode);
      displayExecutionResult(result);
      return result;
    } else {
      console.log('Transpilation failed:');
      console.log(transpileResult.error?.message || 'Unknown error');
      
      if (transpileResult.diagnostics && transpileResult.diagnostics.length > 0) {
        console.log('\nDiagnostics:');
        transpileResult.diagnostics.forEach(diagnostic => {
          console.log(`- [${diagnostic.category}] ${diagnostic.message}`);
        });
      }
      
      throw new Error('TypeScript transpilation failed');
    }
  } catch (error) {
    console.error('Error executing TypeScript:', error);
    throw error;
  }
}

/**
 * Create a new session
 */
async function createSession(name) {
  if (!name) {
    console.error('Error: Session name is required');
    return;
  }
  
  try {
    const session = sessionManager.createSession();
    sessions.set(name, session.id);
    
    console.log(`Session created successfully!`);
    console.log(`Name: ${name}`);
    console.log(`ID: ${session.id}`);
    console.log(`Created: ${session.createdAt.toISOString()}`);
    
    return session;
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
}

/**
 * Execute code in a session
 */
async function executeInSession(name, code) {
  if (!name) {
    console.error('Error: Session name is required');
    return;
  }
  
  if (!code) {
    console.error('Error: No code provided');
    return;
  }
  
  const sessionId = sessions.get(name);
  if (!sessionId) {
    console.error(`Error: Session '${name}' not found`);
    return;
  }
  
  try {
    console.log(`Executing in session: ${name} (${sessionId})`);
    
    const result = await sessionManager.executeInSession(sessionId, code);
    displayExecutionResult(result);
    
    // Show updated variables
    const session = sessionManager.getSession(sessionId);
    if (session) {
      const variables = getUserVariables(session);
      if (variables.length > 0) {
        console.log('\nSession Variables:');
        console.log(variables.join(', '));
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error executing in session:', error);
    throw error;
  }
}

/**
 * Show session information
 */
async function showSessionInfo(name) {
  if (!name) {
    console.error('Error: Session name is required');
    return;
  }
  
  const sessionId = sessions.get(name);
  if (!sessionId) {
    console.error(`Error: Session '${name}' not found`);
    return;
  }
  
  try {
    const session = sessionManager.getSession(sessionId);
    
    if (!session) {
      console.error(`Error: Session ${name} (${sessionId}) not found in manager`);
      return;
    }
    
    console.log(`Session: ${name}`);
    console.log(`ID: ${session.id}`);
    console.log(`Created: ${session.createdAt.toISOString()}`);
    console.log(`Last Accessed: ${session.lastAccessedAt.toISOString()}`);
    console.log(`History Entries: ${session.history.length}`);
    
    // Display variables
    console.log('\nVariables:');
    const variables = getDetailedUserVariables(session);
    
    if (variables.length === 0) {
      console.log('  No user-defined variables');
    } else {
      variables.forEach(variable => {
        console.log(`  ${variable}`);
      });
    }
    
    // Display recent history
    if (session.history.length > 0) {
      console.log('\nRecent History:');
      // Show most recent entries first (up to 5)
      const recentHistory = [...session.history].reverse().slice(0, 5);
      
      recentHistory.forEach((entry, index) => {
        const actualIndex = session.history.length - index;
        const codePreview = entry.code.length > 50
          ? entry.code.substring(0, 47) + '...'
          : entry.code;
        
        console.log(`  [${actualIndex}] ${codePreview}`);
        console.log(`      Result: ${entry.result.success 
          ? (typeof entry.result.result === 'undefined' ? 'undefined' : JSON.stringify(entry.result.result).substring(0, 50)) 
          : 'Error: ' + entry.result.error?.message}`);
      });
    }
    
    return session;
  } catch (error) {
    console.error('Error getting session info:', error);
    throw error;
  }
}

/**
 * List all sessions
 */
async function listSessions() {
  try {
    console.log('Active Sessions:');
    
    if (sessions.size === 0) {
      console.log('  No active sessions');
      return [];
    }
    
    for (const [name, id] of sessions.entries()) {
      const session = sessionManager.getSession(id);
      if (session) {
        console.log(`- ${name}: ${id} (${session.history.length} history entries)`);
      } else {
        console.log(`- ${name}: ${id} (session no longer exists)`);
      }
    }
    
    return Array.from(sessions.entries());
  } catch (error) {
    console.error('Error listing sessions:', error);
    throw error;
  }
}

/**
 * Execute a batch of commands from a JSON file
 */
async function executeBatch(filename) {
  if (!filename) {
    console.error('Error: No filename provided');
    return;
  }
  
  console.log(`Executing batch file: ${filename}`);
  
  try {
    const batchContent = fs.readFileSync(filename, 'utf8');
    const batch = JSON.parse(batchContent);
    
    if (!Array.isArray(batch)) {
      console.error('Error: Batch file must contain an array of commands');
      return;
    }
    
    for (let i = 0; i < batch.length; i++) {
      const command = batch[i];
      console.log(`\nExecuting command ${i + 1}/${batch.length}: ${command.type}`);
      
      switch (command.type) {
        case 'execute':
          await executeCode(command.code);
          break;
        case 'file':
          await executeFile(command.filename);
          break;
        case 'typescript':
          await executeTypeScript(command.code);
          break;
        case 'session-create':
          await createSession(command.name);
          break;
        case 'session-execute':
          await executeInSession(command.name, command.code);
          break;
        case 'session-info':
          await showSessionInfo(command.name);
          break;
        case 'list-sessions':
          await listSessions();
          break;
        case 'find-package':
          await findPackage(command.name);
          break;
        case 'install-package':
          await installPackage(command.name, command.version);
          break;
        case 'sleep':
          console.log(`Sleeping for ${command.ms}ms...`);
          await new Promise(resolve => setTimeout(resolve, command.ms));
          break;
        default:
          console.error(`Unknown command type: ${command.type}`);
      }
    }
    
    console.log('\nBatch execution completed!');
  } catch (error) {
    console.error(`Error executing batch file ${filename}:`, error);
    throw error;
  }
}

/**
 * Install an NPM package
 */
async function installPackage(name, version) {
  if (!name) {
    console.error('Error: Package name is required');
    return;
  }
  
  console.log(`Installing package: ${name}${version ? ` version ${version}` : ''}`);
  
  try {
    const result = await packageManager.installPackage(name, version);
    
    if (result.success) {
      console.log(`Successfully installed package: ${name}${version ? ` version ${version}` : ''}`);
      console.log(`Operation took ${result.operationTime}ms`);
    } else {
      console.error(`Failed to install package: ${name}`);
      if (result.error) console.error(result.error.message);
    }
    
    return result;
  } catch (error) {
    console.error('Error installing package:', error);
    throw error;
  }
}

/**
 * Find a package
 */
async function findPackage(name) {
  if (!name) {
    console.error('Error: Package name is required');
    return;
  }
  
  console.log(`Checking if package is installed: ${name}`);
  
  try {
    const packagePath = await packageManager.findPackage(name);
    
    if (packagePath) {
      console.log(`Package ${name} is installed at: ${packagePath}`);
    } else {
      console.log(`Package ${name} is not installed`);
    }
    
    return packagePath;
  } catch (error) {
    console.error('Error finding package:', error);
    throw error;
  }
}

/**
 * Display execution result
 */
function displayExecutionResult(result) {
  if (result.success) {
    console.log('Execution successful!');
    
    // Display console output if any
    if (result.consoleOutput && result.consoleOutput.trim()) {
      console.log('\nConsole Output:');
      console.log(result.consoleOutput.trim());
    }
    
    // Display return value
    console.log('\nReturn Value:');
    console.log(`Type: ${result.resultType}`);
    
    try {
      if (typeof result.result === 'undefined') {
        console.log('Value: undefined');
      } else {
        const formatted = JSON.stringify(result.result, null, 2);
        console.log(`Value: ${formatted}`);
      }
    } catch (err) {
      console.log(`Value: ${String(result.result)}`);
    }
    
    console.log(`\nExecution Time: ${result.executionTime}ms`);
  } else {
    console.log('Execution failed:');
    console.log(result.error?.message || 'Unknown error');
    
    if (result.error?.stack) {
      console.log('\nStack Trace:');
      console.log(result.error.stack);
    }
  }
}

/**
 * Helper function to get user variables from a session
 */
function getUserVariables(session) {
  const context = session.context;
  const userVars = [];
  
  // Check _userVariables first
  if (context._userVariables && typeof context._userVariables === 'object') {
    userVars.push(...Object.keys(context._userVariables));
  }
  
  // If no variables in _userVariables, check context directly
  if (userVars.length === 0) {
    for (const key in context) {
      if (!key.startsWith('_') && 
          typeof context[key] !== 'function' &&
          !['global', 'queueMicrotask', 'clearImmediate', 'setImmediate', 'structuredClone', 
            'clearInterval', 'clearTimeout', 'setInterval', 'setTimeout', 'atob', 'btoa', 
            'performance', 'fetch', 'console'].includes(key)) {
        userVars.push(key);
      }
    }
  }
  
  return userVars;
}

/**
 * Helper function to get detailed user variables from a session
 */
function getDetailedUserVariables(session) {
  const context = session.context;
  const variables = [];
  
  // Look for the _userVariables property specifically
  if (context && context._userVariables && typeof context._userVariables === 'object') {
    const userVars = context._userVariables;
    
    for (const [key, value] of Object.entries(userVars)) {
      let valueStr;
      try {
        valueStr = JSON.stringify(value);
        if (valueStr.length > 100) {
          valueStr = valueStr.substring(0, 97) + '...';
        }
      } catch (err) {
        valueStr = String(value);
      }
      variables.push(`${key}: ${valueStr} (${typeof value})`);
    }
    
    // If we found variables, return them directly
    if (variables.length > 0) {
      return variables;
    }
  }
  
  // Fallback: check for direct properties in the context
  for (const key in context) {
    if (!key.startsWith('_') && 
        typeof context[key] !== 'function' &&
        !['global', 'queueMicrotask', 'clearImmediate', 'setImmediate', 'structuredClone', 
          'clearInterval', 'clearTimeout', 'setInterval', 'setTimeout', 'atob', 'btoa', 
          'performance', 'fetch', 'console'].includes(key)) {
      
      const value = context[key];
      let valueStr;
      try {
        valueStr = JSON.stringify(value);
        if (valueStr.length > 100) {
          valueStr = valueStr.substring(0, 97) + '...';
        }
      } catch (err) {
        valueStr = String(value);
      }
      variables.push(`${key}: ${valueStr} (${typeof value})`);
    }
  }
  
  return variables;
}

/**
 * Save sessions to a file for persistence
 */
function saveSessions() {
  try {
    const sessionData = {};
    
    // Save only the name-to-id mapping
    for (const [name, id] of sessions.entries()) {
      sessionData[name] = id;
    }
    
    // Save to current directory to ensure it's accessible and writable
    fs.writeFileSync(
      '.js-mcp-sessions.json', 
      JSON.stringify(sessionData, null, 2)
    );
    console.log(`Saved ${sessions.size} sessions to .js-mcp-sessions.json`);
  } catch (error) {
    console.error('Error saving sessions:', error);
  }
}

/**
 * Load sessions from file
 */
function loadSessions() {
  try {
    const sessionFile = '.js-mcp-sessions.json';
    
    if (fs.existsSync(sessionFile)) {
      const sessionData = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
      
      for (const [name, id] of Object.entries(sessionData)) {
        // Add the session ID to our map
        sessions.set(name, id);
      }
      
      console.log(`Loaded ${sessions.size} sessions from ${sessionFile}`);
    }
  } catch (error) {
    console.error('Error loading sessions:', error);
  }
}

/**
 * Print help information
 */
function printHelp() {
  console.log('JS-MCP Runner - Test the JavaScript MCP server');
  console.log('\nUsage:');
  console.log('  node js-mcp-runner.js [options]');
  console.log('\nOptions:');
  console.log('  --help, -h                  Show this help message');
  console.log('  --exec, -e <code>           Execute JavaScript code');
  console.log('  --file, -f <filename>       Execute JavaScript code from a file');
  console.log('  --ts, -t <code>             Execute TypeScript code');
  console.log('  --session-create, -sc <name> Create a new session with a name');
  console.log('  --session-exec, -se <name> <code> Execute code in a named session');
  console.log('  --session-info, -si <name>  Show information about a session');
  console.log('  --list-sessions, -ls        List all active sessions');
  console.log('  --batch, -b <filename>      Execute a batch of commands from a JSON file');
  console.log('  --install-package, -ip <name> [version] Install an NPM package');
  console.log('  --find-package, -fp <name>  Check if a package is installed');
  console.log('\nExamples:');
  console.log('  node js-mcp-runner.js --exec "const x = 42; return x;"');
  console.log('  node js-mcp-runner.js --session-create mySession');
  console.log('  node js-mcp-runner.js --session-exec mySession "this.count = 1; return this.count;"');
  console.log('  node js-mcp-runner.js --session-exec mySession "this.count++; return this.count;"');
  console.log('  node js-mcp-runner.js --session-info mySession');
  console.log('  node js-mcp-runner.js --batch test-batch.json');
}
