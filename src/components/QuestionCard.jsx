import './QuestionCard.css';

function QuestionCard({ questionNumber, question, scale, selectedValue, onSelect, isUnanswered }) {
  return (
    <div className={`question-card ${isUnanswered ? 'unanswered' : ''}`}>
      <div className="question-header">
        <span className="question-number">Q{questionNumber}</span>
        <p className="question-text">{question}</p>
      </div>
      
      <div className="scale-options">
        {scale.map((option) => (
          <button
            key={option.value}
            className={`scale-option ${selectedValue === option.value ? 'selected' : ''}`}
            onClick={() => onSelect(option.value)}
          >
            <span className="option-value">{option.value}</span>
            <span className="option-label">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default QuestionCard;
