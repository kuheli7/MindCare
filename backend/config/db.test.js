import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import mongoose from 'mongoose';
import connectDB from './db.js';

describe('connectDB', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('connects successfully', async () => {
    mongoose.connect = jest.fn().mockResolvedValue({});
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await connectDB();

    expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGO_URI);
    expect(logSpy).toHaveBeenCalledWith('MongoDB Connected');
  });

  it('logs error and exits process on failure', async () => {
    const err = new Error('mongo failed');
    mongoose.connect = jest.fn().mockRejectedValue(err);
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });

    await expect(connectDB()).rejects.toThrow('process.exit called');
    expect(errorSpy).toHaveBeenCalledWith(err);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});