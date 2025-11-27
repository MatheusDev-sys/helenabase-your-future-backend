// HelenaBase Authentication Service - Complete Authentication System

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'user' | 'moderator';
  emailVerified: boolean;
  createdAt: string;
  lastLogin?: string;
  mfaEnabled: boolean;
}

export interface Session {
  token: string;
  refreshToken: string;
  user: User;
  expiresAt: string;
  createdAt: string;
}

export interface LoginAttempt {
  email: string;
  timestamp: string;
  success: boolean;
  ip: string;
  location: string;
}

const STORAGE_KEYS = {
  USERS: 'helenabase_users',
  SESSION: 'helenabase_session',
  LOGIN_ATTEMPTS: 'helenabase_login_attempts',
  AUDIT_LOGS: 'helenabase_audit_logs',
};

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

class AuthService {
  private session: Session | null = null;

  constructor() {
    this.loadSession();
  }

  // Generate fake JWT token
  private generateToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 64; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  // Simulate password hashing (Argon2)
  private hashPassword(password: string): string {
    return `$argon2id$v=19$m=65536,t=3,p=4$${btoa(password)}`;
  }

  // Verify password
  private verifyPassword(password: string, hash: string): boolean {
    const expectedHash = this.hashPassword(password);
    return hash === expectedHash;
  }

  // Get all users
  private getUsers(): User[] {
    const users = localStorage.getItem(STORAGE_KEYS.USERS);
    return users ? JSON.parse(users) : [];
  }

  // Save users
  private saveUsers(users: User[]): void {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  // Get login attempts
  private getLoginAttempts(email: string): LoginAttempt[] {
    const attempts = localStorage.getItem(STORAGE_KEYS.LOGIN_ATTEMPTS);
    const allAttempts: LoginAttempt[] = attempts ? JSON.parse(attempts) : [];
    return allAttempts.filter(a => a.email === email);
  }

  // Add login attempt
  private addLoginAttempt(email: string, success: boolean): void {
    const attempts = localStorage.getItem(STORAGE_KEYS.LOGIN_ATTEMPTS);
    const allAttempts: LoginAttempt[] = attempts ? JSON.parse(attempts) : [];
    
    allAttempts.push({
      email,
      timestamp: new Date().toISOString(),
      success,
      ip: '127.0.0.1',
      location: 'Local Development',
    });

    // Keep only last 100 attempts
    if (allAttempts.length > 100) {
      allAttempts.shift();
    }

    localStorage.setItem(STORAGE_KEYS.LOGIN_ATTEMPTS, JSON.stringify(allAttempts));
  }

  // Check if account is locked
  private isAccountLocked(email: string): boolean {
    const attempts = this.getLoginAttempts(email);
    const recentAttempts = attempts.filter(a => {
      const attemptTime = new Date(a.timestamp).getTime();
      return Date.now() - attemptTime < LOCKOUT_DURATION;
    });

    const failedAttempts = recentAttempts.filter(a => !a.success);
    return failedAttempts.length >= MAX_LOGIN_ATTEMPTS;
  }

  // Add audit log
  private addAuditLog(event: string, details: any): void {
    const logs = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    const allLogs = logs ? JSON.parse(logs) : [];

    allLogs.push({
      event,
      details,
      timestamp: new Date().toISOString(),
      userId: this.session?.user.id || 'anonymous',
    });

    // Keep only last 500 logs
    if (allLogs.length > 500) {
      allLogs.shift();
    }

    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(allLogs));
  }

  // Register new user
  async register(email: string, password: string, name: string): Promise<{ success: boolean; error?: string; user?: User }> {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay

    const users = this.getUsers();
    
    if (users.find(u => u.email === email)) {
      return { success: false, error: 'Email already registered' };
    }

    if (password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters' };
    }

    const newUser: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email,
      name,
      role: 'user',
      emailVerified: false,
      createdAt: new Date().toISOString(),
      mfaEnabled: false,
    };

