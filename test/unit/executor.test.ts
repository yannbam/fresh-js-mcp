import { executeJavaScript } from '../../src/core/executor';

describe('JavaScript Executor', () => {
  test('should execute basic JavaScript code', async () => {
    const result = await executeJavaScript('return 2 + 2;');
    expect(result.success).toBe(true);
    expect(result.result).toBe(4);
    expect(result.resultType).toBe('number');
  });

  test('should capture console output', async () => {
    const result = await executeJavaScript('console.log("Hello"); console.error("World"); return true;');
    expect(result.success).toBe(true);
    expect(result.result).toBe(true);
    expect(result.consoleOutput).toContain('[log] Hello');
    expect(result.consoleOutput).toContain('[error] World');
  });

  test('should handle errors', async () => {
    const result = await executeJavaScript('throw new Error("Test error");');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error?.message).toContain('Test error');
  });

  test('should auto-await promises', async () => {
    const result = await executeJavaScript(
      'return new Promise(resolve => setTimeout(() => resolve("done"), 100));',
      {},
      { awaitPromises: true }
    );
    expect(result.success).toBe(true);
    expect(result.result).toBe('done');
  });

  test('should respect timeout', async () => {
    const result = await executeJavaScript(
      'while(true) {}', // Infinite loop
      {},
      { timeout: 100 }
    );
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error?.message).toContain('timeout');
  });
});
