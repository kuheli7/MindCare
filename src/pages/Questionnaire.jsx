import { useEffect, useMemo, useState } from 'react';
import Screen1 from '../components/Screen1';
import Screen2 from '../components/Screen2';
import Screen3 from '../components/Screen3';
import DynamicDomainScreen from '../components/DynamicDomainScreen';
import './Questionnaire.css';

function Questionnaire({ onComplete, onBack }) {
  const [currentScreen, setCurrentScreen] = useState(1);
  const [showWarning, setShowWarning] = useState(false);
  const [extraScreenDefs, setExtraScreenDefs] = useState([]);
  const [answers, setAnswers] = useState({
    screen1: {},
    screen2: {},
    screen3: {},
    dynamic: {},
    optional: {}
  });

  useEffect(() => {
    const normalize = (name) =>
      String(name || '')
        .trim()
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');

    const fetchExtraDomains = async () => {
      try {
        const [typesRes, domainsRes] = await Promise.all([
          fetch('http://localhost:5000/api/assessment-types'),
          fetch('http://localhost:5000/api/domains')
        ]);

        if (!domainsRes.ok) {
          setExtraScreenDefs([]);
          return;
        }

        let generalTypeId = null;
        if (typesRes.ok) {
          const types = await typesRes.json();
          const general = types.find((t) => !t.isSpecialized) || types[0];
          generalTypeId = general?._id ? String(general._id) : null;
        }

        const domains = await domainsRes.json();
        const coreNames = new Set([
          'stress',
          'anxiety',
          'depression',
          'burnout',
          'sleep',
          'stress_and_anxiety',
          'depression_and_burnout',
          'sleep_assessment'
        ]);

        const extraDomainNames = [];
        domains.forEach((domain) => {
          const rawName = domain?.domain_name || '';
          const normalized = normalize(rawName);
          if (!normalized || coreNames.has(normalized)) return;

          const domainType =
            typeof domain.assessment_type_id === 'object'
              ? domain.assessment_type_id?._id
              : domain.assessment_type_id;

          if (generalTypeId && domainType && String(domainType) !== generalTypeId) {
            return;
          }

          if (!extraDomainNames.includes(rawName)) {
            extraDomainNames.push(rawName);
          }
        });

        const grouped = [];
        for (let i = 0; i < extraDomainNames.length; i += 2) {
          grouped.push(extraDomainNames.slice(i, i + 2));
        }

        const defs = grouped.map((domainNames, index) => ({
          key: `dynamic_${index + 1}`,
          domainNames
        }));

        setExtraScreenDefs(defs);
      } catch (err) {
        console.error('Failed to load dynamic domains', err);
        setExtraScreenDefs([]);
      }
    };

    fetchExtraDomains();
  }, []);

  const updateAnswers = (screen, data) => {
    setAnswers(prev => ({
      ...prev,
      [screen]: { ...prev[screen], ...data }
    }));
  };

  const updateDynamicAnswers = (screenKey, data) => {
    setAnswers((prev) => ({
      ...prev,
      dynamic: {
        ...prev.dynamic,
        [screenKey]: {
          ...(prev.dynamic[screenKey] || {}),
          ...data
        }
      }
    }));
  };

  const screenDefs = useMemo(() => {
    const base = [
      { key: 'screen1', type: 'fixed' },
      { key: 'screen2', type: 'fixed' },
      { key: 'screen3', type: 'fixed' }
    ];

    const dynamic = extraScreenDefs.map((s) => ({
      key: s.key,
      type: 'dynamic',
      domainNames: s.domainNames
    }));

    return [...base, ...dynamic];
  }, [extraScreenDefs]);

  const totalScreens = screenDefs.length;
  const currentDef = screenDefs[currentScreen - 1];
  const isFinalScreen = currentScreen === totalScreens;

  const handleNext = () => {
    if (!isScreenComplete()) {
      setShowWarning(true);
      return;
    }
    setShowWarning(false);
    if (currentScreen < totalScreens) {
      setCurrentScreen(currentScreen + 1);
      window.scrollTo(0, 0);
    } else {
      onComplete(answers);
    }
  };

  const handlePrevious = () => {
    if (currentScreen > 1) {
      setCurrentScreen(currentScreen - 1);
      window.scrollTo(0, 0);
    } else {
      onBack();
    }
  };

  const isScreenComplete = () => {
    if (!currentDef) return false;

    const currentAnswers =
      currentDef.type === 'dynamic'
        ? answers.dynamic[currentDef.key] || {}
        : answers[currentDef.key] || {};

    return Object.keys(currentAnswers).length > 0;
  };

  return (
    <div className="questionnaire-container">
      <div className="progress-bar-container card">
        <div className="progress-info">
          <span className="progress-text">Screen {currentScreen} of {totalScreens}</span>
          <span className="progress-percentage">{Math.round((currentScreen / totalScreens) * 100)}%</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${(currentScreen / totalScreens) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="questionnaire-content card">
        {showWarning && (
          <div className="validation-warning">
            ⚠️ Please answer all questions before proceeding to the next screen.
          </div>
        )}
        
        {currentScreen === 1 && (
          <Screen1 
            answers={answers.screen1} 
            onUpdate={(data) => { updateAnswers('screen1', data); setShowWarning(false); }}
            showValidation={showWarning}
          />
        )}
        {currentScreen === 2 && (
          <Screen2 
            answers={answers.screen2} 
            onUpdate={(data) => { updateAnswers('screen2', data); setShowWarning(false); }}
            showValidation={showWarning}
          />
        )}
        {currentScreen === 3 && (
          <Screen3 
            answers={answers.screen3} 
            optionalData={answers.optional}
            onUpdate={(data) => { updateAnswers('screen3', data); setShowWarning(false); }}
            onOptionalUpdate={(data) => updateAnswers('optional', data)}
            showOptionalSection={extraScreenDefs.length === 0}
            showValidation={showWarning}
          />
        )}

        {currentDef?.type === 'dynamic' && (
          <DynamicDomainScreen
            domainNames={currentDef.domainNames}
            answers={answers.dynamic[currentDef.key] || {}}
            onUpdate={(data) => {
              updateDynamicAnswers(currentDef.key, data);
              setShowWarning(false);
            }}
            optionalData={answers.optional}
            onOptionalUpdate={(data) => updateAnswers('optional', data)}
            showOptionalSection={isFinalScreen}
            showValidation={showWarning}
          />
        )}

        <div className="navigation-buttons">
          <button 
            className="btn btn-secondary"
            onClick={handlePrevious}
          >
            {currentScreen === 1 ? '← Back to Home' : '← Previous'}
          </button>
          
          <button 
            className="btn btn-primary"
            onClick={handleNext}
          >
            {isFinalScreen ? 'Submit & View Results' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Questionnaire;
