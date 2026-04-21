import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Home2 from './pages/Home2';
import About from './pages/About';
import TestSelection from './pages/TestSelection';
import Questionnaire from './pages/Questionnaire';
import Contact from './pages/Contact';
import Results from './pages/Results';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import StressTest from './pages/StressTest';
import AnxietyTest from './pages/AnxietyTest';
import DepressionTest from './pages/DepressionTest';
import BurnoutTest from './pages/BurnoutTest';
import SleepTest from './pages/SleepTest';
import GenericSpecializedTest from './pages/GenericSpecializedTest';
import { apiCall } from './config/api.js';

import { buildAssessmentEntry } from './utils/assessment';
import {
  addUserHistoryEntry,
  clearCurrentUser as clearStoredUser,
  getCurrentUser,
  getUserHistory,
  setCurrentUser as storeCurrentUser
} from './utils/userData';
import './App.css';

function App() {
  const initialUser = getCurrentUser();
  const [currentPage, setCurrentPage] = useState('home');
  const [quizResults, setQuizResults] = useState(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authenticatedUser, setAuthenticatedUser] = useState(initialUser);
  // history will come from server when cookie session is present, otherwise fallback to localStorage
  const [userHistory, setUserHistory] = useState(() => {
    return initialUser?.id ? getUserHistory(initialUser.id) : [];
  });
  // when redirected to login for a specialized test, remember where to go after auth
  const [pendingPage, setPendingPage] = useState(null);
  const [domainInfo, setDomainInfo] = useState({});

  // load domain metadata (names/descriptions) from API once
  useEffect(() => {
    const loadDomains = async () => {
      try {
        const data = await apiCall('/domains');
        const map = {};
        data.forEach(d => {
          const key = d.domain_name.trim().toLowerCase().replace(/\s+/g, '_');
          map[key] = d;
        });
        setDomainInfo(map);
      } catch (err) {
        console.error('Error loading domains', err);
      }
    };
    loadDomains();
  }, []);

  // if there's a logged-in user persisted from previous session, pull history on mount
  useEffect(() => {
    if (initialUser) {
      fetchHistoryFromServer();
    }
  }, []);

  // Restore user from secure cookie session when available.
  useEffect(() => {
    const bootstrapUserSession = async () => {
      try {
        const data = await apiCall('/auth/me');
        setCurrentUser(data);
        setAuthenticatedUser(data);
        if (data?.role === 'admin') {
          setIsAdminAuthenticated(true);
        }
        storeCurrentUser(data);
        fetchHistoryFromServer();
      } catch (err) {
        // 401 is expected when there is no active cookie session.
        if (err?.status !== 401 && !String(err?.message || '').toLowerCase().includes('no token')) {
          console.error('Session bootstrap failed', err);
        }
      }
    };

    bootstrapUserSession();
  }, []);

  const saveAttemptToServer = async (answers) => {
    try {
      const data = await apiCall('/assessment-attempts', {
        method: 'POST',
        body: JSON.stringify({ user: authenticatedUser || null, answers })
      });

      return data;
    } catch (err) {
      console.error('Error saving attempt:', err);
      return { _serverError: err.message || 'Could not connect to backend' };
    }
  };

  // helper to load history from backend via cookie session
  const fetchHistoryFromServer = async () => {
    try {
      const data = await apiCall('/assessment-attempts/history');
      setUserHistory(data || []);
     } catch (err) {
      // Avoid noisy logs when user is logged out or session expired.
      if (err?.status !== 401) {
        console.error('Error fetching user history', err);
      }
    }
  };

  // central auth handler which also consumes pendingPage
  const handleAuth = async (user) => {
    setCurrentUser(user);
    setAuthenticatedUser(user);
    // persist sanitized user profile so reloads keep session context
    storeCurrentUser(user);

    if (user?._id || user?.id) {
      await fetchHistoryFromServer();
    }

    if (user.role === 'admin') {
      setIsAdminAuthenticated(true);
      // admin always goes to dashboard regardless of pending
      setCurrentPage('admin-dashboard');
    } else if (pendingPage) {
      setCurrentPage(pendingPage);
      setPendingPage(null);
    } else {
      setCurrentPage('user-dashboard');
    }
  };

  const handleUserLogout = () => {
    apiCall('/auth/logout', {
      method: 'POST'
    }).catch((err) => {
      console.error('Logout request failed', err);
    });

    clearStoredUser();
    setCurrentUser(null);
    setAuthenticatedUser(null);
    setUserHistory([]);
    setCurrentPage('home');
  };

  const handleAssessmentComplete = async (answers) => {
    // Always try to save to server and use its computed results
    const serverResponse = await saveAttemptToServer(answers);

    let processedResults;
    if (serverResponse?.results) {
      // Server returned fully computed results (domain_scores, risk_level, etc.)
      processedResults = {
        ...serverResponse.results,
        emailStatus: serverResponse.emailStatus || null
      };
    } else {
      // Fallback: compute client-side for anonymous / offline users
      const { calculateScores: calcScores } = await import('./utils/assessment');
      const domainScoresRaw = calcScores(answers);
      const domainScoresArr = Object.entries(domainScoresRaw).map(([key, val]) => ({
        domain_id: key,
        domain_name: key.charAt(0).toUpperCase() + key.slice(1),
        score: val.score,
        max_score: val.max,
        normalized_score: val.percentage
      }));
      const total_score = domainScoresArr.reduce((s, d) => s + d.score, 0);
      const maximum_total_score = domainScoresArr.reduce((s, d) => s + d.max_score, 0);
      const overall_normalized_score = maximum_total_score > 0
        ? (total_score / maximum_total_score) * 100
        : 0;
      processedResults = {
        total_score,
        maximum_total_score,
        overall_normalized_score,
        risk_level: overall_normalized_score < 40 ? 'Low Risk' : overall_normalized_score < 70 ? 'Medium Risk' : 'High Risk',
        domain_scores: domainScoresArr,
        recommendations: [],
        emailStatus: {
          requested: Boolean(answers?.optional?.emailCopy),
          sent: false,
          reason: serverResponse?._serverError
            ? `Email not sent because backend submission failed: ${serverResponse._serverError}`
            : 'Email not sent because results were generated locally (backend was unavailable).'
        }
      };
    }

    setQuizResults(processedResults);

    // Navigate immediately so users see results without waiting for history sync.
    setCurrentPage('results');

    if (authenticatedUser?._id || authenticatedUser?.id) {
      // Refresh history in the background for dashboard freshness.
      fetchHistoryFromServer().catch((err) => {
        console.error('Background history refresh failed', err);
      });
    } else if (authenticatedUser?.id) {
      const entry = buildAssessmentEntry(answers);
      const updatedHistory = addUserHistoryEntry(authenticatedUser.id, entry);
      setUserHistory(updatedHistory);
    }
  };

  const renderPage = () => {
    if (currentPage.startsWith('test-domain-')) {
      if (!currentUser && !authenticatedUser) {
        setPendingPage(currentPage);
        setCurrentPage('login');
        return null;
      }

      const encodedDomain = currentPage.replace('test-domain-', '');
      const domainName = decodeURIComponent(encodedDomain);
      return (
        <GenericSpecializedTest
          domainName={domainName}
          onComplete={handleAssessmentComplete}
          onBack={() => setCurrentPage('test-selection')}
        />
      );
    }

    switch (currentPage) {
      case 'home':
        return <Home onStartTest={() => setCurrentPage('test-selection')} onNavigate={setCurrentPage} />;
      case 'home2':
        return <Home2 onStart={() => setCurrentPage('test-selection')} />;
      case 'test-selection':
        return <TestSelection onStartCombinedTest={() => setCurrentPage('questionnaire')} onStartSpecificTest={(testId) => setCurrentPage(`test-${testId}`)} />;
      case 'questionnaire':
        return <Questionnaire onComplete={handleAssessmentComplete} onBack={() => setCurrentPage('home')} />;
      case 'tests':
        return <TestSelection onStartCombinedTest={() => setCurrentPage('questionnaire')} onStartSpecificTest={(testId) => setCurrentPage(`test-${testId}`)} />;
      case 'test-stress':
        if (!currentUser && !authenticatedUser) {
          setPendingPage(currentPage);
          setCurrentPage('login');
          return null;
        }
        return <StressTest onComplete={handleAssessmentComplete} onBack={() => setCurrentPage('test-selection')} />;
      case 'test-anxiety':
        if (!currentUser && !authenticatedUser) {
          setPendingPage(currentPage);
          setCurrentPage('login');
          return null;
        }
        return <AnxietyTest onComplete={handleAssessmentComplete} onBack={() => setCurrentPage('test-selection')} />;
      case 'test-depression':
        if (!currentUser && !authenticatedUser) {
          setPendingPage(currentPage);
          setCurrentPage('login');
          return null;
        }
        return <DepressionTest onComplete={handleAssessmentComplete} onBack={() => setCurrentPage('test-selection')} />;
      case 'test-burnout':
        if (!currentUser && !authenticatedUser) {
          setPendingPage(currentPage);
          setCurrentPage('login');
          return null;
        }
        return <BurnoutTest onComplete={handleAssessmentComplete} onBack={() => setCurrentPage('test-selection')} />;
      case 'test-sleep':
        if (!currentUser && !authenticatedUser) {
          setPendingPage(currentPage);
          setCurrentPage('login');
          return null;
        }
        return <SleepTest onComplete={handleAssessmentComplete} onBack={() => setCurrentPage('test-selection')} />;
      case 'about':
        return <About />;
      case 'contact':
        return <Contact />;
      case 'login':
        return <Login onNavigate={setCurrentPage} onAuth={handleAuth} />;
      case 'user-dashboard':
        if (!authenticatedUser) {
          setCurrentPage('login');
          return <Login onNavigate={setCurrentPage} onAuth={handleAuth} />;
        }
        return (
          <UserDashboard
            user={authenticatedUser}
            history={userHistory}
            domainInfo={domainInfo}
            view="overview"
            onOpenTests={() => setCurrentPage('test-selection')}
            onStartCombinedTest={() => setCurrentPage('questionnaire')}
            onStartSpecificTest={(testId) => setCurrentPage(`test-${testId}`)}
          />
        );
      case 'user-analytics':
      case 'user-history':
      case 'user-recommendations':
        if (!authenticatedUser) {
          setCurrentPage('login');
          return <Login onNavigate={setCurrentPage} onAuth={handleAuth} />;
        }
        return (
          <UserDashboard
            user={authenticatedUser}
            history={userHistory}
            domainInfo={domainInfo}
            view={currentPage === 'user-analytics' ? 'analytics' : currentPage === 'user-history' ? 'history' : 'recommendations'}
            onOpenTests={() => setCurrentPage('test-selection')}
            onStartCombinedTest={() => setCurrentPage('questionnaire')}
            onStartSpecificTest={(testId) => setCurrentPage(`test-${testId}`)}
          />
        );
      case 'admin-login':
        return <AdminLogin onLogin={(user) => {
          setIsAdminAuthenticated(true);
          setCurrentUser(user);
          setCurrentPage('admin-dashboard');
        }} onNavigate={setCurrentPage} />;
      case 'admin-dashboard':
        if (!isAdminAuthenticated) {
          setCurrentPage('admin-login');
          return <AdminLogin onLogin={(user) => {
            setIsAdminAuthenticated(true);
            setCurrentUser(user);
            setCurrentPage('admin-dashboard');
          }} onNavigate={setCurrentPage} />;
        }
        return <AdminDashboard currentUser={currentUser} onLogout={() => {
          setIsAdminAuthenticated(false);
          setCurrentUser(null);
          setCurrentPage('home');
        }} />;
      case 'results':
        return (
          <Results
            results={quizResults}
            onRetake={() => setCurrentPage('questionnaire')}
            onHome={() => setCurrentPage('home')}
            onDashboard={authenticatedUser ? () => setCurrentPage('user-dashboard') : undefined}
          />
        );
      default:
        return <Home onStartTest={() => setCurrentPage('test-selection')} onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="app">
      {currentPage !== 'admin-dashboard' && currentPage !== 'admin-login' && (
        <Navbar
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          currentUser={authenticatedUser}
          isUserAuthenticated={Boolean(authenticatedUser)}
          onUserLogout={handleUserLogout}
          onLogout={handleUserLogout}
        />
      )}
      <main className={`main-content ${currentPage !== 'home' &&
        currentPage !== 'home2' &&
        currentPage !== 'test-selection' &&
        currentPage !== 'tests' &&
        currentPage !== 'login' &&
        currentPage !== 'about' &&
        currentPage !== 'contact' &&
        currentPage !== 'admin-login' &&
        currentPage !== 'admin-dashboard' &&
        currentPage !== 'test-stress' &&
        currentPage !== 'test-anxiety' &&
        currentPage !== 'test-depression' &&
        currentPage !== 'test-burnout' &&
        currentPage !== 'test-sleep' &&
        !currentPage.startsWith('test-domain-') ? 'with-padding' : ''
        }`}>
        {renderPage()}
      </main>
    </div>
  );
}

export default App;