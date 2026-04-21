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
} from './userData.js';

describe('userData utils', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('initializes demo user and registers new users', () => {
    const users = getStoredUsers();
    expect(users.team10user).toBeTruthy();

    const created = registerUser({ name: 'Kuheli', email: 'kuheli@mail.com', password: 'pass123' });
    expect(created.ok).toBe(true);
    expect(created.user.email).toBe('kuheli@mail.com');

    const duplicate = registerUser({ name: 'Kuheli', email: 'kuheli@mail.com', password: 'pass123' });
    expect(duplicate.ok).toBe(false);
  });

  it('authenticates with normalized email and persists session', () => {
    registerUser({ name: 'A User', email: 'A@Mail.com', password: 'pw' });

    const result = authenticateUser({ email: 'a@mail.com', password: 'pw' });
    expect(result.ok).toBe(true);

    setCurrentUser(result.user);
    expect(getCurrentUser()).toEqual(result.user);

    clearCurrentUser();
    expect(getCurrentUser()).toBeNull();
  });

  it('stores and trims history to 30 entries', () => {
    const userId = 'u1';
    for (let i = 0; i < 35; i++) {
      addUserHistoryEntry(userId, { id: `e-${i}` });
    }

    const history = getUserHistory(userId);
    expect(history).toHaveLength(30);
    expect(history[0].id).toBe('e-34');
  });
});
