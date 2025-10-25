import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Login failed');
      }

      // Store token in localStorage
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));

      // Show success message
      alert(`Login Successful!\n\nWelcome ${result.user.profile?.company_name || result.user.profile?.organization_name || result.user.email}\n\nUser Type: ${result.user.user_type.toUpperCase()}\nStatus: ${result.user.status.toUpperCase()}`);

      // Redirect based on user type and status
      if (result.user.status === 'verified') {
        if (result.user.user_type === 'corporate') {
          navigate('/corporate-dashboard');
        } else if (result.user.user_type === 'ngo') {
          navigate('/ngo-dashboard');
        }
      } else {
        navigate('/pending-verification');
      }

    } catch (error) {
      console.error('Login error:', error);
      setErrors({ general: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page bg-light min-vh-100 d-flex align-items-center justify-content-center">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="border-0 shadow-lg card rounded-4">
              <div className="p-5 card-body">
                {/* Header */}
                <div className="mb-4 text-center">
                  <h2 className="mb-2 fw-bold text-primary">
                    <i className="fas fa-sign-in-alt me-2"></i>
                    Welcome Back
                  </h2>
                  <p className="text-muted">Sign in to your CSR Connect account</p>
                </div>

                {/* Error Message */}
                {errors.general && (
                  <div className="alert alert-danger" role="alert">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    {errors.general}
                  </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">
                      <i className="fas fa-envelope me-2 text-primary"></i>
                      Email Address
                    </label>
                    <input
                      type="email"
                      className={`form-control form-control-lg ${errors.email ? 'is-invalid' : ''}`}
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                      required
                    />
                    {errors.email && (
                      <div className="invalid-feedback">{errors.email}</div>
                    )}
                  </div>

                  <div className="mb-4">
                    <label htmlFor="password" className="form-label">
                      <i className="fas fa-lock me-2 text-primary"></i>
                      Password
                    </label>
                    <input
                      type="password"
                      className={`form-control form-control-lg ${errors.password ? 'is-invalid' : ''}`}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      required
                    />
                    {errors.password && (
                      <div className="invalid-feedback">{errors.password}</div>
                    )}
                  </div>

                  {/* Remember Me & Forgot Password */}
                  <div className="mb-4 d-flex justify-content-between align-items-center">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="rememberMe"
                      />
                      <label className="form-check-label" htmlFor="rememberMe">
                        Remember me
                      </label>
                    </div>
                    <a href="#" className="text-primary text-decoration-none">
                      Forgot Password?
                    </a>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="mb-3 btn btn-primary btn-lg w-100"
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
                </form>

                {/* Register Link */}
                <div className="text-center">
                  <p className="mb-0 text-muted">
                    Don't have an account?{' '}
                    <a href="/select-type" className="text-primary text-decoration-none fw-bold">
                      Register Now
                    </a>
                  </p>
                </div>

                {/* User Type Info */}
                <div className="p-3 mt-4 rounded bg-light">
                  <h6 className="mb-2 text-primary">
                    <i className="fas fa-info-circle me-2"></i>
                    Registration Types
                  </h6>
                  <div className="row">
                    <div className="col-6">
                      <small className="text-muted">
                        <i className="fas fa-building me-1"></i>
                        Corporate
                      </small>
                    </div>
                    <div className="col-6">
                      <small className="text-muted">
                        <i className="fas fa-hand-holding-heart me-1"></i>
                        NGO
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;


