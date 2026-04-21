import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';

import assessmentTypeRoutes from '../../routes/assessmentTypeRoutes.js';
import AssessmentType from '../../models/AssessmentType.js';
import User from '../../models/User.js';
import Admin from '../../models/Admin.js';

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/assessment-types', assessmentTypeRoutes);
  return app;
};

const mockAdminAuth = () => {
  User.findById = jest.fn(() => ({
    select: jest.fn().mockResolvedValue({ _id: 'admin1', role: 'admin' })
  }));
  Admin.findById = jest.fn(() => ({
    select: jest.fn().mockResolvedValue(null)
  }));
};

describe('assessmentTypeRoutes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  it('gets all assessment types', async () => {
    AssessmentType.find = jest.fn().mockResolvedValue([{ _id: 't1', name: 'General Wellness' }]);

    const app = buildApp();
    const res = await request(app).get('/api/assessment-types');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('returns 500 when listing assessment types fails', async () => {
    AssessmentType.find = jest.fn().mockRejectedValue(new Error('db down'));

    const app = buildApp();
    const res = await request(app).get('/api/assessment-types');

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Failed to fetch assessment types');
  });

  it('gets assessment type by id', async () => {
    AssessmentType.findById = jest.fn().mockResolvedValue({ _id: 't1', name: 'General Wellness' });

    const app = buildApp();
    const res = await request(app).get('/api/assessment-types/t1');

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('General Wellness');
  });

  it('returns 404 for missing assessment type by id', async () => {
    AssessmentType.findById = jest.fn().mockResolvedValue(null);

    const app = buildApp();
    const res = await request(app).get('/api/assessment-types/missing');

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Assessment type not found');
  });

  it('creates a new assessment type for admin token', async () => {
    mockAdminAuth();
    const token = jwt.sign({ id: 'admin1' }, process.env.JWT_SECRET);
    AssessmentType.prototype.save = jest.fn().mockResolvedValue({
      _id: 't2',
      name: 'Specialized Assessment',
      isSpecialized: true
    });

    const app = buildApp();
    const res = await request(app)
      .post('/api/assessment-types/admin')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Specialized Assessment', description: 'Deep check', isSpecialized: true });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Specialized Assessment');
    expect(res.body.isSpecialized).toBe(true);
  });

  it('returns 500 when assessment type creation fails', async () => {
    mockAdminAuth();
    const token = jwt.sign({ id: 'admin1' }, process.env.JWT_SECRET);
    AssessmentType.prototype.save = jest.fn().mockRejectedValue(new Error('save failed'));

    const app = buildApp();
    const res = await request(app)
      .post('/api/assessment-types/admin')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Specialized Assessment' });

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Failed to create assessment type');
  });
});
