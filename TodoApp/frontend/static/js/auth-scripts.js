// Auth Pages JavaScript - Shared between Login and Register

// Tailwind Configuration
if (typeof tailwind !== 'undefined') {
  tailwind.config = {
    theme: {
      extend: {
        fontFamily: {
          poppins: ['Poppins', 'sans-serif'],
        },
        animation: {
          float: 'float 6s ease-in-out infinite',
          'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          'bounce-slow': 'bounce 2s infinite',
        },
        keyframes: {
          float: {
            '0%, 100%': { transform: 'translateY(0px)' },
            '50%': { transform: 'translateY(-20px)' },
          },
        },
      },
    },
  };
}

// DOM Content Loaded Event
document.addEventListener('DOMContentLoaded', function () {
  console.log('Auth scripts loaded - version 1.3');
  console.log('Current page URL:', window.location.href);
  initializeAuthPages();
});

// Main initialization function
function initializeAuthPages() {
  setupFormHandlers();
  setupAnimations();
  setupInputEnhancements();
  setupPasswordValidation();
}

// Form submission handlers
function setupFormHandlers() {
  // Login form handler
  const loginForm = document.getElementById('loginform');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLoginSubmit);
  }

  // Register form handler
  const registerForm = document.getElementById('registerform');
  if (registerForm) {
    registerForm.addEventListener('submit', handleRegisterSubmit);
  }
}

// Login form submission
function handleLoginSubmit(e) {
  e.preventDefault(); // Prevent default form submission
  console.log('Login form submitted - version 1.3');

  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalContent = submitBtn.innerHTML;

  // Show loading state
  submitBtn.innerHTML =
    '<i class="bi bi-arrow-clockwise animate-spin mr-2"></i>Signing In...';
  submitBtn.disabled = true;

  // Get form data in the format expected by OAuth2PasswordRequestForm
  const formData = new URLSearchParams();
  formData.append('username', document.getElementById('username').value);
  formData.append('password', document.getElementById('password').value);

  console.log('Submitting login form...');

  // Submit form to the correct endpoint
  fetch('/auth/token', {
    method: 'POST',
    body: formData,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  })
    .then((response) => {
      console.log('Login response status:', response.status);
      console.log('Login response ok:', response.ok);

      if (response.ok) {
        // Handle successful login
        return response.json().then((data) => {
          console.log('Login successful! Token received:', data);
          // Store the token in localStorage
          localStorage.setItem('access_token', data.access_token);
          localStorage.setItem('token_type', data.token_type);
          
          // Also store token in cookies for page routes
          document.cookie = `access_token=${data.access_token}; path=/; max-age=1200; SameSite=Strict`;

          showFormSuccess('Login successful! Redirecting to dashboard...');

          // Redirect to dashboard or appropriate page
          setTimeout(() => {
            console.log('Redirecting to dashboard...');
            console.log('Target URL:', '/todos/todo-page');
            console.log('Current auth-scripts.js version: 1.3');

            // Final check - ensure we're redirecting to the correct URL
            const redirectUrl = '/todos/todo-page';
            console.log('Final redirect URL:', redirectUrl);
            window.location.replace(redirectUrl); // Using replace() instead of href for more reliable redirect
          }, 2000);
        });
      } else {
        // Handle login error
        return response.json().then((data) => {
          console.error('Login failed:', data);
          throw new Error(data.detail || 'Login failed');
        });
      }
    })
    .catch((error) => {
      console.error('Login error:', error);
      // Reset button state
      submitBtn.innerHTML = originalContent;
      submitBtn.disabled = false;
      // Show error message to user
      showFormError(
        error.message || 'Login failed. Please check your credentials.',
      );
    });
}

