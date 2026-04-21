import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminDashboard from '../../pages/AdminDashboard.jsx';

vi.mock('../../pages/AdminDashboard.css', () => ({}));

// react-icons can render — no mock needed, but silence SVG warnings
const ADMIN_USER = { token: 'test-token', name: 'Admin', role: 'admin' };
const mockOnLogout = vi.fn();

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Build a minimal fetch mock that returns ok:true with given data */
const okFetch = (data) =>
  Promise.resolve({ ok: true, json: async () => data });

/** A sensible default fetch stub (returns empty arrays for all endpoints) */
const defaultFetch = (url) => {
  if (url.includes('/api/assessment-types')) return okFetch([]);
  if (url.includes('/api/option-sets')) return okFetch([]);
  if (url.includes('/api/categories')) return okFetch([]);
  if (url.includes('/api/admin/analytics')) return okFetch({ totalTests: 5, todayTests: 1, weekTests: 3, monthTests: 5 });
  if (url.includes('/api/admin/test-history')) return okFetch([]);
  if (url.includes('/api/domains')) return okFetch([]);
  if (url.includes('/api/assessment-attempts/analytics/averages')) return okFetch({});
  return okFetch({});
};

const renderDashboard = () =>
  render(<AdminDashboard currentUser={ADMIN_USER} onLogout={mockOnLogout} />);

beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = vi.fn(defaultFetch);
  global.confirm = vi.fn(() => true); // auto-confirm dialogs
});

