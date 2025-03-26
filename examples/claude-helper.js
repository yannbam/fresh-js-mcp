#!/usr/bin/env node
/**
 * Claude helper for JS-MCP pipe interface
 * Simplifies sending commands and reading responses via pipes
 * 
 * Usage:
 *   node claude-helper.js <command> [json-args]
 *   
 * Examples:
 *   node claude-helper.js js-status
 *   node claude-helper.js js-execute "console.log('Hello'); return 42;"
 *   node claude-helper.js js-execute '{"code": "console.log(\"Hello\"); return 42;"}'
 */

const fs = require('fs');
const path = require('path');

// Default pipe paths
const inPipePath = './.js-mcp-in';
const outPipePath = './.js-mcp-out';

// Generate a unique request ID
const requestId = `req-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

// Get command line arguments
const [,, command, ...args] = process.argv;

if (!command) {
  console.error('Error: Command is required');
  console.error('Usage: node claude-helper.js <command> [json-args]');
  process.exit(1);
}

// Process arguments
let commandArgs = {};
if (args.length > 0) {
  const argsStr = args.join(' ');
  
  // Check if it's a JSON object
  if (argsStr.trim().startsWith('{')) {
    try {
      commandArgs = JSON.parse(argsStr);
    } catch (error) {
      console.error('Error parsing JSON arguments:', error);
      process.exit(1);
    }
  } else {
    // Handle common command formats
    if (command === 'js-execute' || command === 'js-executeTypeScript') {
      commandArgs.code = argsStr;
    } else if (command === 'js-executeInSession' && args.length >= 2) {
      commandArgs.sessionId = args[0];
      commandArgs.code = args.slice(1).join(' ');
    } else if (command === 'js-sessionInfo' || command === 'js-deleteSession' || command === 'js-listModules') {
      commandArgs.sessionId = args[0];
    } else if (command === 'js-installPackage' || command === 'js-findPackage') {
      commandArgs.name = args[0];
      if (args.length > 1) {
        commandArgs.version = args[1];
      }
    } else if (command === 'js-installModule' && args.length >= 2) {
      commandArgs.sessionId = args[0];
      commandArgs.name = args[1];
      if (args.length > 2) {
        commandArgs.version = args[2];
      }
    } else if (args.length > 0) {
      // For other commands, just add the arguments as-is
      args.forEach((arg, index) => {
        commandArgs[`arg${index + 1}`] = arg;
      });
    }
  }
}

// Create request message
const request = {
  id: requestId,
  command,
  args: commandArgs
};

// Send request and get response
sendRequestAndGetResponse(request)
  .then(response => {
    if (response.success) {
      if (response.data && response.data.content) {
        // Display content
        for (const item of response.data.content) {
          if (item.type === 'text') {
            console.log(item.text);
          } else {
            console.log(JSON.stringify(item, null, 2));
          }
        }
      } else {
        console.log('Command succeeded (no content)');
      }
    } else {
      console.error('Error:', response.error);
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });

/**
 * Send a request to the MCP server and get the response
 * 
 * @param {object} request The request object to send
 * @returns {Promise<object>} The response object
 */
async function sendRequestAndGetResponse(request) {
  return new Promise((resolve, reject) => {
    try {
      // Check if pipes exist
      if (!fs.existsSync(inPipePath)) {
        reject(new Error(`Input pipe not found: ${inPipePath}. Is the server running in pipe mode?`));
        return;
      }
      
      if (!fs.existsSync(outPipePath)) {
        reject(new Error(`Output pipe not found: ${outPipePath}. Is the server running in pipe mode?`));
        return;
      }
      
      // Convert request to JSON string
      const requestStr = JSON.stringify(request) + '\n';
      
      // Start listening for response before sending request
      let responseTimeout = setTimeout(() => {
        cleanup();
        reject(new Error('Timeout waiting for response'));
      }, 30000); // 30 second timeout
      
      let responseBuffer = '';
      let responseReceived = false;
      
      const outputStream = fs.createReadStream(outPipePath, { encoding: 'utf8' });
      
      function cleanup() {
        if (responseTimeout) {
          clearTimeout(responseTimeout);
          responseTimeout = null;
        }
        outputStream.removeAllListeners();
        outputStream.close();
      }
      
      // Listen for response
      outputStream.on('data', (chunk) => {
        responseBuffer += chunk;
        
        // Process complete messages (one per line)
        const lines = responseBuffer.split('\n');
        responseBuffer = lines.pop() || ''; // Keep the last incomplete line
        
        for (const line of lines) {
          if (!line.trim()) continue;
          
          try {
            const response = JSON.parse(line);
            
            // Check if this is our response
            if (response.id === requestId) {
              responseReceived = true;
              cleanup();
              resolve(response);
              break;
            }
          } catch (error) {
            // Ignore parsing errors from unrelated messages
          }
        }
      });
      
      outputStream.on('error', (error) => {
        cleanup();
        reject(error);
      });
      
      // Send the request
      const writeStream = fs.createWriteStream(inPipePath, { flags: 'a' });
      writeStream.write(requestStr, (error) => {
        if (error) {
          cleanup();
          reject(error);
        }
        writeStream.end();
      });
      
      writeStream.on('error', (error) => {
        cleanup();
        reject(error);
      });
      
    } catch (error) {
      reject(error);
    }
  });
}
