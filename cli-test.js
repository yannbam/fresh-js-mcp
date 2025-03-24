#!/usr/bin/env node

// Direct testing CLI for JS-MCP core functionality
// This mimics how the MCP server would call the core functions
// while maintaining state across commands

const readline = require('readline');
const { executeJavaScript } = require('./dist/core/executor');
const { SessionManager } = require('./dist/core/session-manager');
const { typescriptTranspiler } = require('./dist/core/typescript-transpiler');
const { packageManager } = require('./dist/core/package-manager');

// Initialize core components (similar to how the MCP server would)
const sessionManager = new SessionManager();
let activeSessions = new Map(); // Track active sessions by name

// Initialize package manager
packageManager.initialize().catch(error => {
  console.error('Failed to initialize package manager:', error);
});

// Create an interactive interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'js-mcp> '
});

// Display welcome message
console.log('JavaScript MCP Core Functionality Tester');
console.log('=======================================');
console.log('Type "help" for available commands');
console.log('This CLI maintains state like the actual MCP server would');
console.log('');

// Show the prompt
rl.prompt();

// Handle commands
rl.on('line', async (line) => {
  try {
    const args = line.trim().split(' ');
    const command = args[0].toLowerCase();
    
    // Process commands
    switch (command) {
      case 'help':
        showHelp();
        break;
        
      case 'status':
        showStatus();
        break;
        
      case 'execute':
      case 'exec':
        // Execute JavaScript: exec console.log("Hello"); return 42;
        await executeCode(args.slice(1).join(' '));
        break;
        
      case 'session-create':
      case 'screate':
        // Create a session: session-create [name]
        createSession(args[1]);
        break;
        
      case 'session-list':
      case 'slist':
        // List all sessions
        listSessions();
        break;
        
      case 'session-info':
      case 'sinfo':
        // Show session info: session-info [name or id]
        showSessionInfo(args[1]);
        break;
        
      case 'session-execute':
      case 'sexec':
        // Execute in session: session-execute [name or id] [code]
        await executeInSession(args[1], args.slice(2).join(' '));
        break;
        
      case 'session-delete':
      case 'sdelete':
        // Delete a session: session-delete [name or id]
        deleteSession(args[1]);
        break;
        
      case 'typescript':
      case 'ts':
        // Execute TypeScript: typescript const x: number = 42; console.log(x);
        await executeTypeScript(args.slice(1).join(' '));
        break;
        
      case 'find-package':
        // Find package: find-package lodash
        await findPackage(args[1]);
        break;
        
      case 'install-package':
        // Install package: install-package lodash
        await installPackage(args[1], args[2]);
        break;
        
      case 'exit':
      case 'quit':
        console.log('Goodbye!');
        rl.close();
        process.exit(0);
        break;
        
      default:
        console.log(`Unknown command: ${command}`);
        console.log('Type "help" for available commands');
    }
  } catch (error) {
    console.error('Error executing command:', error);
  }
  
  // Show the prompt again
  rl.prompt();
}).on('close', () => {
  console.log('Exiting...');
  process.exit(0);
});

// Helper functions that mimic how the MCP layer would call core functionality

// Show available commands
function showHelp() {
  console.log('Available commands:');
  console.log('  help                - Show this help');
  console.log('  status              - Show server status');
  console.log('  execute <code>      - Execute JavaScript code once (alias: exec)');
  console.log('  typescript <code>   - Execute TypeScript code (alias: ts)');
  console.log('  session-create [name] - Create a new session (alias: screate)');
  console.log('  session-list        - List all sessions (alias: slist)');
  console.log('  session-info <name> - Show session info (alias: sinfo)');
  console.log('  session-execute <name> <code> - Execute code in session (alias: sexec)');
  console.log('  session-delete <name> - Delete a session (alias: sdelete)');
  console.log('  find-package <name> - Find an NPM package');
  console.log('  install-package <name> [version] - Install an NPM package');
  console.log('  exit, quit          - Exit the program');
}

// Show server status
function showStatus() {
  console.log('JavaScript MCP Server Status:');
  console.log('  Active: Yes');
  console.log(`  Sessions: ${sessionManager.getAllSessions().length}`);
  console.log('  Components:');
  console.log('    - Session Manager: Active');
  console.log('    - JavaScript Executor: Active');
  console.log('    - TypeScript Transpiler: Active');
  console.log('    - Package Manager: Active');
}

// Execute JavaScript once (no session)
async function executeCode(code) {
  if (!code) {
    console.log('Error: No code provided');
    return;
  }
  
  console.log('Executing JavaScript code...');
  
  try {
    const result = await executeJavaScript(code);
    
    // Format and display result (similar to how MCP would)
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
        const formatted = JSON.stringify(result.result, null, 2);
        console.log(`Value: ${formatted}`);
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
  } catch (error) {
    console.error('Error executing code:', error);
  }
}

