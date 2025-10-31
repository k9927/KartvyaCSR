import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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

  /* Modal spinner styles copied to match NGO interface */
  .modal-overlay { position: fixed; inset: 0; background: linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.45)); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 20px; backdrop-filter: blur(4px); }
  .modal-card { width: 460px; max-width: 100%; background: linear-gradient(180deg, #ffffff 0%, #fbfbfd 100%); border-radius: 14px; padding: 28px 26px 26px; box-shadow: 0 20px 45px rgba(12,18,32,0.28); text-align: center; border: 1px solid rgba(21,28,46,0.04); }
  .modal-spinner { width: 64px; height: 64px; margin: 0 auto 10px; border-radius: 50%; border: 6px solid rgba(0,0,0,0.06); border-top-color: #3b6be0; animation: modalSpin 1s linear infinite; box-shadow: 0 6px 18px rgba(59,107,224,0.12), inset 0 -6px 12px rgba(59,107,224,0.03); }
  @keyframes modalSpin { to { transform: rotate(360deg); } }
  .modal-title { font-size: 1.25rem; font-weight: 700; color: #1b2430; margin: 6px 0 6px; }
  .modal-desc { color: #6b7280; margin-bottom: 8px; font-size: 0.98rem; }
  .modal-status-icon { font-size: 56px; line-height: 1; margin-bottom: 8px; }
  .modal-status-card { margin: 0 auto 8px; padding: 12px 14px; border-radius: 10px; max-width: 90%; font-weight: 600; }
  .modal-success { background: #e9fff2; color: #0f6b3c; border: 1px solid rgba(40,167,69,0.08); }
  .modal-error { background: #fff0f0; color: #7a1a1a; border: 1px solid rgba(218,77,87,0.06); }
  .btn-modal { padding: 0.62rem 1.15rem; min-width: 120px; border-radius: 999px; border: none; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; font-size: 1rem; font-weight: 700; line-height: 1; box-shadow: 0 8px 20px rgba(12,18,32,0.06); }
  .btn-close { background: linear-gradient(180deg,#eef0f2 0%, #e0e4e7 100%); color: #26303a; }
`;

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalStatus, setModalStatus] = useState('processing'); // 'processing' | 'success' | 'error'
  const [modalMessage, setModalMessage] = useState('Signing you in. Please wait...');

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setIsLoading(true);
      setShowModal(true);
      setModalStatus('processing');
      setModalMessage('Authenticating your credentials...');
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const result = await response.json();
      if (!response.ok || result.success === false) {
        throw new Error(result.message || 'Login failed');
      }
      const payload = result.data || result; // support both shapes
      const user = payload.user;
      const token = payload.token;
      const refreshToken = payload.refreshToken;

      if (!user || !token) throw new Error('Invalid login response');

      localStorage.setItem('token', token);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));

      const userType = user.user_type;
      setModalStatus('success');
      setModalMessage('Login successful. Redirecting to your dashboard...');
      if (userType === 'corporate') {
        setTimeout(() => navigate('/corporate-dashboard'), 800);
      } else if (userType === 'ngo') {
        setTimeout(() => navigate('/ngo-dashboard'), 800);
      } else {
        setTimeout(() => navigate('/'), 800);
      }
    } catch (err) {
      setErrors(prev => ({ ...prev, general: err.message }));
      setModalStatus('error');
      setModalMessage(err.message || 'Login failed. Please try again.');
    }
    finally {
      setIsLoading(false);
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
            <div className="border-0 shadow-lg card rounded-4">
              <div className="p-4 card-body">
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
                    className="mb-4 btn btn-primary-enhanced btn-enhanced w-100"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Signing In...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-sign-in-alt me-2"></i>
                        Sign In
                      </>
                    )}
                  </button>

                  {showModal && (
                    <div className="modal-overlay" role="dialog" aria-modal="true" aria-live="assertive">
                      <div className="modal-card">
                        {modalStatus === 'processing' && (
                          <>
                            <div className="modal-spinner" aria-hidden="true" style={{ marginBottom: '15px' }}></div>
                            <div className="modal-title">Signing In</div>
                            <div className="modal-desc">{modalMessage}</div>
                          </>
                        )}

                        {modalStatus === 'success' && (
                          <>
                            <i className="fas fa-check-circle modal-status-icon" style={{ color: '#28a745' }}></i>
                            <div className="modal-status-card modal-success">Login Successful</div>
                            <div className="modal-desc">{modalMessage}</div>
                          </>
                        )}

                        {modalStatus === 'error' && (
                          <>
                            <i className="fas fa-times-circle modal-status-icon" style={{ color: '#dc3545' }}></i>
                            <div className="modal-status-card modal-error">Login Failed</div>
                            <div className="modal-desc">{modalMessage}</div>
                            <div className="mt-2">
                              <button type="button" className="btn-modal btn-close" onClick={() => setShowModal(false)}>
                                <i className="fas fa-times"></i>
                                Close
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

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
