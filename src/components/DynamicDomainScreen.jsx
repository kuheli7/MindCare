import { useEffect, useMemo, useState } from 'react';
import QuestionCard from './QuestionCard';
import './Screen.css';

function DynamicDomainScreen({
  domainNames = [],
  answers,
  onUpdate,
  showValidation,
  optionalData,
  onOptionalUpdate,
  showOptionalSection = false
}) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const title = useMemo(() => `${domainNames.join(' & ')} Assessment`, [domainNames]);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);

        let generalTypeId = null;
        try {
          const tRes = await fetch('http://localhost:5000/api/assessment-types');
          if (tRes.ok) {
            const types = await tRes.json();
            const general = types.find((t) => !t.isSpecialized) || types[0];
            generalTypeId = general?._id;
          }
        } catch (e) {
          console.warn('Could not load assessment types, continuing without filter', e);
        }

        const encoded = encodeURIComponent(domainNames.join(','));
        const url = `http://localhost:5000/api/domains/questions-by-domains/${encoded}${generalTypeId ? `?assessment_type_id=${generalTypeId}` : ''}`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch questions');
        }

        const data = await response.json();
        setQuestions(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching questions:', err);
        setError('Failed to load questions. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [domainNames]);

  if (loading) {
    return (
      <div className="screen-container">
        <div className="screen-header">
          <h2 className="screen-title">{title}</h2>
        </div>
        <div className="loading-message">Loading questions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="screen-container">
        <div className="screen-header">
          <h2 className="screen-title">{title}</h2>
        </div>
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="screen-container">
      <div className="screen-header">
        <h2 className="screen-title">{title}</h2>
        <p className="screen-description">
          Please answer the following {questions.length} questions.
        </p>
      </div>

      <div className="questions-container">
        {questions.map((question, index) => {
          const scale = question.options
            .sort((a, b) => a.points - b.points)
            .map((option) => ({
              value: option.points,
              label: option.option_text
            }));

          return (
            <QuestionCard
              key={question._id}
              questionNumber={index + 1}
              question={question.question_text}
              scale={scale}
              selectedValue={answers[question._id]?.points}
              onSelect={(value) => {
                const selectedOption = question.options.find((opt) => opt.points === value);
                onUpdate({
                  [question._id]: {
                    points: value,
                    option_id: selectedOption?._id
                  }
                });
              }}
              isUnanswered={showValidation && answers[question._id] === undefined}
            />
          );
        })}
      </div>

      {showOptionalSection && (
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
                onChange={(e) => onOptionalUpdate({ gender: e.target.value })}
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
                onChange={(e) => onOptionalUpdate({ location: e.target.value })}
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
                onChange={(e) => onOptionalUpdate({ email: e.target.value })}
                placeholder="your.email@example.com"
                className="form-input"
              />
              <div className="checkbox-group">
                <input
                  id="emailCopy"
                  type="checkbox"
                  checked={optionalData.emailCopy || false}
                  onChange={(e) => onOptionalUpdate({ emailCopy: e.target.checked })}
                />
                <label htmlFor="emailCopy">Email me a copy of my results</label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DynamicDomainScreen;
