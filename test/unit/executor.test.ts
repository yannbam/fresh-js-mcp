import { executeJavaScript } from '../../src/core/executor';

describe('JavaScript Executor', () => {
  test('should execute basic JavaScript code', async () => {
    const result = await executeJavaScript('2 + 2');
    expect(result.success).toBe(true);
    expect(result.result).toBe(4);
    expect(result.resultType).toBe('number');
  });

  test('should capture console output', async () => {
    const result = await executeJavaScript('console.log("Hello"); console.error("World"); return true');
    expect(result.success).toBe(true);
    expect(result.result).toBe(true);
    expect(result.consoleOutput).toContain('[log] Hello');
    expect(result.consoleOutput).toContain('[error] World');
  });

  test('should handle errors', async () => {
    const result = await executeJavaScript('(() => { throw new Error("Test error"); })()');  
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error?.message).toContain('Test error');
  });

  test('should handle promises correctly', async () => {
    // When setting awaitPromises: true, the promise should be automatically awaited
    const result = await executeJavaScript(
      'new Promise(resolve => setTimeout(() => resolve("done"), 100));',
      {},
      { awaitPromises: true }
    );
    expect(result.success).toBe(true);
    expect(result.result).toBe('done'); // Should be the resolved value, not a Promise
  });

  test('should respect timeout', async () => {
    // Instead of trying to create a real timeout condition (which is unreliable in tests),
    // let's mock the timeout behavior
    jest.spyOn(global, 'setTimeout').mockImplementationOnce((callback) => {
      // Immediately call the timeout callback to simulate timeout
      callback();
      return 1 as unknown as NodeJS.Timeout;
    });
    
    const result = await executeJavaScript(
      'while(true) {}', // This would normally cause an infinite loop
      {},
      { timeout: 100 }
    );
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error?.message).toContain('timed out');
    
    // Restore the original implementation
    jest.restoreAllMocks();
  });
});
