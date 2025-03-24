import { VM, VMScript } from 'vm2';
import { ExecutionResult, ExecutionOptions } from '../types';

/**
 * Default execution options
 */
const DEFAULT_OPTIONS: ExecutionOptions = {
  timeout: 5000,
  captureConsole: true,
  languageVersion: 'latest',
  awaitPromises: true,
};

/**
 * Execute JavaScript code and return the result
 * 
 * @param code The JavaScript code to execute
 * @param context Optional context variables to provide to the execution
 * @param options Execution options
 * @returns The result of the execution
 */
export async function executeJavaScript(
  code: string,
  context: Record<string, unknown> = {},
  options: ExecutionOptions = {},
): Promise<ExecutionResult> {
  const startTime = Date.now();
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  
  // Captured console output
  let consoleOutput = '';
  
  // Create a VM for execution
  const vm = new VM({
    timeout: mergedOptions.timeout,
    sandbox: {},
    eval: false,
    wasm: false,
  });
  
  // Prepare context with captured console
  const consoleMethods = ['log', 'error', 'warn', 'info', 'debug'] as const;
  if (mergedOptions.captureConsole) {
    const consoleObj: Record<string, unknown> = {};
    
    consoleMethods.forEach((method) => {
      consoleObj[method] = (...args: unknown[]) => {
        const output = args
          .map((arg) => {
            if (typeof arg === 'object') {
              try {
                return JSON.stringify(arg, null, 2);
              } catch (err) {
                return String(arg);
              }
            }
            return String(arg);
          })
          .join(' ');
        
        consoleOutput += `[${method}] ${output}\n`;
      };
    });
    
    // Add our console to the context
    vm.freeze(consoleObj, 'console');
  }
  
  // Add context variables
  Object.entries(context).forEach(([key, value]) => {
    vm.freeze(value, key);
  });
  
  // Add any additional modules
  if (mergedOptions.additionalModules) {
    Object.entries(mergedOptions.additionalModules).forEach(([key, value]) => {
      vm.freeze(value, key);
    });
  }
  
  // Prepare the result
  const result: ExecutionResult = {
    result: undefined,
    consoleOutput: '',
    success: false,
    resultType: 'undefined',
    executionTime: 0,
  };
  
  try {
    // Create and run the script
    const script = new VMScript(code);
    
    // Execute the code
    let executionResult = vm.run(script);
    
    // Handle promises if auto-awaiting is enabled
    if (mergedOptions.awaitPromises && executionResult instanceof Promise) {
      try {
        executionResult = await Promise.resolve(executionResult);
      } catch (error) {
        throw error; // Re-throw to be caught by the outer try/catch
      }
    }
    
    // Determine the result type
    let resultType: string = typeof executionResult;
    if (executionResult === null) {
      resultType = 'null' as 'object';
    } else if (Array.isArray(executionResult)) {
      resultType = 'array' as 'object';
    } else if (executionResult instanceof Date) {
      resultType = 'date' as 'object';
    }
    
    // Success!
    result.result = executionResult;
    result.success = true;
    result.resultType = resultType;
  } catch (error) {
    // Handle execution errors
    result.success = false;
    result.error = error as Error;
  } finally {
    // Calculate execution time
    result.executionTime = Date.now() - startTime;
    result.consoleOutput = consoleOutput;
  }
  
  return result;
}
