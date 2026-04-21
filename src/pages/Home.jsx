import './Home.css';
import { motion } from 'framer-motion';
import heroImage from '../assets/home_images/hero.png';
import home2Image from '../assets/home_images/home2.png';
import article1 from '../assets/home_images/img4.jpg';
import article2 from '../assets/home_images/img6.jpg';
import article3 from '../assets/home_images/img7.jpg';
import takeTestImg from '../assets/home_images/taketest.png';
import riskScoreImg from '../assets/home_images/riskscore.png';
import trackProgressImg from '../assets/home_images/trackprogess.png';

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0 },
};

const cardTransition = (index) => ({
  duration: 0.6,
  delay: index * 0.12,
  ease: 'easeOut',
});

const howStepImages = [
  { src: takeTestImg, alt: 'Take the test' },
  { src: riskScoreImg, alt: 'Get your risk score' },
  { src: trackProgressImg, alt: 'Track your progress' },
];

function Home({ onStartTest, onNavigate }) {
  return (
    <div className="home-container">

      {/* ── SEGMENT 1: HERO ── */}
      <div className="hero-segment">
        <img src={heroImage} alt="" className="hero-bg-img" />
        <motion.div className="hero-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.75, ease: 'easeOut' }}>
          <motion.span className="hero-eyebrow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05, duration: 0.45, ease: 'easeOut' }}>
            MindCare — Student Mental Well-Being
          </motion.span>
          <motion.h1 className="hero-headline" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.16, duration: 0.55, ease: 'easeOut' }}>
            Understand Your<br />
            Mental Health in{' '}
            <span className="hero-highlight">Minutes</span>
          </motion.h1>
          <motion.p className="hero-subheadline" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.28, duration: 0.55, ease: 'easeOut' }}>
            Scientifically structured assessments for stress, anxiety,
            burnout, depression, and sleep.
          </motion.p>
          <motion.div className="hero-cta-group" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.38, duration: 0.5, ease: 'easeOut' }}>
            <button className="btn-cta-primary" onClick={onStartTest}>
              Start Free Assessment
            </button>
            <button className="btn-cta-secondary" onClick={() => onNavigate('about')}>
              Why MindCare
            </button>
          </motion.div>
          <motion.p className="cta-disclaimer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.48, duration: 0.45, ease: 'easeOut' }}>
            Private&nbsp;•&nbsp;Anonymous&nbsp;•&nbsp;Takes 3 Minutes
          </motion.p>
          <motion.div className="hero-trust-strip" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.58, duration: 0.5, ease: 'easeOut' }}>
            <span className="trust-pill">Private &amp; Anonymous</span>
            <span className="trust-pill">Backed by Research</span>
            <span className="trust-pill">Used by 2,000+ Students</span>
          </motion.div>
        </motion.div>
      </div>

      <motion.section
        className="why-segment"
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.2 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="why-inner">
          <h2 className="why-title">Why MindCare?</h2>
          <p className="why-subtitle">Designed to be calm, private, and practical for daily student life.</p>
          <div className="why-grid">
            <motion.div className="why-card" variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: false, amount: 0.2 }} transition={cardTransition(0)}>
              <h3>100% Confidential</h3>
              <p>Your responses remain private and focused on helping you understand your current state safely.</p>
            </motion.div>
            <motion.div className="why-card" variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: false, amount: 0.2 }} transition={cardTransition(1)}>
              <h3>Evidence-Based Scoring</h3>
              <p>Assessments are structured around validated psychological indicators for meaningful guidance.</p>
            </motion.div>
            <motion.div className="why-card" variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: false, amount: 0.2 }} transition={cardTransition(2)}>
              <h3>Track Your Growth</h3>
              <p>Repeat tests over time and identify small improvements before challenges become overwhelming.</p>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* ── SEGMENT 2: HOW IT WORKS ── */}
      <motion.section
        className="how-segment"
        id="how-it-works"
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.2 }}
        transition={{ duration: 0.65, ease: 'easeOut' }}
      >
        <img src={home2Image} alt="" className="how-bg-img" />
        <div className="how-overlay" />
        <div className="how-inner">
          <motion.div
            className="how-header"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.25 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
          >
            <h2 className="how-title">How MindCare Works</h2>
            <p className="how-subtitle">Three simple steps to understand your mental well-being</p>
          </motion.div>

          <div className="how-steps how-steps-a">
            <motion.div
              className="step-card-a"
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, amount: 0.2 }}
              transition={cardTransition(0)}
            >
              <div className="step-a-img-wrap">
                <img src={howStepImages[0].src} alt={howStepImages[0].alt} />
                <span className="step-a-badge">01</span>
              </div>
              <div className="step-a-body">
                <h3 className="step-title">Take the Test</h3>
                <p className="step-text">Answer 20 evidence-based questions structured around validated psychological scales.</p>
              </div>
            </motion.div>

            <motion.div
              className="step-card-a"
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, amount: 0.2 }}
              transition={cardTransition(1)}
            >
              <div className="step-a-img-wrap">
                <img src={howStepImages[1].src} alt={howStepImages[1].alt} />
                <span className="step-a-badge">02</span>
              </div>
              <div className="step-a-body">
                <h3 className="step-title">Get Your Risk Score</h3>
                <p className="step-text">Receive categorised results — Low, Medium, or High — across all assessed domains.</p>
              </div>
            </motion.div>

            <motion.div
              className="step-card-a"
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, amount: 0.2 }}
              transition={cardTransition(2)}
            >
              <div className="step-a-img-wrap">
                <img src={howStepImages[2].src} alt={howStepImages[2].alt} />
                <span className="step-a-badge">03</span>
              </div>
              <div className="step-a-body">
                <h3 className="step-title">Track Your Progress</h3>
                <p className="step-text">Monitor mental health trends over time and recognise patterns before they escalate.</p>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      <motion.section
        className="stats-segment"
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.2 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="stats-inner">
          <div className="stat-item">
            <h3>10,000+</h3>
            <p>Assessments Completed</p>
          </div>
          <div className="stat-item">
            <h3>95%</h3>
            <p>Users Found It Helpful</p>
          </div>
          <div className="stat-item">
            <h3>5</h3>
            <p>Core Mental Health Domains</p>
          </div>
        </div>
      </motion.section>

      <motion.div
        className="articles-segment"
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.2 }}
        transition={{ duration: 0.65, ease: 'easeOut' }}
      >
        <h2 className="articles-title">Explore Mental Health Resources</h2>
        <p className="articles-intro">
          Expand your understanding with these insightful articles on mental wellness
        </p>
        <div className="articles-grid">
          <motion.div
            className="article-card"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.25 }}
            transition={cardTransition(0)}
          >
            <div className="article-image">
              <img src={article1} alt="Understanding Stress" />
            </div>
            <div className="article-content">
              <h3>Understanding Stress</h3>
              <p>
                Learn how to identify stress triggers and discover effective coping strategies
                to manage daily pressures and maintain balance in your life.
              </p>
              <button className="btn-read-more">Read More →</button>
            </div>
          </motion.div>

          <motion.div
            className="article-card"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.25 }}
            transition={cardTransition(1)}
          >
            <div className="article-image">
              <img src={article2} alt="The Science of Sleep" />
            </div>
            <div className="article-content">
              <h3>The Science of Sleep</h3>
              <p>
                Discover the crucial connection between quality sleep and emotional wellbeing,
                and learn why rest is fundamental to your mental health.
              </p>
              <button className="btn-read-more">Read More →</button>
            </div>
          </motion.div>

          <motion.div
            className="article-card"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.25 }}
            transition={cardTransition(2)}
          >
            <div className="article-image">
              <img src={article3} alt="Breaking the Stigma" />
            </div>
            <div className="article-content">
              <h3>Breaking the Stigma</h3>
              <p>
                Join the conversation about mental health. Learn how open dialogue can help
                break down barriers and create supportive communities.
              </p>
              <button className="btn-read-more">Read More →</button>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <motion.section
        className="final-cta-segment"
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.25 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <h2>Ready to Understand Your Mental Health?</h2>
        <p>Take your first step with a quick, private assessment built for students.</p>
        <button className="btn-cta-primary" onClick={onStartTest}>Start Free Assessment</button>
      </motion.section>
    </div>
  );
}

export default Home;
