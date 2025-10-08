import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import Navbar from './Navbar';

// Enhanced styling for the SelectType component
const styles = `
  /* Enhanced Navigation */
  .navbar-enhanced {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(102, 126, 234, 0.1);
    transition: all 0.3s ease;
  }

  .brand-gradient {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-weight: 700;
  }

  /* Main Container */
  .select-type-container {
    min-height: 100vh;
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    position: relative;
    overflow: hidden;
  }

  .select-type-container::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="%23667eea" opacity="0.05"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
    pointer-events: none;
  }

  .content-wrapper {
    position: relative;
    z-index: 2;
  }

  /* Header Section */
  .header-section {
    text-align: center;
    margin-bottom: 4rem;
    padding: 2rem 0;
  }

  .main-title {
    font-size: 3rem;
    font-weight: 700;
    background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 1rem;
  }

  .subtitle {
    font-size: 1.2rem;
    color: #6c757d;
    max-width: 600px;
    margin: 0 auto;
    font-weight: 500;
  }

  /* Card Styling */
  .type-card {
    background: white;
    border-radius: 1.5rem;
    padding: 3rem 2rem;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(102, 126, 234, 0.1);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    height: 100%;
  }

  .type-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    transform: scaleX(0);
    transition: transform 0.3s ease;
  }

  .type-card:hover {
    transform: translateY(-8px);
  }

  .type-card:hover::before {
    transform: scaleX(1);
  }

  .type-card.ngo-card:hover {
    box-shadow: 0 20px 60px rgba(40, 167, 69, 0.2);
  }

  .type-card.corporate-card:hover {
    box-shadow: 0 20px 60px rgba(102, 126, 234, 0.2);
  }

  /* Card Header */
  .card-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .card-icon {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1.5rem;
    font-size: 2rem;
    color: white;
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .ngo-icon {
    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  }

  .corporate-icon {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  .type-card:hover .card-icon {
    transform: scale(1.05);
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .card-title {
    font-size: 1.75rem;
    font-weight: 700;
    color: #2c3e50;
    margin-bottom: 0.5rem;
  }

  .card-description {
    color: #6c757d;
    font-size: 1rem;
    line-height: 1.6;
  }

  /* Features List */
  .features-list {
    list-style: none;
    padding: 0;
    margin: 2rem 0;
  }

  .feature-item {
    display: flex;
    align-items: center;
    padding: 0.75rem 0;
    color: #495057;
    font-weight: 500;
    transition: all 0.3s ease;
  }

  .feature-item:hover {
    color: #667eea;
    transform: translateX(3px);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .feature-icon {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 1rem;
    font-size: 0.75rem;
    color: white;
    flex-shrink: 0;
  }

  .ngo-card .feature-icon {
    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  }

  /* Button Styling */
  .btn-enhanced {
    border-radius: 2rem;
    padding: 1rem 2rem;
    font-weight: 600;
    font-size: 1.1rem;
    transition: all 0.3s ease;
    border: none;
    text-decoration: none;
    display: inline-block;
    width: 100%;
    text-align: center;
  }

  .btn-ngo {
    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
    color: white;
  }

  .btn-ngo:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 30px rgba(40, 167, 69, 0.4);
    color: white;
    text-decoration: none;
  }

  .btn-corporate {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  .btn-corporate:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
    color: white;
    text-decoration: none;
  }

  /* Login Section */
  .login-section {
    text-align: center;
    margin-top: 3rem;
    padding: 2rem;
    background: white;
    border-radius: 1.5rem;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(102, 126, 234, 0.1);
  }

  .login-text {
    color: #6c757d;
    font-size: 1.1rem;
    margin-bottom: 0;
  }

  .login-link {
    color: #667eea;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.3s ease;
  }

  .login-link:hover {
    color: #764ba2;
    text-decoration: none;
  }

  /* Animations */
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fade-in-up {
    animation: fadeInUp 0.6s ease-out;
  }

  .type-card:hover {
    box-shadow: 0 20px 60px rgba(102, 126, 234, 0.2);
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .main-title {
      font-size: 2.5rem;
    }
    
    .type-card {
      padding: 2rem 1.5rem;
    }
    
    .card-icon {
      width: 60px;
      height: 60px;
      font-size: 1.5rem;
    }
  }
`;

