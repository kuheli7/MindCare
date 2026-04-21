import { describe, it, expect } from 'vitest';
import {
  getLevel,
  calculateScores,
  buildAssessmentEntry,
  formatDomainName,
  getPositiveMessage,
  getRecommendations,
  getTrendDirection
} from '../../utils/assessment.js';

// ─── getLevel ────────────────────────────────────────────────────────────────
describe('getLevel', () => {
  it('returns Low when percentage < 25', () => {
    const result = getLevel(3, 16); // 18.75%
    expect(result.label).toBe('Low');
    expect(result.color).toBe('#4CAF50');
  });

  it('returns Mild when percentage is 25–49', () => {
    const result = getLevel(6, 16); // 37.5%
    expect(result.label).toBe('Mild');
    expect(result.color).toBe('#FFC107');
  });

  it('returns Moderate when percentage is 50–74', () => {
    const result = getLevel(10, 16); // 62.5%
    expect(result.label).toBe('Moderate');
    expect(result.color).toBe('#FF9800');
  });

  it('returns High when percentage >= 75', () => {
    const result = getLevel(13, 16); // 81.25%
    expect(result.label).toBe('High');
    expect(result.color).toBe('#F44336');
  });

  it('returns Low at exactly 0%', () => {
    expect(getLevel(0, 16).label).toBe('Low');
  });

  it('returns High at exactly 100%', () => {
    expect(getLevel(16, 16).label).toBe('High');
  });

  it('boundary: 25% exactly is Mild', () => {
    expect(getLevel(4, 16).label).toBe('Mild'); // exactly 25%
  });

  it('boundary: 50% exactly is Moderate', () => {
    expect(getLevel(8, 16).label).toBe('Moderate'); // exactly 50%
  });

  it('boundary: 75% exactly is High', () => {
    expect(getLevel(12, 16).label).toBe('High'); // exactly 75%
  });
});

// ─── calculateScores ─────────────────────────────────────────────────────────
describe('calculateScores', () => {
  it('returns all 5 domains', () => {
    const scores = calculateScores({});
    expect(Object.keys(scores)).toEqual(['stress', 'anxiety', 'depression', 'burnout', 'sleep']);
  });

  it('returns zeros when results is empty', () => {
    const scores = calculateScores({});
    Object.values(scores).forEach(d => expect(d.score).toBe(0));
  });

  it('returns zeros when results is null/undefined', () => {
    const scores = calculateScores(null);
    Object.values(scores).forEach(d => expect(d.score).toBe(0));
  });

  it('calculates stress score from screen1 q1–q4', () => {
    const results = { screen1: { q1: 4, q2: 3, q3: 2, q4: 1 } };
    const scores = calculateScores(results);
    expect(scores.stress.score).toBe(10);
    expect(scores.stress.max).toBe(16);
    expect(scores.stress.percentage).toBe(62.5);
  });

  it('calculates anxiety score from screen1 q5–q8', () => {
    const results = { screen1: { q5: 2, q6: 2, q7: 2, q8: 2 } };
    const scores = calculateScores(results);
    expect(scores.anxiety.score).toBe(8);
    expect(scores.anxiety.percentage).toBe(50.0);
    expect(scores.anxiety.level.label).toBe('Moderate');
  });

  it('calculates depression score from screen2 q9–q12', () => {
    const results = { screen2: { q9: 1, q10: 1, q11: 1, q12: 1 } };
    const scores = calculateScores(results);
    expect(scores.depression.score).toBe(4);
  });

  it('calculates burnout score from screen2 q13–q16', () => {
    const results = { screen2: { q13: 4, q14: 4, q15: 4, q16: 4 } };
    const scores = calculateScores(results);
    expect(scores.burnout.score).toBe(16);
    expect(scores.burnout.level.label).toBe('High');
  });

  it('calculates sleep score from screen3 q17–q20 (max 12)', () => {
    const results = { screen3: { q17: 3, q18: 3, q19: 3, q20: 3 } };
    const scores = calculateScores(results);
    expect(scores.sleep.score).toBe(12);
    expect(scores.sleep.max).toBe(12);
    expect(scores.sleep.percentage).toBe(100.0);
  });

  it('ignores unknown screen keys gracefully', () => {
    const results = { screenX: { q1: 99 } };
    const scores = calculateScores(results);
    expect(scores.stress.score).toBe(0);
  });

  it('level reflects calculated percentage', () => {
    const results = { screen1: { q1: 0, q2: 0, q3: 0, q4: 0 } };
    const { stress } = calculateScores(results);
    expect(stress.level.label).toBe('Low');
  });
});

