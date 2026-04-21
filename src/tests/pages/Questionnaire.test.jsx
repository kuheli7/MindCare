import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Questionnaire from '../../pages/Questionnaire.jsx';

vi.mock('../../pages/Questionnaire.css', () => ({}));

// Mock the individual screens to simplify testing of the parent Questionnaire component logic
vi.mock('../../components/Screen1', () => ({
  default: ({ onUpdate }) => (
    <div data-testid="screen-1">
      Screen 1
      <button onClick={() => onUpdate({ q1: 3 })}>Answer Screen 1</button>
    </div>
  )
}));

vi.mock('../../components/Screen2', () => ({
  default: ({ onUpdate }) => (
    <div data-testid="screen-2">
      Screen 2
      <button onClick={() => onUpdate({ q5: 2 })}>Answer Screen 2</button>
    </div>
  )
}));

vi.mock('../../components/Screen3', () => ({
  default: ({ onUpdate, showOptionalSection }) => (
    <div data-testid="screen-3">
      Screen 3 {showOptionalSection ? '(With Optional)' : ''}
      <button onClick={() => onUpdate({ q9: 4 })}>Answer Screen 3</button>
    </div>
  )
}));

vi.mock('../../components/DynamicDomainScreen', () => ({
  default: ({ onUpdate, domainNames }) => (
    <div data-testid="dynamic-screen">
      Dynamic Screen for {domainNames.join(', ')}
      <button onClick={() => onUpdate({ qDynamic: 1 })}>Answer Dynamic</button>
    </div>
  )
}));

describe('Questionnaire Component', () => {
  const mockOnComplete = vi.fn();
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.window.scrollTo = vi.fn(); // Mock scroll attached to window object
  });

  const renderQuestionnaire = () => {
    return render(<Questionnaire onComplete={mockOnComplete} onBack={mockOnBack} />);
  };

  it('renders Screen 1 initially and fetches domains', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => []
    });

    renderQuestionnaire();
    expect(screen.getByTestId('screen-1')).toBeInTheDocument();
    expect(screen.getByText('Screen 1 of 3')).toBeInTheDocument(); // Base is 3 screens
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:5000/api/assessment-types');
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:5000/api/domains');
    });
  });

  it('shows validation warning if trying to proceed without answering', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
    renderQuestionnaire();
    
    const nextBtn = screen.getByRole('button', { name: /Next/i });
    await userEvent.click(nextBtn);
    
    expect(screen.getByText(/Please answer all questions before proceeding/i)).toBeInTheDocument();
    // Should still be on screen 1
    expect(screen.getByTestId('screen-1')).toBeInTheDocument();
  });

  it('proceeds to next screen after answering', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
    renderQuestionnaire();
    
    // Simulate answering
    await userEvent.click(screen.getByText('Answer Screen 1'));
    
    // Now click Next
    const nextBtn = screen.getByRole('button', { name: /Next/i });
    await userEvent.click(nextBtn);
    
    // Warning should be gone, should be on screen 2
    expect(screen.queryByText(/Please answer all questions before proceeding/i)).not.toBeInTheDocument();
    expect(screen.getByTestId('screen-2')).toBeInTheDocument();
    expect(screen.getByText('Screen 2 of 3')).toBeInTheDocument();
  });

  it('calls onBack if clicking previous on first screen', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
    renderQuestionnaire();
    
    const backBtn = screen.getByRole('button', { name: /Back to Home/i });
    await userEvent.click(backBtn);
    
    expect(mockOnBack).toHaveBeenCalled();
  });

  it('can navigate back and forth', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
    renderQuestionnaire();
    
    // Answer S1 and go next to S2
    await userEvent.click(screen.getByText('Answer Screen 1'));
    await userEvent.click(screen.getByRole('button', { name: /Next/i }));
    expect(screen.getByTestId('screen-2')).toBeInTheDocument();
    
    // Answer S2 and go back to S1
    await userEvent.click(screen.getByText('Answer Screen 2'));
    await userEvent.click(screen.getByRole('button', { name: /Previous/i }));
    
    expect(screen.getByTestId('screen-1')).toBeInTheDocument();
    // Go next again (should be allowed immediately since we preserved answers)
    await userEvent.click(screen.getByRole('button', { name: /Next/i }));
    expect(screen.getByTestId('screen-2')).toBeInTheDocument();
  });

  it('completes the full flow and calls onComplete with accumulated answers', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
    renderQuestionnaire();
    
    // Screen 1
    await userEvent.click(screen.getByText('Answer Screen 1'));
    await userEvent.click(screen.getByRole('button', { name: /Next/i }));
    
    // Screen 2
    await userEvent.click(screen.getByText('Answer Screen 2'));
    await userEvent.click(screen.getByRole('button', { name: /Next/i }));
    
    // Screen 3
    expect(screen.getByTestId('screen-3')).toBeInTheDocument();
    const submitBtn = screen.getByRole('button', { name: /Submit & View Results/i });
    
    // Fails validation
    await userEvent.click(submitBtn);
    expect(screen.getByText(/Please answer all questions before proceeding/i)).toBeInTheDocument();
    
    // Answer and submit
    await userEvent.click(screen.getByText('Answer Screen 3'));
    await userEvent.click(submitBtn);
    
    expect(mockOnComplete).toHaveBeenCalledWith(expect.objectContaining({
      screen1: { q1: 3 },
      screen2: { q5: 2 },
      screen3: { q9: 4 }
    }));
  });

  it('renders dynamic domains if extra domains are fetched', async () => {
    const mockTypes = [{ _id: 'general-id', isSpecialized: false }];
    const mockDomains = [
      { domain_name: 'Resilience', assessment_type_id: 'general-id' }, // New core-like domain
      { domain_name: 'stress', assessment_type_id: 'general-id' } // Should be ignored as core
    ];

    global.fetch = vi.fn((url) => {
      if (url.includes('types')) return Promise.resolve({ ok: true, json: async () => mockTypes });
      if (url.includes('domains')) return Promise.resolve({ ok: true, json: async () => mockDomains });
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    renderQuestionnaire();

    // Check progress indicates 4 screens instead of 3
    await waitFor(() => {
      expect(screen.getByText(/Screen 1 of 4/i)).toBeInTheDocument();
    });

    // Traverse to dynamic screen (Screen 4)
    await userEvent.click(screen.getByText('Answer Screen 1'));
    await userEvent.click(screen.getByRole('button', { name: /Next/i }));
    
    await userEvent.click(screen.getByText('Answer Screen 2'));
    await userEvent.click(screen.getByRole('button', { name: /Next/i }));
    
    await userEvent.click(screen.getByText('Answer Screen 3'));
    await userEvent.click(screen.getByRole('button', { name: /Next/i }));

    expect(screen.getByTestId('dynamic-screen')).toBeInTheDocument();
    expect(screen.getByText(/Dynamic Screen for Resilience/i)).toBeInTheDocument();
    
    const submitBtn = screen.getByRole('button', { name: /Submit & View Results/i });
    
    await userEvent.click(screen.getByText('Answer Dynamic'));
    await userEvent.click(submitBtn);

    expect(mockOnComplete).toHaveBeenCalledWith(expect.objectContaining({
      dynamic: {
        dynamic_1: { qDynamic: 1 }
      }
    }));
  });
});