// Create a new session
function createSession(name) {
  try {
    const session = sessionManager.createSession();
    
    // If name is provided, track it for easier reference
    if (name) {
      activeSessions.set(name, session.id);
    }
    
    console.log(`Session created successfully!`);
    console.log(`ID: ${session.id}`);
    console.log(`Created: ${session.createdAt.toISOString()}`);
    
    if (name) {
      console.log(`Name: ${name}`);
    }
  } catch (error) {
    console.error('Error creating session:', error);
  }
}

// List all sessions
function listSessions() {
  try {
    const sessions = sessionManager.getAllSessions();
    
    if (sessions.length === 0) {
      console.log('No active sessions found.');
      return;
    }
    
    console.log(`Found ${sessions.length} active session(s):`);
    console.log('');
    
    // Create a map of ID to name for easier lookup
    const nameMap = new Map();
    for (const [name, id] of activeSessions.entries()) {
      nameMap.set(id, name);
    }
    
    sessions.forEach(session => {
      const age = new Date().getTime() - session.createdAt.getTime();
      const lastAccessed = new Date().getTime() - session.lastAccessedAt.getTime();
      const name = nameMap.get(session.id) || 'unnamed';
      
      console.log(`Session ID: ${session.id} (${name})`);
      console.log(`Created: ${session.createdAt.toISOString()} (${formatDuration(age)} ago)`);
      console.log(`Last Accessed: ${session.lastAccessedAt.toISOString()} (${formatDuration(lastAccessed)} ago)`);
      console.log(`History Entries: ${session.history.length}`);
      
      // Get user variables
      const variables = getUserVariables(session);
      if (variables.length > 0) {
        console.log(`Variables: ${variables.join(', ')}`);
      } else {
        console.log('Variables: none');
      }
      
      console.log('');
    });
  } catch (error) {
    console.error('Error listing sessions:', error);
  }
}

