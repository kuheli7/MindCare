import { useState, useEffect } from 'react';
import { FaUsers, FaChartBar, FaQuestionCircle, FaCog, FaSignOutAlt, FaPlus, FaTrash, FaEdit, FaHistory, FaCalculator, FaChevronDown, FaArrowLeft, FaBars, FaTimes } from 'react-icons/fa';
import './AdminDashboard.css';

function AdminDashboard({ currentUser, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [assessmentTypes, setAssessmentTypes] = useState([]);
  const [domains, setDomains] = useState([])


  const [editingQuestion, setEditingQuestion] = useState(null);
  // weight is fixed at 1, no input provided
  const [newQuestion, setNewQuestion] = useState({ domainId: '', assessment_type_id: '', text: '', option_set_id: '' });
  const [newDomain, setNewDomain] = useState({ name: '', color: '#3498db' });
  const [showAddDomain, setShowAddDomain] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState(null); // For navigating to domain detail view
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  const [optionSets, setOptionSets] = useState([]);

  // Scoring thresholds (fetched from DB)
  const [categories, setCategories] = useState([]);
  const [editingThresholds, setEditingThresholds] = useState(false);

  // Real test history from DB
  const [testHistory, setTestHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Test history sorting and filtering state
  const [sortBy, setSortBy] = useState('date'); // 'date', 'userId', 'avgScore'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
  const [filterDomain, setFilterDomain] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all'); 

  // Alert management
  const [alert, setAlert] = useState(null);

  // Auto-dismiss alert after 5 seconds
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  // Fetch domains from backend on mount
  // Fetch assessment types on mount
  useEffect(() => {
    const fetchAssessmentTypes = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/assessment-types');
        if (!res.ok) throw new Error('Failed fetching assessment types');
        const data = await res.json();
        setAssessmentTypes(data);
      } catch (err) {
        console.error('Error fetching assessment types:', err);
      }
    };
    fetchAssessmentTypes();
  }, []);

  // Fetch option sets on mount
  useEffect(() => {
    const fetchOptionSets = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/option-sets');
        if (!res.ok) throw new Error('Failed fetching option sets');
        const data = await res.json();
        setOptionSets(data);
      } catch (err) {
        console.error('Error fetching option sets:', err);
      }
    };
    fetchOptionSets();
  }, []);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/categories');
        if (!res.ok) throw new Error('Failed fetching categories');
        const data = await res.json();
        setCategories(data);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch real overview stats
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/admin/analytics');
        if (res.ok) {
          const data = await res.json();
          setOverviewStats({
            totalTests: data.totalTests || 0,
            todayTests: data.todayTests || 0,
            weekTests: data.weekTests || 0,
            monthTests: data.monthTests || 0
          });
        }
      } catch (err) {
        console.error('Error fetching analytics:', err);
      }
    };
    fetchAnalytics();
  }, []);

  // Fetch real test history
  useEffect(() => {
    const fetchTestHistory = async () => {
      try {
        setHistoryLoading(true);
        const res = await fetch('http://localhost:5000/api/admin/test-history');
        if (res.ok) {
          const data = await res.json();
          setTestHistory(data);
        }
      } catch (err) {
        console.error('Error fetching test history:', err);
      } finally {
        setHistoryLoading(false);
      }
    };
    fetchTestHistory();
  }, []);

  // Fetch domains from backend on mount
  useEffect(() => {
    const fetchDomains = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/domains');
        if (!res.ok) throw new Error('Failed fetching domains');
        const data = await res.json();
        if (!Array.isArray(data)) return;

        const mapped = await Promise.all(data.map(async (d) => {
          const domainId = d._id || d.id;
          let questionsData = [];
          try {
            const qRes = await fetch(`http://localhost:5000/api/questions/domain/${domainId}`);
            if (qRes.ok) {
              const qData = await qRes.json();
              questionsData = await Promise.all(qData.map(async (q) => {
                const qId = q._id || q.id;
                let options = [];
                try {
                  const oRes = await fetch(`http://localhost:5000/api/options/question/${qId}`);
                  if (oRes.ok) options = await oRes.json();
                } catch (e) {
                  console.error('Failed fetching options for question', qId, e);
                }

                // Handle assessment_type_id - it could be an object (populated) or a string (ID)
                let assessmentTypeId = null;
                if (typeof q.assessment_type_id === 'object' && q.assessment_type_id !== null) {
                  assessmentTypeId = q.assessment_type_id._id || q.assessment_type_id.id;
                } else if (typeof q.assessment_type_id === 'string') {
                  assessmentTypeId = q.assessment_type_id;
                }

                return {
                  id: qId,
                  text: q.question_text || q.text || '',
                  weight: q.weight || 1,
                  assessment_type_id: assessmentTypeId,
                  options
                };
              }));
            }
          } catch (e) {
            console.error('Failed fetching questions for domain', domainId, e);
          }

          // Group questions by assessment type
          const questionsByAssessment = {};
          questionsData.forEach(q => {
            const typeId = q.assessment_type_id;
            // Only add if assessment_type_id exists
            if (typeId) {
              if (!questionsByAssessment[typeId]) {
                questionsByAssessment[typeId] = [];
              }
              questionsByAssessment[typeId].push(q);
            }
          });

          return {
            id: domainId,
            name: d.domain_name || d.name,
            color: d.color || '#3498db',
            questions: questionsData,
            questionsByAssessment
          };
        }));

        setDomains(mapped);
      } catch (err) {
        console.error('Error fetching domains:', err);
      }
    };

    fetchDomains();
  }, [assessmentTypes]);

  // When a domain is selected, fetch its questions from backend
  useEffect(() => {
    if (!selectedDomain) return;

    const fetchQuestions = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/questions/domain/${selectedDomain}`);
        if (!res.ok) throw new Error('Failed fetching questions');
        const data = await res.json();

        const questions = await Promise.all(data.map(async (q) => {
          const qId = q._id || q.id;
          let options = [];
          try {
            const oRes = await fetch(`http://localhost:5000/api/options/question/${qId}`);
            if (oRes.ok) options = await oRes.json();
          } catch (e) {
            console.error('Failed fetching options for question', qId, e);
          }
          return { id: qId, text: q.question_text || q.text || '', weight: q.weight || 1, options };
        }));

        setDomains(prev => prev.map(d => {
          if (d.id === selectedDomain) {
            return { ...d, questions };
          }
          return d;
        }));
      } catch (err) {
        console.error('Error fetching questions for domain', selectedDomain, err);
      }
    };

    fetchQuestions();
  }, [selectedDomain]);

  // State for average scores
  const [averageScores, setAverageScores] = useState({});

  // Calculate average scores from test attempts
  useEffect(() => {
    const calculateAverages = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/assessment-attempts/analytics/averages');
        if (!res.ok) {
          console.log('No assessment attempts found yet');
          return;
        }

        const averages = await res.json();
        setAverageScores(averages);
      } catch (err) {
        console.error('Error fetching assessment averages:', err);
      }
    };

    calculateAverages();
  }, [domains]);
  // Removed automatic menu closing on resize to support unified drawer sidebar on all screen sizes


  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };


  // Overview stats from backend
  const [overviewStats, setOverviewStats] = useState({
    totalTests: 0,
    todayTests: 0,
    weekTests: 0,
    monthTests: 0
  });

  const handleEditQuestion = (domainId, index) => {
    const domain = domains.find(d => d.id === domainId);
    const question = domain.questions[index];
    setEditingQuestion({
      domainId,
      index,
      text: question.text,
      weight: question.weight || 1
    });
  };

  const handleSaveQuestion = () => {
    (async () => {
      if (!editingQuestion) return;
      const { domainId, index, text, weight } = editingQuestion;
      try {
        const domain = domains.find(d => d.id === domainId);
        const q = domain?.questions?.[index];
        
        console.log('Saving question:', { id: q?.id, text, weight });
        
        if (q && q.id) {
          const res = await fetch(`http://localhost:5000/api/questions/${q.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${currentUser?.token}`
            },
            body: JSON.stringify({ 
              question_text: text,
              weight: parseFloat(weight) || 1
            })
          });
          
          if (!res.ok) {
            const errorData = await res.json();
            console.error('Update failed:', errorData);
            throw new Error(errorData.message || 'Failed to update question');
          }
          
          const updated = await res.json();
          console.log('Question updated:', updated);
          
          setDomains(prev => prev.map(d => {
            if (d.id === domainId) {
              const updatedQuestions = [...d.questions];
              updatedQuestions[index] = { 
                ...updatedQuestions[index], 
                id: updated._id || updated.id, 
                text: updated.question_text || text, 
                weight: updated.weight || parseFloat(weight) || 1
              };
              return { ...d, questions: updatedQuestions };
            }
            return d;
          }));
          setAlert({ type: 'success', message: 'Question updated successfully' });
        } else {
          // Local update only (no backend ID yet)
          setDomains(prev => prev.map(d => {
            if (d.id === domainId) {
              const updatedQuestions = [...d.questions];
              updatedQuestions[index] = { 
                text, 
                weight: parseFloat(weight) || 1 
              };
              return { ...d, questions: updatedQuestions };
            }
            return d;
          }));
          setAlert({ type: 'success', message: 'Question updated locally' });
        }
        setEditingQuestion(null);
      } catch (err) {
        console.error('Save question error', err);
        setAlert({ type: 'error', message: 'Failed to save question: ' + err.message });
      }
    })();
  };

  const handleAddQuestion = () => {
    (async () => {
      if (!newQuestion.domainId) return setAlert({ type: 'error', message: 'Domain is not set' });
      if (!newQuestion.text.trim()) return setAlert({ type: 'error', message: 'Enter question text' });
      if (!newQuestion.assessment_type_id) return setAlert({ type: 'error', message: 'Select assessment type' });
      if (!newQuestion.option_set_id) return setAlert({ type: 'error', message: 'Select an option set' });
      try {
        const res = await fetch('http://localhost:5000/api/questions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentUser?.token}`
          },
          body: JSON.stringify({
            domain_id: newQuestion.domainId,
            assessment_type_id: newQuestion.assessment_type_id,
            question_text: newQuestion.text,
            option_set_id: newQuestion.option_set_id,
            weight: 1 // fixed default weight
          })
        });

        if (!res.ok) {
          const error = await res.json();
          console.error('Create question response error:', error);
          return setAlert({ type: 'error', message: error.message || error.error || 'Failed to create question' });
        }
        const created = await res.json();

        console.log('Question created on server:', created);

        // Fetch the auto-created options for this question from the backend
        let createdOptions = [];
        try {
          const oRes = await fetch(`http://localhost:5000/api/options/question/${created._id || created.id}`);
          if (oRes.ok) createdOptions = await oRes.json();
        } catch (e) {
          console.error('Failed fetching options for new question', e);
        }

        setDomains(prev => prev.map(d => {
          if (d.id === newQuestion.domainId) {
            const q = {
              id: created._id || created.id,
              text: created.question_text || created.text,
              weight: created.weight || 1,
              assessment_type_id: created.assessment_type_id,
              options: createdOptions
            };
            return {
              ...d,
              questions: [...d.questions, q],
              questionsByAssessment: {
                ...d.questionsByAssessment,
                [created.assessment_type_id]: [...(d.questionsByAssessment?.[created.assessment_type_id] || []), q]
              }
            };
          }
          return d;
        }));

        setNewQuestion({ domainId: newQuestion.domainId, assessment_type_id: '', text: '', option_set_id: '' });
        setAlert({ type: 'success', message: 'Question added successfully with options from the selected option set' });
      } catch (err) {
        console.error('Add question error', err);
        setAlert({ type: 'error', message: 'Failed to add question' });
      }
    })();
  };

  const handleDeleteQuestion = (domainId, index) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;

    (async () => {
      try {
        const domain = domains.find(d => d.id === domainId);
        if (!domain) return;
        const question = domain.questions[index];
        if (!question || !question.id) {
          setDomains(prev => prev.map(d => {
            if (d.id === domainId) {
              const updatedQuestions = d.questions.filter((_, i) => i !== index);
              const updatedByAssessment = {};
              Object.entries(d.questionsByAssessment || {}).forEach(([typeId, questions]) => {
                const filtered = questions.filter((_, i) => i !== index);
                if (filtered.length > 0) {
                  updatedByAssessment[typeId] = filtered;
                }
              });
              return { ...d, questions: updatedQuestions, questionsByAssessment: updatedByAssessment };
            }
            return d;
          }));
          return;
        }

        const res = await fetch(`http://localhost:5000/api/questions/${question.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${currentUser?.token}` }
        });
        if (!res.ok) throw new Error('Failed to delete question');

        setDomains(prev => prev.map(d => {
          if (d.id === domainId) {
            const updatedQuestions = d.questions.filter(q => q.id !== question.id);
            const updatedByAssessment = {};
            Object.entries(d.questionsByAssessment || {}).forEach(([typeId, questions]) => {
              const filtered = questions.filter(q => q.id !== question.id);
              if (filtered.length > 0) {
                updatedByAssessment[typeId] = filtered;
              }
            });
            return { ...d, questions: updatedQuestions, questionsByAssessment: updatedByAssessment };
          }
          return d;
        }));
        setAlert({ type: 'success', message: 'Question deleted successfully' });
      } catch (err) {
        console.error('Delete question error', err);
        setAlert({ type: 'error', message: 'Failed to delete question' });
      }
    })();
  };

  const handleAddDomain = () => {
    (async () => {
      if (!newDomain.name.trim()) return setAlert({ type: 'error', message: 'Enter domain name' });

      try {
        console.log('Creating domain with:', { domain_name: newDomain.name, color: newDomain.color });
        console.log('Token:', currentUser?.token);
        
        const res = await fetch('http://localhost:5000/api/domains', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentUser?.token}`
          },
          body: JSON.stringify({
            domain_name: newDomain.name,
            color: newDomain.color
          })
        });
        
        const responseData = await res.json();
        console.log('Domain creation response:', responseData);
        
        if (!res.ok) {
          return setAlert({ type: 'error', message: responseData.error || responseData.message || 'Failed to create domain' });
        }

        const d = {
          id: responseData._id || responseData.id,
          name: responseData.domain_name || responseData.name || newDomain.name,
          color: responseData.color || newDomain.color,
          questions: [],
          questionsByAssessment: {}
        };
        setDomains(prev => [...prev, d]);
        setNewDomain({ name: '', color: '#3498db' });
        setShowAddDomain(false);
        setAlert({ type: 'success', message: 'Domain added successfully' });
      } catch (err) {
        console.error('Add domain error', err);
        setAlert({ type: 'error', message: 'Failed to add domain: ' + err.message });
      }
    })();
  };

  const handleDeleteDomain = (domainId) => {
    if (!window.confirm('Are you sure you want to delete this entire domain and all its questions?')) return;

    (async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/domains/${domainId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${currentUser?.token}` }
        });
        if (!res.ok) throw new Error('Failed to delete domain');
        setDomains(prev => prev.filter(d => d.id !== domainId));
        setAlert({ type: 'success', message: 'Domain deleted successfully' });
      } catch (err) {
        console.error('Delete domain error', err);
        setAlert({ type: 'error', message: 'Failed to delete domain' });
      }
    })();
  };

  const calculateMaxScore = (domain) => {
    return domain.questions.reduce((sum, q) => sum + (q.weight * 4), 0);
  };

  const calculateMaxScoreByAssessmentType = (domain, assessmentTypeId) => {
    const questionsForType = (domain.questionsByAssessment?.[assessmentTypeId] || []);
    return questionsForType.reduce((sum, q) => sum + (q.weight || 1) * 4, 0);
  };

  const getScoreLevel = (percentage) => {
    if (!categories || categories.length === 0) return { label: 'N/A', color: '#ccc' };

    const colors = ['#48bb78', '#f6ad55', '#ed8936', '#FF8F8F'];
    const matched = categories.find(cat => percentage >= cat.min_score && percentage <= cat.max_score);

    if (matched) {
      const index = categories.indexOf(matched);
      return { ...matched, color: colors[index] || '#3498db' };
    }

    // Fallback logic for gaps
    if (percentage < categories[0].min_score) return { ...categories[0], color: colors[0] };
    if (percentage > categories[categories.length - 1].max_score) return { ...categories[categories.length - 1], color: colors[colors.length - 1] };

    return { label: 'Unknown', color: '#ccc' };
  };

  const handleSaveThresholds = async () => {
    console.log('handleSaveThresholds triggered', { categories, currentUser });
    if (!currentUser?.token) {
      setAlert({ type: 'error', message: 'You must be signed in as an admin to save thresholds' });
      return;
    }

    // ensure each category has an id for server to update
    for (const cat of categories) {
      if (!cat._id && !cat.id) {
        setAlert({ type: 'error', message: 'Cannot save thresholds: missing category identifier' });
        return;
      }
    }

    try {
      // explicitly log and reuse the URL so we can inspect network calls
      const url = 'http://localhost:5000/api/categories/bulk';
      console.log('saving thresholds to', url);
      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`
        },
        body: JSON.stringify({ categories })
      });

      if (!res.ok) {
        // peek at body for debugging
        const text = await res.text();
        console.error('threshold save response not ok', res.status, text);
        let errMsg = `Request failed (${res.status})`;
        try {
          const data = JSON.parse(text);
          if (data && data.message) errMsg = data.message;
        } catch (e) {
          if (text) errMsg += ` - ${text}`;
        }
        throw new Error(errMsg);
      }

      setEditingThresholds(false);
      setAlert({ type: 'success', message: 'Thresholds updated successfully' });
    } catch (err) {
      console.error('Save thresholds error:', err);
      setAlert({ type: 'error', message: `Failed to update thresholds: ${err.message}` });
    }
  };

  const toggleQuestionExpand = (domainId, index) => {
    const key = `${domainId}-${index}`;
    setExpandedQuestion(expandedQuestion === key ? null : key);
  };

  const handleAddOption = (domainId, questionIndex) => {
    (async () => {
      if (!newOption.label.trim() || newOption.value === '') return setAlert({ type: 'error', message: 'Enter option text and points' });
      try {
        const domain = domains.find(d => d.id === domainId);
        if (!domain) return;
        const question = domain.questions[questionIndex];
        if (!question || !question.id) return setAlert({ type: 'error', message: 'Question not found' });

        const res = await fetch('http://localhost:5000/api/options', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentUser?.token}`
          },
          body: JSON.stringify({
            question_id: question.id,
            option_text: newOption.label,
            points: parseInt(newOption.value) || 0
          })
        });
        if (!res.ok) {
          const error = await res.json();
          return setAlert({ type: 'error', message: error.error || 'Failed to create option' });
        }
        const created = await res.json();

        setDomains(prev => prev.map(d => {
          if (d.id === domainId) {
            const updatedQuestions = [...d.questions];
            updatedQuestions[questionIndex] = {
              ...updatedQuestions[questionIndex],
              options: [...(updatedQuestions[questionIndex].options || []), created]
            };
            return { ...d, questions: updatedQuestions };
          }
          return d;
        }));
        setNewOption({ value: '', label: '' });
        setAlert({ type: 'success', message: 'Option added successfully' });
      } catch (err) {
        console.error('Add option error', err);
        setAlert({ type: 'error', message: 'Failed to add option' });
      }
    })();
  };

  const handleDeleteOption = (domainId, questionIndex, optionId) => {
    if (!window.confirm('Delete this option?')) return;
    (async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/options/${optionId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${currentUser?.token}` }
        });
        if (!res.ok) throw new Error('Failed to delete option');

        setDomains(prev => prev.map(d => {
          if (d.id === domainId) {
            const updatedQuestions = [...d.questions];
            updatedQuestions[questionIndex] = {
              ...updatedQuestions[questionIndex],
              options: updatedQuestions[questionIndex].options.filter(opt => opt._id !== optionId)
            };
            return { ...d, questions: updatedQuestions };
          }
          return d;
        }));
        setAlert({ type: 'success', message: 'Option deleted successfully' });
      } catch (err) {
        console.error('Delete option error', err);
        setAlert({ type: 'error', message: 'Failed to delete option' });
      }
    })();
  };

  const getQuestionOptions = (domainId, questionIndex) => {
    const domain = domains.find(d => d.id === domainId);
    if (!domain) return [];
    const question = domain.questions[questionIndex];
    return question?.options || [];
  };

  const renderOverview = () => (
    <div className="overview-section">
      <h2 className="section-title">Dashboard Overview</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#13283A' }}>
            <FaUsers />
          </div>
          <div className="stat-content">
            <h3>Total Tests Taken</h3>
            <p className="stat-number">{overviewStats.totalTests}</p>
            <span className="stat-label">All time</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#6F8CAB' }}>
            <FaChartBar />
          </div>
          <div className="stat-content">
            <h3>Today's Tests</h3>
            <p className="stat-number">{overviewStats.todayTests}</p>
            <span className="stat-label">Last 24 hours</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#EDDCB4', color: '#13283A' }}>
            <FaChartBar />
          </div>
          <div className="stat-content">
            <h3>This Week</h3>
            <p className="stat-number">{overviewStats.weekTests}</p>
            <span className="stat-label">Last 7 days</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#4A9B8E' }}>
            <FaChartBar />
          </div>
          <div className="stat-content">
            <h3>This Month</h3>
            <p className="stat-number">{overviewStats.monthTests}</p>
            <span className="stat-label">Last 30 days</span>
          </div>
        </div>
      </div>

      <h3 className="subsection-title">Average Scores by Domain</h3>
      <div className="scores-flat-card">
        {domains.map((domain) => {
          const totalQuestions = domain.questions ? domain.questions.length : 0;
          if (totalQuestions === 0) return null;

          // Calculate total max score and average score across all assessment types
          const maxScore = (domain.questions || []).reduce((sum, q) => sum + (q.weight || 1) * 4, 0);
          const avgScore = (assessmentTypes || []).reduce((total, type) => {
            const scoreKey = `${domain.id}-${type._id}`;
            return total + (averageScores[scoreKey] || 0);
          }, 0);
          const clampedAvg = Math.min(avgScore, maxScore);
          const percentage = maxScore > 0 ? (clampedAvg / maxScore) * 100 : 0;

          return (
            <div key={domain.id} className="score-item">
              <span className="score-label">{domain.name}</span>
              <span className="score-value">{clampedAvg.toFixed(1)}/{maxScore}</span>
              <div className="score-bar">
                <div className="score-fill" style={{ width: `${percentage}%`, background: domain.color }} />
              </div>
              <span className="score-q-count">{totalQuestions} questions</span>
            </div>
          );
        })}
      </div>
    </div>
  );


  const renderQuestions = () => {
    // If a domain is selected, show the domain detail view
    if (selectedDomain) {
      const domain = domains.find(d => d.id === selectedDomain);
      if (!domain) {
        setSelectedDomain(null);
        return null;
      }

      return (
        <div className="domain-detail-view">
          <div className="domain-detail-header">
            <button className="btn-back" onClick={() => {
              setSelectedDomain(null);
              setEditingQuestion(null);
              setExpandedQuestion(null);
            }}>
              <FaArrowLeft /> Back to Domains
            </button>
            <h2 className="domain-detail-title" style={{ borderLeftColor: domain.color }}>
              <span className="domain-color-badge" style={{ backgroundColor: domain.color }}></span>
              {domain.name}
            </h2>
            <button
              className="btn-delete-domain"
              onClick={() => {
                if (window.confirm(`Delete entire ${domain.name} domain and all its questions?`)) {
                  handleDeleteDomain(domain.id);
                  setSelectedDomain(null);
                }
              }}
              title="Delete entire domain"
            >
              <FaTrash /> Delete Domain
            </button>
          </div>

          <div className="domain-stats-bar">
            <div className="domain-stat">
              <strong>{domain.questions.length}</strong> Questions
            </div>
            {assessmentTypes.map(type => {
              const maxScore = calculateMaxScoreByAssessmentType(domain, type._id);
              if (maxScore === 0) return null;
              return (
                <div key={type._id} className="domain-stat assessment-detail-stat">
                  <span><strong>{maxScore}</strong> Max Score ({type.name})</span>
                </div>
              );
            })}
          </div>

          <div className="questions-list">
            {Object.entries(domain.questionsByAssessment || {}).map(([assessmentTypeId, questions]) => {
              // Skip 'unknown' assessment types
              if (assessmentTypeId === 'unknown') return null;
              const assessmentType = assessmentTypes.find(t => t._id === assessmentTypeId);
              // Skip if assessment type not found
              if (!assessmentType) return null;
              const assessmentTypeName = assessmentType?.name || 'Unknown';

              return (
                <div key={assessmentTypeId} className="assessment-group">
                  <h4 className="assessment-group-title">{assessmentTypeName} Assessment</h4>
                  <div className="assessment-questions">
                    {questions.map((question, qIndex) => {
                      // Find the original index in domain.questions
                      const originalIndex = domain.questions.findIndex(q => q.id === question.id);
                      const questionKey = `${domain.id}-${originalIndex}`;
                      const isExpanded = expandedQuestion === questionKey;
                      const options = getQuestionOptions(domain.id, originalIndex);

                      return (
                        <div key={question.id} className={`question-item ${isExpanded ? 'question-item-expanded' : ''}`}>
                          {editingQuestion?.domainId === domain.id && editingQuestion?.index === originalIndex ? (
                            <div className="question-edit">
                              <textarea
                                value={editingQuestion.text}
                                onChange={(e) => setEditingQuestion({ ...editingQuestion, text: e.target.value })}
                                className="question-textarea"
                                placeholder="Question text"
                              />
                              {/* weight is fixed at 1, not editable */}
                              {/* removed weight input per requirement */}
                              <div className="question-actions">
                                <button className="btn-save" onClick={handleSaveQuestion}>Save</button>
                                <button className="btn-cancel" onClick={() => setEditingQuestion(null)}>Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="question-main-row" onClick={() => toggleQuestionExpand(domain.id, originalIndex)} style={{ cursor: 'pointer' }}>
                                <span className="question-number">Q{qIndex + 1}</span>
                                <span className="question-text">{question.text}</span>
                                {/* weight multiplier intentionally hidden - fixed at 1 */}
                                <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
                              </div>
                              <div className="question-controls" onClick={(e) => e.stopPropagation()}>
                                <button className="btn-edit" onClick={() => handleEditQuestion(domain.id, originalIndex)}>
                                  <FaEdit />
                                </button>
                                <button className="btn-delete" onClick={() => handleDeleteQuestion(domain.id, originalIndex)}>
                                  <FaTrash />
                                </button>
                              </div>

                              {isExpanded && (
                                <div className="question-options-container">
                                  <div className="options-header">
                                    <h4>Answer Options ({options.length} options)</h4>
                                    <span className="options-source-note">Auto-fetched from Option Set</span>
                                  </div>

                                  <div className="options-list">
                                    {options.length === 0 ? (
                                      <p className="no-options-note">No options found for this question.</p>
                                    ) : (
                                      options.map((option, optIdx) => (
                                        <div key={optIdx} className="option-item">
                                          <span className="option-value-badge">{option.points || option.value || 0}</span>
                                          <span className="option-label-display">{option.option_text || option.label || ''}</span>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="add-question-section-inline">
            <h3 className="subsection-title">Add New Question to {domain.name}</h3>
            <div className="add-question-form">
              <select
                value={newQuestion.domainId === domain.id ? newQuestion.assessment_type_id : ''}
                onChange={(e) => setNewQuestion({ ...newQuestion, domainId: domain.id, assessment_type_id: e.target.value })}
                className="assessment-type-select"
              >
                <option value="">Select Assessment Type</option>
                {assessmentTypes.map((type) => (
                  <option key={type._id} value={type._id}>
                    {type.name}
                  </option>
                ))}
              </select>

              <select
                value={newQuestion.domainId === domain.id ? newQuestion.option_set_id : ''}
                onChange={(e) => setNewQuestion({ ...newQuestion, domainId: domain.id, option_set_id: e.target.value })}
                className="assessment-type-select"
              >
                <option value="">Select Option Set</option>
                {optionSets.map((set) => (
                  <option key={set._id} value={set._id}>
                    {set.set_name} ({set.options?.length ?? 0} options)
                  </option>
                ))}
              </select>

              {/* Preview options from the selected option set */}
              {newQuestion.domainId === domain.id && newQuestion.option_set_id && (() => {
                const preview = optionSets.find(s => s._id === newQuestion.option_set_id);
                return preview ? (
                  <div className="option-set-preview">
                    <p className="option-set-preview-label">Options that will be applied:</p>
                    <div className="option-set-preview-list">
                      {preview.options?.map((opt, idx) => (
                        <span key={idx} className="option-preview-chip">
                          <strong>{opt.points}</strong> — {opt.option_text}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}

              <textarea
                value={newQuestion.domainId === domain.id ? newQuestion.text : ''}
                onChange={(e) => setNewQuestion({ ...newQuestion, domainId: domain.id, text: e.target.value })}
                placeholder="Enter new question text..."
                className="question-textarea"
              />
              {/* weight input removed - questions will use default weight of 1 */}
              <button
                className="btn btn-primary"
                onClick={handleAddQuestion}
              >
                <FaPlus /> Add Question
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Default view: Show domain list
    return (
      <div className="questions-section">
        <h2 className="section-title">Domain Management</h2>
        <p className="section-subtitle">Select a domain to view and edit its questions</p>

        <div className="add-domain-container">
          {showAddDomain ? (
            <div className="add-domain-form">
              <input
                type="text"
                value={newDomain.name}
                onChange={(e) => setNewDomain({ ...newDomain, name: e.target.value })}
                placeholder="Domain name (e.g., Resilience)"
                className="domain-input"
              />
              <input
                type="color"
                value={newDomain.color}
                onChange={(e) => setNewDomain({ ...newDomain, color: e.target.value })}
                className="color-input"
                title="Choose domain color"
              />
              <button className="btn-save" onClick={handleAddDomain}>Add Domain</button>
              <button className="btn-cancel" onClick={() => setShowAddDomain(false)}>Cancel</button>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={() => setShowAddDomain(true)}>
              <FaPlus /> Add New Domain
            </button>
          )}
        </div>

        <div className="domains-grid">
          {domains.map((domain) => (
            <div
              key={domain.id}
              className="domain-card"
              onClick={() => setSelectedDomain(domain.id)}
              style={{ borderTopColor: domain.color }}
            >
              <div className="domain-card-header">
                <span className="domain-color-badge-large" style={{ backgroundColor: domain.color }}></span>
                <h3 className="domain-card-title">{domain.name}</h3>
              </div>
              <div className="domain-card-stats">
                <div className="domain-card-stat">
                  <FaQuestionCircle style={{ color: domain.color }} />
                  <span><strong>{domain.questions.length}</strong> Questions</span>
                </div>
                {assessmentTypes.map(type => {
                  const maxScore = calculateMaxScoreByAssessmentType(domain, type._id);
                  if (maxScore === 0) return null;
                  return (
                    <div key={type._id} className="domain-card-stat assessment-stat">
                      <FaCalculator style={{ color: domain.color }} />
                      <span><strong>{maxScore}</strong> Max ({type.name})</span>
                    </div>
                  );
                })}
              </div>
              <div className="domain-card-footer">
                <span className="domain-card-link" style={{ color: domain.color }}>
                  View & Edit Questions →
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderScoring = () => (
    <div className="scoring-section">
      <h2 className="section-title">Scoring Logic</h2>

      <div className="scoring-info">
        <div className="scoring-card">
          <h3>Scale Values</h3>
          <ul className="scoring-list">
            <li><strong>0</strong> - Never</li>
            <li><strong>1</strong> - Rarely</li>
            <li><strong>2</strong> - Sometimes</li>
            <li><strong>3</strong> - Often</li>
            <li><strong>4</strong> - Almost Always</li>
          </ul>
          <p className="scoring-note">
            Each question response (0-4) is multiplied by its weightage to calculate the final score.
          </p>
        </div>

        <div className="scoring-card">
          <h3>Domain Calculations</h3>
          {domains.map(domain => (
            <div key={domain.id} className="calculation-item">
              <h4 style={{ color: domain.color }}>{domain.name}</h4>
              <p>{domain.questions.length} questions with individual weightages</p>
              <p className="formula">Max Score: {calculateMaxScore(domain)}</p>
              <div className="weightage-breakdown">
                {domain.questions.map((q, idx) => (
                  <div key={idx} className="weight-item">
                    <span>Q{idx + 1}: ×{q.weight}</span>
                    <span className="weight-max">Max: {(q.weight * 4).toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="scoring-card">
          <div className="scoring-header">
            <h3>Level Classification Thresholds</h3>
            {!editingThresholds ? (
              <button className="btn-edit" onClick={() => setEditingThresholds(true)}>
                <FaEdit /> Edit Thresholds
              </button>
            ) : (
              <button className="btn-save" onClick={handleSaveThresholds}>
                Save Changes
              </button>
            )}
          </div>

          {editingThresholds ? (
            <div className="threshold-editor">
              {categories.map((cat, idx) => {
                const colors = ['#48bb78', '#f6ad55', '#ed8936', '#FF8F8F'];
                const cardColor = colors[idx] || '#3498db';

                return (
                  <div key={cat._id || idx} className="threshold-input-group">
                    <label style={{ color: cardColor }}>
                      <strong>{cat.label}:</strong>
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={cat.min_score}
                      onChange={(e) => {
                        const newCats = [...categories];
                        newCats[idx] = { ...newCats[idx], min_score: parseFloat(e.target.value) };
                        // Automatically update previous max if not the first one
                        if (idx > 0) {
                          newCats[idx - 1] = { ...newCats[idx - 1], max_score: parseFloat(e.target.value) - 1 };
                        }
                        setCategories(newCats);
                      }}
                      className="threshold-input"
                    />
                    <span>% -</span>
                    <input
                      type="number"
                      step="1"
                      value={cat.max_score}
                      onChange={(e) => {
                        const newCats = [...categories];
                        newCats[idx] = { ...newCats[idx], max_score: parseFloat(e.target.value) };
                        // Automatically update next min if not the last one
                        if (idx < categories.length - 1) {
                          newCats[idx + 1] = { ...newCats[idx + 1], min_score: parseFloat(e.target.value) + 1 };
                        }
                        setCategories(newCats);
                      }}
                      className="threshold-input"
                    />
                    <span>%</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <ul className="scoring-list">
              {categories.map((cat, idx) => {
                const colors = ['#48bb78', '#f6ad55', '#ed8936', '#FF8F8F'];
                return (
                  <li key={cat._id || idx}>
                    <strong style={{ color: colors[idx] || '#3498db' }}>
                      {cat.label}:
                    </strong> {cat.min_score}% - {cat.max_score}%
                  </li>
                );
              })}
            </ul>
          )}
          <p className="scoring-note">
            Formula: (User Score / Max Score) × 100 = Percentage
          </p>
        </div>
      </div>
    </div>
  );
  // The extra '};' that was here has been removed.

  const renderTestHistory = () => {
    // sort and filter
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let filtered = testHistory.filter(test => {
      const domainMatch = filterDomain === 'all' || (test.domains || []).some(d => d.toLowerCase().includes(filterDomain.toLowerCase()));
      const statusMatch = filterStatus === 'all' || (test.riskLevel || '').toLowerCase().includes(filterStatus.toLowerCase());
      return domainMatch && statusMatch;
    });

    filtered = filtered.slice().sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') {
        comparison = new Date(a.date) - new Date(b.date);
      } else if (sortBy === 'userId') {
        comparison = (a.userId || '').localeCompare(b.userId || '');
      } else if (sortBy === 'avgScore') {
        comparison = (a.overallScore || 0) - (b.overallScore || 0);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    const formatDate = (dateStr) => {
      if (!dateStr) return '-';
      const d = new Date(dateStr);
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const uniqueUsers = new Set(testHistory.map(t => t.userId)).size;
    const todayCount = testHistory.filter(t => new Date(t.date) >= today).length;

    return (
      <div className="test-history-section">
        <h2 className="section-title">Test Submission History</h2>

        <div className="history-stats">
          <div className="history-stat-card">
            <FaUsers />
            <div>
              <h3>{testHistory.length}</h3>
              <p>Total Submissions</p>
            </div>
          </div>
          <div className="history-stat-card">
            <FaHistory />
            <div>
              <h3>{todayCount}</h3>
              <p>Today's Tests</p>
            </div>
          </div>
          <div className="history-stat-card">
            <FaChartBar />
            <div>
              <h3>{uniqueUsers}</h3>
              <p>Unique Users</p>
            </div>
          </div>
        </div>

        {/* Sorting and Filtering Controls */}
        <div className="history-controls">
          <div className="control-group">
            <label>Sort By:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="history-select">
              <option value="date">Date &amp; Time</option>
              <option value="userId">User ID</option>
              <option value="avgScore">Average Score</option>
            </select>

            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="history-select">
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>

          <div className="control-group">
            <label>Filter by Domain:</label>
            <select value={filterDomain} onChange={(e) => setFilterDomain(e.target.value)} className="history-select">
              <option value="all">All Domains</option>
              {domains.map(domain => (
                <option key={domain.id} value={domain.name}>{domain.name}</option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <label>Filter by Status:</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="history-select">
              <option value="all">All Statuses</option>
              {categories.map(cat => (
                <option key={cat._id || cat.label} value={cat.label.toLowerCase()}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="test-history-table-container">
          {historyLoading ? (
            <p style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>Loading test history...</p>
          ) : (
            <table className="test-history-table">
              <thead>
                <tr>
                  <th>Date &amp; Time</th>
                  <th>User</th>
                  <th>Domains Tested</th>
                  <th>Domain Scores</th>
                  <th>Overall Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="no-data">No test submissions match the selected filters</td>
                  </tr>
                ) : (
                  filtered.map((test) => {
                    const scoreEntries = Object.entries(test.scores || {});
                    const riskLevel = test.riskLevel || 'Unknown';
                    const riskColor = categories.length > 0
                      ? (() => {
                        const colors = ['#48bb78', '#f6ad55', '#ed8936', '#FF8F8F'];
                        const idx = categories.findIndex(c => c.label && riskLevel && c.label.toLowerCase() === riskLevel.toLowerCase());
                        return colors[idx] !== undefined ? colors[idx] : '#aaa';
                      })()
                      : '#aaa';

                    return (
                      <tr key={test.id}>
                        <td className="date-cell">{formatDate(test.date)}</td>
                        <td className="user-cell">
                          <span style={{ fontWeight: 600 }}>{test.userId}</span>
                          {test.isAnonymous && <span style={{ fontSize: '0.7rem', color: '#888', display: 'block' }}>Anonymous</span>}
                        </td>
                        <td className="domains-cell">
                          <div className="domain-tags">
                            {(test.domains || []).map((domain, idx) => (
                              <span key={idx} className="domain-tag">{domain}</span>
                            ))}
                          </div>
                        </td>
                        <td className="scores-cell">
                          <div className="score-details">
                            {(scoreEntries || []).map(([domain, score]) => (
                              <div key={domain} className="score-chip">
                                <span className="score-domain">{domain}:</span>
                                <span className="score-value">{score}%</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="status-cell">
                          <span
                            className="status-badge"
                            style={{ backgroundColor: riskColor, color: 'white' }}
                          >
                            {riskLevel}
                          </span>
                          <span className="avg-score">{test.overallScore}%</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="admin-dashboard">
      {alert && (
        <div className={`alert alert-${alert.type}`}>
          <span className="alert-message">{alert.message}</span>
          <button className="alert-close" onClick={() => setAlert(null)}>×</button>
        </div>
      )}
      <button
        type="button"
        className={`admin-sidebar-backdrop ${isMobileMenuOpen ? 'visible' : ''}`}
        aria-label="Close menu"
        onClick={() => setIsMobileMenuOpen(false)}
      />

      <div className={`admin-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="admin-brand">
          <h2>MindCare Admin</h2>
        </div>

        <nav className="admin-nav">
          <button
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => handleTabChange('overview')}
          >
            <FaChartBar /> Dashboard
          </button>
          <button
            className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => handleTabChange('history')}
          >
            <FaHistory /> Test History
          </button>
          <button
            className={`nav-item ${activeTab === 'questions' ? 'active' : ''}`}
            onClick={() => handleTabChange('questions')}
          >
            <FaQuestionCircle /> Questions
          </button>
          <button
            className={`nav-item ${activeTab === 'scoring' ? 'active' : ''}`}
            onClick={() => handleTabChange('scoring')}
          >
            <FaCalculator /> Scoring Logic
          </button>
        </nav>

        <button className="logout-btn" onClick={onLogout}>
          <FaSignOutAlt /> Logout
        </button>
      </div>

      <div className="admin-main">
        <div className="admin-mobile-topbar">
          <button
            type="button"
            className="admin-menu-toggle"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle admin menu"
          >
            {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
          <h3>Admin Panel</h3>
        </div>
        <div className="admin-content">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'history' && renderTestHistory()}
          {activeTab === 'questions' && renderQuestions()}
          {activeTab === 'scoring' && renderScoring()}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
