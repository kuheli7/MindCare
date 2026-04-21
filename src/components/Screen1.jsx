import { useState, useEffect } from 'react';
import QuestionCard from './QuestionCard';
import './Screen.css';

function Screen1({ answers, onUpdate, showValidation }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);

        // fetch assessment types so we can restrict to "general" questions
        let generalTypeId = null;
        try {
          const tRes = await fetch('http://localhost:5000/api/assessment-types');
          if (tRes.ok) {
            const types = await tRes.json();
            const general = types.find(t => !t.isSpecialized) || types[0];
            generalTypeId = general?._id;
          }
        } catch (e) {
          console.warn('Could not load assessment types, continuing without filter', e);
        }

        const url = `http://localhost:5000/api/domains/questions-by-domains/Stress,Anxiety${generalTypeId ? `?assessment_type_id=${generalTypeId}` : ''}`;
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
  }, []);

  if (loading) {
    return (
      <div className="screen-container">
        <div className="screen-header">
          <h2 className="screen-title">Stress & Anxiety Assessment</h2>
        </div>
        <div className="loading-message">Loading questions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="screen-container">
        <div className="screen-header">
          <h2 className="screen-title">Stress & Anxiety Assessment</h2>
        </div>
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="screen-container">
      <div className="screen-header">
        <h2 className="screen-title">Stress & Anxiety Assessment</h2>
        <p className="screen-description">
          Please answer the following {questions.length} questions about your stress and anxiety levels.
        </p>
      </div>

      <div className="questions-container">
        {questions.map((question, index) => {
          // Transform options from database format to QuestionCard format
          const scale = question.options
            .sort((a, b) => a.points - b.points) // Sort by points value
            .map(option => ({
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
                const selectedOption = question.options.find(opt => opt.points === value);
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
    </div>
  );
}

export default Screen1;

