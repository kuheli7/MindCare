import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Results from '../../pages/Results.jsx';

vi.mock('../../pages/Results.css', () => ({}));
vi.mock('react-icons/fa', () => ({
  FaExclamationTriangle: () => <span data-testid="warning-icon" />
}));

describe('Results Page', () => {
  const mockOnRetake = vi.fn();
  const mockOnHome = vi.fn();
  const mockOnDashboard = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const baseProps = {
    onRetake: mockOnRetake,
    onHome: mockOnHome,
    onDashboard: mockOnDashboard
  };

  const sampleResults = {
    total_score: 50,
    maximum_total_score: 100,
    overall_normalized_score: 50.5,
    risk_level: 'Medium Risk',
    domain_scores: [
      { domain_id: 'd1', domain_name: 'Anxiety', score: 10, max_score: 20, normalized_score: 50 },
      { domain_id: 'd2', domain_name: 'Stress', score: 5, max_score: 20, normalized_score: 25 }
    ],
    recommendations: [
      { test_name: 'Deep Anxiety Check', reason: 'High anxiety levels detected' }
    ]
  };

  it('renders empty state when no results provided', async () => {
    render(<Results {...baseProps} results={null} />);
    
    expect(screen.getByText(/No Results Available/i)).toBeInTheDocument();
    
    // Check buttons in empty state
    await userEvent.click(screen.getByRole('button', { name: /Start Assessment/i }));
    expect(mockOnRetake).toHaveBeenCalledTimes(1);
    
    await userEvent.click(screen.getByRole('button', { name: /Back to Home/i }));
    expect(mockOnHome).toHaveBeenCalledTimes(1);
  });

  it('renders overall scores and risk levels', () => {
    render(<Results {...baseProps} results={sampleResults} />);
    
    expect(screen.getByText(/Your Assessment Results/i)).toBeInTheDocument();
    expect(screen.getByText(/Medium Risk/i)).toBeInTheDocument();
    // Use string because component renders: "Normalized Score: 50.5%"
    expect(screen.getByText(/Normalized Score: 50.5%/i)).toBeInTheDocument();
  });

  it('renders individual domain scores', () => {
    render(<Results {...baseProps} results={sampleResults} />);
    
    expect(screen.getByText('Anxiety')).toBeInTheDocument();
    expect(screen.getByText('Stress')).toBeInTheDocument();
    
    // Expect 50.0% and 25.0%
    expect(screen.getByText('50.0%')).toBeInTheDocument();
    expect(screen.getByText('25.0%')).toBeInTheDocument();
  });

  it('renders recommendations if available', () => {
    render(<Results {...baseProps} results={sampleResults} />);
    
    expect(screen.getByText('Recommendations')).toBeInTheDocument();
    expect(screen.getByText(/Deep Anxiety Check/i)).toBeInTheDocument();
  });

  it('renders email success toast', async () => {
    vi.useFakeTimers();
    const resultsWithEmail = {
      ...sampleResults,
      emailStatus: { requested: true, sent: true }
    };
    render(<Results {...baseProps} results={resultsWithEmail} />);
    
    const toast = screen.getByRole('status');
    expect(toast).toHaveTextContent(/Email sent successfully/i);
    expect(toast).toHaveClass('email-toast-success');
    
    // Toast auto-hides after 4000ms
    act(() => {
      vi.advanceTimersByTime(4500);
    });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it('renders email warning toast', () => {
    const resultsWithEmailFail = {
      ...sampleResults,
      emailStatus: { requested: true, sent: false, reason: 'Network error' }
    };
    render(<Results {...baseProps} results={resultsWithEmailFail} />);
    
    const toast = screen.getByRole('status');
    expect(toast).toHaveTextContent('Network error');
    expect(toast).toHaveClass('email-toast-warning');
  });

  it('triggers action buttons in results info card', async () => {
    render(<Results {...baseProps} results={sampleResults} />);
    
    await userEvent.click(screen.getByRole('button', { name: /View My Dashboard/i }));
    expect(mockOnDashboard).toHaveBeenCalled();
    
    await userEvent.click(screen.getByRole('button', { name: /Retake Assessment/i }));
    expect(mockOnRetake).toHaveBeenCalled();
    
    await userEvent.click(screen.getByRole('button', { name: /Back to Home/i }));
    expect(mockOnHome).toHaveBeenCalled();
  });
});
