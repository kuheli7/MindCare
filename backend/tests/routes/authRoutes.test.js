import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import authRoutes from '../../routes/authRoutes.js';
import User from '../../models/User.js';
import Admin from '../../models/Admin.js';

const hashPassword = async (value, salt) => bcrypt.hash(String(value), salt);

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  return app;
};

describe('authRoutes', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    jest.clearAllMocks();
  });

  it('returns login salt for known users', async () => {
    const stored = await bcrypt.hash('123456', 10);
    User.findOne = jest.fn().mockResolvedValue({ password: stored });

    const app = buildApp();
    const res = await request(app)
      .post('/api/auth/login-salt')
      .send({ email: 'kuheli@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.salt).toBe(stored.slice(0, 29));
  });

  it('registers a new user', async () => {
    const registerHash = await bcrypt.hash('123456', 10);
    User.findOne = jest.fn().mockResolvedValue(null);
    User.create = jest.fn().mockResolvedValue({
      _id: 'u1',
      name: 'Kuheli',
      email: 'kuheli@example.com',
      role: 'student'
    });

    const app = buildApp();
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Kuheli', email: 'kuheli@example.com', password: registerHash });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      _id: 'u1',
      name: 'Kuheli',
      email: 'kuheli@example.com',
      role: 'student'
    });
    expect(res.body.token).toBeUndefined();
  });

  it('returns 400 when user already exists', async () => {
    const registerHash = await bcrypt.hash('123456', 10);
    User.findOne = jest.fn().mockResolvedValue({ _id: 'exists' });

    const app = buildApp();
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Kuheli', email: 'kuheli@example.com', password: registerHash });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('User already exists');
  });

  it('returns 500 on register exception', async () => {
    const registerHash = await bcrypt.hash('123456', 10);
    User.findOne = jest.fn().mockRejectedValue(new Error('db down'));

    const app = buildApp();
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Kuheli', email: 'kuheli@example.com', password: registerHash });

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Registration failed. Please try again.');
  });

  it('logs in a normal user', async () => {
    const stored = await bcrypt.hash('123456', 10);
    const loginHash = await hashPassword('123456', stored.slice(0, 29));
    User.findOne = jest.fn().mockResolvedValue({
      _id: 'u1',
      name: 'Kuheli',
      email: 'kuheli@example.com',
      role: 'student',
      password: stored
    });
    Admin.findOne = jest.fn().mockResolvedValue(null);

    const app = buildApp();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'kuheli@example.com', password: loginHash });

    expect(res.status).toBe(200);
    expect(res.body.role).toBe('student');
    expect(res.body.token).toBeUndefined();
  });

  it('logs in an admin user via fallback', async () => {
    const stored = await bcrypt.hash('123456', 10);
    const loginHash = await hashPassword('123456', stored.slice(0, 29));
    User.findOne = jest.fn().mockResolvedValue(null);
    Admin.findOne = jest.fn().mockResolvedValue({
      _id: 'a1',
      username: 'admin1',
      email: 'admin@example.com',
      password: stored
    });

    const app = buildApp();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: loginHash });

    expect(res.status).toBe(200);
    expect(res.body.role).toBe('admin');
    expect(res.body.name).toBe('admin1');
  });

  it('returns 401 for invalid login', async () => {
    const stored = await bcrypt.hash('123456', 10);
    const wrongHash = await hashPassword('badpass', stored.slice(0, 29));
    User.findOne = jest.fn().mockResolvedValue(null);
    Admin.findOne = jest.fn().mockResolvedValue(null);

    const app = buildApp();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'bad@example.com', password: wrongHash });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('returns 500 on login exception', async () => {
    const loginHash = await bcrypt.hash('123456', 10);
    User.findOne = jest.fn().mockRejectedValue(new Error('login broke'));

    const app = buildApp();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'x@example.com', password: loginHash });

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Login failed. Please try again.');
  });

  it('sets auth cookie on successful login', async () => {
    const stored = await bcrypt.hash('123456', 10);
    const loginHash = await hashPassword('123456', stored.slice(0, 29));
    User.findOne = jest.fn().mockResolvedValue({
      _id: 'u1',
      name: 'Kuheli',
      email: 'kuheli@example.com',
      role: 'student',
      password: stored
    });

    const app = buildApp();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'kuheli@example.com', password: loginHash });

    expect(res.status).toBe(200);
    expect(res.headers['set-cookie']).toBeDefined();
    expect(res.headers['set-cookie'][0]).toContain('mindcare_token=');
  });

  it('rejects unhashed password payload', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'kuheli@example.com', password: '123456' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Password must be sent as a bcrypt hash.');
  });
});
