import { useState } from 'react';
import { FaEnvelope, FaPhone, FaBuilding } from 'react-icons/fa';
import { motion } from 'framer-motion';
import contactImage from '../assets/home_images/floral5.jpg';
import './Contact.css';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME_LENGTH = 80;
const MIN_SUBJECT_LENGTH = 3;
const MAX_SUBJECT_LENGTH = 120;
const MIN_MESSAGE_LENGTH = 10;
const MAX_MESSAGE_LENGTH = 2000;

const validateContactForm = (rawData) => {
  const data = {
    name: String(rawData?.name || '').trim(),
    email: String(rawData?.email || '').trim(),
    subject: String(rawData?.subject || '').trim(),
    message: String(rawData?.message || '').trim()
  };

  const errors = {};

  if (!data.name || !data.email || !data.subject || !data.message) {
    errors._form = 'All fields are required.';
  }

  if (data.name && (data.name.length < 2 || data.name.length > MAX_NAME_LENGTH)) {
    errors.name = `Name must be between 2 and ${MAX_NAME_LENGTH} characters.`;
  }

  if (data.email && !EMAIL_REGEX.test(data.email)) {
    errors.email = 'Please enter a valid email address.';
  }

  if (data.subject && (data.subject.length < MIN_SUBJECT_LENGTH || data.subject.length > MAX_SUBJECT_LENGTH)) {
    errors.subject = `Subject must be between ${MIN_SUBJECT_LENGTH} and ${MAX_SUBJECT_LENGTH} characters.`;
  }

  if (data.message && (data.message.length < MIN_MESSAGE_LENGTH || data.message.length > MAX_MESSAGE_LENGTH)) {
    errors.message = `Message must be between ${MIN_MESSAGE_LENGTH} and ${MAX_MESSAGE_LENGTH} characters.`;
  }

  return { data, errors };
};

function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState({ type: '', message: '' });

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    if (fieldErrors[id] || fieldErrors._form) {
      const { errors } = validateContactForm({ ...formData, [id]: value });
      setFieldErrors(errors);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { data, errors } = validateContactForm(formData);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormStatus({ type: 'error', message: errors._form || 'Please fix the highlighted fields and try again.' });
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    setFormStatus({ type: '', message: '' });

    try {
      const res = await fetch('http://localhost:5000/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const raw = await res.text();
      let data = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        data = { message: raw || 'Unexpected server response.' };
      }

      if (!res.ok) {
        throw new Error(data.message || 'Failed to send message');
      }

      setFormStatus({ type: 'success', message: 'Message sent successfully. We will get back to you soon.' });
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      setFormStatus({ type: 'error', message: err.message || 'Failed to send message. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="contact-container">
      {/* Messaging Section on Top */}
      <motion.div className="contact-messaging-section" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.65, ease: 'easeOut' }}>
        <motion.div className="messaging-card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.55, ease: 'easeOut' }}>
          <h1 className="section-title">Send Us a Message</h1>
          <p className="section-subtitle">
            Have questions or need support? We're here to help you on your mental wellness journey.
          </p>
          <form className="contact-form" onSubmit={handleSubmit}>
            {formStatus.message && (
              <div className={`contact-status ${formStatus.type === 'success' ? 'contact-status-success' : 'contact-status-error'}`}>
                {formStatus.message}
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input 
                  type="text" 
                  id="name" 
                  className="form-input" 
                  placeholder="Your name"
                  minLength={2}
                  maxLength={MAX_NAME_LENGTH}
                  value={formData.name}
                  onChange={handleChange}
                  required 
                />
                {fieldErrors.name && <small className="contact-field-error">{fieldErrors.name}</small>}
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input 
                  type="email" 
                  id="email" 
                  className="form-input" 
                  placeholder="your.email@example.com"
                  maxLength={254}
                  value={formData.email}
                  onChange={handleChange}
                  required 
                />
                {fieldErrors.email && <small className="contact-field-error">{fieldErrors.email}</small>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="subject">Subject</label>
              <input 
                type="text" 
                id="subject" 
                className="form-input" 
                placeholder="How can we help?"
                  minLength={MIN_SUBJECT_LENGTH}
                  maxLength={MAX_SUBJECT_LENGTH}
                  value={formData.subject}
                  onChange={handleChange}
                required 
              />
              {fieldErrors.subject && <small className="contact-field-error">{fieldErrors.subject}</small>}
            </div>

            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea 
                id="message" 
                className="form-input form-textarea" 
                rows="6"
                placeholder="Tell us more about your inquiry..."
                  minLength={MIN_MESSAGE_LENGTH}
                  maxLength={MAX_MESSAGE_LENGTH}
                  value={formData.message}
                  onChange={handleChange}
                required
              ></textarea>
              {fieldErrors.message && <small className="contact-field-error">{fieldErrors.message}</small>}
            </div>

            <motion.button type="submit" className="btn btn-primary btn-large" whileHover={{ y: -2, scale: 1.02 }} transition={{ duration: 0.2 }} disabled={submitting}>
              {submitting ? 'Sending...' : 'Send Message'}
            </motion.button>
          </form>
        </motion.div>
      </motion.div>

      {/* Contact Information Section with Image */}
      <motion.div className="contact-info-section" variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.6, ease: 'easeOut' }}>
        <div className="info-content-wrapper">
          <motion.div className="info-image" variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6, ease: 'easeOut' }}>
            <img src={contactImage} alt="Contact us" />
          </motion.div>
          <motion.div className="info-details-wrapper" variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6, delay: 0.08, ease: 'easeOut' }}>
            <h2 className="section-title">Get in Touch</h2>
            <p className="info-intro">
              Reach out through any of these channels. We're committed to supporting 
              your mental health and wellness journey.
            </p>
            
            <div className="info-items">
              <motion.div className="info-item" variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.5, delay: 0.05, ease: 'easeOut' }}>
                <div className="info-icon"><FaEnvelope /></div>
                <div className="info-details">
                  <h4>Email</h4>
                  <p>support@mindcare.com</p>
                </div>
              </motion.div>
              
              <motion.div className="info-item" variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.5, delay: 0.12, ease: 'easeOut' }}>
                <div className="info-icon"><FaPhone /></div>
                <div className="info-details">
                  <h4>Phone</h4>
                  <p>+91 98765 43210</p>
                  <p className="hours">Mon-Sat, 9:00AM-6:00PM IST</p>
                </div>
              </motion.div>
              
              <motion.div className="info-item" variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}>
                <div className="info-icon"><FaBuilding /></div>
                <div className="info-details">
                  <h4>Office</h4>
                  <p>24 Wellness Avenue, Koramangala<br/>Bengaluru, Karnataka 560034, India</p>
                </div>
              </motion.div>
            </div>

            <motion.div className="resources-section" variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.55, delay: 0.28, ease: 'easeOut' }}>
              <h3>Crisis Resources</h3>
              <p className="resources-note">
                If you're experiencing a mental health emergency, please contact:
              </p>
              <ul className="resources-list">
                <li><strong>Tele-MANAS 14416 / 1-800-891-4416</strong> - 24x7 mental health helpline in India</li>
                <li><strong>Kiran 1800-599-0019</strong> - National mental health support hotline</li>
                <li><strong>AASRA +91 22 2754 6669</strong> - 24x7 crisis and suicide prevention support</li>
              </ul>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

export default Contact;
