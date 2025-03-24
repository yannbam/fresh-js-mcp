/**
 * Type definitions for the JavaScript MCP server
 */

/**
 * Result of a JavaScript execution
 */
export interface ExecutionResult {
  /** The value returned from the execution */
  result: unknown;
  /** Any console output captured during execution */
  consoleOutput: string;
  /** Any errors that occurred during execution */
  error?: Error;
  /** Type of the result for better display */
  resultType: string;
  /** Whether the execution completed successfully */
  success: boolean;
  /** Execution time in milliseconds */
  executionTime: number;
}

/**
 * Options for JavaScript execution
 */
export interface ExecutionOptions {
  /** Maximum execution time in milliseconds */
  timeout?: number;
  /** Whether to capture console output */
  captureConsole?: boolean;
  /** JavaScript language version */
  languageVersion?: 'es5' | 'es6' | 'es2020' | 'latest';
  /** Additional modules to provide to the execution context */
  additionalModules?: Record<string, unknown>;
  /** Whether to auto-await promises */
  awaitPromises?: boolean;
}

/**
 * A REPL session for executing JavaScript code
 */
export interface Session {
  /** Unique identifier for the session */
  id: string;
  /** When the session was created */
  createdAt: Date;
  /** When the session was last accessed */
  lastAccessedAt: Date;
  /** The execution context for this session */
  context: unknown;
  /** History of executions in this session */
  history: Array<{
    /** The code that was executed */
    code: string;
    /** The result of the execution */
    result: ExecutionResult;
    /** When the execution occurred */
    timestamp: Date;
  }>;
}

/**
 * Options for creating a new session
 */
export interface SessionOptions {
  /** Initial context variables */
  initialContext?: Record<string, unknown>;
  /** Session expiration time in milliseconds */
  expiresIn?: number;
  /** Execution options for this session */
  executionOptions?: ExecutionOptions;
}

// File system operations removed as Claude already has dedicated filesystem tools

/**
 * Result from an NPM package operation
 */
export interface PackageResult {
  /** Whether the operation was successful */
  success: boolean;
  /** The package that was operated on */
  packageName: string;
  /** The version of the package */
  version?: string;
  /** Any error that occurred */
  error?: Error;
  /** Time taken for the operation in milliseconds */
  operationTime?: number;
}

/**
 * TypeScript diagnostic information
 */
export interface TypeScriptDiagnostic {
  /** Diagnostic code */
  code: number;
  /** Diagnostic message */
  message: string;
  /** Diagnostic category (Error, Warning, etc.) */
  category: string;
}

/**
 * Result from TypeScript transpilation
 */
export interface TranspilationResult {
  /** Whether the transpilation was successful */
  success: boolean;
  /** The transpiled JavaScript code */
  jsCode?: string;
  /** Any error that occurred during transpilation */
  error?: Error;
  /** Source map for the transpiled code */
  sourceMap?: string;
  /** Diagnostics from the TypeScript compiler */
  diagnostics?: TypeScriptDiagnostic[];
}
