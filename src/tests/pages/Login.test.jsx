import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from '../../pages/Login.jsx';

vi.mock('../../pages/Login.css', () => ({}));

// Mock framer-motion to avoid animation issues in jsdom
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }) => {
      const filteredProps = { ...props };
      delete filteredProps.initial;
      delete filteredProps.animate;
      delete filteredProps.exit;
      delete filteredProps.transition;
      delete filteredProps.variants;
      delete filteredProps.whileHover;
      return <div className={className} {...filteredProps}>{children}</div>;
    },
    form: ({ children, className, onSubmit, ...props }) => {
      const filteredProps = { ...props };
      delete filteredProps.initial;
      delete filteredProps.animate;
      delete filteredProps.exit;
      delete filteredProps.transition;
      delete filteredProps.variants;
      delete filteredProps.whileHover;
      return <form className={className} onSubmit={onSubmit} {...filteredProps}>{children}</form>;
    },
    h1: ({ children, className, ...props }) => {
      const filteredProps = { ...props };
      delete filteredProps.initial;
      delete filteredProps.animate;
      delete filteredProps.exit;
      delete filteredProps.transition;
      delete filteredProps.variants;
      delete filteredProps.whileHover;
      return <h1 className={className} {...filteredProps}>{children}</h1>;
    },
    p: ({ children, className, ...props }) => {
      const filteredProps = { ...props };
      delete filteredProps.initial;
      delete filteredProps.animate;
      delete filteredProps.exit;
      delete filteredProps.transition;
      delete filteredProps.variants;
      delete filteredProps.whileHover;
      return <p className={className} {...filteredProps}>{children}</p>;
    },
    button: ({ children, className, type, onClick, ...props }) => {
      const filteredProps = { ...props };
      delete filteredProps.initial;
      delete filteredProps.animate;
      delete filteredProps.exit;
      delete filteredProps.transition;
      delete filteredProps.variants;
      delete filteredProps.whileHover;
      return <button type={type} className={className} onClick={onClick} {...filteredProps}>{children}</button>;
    }
  },
  AnimatePresence: ({ children }) => <>{children}</>
}));

