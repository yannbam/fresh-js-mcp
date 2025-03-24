import { randomUUID } from 'crypto';
import { Session, SessionOptions, ExecutionOptions, ExecutionResult } from '../types';
import { executeJavaScript } from './executor';

/**
 * Default session options
 */
const DEFAULT_SESSION_OPTIONS: SessionOptions = {
  expiresIn: 3600000, // 1 hour
  initialContext: {},
};

/**
 * Manages JavaScript REPL sessions
 */
export class SessionManager {
  private sessions: Map<string, Session> = new Map();
  
  /**
   * Create a new REPL session
   * 
   * @param options Session options
   * @returns The new session
   */
  public createSession(options: SessionOptions = {}): Session {
    const mergedOptions = { ...DEFAULT_SESSION_OPTIONS, ...options };
    const id = randomUUID();
    const now = new Date();
    
    const session: Session = {
      id,
      createdAt: now,
      lastAccessedAt: now,
      context: mergedOptions.initialContext || {},
      history: [],
    };
    
    this.sessions.set(id, session);
    return session;
  }
  
  /**
   * Get a session by ID
   * 
   * @param id Session ID
   * @returns The session or undefined if not found
   */
  public getSession(id: string): Session | undefined {
    const session = this.sessions.get(id);
    
    if (!session) {
      return undefined;
    }
    
    // Update last accessed time
    session.lastAccessedAt = new Date();
    return session;
  }
  
  /**
   * Execute code in a session
   * 
   * @param sessionId Session ID
   * @param code JavaScript code to execute
   * @param options Execution options
   * @returns Result of the execution
   */
  public async executeInSession(
    sessionId: string,
    code: string,
    options: ExecutionOptions = {},
  ): Promise<ExecutionResult> {
    // Check if session exists
    if (!this.sessions.has(sessionId)) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    
    // Get the session directly from the map (we already know it exists)
    const session = this.sessions.get(sessionId)!;
    
    // Update last accessed time
    session.lastAccessedAt = new Date();
    
    // Every time a session is executed, we create a closure with access to the session's context
    // This lets user code access variables defined in previous executions
    const result = await executeJavaScript(code, session.context as Record<string, unknown>, options);
    
    // Update the session history
    session.history.push({
      code,
      result,
      timestamp: new Date(),
    });
    
    // Variables are automatically tracked via _userVariables property
    
    return result;
  }
  
  /**
   * Delete a session
   * 
   * @param id Session ID
   * @returns true if the session was deleted, false if it wasn't found
   */
  public deleteSession(id: string): boolean {
    return this.sessions.delete(id);
  }
  
  /**
   * Get all sessions
   * 
   * @returns Array of all sessions
   */
  public getAllSessions(): Session[] {
    return Array.from(this.sessions.values());
  }
  
  /**
   * Clean up expired sessions
   * 
   * @param maxAge Maximum age of sessions in milliseconds
   * @returns Number of sessions cleaned up
   */
  public cleanupSessions(maxAge: number = DEFAULT_SESSION_OPTIONS.expiresIn || 3600000): number {
    const now = new Date();
    let cleanedUp = 0;
    
    for (const [id, session] of this.sessions.entries()) {
      const age = now.getTime() - session.lastAccessedAt.getTime();
      
      if (age > maxAge) {
        this.sessions.delete(id);
        cleanedUp++;
      }
    }
    
    return cleanedUp;
  }
}

// Create a singleton instance
export const sessionManager = new SessionManager();
