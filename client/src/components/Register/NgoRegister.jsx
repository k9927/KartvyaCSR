import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import Navbar from '../Navbar';

// Add custom styles for password strength and validation
const styles = `
  .password-strength-container {
    margin-top: 0.75rem;
  }

  .password-strength-bar {
    width: 100%;
    height: 6px;
    background-color: #e9ecef;
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 0.5rem;
    position: relative;
  }

  .password-strength-fill {
    height: 100%;
    border-radius: 3px;
    transition: all 0.3s ease;
    position: relative;
  }

  .password-strength-fill.weak {
    width: 25%;
    background: linear-gradient(90deg, #dc3545, #ff6b6b);
  }

  .password-strength-fill.fair {
    width: 50%;
    background: linear-gradient(90deg, #fd7e14, #ffa726);
  }

  .password-strength-fill.good {
    width: 75%;
    background: linear-gradient(90deg, #ffc107, #ffeb3b);
  }

  .password-strength-fill.strong {
    width: 100%;
    background: linear-gradient(90deg, #28a745, #4caf50);
  }

  .password-strength-text {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .password-strength-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .password-strength-label.weak {
    color: #dc3545;
  }

  .password-strength-label.fair {
    color: #fd7e14;
  }

  .password-strength-label.good {
    color: #ffc107;
  }

  .password-strength-label.strong {
    color: #28a745;
  }

  .password-strength-icon {
    font-size: 0.75rem;
  }
  
  .form-control.is-invalid,
  .form-select.is-invalid {
    border-color: #dc3545;
    box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
  }
  
  .invalid-feedback {
    display: block;
    color: #dc3545;
    font-size: 0.875rem;
    margin-top: 0.25rem;
  }

  /* Verification Step Styling */
  .verification-step {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 1rem;
    padding: 2rem;
    margin-bottom: 2rem;
    color: white;
    text-align: center;
  }

  .verification-step h3 {
    color: white;
    margin-bottom: 1rem;
    font-weight: 600;
  }

  .verification-step .subtitle {
    opacity: 0.9;
    font-size: 1.1rem;
    margin-bottom: 0;
  }

  .file-upload-card {
    background: white;
    border: 2px dashed #e9ecef;
    border-radius: 1rem;
    padding: 2rem;
    text-align: center;
    transition: all 0.3s ease;
    margin-bottom: 1.5rem;
    position: relative;
    overflow: hidden;
  }

  .file-upload-card:hover {
    border-color: #667eea;
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.15);
    transform: translateY(-2px);
  }

  .file-upload-card.has-file {
    border-color: #28a745;
    background: linear-gradient(135deg, #f8fff9 0%, #e8f5e8 100%);
  }

  .file-upload-icon {
    font-size: 3rem;
    color: #667eea;
    margin-bottom: 1rem;
  }

  .file-upload-card.has-file .file-upload-icon {
    color: #28a745;
  }

  .file-upload-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #333;
    margin-bottom: 0.5rem;
  }

  .file-upload-subtitle {
    color: #6c757d;
    font-size: 0.9rem;
    margin-bottom: 1.5rem;
  }

  .file-input-wrapper {
    position: relative;
    display: inline-block;
  }

  .file-input-wrapper input[type="file"] {
    position: absolute;
    opacity: 0;
    width: 100%;
    height: 100%;
    cursor: pointer;
  }

  .file-upload-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 0.75rem 2rem;
    border-radius: 2rem;
    font-weight: 500;
    transition: all 0.3s ease;
    cursor: pointer;
  }

  .file-upload-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  }

  .file-status {
    margin-top: 1rem;
    padding: 0.75rem;
    border-radius: 0.5rem;
    font-weight: 500;
  }

  .file-status.success {
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  }

  .file-status.error {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  }

  .terms-card {
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border: 1px solid #dee2e6;
    border-radius: 1rem;
    padding: 2rem;
    margin-top: 1rem;
  }

  .terms-card .form-check {
    margin: 0;
  }

  .terms-card .form-check-input {
    width: 1.5rem;
    height: 1.5rem;
    margin-right: 1rem;
  }

  .terms-card .form-check-label {
    font-size: 1rem;
    line-height: 1.6;
    color: #495057;
  }

  .terms-card .form-check-label a {
    color: #667eea;
    text-decoration: none;
    font-weight: 500;
  }

  .terms-card .form-check-label a:hover {
    text-decoration: underline;
  }

  .verification-progress {
    display: flex;
    justify-content: space-between;
    margin-bottom: 2rem;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 1rem;
  }

  .progress-item {
    display: flex;
    align-items: center;
    flex-direction: column;
    text-align: center;
  }

  .progress-icon {
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 0.5rem;
    font-size: 1.2rem;
    color: white;
    background: #6c757d;
    transition: all 0.3s ease;
  }

  .progress-item.completed .progress-icon {
    background: #28a745;
  }

  .progress-item.current .progress-icon {
    background: #667eea;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }

  .progress-label {
    font-size: 0.875rem;
    color: #6c757d;
    font-weight: 500;
  }

  .progress-item.completed .progress-label,
  .progress-item.current .progress-label {
    color: #333;
    font-weight: 600;
  }

  /* Step 1 & 2 Styling */
  .step-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 1rem;
    padding: 2rem;
    margin-bottom: 2rem;
    color: white;
    text-align: center;
  }

  .step-header h3 {
    color: white;
    margin-bottom: 1rem;
    font-weight: 600;
  }

  .step-header .subtitle {
    opacity: 0.9;
    font-size: 1.1rem;
    margin-bottom: 0;
  }

  .form-section {
    background: white;
    border-radius: 1rem;
    padding: 2rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    border: 1px solid #e9ecef;
  }

  .form-section-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #333;
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .form-section-title i {
    color: #667eea;
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

  .form-select-enhanced {
    border: 2px solid #e9ecef;
    border-radius: 0.75rem;
    padding: 0.75rem 1rem;
    transition: all 0.3s ease;
    background: #f8f9fa;
  }

  .form-select-enhanced:focus {
    border-color: #667eea;
    box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
    background: white;
  }

  .form-select-enhanced.is-invalid {
    border-color: #dc3545;
    box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
  }

  .address-section {
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border-radius: 1rem;
    padding: 1.5rem;
    margin-top: 1rem;
  }

  .address-section .form-label {
    color: #495057;
    font-weight: 600;
  }

  .password-section {
    background: linear-gradient(135deg, #f8fff9 0%, #e8f5e8 100%);
    border-radius: 1rem;
    padding: 1.5rem;
    border: 1px solid #d4edda;
  }

  .password-section .form-label {
    color: #155724;
    font-weight: 600;
  }

  .action-buttons {
    background: white;
    border-radius: 1rem;
    padding: 1.5rem;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    border: 1px solid #e9ecef;
  }

  .btn-enhanced {
    border-radius: 2rem;
    padding: 0.75rem 2rem;
    font-weight: 500;
    transition: all 0.3s ease;
    border: none;
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

  .btn-outline-enhanced {
    background: white;
    color: #667eea;
    border: 2px solid #667eea;
  }

  .btn-outline-enhanced:hover {
    background: #667eea;
    color: white;
  }
`;


