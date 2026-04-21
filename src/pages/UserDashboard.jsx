import { FaArrowUp, FaArrowDown, FaMinus, FaChartLine, FaClipboardList, FaSmileBeam } from 'react-icons/fa';
import {
  formatDomainName,
  getPositiveMessage,
  getRecommendations,
  getTrendDirection
} from '../utils/assessment';
import './UserDashboard.css';

const recommendationDescriptions = {
  stress: 'Useful when deadlines, pressure, or overload feel intense.',
  anxiety: 'Helpful for recurring worry, tension, or panic-like moments.',
  depression: 'Best for checking low mood, energy, and motivation patterns.',
  burnout: 'Great for understanding emotional exhaustion and fatigue.',
  sleep: 'Ideal if rest quality or sleep rhythm is affecting your day.'
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const buildTrendPath = (history) => {
  const points = history.slice(0, 7).reverse();
  if (!points.length) return '';

  return points
    .map((item, index) => {
      const x = points.length === 1 ? 10 : 10 + (index * 80) / (points.length - 1);
      const y = 95 - (item.wellbeing * 0.85);
      return `${x},${Math.max(10, Math.min(95, y))}`;
    })
    .join(' ');
};

const capitalizeFirst = (value = '') => {
  const text = String(value).trim();
  if (!text) return 'friend';
  return text.charAt(0).toUpperCase() + text.slice(1);
};

function UserDashboard({ user, history, domainInfo = {}, onStartCombinedTest, onStartSpecificTest, onOpenTests, view = 'overview' }) {
  const totalTests = history.length;
  const avgWellbeing = totalTests
    ? Number((history.reduce((sum, item) => sum + item.wellbeing, 0) / totalTests).toFixed(1))
    : null;

  const trendDirection = getTrendDirection(history);
  const recommendations = getRecommendations(history);
  const positiveMessage = getPositiveMessage(history);
  const trendPath = buildTrendPath(history);

  const renderRecommendations = () => (
    <section className="dashboard-panel card">
      <h2>Recommended Next Tests</h2>
      <div className="recommendation-grid">
        {recommendations.map((domainId) => {
          const desc = domainInfo[domainId]?.description || recommendationDescriptions[domainId];
          const displayName = domainInfo[domainId]?.domain_name || formatDomainName(domainId);
          return (
            <div key={domainId} className="recommendation-card">
              <h3>{displayName}</h3>
              <p>{desc}</p>
              <button className="btn btn-secondary" onClick={() => onStartSpecificTest(domainId)}>
                Start {displayName} Test
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );

  const renderHistory = () => (
    <section className="dashboard-panel card">
      <h2>Previous Tests</h2>
      {history.length ? (
        <div className="history-list">
          {history.slice(0, 12).map((entry) => (
            <article key={entry.id} className="history-item">
              <div className="history-item-header">
                <strong>{formatDate(entry.createdAt)}</strong>
                <span className="history-score">Wellbeing {(Number(entry.wellbeing) || 0).toFixed(1)}%</span>
              </div>
              <div className="history-progress-track">
                <div className="history-progress-fill" style={{ width: `${entry.wellbeing}%` }} />
              </div>
              <div className="history-tags">
                {Object.entries(entry.domainScores || {}).map(([domainId, domainData]) => {
                  const displayName = domainInfo[domainId]?.domain_name || formatDomainName(domainId);
                  return (
                    <span key={`${entry.id}-${domainId}`} className="history-tag">
                      {displayName}: {domainData.level.label}
                    </span>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="history-empty">Your completed tests will appear here after your first assessment.</p>
      )}
    </section>
  );

  const renderAnalytics = () => (
    <>
      <section className="user-stats-grid">
        <article className="user-stat-card card">
          <h3><FaClipboardList /> Total Tests</h3>
          <p className="user-stat-number">{totalTests}</p>
          <span>Saved in your account</span>
        </article>

        <article className="user-stat-card card">
          <h3><FaChartLine /> Average Wellbeing</h3>
          <p className="user-stat-number">{avgWellbeing !== null ? `${avgWellbeing}%` : '--'}</p>
          <span>Higher is better over time</span>
        </article>

        <article className="user-stat-card card">
          <h3>
            {trendDirection === 'up' && <FaArrowUp className="trend-up" />}
            {trendDirection === 'down' && <FaArrowDown className="trend-down" />}
            {trendDirection === 'steady' && <FaMinus className="trend-steady" />}
            Trend
          </h3>
          <p className="user-stat-number">
            {trendDirection === 'up' ? 'Improving' : trendDirection === 'down' ? 'Needs Attention' : 'Stable'}
          </p>
          <span>Compared with your previous test</span>
        </article>
      </section>

      <section className="user-main-grid">
        <article className="dashboard-panel card">
          <h2>Wellbeing Trend</h2>
          {history.length ? (
            <>
              <svg viewBox="0 0 100 100" className="trend-chart" role="img" aria-label="Wellbeing trend chart">
                <line x1="10" y1="10" x2="10" y2="95" />
                <line x1="10" y1="95" x2="90" y2="95" />
                <polyline points={trendPath} fill="none" stroke="#2c2c2c" strokeWidth="2.5" />
              </svg>
              <p className="panel-caption">Last {Math.min(history.length, 7)} assessments</p>
            </>
          ) : (
            <div className="empty-state">
              <p>No test history yet. Complete your first assessment to unlock trend insights.</p>
              <button className="btn btn-secondary" onClick={onStartCombinedTest}>Start Now</button>
            </div>
          )}
        </article>

        <article className="dashboard-panel card">
          <h2><FaSmileBeam /> Positive Momentum</h2>
          <p className="positive-message">{positiveMessage}</p>
          <div className="quick-actions">
            <button className="btn btn-secondary" onClick={onOpenTests}>Browse Tests</button>
            <button className="btn btn-primary" onClick={onStartCombinedTest}>Retake Full Check</button>
          </div>
        </article>
      </section>
    </>
  );

  return (
    <div className="user-dashboard-container">
      <section className="user-dashboard-header card">
        <div>
          <h1>Your Wellness Dashboard</h1>
          <p>
            Welcome back, {capitalizeFirst(user?.name)}. Track your progress, revisit your past tests,
            and take your next best assessment step.
          </p>
          {user?.email && (
            <p className="user-detail">Signed in as <strong>{user.email}</strong></p>
          )}
        </div>
        <button className="btn btn-primary" onClick={onStartCombinedTest}>
          Take Full Assessment
        </button>
      </section>

      {(view === 'overview' || view === 'analytics') && renderAnalytics()}
      {(view === 'overview' || view === 'recommendations') && renderRecommendations()}
      {(view === 'overview' || view === 'history') && renderHistory()}
    </div>
  );
}

export default UserDashboard;
