import { describe, it, expect, beforeEach } from 'vitest';
import {
  getStoredUsers,
  registerUser,
  authenticateUser,
  setCurrentUser,
  getCurrentUser,
  clearCurrentUser,
  getUserHistory,
  addUserHistoryEntry
} from '../../utils/userData.js';

// jsdom provides localStorage; wipe it before each test
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

// ─── getStoredUsers ───────────────────────────────────────────────────────────
describe('getStoredUsers', () => {
  it('always seeds the demo user', () => {
    const users = getStoredUsers();
    expect(users['team10user']).toBeDefined();
    expect(users['team10user'].email).toBe('team10user');
  });

  it('returns existing users from localStorage', () => {
    localStorage.setItem('mindcare_users', JSON.stringify({ 'a@b.com': { id: 'ab', name: 'AB' } }));
    const users = getStoredUsers();
    expect(users['a@b.com']).toBeDefined();
  });

  it('handles corrupt localStorage value gracefully', () => {
    localStorage.setItem('mindcare_users', 'NOT_JSON');
    const users = getStoredUsers();
    // should fall back to {} + seed demo user
    expect(users['team10user']).toBeDefined();
  });
});

// ─── registerUser ─────────────────────────────────────────────────────────────
describe('registerUser', () => {
  it('registers a new user successfully', () => {
    const result = registerUser({ name: 'Alice', email: 'alice@test.com', password: 'pass' });
    expect(result.ok).toBe(true);
    expect(result.user.name).toBe('Alice');
    expect(result.user.email).toBe('alice@test.com');
    expect(result.user).not.toHaveProperty('password');
  });

  it('trims and lowercases email', () => {
    registerUser({ name: 'Bob', email: '  BOB@TEST.COM  ', password: 'pass' });
    const users = getStoredUsers();
    expect(users['bob@test.com']).toBeDefined();
  });

  it('returns error when email is missing', () => {
    const result = registerUser({ name: 'Alice', email: '', password: 'pass' });
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/required/i);
  });

  it('returns error when password is missing', () => {
    const result = registerUser({ name: 'Alice', email: 'alice@test.com', password: '' });
    expect(result.ok).toBe(false);
  });

  it('returns error when name is missing', () => {
    const result = registerUser({ name: '   ', email: 'alice@test.com', password: 'pass' });
    expect(result.ok).toBe(false);
  });

  it('returns error when email already exists', () => {
    registerUser({ name: 'Alice', email: 'dup@test.com', password: 'pass' });
    const result = registerUser({ name: 'Alice2', email: 'dup@test.com', password: 'pass2' });
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/already exists/i);
  });
});

// ─── authenticateUser ─────────────────────────────────────────────────────────
describe('authenticateUser', () => {
  beforeEach(() => {
    registerUser({ name: 'Carol', email: 'carol@test.com', password: 'secret' });
  });

  it('authenticates with correct credentials', () => {
    const result = authenticateUser({ email: 'carol@test.com', password: 'secret' });
    expect(result.ok).toBe(true);
    expect(result.user.name).toBe('Carol');
  });

  it('is case-insensitive on email', () => {
    const result = authenticateUser({ email: 'CAROL@TEST.COM', password: 'secret' });
    expect(result.ok).toBe(true);
  });

  it('fails with wrong password', () => {
    const result = authenticateUser({ email: 'carol@test.com', password: 'wrong' });
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/invalid/i);
  });

  it('fails with unknown email', () => {
    const result = authenticateUser({ email: 'nobody@test.com', password: 'secret' });
    expect(result.ok).toBe(false);
  });

  it('authenticates the hardcoded demo user', () => {
    const result = authenticateUser({ email: 'team10user', password: '123' });
    expect(result.ok).toBe(true);
  });
});

// ─── setCurrentUser / getCurrentUser / clearCurrentUser ──────────────────────
describe('session management', () => {
  it('setCurrentUser then getCurrentUser returns same user', () => {
    const user = { id: 'u1', name: 'Dan', email: 'dan@test.com' };
    setCurrentUser(user);
    expect(getCurrentUser()).toEqual({ ...user, _id: 'u1' });
  });

  it('getCurrentUser returns null when nothing stored', () => {
    expect(getCurrentUser()).toBeNull();
  });

  it('clearCurrentUser removes the session', () => {
    setCurrentUser({ id: 'u1', name: 'Dan' });
    clearCurrentUser();
    expect(getCurrentUser()).toBeNull();
  });
});

// ─── getUserHistory / addUserHistoryEntry ─────────────────────────────────────
describe('user history', () => {
  it('getUserHistory returns empty array for unknown userId', () => {
    expect(getUserHistory('nobody')).toEqual([]);
  });

  it('getUserHistory returns empty array when userId is falsy', () => {
    expect(getUserHistory(null)).toEqual([]);
    expect(getUserHistory('')).toEqual([]);
  });

  it('addUserHistoryEntry adds entry to front', () => {
    const entry1 = { id: 'e1', wellbeing: 70 };
    const entry2 = { id: 'e2', wellbeing: 80 };
    addUserHistoryEntry('u1', entry1);
    const updated = addUserHistoryEntry('u1', entry2);
    expect(updated[0]).toEqual(entry2);
    expect(updated[1]).toEqual(entry1);
  });

  it('addUserHistoryEntry caps history at 30', () => {
    for (let i = 0; i < 35; i++) {
      addUserHistoryEntry('u2', { id: `e${i}`, wellbeing: i });
    }
    expect(getUserHistory('u2').length).toBe(30);
  });

  it('addUserHistoryEntry returns empty array when userId is falsy', () => {
    expect(addUserHistoryEntry(null, { id: 'e1' })).toEqual([]);
  });

  it('addUserHistoryEntry returns empty array when entry is falsy', () => {
    expect(addUserHistoryEntry('u1', null)).toEqual([]);
  });

  it('getUserHistory reflects persisted entries', () => {
    const entry = { id: 'e1', wellbeing: 65 };
    addUserHistoryEntry('u3', entry);
    expect(getUserHistory('u3')).toEqual([entry]);
  });
});
