import React from 'react';
import { Link } from 'react-router-dom';
import './LoadingPage.css';

const LoadingPage = () => {
  return (
    <div className="home-container">
      <div className="home-content">
        <h1>Welcome to Brain Cleaner</h1>
        <p>Your PDF to Brainrot video converter</p>
        <div className="cta-buttons">
          <Link to="/login" className="get-started-btn">
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoadingPage;
