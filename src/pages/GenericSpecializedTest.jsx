import { useEffect, useMemo, useState } from 'react';
import QuestionCard from '../components/QuestionCard';
import '../components/Screen.css';
import './SpecializedTest.css';
import { apiCall } from '../config/api.js';

function GenericSpecializedTest({ domainName, onComplete, onBack }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState({});
  const [showWarning, setShowWarning] = useState(false);
  const [optionalData, setOptionalData] = useState({});

  const pageTitle = useMemo(() => `${domainName} Assessment`, [domainName]);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        let specTypeId = null;
        try {
          const types = await apiCall('/assessment-types');
          const specialized = types.find((t) => t.isSpecialized);
          specTypeId = specialized?._id;
        } catch (e) {
          console.warn('could not load assessment types', e);
        }

        const encodedDomain = encodeURIComponent(domainName);
        const endpoint = `/domains/questions-by-domains/${encodedDomain}${specTypeId ? `?assessment_type_id=${specTypeId}` : ''}`;
        const data = await apiCall(endpoint);
        setQuestions(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching questions:', err);
        setError('Failed to load questions. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (domainName) {
      fetchQuestions();
    }
  }, [domainName]);

  const handleSelect = (questionId, value, optionId) => {
    setAnswers((prev) => ({ ...prev, [questionId]: { points: value, option_id: optionId } }));
    setShowWarning(false);
  };

  const handleOptionalUpdate = (data) => {
    setOptionalData((prev) => ({ ...prev, ...data }));
  };

  const handleSubmit = () => {
    const allAnswered = questions.every((q) => answers[q._id] !== undefined);
    if (!allAnswered) {
      setShowWarning(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    onComplete({ screen1: answers, screen2: {}, screen3: {}, optional: optionalData });
  };

  const answeredCount = Object.keys(answers).length;
  const totalCount = questions.length;
  const progress = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;

  return (
    <div className="specialized-test-page">
      <div className="specialized-test-banner stress-banner">
        <div>
          <h1 className="specialized-test-banner-title">{pageTitle}</h1>
          <p className="specialized-test-banner-subtitle">
            Please answer honestly to get meaningful, personalized insights.
          </p>
        </div>
      </div>

      <div className="questionnaire-container">
        <div className="progress-bar-container card">
          <div className="progress-info">
            <span className="progress-text">
              {answeredCount} of {totalCount} questions answered
            </span>
            <span className="progress-percentage">{progress}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="questionnaire-content card">
          {showWarning && (
            <div className="validation-warning">
              ⚠️ Please answer all questions before submitting.
            </div>
          )}

          {loading && <div className="loading-message">Loading questions...</div>}
          {error && <div className="error-message">{error}</div>}

          {!loading && !error && (
            <>
              <div className="screen-header">
                <h2 className="screen-title">{pageTitle}</h2>
                <p className="screen-description">
                  Please answer the following {questions.length} questions.
                </p>
              </div>

              <div className="questions-container">
                {questions.map((question, index) => {
                  const scale = question.options
                    .sort((a, b) => a.points - b.points)
                    .map((option) => ({ value: option.points, label: option.option_text }));

                  return (
                    <QuestionCard
                      key={question._id}
                      questionNumber={index + 1}
                      question={question.question_text}
                      scale={scale}
                      selectedValue={answers[question._id]?.points}
                      isUnanswered={showWarning && answers[question._id] === undefined}
                      onSelect={(value) => {
                        const opt = question.options.find((o) => o.points === value);
                        handleSelect(question._id, value, opt?._id);
                      }}
                    />
                  );
                })}
              </div>

              <div className="optional-section">
                <h3 className="optional-title">Optional Information</h3>
                <p className="optional-description">
                  The following fields are completely optional and will not affect your results.
                </p>

                <div className="optional-fields">
                  <div className="form-group">
                    <label htmlFor="gender">Gender (Optional)</label>
                    <select
                      id="gender"
                      value={optionalData.gender || ''}
                      onChange={(e) => handleOptionalUpdate({ gender: e.target.value })}
                      className="form-input"
                    >
                      <option value="">Prefer not to say</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="non-binary">Non-binary</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="location">Location (Optional)</label>
                    <input
                      id="location"
                      type="text"
                      value={optionalData.location || ''}
                      onChange={(e) => handleOptionalUpdate({ location: e.target.value })}
                      placeholder="e.g., City, Country"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email (Optional)</label>
                    <input
                      id="email"
                      type="email"
                      value={optionalData.email || ''}
                      onChange={(e) => handleOptionalUpdate({ email: e.target.value })}
                      placeholder="your.email@example.com"
                      className="form-input"
                    />
                    <div className="checkbox-group">
                      <input
                        id="emailCopy"
                        type="checkbox"
                        checked={optionalData.emailCopy || false}
                        onChange={(e) => handleOptionalUpdate({ emailCopy: e.target.checked })}
                      />
                      <label htmlFor="emailCopy">Email me a copy of my results</label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="navigation-buttons">
                <button className="btn btn-secondary" onClick={onBack}>
                  ← Back
                </button>
                <button className="btn btn-primary" onClick={handleSubmit}>
                  Submit & View Results
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default GenericSpecializedTest;