    // Store password separately (in real app, never store plain passwords!)
    const passwords = JSON.parse(localStorage.getItem('helenabase_passwords') || '{}');
    passwords[newUser.id] = this.hashPassword(password);
    localStorage.setItem('helenabase_passwords', JSON.stringify(passwords));

    users.push(newUser);
    this.saveUsers(users);

    this.addAuditLog('user.created', { userId: newUser.id, email });

    return { success: true, user: newUser };
  }

  // Login
  async login(email: string, password: string): Promise<{ success: boolean; error?: string; session?: Session }> {
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay

    if (this.isAccountLocked(email)) {
      return { success: false, error: 'Account locked due to too many failed attempts. Try again in 15 minutes.' };
    }

    const users = this.getUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
      this.addLoginAttempt(email, false);
      return { success: false, error: 'Invalid email or password' };
    }

    const passwords = JSON.parse(localStorage.getItem('helenabase_passwords') || '{}');
    const storedHash = passwords[user.id];

    if (!storedHash || !this.verifyPassword(password, storedHash)) {
      this.addLoginAttempt(email, false);
      return { success: false, error: 'Invalid email or password' };
    }

    this.addLoginAttempt(email, true);

    // Update last login
    user.lastLogin = new Date().toISOString();
    this.saveUsers(users);

    // Create session
    const session: Session = {
      token: this.generateToken(),
      refreshToken: this.generateToken(),
      user,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      createdAt: new Date().toISOString(),
    };

    this.session = session;
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));

    this.addAuditLog('user.login', { userId: user.id, email });

    return { success: true, session };
  }

  // Logout
  logout(): void {
    if (this.session) {
      this.addAuditLog('user.logout', { userId: this.session.user.id });
    }
    this.session = null;
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  }

  // Load session from storage
  private loadSession(): void {
    const sessionData = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (!sessionData) return;

    const session: Session = JSON.parse(sessionData);
    
    // Check if session expired
    if (new Date(session.expiresAt) > new Date()) {
      this.session = session;
    } else {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    }
  }

  // Get current session
  getSession(): Session | null {
    return this.session;
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.session?.user || null;
  }

  // Check if authenticated
  isAuthenticated(): boolean {
    return this.session !== null;
  }

  // Request password reset
  async requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const users = this.getUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
      // Don't reveal if email exists
      return { success: true };
    }

    // Generate reset token
    const resetToken = this.generateToken();
    const resetTokens = JSON.parse(localStorage.getItem('helenabase_reset_tokens') || '{}');
    resetTokens[resetToken] = {
      userId: user.id,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
    };
    localStorage.setItem('helenabase_reset_tokens', JSON.stringify(resetTokens));

    this.addAuditLog('password.reset.requested', { userId: user.id, email });

    return { success: true };
  }

  // Reset password with token
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const resetTokens = JSON.parse(localStorage.getItem('helenabase_reset_tokens') || '{}');
    const tokenData = resetTokens[token];

    if (!tokenData || new Date(tokenData.expiresAt) < new Date()) {
      return { success: false, error: 'Invalid or expired reset token' };
    }

    if (newPassword.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters' };
    }

    // Update password
    const passwords = JSON.parse(localStorage.getItem('helenabase_passwords') || '{}');
    passwords[tokenData.userId] = this.hashPassword(newPassword);
    localStorage.setItem('helenabase_passwords', JSON.stringify(passwords));

    // Invalidate token
    delete resetTokens[token];
    localStorage.setItem('helenabase_reset_tokens', JSON.stringify(resetTokens));

    this.addAuditLog('password.reset.completed', { userId: tokenData.userId });

    return { success: true };
  }

  // Get audit logs
  getAuditLogs(): any[] {
    const logs = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    return logs ? JSON.parse(logs) : [];
  }

  // Verify email (simulated)
  async verifyEmail(userId: string): Promise<{ success: boolean }> {
    const users = this.getUsers();
    const user = users.find(u => u.id === userId);
    
    if (user) {
      user.emailVerified = true;
      this.saveUsers(users);
      this.addAuditLog('email.verified', { userId });
    }

    return { success: !!user };
  }
}

export const authService = new AuthService();
