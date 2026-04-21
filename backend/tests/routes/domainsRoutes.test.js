import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';

import domainsRoutes from '../../routes/domainsRoutes.js';
import Domain from '../../models/Domain.js';
import Question from '../../models/Question.js';
import Option from '../../models/Option.js';
import User from '../../models/User.js';
import Admin from '../../models/Admin.js';

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/domains', domainsRoutes);
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

describe('domainsRoutes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  it('returns 404 when no domains match names', async () => {
    Domain.find = jest.fn().mockResolvedValue([]);

    const app = buildApp();
    const res = await request(app).get('/api/domains/questions-by-domains/Unknown');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('No domains found');
  });

  it('returns questions and question-specific options', async () => {
    const domain = { _id: 'd1', domain_name: 'Anxiety' };
    const question = {
      _id: 'q1',
      question_text: 'Q1',
      domain_id: 'd1',
      assessment_type_id: 't1',
      weight: 1,
      option_set_id: 'set1'
    };

    Domain.find = jest.fn().mockResolvedValue([domain]);
    Question.find = jest.fn().mockResolvedValue([question]);
    Option.find = jest.fn(() => ({ sort: jest.fn().mockResolvedValue([{ _id: 'o1', option_text: 'A', points: 1 }]) }));

    const app = buildApp();
    const res = await request(app).get('/api/domains/questions-by-domains/Anxiety');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].options).toHaveLength(1);
  });

  it('falls back to option-set template options when question options are missing', async () => {
    const domain = { _id: 'd1', domain_name: 'Anxiety' };
    const question = {
      _id: 'q1',
      question_text: 'Q1',
      domain_id: 'd1',
      assessment_type_id: 't1',
      weight: 1,
      option_set_id: 'set1'
    };

    Domain.find = jest.fn().mockResolvedValue([domain]);
    Question.find = jest.fn().mockResolvedValue([question]);
    Option.find = jest
      .fn()
      .mockImplementationOnce(() => ({ sort: jest.fn().mockResolvedValue([]) }))
      .mockImplementationOnce(() => ({ sort: jest.fn().mockResolvedValue([{ _id: 'tmpl1', option_text: 'Template', points: 0 }]) }));

    const app = buildApp();
    const res = await request(app).get('/api/domains/questions-by-domains/Anxiety');

    expect(res.status).toBe(200);
    expect(res.body[0].options[0].option_text).toBe('Template');
  });

  it('applies assessment_type fallback by domain when typed question query is empty', async () => {
    const domain = { _id: 'd1', domain_name: 'Anxiety', assessment_type_id: 'spec1' };
    const fallbackQuestion = {
      _id: 'q2',
      question_text: 'Q2',
      domain_id: 'd1',
      assessment_type_id: 'legacy-missing',
      weight: 1,
      option_set_id: null
    };

    Domain.find = jest.fn().mockResolvedValue([domain]);
    Question.find = jest
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([fallbackQuestion]);
    Option.find = jest.fn(() => ({ sort: jest.fn().mockResolvedValue([]) }));

    const app = buildApp();
    const res = await request(app).get('/api/domains/questions-by-domains/Anxiety?assessment_type_id=spec1');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(Question.find).toHaveBeenCalledTimes(2);
  });

  it('returns all domains', async () => {
    Domain.find = jest.fn(() => ({ populate: jest.fn().mockResolvedValue([{ _id: 'd1' }]) }));

    const app = buildApp();
    const res = await request(app).get('/api/domains');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('creates domain for admin user', async () => {
    mockAdminAuth();
    const token = jwt.sign({ id: 'admin1' }, process.env.JWT_SECRET);

    const saved = { _id: 'd2', domain_name: 'Focus' };
    Domain.prototype.save = jest.fn().mockResolvedValue(saved);

    const app = buildApp();
    const res = await request(app)
      .post('/api/domains')
      .set('Authorization', `Bearer ${token}`)
      .send({ domain_name: 'Focus' });

    expect(res.status).toBe(201);
    expect(res.body.domain_name).toBe('Focus');
  });

  it('deletes domain and related options/questions for admin user', async () => {
    mockAdminAuth();
    const token = jwt.sign({ id: 'admin1' }, process.env.JWT_SECRET);

    Question.find = jest.fn().mockResolvedValue([{ _id: 'q1' }, { _id: 'q2' }]);
    Option.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 2 });
    Question.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 2 });
    Domain.findByIdAndDelete = jest.fn().mockResolvedValue({ _id: 'd1' });

    const app = buildApp();
    const res = await request(app)
      .delete('/api/domains/d1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Option.deleteMany).toHaveBeenCalled();
    expect(Question.deleteMany).toHaveBeenCalled();
    expect(Domain.findByIdAndDelete).toHaveBeenCalledWith('d1');
  });
});
