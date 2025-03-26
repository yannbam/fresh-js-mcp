#!/usr/bin/env node
/**
 * Example named pipe client for the JavaScript MCP server
 * Demonstrates how to send commands and receive responses via named pipes
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Default pipe paths
const inPipePath = './.js-mcp-in';
const outPipePath = './.js-mcp-out';

// Request counter for unique IDs
let requestId = 1;

// Set up readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'js-mcp-client> '
});

// Start listening for responses from the output pipe
let responseBuffer = '';
let responseWatcher = null;

function watchOutputPipe() {
  // Open the output pipe for reading
  const outputStream = fs.createReadStream(outPipePath, { encoding: 'utf8' });
  
  // Handle data chunks
  outputStream.on('data', (chunk) => {
    responseBuffer += chunk;
    
    // Process complete messages (one per line)
    const lines = responseBuffer.split('\n');
    responseBuffer = lines.pop() || ''; // Keep the last incomplete line
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      try {
        // Parse the response
        const response = JSON.parse(line);
        console.log('\nReceived response:');
        
        if (response.success) {
          if (response.data && response.data.content) {
            // Display content
            console.log('Result:');
            for (const item of response.data.content) {
              if (item.type === 'text') {
                console.log(item.text);
              } else {
                console.log(item);
              }
            }
          } else {
            console.log('Success (no content)');
          }
        } else {
          console.log('Error:', response.error);
        }
        
        rl.prompt();
      } catch (error) {
        console.error('Error parsing response:', error);
        rl.prompt();
      }
    }
  });
  
  // Handle errors and pipe closure
  outputStream.on('error', (error) => {
    console.error('Error reading from output pipe:', error);
    // Try to reopen after a delay
    setTimeout(watchOutputPipe, 1000);
  });
  
  outputStream.on('close', () => {
    console.error('Output pipe closed, reopening...');
    // Try to reopen after a delay
    setTimeout(watchOutputPipe, 1000);
  });
}

// Start watching for responses
watchOutputPipe();

// Display welcome message
console.log('JavaScript MCP Server Pipe Client');
console.log('Type commands in the format: COMMAND [ARGS] or use JSON format');
console.log('For example: js-status');
console.log('Or: js-execute const x = 42; console.log(x);');
console.log('Or with JSON: js-execute {"code": "const x = 42; console.log(x);"}');
console.log('Type "exit" to quit, "help" for available commands');

rl.prompt();

// Handle user input
rl.on('line', (line) => {
  const input = line.trim();
  
  if (input === 'exit') {
    console.log('Exiting client...');
    process.exit(0);
  }
  
  if (input === 'help') {
    displayHelp();
    rl.prompt();
    return;
  }
  
  if (!input) {
    rl.prompt();
    return;
  }
  
  // Send command to the server
  try {
    sendCommand(input);
    console.log(`Command sent, waiting for response...`);
  } catch (error) {
    console.error('Error sending command:', error);
    rl.prompt();
  }
});

/**
 * Send a command to the server via the input pipe
 * 
 * @param {string} commandStr The command string to send
 */
function sendCommand(commandStr) {
  // Parse command and arguments
  let command, args;
  
  // Check if the command contains JSON arguments
  const jsonMatch = commandStr.match(/^(\S+)\s+({.*})$/);
  if (jsonMatch) {
    command = jsonMatch[1];
    args = JSON.parse(jsonMatch[2]);
  } else {
    // Simple command parsing
    const parts = commandStr.split(/\s+/);
    command = parts[0];
    
    // Handle different command formats
    args = {};
    
    if (command === 'js-execute' && parts.length > 1) {
      // Everything after the command is the code
      args.code = parts.slice(1).join(' ');
    } else if (command === 'js-executeInSession' && parts.length > 2) {
      // First argument is sessionId, rest is code
      args.sessionId = parts[1];
      args.code = parts.slice(2).join(' ');
    } else if (command === 'js-executeTypeScript' && parts.length > 1) {
      // Everything after the command is the code
      args.code = parts.slice(1).join(' ');
    } else if (parts.length > 1) {
      // For other commands, assume key-value pairs
      for (let i = 1; i < parts.length; i++) {
        args[`arg${i}`] = parts[i];
      }
    }
  }
  
  // Create request message
  const request = {
    id: String(requestId++),
    command,
    args
  };
  
  // Convert to JSON string
  const requestStr = JSON.stringify(request) + '\n';
  
  // Write to input pipe
  const writeStream = fs.createWriteStream(inPipePath, { flags: 'a' });
  writeStream.write(requestStr, (error) => {
    if (error) {
      console.error('Error writing to input pipe:', error);
    }
    writeStream.end();
  });
  
  writeStream.on('error', (error) => {
    console.error('Error with input pipe stream:', error);
  });
}

/**
 * Display help information
 */
function displayHelp() {
  console.log('\nAvailable Commands:');
  console.log('  js-status                          - Check server status');
  console.log('  js-execute <code>                  - Execute JavaScript code');
  console.log('  js-createSession                   - Create a new REPL session');
  console.log('  js-executeInSession <id> <code>    - Execute code in a session');
  console.log('  js-listSessions                    - List all sessions');
  console.log('  js-sessionInfo <id>                - Get session information');
  console.log('  js-deleteSession <id>              - Delete a session');
  console.log('  js-transpile <code>                - Transpile TypeScript to JavaScript');
  console.log('  js-executeTypeScript <code>        - Execute TypeScript code');
  console.log('  js-installPackage <n> [version] - Install an NPM package');
  console.log('  js-findPackage <n>              - Find an NPM package');
  console.log('  js-installModule <id> <n> [ver] - Install module for session');
  console.log('  js-listModules <sessionId>         - List modules in a session');
  console.log('\nJSON Format Example:');
  console.log('  js-execute {"code": "console.log(\'Hello world\')"}');
  console.log('  js-executeInSession {"sessionId": "abc123", "code": "x = 42"}');
  console.log('\nControl Commands:');
  console.log('  help - Show this help');
  console.log('  exit - Exit the client\n');
}
