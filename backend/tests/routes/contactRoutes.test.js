import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import nodemailer from 'nodemailer';
import contactRoutes from '../../routes/contactRoutes.js';

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/contact', contactRoutes);
  return app;
};

describe('contactRoutes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SMTP_HOST = 'smtp.gmail.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_SECURE = 'false';
    process.env.EMAIL_FROM = 'MindCare <sender@example.com>';
    process.env.CONTACT_RECEIVER_EMAIL = 'owner@example.com';
  });

  it('rejects missing required fields', async () => {
    const app = buildApp();
    const res = await request(app).post('/api/contact').send({ name: '', email: '', subject: '', message: '' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('All fields are required.');
  });

  it('rejects invalid email', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/api/contact')
      .send({ name: 'Kuheli', email: 'bad-email', subject: 'Hi', message: 'Hello' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Please enter a valid email address.');
  });

  it('rejects too-short message', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/api/contact')
      .send({ name: 'Kuheli', email: 'kuheli@example.com', subject: 'Hi there', message: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Message must be between');
  });

  it('rejects line break injection in subject', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/api/contact')
      .send({
        name: 'Kuheli',
        email: 'kuheli@example.com',
        subject: 'Hello\nBCC: attacker@example.com',
        message: 'This is a long enough message.'
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Invalid characters were found in your request.');
  });

  it('returns config error when SMTP credentials are missing', async () => {
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;

    const app = buildApp();
    const res = await request(app)
      .post('/api/contact')
      .send({ name: 'Kuheli', email: 'kuheli@example.com', subject: 'Need support', message: 'Hello, this is a valid message.' });

    expect(res.status).toBe(500);
    expect(res.body.message).toContain('not configured');
  });

  it('sends contact email and confirmation email', async () => {
    process.env.SMTP_USER = 'smtp@example.com';
    process.env.SMTP_PASS = 'secret';

    const sendMail = jest.fn().mockResolvedValue({ messageId: 'ok' });
    jest.spyOn(nodemailer, 'createTransport').mockReturnValue({ sendMail });

    const app = buildApp();
    const res = await request(app)
      .post('/api/contact')
      .send({ name: 'Kuheli', email: 'kuheli@example.com', subject: 'Need support', message: 'Hello, this is a valid message.' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.routedTo).toBe('owner@example.com');
    expect(sendMail).toHaveBeenCalledTimes(2);
  });

  it('returns config error when receiver email is invalid', async () => {
    process.env.SMTP_USER = 'smtp@example.com';
    process.env.SMTP_PASS = 'secret';
    process.env.CONTACT_RECEIVER_EMAIL = 'invalid-email';

    const app = buildApp();
    const res = await request(app)
      .post('/api/contact')
      .send({ name: 'Kuheli', email: 'kuheli@example.com', subject: 'Hi there', message: 'This is long enough.' });

    expect(res.status).toBe(500);
    expect(res.body.message).toContain('Contact receiver email is invalid');
  });

  it('returns 500 if primary sendMail fails', async () => {
    process.env.SMTP_USER = 'smtp@example.com';
    process.env.SMTP_PASS = 'secret';

    const sendMail = jest.fn().mockRejectedValue(new Error('smtp failed'));
    jest.spyOn(nodemailer, 'createTransport').mockReturnValue({ sendMail });

    const app = buildApp();
    const res = await request(app)
      .post('/api/contact')
      .send({ name: 'Kuheli', email: 'kuheli@example.com', subject: 'Need support', message: 'Hello, this is a valid message.' });

    expect(res.status).toBe(500);
    expect(res.body.message).toContain('Failed to send message');
  });
});
