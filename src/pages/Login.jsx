import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
// authentication now happens against the backend API; local helpers removed
import './Login.css';
import { apiCall } from '../config/api.js';
import {
  hashPasswordBcryptForLegacySha256Login,
  hashPasswordBcryptForLogin,
  hashPasswordBcryptForRegister
} from '../utils/passwordBcrypt.js';

const fadeInUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

const capitalizeFirst = (value = '') => {
  const trimmed = String(value).trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Login({ onNavigate, onAuth }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  });
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFeedback({ type: '', message: '' });
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const emailValue = String(formData.email || '').trim();
    const passwordValue = formData.password;

    if (isSignUp && (!formData.name || formData.name.trim().length < 2 || formData.name.trim().length > 80)) {
      setError('Name must be between 2 and 80 characters.');
      setTimeout(() => setError(null), 4000);
      return;
    }

    if (isSignUp && !EMAIL_REGEX.test(emailValue)) {
      setError('Please enter a valid email address.');
      setTimeout(() => setError(null), 4000);
      return;
    }

    if (!passwordValue || passwordValue.length < 6 || passwordValue.length > 72) {
      setError('Password must be between 6 and 72 characters.');
      setTimeout(() => setError(null), 4000);
      return;
    }

    if (isSignUp && passwordValue !== formData.confirmPassword) {
      setError('Passwords do not match.');
      setTimeout(() => setError(null), 4000);
      return;
    }

    // Reduce password lifetime in client state.
    setFormData((prev) => ({ ...prev, password: '', confirmPassword: '' }));

    const doAuth = async () => {
      try {
        if (isSignUp) {
          // Register
          const normalizedName = capitalizeFirst(formData.name);
          const registerPasswordHash = await hashPasswordBcryptForRegister(passwordValue);
          await apiCall('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name: normalizedName, email: emailValue, password: registerPasswordHash })
          });

          setMessage('Registration successful — you are now signed in');

          const loginSaltResponse = await apiCall('/auth/login-salt', {
            method: 'POST',
            body: JSON.stringify({ email: emailValue })
          });
          const loginPasswordHash = await hashPasswordBcryptForLogin(passwordValue, loginSaltResponse?.salt);

          // Auto-login after registration using salt challenge
          const loginData = await apiCall('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email: emailValue, password: loginPasswordHash })
          });

          if (onAuth) {
            onAuth({
              ...loginData,
              name: capitalizeFirst(loginData?.name)
            });
          }
          
          setTimeout(() => {
            setMessage(null);
            onNavigate('home');
          }, 1000);
        } else {
          // Login
          const loginSaltResponse = await apiCall('/auth/login-salt', {
            method: 'POST',
            body: JSON.stringify({ email: emailValue })
          });
          let data;

          try {
            const loginPasswordHash = await hashPasswordBcryptForLogin(passwordValue, loginSaltResponse?.salt);
            data = await apiCall('/auth/login', {
              method: 'POST',
              body: JSON.stringify({ email: emailValue, password: loginPasswordHash })
            });
          } catch (primaryErr) {
            if (primaryErr?.status !== 401) {
              throw primaryErr;
            }

            const legacyLoginPasswordHash = await hashPasswordBcryptForLegacySha256Login(passwordValue, loginSaltResponse?.salt);
            data = await apiCall('/auth/login', {
              method: 'POST',
              body: JSON.stringify({ email: emailValue, password: legacyLoginPasswordHash })
            });
          }

          setMessage('Login successful');
          if (onAuth) {
            onAuth({
              ...data,
              name: capitalizeFirst(data?.name)
            });
          }
          
          setTimeout(() => {
            setMessage(null);
            onNavigate('home');
          }, 900);
        }
      } catch (err) {
        console.error('Auth error', err);
        setError('Authentication error: ' + (err.message || 'Unknown error'));
        setTimeout(() => setError(null), 4000);
      }
    };

    doAuth();
  };

  return (
    <motion.div className="login-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.65, ease: 'easeOut' }}>
      <motion.div className="login-card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.55, ease: 'easeOut' }}>
        <motion.div className="login-header" variants={fadeInUp} transition={{ duration: 0.45, ease: 'easeOut' }}>
          <motion.h1 className="login-title" key={`title-${isSignUp ? 'signup' : 'signin'}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35, ease: 'easeOut' }}>{isSignUp ? 'Create Account' : 'Welcome Back'}</motion.h1>
          <motion.p className="login-subtitle" key={`subtitle-${isSignUp ? 'signup' : 'signin'}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35, ease: 'easeOut' }}>
            {isSignUp
              ? 'Join MindCare and start your wellness journey'
              : 'Sign in to continue your mental wellness journey'}
          </motion.p>
        </motion.div>

        <motion.form className="login-form" onSubmit={handleSubmit} variants={fadeInUp} transition={{ duration: 0.4, ease: 'easeOut' }}>
          {message && (
            <div className="login-toast success" style={{ background: '#d4edda', color: '#155724', padding: '10px', borderRadius: 6, marginBottom: 12 }}>
              {message}
            </div>
          )}
          {error && (
            <div className="login-toast error" style={{ background: '#fdecea', color: '#721c24', padding: '10px', borderRadius: 6, marginBottom: 12 }}>
              {error}
            </div>
          )}
          <AnimatePresence mode="wait">
            {isSignUp && (
              <motion.div
                key="signup-name"
                className="form-group"
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="form-input"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div className="form-group" variants={fadeInUp} transition={{ duration: 0.4, ease: 'easeOut' }}>
            <label htmlFor="email">Email or Username</label>
            <input
              type="text"
              id="email"
              name="email"
              className="form-input"
              placeholder="Enter your email or username"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </motion.div>

          <motion.div className="form-group" variants={fadeInUp} transition={{ duration: 0.4, ease: 'easeOut' }}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              className="form-input"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleInputChange}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              required
            />
          </motion.div>

          <AnimatePresence mode="wait">
            {isSignUp && (
              <motion.div
                key="signup-confirm"
                className="form-group"
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  className="form-input"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  autoComplete="new-password"
                  required
                />
              </motion.div>
            )}
          </AnimatePresence>

          {!isSignUp && (
            <motion.div className="forgot-password" variants={fadeInUp} transition={{ duration: 0.35, ease: 'easeOut' }}>
              <button type="button" className="link-button">
                Forgot Password?
              </button>
            </motion.div>
          )}

          <motion.button type="submit" className="btn btn-primary btn-full" variants={fadeInUp} whileHover={{ y: -2, scale: 1.01 }} transition={{ duration: 0.2 }}>
            {isSignUp ? 'Sign Up' : 'Sign In'}
          </motion.button>
        </motion.form>

        <motion.div className="login-divider" variants={fadeInUp} transition={{ duration: 0.35, ease: 'easeOut' }}>
          <span>or</span>
        </motion.div>

        <motion.div className="login-toggle" variants={fadeInUp} transition={{ duration: 0.35, ease: 'easeOut' }}>
          <p>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            <button
              type="button"
              className="link-button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setFeedback({ type: '', message: '' });
              }}
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
          <p className="admin-login-link">
            <button
              type="button"
              className="link-button admin-link"
              onClick={() => onNavigate('admin-login')}
            >
              Admin Login →
            </button>
          </p>
        </motion.div>

        <motion.div className="login-footer" variants={fadeInUp} transition={{ duration: 0.35, ease: 'easeOut' }}>
          <p className="disclaimer">
            By continuing, you agree to our Terms of Service and Privacy Policy.
            This tool is for educational purposes only and is not a substitute for
            professional mental health care.
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default Login;
