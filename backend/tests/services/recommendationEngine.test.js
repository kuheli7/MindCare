import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import AssessmentType from '../../models/AssessmentType.js';
import { getRecommendations } from '../../services/recommendationEngine.js';

const specializedTypes = [
  { _id: 's1', name: 'Stress Assessment' },
  { _id: 's2', name: 'Sleep Assessment' },
  { _id: 's3', name: 'Burnout Assessment' }
];

describe('getRecommendations', () => {
  beforeEach(() => {
    AssessmentType.find = jest.fn(async () => specializedTypes);
  });

  it('returns recommendations based on category labels', async () => {
    const category = { label: 'High Stress and poor sleep with burnout signs' };

    const result = await getRecommendations(10, category);

    expect(AssessmentType.find).toHaveBeenCalledWith({ isSpecialized: true });
    expect(result.map((r) => r.name)).toEqual([
      'Stress Assessment',
      'Sleep Assessment',
      'Burnout Assessment'
    ]);
  });

  it('returns recommendations based on score thresholds', async () => {
    const result = await getRecommendations(26, { label: 'General Risk' });

    expect(result.map((r) => r.name)).toEqual([
      'Stress Assessment',
      'Sleep Assessment',
      'Burnout Assessment'
    ]);
  });

  it('returns empty array when no category is provided', async () => {
    const result = await getRecommendations(30, null);

    expect(result).toEqual([]);
  });
});
