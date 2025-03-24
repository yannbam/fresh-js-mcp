import { SessionManager } from '../../src/core/session-manager';

describe('Session Manager', () => {
  let sessionManager: SessionManager;

  beforeEach(() => {
    sessionManager = new SessionManager();
  });

  test('should create a new session', () => {
    const session = sessionManager.createSession();
    expect(session).toBeDefined();
    expect(session.id).toBeDefined();
    expect(session.createdAt).toBeInstanceOf(Date);
    expect(session.lastAccessedAt).toBeInstanceOf(Date);
    expect(session.history).toEqual([]);
  });

  test('should get a session by id', () => {
    const session = sessionManager.createSession();
    const retrieved = sessionManager.getSession(session.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(session.id);
  });

  test('should execute code in a session', async () => {
    const session = sessionManager.createSession();
    const result = await sessionManager.executeInSession(session.id, 'return 2 + 2;');
    expect(result.success).toBe(true);
    expect(result.result).toBe(4);
    expect(session.history.length).toBe(1);
  });

  test('should maintain context between executions', async () => {
    const session = sessionManager.createSession();
    await sessionManager.executeInSession(session.id, 'let x = 42;');
    const result = await sessionManager.executeInSession(session.id, 'return x;');
    expect(result.success).toBe(true);
    expect(result.result).toBe(42);
  });

  test('should delete a session', () => {
    const session = sessionManager.createSession();
    expect(sessionManager.getSession(session.id)).toBeDefined();
    
    const deleted = sessionManager.deleteSession(session.id);
    expect(deleted).toBe(true);
    expect(sessionManager.getSession(session.id)).toBeUndefined();
  });

  test('should get all sessions', () => {
    sessionManager.createSession();
    sessionManager.createSession();
    const sessions = sessionManager.getAllSessions();
    expect(sessions.length).toBe(2);
  });

  test('should clean up expired sessions', () => {
    const session = sessionManager.createSession();
    
    // Mock the lastAccessedAt time to be in the past
    session.lastAccessedAt = new Date(Date.now() - 2000);
    
    const cleanedUp = sessionManager.cleanupSessions(1000); // 1 second max age
    expect(cleanedUp).toBe(1);
    expect(sessionManager.getSession(session.id)).toBeUndefined();
  });
});
