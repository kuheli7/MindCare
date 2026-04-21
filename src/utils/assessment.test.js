import { describe, it, expect } from 'vitest';
import {
  getLevel,
  calculateScores,
  buildAssessmentEntry,
  formatDomainName,
  getPositiveMessage,
  getRecommendations,
  getTrendDirection
} from './assessment.js';

describe('assessment utils', () => {
  it('maps level bands correctly', () => {
    expect(getLevel(1, 16).label).toBe('Low');
    expect(getLevel(5, 16).label).toBe('Mild');
    expect(getLevel(9, 16).label).toBe('Moderate');
    expect(getLevel(13, 16).label).toBe('High');
  });

  it('calculates domain scores from questionnaire payload', () => {
    const payload = {
      screen1: { q1: 1, q2: 2, q3: 3, q4: 4, q5: 1, q6: 1, q7: 1, q8: 1 },
      screen2: { q9: 0, q10: 1, q11: 2, q12: 3, q13: 2, q14: 2, q15: 2, q16: 2 },
      screen3: { q17: 3, q18: 3, q19: 3, q20: 3 }
    };

    const scores = calculateScores(payload);

    expect(scores.stress.score).toBe(10);
    expect(scores.anxiety.score).toBe(4);
    expect(scores.depression.score).toBe(6);
    expect(scores.burnout.score).toBe(8);
    expect(scores.sleep.score).toBe(12);
  });

  it('builds assessment entry with derived overall risk and wellbeing', () => {
    const entry = buildAssessmentEntry({
      screen1: { q1: 1, q2: 1, q3: 1, q4: 1, q5: 1, q6: 1, q7: 1, q8: 1 },
      screen2: { q9: 1, q10: 1, q11: 1, q12: 1, q13: 1, q14: 1, q15: 1, q16: 1 },
      screen3: { q17: 1, q18: 1, q19: 1, q20: 1 }
    });

    expect(entry.id).toMatch(/^assessment-/);
    expect(entry.createdAt).toBeTruthy();
    expect(entry.overallRisk).toBeGreaterThanOrEqual(0);
    expect(entry.wellbeing).toBe(100 - entry.overallRisk);
  });

  it('returns domain names and sensible trend/recommendation helpers', () => {
    expect(formatDomainName('sleep')).toBe('Sleep Quality');

    const history = [
      {
        wellbeing: 60,
        domainScores: {
          stress: { percentage: 65 },
          anxiety: { percentage: 20 }
        }
      },
      {
        wellbeing: 54,
        domainScores: {
          stress: { percentage: 40 },
          anxiety: { percentage: 25 }
        }
      }
    ];

    expect(getTrendDirection(history)).toBe('up');
    expect(getRecommendations(history)).toContain('stress');
    expect(getPositiveMessage(history)).toMatch(/progress|upward|effort|showing/i);
  });
});
