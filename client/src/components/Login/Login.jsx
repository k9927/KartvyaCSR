import React, { useState } from "react";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import Navbar from '../Navbar';

// Add custom styles to match the website theme
const styles = `
  .login-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 1rem;
    padding: 2rem;
    margin-bottom: 2rem;
    color: white;
    text-align: center;
  }

  .login-header h2 {
    color: white;
    margin-bottom: 0.5rem;
    font-weight: 600;
  }

  .login-header .subtitle {
    opacity: 0.9;
    font-size: 1.1rem;
    margin-bottom: 0;
  }

  .login-form-section {
    background: white;
    border-radius: 1rem;
    padding: 2rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    border: 1px solid #e9ecef;
  }

  .form-group-enhanced {
    margin-bottom: 1.5rem;
  }

  .form-group-enhanced .form-label {
    font-weight: 600;
    color: #495057;
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .form-group-enhanced .form-label i {
    color: #667eea;
    font-size: 0.9rem;
  }

  .form-control-enhanced {
    border: 2px solid #e9ecef;
    border-radius: 0.75rem;
    padding: 0.75rem 1rem;
    transition: all 0.3s ease;
    background: #f8f9fa;
    font-size: 1rem;
  }

  .form-control-enhanced:focus {
    border-color: #667eea;
    box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
    background: white;
  }

  .form-control-enhanced.is-invalid {
    border-color: #dc3545;
    box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
  }

  .form-check-enhanced {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .form-check-enhanced .form-check-input {
    width: 1.2rem;
    height: 1.2rem;
    margin: 0;
    border: 2px solid #667eea;
    border-radius: 0.25rem;
  }

  .form-check-enhanced .form-check-input:checked {
    background-color: #667eea;
    border-color: #667eea;
  }

  .form-check-enhanced .form-check-label {
    color: #495057;
    font-weight: 500;
    cursor: pointer;
  }

  .forgot-password-link {
    color: #667eea;
    text-decoration: none;
    font-weight: 500;
    transition: all 0.3s ease;
  }

  .forgot-password-link:hover {
    color: #5a6fd8;
    text-decoration: underline;
  }

  .btn-enhanced {
    border-radius: 2rem;
    padding: 0.75rem 2rem;
    font-weight: 500;
    transition: all 0.3s ease;
    border: none;
    font-size: 1rem;
  }

  .btn-enhanced:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  }

  .btn-primary-enhanced {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  .btn-primary-enhanced:hover {
    background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
    color: white;
  }

  .register-section {
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border-radius: 1rem;
    padding: 1.5rem;
    text-align: center;
    border: 1px solid #dee2e6;
  }

  .register-section p {
    margin-bottom: 0;
    color: #495057;
    font-weight: 500;
  }

  .register-link {
    color: #667eea;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.3s ease;
  }

  .register-link:hover {
    color: #5a6fd8;
    text-decoration: underline;
  }

  .divider {
    display: flex;
    align-items: center;
    margin: 2rem 0;
    color: #6c757d;
  }

  .divider::before,
  .divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #dee2e6;
  }

  .divider span {
    padding: 0 1rem;
    font-size: 0.9rem;
    font-weight: 500;
  }
`;

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // TODO: Replace with Firebase authentication logic
      console.log("Login attempt:", { email, password, remember });
    }
  };

  const handleInputChange = (field, value) => {
    if (field === 'email') setEmail(value);
    if (field === 'password') setPassword(value);
    if (field === 'remember') setRemember(value);
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="auth-page bg-light min-vh-100 d-flex flex-column">
        <Navbar />

        {/* Login Section */}
        <div className="flex-grow-1 d-flex align-items-center justify-content-center" style={{ paddingTop: '80px' }}>
          <div className="col-md-6 col-lg-5">
            <div className="card border-0 shadow-lg rounded-4">
              <div className="card-body p-4">
                {/* Login Header */}
                <div className="login-header">
                  <h2><i className="fas fa-sign-in-alt me-2"></i>Welcome Back</h2>
                  <p className="subtitle">Sign in to your account to continue</p>
                </div>

                <form onSubmit={handleSubmit}>
                  {/* Login Form Section */}
                  <div className="login-form-section">
                    {/* Email */}
                    <div className="form-group-enhanced">
                      <label htmlFor="email" className="form-label">
                        <i className="fas fa-envelope"></i>
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        className={`form-control-enhanced ${errors.email ? 'is-invalid' : ''}`}
                        value={email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="Enter your email address"
                        required
                      />
                      {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                    </div>

                    {/* Password */}
                    <div className="form-group-enhanced">
                      <label htmlFor="password" className="form-label">
                        <i className="fas fa-lock"></i>
                        Password
                      </label>
                      <input
                        type="password"
                        id="password"
                        className={`form-control-enhanced ${errors.password ? 'is-invalid' : ''}`}
                        value={password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        placeholder="Enter your password"
                        required
                      />
                      {errors.password && <div className="invalid-feedback">{errors.password}</div>}
                    </div>

                    {/* Remember me + Forgot password */}
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="form-check-enhanced">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="remember"
                          checked={remember}
                          onChange={(e) => handleInputChange('remember', e.target.checked)}
                        />
                        <label htmlFor="remember" className="form-check-label">
                          Remember me
                        </label>
                      </div>
                      <a href="/forgot-password" className="forgot-password-link">
                        <i className="fas fa-key me-1"></i>
                        Forgot Password?
                      </a>
                    </div>
                  </div>

                  {/* Login Button */}
                  <button
                    type="submit"
                    className="btn btn-primary-enhanced btn-enhanced w-100 mb-4"
                  >
                    <i className="fas fa-sign-in-alt me-2"></i>
                    Sign In
                  </button>

                  {/* Divider */}
                  <div className="divider">
                    <span>or</span>
                  </div>

                  {/* Register Link */}
                  <div className="register-section">
                    <p>
                      <i className="fas fa-user-plus me-2"></i>
                      Don't have an account?{" "}
                      <Link to="/SelectType" className="register-link">
                        Register Now
                      </Link>
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
