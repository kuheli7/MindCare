import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminLogin from '../../pages/AdminLogin.jsx';

// Suppress CSS import errors in jsdom
vi.mock('../../pages/AdminLogin.css', () => ({}));

const mockOnLogin = vi.fn();
const mockOnNavigate = vi.fn();
// Valid bcrypt salt (29 characters): $2a$10$ + 22 base64 chars
const mockSalt = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS';

const renderAdminLogin = () =>
  render(<AdminLogin onLogin={mockOnLogin} onNavigate={mockOnNavigate} />);

beforeEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
  global.fetch = vi.fn();
});

// ─── Rendering ────────────────────────────────────────────────────────────────
describe('AdminLogin — rendering', () => {
  it('shows the Admin Portal heading', () => {
    renderAdminLogin();
    expect(screen.getByText('MindCare Admin Portal')).toBeInTheDocument();
  });

  it('shows Admin Access badge', () => {
    renderAdminLogin();
    expect(screen.getByText('Admin Access')).toBeInTheDocument();
  });

  it('renders username and password inputs', () => {
    renderAdminLogin();
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('renders the submit button', () => {
    renderAdminLogin();
    expect(screen.getByRole('button', { name: /access admin dashboard/i })).toBeInTheDocument();
  });

  it('renders the Back to User Login link', () => {
    renderAdminLogin();
    expect(screen.getByText(/back to user login/i)).toBeInTheDocument();
  });

  it('shows no error message initially', () => {
    renderAdminLogin();
    expect(screen.queryByText(/⚠️/)).not.toBeInTheDocument();
  });
});

// ─── Navigation ───────────────────────────────────────────────────────────────
describe('AdminLogin — navigation', () => {
  it('calls onNavigate("login") when Back button is clicked', async () => {
    renderAdminLogin();
    await userEvent.click(screen.getByText(/back to user login/i));
    expect(mockOnNavigate).toHaveBeenCalledWith('login');
  });
});

// ─── Input behaviour ──────────────────────────────────────────────────────────
describe('AdminLogin — input behaviour', () => {
  it('updates username field as user types', async () => {
    renderAdminLogin();
    const input = screen.getByLabelText('Username');
    await userEvent.type(input, 'admin@mindcare.com');
    expect(input.value).toBe('admin@mindcare.com');
  });

  it('updates password field as user types', async () => {
    renderAdminLogin();
    const input = screen.getByLabelText('Password');
    await userEvent.type(input, 'secret');
    expect(input.value).toBe('secret');
  });

  it('clears error message when user starts typing after an error', async () => {
    // Mock login-salt endpoint
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ salt: mockSalt })
    });
    
    // Mock login failure
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Invalid username or password' })
    });

    renderAdminLogin();
    await userEvent.type(screen.getByLabelText('Username'), 'bad');
    await userEvent.type(screen.getByLabelText('Password'), 'bad');
    fireEvent.submit(screen.getByRole('button', { name: /access admin dashboard/i }).closest('form'));

    await waitFor(() => expect(screen.getByText(/invalid username or password/i)).toBeInTheDocument());

    // Typing should clear the error
    await userEvent.type(screen.getByLabelText('Username'), 'x');
    expect(screen.queryByText(/invalid username or password/i)).not.toBeInTheDocument();
  });
});

// ─── Successful admin login ───────────────────────────────────────────────────
describe('AdminLogin — successful login', () => {
  it('calls onLogin with data when API returns admin role', async () => {
    const adminData = { token: 'tok123', role: 'admin', name: 'Admin User' };
    
    // Mock login-salt endpoint
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ salt: mockSalt })
    });
    
    // Mock login endpoint
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => adminData
    });

    renderAdminLogin();
    await userEvent.type(screen.getByLabelText('Username'), 'admin@mindcare.com');
    await userEvent.type(screen.getByLabelText('Password'), 'adminpass');
    await userEvent.click(screen.getByRole('button', { name: /access admin dashboard/i }));

    await waitFor(() => expect(mockOnLogin).toHaveBeenCalledWith(adminData));
  });

  it('sends correct payload to the auth endpoint', async () => {
    // Mock login-salt endpoint
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ salt: mockSalt })
    });
    
    // Mock login endpoint
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ role: 'admin', token: 'tok' })
    });

    renderAdminLogin();
    await userEvent.type(screen.getByLabelText('Username'), 'admin@mindcare.com');
    await userEvent.type(screen.getByLabelText('Password'), 'secret');
    await userEvent.click(screen.getByRole('button', { name: /access admin dashboard/i }));

    await waitFor(() => {
      const calls = global.fetch.mock.calls;
      // First call should be to login-salt
      expect(calls[0][0]).toContain('/api/auth/login-salt');
      const saltCall = JSON.parse(calls[0][1].body);
      expect(saltCall.email).toBe('admin@mindcare.com');
      
      // Second call should be to login with bcrypt hash
      expect(calls[1][0]).toContain('/api/auth/login');
      const body = JSON.parse(calls[1][1].body);
      expect(body.email).toBe('admin@mindcare.com');
      // Password should be a bcrypt hash now (not plaintext)
      expect(body.password).toMatch(/^\$2[aby]\$/);
    });
  });
});

// ─── Failed login — unauthorized role ─────────────────────────────────────────
describe('AdminLogin — unauthorized role', () => {
  it('shows access denied when role is not admin', async () => {
    // Mock login-salt endpoint
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ salt: mockSalt })
    });
    
    // Mock login with student role
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ role: 'student', token: 'tok' })
    });

    renderAdminLogin();
    await userEvent.type(screen.getByLabelText('Username'), 'user@mindcare.com');
    await userEvent.type(screen.getByLabelText('Password'), 'pass');
    await userEvent.click(screen.getByRole('button', { name: /access admin dashboard/i }));

    await waitFor(() =>
      expect(screen.getByText(/access denied/i)).toBeInTheDocument()
    );
    expect(mockOnLogin).not.toHaveBeenCalled();
  });
});

// ─── Failed login — API error ─────────────────────────────────────────────────
describe('AdminLogin — API errors', () => {
  it('shows server error message on non-ok response', async () => {
    // Mock login-salt endpoint
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ salt: mockSalt })
    });
    
    // Mock login failure
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Invalid username or password' })
    });

    renderAdminLogin();
    await userEvent.type(screen.getByLabelText('Username'), 'x');
    await userEvent.type(screen.getByLabelText('Password'), 'y');
    await userEvent.click(screen.getByRole('button', { name: /access admin dashboard/i }));

    await waitFor(() =>
      expect(screen.getByText(/invalid username or password/i)).toBeInTheDocument()
    );
  });

  it('shows connection error when fetch throws', async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network down'));

    renderAdminLogin();
    await userEvent.type(screen.getByLabelText('Username'), 'x');
    await userEvent.type(screen.getByLabelText('Password'), 'y');
    await userEvent.click(screen.getByRole('button', { name: /access admin dashboard/i }));

    await waitFor(() =>
      expect(screen.getByText(/connection error/i)).toBeInTheDocument()
    );
  });

  it('shows fallback error when API returns no message', async () => {
    // Mock login-salt endpoint
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ salt: mockSalt })
    });
    
    // Mock login with no message
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({})
    });

    renderAdminLogin();
    await userEvent.type(screen.getByLabelText('Username'), 'x');
    await userEvent.type(screen.getByLabelText('Password'), 'y');
    await userEvent.click(screen.getByRole('button', { name: /access admin dashboard/i }));

    await waitFor(() =>
      expect(screen.getByText(/invalid username or password/i)).toBeInTheDocument()
    );
  });
});
