const DOMAIN_META = {
  stress: { name: 'Stress', max: 16 },
  anxiety: { name: 'Anxiety', max: 16 },
  depression: { name: 'Depression', max: 16 },
  burnout: { name: 'Burnout', max: 16 },
  sleep: { name: 'Sleep Quality', max: 12 }
};

const SCORE_COLORS = {
  low: '#4CAF50',
  mild: '#FFC107',
  moderate: '#FF9800',
  high: '#F44336'
};

const QUESTION_MAP = {
  stress: { screen: 'screen1', questions: [1, 2, 3, 4] },
  anxiety: { screen: 'screen1', questions: [5, 6, 7, 8] },
  depression: { screen: 'screen2', questions: [9, 10, 11, 12] },
  burnout: { screen: 'screen2', questions: [13, 14, 15, 16] },
  sleep: { screen: 'screen3', questions: [17, 18, 19, 20] }
};

export const getLevel = (score, max) => {
  const percentage = (score / max) * 100;
  if (percentage < 25) return { label: 'Low', color: SCORE_COLORS.low };
  if (percentage < 50) return { label: 'Mild', color: SCORE_COLORS.mild };
  if (percentage < 75) return { label: 'Moderate', color: SCORE_COLORS.moderate };
  return { label: 'High', color: SCORE_COLORS.high };
};

export const calculateScores = (results) => {
  const safeResults = results || {};

  return Object.entries(QUESTION_MAP).reduce((acc, [domain, config]) => {
    const source = safeResults[config.screen] || {};
    const score = config.questions.reduce((sum, number) => sum + (source[`q${number}`] || 0), 0);
    const max = DOMAIN_META[domain].max;
    const percentage = Number(((score / max) * 100).toFixed(1));

    acc[domain] = {
      score,
      max,
      percentage,
      level: getLevel(score, max)
    };

    return acc;
  }, {});
};

export const buildAssessmentEntry = (results) => {
  const domainScores = calculateScores(results);
  const percentages = Object.values(domainScores).map(item => item.percentage);
  const overallRisk = Number((percentages.reduce((a, b) => a + b, 0) / percentages.length).toFixed(1));
  const wellbeing = Number((100 - overallRisk).toFixed(1));

  return {
    id: `assessment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    domainScores,
    overallRisk,
    wellbeing
  };
};

export const formatDomainName = (domainId) => DOMAIN_META[domainId]?.name || domainId;

export const getPositiveMessage = (history) => {
  if (!history?.length) {
    return 'A small self-check is a powerful first step. Start one assessment and build momentum from there.';
  }

  if (history.length === 1) {
    return 'You completed your first check-in. Consistency matters more than perfection, so keep going at your pace.';
  }

  const latest = history[0];
  const previous = history[1];
  const trend = latest.wellbeing - previous.wellbeing;

  if (trend >= 5) {
    return 'Great progress. Your latest wellbeing trend is moving upward, which shows your effort is paying off.';
  }

  if (trend <= -5) {
    return 'Tough phases happen. You are still taking action, and that awareness is a strong part of recovery.';
  }

  return 'Your trend is steady. Small daily habits can create meaningful change over time—keep showing up for yourself.';
};

export const getRecommendations = (history) => {
  const allDomains = Object.keys(DOMAIN_META);

  if (!history?.length) {
    return ['stress', 'sleep'];
  }

  const latestDomainScores = history[0].domainScores || {};
  const highestRisk = Object.entries(latestDomainScores)
    .sort((a, b) => b[1].percentage - a[1].percentage)
    .filter(([, data]) => data.percentage >= 40)
    .map(([domainId]) => domainId);

  const counts = history.reduce((acc, item) => {
    Object.keys(item.domainScores || {}).forEach((domainId) => {
      acc[domainId] = (acc[domainId] || 0) + 1;
    });
    return acc;
  }, {});

  const leastTaken = allDomains
    .sort((a, b) => (counts[a] || 0) - (counts[b] || 0));

  const combined = [...highestRisk, ...leastTaken];
  return Array.from(new Set(combined)).slice(0, 3);
};

export const getTrendDirection = (history) => {
  if (!history || history.length < 2) {
    return 'steady';
  }

  const diff = history[0].wellbeing - history[1].wellbeing;
  if (diff > 1) return 'up';
  if (diff < -1) return 'down';
  return 'steady';
};