// Register form submission
function handleRegisterSubmit(e) {
  e.preventDefault(); // Prevent default form submission

  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalContent = submitBtn.innerHTML;

  // Validate passwords match
  const password = document.getElementById('password');
  const password2 = document.getElementById('password2');

  if (password && password2 && password.value !== password2.value) {
    showFormError('Passwords do not match!');
    return;
  }

  // Show loading state
  submitBtn.innerHTML =
    '<i class="bi bi-arrow-clockwise animate-spin mr-2"></i>Creating Account...';
  submitBtn.disabled = true;

  // Get form data and convert to JSON format
  const formData = {
    username: document.getElementById('username').value,
    email: document.getElementById('email').value,
    first_name: document.getElementById('firstname').value,
    last_name: document.getElementById('lastname').value,
    password: password.value,
    role: document.getElementById('role').value,
    phone_number: document.getElementById('phone').value,
  };

  console.log('Submitting registration form...', formData);

  // Submit form to the correct endpoint
  fetch('/auth/', {
    method: 'POST',
    body: JSON.stringify(formData),
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then((response) => {
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.status === 201 || response.ok) {
        // Handle successful registration
        console.log('Registration successful! Redirecting to login...');
        showFormSuccess(
          'Account created successfully! Redirecting to login...',
        );

        // Redirect to login page after 2 seconds
        setTimeout(() => {
          console.log('Redirecting to /auth/login-page');
          window.location.href = '/auth/login-page';
        }, 2000);
      } else {
        // Handle registration error
        return response.json().then((data) => {
          console.error('Registration failed:', data);
          throw new Error(data.detail || 'Registration failed');
        });
      }
    })
    .catch((error) => {
      console.error('Registration error:', error);
      // Reset button state
      submitBtn.innerHTML = originalContent;
      submitBtn.disabled = false;
      // Show error message to user
      showFormError(error.message || 'Registration failed. Please try again.');
    });
}

// Setup animations for form elements
function setupAnimations() {
  const inputs = document.querySelectorAll('input');
  inputs.forEach((input, index) => {
    input.style.animationDelay = `${index * 0.1}s`;
  });

  // Add floating animation to form elements
  const formElements = document.querySelectorAll(
    '.glass-effect, input, button',
  );
  formElements.forEach((element, index) => {
    element.style.animationDelay = `${index * 0.05}s`;
  });
}

// Enhanced input interactions - Reduced scale effect
function setupInputEnhancements() {
  const inputs = document.querySelectorAll('input');

  inputs.forEach((input) => {
    // Add focus effects with reduced scale
    input.addEventListener('focus', function () {
      this.parentElement.style.transform = 'scale(1.02)';
      this.parentElement.style.transition = 'transform 0.3s ease';
    });

    input.addEventListener('blur', function () {
      this.parentElement.style.transform = 'scale(1)';
    });

    // Add real-time validation feedback
    input.addEventListener('input', function () {
      validateInput(this);
    });
  });
}

// Input validation
function validateInput(input) {
  const value = input.value.trim();
  const type = input.type;
  const parent = input.parentElement;

  // Remove existing validation classes
  parent.classList.remove('valid', 'invalid');

  if (value === '') {
    return;
  }

  let isValid = false;

  switch (type) {
    case 'email':
      isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      break;
    case 'password':
      isValid = value.length >= 6;
      break;
    case 'tel':
      isValid = /^[\+]?[1-9][\d]{0,15}$/.test(value.replace(/\s/g, ''));
      break;
    default:
      isValid = value.length >= 2;
  }

  if (isValid) {
    parent.classList.add('valid');
    showSuccess(input, '✓');
  } else {
    parent.classList.add('invalid');
    showError(input, getErrorMessage(type));
  }
}

// Password validation for register form
function setupPasswordValidation() {
  const password = document.getElementById('password');
  const password2 = document.getElementById('password2');

  if (password && password2) {
    // Check both password fields on input
    password.addEventListener('input', function () {
      validatePasswordMatch();
    });

    password2.addEventListener('input', function () {
      validatePasswordMatch();
    });
  }
}

// Validate password match
function validatePasswordMatch() {
  const password = document.getElementById('password');
  const password2 = document.getElementById('password2');

  if (password && password2) {
    // Remove existing messages
    const existingMessage = password2.parentElement.querySelector(
      '.error-message, .success-message',
    );
    if (existingMessage) {
      existingMessage.remove();
    }

    if (password.value && password2.value) {
      if (password.value === password2.value) {
        password2.setCustomValidity('');
        showSuccess(password2, '✓ Passwords match');
      } else {
        password2.setCustomValidity('Passwords do not match');
        showError(password2, 'Passwords do not match');
      }
    }
  }
}

// Show success message
function showSuccess(element, message) {
  // Remove existing messages
  const existingMessage =
    element.parentElement.querySelector('.success-message');
  if (existingMessage) {
    existingMessage.remove();
  }

  const messageDiv = document.createElement('div');
  messageDiv.className = 'success-message text-green-400 text-xs mt-1';
  messageDiv.textContent = message;
  element.parentElement.appendChild(messageDiv);
}

// Show error message
function showError(element, message) {
  // Remove existing messages
  const existingMessage = element.parentElement.querySelector('.error-message');
  if (existingMessage) {
    existingMessage.remove();
  }

  const messageDiv = document.createElement('div');
  messageDiv.className = 'error-message text-red-400 text-xs mt-1';
  messageDiv.textContent = message;
  element.parentElement.appendChild(messageDiv);
}

// Show form-level success message
function showFormSuccess(message) {
  const form = document.querySelector('form');
  if (form) {
    // Remove existing form messages
    const existingMessage = form.parentElement.querySelector('.form-message');
    if (existingMessage) {
      existingMessage.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className =
      'form-message text-green-400 text-sm mt-3 text-center font-medium';
    messageDiv.textContent = message;
    form.parentElement.appendChild(messageDiv);
  }
}

// Show form-level error message
function showFormError(message) {
  const form = document.querySelector('form');
  if (form) {
    // Remove existing form messages
    const existingMessage = form.parentElement.querySelector('.form-message');
    if (existingMessage) {
      existingMessage.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className =
      'form-message text-red-400 text-sm mt-3 text-center font-medium';
    messageDiv.textContent = message;
    form.parentElement.appendChild(messageDiv);
  }
}

// Get error message based on input type
function getErrorMessage(type) {
  switch (type) {
    case 'email':
      return 'Please enter a valid email address';
    case 'password':
      return 'Password must be at least 6 characters';
    case 'tel':
      return 'Please enter a valid phone number';
    default:
      return 'This field is required';
  }
}

// Enhanced button interactions
function setupButtonEnhancements() {
  const buttons = document.querySelectorAll('button[type="submit"]');

  buttons.forEach((button) => {
    button.addEventListener('mouseenter', function () {
      this.style.transform = 'translateY(-3px) scale(1.05)';
    });

    button.addEventListener('mouseleave', function () {
      this.style.transform = 'translateY(0) scale(1)';
    });
  });
}

// Utility function to add loading state
function addLoadingState(element, loadingText) {
  const originalContent = element.innerHTML;
  element.innerHTML = loadingText;
  element.disabled = true;
  return originalContent;
}

// Utility function to remove loading state
function removeLoadingState(element, originalContent) {
  element.innerHTML = originalContent;
  element.disabled = false;
}

// Smooth scroll to form errors
function scrollToError() {
  const errorElement = document.querySelector('.error-message');
  if (errorElement) {
    errorElement.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }
}

// Initialize floating shapes animation
function initFloatingShapes() {
  const shapes = document.querySelectorAll('.floating-shapes > div');
  shapes.forEach((shape, index) => {
    shape.style.animationDelay = `${index * 1}s`;
  });
}

// Call initialization functions
document.addEventListener('DOMContentLoaded', function () {
  setupButtonEnhancements();
  initFloatingShapes();
});
