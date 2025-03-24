import * as ts from 'typescript';
import { TranspilationResult } from '../types';

/**
 * Options for TypeScript transpilation
 */
export interface TypeScriptOptions {
  /** Whether to generate source maps */
  sourceMap?: boolean;
  /** Custom TypeScript compiler options */
  compilerOptions?: ts.CompilerOptions;
  /** Whether to check types */
  checkTypes?: boolean;
}

/**
 * Default TypeScript options
 */
const DEFAULT_OPTIONS: TypeScriptOptions = {
  sourceMap: true,
  checkTypes: true,
  compilerOptions: {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.CommonJS,
    strict: false,
    esModuleInterop: true,
    skipLibCheck: true,
  },
};

/**
 * Transpile TypeScript code to JavaScript
 */
export class TypeScriptTranspiler {
  /**
   * Transpile TypeScript code to JavaScript
   * 
   * @param code TypeScript code to transpile
   * @param filename Optional filename for source maps
   * @param options Transpilation options
   * @returns Transpilation result
   */
  public async transpile(
    code: string,
    filename: string = 'script.ts',
    options: TypeScriptOptions = {},
  ): Promise<TranspilationResult> {
    const result: TranspilationResult = {
      success: false,
    };
    
    const mergedOptions = {
      ...DEFAULT_OPTIONS,
      ...options,
      compilerOptions: {
        ...DEFAULT_OPTIONS.compilerOptions,
        ...options.compilerOptions,
      },
    };
    
    try {
      // Create compiler options
      const compilerOptions: ts.CompilerOptions = {
        ...mergedOptions.compilerOptions,
        sourceMap: mergedOptions.sourceMap,
      };
      
      if (mergedOptions.checkTypes) {
        // For type checking, we need to create a program
        const host = ts.createCompilerHost(compilerOptions);
        
        // Override getSourceFile to return our code
        const originalGetSourceFile = host.getSourceFile;
        host.getSourceFile = (fileName, languageVersion) => {
          if (fileName === filename) {
            return ts.createSourceFile(fileName, code, languageVersion);
          }
          return originalGetSourceFile(fileName, languageVersion);
        };
        
        // Create program and check diagnostics
        const program = ts.createProgram([filename], compilerOptions, host);
        const diagnostics = ts.getPreEmitDiagnostics(program);
        
        if (diagnostics.length > 0) {
          // Format diagnostics
          result.diagnostics = diagnostics.map((diagnostic) => {
            let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
            
            if (diagnostic.file && diagnostic.start !== undefined) {
              const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
              message = `${diagnostic.file.fileName}:${line + 1}:${character + 1} - ${message}`;
            }
            
            return {
              code: diagnostic.code,
              message,
              category: ts.DiagnosticCategory[diagnostic.category],
            };
          });
          
          // If there are errors, return them
          if (diagnostics.some((d) => d.category === ts.DiagnosticCategory.Error)) {
            result.error = new Error(
              'TypeScript compilation failed:\n' +
                result.diagnostics
                  .filter((d) => d.category === 'Error')
                  .map((d) => d.message)
                  .join('\n'),
            );
            return result;
          }
        }
        
        // Emit output
        const outputFiles: Record<string, string> = {};
        const writeFile: ts.WriteFileCallback = (fileName, data) => {
          outputFiles[fileName] = data;
        };
        
        program.emit(undefined, writeFile);
        
        // Extract JavaScript and source map
        const jsFile = Object.keys(outputFiles).find((name) => name.endsWith('.js'));
        const mapFile = Object.keys(outputFiles).find((name) => name.endsWith('.js.map'));
        
        if (jsFile) {
          result.jsCode = outputFiles[jsFile];
          if (mapFile) {
            result.sourceMap = outputFiles[mapFile];
          }
          result.success = true;
        } else {
          result.error = new Error('No JavaScript output from TypeScript compiler');
        }
      } else {
        // Simple transpilation without type checking
        const transpileOutput = ts.transpileModule(code, {
          compilerOptions,
          fileName: filename,
        });
        
        result.jsCode = transpileOutput.outputText;
        result.sourceMap = transpileOutput.sourceMapText;
        result.success = true;
      }
    } catch (error) {
      result.error = error as Error;
    }
    
    return result;
  }
}

// Create a singleton instance
export const typescriptTranspiler = new TypeScriptTranspiler();
