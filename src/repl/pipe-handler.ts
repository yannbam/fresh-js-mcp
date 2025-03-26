/**
 * Named pipe interface for the JavaScript MCP server
 * Allows external processes to communicate with the MCP server through named pipes
 */

import * as fs from 'fs';
import * as path from 'path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { processCommand } from './command-processor';
import { spawn } from 'child_process';

// Message protocol for pipe communication
export interface RequestMessage {
  id: string;
  command: string;
  args?: Record<string, unknown>;
}

export interface ResponseMessage {
  id: string;
  success: boolean;
  data?: unknown;
  error?: string;
  complete: boolean;  // Indicates if this is the complete response
}

/**
 * Set up the named pipe interface
 * 
 * @param server MCP server instance
 * @param inPipePath Path to the input pipe
 * @param outPipePath Path to the output pipe
 */
export async function setupPipeInterface(
  server: McpServer, 
  inPipePath: string, 
  outPipePath: string
): Promise<void> {
  // Ensure pipes exist
  ensurePipeExists(inPipePath);
  ensurePipeExists(outPipePath);
  
  console.error(`Input pipe: ${inPipePath}`);
  console.error(`Output pipe: ${outPipePath}`);
  
  // Set up input pipe reader
  setupInputPipe(server, inPipePath, outPipePath);
}

/**
 * Ensure a pipe exists, creating it if necessary
 * 
 * @param pipePath Path to the pipe
 */
function ensurePipeExists(pipePath: string): void {
  try {
    // Check if the pipe exists
    if (fs.existsSync(pipePath)) {
      const stats = fs.statSync(pipePath);
      if (!stats.isFIFO()) {
        // If it exists but is not a pipe, remove it and create a pipe
        fs.unlinkSync(pipePath);
        createPipe(pipePath);
      }
    } else {
      // Create the pipe if it doesn't exist
      createPipe(pipePath);
    }
  } catch (error) {
    console.error(`Error ensuring pipe exists at ${pipePath}:`, error);
    throw error;
  }
}

/**
 * Create a named pipe at the specified path
 * 
 * @param pipePath Path to create the pipe
 */
function createPipe(pipePath: string): void {
  try {
    // Create directory if needed
    fs.mkdirSync(path.dirname(pipePath), { recursive: true });
    
    // Create pipe using mkfifo command
    const result = spawn('mkfifo', [pipePath]);
    
    result.on('close', (code) => {
      if (code !== 0) {
        console.error(`mkfifo process exited with code ${code}`);
      } else {
        console.error(`Created pipe: ${pipePath}`);
      }
    });
    
    // Wait a moment for the pipe to be created
    setTimeout(() => {
      if (!fs.existsSync(pipePath)) {
        console.error(`Failed to create pipe at ${pipePath}`);
      }
    }, 500);
  } catch (error) {
    console.error(`Error creating pipe at ${pipePath}:`, error);
    throw error;
  }
}

/**
 * Set up the input pipe reader
 * 
 * @param server MCP server instance
 * @param inPipePath Path to the input pipe
 * @param outPipePath Path to the output pipe
 */
function setupInputPipe(
  server: McpServer, 
  inPipePath: string, 
  outPipePath: string
): void {
  // Function to read from the pipe
  const readPipe = () => {
    try {
      // Open the input pipe for reading
      const inputStream = fs.createReadStream(inPipePath, { encoding: 'utf8' });
      let buffer = '';
      
      // Handle data chunks
      inputStream.on('data', async (chunk: string) => {
        buffer += chunk;
        
        // Process complete messages (one per line)
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep the last incomplete line in the buffer
        
        for (const line of lines) {
          if (!line.trim()) continue;
          
          try {
            // Parse the request message
            const request: RequestMessage = JSON.parse(line);
            
            // Log the received command
            console.error(`Received command via pipe: ${request.command}`);
            
            // Process the command
            processCommandAndRespond(server, request, outPipePath);
          } catch (error) {
            console.error('Error processing message from pipe:', error);
            
            // Send error response
            const errorResponse: ResponseMessage = {
              id: 'unknown',
              success: false,
              error: `Failed to parse request: ${error instanceof Error ? error.message : String(error)}`,
              complete: true
            };
            
            writeToOutputPipe(outPipePath, errorResponse);
          }
        }
      });
      
      // Handle errors and pipe closure
      inputStream.on('error', (error) => {
        console.error('Error reading from input pipe:', error);
        // Reopen the pipe after a delay
        setTimeout(readPipe, 1000);
      });
      
      inputStream.on('close', () => {
        console.error('Input pipe closed, reopening...');
        // Reopen the pipe after a delay
        setTimeout(readPipe, 1000);
      });
      
    } catch (error) {
      console.error('Error setting up input pipe:', error);
      // Retry after a delay
      setTimeout(readPipe, 1000);
    }
  };
  
  // Start reading from the pipe
  readPipe();
}

/**
 * Process a command from the pipe and send the response
 * 
 * @param server MCP server instance
 * @param request Request message from the pipe
 * @param outPipePath Path to the output pipe
 */
async function processCommandAndRespond(
  server: McpServer,
  request: RequestMessage,
  outPipePath: string
): Promise<void> {
  try {
    // Prepare the command string
    const commandStr = request.args 
      ? `${request.command} ${JSON.stringify(request.args)}` 
      : request.command;
    
    // Process the command
    const result = await processCommand(server, commandStr);
    
    // Create response message
    const response: ResponseMessage = {
      id: request.id,
      success: result.success,
      data: result.data,
      error: result.error ? String(result.error) : undefined,
      complete: true
    };
    
    // Write response to output pipe
    writeToOutputPipe(outPipePath, response);
    
  } catch (error) {
    console.error('Error processing command from pipe:', error);
    
    // Send error response
    const errorResponse: ResponseMessage = {
      id: request.id,
      success: false,
      error: `Command execution error: ${error instanceof Error ? error.message : String(error)}`,
      complete: true
    };
    
    writeToOutputPipe(outPipePath, errorResponse);
  }
}

/**
 * Write a response message to the output pipe
 * 
 * @param outPipePath Path to the output pipe
 * @param response Response message to write
 */
function writeToOutputPipe(outPipePath: string, response: ResponseMessage): void {
  try {
    // Convert response to JSON string
    const responseStr = JSON.stringify(response) + '\n';
    
    // Write to the output pipe
    const writeStream = fs.createWriteStream(outPipePath, { flags: 'a' });
    writeStream.write(responseStr, (error) => {
      if (error) {
        console.error('Error writing to output pipe:', error);
      } else {
        console.error(`Wrote response to output pipe: ${response.id}`);
      }
      writeStream.end();
    });
    
    writeStream.on('error', (error) => {
      console.error('Error with output pipe stream:', error);
    });
    
  } catch (error) {
    console.error('Error writing to output pipe:', error);
  }
}
