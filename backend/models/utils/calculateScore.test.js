import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import Category from '../Category.js';
import { getCategoryForScore } from './calculateScore.js';

const makeFindMock = (rows) => {
  Category.find = jest.fn(() => ({
    sort: jest.fn(async () => rows)
  }));
};

describe('getCategoryForScore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns matching category when score is in range', async () => {
    const categories = [
      { min_score: 0, max_score: 39, label: 'Low' },
      { min_score: 40, max_score: 69, label: 'Medium' },
      { min_score: 70, max_score: 100, label: 'High' }
    ];
    makeFindMock(categories);

    const result = await getCategoryForScore('type-1', 55);

    expect(Category.find).toHaveBeenCalledWith({ assessment_type_id: 'type-1' });
    expect(result).toEqual(categories[1]);
  });

  it('returns first category when score is below the minimum', async () => {
    const categories = [
      { min_score: 10, max_score: 20, label: 'Low' },
      { min_score: 21, max_score: 40, label: 'High' }
    ];
    makeFindMock(categories);

    const result = await getCategoryForScore('type-2', 5);

    expect(result).toEqual(categories[0]);
  });

  it('returns last category when score is above the maximum', async () => {
    const categories = [
      { min_score: 0, max_score: 10, label: 'Low' },
      { min_score: 11, max_score: 30, label: 'High' }
    ];
    makeFindMock(categories);

    const result = await getCategoryForScore('type-3', 99);

    expect(result).toEqual(categories[1]);
  });

  it('returns next category when score falls in a range gap', async () => {
    const categories = [
      { min_score: 0, max_score: 40, label: 'Low' },
      { min_score: 50, max_score: 80, label: 'Medium' }
    ];
    makeFindMock(categories);

    const result = await getCategoryForScore('type-4', 45);

    expect(result).toEqual(categories[1]);
  });

  it('returns null when no categories are configured', async () => {
    makeFindMock([]);

    const result = await getCategoryForScore('type-5', 10);

    expect(result).toBeNull();
  });
});