describe('Login Page', () => {
  const mockOnNavigate = vi.fn();
  const mockOnAuth = vi.fn();
  // Valid bcrypt salt (29 characters): $2a$10$ + 22 base64 chars
  const mockSalt = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS';

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  const renderLogin = () => {
    return render(<Login onNavigate={mockOnNavigate} onAuth={mockOnAuth} />);
  };

  it('renders the sign in form by default', () => {
    renderLogin();
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter your email or username/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter your password/i)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/enter your name/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
  });

  it('toggles to sign up form when "Sign Up" link is clicked', async () => {
    renderLogin();
    
    // The toggle button says "Sign Up" when in Sign In mode
    const toggleButtons = screen.getAllByRole('button', { name: 'Sign Up' });
    const switchModeBtn = toggleButtons.find(b => b.classList.contains('link-button'));
    await userEvent.click(switchModeBtn);

    expect(screen.getByText('Create Account')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter your name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/confirm your password/i)).toBeInTheDocument();
    // The main submit button now says "Sign Up"
    const submitBtn = screen.getAllByRole('button', { name: 'Sign Up' }).find(b => b.classList.contains('btn-primary'));
    expect(submitBtn).toBeInTheDocument();
  });

  it('handles user input correctly', async () => {
    renderLogin();
    const emailInput = screen.getByPlaceholderText(/enter your email or username/i);
    const passInput = screen.getByPlaceholderText(/enter your password/i);

    await userEvent.type(emailInput, 'user@test.com');
    await userEvent.type(passInput, 'mypassword');

    expect(emailInput).toHaveValue('user@test.com');
    expect(passInput).toHaveValue('mypassword');
  });

  it('submits login successfully and calls onAuth / onNavigate', async () => {
    // Mock login-salt endpoint first
    global.fetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ salt: mockSalt })
    });
    
    // Mock login endpoint second
    const mockUser = { id: '1', name: 'John Doe', email: 'user@test.com', role: 'student' };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockUser
    });

    renderLogin();
    await userEvent.type(screen.getByPlaceholderText(/enter your email or username/i), 'user@test.com');
    await userEvent.type(screen.getByPlaceholderText(/enter your password/i), 'mypassword');
    
    // Click Sign In button
    const submitBtn = screen.getByRole('button', { name: 'Sign In' });
    await userEvent.click(submitBtn);

    // Should first call login-salt to get salt
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:5000/api/auth/login-salt', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'user@test.com' })
      }));
    });

    // Then call login with bcrypt hashed password
    await waitFor(() => {
      const calls = global.fetch.mock.calls;
      const loginCall = calls.find(c => c[0].includes('/api/auth/login') && !c[0].includes('login-salt'));
      expect(loginCall).toBeDefined();
      const body = JSON.parse(loginCall[1].body);
      expect(body.email).toBe('user@test.com');
      // Password should be a bcrypt hash now (not plaintext)
      expect(body.password).toMatch(/^\$2[aby]\$/);
    });

    await waitFor(() => {
      expect(screen.getByText('Login successful')).toBeInTheDocument();
      expect(mockOnAuth).toHaveBeenCalledWith(expect.objectContaining({ name: 'John Doe', email: 'user@test.com' }));
    });
  });

  it('displays error on login failure', async () => {
    // Mock login-salt endpoint
    global.fetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ salt: mockSalt })
    });
    
    // Mock login failure
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ message: 'Invalid credentials' })
    });

    renderLogin();
    await userEvent.type(screen.getByPlaceholderText(/enter your email or username/i), 'wrong@test.com');
    await userEvent.type(screen.getByPlaceholderText(/enter your password/i), 'wrong');
    
    const submitBtn = screen.getByRole('button', { name: 'Sign In' });
    await userEvent.click(submitBtn);

    // Wait for error to appear and check if any error div appears
    await waitFor(() => {
      const errorElement = document.querySelector('.login-toast.error');
      expect(errorElement).toBeTruthy();
    }, { timeout: 5000 });
  });

  it('submits registration successfully and attempts auto-login', async () => {
    // 1st request: register
    global.fetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ message: 'User created' })
    });
    
    // 2nd request: login-salt
    global.fetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ salt: mockSalt })
    });
    
    // 3rd request: auto-login
    global.fetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ id: '2', name: 'Jane Doe', email: 'new@test.com', role: 'student' })
    });

    renderLogin();
    const switchModeBtn = screen.getAllByRole('button', { name: 'Sign Up' }).find(b => b.classList.contains('link-button'));
    await userEvent.click(switchModeBtn);

    await userEvent.type(screen.getByPlaceholderText(/enter your name/i), 'Jane Doe');
    await userEvent.type(screen.getByPlaceholderText(/enter your email/i), 'new@test.com');
    await userEvent.type(screen.getByPlaceholderText(/enter your password/i), 'secret');
    await userEvent.type(screen.getByPlaceholderText(/confirm your password/i), 'secret');

    const submitBtn = screen.getAllByRole('button', { name: 'Sign Up' }).find(b => b.classList.contains('btn-primary'));
    await userEvent.click(submitBtn);

    await waitFor(() => {
      // Should have 3 calls: register, login-salt, login
      expect(global.fetch).toHaveBeenCalledTimes(3);
      expect(screen.getByText('Registration successful — you are now signed in')).toBeInTheDocument();
      expect(mockOnAuth).toHaveBeenCalled();
    });
  });

  it('navigates to admin login when Admin Login link clicked', async () => {
    renderLogin();
    await userEvent.click(screen.getByText(/admin login/i));
    expect(mockOnNavigate).toHaveBeenCalledWith('admin-login');
  });
});