// Display session information
function showSessionInfo(nameOrId) {
  if (!nameOrId) {
    console.log('Error: Session name or ID is required');
    return;
  }
  
  try {
    // Resolve session ID from name if needed
    const sessionId = activeSessions.get(nameOrId) || nameOrId;
    const session = sessionManager.getSession(sessionId);
    
    if (!session) {
      console.log(`Session not found: ${nameOrId}`);
      return;
    }
    
    const age = new Date().getTime() - session.createdAt.getTime();
    const lastAccessed = new Date().getTime() - session.lastAccessedAt.getTime();
    
    // Find session name if any
    let sessionName = 'unnamed';
    for (const [name, id] of activeSessions.entries()) {
      if (id === session.id) {
        sessionName = name;
        break;
      }
    }
    
    console.log(`Session ID: ${session.id} (${sessionName})`);
    console.log(`Created: ${session.createdAt.toISOString()} (${formatDuration(age)} ago)`);
    console.log(`Last Accessed: ${session.lastAccessedAt.toISOString()} (${formatDuration(lastAccessed)} ago)`);
    console.log(`History Entries: ${session.history.length}`);
    
    // Display variables in detail
    console.log('\nVariables:');
    const context = session.context;
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
          ? (typeof entry.result.result === 'undefined' ? 'undefined' : String(entry.result.result).substring(0, 50)) 
          : 'Error: ' + entry.result.error?.message}`);
        console.log(`      Time: ${entry.timestamp.toISOString()}`);
      });
    }
  } catch (error) {
    console.error('Error getting session info:', error);
  }
}

// Execute code in a session
async function executeInSession(nameOrId, code) {
  if (!nameOrId) {
    console.log('Error: Session name or ID is required');
    return;
  }
  
  if (!code) {
    console.log('Error: No code provided');
    return;
  }
  
  try {
    // Resolve session ID from name if needed
    const sessionId = activeSessions.get(nameOrId) || nameOrId;
    
    console.log(`Executing in session: ${nameOrId} (${sessionId})`);
    console.log('Code:', code);
    
    const result = await sessionManager.executeInSession(sessionId, code);
    
    // Format and display result (similar to how MCP would)
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
        const formatted = JSON.stringify(result.result, null, 2);
        console.log(`Value: ${formatted}`);
      } catch (err) {
        console.log(`Value: ${String(result.result)}`);
      }
      
      console.log(`\nExecution Time: ${result.executionTime}ms`);
      
      // Show updated variables
      const session = sessionManager.getSession(sessionId);
      if (session) {
        const variables = getUserVariables(session);
        if (variables.length > 0) {
          console.log('\nSession Variables:');
          console.log(variables.join(', '));
        }
      }
    } else {
      console.log('Execution failed:');
      console.log(result.error?.message || 'Unknown error');
      
      if (result.error?.stack) {
        console.log('\nStack Trace:');
        console.log(result.error.stack);
      }
    }
  } catch (error) {
    console.error('Error executing in session:', error);
  }
}

// Delete a session
function deleteSession(nameOrId) {
  if (!nameOrId) {
    console.log('Error: Session name or ID is required');
    return;
  }
  
  try {
    // Resolve session ID from name if needed
    const sessionId = activeSessions.get(nameOrId) || nameOrId;
    
    const deleted = sessionManager.deleteSession(sessionId);
    
    if (deleted) {
      console.log(`Session ${nameOrId} (${sessionId}) has been deleted.`);
      
      // Remove from active sessions if it was named
      for (const [name, id] of activeSessions.entries()) {
        if (id === sessionId) {
          activeSessions.delete(name);
          break;
        }
      }
    } else {
      console.log(`Session ${nameOrId} (${sessionId}) not found.`);
    }
  } catch (error) {
    console.error('Error deleting session:', error);
  }
}

// Execute TypeScript code
async function executeTypeScript(code) {
  if (!code) {
    console.log('Error: No code provided');
    return;
  }
  
  console.log('Transpiling TypeScript code...');
  
  try {
    const transpileResult = await typescriptTranspiler.transpile(code);
    
    if (transpileResult.success && transpileResult.jsCode) {
      console.log('Transpilation successful!');
      
      // If there were warnings, display them
      if (transpileResult.diagnostics && transpileResult.diagnostics.length > 0) {
        const warnings = transpileResult.diagnostics.filter(d => d.category === 'Warning');
        if (warnings.length > 0) {
          console.log('\nWarnings:');
          warnings.forEach(warning => console.log(`- ${warning.message}`));
        }
      }
      
      console.log('\nTranspiled JavaScript:');
      console.log(transpileResult.jsCode);
      
      // Execute the transpiled JavaScript
      console.log('\nExecuting transpiled code...');
      
      // Use our wrapper approach for typeScript execution
      const jsCode = `
        (function() {
          ${transpileResult.jsCode}
          // Return undefined by default if no explicit return
          return undefined;
        })();
      `;
      
      const result = await executeJavaScript(jsCode);
      
      // Format and display result (similar to how MCP would)
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
          const formatted = JSON.stringify(result.result, null, 2);
          console.log(`Value: ${formatted}`);
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
    } else {
      console.log('Transpilation failed:');
      console.log(transpileResult.error?.message || 'Unknown error');
      
      if (transpileResult.diagnostics && transpileResult.diagnostics.length > 0) {
        console.log('\nDiagnostics:');
        transpileResult.diagnostics.forEach(diagnostic => {
          console.log(`- [${diagnostic.category}] ${diagnostic.message}`);
        });
      }
    }
  } catch (error) {
    console.error('Error executing TypeScript:', error);
  }
}

// Find an NPM package
async function findPackage(name) {
  if (!name) {
    console.log('Error: Package name is required');
    return;
  }
  
  console.log(`Checking if package '${name}' is installed...`);
  
  try {
    const packagePath = await packageManager.findPackage(name);
    
    if (packagePath) {
      console.log(`Package '${name}' is installed at ${packagePath}`);
    } else {
      console.log(`Package '${name}' is not installed.`);
      console.log(`Use the install-package command to install it.`);
    }
  } catch (error) {
    console.error('Error finding package:', error);
  }
}

// Install an NPM package
async function installPackage(name, version) {
  if (!name) {
    console.log('Error: Package name is required');
    return;
  }
  
  console.log(`Installing package '${name}'${version ? ` version ${version}` : ''}...`);
  
  try {
    const result = await packageManager.installPackage(name, version);
    
    if (result.success) {
      console.log(`Successfully installed package '${name}'${version ? ` version ${version}` : ''}`);
      console.log(`Operation took ${result.operationTime}ms`);
    } else {
      console.log(`Failed to install package '${name}':`);
      console.log(result.error?.message || 'Unknown error');
    }
  } catch (error) {
    console.error('Error installing package:', error);
  }
}

// Helper function to get user variables from a session
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

// Helper function to get detailed user variables from a session
function getDetailedUserVariables(session) {
  const context = session.context;
  const variables = [];
  
  // Check _userVariables first
  if (context._userVariables && typeof context._userVariables === 'object') {
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
  }
  
  // If no variables in _userVariables, check context directly
  if (variables.length === 0) {
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
  }
  
  return variables;
}

// Format duration in milliseconds to human-readable string
function formatDuration(ms) {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}
