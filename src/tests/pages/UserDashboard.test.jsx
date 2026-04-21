import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserDashboard from '../../pages/UserDashboard.jsx';

vi.mock('../../pages/UserDashboard.css', () => ({}));

// Mock utils so we can control outputs dependably without needing complex history states
vi.mock('../../utils/assessment', () => ({
  formatDomainName: vi.fn((id) => id.charAt(0).toUpperCase() + id.slice(1)),
  getPositiveMessage: vi.fn(() => 'Test positive message'),
  getRecommendations: vi.fn(() => ['stress', 'sleep']),
  getTrendDirection: vi.fn(() => 'up')
}));

describe('UserDashboard Page', () => {
  const mockUser = { name: 'john doe', email: 'john@test.com' };
  const mockHistory = [
    {
      id: "test1",
      createdAt: "2023-10-01T12:00:00.000Z",
      wellbeing: 80,
      domainScores: {
        stress: { score: 10, maxScore: 16, percentage: 62.5, level: { label: 'Moderate' } }
      }
    },
    {
      id: "test2",
      createdAt: "2023-09-01T12:00:00.000Z",
      wellbeing: 75,
      domainScores: {
        stress: { score: 12, maxScore: 16, percentage: 75, level: { label: 'High' } }
      }
    }
  ];
  
  const mockDomainInfo = {
    stress: { domain_name: 'Stress Level', description: 'Measures stress.' },
    sleep: { domain_name: 'Sleep Quality', description: 'Measures sleep.' }
  };

  const mockOnStartCombinedTest = vi.fn();
  const mockOnStartSpecificTest = vi.fn();
  const mockOnOpenTests = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderDashboard = (props = {}) => {
    const defaultProps = {
      user: mockUser,
      history: mockHistory,
      domainInfo: mockDomainInfo,
      onStartCombinedTest: mockOnStartCombinedTest,
      onStartSpecificTest: mockOnStartSpecificTest,
      onOpenTests: mockOnOpenTests,
      view: 'overview'
    };
    return render(<UserDashboard {...defaultProps} {...props} />);
  };

  it('renders welcome message with user name capitalized', () => {
    renderDashboard();
    // 'john doe' -> 'John doe' capitalized via capitalizeFirst
    expect(screen.getByText(/John doe/i)).toBeInTheDocument();
    expect(screen.getByText(/john@test.com/i)).toBeInTheDocument();
  });

  it('renders analytics correctly when history exists', () => {
    renderDashboard();
    
    // Total Tests = 2
    expect(screen.getByText('2')).toBeInTheDocument(); // stat-number for total tests
    
    // Avg Wellbeing = 77.5
    expect(screen.getByText('77.5%')).toBeInTheDocument();
    
    // Trend = Improving (since getTrendDirection returns 'up')
    expect(screen.getByText('Improving')).toBeInTheDocument();
  });

  it('renders empty states when history is empty', () => {
    renderDashboard({ history: [] });
    
    expect(screen.getByText('0')).toBeInTheDocument(); // 0 tests
    expect(screen.getByText('--')).toBeInTheDocument(); // no avg wellbeing
    
    expect(screen.getByText(/no test history yet/i)).toBeInTheDocument();
  });

  it('renders history list with formatted dates and scores', () => {
    renderDashboard();
    expect(screen.getByText(/Previous Tests/i)).toBeInTheDocument();
    // Expect the wellbeing score
    expect(screen.getByText(/Wellbeing 80.0%/i)).toBeInTheDocument();
    expect(screen.getByText(/Wellbeing 75.0%/i)).toBeInTheDocument();
    
    // Expect domain tag
    expect(screen.getByText(/Stress Level: Moderate/i)).toBeInTheDocument();
    expect(screen.getByText(/Stress Level: High/i)).toBeInTheDocument();
  });

  it('renders recommendations based on utility function output', () => {
    renderDashboard();
    expect(screen.getByText(/Recommended Next Tests/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Stress Level/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Sleep Quality/i).length).toBeGreaterThan(0);
  });

  it('calls onStartSpecificTest when recommendation button is clicked', async () => {
    renderDashboard();
    const btn = screen.getByRole('button', { name: /Start Stress Level Test/i });
    await userEvent.click(btn);
    expect(mockOnStartSpecificTest).toHaveBeenCalledWith('stress');
  });

  it('calls onOpenTests and onStartCombinedTest via quick actions', async () => {
    renderDashboard();
    
    // "Browse Tests" button mapped to onOpenTests
    const browseBtn = screen.getByRole('button', { name: /Browse Tests/i });
    await userEvent.click(browseBtn);
    expect(mockOnOpenTests).toHaveBeenCalled();

    // "Take Full Assessment" or "Retake Full Check" or "Start Now"
    // Multiple buttons might trace back to onStartCombinedTest
    const fullTestBtn = screen.getAllByRole('button', { name: /Take Full Assessment/i })[0];
    await userEvent.click(fullTestBtn);
    expect(mockOnStartCombinedTest).toHaveBeenCalled();
  });

  it('only renders requested views based on "view" prop', () => {
    const { rerender } = renderDashboard({ view: 'history' });
    
    // User dashboard header is always rendered, but panels change
    expect(screen.getByText(/Previous Tests/i)).toBeInTheDocument();
    // Analytics & Recommendations shouldn't be there
    expect(screen.queryByText(/Recommended Next Tests/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Total Tests/i)).not.toBeInTheDocument();

    rerender(<UserDashboard user={mockUser} history={mockHistory} view="analytics" />);
    expect(screen.getByText(/Total Tests/i)).toBeInTheDocument();
    expect(screen.queryByText(/Previous Tests/i)).not.toBeInTheDocument();
  });
});