// ─── buildAssessmentEntry ────────────────────────────────────────────────────
describe('buildAssessmentEntry', () => {
  it('returns id, createdAt, domainScores, overallRisk, wellbeing', () => {
    const entry = buildAssessmentEntry({});
    expect(entry).toHaveProperty('id');
    expect(entry).toHaveProperty('createdAt');
    expect(entry).toHaveProperty('domainScores');
    expect(entry).toHaveProperty('overallRisk');
    expect(entry).toHaveProperty('wellbeing');
  });

  it('id starts with "assessment-"', () => {
    expect(buildAssessmentEntry({}).id).toMatch(/^assessment-/);
  });

  it('createdAt is a valid ISO date string', () => {
    expect(() => new Date(buildAssessmentEntry({}).createdAt)).not.toThrow();
  });

  it('overallRisk + wellbeing equals 100', () => {
    const entry = buildAssessmentEntry({
      screen1: { q1: 4, q2: 4, q3: 4, q4: 4, q5: 4, q6: 4, q7: 4, q8: 4 },
      screen2: { q9: 4, q10: 4, q11: 4, q12: 4, q13: 4, q14: 4, q15: 4, q16: 4 },
      screen3: { q17: 3, q18: 3, q19: 3, q20: 3 }
    });
    expect(entry.overallRisk + entry.wellbeing).toBeCloseTo(100, 1);
  });

  it('all-zero input gives overallRisk 0 and wellbeing 100', () => {
    const entry = buildAssessmentEntry({});
    expect(entry.overallRisk).toBe(0);
    expect(entry.wellbeing).toBe(100);
  });
});

// ─── formatDomainName ────────────────────────────────────────────────────────
describe('formatDomainName', () => {
  it('returns "Stress" for "stress"', () => expect(formatDomainName('stress')).toBe('Stress'));
  it('returns "Anxiety" for "anxiety"', () => expect(formatDomainName('anxiety')).toBe('Anxiety'));
  it('returns "Depression" for "depression"', () => expect(formatDomainName('depression')).toBe('Depression'));
  it('returns "Burnout" for "burnout"', () => expect(formatDomainName('burnout')).toBe('Burnout'));
  it('returns "Sleep Quality" for "sleep"', () => expect(formatDomainName('sleep')).toBe('Sleep Quality'));
  it('returns raw id for unknown domain', () => expect(formatDomainName('unknown')).toBe('unknown'));
});

// ─── getPositiveMessage ───────────────────────────────────────────────────────
describe('getPositiveMessage', () => {
  it('returns first-time message when history is empty', () => {
    const msg = getPositiveMessage([]);
    expect(msg).toContain('first step');
  });

  it('returns first-time message when history is null', () => {
    const msg = getPositiveMessage(null);
    expect(msg).toContain('first step');
  });

  it('returns first check-in message when history has one entry', () => {
    const msg = getPositiveMessage([{ wellbeing: 70 }]);
    expect(msg).toContain('first check-in');
  });

  it('returns upward trend message when wellbeing improved >= 5', () => {
    const history = [{ wellbeing: 80 }, { wellbeing: 70 }];
    expect(getPositiveMessage(history)).toContain('upward');
  });

  it('returns tough phase message when wellbeing dropped >= 5', () => {
    const history = [{ wellbeing: 60 }, { wellbeing: 70 }];
    expect(getPositiveMessage(history)).toContain('Tough');
  });

  it('returns steady message when trend is within ±5', () => {
    const history = [{ wellbeing: 71 }, { wellbeing: 70 }];
    expect(getPositiveMessage(history)).toContain('steady');
  });
});

// ─── getRecommendations ───────────────────────────────────────────────────────
describe('getRecommendations', () => {
  it('returns ["stress","sleep"] when history is empty', () => {
    expect(getRecommendations([])).toEqual(['stress', 'sleep']);
  });

  it('returns ["stress","sleep"] when history is null', () => {
    expect(getRecommendations(null)).toEqual(['stress', 'sleep']);
  });

  it('returns at most 3 recommendations', () => {
    const history = [{
      domainScores: {
        stress: { percentage: 80 },
        anxiety: { percentage: 70 },
        depression: { percentage: 60 },
        burnout: { percentage: 50 },
        sleep: { percentage: 45 }
      }
    }];
    expect(getRecommendations(history).length).toBeLessThanOrEqual(3);
  });

  it('includes high-risk domains (>= 40%) in recommendations', () => {
    const history = [{
      domainScores: {
        stress: { percentage: 80 },
        anxiety: { percentage: 20 },
        depression: { percentage: 10 },
        burnout: { percentage: 5 },
        sleep: { percentage: 5 }
      }
    }];
    const recs = getRecommendations(history);
    expect(recs).toContain('stress');
  });
});

// ─── getTrendDirection ────────────────────────────────────────────────────────
describe('getTrendDirection', () => {
  it('returns "steady" when history is null', () => {
    expect(getTrendDirection(null)).toBe('steady');
  });

  it('returns "steady" when history has only one entry', () => {
    expect(getTrendDirection([{ wellbeing: 70 }])).toBe('steady');
  });

  it('returns "up" when wellbeing increased by more than 1', () => {
    expect(getTrendDirection([{ wellbeing: 75 }, { wellbeing: 70 }])).toBe('up');
  });

  it('returns "down" when wellbeing decreased by more than 1', () => {
    expect(getTrendDirection([{ wellbeing: 65 }, { wellbeing: 70 }])).toBe('down');
  });

  it('returns "steady" when difference is exactly 1', () => {
    expect(getTrendDirection([{ wellbeing: 71 }, { wellbeing: 70 }])).toBe('steady');
  });

  it('returns "steady" when wellbeing is equal', () => {
    expect(getTrendDirection([{ wellbeing: 70 }, { wellbeing: 70 }])).toBe('steady');
  });
});