// ─── Rendering & navigation ───────────────────────────────────────────────────
describe('AdminDashboard — rendering', () => {
  it('renders the dashboard overview tab by default', async () => {
    renderDashboard();
    await waitFor(() =>
      expect(screen.getByText(/dashboard overview/i)).toBeInTheDocument()
    );
  });

  it('displays Total Tests Taken stat card', async () => {
    renderDashboard();
    await waitFor(() =>
      expect(screen.getByText(/total tests taken/i)).toBeInTheDocument()
    );
  });

  it('shows analytics numbers from API', async () => {
    global.fetch = vi.fn((url) => {
      if (url.includes('/api/admin/analytics'))
        return okFetch({ totalTests: 42, todayTests: 43, weekTests: 44, monthTests: 45 });
      return defaultFetch(url);
    });

    renderDashboard();
    await waitFor(() => expect(screen.getByText('42')).toBeInTheDocument());
    expect(screen.getByText('43')).toBeInTheDocument();
    expect(screen.getByText('44')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
  });

  it('renders sidebar navigation links', async () => {
    renderDashboard();
    await waitFor(() => screen.getByRole('button', { name: /dashboard/i }));
    expect(screen.getByText(/test history/i)).toBeInTheDocument();
    expect(screen.getByText(/questions/i)).toBeInTheDocument();
    expect(screen.getByText(/scoring logic/i)).toBeInTheDocument();
  });

  it('switches to Questions tab when clicked', async () => {
    renderDashboard();
    await waitFor(() => screen.getByText(/questions/i));
    await userEvent.click(screen.getByText(/questions/i));
    expect(screen.getByText(/domain management/i)).toBeInTheDocument();
  });

  it('switches to Test History tab when clicked', async () => {
    renderDashboard();
    await waitFor(() => screen.getByText(/test history/i));
    await userEvent.click(screen.getByText(/test history/i));
    await waitFor(() => screen.getByText(/test submission history/i));
  });

  it('switches to Scoring Logic tab when clicked', async () => {
    renderDashboard();
    await waitFor(() => screen.getByText(/scoring logic/i));
    await userEvent.click(screen.getByText(/scoring logic/i));
    expect(screen.getByText(/scale values/i)).toBeInTheDocument();
  });
});

// ─── Add Domain ───────────────────────────────────────────────────────────────
describe('AdminDashboard — Add Domain', () => {
  const goToDomains = async () => {
    renderDashboard();
    await waitFor(() => screen.getByText(/questions/i));
    await userEvent.click(screen.getByText(/questions/i));
    await waitFor(() => screen.getByText(/domain management/i));
  };

  it('shows "Add New Domain" button in Domains tab', async () => {
    await goToDomains();
    expect(screen.getByText(/add new domain/i)).toBeInTheDocument();
  });

  it('shows domain name input after clicking Add New Domain', async () => {
    await goToDomains();
    await userEvent.click(screen.getByText(/add new domain/i));
    expect(screen.getByPlaceholderText(/domain name/i)).toBeInTheDocument();
  });

  it('successfully adds a new domain and shows success alert', async () => {
    global.fetch = vi.fn((url, opts) => {
      if (url.includes('/api/domains') && opts?.method === 'POST')
        return okFetch({ _id: 'd2', domain_name: 'New Domain', color: '#ff0000' });
      return defaultFetch(url);
    });

    await goToDomains();
    await userEvent.click(screen.getByText(/add new domain/i));
    await userEvent.type(screen.getByPlaceholderText(/domain name/i), 'New Domain');
    await userEvent.click(screen.getByText(/add domain/i));

    await waitFor(() =>
      expect(screen.getByText(/domain added successfully/i)).toBeInTheDocument()
    );
  });

  it('shows error alert when domain name is empty', async () => {
    await goToDomains();
    await userEvent.click(screen.getByText(/add new domain/i));
    // Type nothing
    await userEvent.click(screen.getByText(/add domain/i));

    await waitFor(() =>
      expect(screen.getByText(/enter domain name/i)).toBeInTheDocument()
    );
  });

  it('shows error alert when API returns an error', async () => {
    global.fetch = vi.fn((url, opts) => {
      if (url.includes('/api/domains') && opts?.method === 'POST')
        return Promise.resolve({ ok: false, json: async () => ({ error: 'Server says no' }) });
      return defaultFetch(url);
    });

    await goToDomains();
    await userEvent.click(screen.getByText(/add new domain/i));
    await userEvent.type(screen.getByPlaceholderText(/domain name/i), 'Fail Path');
    await userEvent.click(screen.getByText(/add domain/i));

    await waitFor(() =>
      expect(screen.getByText(/server says no/i)).toBeInTheDocument()
    );
  });
});

// ─── Add Question ─────────────────────────────────────────────────────────────
describe('AdminDashboard — Add Question', () => {
  const MOCK_DOMAIN = { _id: 'd1', domain_name: 'Stress', color: '#e74c3c' };
  const MOCK_TYPES = [{ _id: 't1', name: 'General Wellness' }];
  const MOCK_OSETS = [{ _id: 'os1', name: 'Likert 4' }];

  const setupWithDomain = () => {
    global.fetch = vi.fn((url) => {
      if (url.includes('/api/assessment-types')) return okFetch(MOCK_TYPES);
      if (url.includes('/api/option-sets')) return okFetch(MOCK_OSETS);
      if (url.includes('/api/categories')) return okFetch([]);
      if (url.includes('/api/admin/analytics')) return okFetch({ totalTests: 0, todayTests: 0, weekTests: 0, monthTests: 0 });
      if (url.includes('/api/admin/test-history')) return okFetch([]);
      if (url.includes('/api/domains') && !url.includes('/api/questions'))
        return okFetch([MOCK_DOMAIN]);
      if (url.includes(`/api/questions/domain/${MOCK_DOMAIN._id}`))
        return okFetch([]);
      if (url.includes('/api/assessment-attempts/analytics/averages')) return okFetch({});
      return okFetch([]);
    });

    renderDashboard();
  };

  it('shows Add Question form fields when domain is selected', async () => {
    setupWithDomain();
    await waitFor(() => screen.getByText(/questions/i));
    await userEvent.click(screen.getByText(/questions/i));

    await waitFor(() => screen.getByText('Stress'));
    await userEvent.click(screen.getByText('Stress'));

    await waitFor(() =>
      expect(screen.getByPlaceholderText(/enter new question text/i)).toBeInTheDocument()
    );
  });

  it('shows error if question text is empty on submit', async () => {
    global.fetch = vi.fn((url, opts) => {
      if (url.includes('/api/questions') && opts?.method === 'POST')
        return okFetch({ _id: 'q1', question_text: 'Q?', weight: 1, assessment_type_id: 't1' });
      if (url.includes('/api/assessment-types')) return okFetch(MOCK_TYPES);
      if (url.includes('/api/option-sets')) return okFetch(MOCK_OSETS);
      if (url.includes('/api/categories')) return okFetch([]);
      if (url.includes('/api/admin/analytics')) return okFetch({ totalTests: 0, todayTests: 0, weekTests: 0, monthTests: 0 });
      if (url.includes('/api/admin/test-history')) return okFetch([]);
      if (url.includes('/api/domains')) return okFetch([MOCK_DOMAIN]);
      if (url.includes(`/api/questions/domain`)) return okFetch([]);
      if (url.includes('/api/assessment-attempts/analytics/averages')) return okFetch({});
      return okFetch([]);
    });

    renderDashboard();
    await waitFor(() => screen.getByText(/questions/i));
    await userEvent.click(screen.getByText(/questions/i));
    await waitFor(() => screen.getByText('Stress'));
    await userEvent.click(screen.getByText('Stress'));

    await waitFor(() => screen.getByPlaceholderText(/enter new question text/i));

    const dropdowns = screen.getAllByRole('combobox');
    await userEvent.selectOptions(dropdowns[0], MOCK_TYPES[0]._id);
    await userEvent.selectOptions(dropdowns[1], MOCK_OSETS[0]._id);

    // Now click submit with empty text
    const addBtn = screen.getByRole('button', { name: /add question/i });
    await userEvent.click(addBtn);

    await waitFor(() =>
      expect(screen.getByText(/enter question text/i)).toBeInTheDocument()
    );
  });
});

// ─── Test History ─────────────────────────────────────────────────────────────
describe('AdminDashboard — Test History', () => {
  const goToHistory = async () => {
    renderDashboard();
    await waitFor(() => screen.getByText(/test history/i));
    await userEvent.click(screen.getByText(/test history/i));
    await waitFor(() => screen.getByText(/test submission history/i));
  };

  it('shows "Test Submission History" heading', async () => {
    await goToHistory();
    expect(screen.getByText(/test submission history/i)).toBeInTheDocument();
  });

  it('shows loading state initially', async () => {
    // Delay the history fetch so we catch the loading state
    global.fetch = vi.fn((url) => {
      if (url.includes('/api/admin/test-history'))
        return new Promise(resolve =>
          setTimeout(() => resolve({ ok: true, json: async () => [] }), 200)
        );
      return defaultFetch(url);
    });

    renderDashboard();
    await waitFor(() => screen.getByText(/test history/i));
    await userEvent.click(screen.getByText(/test history/i));
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows "no test submissions match" when list is empty', async () => {
    await goToHistory();
    await waitFor(() =>
      expect(screen.getByText(/no test submissions match/i)).toBeInTheDocument()
    );
  });

  it('renders a test history row for each attempt', async () => {
    const mockHistory = [
      {
        id: 'a1',
        userId: 'user1@test.com',
        date: new Date().toISOString(),
        scores: { 'Stress': 45, 'Anxiety': 50 },
        domains: ['Stress', 'Anxiety'],
        riskLevel: 'Moderate',
        category: { label: 'Moderate' }
      },
      {
        id: 'a2',
        userId: 'user2@test.com',
        date: new Date().toISOString(),
        scores: { 'Sleep': 20 },
        domains: ['Sleep'],
        riskLevel: 'Low',
        category: { label: 'Low' }
      }
    ];

    global.fetch = vi.fn((url) => {
      if (url.includes('/api/admin/test-history')) return okFetch(mockHistory);
      return defaultFetch(url);
    });

    renderDashboard();
    await waitFor(() => screen.getByText(/test history/i));
    await userEvent.click(screen.getByText(/test history/i));

    await waitFor(() =>
      expect(screen.getByText('user1@test.com')).toBeInTheDocument()
    );
    expect(screen.getByText('user2@test.com')).toBeInTheDocument();
  });

  it('shows score and category label in each history row', async () => {
    const mockHistory = [{
      id: 'a1',
      userId: 'user@test.com',
      date: new Date().toISOString(),
      scores: { 'Stress': 72 },
      domains: ['Stress'],
      riskLevel: 'High Risk',
      category: { label: 'High Risk' }
    }];

    global.fetch = vi.fn((url) => {
      if (url.includes('/api/admin/test-history')) return okFetch(mockHistory);
      return defaultFetch(url);
    });

    renderDashboard();
    await waitFor(() => screen.getByText(/test history/i));
    await userEvent.click(screen.getByText(/test history/i));

    await waitFor(() => expect(screen.getByText('High Risk')).toBeInTheDocument());
    expect(screen.getByText(/72/)).toBeInTheDocument();
  });

  it('has sort and filter controls visible', async () => {
    await goToHistory();
    // Sort and filter dropdowns should be present
    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBeGreaterThanOrEqual(1);
  });

  it('shows logout button', async () => {
    renderDashboard();
    await waitFor(() =>
      expect(screen.getByText(/logout/i)).toBeInTheDocument()
    );
  });
});