const SelectType = () => {
  const navigate = useNavigate();

  return (
    <>
      <style>{styles}</style>
      <div className="select-type-container">
        <Navbar />

        <div className="content-wrapper py-5">
          <div className="container">
            {/* Header Section */}
            <div className="header-section animate-fade-in-up">
              <h1 className="main-title">
                <i className="fas fa-users me-3"></i>
                Choose Your Registration Type
              </h1>
              <p className="subtitle">
                Join our platform and make a difference. Select the option that best describes your organization.
              </p>
            </div>

            {/* Cards Section */}
            <div className="row g-4 justify-content-center">
              {/* NGO Card */}
              <div className="col-lg-5 col-md-6">
                <div className="type-card ngo-card animate-fade-in-up">
                  <div className="card-header">
                    <div className="card-icon ngo-icon">
                      <i className="fas fa-hands-helping"></i>
                    </div>
                    <h3 className="card-title">I'm an NGO</h3>
                    <p className="card-description">
                      Register your organization and connect with corporate partners to amplify your social impact
                    </p>
                  </div>

                  <ul className="features-list">
                    <li className="feature-item">
                      <div className="feature-icon">
                        <i className="fas fa-check"></i>
                      </div>
                      <span>List your projects and initiatives</span>
                    </li>
                    <li className="feature-item">
                      <div className="feature-icon">
                        <i className="fas fa-check"></i>
                      </div>
                      <span>Receive CSR funding from corporates</span>
                    </li>
                    <li className="feature-item">
                      <div className="feature-icon">
                        <i className="fas fa-check"></i>
                      </div>
                      <span>Track project progress in real-time</span>
                    </li>
                    <li className="feature-item">
                      <div className="feature-icon">
                        <i className="fas fa-check"></i>
                      </div>
                      <span>Generate comprehensive impact reports</span>
                    </li>
                    <li className="feature-item">
                      <div className="feature-icon">
                        <i className="fas fa-check"></i>
                      </div>
                      <span>Access verified corporate partners</span>
                    </li>
                  </ul>

                  <button 
                    className="btn btn-enhanced btn-ngo"
                    onClick={() => navigate('/NGORegister')}
                  >
                    <i className="fas fa-rocket me-2"></i>
                    Register as NGO
                  </button>
                </div>
              </div>

              {/* Corporate Card */}
              <div className="col-lg-5 col-md-6">
                <div className="type-card corporate-card animate-fade-in-up">
                  <div className="card-header">
                    <div className="card-icon corporate-icon">
                      <i className="fas fa-building"></i>
                    </div>
                    <h3 className="card-title">I'm a Corporate</h3>
                    <p className="card-description">
                      Find and fund impactful CSR projects while ensuring transparency and measurable outcomes
                    </p>
                  </div>

                  <ul className="features-list">
                    <li className="feature-item">
                      <div className="feature-icon">
                        <i className="fas fa-check"></i>
                      </div>
                      <span>Discover verified NGOs and projects</span>
                    </li>
                    <li className="feature-item">
                      <div className="feature-icon">
                        <i className="fas fa-check"></i>
                      </div>
                      <span>Monitor fund utilization in real-time</span>
                    </li>
                    <li className="feature-item">
                      <div className="feature-icon">
                        <i className="fas fa-check"></i>
                      </div>
                      <span>Get detailed progress reports</span>
                    </li>
                    <li className="feature-item">
                      <div className="feature-icon">
                        <i className="fas fa-check"></i>
                      </div>
                      <span>Measure social impact metrics</span>
                    </li>
                    <li className="feature-item">
                      <div className="feature-icon">
                        <i className="fas fa-check"></i>
                      </div>
                      <span>Ensure compliance with CSR regulations</span>
                    </li>
                  </ul>

                  <button 
                    className="btn btn-enhanced btn-corporate"
                    onClick={() => navigate('/CorporateRegister')}
                  >
                    <i className="fas fa-chart-line me-2"></i>
                    Register as Corporate
                  </button>
                </div>
              </div>
            </div>

            {/* Login Section */}
            <div className="login-section animate-fade-in-up">
              <p className="login-text">
                <i className="fas fa-user-circle me-2"></i>
                Already have an account?{' '}
                <Link to="/login" className="login-link">
                  Login here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SelectType;