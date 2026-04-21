import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import User from '../../models/User.js';
import Admin from '../../models/Admin.js';
import { protect, admin } from '../../middleware/authMiddleware.js';

const buildRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

describe('authMiddleware.protect', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  it('attaches user and calls next for valid user token', async () => {
    const token = jwt.sign({ id: 'u1' }, process.env.JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = buildRes();
    const next = jest.fn();

    User.findById = jest.fn(() => ({ select: jest.fn().mockResolvedValue({ _id: 'u1', role: 'student' }) }));
    Admin.findById = jest.fn(() => ({ select: jest.fn().mockResolvedValue(null) }));

    await protect(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user._id).toBe('u1');
  });

  it('falls back to admin collection and sets role', async () => {
    const token = jwt.sign({ id: 'a1' }, process.env.JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = buildRes();
    const next = jest.fn();

    User.findById = jest.fn(() => ({ select: jest.fn().mockResolvedValue(null) }));
    Admin.findById = jest.fn(() => ({ select: jest.fn().mockResolvedValue({ _id: 'a1', username: 'admin1' }) }));

    await protect(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user.role).toBe('admin');
  });

  it('returns 401 when no token provided', async () => {
    const req = { headers: {} };
    const res = buildRes();
    const next = jest.fn();

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when token is invalid', async () => {
    const req = { headers: { authorization: 'Bearer bad.token.here' } };
    const res = buildRes();
    const next = jest.fn();

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('authMiddleware.admin', () => {
  it('allows admin user', () => {
    const req = { user: { role: 'admin' } };
    const res = buildRes();
    const next = jest.fn();

    admin(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('rejects non-admin user', () => {
    const req = { user: { role: 'student' } };
    const res = buildRes();
    const next = jest.fn();

    admin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
