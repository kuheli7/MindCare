import { FaHeart, FaUsers, FaShieldAlt, FaLightbulb } from 'react-icons/fa';
import { motion } from 'framer-motion';
import missionImage from '../assets/home_images/unused/3.png?v=20260222-3';
import offerImageA from '../assets/home_images/unused/girl_test.png?v=20260222-3';
import offerImageB from '../assets/home_images/unused/a_guy_working_on_laptop.png?v=20260222-3';
import wellnessImage from '../assets/home_images/unused/5.png?v=20260222-3';
import './About.css';

const fadeInUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

const sectionView = {
  initial: 'hidden',
  whileInView: 'visible',
  viewport: { once: false, amount: 0.18 },
};

function About() {
  return (
    <div className="about-container">
      {/* Hero Section */}
      <motion.section className="about-hero" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, ease: 'easeOut' }}>
        <motion.div className="about-hero-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12, duration: 0.55, ease: 'easeOut' }}>
          <motion.h1 className="about-hero-title" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' }}>About MindCare</motion.h1>
          <motion.p className="about-hero-subtitle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.5, ease: 'easeOut' }}>
            Your trusted partner in mental health and wellbeing
          </motion.p>
        </motion.div>
      </motion.section>

      {/* Mission Section */}
      <motion.section className="about-section" variants={fadeInUp} transition={{ duration: 0.6, ease: 'easeOut' }} {...sectionView}>
        <motion.div className="about-content" variants={fadeInUp} transition={{ duration: 0.55, ease: 'easeOut' }}>
          <h2 className="about-section-title">Our Mission</h2>
          <div className="about-mission-grid">
            <div>
              <p className="about-text">
                At MindCare, we believe that mental health is just as important as physical health. 
                Our mission is to make mental health assessment and support accessible to everyone, 
                breaking down barriers and reducing the stigma surrounding mental health challenges.
              </p>
              <p className="about-text">
                We provide comprehensive, confidential, and evidence-based mental health assessments 
                that help individuals understand their mental wellbeing and take the first steps 
                towards getting the support they need.
              </p>
            </div>
            <motion.div className="about-inline-image about-mission-image" variants={fadeInUp} transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }} {...sectionView}>
              <img src={missionImage} alt="Therapy support session" />
            </motion.div>
          </div>
        </motion.div>
      </motion.section>

      {/* Values Section */}
      <motion.section className="about-values-section" variants={fadeInUp} transition={{ duration: 0.6, ease: 'easeOut' }} {...sectionView}>
        <div className="about-values-content">
          <h2 className="about-section-title">Our Core Values</h2>
          <div className="values-grid">
            <motion.div className="value-card" variants={fadeInUp} transition={{ duration: 0.5, delay: 0.05, ease: 'easeOut' }} {...sectionView}>
              <div className="value-icon">
                <FaHeart />
              </div>
              <h3 className="value-title">Compassion</h3>
              <p className="value-description">
                We approach mental health with empathy, understanding, and genuine care 
                for every individual's unique journey.
              </p>
            </motion.div>

            <motion.div className="value-card" variants={fadeInUp} transition={{ duration: 0.5, delay: 0.12, ease: 'easeOut' }} {...sectionView}>
              <div className="value-icon">
                <FaShieldAlt />
              </div>
              <h3 className="value-title">Confidentiality</h3>
              <p className="value-description">
                Your privacy is paramount. All assessments and data are handled with 
                the highest level of security and confidentiality.
              </p>
            </motion.div>

            <motion.div className="value-card" variants={fadeInUp} transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }} {...sectionView}>
              <div className="value-icon">
                <FaLightbulb />
              </div>
              <h3 className="value-title">Evidence-Based</h3>
              <p className="value-description">
                Our assessments are built on validated psychological research and 
                clinical best practices.
              </p>
            </motion.div>

            <motion.div className="value-card" variants={fadeInUp} transition={{ duration: 0.5, delay: 0.28, ease: 'easeOut' }} {...sectionView}>
              <div className="value-icon">
                <FaUsers />
              </div>
              <h3 className="value-title">Accessibility</h3>
              <p className="value-description">
                Mental health support should be available to everyone, regardless of 
                background or circumstances.
              </p>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* What We Offer Section */}
      <motion.section className="about-section" variants={fadeInUp} transition={{ duration: 0.6, ease: 'easeOut' }} {...sectionView}>
        <div className="about-content">
          <h2 className="about-section-title">What We Offer</h2>
          <div className="about-offer-images">
            <motion.div className="offer-image-card" variants={fadeInUp} transition={{ duration: 0.5, delay: 0.06, ease: 'easeOut' }} {...sectionView}>
              <img src={offerImageA} alt="Student taking a wellness test" />
            </motion.div>
            <motion.div className="offer-image-card" variants={fadeInUp} transition={{ duration: 0.5, delay: 0.12, ease: 'easeOut' }} {...sectionView}>
              <img src={offerImageB} alt="Person reviewing wellbeing insights" />
            </motion.div>
          </div>
          <div className="offer-grid">
            <motion.div className="offer-item" variants={fadeInUp} transition={{ duration: 0.5, delay: 0.05, ease: 'easeOut' }} {...sectionView}>
              <h3>Comprehensive Assessments</h3>
              <p>
                Take a combined mental health assessment covering stress, anxiety, depression, 
                burnout, and sleep quality, or choose specific tests based on your needs.
              </p>
            </motion.div>

            <motion.div className="offer-item" variants={fadeInUp} transition={{ duration: 0.5, delay: 0.12, ease: 'easeOut' }} {...sectionView}>
              <h3>Instant Results</h3>
              <p>
                Receive immediate, detailed feedback on your mental health status with 
                personalized insights and recommendations.
              </p>
            </motion.div>

            <motion.div className="offer-item" variants={fadeInUp} transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }} {...sectionView}>
              <h3>Resource Guidance</h3>
              <p>
                Access curated resources, coping strategies, and professional support 
                options tailored to your assessment results.
              </p>
            </motion.div>

            <motion.div className="offer-item" variants={fadeInUp} transition={{ duration: 0.5, delay: 0.28, ease: 'easeOut' }} {...sectionView}>
              <h3>Track Progress</h3>
              <p>
                Monitor your mental health journey over time with our tracking features 
                and see how you're improving.
              </p>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Important Note Section */}
      <motion.section className="about-important-section" variants={fadeInUp} transition={{ duration: 0.6, ease: 'easeOut' }} {...sectionView}>
        <div className="about-content">
          <h2 className="about-section-title about-important-title">Important Information</h2>
          <motion.div className="important-note" variants={fadeInUp} transition={{ duration: 0.55, ease: 'easeOut' }} {...sectionView}>
            <div className="important-content">
              <motion.div className="about-inline-image about-wellness-image" variants={fadeInUp} transition={{ duration: 0.5, delay: 0.06, ease: 'easeOut' }} {...sectionView}>
                <img src={wellnessImage} alt="Calm wellness sunrise" />
              </motion.div>
              <div className="important-text">
                <p>
                  <strong>MindCare is not a substitute for professional mental health care.</strong> 
                  Our assessments are designed to provide insights and guidance, but they are 
                  not diagnostic tools. If you're experiencing severe mental health symptoms, 
                  please seek immediate professional help.
                </p>
                <p>
                  In crisis? Contact the National Suicide Prevention Lifeline at 988 or 
                  text "HELLO" to 741741 for free, 24/7 support.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
}

export default About;
