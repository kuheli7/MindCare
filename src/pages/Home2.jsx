import { useEffect, useState } from 'react';
import './Home2.css';
import heroImage from '../assets/home_images/img1.jpg';

function Home2({ onStart }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showTitle, setShowTitle] = useState(false);
  const [showSlogan, setShowSlogan] = useState(false);

  useEffect(() => {
    // Image loads first
    const img = new Image();
    img.src = heroImage;
    img.onload = () => {
      setImageLoaded(true);
      // After image loads, show title
      setTimeout(() => setShowTitle(true), 300);
      // After title, show slogan
      setTimeout(() => setShowSlogan(true), 1000);
    };
  }, []);

  return (
    <div className="home2-container">
      <div className={`hero-background ${imageLoaded ? 'loaded' : ''}`}>
        <img src={heroImage} alt="Mental Health Hero" className="hero-image" />
        <div className="gradient-overlay"></div>
      </div>

      {/* Sparkles effect */}
      <div className="sparkles">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="sparkle"></div>
        ))}
      </div>

      <div className="hero-content">
        <h1 className={`hero-brand ${showTitle ? 'visible' : ''}`}>
          MindCare
        </h1>
        
        <div className={`hero-slogan ${showSlogan ? 'visible' : ''}`}>
          <span className="slogan-word word-1">Heal.</span>
          <span className="slogan-word word-2">Grow.</span>
          <span className="slogan-word word-3">Thrive.</span>
        </div>

        <button 
          className={`cta-button ${showSlogan ? 'visible' : ''}`}
          onClick={onStart}
        >
          Begin Your Journey
        </button>
      </div>
    </div>
  );
}

export default Home2;
