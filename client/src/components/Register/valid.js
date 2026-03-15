$(document).ready(function() {

    // Initialize Select2 for better dropdown experience
    if (typeof $.fn.select2 !== 'undefined') {
        $('select[multiple]').select2({
            placeholder: 'Select regions',
            theme: 'bootstrap-5'
        });
    }

    const form = document.getElementById('corporateRegistrationForm');
    const steps = document.querySelectorAll('.form-step');
    const progressSteps = document.querySelectorAll('.progress-step');

    // Form Validation Rules - Updated to match the first code style
    const validationRules = {
        cinNumber: {
            validate: (value) => {
                return /^[A-Z]{1}[0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/.test(value);
            },
            message: 'Please enter a valid CIN number '
        },
        email: {
            validate: (value) => {
                return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value);
            },
            message: 'Please enter a valid email address'
        },
        pincode: {
            validate: (value) => {
                return /^\d{6}$/.test(value);
            },
            message: 'Please enter a valid 6-digit PIN code'
        },
        city: {
            validate: (value) => {
                return /^[A-Za-z\s\-.']+$/.test(value);
            },
            message: 'Please enter a valid city name'
        },
        state: {
            validate: (value) => {
                return /^[A-Za-z\s\-.']+$/.test(value);
            },
            message: 'Please enter a valid state name'
        },
        phone: {
            validate: (value) => {
                return /^[6-9]\d{9}$/.test(value);
            },
            message: 'Please enter a valid 10-digit phone number'
        },
        website: {
            validate: (value) => {
                return /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/.test(value);
            },
            message: 'Please enter a valid website URL'
        },
        password: {
            validate: (value) => {
                return value.length >= 6;
            },
            message: 'Password must be at least 6 characters long'
        },
        companyName: {
            validate: (value) => {
                return /^[A-Za-z0-9\s\-&.',()]+$/.test(value);
            },
            message: 'Please enter a valid company name'
        },
        address: {
            validate: (value) => {
                return value.length >= 10 && /^[A-Za-z0-9\s\-.,#/\\&'()]+$/.test(value);
            },
            message: 'Address must be at least 10 characters long'
        },
        registrationCert: {
            validate: (input) => {
                if (input instanceof HTMLInputElement) {
                    if (!input.files || !input.files[0]) return false;
                    
                    const file = input.files[0];
                    const maxSize = 5 * 1024 * 1024; // 5MB
                    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
                    
                    if (file.size > maxSize) {
                        showError('Please upload a file smaller than 5MB');
                        return false;
                    }
                    if (!allowedTypes.includes(file.type)) {
                        showError('Only PDF, JPG and PNG formats are allowed');
                        return false;
                    }
                    return true;
                }
                return false;
            },
            message: 'Please upload a valid Registration Certificate (PDF, JPG or PNG, max 5MB)'
        },
        csrPolicy: {
            validate: (input) => {
                if (input instanceof HTMLInputElement) {
                    if (!input.files || !input.files[0]) return false;
                    
                    const file = input.files[0];
                    const maxSize = 5 * 1024 * 1024; // 5MB
                    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
                    
                    if (file.size > maxSize) {
                        showError('Please upload a file smaller than 5MB');
                        return false;
                    }
                    if (!allowedTypes.includes(file.type)) {
                        showError('Only PDF, JPG and PNG formats are allowed');
                        return false;
                    }
                    return true;
                }
                return false;
            },
            message: 'Please upload a valid CSR Policy document (PDF, JPG or PNG, max 5MB)'
        },
        focusArea: {
            validate: (value) => value !== '',
            message: 'Please select a primary focus area'
        },
        regions: {
            validate: (select) => {
                if (select instanceof HTMLSelectElement) {
                    return select.selectedOptions.length > 0;
                }
                return false;
            },
            message: 'Please select at least one preferred geographic region'
        }
    };

    function showError(message) {
        Swal.fire({
            icon: 'warning',
            title: 'Validation Error',
            text: message,
            confirmButtonColor: '#2b6cb0'
        });
    }

    // Smooth scrolling for anchor links
    $('a[href^="#verification"]').on('click', function(event) {
        event.preventDefault();
        $('html, body').stop().animate({
            scrollTop: $('#verification').offset().top
        }, 1000, function() {
            // After scrolling, show the verification step
            showStep(3);
        });
    });

    // Step Navigation
    document.querySelectorAll('.next-step').forEach(button => {
        button.addEventListener('click', () => {
            const currentStep = parseInt(button.closest('.form-step').dataset.step);
            if (validateStep(currentStep)) {
                showStep(currentStep + 1);
            }
        });
    });

    document.querySelectorAll('.prev-step').forEach(button => {
        button.addEventListener('click', () => {
            const currentStep = parseInt(button.closest('.form-step').dataset.step);
            showStep(currentStep - 1);
        });
    });

    const passwordInput = form.querySelector('input[name="password"]');
const strengthIndicator = document.querySelector('.password-strength');

passwordInput.addEventListener('input', () => {
    const strength = checkPasswordStrength(passwordInput.value);
    updatePasswordStrengthIndicator(strength);
});

    // File Upload Handling
    document.querySelectorAll('.upload-area').forEach(area => {
        const input = area.querySelector('.file-input');
        
        area.addEventListener('click', () => input.click());
        
        area.addEventListener('dragover', (e) => {
            e.preventDefault();
            area.classList.add('dragover');
        });

        area.addEventListener('dragleave', () => {
            area.classList.remove('dragover');
        });

        area.addEventListener('drop', (e) => {
            e.preventDefault();
            area.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length) {
                handleFileUpload(input, files[0]);
            }
        });

        input.addEventListener('change', (e) => {
            if (e.target.files.length) {
                handleFileUpload(input, e.target.files[0]);
            }
        });
    });

    // Handle File Upload Function
    function handleFileUpload(input, file) {
        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];

        if (file.size > maxSize) {
            Swal.fire({
                icon: 'error',
                title: 'File too large',
                text: 'Please upload a file smaller than 5MB',
                confirmButtonColor: '#2b6cb0'
            });
            input.value = '';
            return false;
        }

        if (!allowedTypes.includes(file.type)) {
            Swal.fire({
                icon: 'error',
                title: 'Invalid file type',
                text: 'Please upload a PDF, JPG, or PNG file',
                confirmButtonColor: '#2b6cb0'
            });
            input.value = '';
            return false;
        }

        const area = input.closest('.upload-area');
        
        // For all files, just update the text
        const textElement = area.querySelector('p');
        if (textElement) {
            textElement.textContent = file.name;
        } else {
            const newElement = document.createElement('p');
            newElement.textContent = file.name;
            area.appendChild(newElement);
        }
        
        return true;
    }

    // Form Submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Form submission triggered'); // Debugging log
    
        // Validate all steps before submission
        let isValid = true;
        for (let i = 1; i <= steps.length; i++) {
            if (!validateStep(i)) {
                isValid = false;
                showStep(i);
                return;
            }
        }
        
        // Extra validation for certificate files
        const registrationCert = form.querySelector('input[name="registrationCert"]');
        const csrPolicy = form.querySelector('input[name="csrPolicy"]');
    
        console.log('Registration Cert files:', registrationCert?.files); // Debugging log
        console.log('CSR Policy files:', csrPolicy?.files); // Debugging log
    
        // Validate required certificate files
        if (registrationCert && !registrationCert.files.length) {
            showError('Please upload the Registration Certificate');
            showStep(getStepForElement(registrationCert));
            return;
        }
        
        if (csrPolicy && !csrPolicy.files.length) {
            showError('Please upload the CSR Policy document');
            showStep(getStepForElement(csrPolicy));
            return;
        }
        
        if (isValid && validateFocusAreas()) {
            try {
                const formData = new FormData(form);
                
                // Show loading state
                Swal.fire({
                    title: 'Submitting Registration',
                    html: 'Please wait while we process your information...',
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });
    
            // Send the form data to your server
            const response = await fetch('/api/corporate/register', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Server returned an error');
            }
            const result = await response.json();
                // Success message
                Swal.fire({
                    icon: 'success',
                    title: 'Registration Successful!',
                    text: 'Your account is under review. We will notify you once verified.',
                    confirmButtonColor: '#2b6cb0'
                }).then(() => {
                    window.location.href = '../html/entry.html';
                });
            } catch (error) {
                console.error('Error during form submission:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Registration Failed',
                    text: 'Please try again later.',
                    confirmButtonColor: '#2b6cb0'
                });
            }
        }
    });

    // Helper Functions
    function showStep(step) {
        steps.forEach(s => s.classList.remove('active'));
        progressSteps.forEach(s => s.classList.remove('active'));

        steps[step - 1].classList.add('active');
        for (let i = 0; i < step; i++) {
            progressSteps[i].classList.add('active');
        }
    }

    function validateStep(step) {
        const currentStep = document.querySelector(`.form-step[data-step="${step}"]`);
        if (!currentStep) return true; // Skip if step doesn't exist
        
        const inputs = currentStep.querySelectorAll('input:not([type="hidden"]):not([type="submit"]), select, textarea');
        let isValid = true;
    
        inputs.forEach(input => {
            // Special handling for file inputs
            if (input.type === 'file') {
                if (input.hasAttribute('required') && (!input.files || !input.files.length)) {
                    isValid = false;
                    showError(`Please upload a file for ${input.name.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
                    input.classList.add('is-invalid');
                } else if (input.files && input.files.length && validationRules[input.name]?.validate && !validationRules[input.name].validate(input)) {
                    isValid = false;
                    // The error message is already shown in the validate function
                    input.classList.add('is-invalid');
                } else {
                    input.classList.remove('is-invalid');
                }
            } 
            // Skip validation for non-required empty fields
            else if (!input.hasAttribute('required') && !input.value) {
                input.classList.remove('is-invalid');
            }
            // Regular input validation
            else if (input.hasAttribute('required') && !input.value) {
                isValid = false;
                showError(validationRules[input.name]?.message || `Please enter your ${input.name.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
                input.classList.add('is-invalid');
            } 
            // For selects with multiple attribute
            else if (input.tagName === 'SELECT' && input.multiple && validationRules[input.name]?.validate) {
                if (!validationRules[input.name].validate(input)) {
                    isValid = false;
                    showError(validationRules[input.name].message);
                    input.classList.add('is-invalid');
                } else {
                    input.classList.remove('is-invalid');
                }
            }
            // For other inputs with value
            else if (input.value && validationRules[input.name]?.validate && !validationRules[input.name].validate(input.value)) {
                isValid = false;
                showError(validationRules[input.name].message);
                input.classList.add('is-invalid');
            } else {
                input.classList.remove('is-invalid');
            }
        });
    
        return isValid;
    }

    function validateFocusAreas() {
        const focusArea = form.querySelector('select[name="focusArea"]');
        const regions = form.querySelector('select[name="regions"]');
        
        let isValid = true;
        
        // Validate primary focus area
        if (focusArea && !focusArea.value) {
            showError('Please select a primary focus area');
            focusArea.classList.add('is-invalid');
            isValid = false;
        } else if (focusArea) {
            focusArea.classList.remove('is-invalid');
        }
        
        // Validate regions selection
        if (regions && regions.selectedOptions.length === 0) {
            showError('Please select at least one preferred geographic region');
            regions.classList.add('is-invalid');
            isValid = false;
        } else if (regions) {
            regions.classList.remove('is-invalid');
        }
        
        return isValid;
    }

    function checkPasswordStrength(password) {
        const hasLower = /[a-z]/.test(password);
        const hasUpper = /[A-Z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSpecial = /[!@#$%^&*]/.test(password);
        const length = password.length;

        const conditions = [hasLower, hasUpper, hasNumber, hasSpecial, length >= 8];
        const strength = conditions.filter(Boolean).length;

        return strength < 3 ? 'weak' : strength < 4 ? 'medium' : 'strong';
    }

    function updatePasswordStrengthIndicator(strength) {
        if (strengthIndicator) {
            strengthIndicator.className = 'password-strength ' + strength;
        }
    }
    
    function getStepForElement(element) {
        const step = element.closest('.form-step');
        return step ? parseInt(step.dataset.step) : 1;
    }
});