export default function NGORegistration() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState({ level: 'none', score: 0, requirements: [] });

  // Validation Rules
  const validationRules = {
    panNumber: {
      validate: (value) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value.trim().toUpperCase()),
      message: 'Please enter a valid PAN number (e.g., ABCDE1234F)'
    },
    email: {
      validate: (value) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value),
      message: 'Please enter a valid email address'
    },
    pincode: {
      validate: (value) => /^\d{6}$/.test(value),
      message: 'Please enter a valid 6-digit PIN code'
    },
    city: {
      validate: (value) => /^[A-Za-z\s\-.']+$/.test(value),
      message: 'Please enter a valid city name'
    },
    state: {
      validate: (value) => /^[A-Za-z\s\-.']+$/.test(value),
      message: 'Please enter a valid state name'
    },
    phone: {
      validate: (value) => /^[6-9]\d{9}$/.test(value),
      message: 'Please enter a valid 10-digit phone number'
    },
    password: {
      validate: (value) => value.length >= 6,
      message: 'Password must be at least 6 characters long'
    },
    orgName: {
      validate: (value) => /^[A-Za-z0-9\s\-&.',()]+$/.test(value),
      message: 'Please enter a valid organization name'
    },
    address: {
      validate: (value) => value.length >= 10 && /^[A-Za-z0-9\s\-.,#/\\&'()]+$/.test(value),
      message: 'Address must be at least 10 characters long'
    },
    establishmentYear: {
      validate: (value) => /^(19\d{2}|20[0-2]\d)$/.test(value),
      message: `Enter valid year (1900-${new Date().getFullYear()})`
    },
    description: {
      validate: (value) => value.trim().length >= 30 && value.trim().split(/\s+/).length > 1,
      message: 'Description must be ≥ 30 chars and more than one word'
    },
    focusArea: {
      validate: (value) => value !== '',
      message: 'Please select a focus area'
    },
    ngoImage: {
      validate: (file) => {
        if (!file) return false;
        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        
        if (file.size > maxSize) {
          return { valid: false, message: 'Please upload a file smaller than 5MB' };
        }
        if (!allowedTypes.includes(file.type)) {
          return { valid: false, message: 'Only PDF, JPG and PNG formats are allowed' };
        }
        return { valid: true };
      },
      message: 'Please upload a valid NGO image (PDF, JPG or PNG, max 5MB)'
    },
    FCRACert: {
      validate: (file) => {
        if (!file) return false;
        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        
        if (file.size > maxSize) {
          return { valid: false, message: 'Please upload a file smaller than 5MB' };
        }
        if (!allowedTypes.includes(file.type)) {
          return { valid: false, message: 'Only PDF, JPG and PNG formats are allowed' };
        }
        return { valid: true };
      },
      message: 'Please upload a valid FCRA Certificate (PDF, JPG or PNG, max 5MB)'
    },
    '80gCert': {
      validate: (file) => {
        if (!file) return false;
        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        
        if (file.size > maxSize) {
          return { valid: false, message: 'Please upload a file smaller than 5MB' };
        }
        if (!allowedTypes.includes(file.type)) {
          return { valid: false, message: 'Only PDF, JPG and PNG formats are allowed' };
        }
        return { valid: true };
      },
      message: 'Please upload a valid 80G Certificate (PDF, JPG or PNG, max 5MB)'
    },
    '16ACert': {
      validate: (file) => {
        if (!file) return false;
        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        
        if (file.size > maxSize) {
          return { valid: false, message: 'Please upload a file smaller than 5MB' };
        }
        if (!allowedTypes.includes(file.type)) {
          return { valid: false, message: 'Only PDF, JPG and PNG formats are allowed' };
        }
        return { valid: true };
      },
      message: 'Please upload a valid 16A Certificate (PDF, JPG or PNG, max 5MB)'
    },
    TrustDeedCert: {
      validate: (file) => {
        if (!file) return false;
        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        
        if (file.size > maxSize) {
          return { valid: false, message: 'Please upload a file smaller than 5MB' };
        }
        if (!allowedTypes.includes(file.type)) {
          return { valid: false, message: 'Only PDF, JPG and PNG formats are allowed' };
        }
        return { valid: true };
      },
      message: 'Please upload a valid Trust Deed Certificate (PDF, JPG or PNG, max 5MB)'
    }
  };

  const showError = (message) => {
    alert(message); // You can replace this with a proper toast/notification library
  };

  const checkPasswordStrength = (password) => {
    if (!password) return { level: 'none', score: 0, requirements: [] };
    
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    const length = password.length;
    const hasMinLength = length >= 8;
    const hasGoodLength = length >= 12;

    const requirements = [
      { met: hasLower, text: 'Lowercase letter' },
      { met: hasUpper, text: 'Uppercase letter' },
      { met: hasNumber, text: 'Number' },
      { met: hasSpecial, text: 'Special character' },
      { met: hasMinLength, text: 'At least 8 characters' }
    ];

    const score = requirements.filter(req => req.met).length;
    
    let level;
    if (score <= 1) level = 'weak';
    else if (score <= 2) level = 'fair';
    else if (score <= 3) level = 'good';
    else level = 'strong';

    return { level, score, requirements };
  };

  const validateField = (name, value) => {
    const rule = validationRules[name];
    if (!rule) return true;

    if (name === 'ngoImage' || name === 'FCRACert' || name === '80gCert' || name === '16ACert' || name === 'TrustDeedCert') {
      const result = rule.validate(value);
      if (typeof result === 'object') {
        return result.valid;
      }
      return result;
    }

    return rule.validate(value);
  };

  const validateStep = (stepNumber) => {
    const newErrors = {};
    let isValid = true;

    switch (stepNumber) {
      case 1:
        const step1Fields = ['orgName', 'panNumber', 'email', 'phone', 'password'];
        step1Fields.forEach(field => {
          const value = formData[field];
      if (!value) {
            newErrors[field] = validationRules[field]?.message || `Please enter your ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`;
        isValid = false;
          } else if (!validateField(field, value)) {
            newErrors[field] = validationRules[field]?.message;
        isValid = false;
      }
    });
        break;

      case 2:
        const step2Fields = ['description', 'establishmentYear', 'focusArea', 'address', 'city', 'state', 'pincode'];
        step2Fields.forEach(field => {
          const value = formData[field];
          if (!value) {
            newErrors[field] = validationRules[field]?.message || `Please enter your ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`;
            isValid = false;
          } else if (!validateField(field, value)) {
            newErrors[field] = validationRules[field]?.message;
            isValid = false;
          }
        });
        break;

      case 3:
        const step3Fields = ['ngoImage', 'FCRACert', '80gCert', '16ACert', 'TrustDeedCert'];
        step3Fields.forEach(field => {
          const value = formData[field];
          if (!value) {
            newErrors[field] = validationRules[field]?.message;
            isValid = false;
          } else {
            const result = validationRules[field].validate(value);
            if (typeof result === 'object' && !result.valid) {
              newErrors[field] = result.message;
              isValid = false;
            } else if (typeof result === 'boolean' && !result) {
              newErrors[field] = validationRules[field].message;
              isValid = false;
            }
          }
        });

        if (!formData.terms) {
          newErrors.terms = 'Please accept the terms and conditions';
          isValid = false;
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    
    setFormData({
      ...formData,
      [name]: newValue,
    });

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Update password strength
    if (name === 'password') {
      setPasswordStrength(checkPasswordStrength(newValue));
    }
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const file = files[0];
    
    if (file) {
      const result = validationRules[name]?.validate(file);
      if (typeof result === 'object' && !result.valid) {
        showError(result.message);
        e.target.value = '';
        return;
      }
    }
    
    setFormData({ ...formData, [name]: file });
    
    // Clear error when file is selected
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep((prev) => prev + 1);
    }
  };

  const prevStep = () => setStep((prev) => prev - 1);

  const skipToVerification = () => {
    setStep(3);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all steps before submission
    let isValid = true;
    for (let i = 1; i <= 3; i++) {
      if (!validateStep(i)) {
        isValid = false;
        setStep(i);
        return;
      }
    }

    if (isValid) {
      try {
        const formDataToSend = new FormData();
        
        // Append all form data
        Object.keys(formData).forEach(key => {
          if (formData[key] instanceof File) {
            formDataToSend.append(key, formData[key]);
          } else if (Array.isArray(formData[key])) {
            formData[key].forEach(value => formDataToSend.append(key, value));
          } else {
            formDataToSend.append(key, formData[key]);
          }
        });

        // Show loading state
        console.log('Submitting registration...');

        // Send the form data to your server
        const response = await fetch('http://localhost:5000/api/ngo/register', {
          method: 'POST',
          body: formDataToSend,
        });

        const result = await response.json();
        console.log('Registration response:', result);

        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Server returned an error');
        }

        // Store JWT token for future API calls
        if (result.data && result.data.token) {
          localStorage.setItem('token', result.data.token);
          localStorage.setItem('refreshToken', result.data.refreshToken);
          localStorage.setItem('user', JSON.stringify(result.data.user));
        }
        
        // Success message
        alert('🎉 Registration Successful! Your account is under review. Redirecting to dashboard...');
        
        // Redirect to NGO dashboard
        window.location.href = '/ngo-dashboard';
        
      } catch (error) {
        console.error('Error during form submission:', error);
        alert(`Registration Failed: ${error.message || 'Please try again later.'}`);
      }
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="auth-page bg-light min-vh-100 d-flex flex-column">
        <Navbar />

        {/* Registration Section */}
        <div className="flex-grow-1 d-flex align-items-center justify-content-center" style={{ paddingTop: '80px' }}>
            <div className="col-lg-8">
            <div className="border-0 shadow-lg card rounded-4">
                <div className="p-4 card-body">


                  <form onSubmit={handleSubmit}>
                    {/* Step 1 */}
                    {step === 1 && (
                    <>
                      {/* Step Header */}
                      <div className="step-header">
                        <h3><i className="fas fa-building me-2"></i>Basic Information</h3>
                        <p className="subtitle">Please provide your organization's basic information to get started</p>
                      </div>

                      {/* Organization Details Section */}
                      <div className="form-section">
                        <div className="form-section-title">
                          <i className="fas fa-info-circle"></i>
                          Basic Organization Details
                        </div>
                        <div className="row g-4">
                          <div className="col-md-6">
                            <div className="form-group-enhanced">
                              <label className="form-label">
                                <i className="fas fa-building"></i>
                                Organization Name*
                              </label>
                        <input
                          type="text"
                                className={`form-control-enhanced ${errors.orgName ? 'is-invalid' : ''}`}
                          name="orgName"
                                value={formData.orgName || ''}
                          onChange={handleChange}
                                placeholder="Enter your organization name"
                          required
                        />
                              {errors.orgName && <div className="invalid-feedback">{errors.orgName}</div>}
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-group-enhanced">
                              <label className="form-label">
                                <i className="fas fa-id-card"></i>
                                PAN Number*
                              </label>
                        <input
                          type="text"
                                className={`form-control-enhanced ${errors.panNumber ? 'is-invalid' : ''}`}
                          name="panNumber"
                                value={formData.panNumber || ''}
                          onChange={handleChange}
                                placeholder="Enter PAN number"
                          required
                        />
                              {errors.panNumber && <div className="invalid-feedback">{errors.panNumber}</div>}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Contact Information Section */}
                      <div className="form-section">
                        <div className="form-section-title">
                          <i className="fas fa-address-book"></i>
                          Contact Information
                        </div>
                        <div className="row g-4">
                          <div className="col-md-6">
                            <div className="form-group-enhanced">
                              <label className="form-label">
                                <i className="fas fa-envelope"></i>
                                Email Address*
                              </label>
                        <input
                          type="email"
                                className={`form-control-enhanced ${errors.email ? 'is-invalid' : ''}`}
                          name="email"
                                value={formData.email || ''}
                          onChange={handleChange}
                                placeholder="Enter email address"
                          required
                        />
                              {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-group-enhanced">
                              <label className="form-label">
                                <i className="fas fa-phone"></i>
                                Contact Number*
                              </label>
                        <input
                          type="tel"
                                className={`form-control-enhanced ${errors.phone ? 'is-invalid' : ''}`}
                          name="phone"
                                value={formData.phone || ''}
                          onChange={handleChange}
                                placeholder="Enter contact number"
                          required
                        />
                              {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Password Section */}
                      <div className="form-section">
                        <div className="form-section-title">
                          <i className="fas fa-lock"></i>
                          Account Security
                        </div>
                        <div className="password-section">
                          <div className="form-group-enhanced">
                            <label className="form-label">
                              <i className="fas fa-key"></i>
                              Password*
                            </label>
                        <input
                          type="password"
                              className={`form-control-enhanced ${errors.password ? 'is-invalid' : ''}`}
                          name="password"
                              value={formData.password || ''}
                              onChange={handleChange}
                              placeholder="Create a strong password"
                          required
                        />
                            {formData.password && (
                              <div className="password-strength-container">
                                <div className="password-strength-bar">
                                  <div className={`password-strength-fill ${passwordStrength.level}`}></div>
                                </div>
                                <div className="password-strength-text">
                                  <div className={`password-strength-label ${passwordStrength.level}`}>
                                    <i className={`fas fa-shield-alt password-strength-icon`}></i>
                                    Password Strength: {passwordStrength.level.charAt(0).toUpperCase() + passwordStrength.level.slice(1)}
                                  </div>
                                  <span className="text-muted">{passwordStrength.score}/5</span>
                                </div>
                                <div className="mt-2">
                                  <small className="text-muted">Requirements:</small>
                                  <div className="mt-1">
                                    {passwordStrength.requirements.map((req, index) => (
                                      <div key={index} className={`d-flex align-items-center mb-1 ${req.met ? 'text-success' : 'text-muted'}`}>
                                        <i className={`fas ${req.met ? 'fa-check-circle' : 'fa-circle'} me-2`} style={{ fontSize: '0.75rem' }}></i>
                                        <small>{req.text}</small>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                            {errors.password && <div className="invalid-feedback">{errors.password}</div>}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="action-buttons">
                        <div className="d-flex justify-content-between">
                          <button type="button" className="btn btn-outline-enhanced btn-enhanced" onClick={skipToVerification}>
                            <i className="fas fa-fast-forward me-2"></i>
                            Skip to Documents
                          </button>
                          <button type="button" className="btn btn-primary-enhanced btn-enhanced" onClick={nextStep}>
                            <i className="fas fa-arrow-right me-2"></i>
                            Continue
                          </button>
                        </div>
                      </div>
                    </>
                    )}

                    {/* Step 2 */}
                    {step === 2 && (
                    <>
                      {/* Step Header */}
                      <div className="step-header">
                        <h3><i className="fas fa-info-circle me-2"></i>Organization Details</h3>
                        <p className="subtitle">Tell us more about your organization and its mission</p>
                      </div>

                      {/* Organization Description Section */}
                      <div className="form-section">
                        <div className="form-section-title">
                          <i className="fas fa-file-alt"></i>
                          Organization Information
                        </div>
                        <div className="form-group-enhanced">
                          <label className="form-label">
                            <i className="fas fa-align-left"></i>
                            Organization Description*
                          </label>
                          <textarea
                            className={`form-control form-control-lg ${errors.description ? 'is-invalid' : ''}`}
                            name="description"
                            value={formData.description || ''}
                            onChange={handleChange}
                            placeholder="Describe your organization's mission, vision, and activities. Include details about your target beneficiaries, key programs, and impact areas."
                            rows="5"
                            required
                            style={{
                              resize: 'vertical',
                              minHeight: '120px',
                              borderRadius: '0.5rem',
                              border: '2px solid #e9ecef',
                              transition: 'all 0.3s ease',
                              fontSize: '1rem',
                              lineHeight: '1.5',
                              padding: '1rem'
                            }}
                            onFocus={(e) => {
                              e.target.style.borderColor = '#0d6efd';
                              e.target.style.boxShadow = '0 0 0 0.2rem rgba(13, 110, 253, 0.25)';
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = '#e9ecef';
                              e.target.style.boxShadow = 'none';
                            }}
                          />
                          <small className="mt-2 form-text text-muted">
                            <i className="fas fa-info-circle me-1"></i>
                            Provide a comprehensive description of your organization (minimum 50 characters)
                          </small>
                          {errors.description && <div className="invalid-feedback">{errors.description}</div>}
                        </div>
                        <div className="row g-4">
                          <div className="col-md-6">
                            <div className="form-group-enhanced">
                              <label className="form-label">
                                <i className="fas fa-calendar"></i>
                                Year of Establishment*
                              </label>
                        <input
                          type="number"
                                className={`form-control-enhanced ${errors.establishmentYear ? 'is-invalid' : ''}`}
                          name="establishmentYear"
                                value={formData.establishmentYear || ''}
                          onChange={handleChange}
                                placeholder="Enter establishment year"
                          required
                        />
                              {errors.establishmentYear && <div className="invalid-feedback">{errors.establishmentYear}</div>}
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-group-enhanced">
                              <label className="form-label">
                                <i className="fas fa-bullseye"></i>
                                Focus Area*
                              </label>
                        <select
                                className={`form-select-enhanced ${errors.focusArea ? 'is-invalid' : ''}`}
                          name="focusArea"
                                value={formData.focusArea || ''}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Select Focus Area</option>
                          <option value="education">Education</option>
                          <option value="healthcare">Healthcare</option>
                          <option value="environment">Environment</option>
                          <option value="women_empowerment">Women Empowerment</option>
                          <option value="rural_development">Rural Development</option>
                          <option value="skill_development">Skill Development</option>
                          <option value="other">Other</option>
                        </select>
                              {errors.focusArea && <div className="invalid-feedback">{errors.focusArea}</div>}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Address Section */}
                      <div className="form-section">
                        <div className="form-section-title">
                          <i className="fas fa-map-marker-alt"></i>
                          Organization Address
                        </div>
                        <div className="address-section">
                          <div className="form-group-enhanced">
                            <label className="form-label">Street Address*</label>
                        <input
                          type="text"
                              className={`form-control-enhanced ${errors.address ? 'is-invalid' : ''}`}
                          name="address"
                              value={formData.address || ''}
                          onChange={handleChange}
                              placeholder="Enter complete street address"
                          required
                        />
                            {errors.address && <div className="invalid-feedback">{errors.address}</div>}
                          </div>
                          <div className="row g-3">
                            <div className="col-md-6">
                              <div className="form-group-enhanced">
                                <label className="form-label">City*</label>
                        <input
                          type="text"
                                  className={`form-control-enhanced ${errors.city ? 'is-invalid' : ''}`}
                          name="city"
                                  value={formData.city || ''}
                          onChange={handleChange}
                                  placeholder="Enter city name"
                          required
                        />
                                {errors.city && <div className="invalid-feedback">{errors.city}</div>}
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="form-group-enhanced">
                                <label className="form-label">State*</label>
                        <input
                          type="text"
                                  className={`form-control-enhanced ${errors.state ? 'is-invalid' : ''}`}
                          name="state"
                                  value={formData.state || ''}
                          onChange={handleChange}
                                  placeholder="Enter state name"
                          required
                        />
                                {errors.state && <div className="invalid-feedback">{errors.state}</div>}
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="form-group-enhanced">
                                <label className="form-label">PIN Code*</label>
                        <input
                          type="text"
                                  className={`form-control-enhanced ${errors.pincode ? 'is-invalid' : ''}`}
                          name="pincode"
                                  value={formData.pincode || ''}
                          onChange={handleChange}
                                  placeholder="Enter 6-digit PIN code"
                          required
                        />
                                {errors.pincode && <div className="invalid-feedback">{errors.pincode}</div>}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="action-buttons">
                        <div className="d-flex justify-content-between">
                          <button type="button" className="btn btn-outline-enhanced btn-enhanced" onClick={prevStep}>
                            <i className="fas fa-arrow-left me-2"></i>
                            Back
                          </button>
                          <div>
                            <button type="button" className="btn btn-outline-enhanced btn-enhanced me-2" onClick={skipToVerification}>
                              <i className="fas fa-fast-forward me-2"></i>
                              Skip to Documents
                            </button>
                            <button type="button" className="btn btn-primary-enhanced btn-enhanced" onClick={nextStep}>
                              <i className="fas fa-arrow-right me-2"></i>
                            Continue
                          </button>
                        </div>
                      </div>
                      </div>
                    </>
                    )}

                    {/* Step 3 */}
                    {step === 3 && (
                    <>
                      {/* Verification Header */}
                      <div className="verification-step">
                        <h3><i className="fas fa-shield-alt me-2"></i>Document Verification</h3>
                        <p className="subtitle">Please upload the required documents to complete your registration</p>
                        </div>

                      {/* Verification Progress */}
                      <div className="verification-progress">
                        <div className={`progress-item ${formData.ngoImage ? 'completed' : 'current'}`}>
                          <div className="progress-icon">
                            <i className={`fas ${formData.ngoImage ? 'fa-check' : 'fa-image'}`}></i>
                        </div>
                          <div className="progress-label">NGO Image</div>
                        </div>
                        <div className={`progress-item ${formData.FCRACert ? 'completed' : 'current'}`}>
                          <div className="progress-icon">
                            <i className={`fas ${formData.FCRACert ? 'fa-check' : 'fa-file-alt'}`}></i>
                        </div>
                          <div className="progress-label">FCRA Certificate</div>
                        </div>
                        <div className={`progress-item ${formData.terms ? 'completed' : 'current'}`}>
                          <div className="progress-icon">
                            <i className={`fas ${formData.terms ? 'fa-check' : 'fa-handshake'}`}></i>
                          </div>
                          <div className="progress-label">Terms & Conditions</div>
                        </div>
                      </div>

                      <div className="row g-4">
                        {/* NGO Image Upload */}
                        <div className="col-12">
                          <div className={`file-upload-card ${formData.ngoImage ? 'has-file' : ''}`}>
                            <div className="file-upload-icon">
                              <i className="fas fa-image"></i>
                            </div>
                            <div className="file-upload-title">NGO Image</div>
                            <div className="file-upload-subtitle">
                              Upload your organization's image (PDF, JPG, PNG - Max 5MB)
                            </div>
                            <div className="file-input-wrapper">
                              <input 
                                type="file" 
                                name="ngoImage" 
                                accept=".pdf,.jpg,.jpeg,.png" 
                                onChange={handleFileChange} 
                                required
                              />
                              <button type="button" className="file-upload-btn">
                                <i className="fas fa-upload me-2"></i>
                                Choose File
                              </button>
                            </div>
                            {formData.ngoImage && (
                              <div className="file-status success">
                                <i className="fas fa-check-circle me-2"></i>
                                {formData.ngoImage.name} uploaded successfully
                              </div>
                            )}
                            {errors.ngoImage && (
                              <div className="file-status error">
                                <i className="fas fa-exclamation-circle me-2"></i>
                                {errors.ngoImage}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* FCRA Certificate Upload */}
                        <div className="col-12">
                          <div className={`file-upload-card ${formData.FCRACert ? 'has-file' : ''}`}>
                            <div className="file-upload-icon">
                              <i className="fas fa-file-alt"></i>
                            </div>
                            <div className="file-upload-title">FCRA Certificate</div>
                            <div className="file-upload-subtitle">
                              Upload your FCRA certificate (PDF, JPG, PNG - Max 5MB)
                            </div>
                            <div className="file-input-wrapper">
                              <input 
                                type="file" 
                                name="FCRACert" 
                                accept=".pdf,.jpg,.jpeg,.png" 
                                onChange={handleFileChange} 
                                required
                              />
                              <button type="button" className="file-upload-btn">
                                <i className="fas fa-upload me-2"></i>
                                Choose File
                              </button>
                            </div>
                            {formData.FCRACert && (
                              <div className="file-status success">
                                <i className="fas fa-check-circle me-2"></i>
                                {formData.FCRACert.name} uploaded successfully
                              </div>
                            )}
                            {errors.FCRACert && (
                              <div className="file-status error">
                                <i className="fas fa-exclamation-circle me-2"></i>
                                {errors.FCRACert}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 80G Certificate Upload */}
                        <div className="col-12">
                          <div className={`file-upload-card ${formData['80gCert'] ? 'has-file' : ''}`}>
                            <div className="file-upload-icon">
                              <i className="fas fa-file-contract"></i>
                            </div>
                            <div className="file-upload-title">80G Certificate</div>
                            <div className="file-upload-subtitle">
                              Upload your 80G certificate (PDF, JPG, PNG - Max 5MB)
                            </div>
                            <div className="file-input-wrapper">
                              <input 
                                type="file" 
                                name="80gCert" 
                                accept=".pdf,.jpg,.jpeg,.png" 
                                onChange={handleFileChange} 
                                required
                              />
                              <button type="button" className="file-upload-btn">
                                <i className="fas fa-upload me-2"></i>
                                Choose File
                              </button>
                            </div>
                            {formData['80gCert'] && (
                              <div className="file-status success">
                                <i className="fas fa-check-circle me-2"></i>
                                {formData['80gCert'].name} uploaded successfully
                              </div>
                            )}
                            {errors['80gCert'] && (
                              <div className="file-status error">
                                <i className="fas fa-exclamation-circle me-2"></i>
                                {errors['80gCert']}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 16A Certificate Upload */}
                        <div className="col-12">
                          <div className={`file-upload-card ${formData['16ACert'] ? 'has-file' : ''}`}>
                            <div className="file-upload-icon">
                              <i className="fas fa-file-certificate"></i>
                            </div>
                            <div className="file-upload-title">16A Certificate</div>
                            <div className="file-upload-subtitle">
                              Upload your 16A certificate (PDF, JPG, PNG - Max 5MB)
                            </div>
                            <div className="file-input-wrapper">
                              <input 
                                type="file" 
                                name="16ACert" 
                                accept=".pdf,.jpg,.jpeg,.png" 
                                onChange={handleFileChange} 
                                required
                              />
                              <button type="button" className="file-upload-btn">
                                <i className="fas fa-upload me-2"></i>
                                Choose File
                              </button>
                            </div>
                            {formData['16ACert'] && (
                              <div className="file-status success">
                                <i className="fas fa-check-circle me-2"></i>
                                {formData['16ACert'].name} uploaded successfully
                              </div>
                            )}
                            {errors['16ACert'] && (
                              <div className="file-status error">
                                <i className="fas fa-exclamation-circle me-2"></i>
                                {errors['16ACert']}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Trust Deed Certificate Upload */}
                        <div className="col-12">
                          <div className={`file-upload-card ${formData.TrustDeedCert ? 'has-file' : ''}`}>
                            <div className="file-upload-icon">
                              <i className="fas fa-file-signature"></i>
                            </div>
                            <div className="file-upload-title">Trust Deed Certificate</div>
                            <div className="file-upload-subtitle">
                              Upload your trust deed certificate (PDF, JPG, PNG - Max 5MB)
                            </div>
                            <div className="file-input-wrapper">
                              <input 
                                type="file" 
                                name="TrustDeedCert" 
                                accept=".pdf,.jpg,.jpeg,.png" 
                                onChange={handleFileChange} 
                                required
                              />
                              <button type="button" className="file-upload-btn">
                                <i className="fas fa-upload me-2"></i>
                                Choose File
                              </button>
                            </div>
                            {formData.TrustDeedCert && (
                              <div className="file-status success">
                                <i className="fas fa-check-circle me-2"></i>
                                {formData.TrustDeedCert.name} uploaded successfully
                              </div>
                            )}
                            {errors.TrustDeedCert && (
                              <div className="file-status error">
                                <i className="fas fa-exclamation-circle me-2"></i>
                                {errors.TrustDeedCert}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Terms and Conditions */}
                        <div className="col-12">
                          <div className="terms-card">
                            <div className="form-check d-flex align-items-start">
                              <input 
                                type="checkbox" 
                                className={`form-check-input mt-1 ${errors.terms ? 'is-invalid' : ''}`} 
                                id="termsCheck" 
                                name="terms" 
                                checked={formData.terms || false}
                                onChange={handleChange} 
                                required 
                                style={{
                                  marginTop: '0.25rem',
                                  marginRight: '0.75rem',
                                  flexShrink: 0
                                }}
                              />
                              <label className="form-check-label flex-grow-1" htmlFor="termsCheck" style={{ lineHeight: '1.5' }}>
                                <i className="fas fa-shield-alt me-2 text-primary"></i>
                                I confirm that all information provided is accurate and I agree to the {" "}
                                <a href="#" className="text-primary fw-semibold">Terms & Conditions</a> and {" "}
                                <a href="#" className="text-primary fw-semibold">Privacy Policy</a>
                              </label>
                            </div>
                            {errors.terms && <div className="mt-2 invalid-feedback">{errors.terms}</div>}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-4 d-flex justify-content-between">
                        <button type="button" className="btn btn-outline-secondary btn-lg" onClick={prevStep}>
                          <i className="fas fa-arrow-left me-2"></i>
                            Back
                          </button>
                        <button type="submit" className="btn btn-primary btn-lg">
                          <i className="fas fa-check-circle me-2"></i>
                            Complete Registration
                          </button>
                        </div>
                    </>
                    )}
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
    </>
  );
}
