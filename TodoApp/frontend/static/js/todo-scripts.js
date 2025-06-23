// Todo Page JavaScript - Comprehensive Todo Management

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
          'slide-in': 'slideIn 0.3s ease-out',
        },
        keyframes: {
          float: {
            '0%, 100%': { transform: 'translateY(0px)' },
            '50%': { transform: 'translateY(-20px)' },
          },
          slideIn: {
            from: { opacity: '0', transform: 'translateY(20px)' },
            to: { opacity: '1', transform: 'translateY(0)' },
          },
        },
      },
    },
  };
}

// Global Variables
let todos = [];
let currentFilter = 'all';
let searchQuery = '';
let editingTodoId = null;

// DOM Content Loaded Event
document.addEventListener('DOMContentLoaded', function () {
  initializeTodoApp();
});

// Main initialization function
function initializeTodoApp() {
  setupEventListeners();
  loadTodos();
  setupAnimations();
  setupInputEnhancements();
  checkAuthentication();
  checkUserRole();
  checkAuthorizationStatus();
}

// Check and display authorization status
function checkAuthorizationStatus() {
  const token = localStorage.getItem('access_token');
  if (!token) {
    showNotification('Please login to access your todos', 'warning');
    return;
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userRole = payload.role;
    const username = payload.sub;

    if (userRole === 'admin') {
      showNotification(`Welcome, Admin ${username}! You have full access to all features.`, 'success');
    } else {
      showNotification(`Welcome, ${username}! You can manage your own todos.`, 'info');
    }
  } catch (error) {
    console.error('Error checking authorization status:', error);
    showNotification('Error checking user authorization', 'error');
  }
}

// Check if user is authenticated
function checkAuthentication() {
  const token = localStorage.getItem('access_token');
  if (!token) {
    showNotification('Please login to access your todos', 'error');
    setTimeout(() => {
      window.location.href = '/auth/login-page';
    }, 2000);
    return false;
  }

  // Check if user is admin and show admin button
  checkUserRole();
  return true;
}

// Check if user is authorized for admin access
function isUserAdmin() {
  const token = localStorage.getItem('access_token');
  if (!token) {
    return false;
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role === 'admin';
  } catch (error) {
    console.error('Error checking admin authorization:', error);
    return false;
  }
}

// Show unauthorized access message
function showUnauthorizedMessage() {
  showNotification('You are not authorized to access admin features. Admin privileges required.', 'error');
}

// Check user role and show admin button if admin
function checkUserRole() {
  const token = localStorage.getItem('access_token');
  if (!token) {
    // Hide admin buttons if no token
    hideAdminButtons();
    return;
  }

  try {
    // Decode JWT token to get user role
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userRole = payload.role;
    const username = payload.sub;
    const userId = payload.id;

    const adminBtn = document.getElementById('adminBtn');
    const adminQuickAccess = document.getElementById('adminQuickAccess');
    const floatingAdminBtn = document.getElementById('floatingAdminBtn');

    if (userRole === 'admin') {
      // Show main admin button
      if (adminBtn) {
        adminBtn.style.display = 'inline-flex';
      }

      // Show admin quick access section
      if (adminQuickAccess) {
        adminQuickAccess.style.display = 'block';
      }

      // Show floating admin button
      if (floatingAdminBtn) {
        floatingAdminBtn.style.display = 'block';
      }

      // Add admin indicator to the page
      addAdminIndicator(username, userId);
    } else {
      // Show admin button for all users but handle authorization on click
      if (adminBtn) {
        adminBtn.style.display = 'inline-flex';
      }
      
      // Hide admin quick access section for non-admin users
      if (adminQuickAccess) {
        adminQuickAccess.style.display = 'none';
      }
      
      // Hide floating admin button for non-admin users
      if (floatingAdminBtn) {
        floatingAdminBtn.style.display = 'none';
      }
    }
  } catch (error) {
    console.error('Error checking user role:', error);
    hideAdminButtons();
  }
}

// Hide all admin buttons
function hideAdminButtons() {
  const adminBtn = document.getElementById('adminBtn');
  const adminQuickAccess = document.getElementById('adminQuickAccess');
  const floatingAdminBtn = document.getElementById('floatingAdminBtn');

  if (adminBtn) adminBtn.style.display = 'none';
  if (adminQuickAccess) adminQuickAccess.style.display = 'none';
  if (floatingAdminBtn) floatingAdminBtn.style.display = 'none';
}

// Add admin indicator for admin users
function addAdminIndicator(username, userId) {
  // Add admin badge to header
  const header = document.querySelector('.text-center.mb-6');
  if (header) {
    const adminBadge = document.createElement('div');
    adminBadge.className = 'mt-2';
    adminBadge.innerHTML = `
            <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                <i class="bi bi-shield-check mr-1"></i>Admin: ${username} (ID: ${userId})
            </span>
            <div class="mt-1 text-xs text-white/70">
                <span class="cursor-help" title="Keyboard Shortcuts: Ctrl+Shift+A (Admin Panel), Ctrl+Shift+L (Logout)">
                    <i class="bi bi-keyboard mr-1"></i>Shortcuts available
                </span>
            </div>
        `;
    header.appendChild(adminBadge);
  }
}

// Setup all event listeners
function setupEventListeners() {
  // Todo form submission
  const todoForm = document.getElementById('todoform');
  if (todoForm) {
    todoForm.addEventListener('submit', handleTodoSubmit);
  }

  // Search functionality
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', handleSearch);
  }

  // Filter buttons
  const filterButtons = document.querySelectorAll('.filter-btn');
  filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => handleFilter(btn.dataset.filter));
  });

  // Priority selection
  const prioritySelect = document.getElementById('priority');
  if (prioritySelect) {
    prioritySelect.addEventListener('change', handlePriorityChange);
  }

  // Admin button
  const adminBtn = document.getElementById('adminBtn');
  if (adminBtn) {
    adminBtn.addEventListener('click', function(e) {
      if (!isUserAdmin()) {
        e.preventDefault(); // Prevent navigation
        showUnauthorizedMessage();
        return;
      }
      // Allow navigation for admin users
    });
  }

  // Logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }

  // Cancel edit button
  const cancelBtn = document.getElementById('cancelEditBtn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', cancelEdit);
  }

  // Keyboard shortcuts for admin users
  setupAdminKeyboardShortcuts();
}

// Handle todo form submission
function handleTodoSubmit(e) {
  e.preventDefault();

  if (!checkAuthentication()) return;

  const taskInput = document.getElementById('task');
  const descriptionInput = document.getElementById('description');
  const prioritySelect = document.getElementById('priority');
  const submitBtn = e.target.querySelector('button[type="submit"]');

  const task = taskInput.value.trim();
  const description = descriptionInput ? descriptionInput.value.trim() : task;
  const priorityStr = prioritySelect ? prioritySelect.value : 'medium';

  if (!task) {
    showNotification('Task cannot be empty', 'error');
    return;
  }

  // Convert priority string to integer for backend
  const priorityMap = {
    low: 0,
    medium: 1,
    high: 3,
    very_high: 4,
    urgent: 5,
  };
  const priority = priorityMap[priorityStr] || 1;

  const originalContent = submitBtn.innerHTML;
  submitBtn.innerHTML =
    '<i class="bi bi-arrow-clockwise animate-spin mr-2"></i>Adding...';
  submitBtn.disabled = true;

  const todoData = {
    title: task,
    description: description,
    priority: priority,
    complete: false,
  };

  if (editingTodoId) {
    // Update existing todo
    updateTodo(editingTodoId, todoData, submitBtn, originalContent);
  } else {
    // Create new todo
    createTodo(todoData, submitBtn, originalContent);
  }
}

// Create new todo
function createTodo(todoData, submitBtn, originalContent) {
  fetch('/todos/todo', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('access_token')}`,
    },
    body: JSON.stringify(todoData),
  })
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
      throw new Error('Failed to create todo');
    })
    .then((data) => {
      todos.push(data);
      renderTodos();

      // Clear form fields
      document.getElementById('task').value = '';
      const descriptionInput = document.getElementById('description');
      if (descriptionInput) {
        descriptionInput.value = '';
      }

      // Reset button text
      submitBtn.innerHTML = '<i class="bi bi-plus-circle mr-2"></i>Add Task';

      // Hide cancel button
      const cancelBtn = document.getElementById('cancelEditBtn');
      if (cancelBtn) {
        cancelBtn.style.display = 'none';
      }

      showNotification('Todo added successfully!', 'success');
    })
    .catch((error) => {
      console.error('Error creating todo:', error);
      showNotification('Failed to add todo', 'error');
    })
    .finally(() => {
      submitBtn.disabled = false;
    });
}

// Update existing todo
function updateTodo(todoId, todoData, submitBtn, originalContent) {
  fetch(`/todos/todo/update-todo/${todoId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('access_token')}`,
    },
    body: JSON.stringify(todoData),
  })
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
      throw new Error('Failed to update todo');
    })
    .then((data) => {
      const index = todos.findIndex((todo) => todo.id === todoId);
      if (index !== -1) {
        todos[index] = data;
      }
      renderTodos();

      // Clear form fields
      document.getElementById('task').value = '';
      const descriptionInput = document.getElementById('description');
      if (descriptionInput) {
        descriptionInput.value = '';
      }

      // Reset editing state and button text
      editingTodoId = null;
      submitBtn.innerHTML = '<i class="bi bi-plus-circle mr-2"></i>Add Task';

      // Hide cancel button
      const cancelBtn = document.getElementById('cancelEditBtn');
      if (cancelBtn) {
        cancelBtn.style.display = 'none';
      }

      showNotification('Todo updated successfully!', 'success');
    })
    .catch((error) => {
      console.error('Error updating todo:', error);
      showNotification('Failed to update todo', 'error');
    })
    .finally(() => {
      submitBtn.disabled = false;
    });
}

// Load todos from server
function loadTodos() {
  if (!checkAuthentication()) return;

  const loadingSpinner = document.getElementById('loadingSpinner');
  if (loadingSpinner) {
    loadingSpinner.style.display = 'block';
  }

  fetch('/todos/', {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('access_token')}`,
    },
  })
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
      throw new Error('Failed to load todos');
    })
    .then((data) => {
      todos = Array.isArray(data) ? data : [];
      renderTodos();
    })
    .catch((error) => {
      console.error('Error loading todos:', error);
      showNotification('Failed to load todos', 'error');
    })
    .finally(() => {
      if (loadingSpinner) {
        loadingSpinner.style.display = 'none';
      }
    });
}

// Render todos in the UI
function renderTodos() {
  const todoList = document.getElementById('todoList');
  const emptyState = document.getElementById('emptyState');

  if (!todoList) return;

  const filteredTodos = getFilteredTodos();

  if (filteredTodos.length === 0) {
    todoList.innerHTML = '';
    if (emptyState) {
      emptyState.style.display = 'block';
    }
    return;
  }

  if (emptyState) {
    emptyState.style.display = 'none';
  }

  todoList.innerHTML = filteredTodos
    .map((todo) => createTodoHTML(todo))
    .join('');

  // Add event listeners to new todo items
  addTodoItemEventListeners();

  // Update stats
  updateStats();
}

// Create HTML for a single todo item
function createTodoHTML(todo) {
  // Convert priority integer to string for display
  const priorityMap = {
    0: 'low',
    1: 'medium',
    3: 'high',
    4: 'very high',
    5: 'urgent',
  };
  const priorityStr = priorityMap[todo.priority] || 'medium';
  const priorityClass = `priority-${priorityStr.replace(' ', '_')}`;
  const completedClass = todo.complete ? 'completed' : '';
  const completedText = todo.complete ? 'completed' : '';

  // Button text based on current state
  const buttonText = todo.complete ? 'Mark Pending' : 'Mark Complete';
  const buttonIcon = todo.complete ? 'bi-arrow-clockwise' : 'bi-check-circle';

  return `
        <div class="todo-item ${completedClass} animate-slide-in" data-id="${
    todo.id
  }">
            <div class="flex items-start justify-between">
                <div class="flex-1">
                    <div class="todo-text ${completedText}">${escapeHtml(
    todo.title,
  )}</div>
                    ${
                      todo.description && todo.description !== todo.title
                        ? `<div class="todo-description ${completedText} text-sm text-white/80 mt-1">${escapeHtml(
                            todo.description,
                          )}</div>`
                        : ''
                    }
                    <div class="flex items-center gap-2 mt-2">
                        <span class="priority-badge ${priorityClass}">${priorityStr}</span>
                    </div>
                    ${
                      todo.created_at
                        ? `<div class="text-xs text-white/60 mt-1">Created: ${formatDate(
                            todo.created_at,
                          )}</div>`
                        : ''
                    }
                </div>
            </div>
            <div class="todo-actions">
                <button class="todo-action-btn complete" onclick="toggleTodo(${
                  todo.id
                })">
                    <i class="bi ${buttonIcon} mr-1"></i>${buttonText}
                </button>
                <button class="todo-action-btn edit" onclick="editTodo(${
                  todo.id
                })">
                    <i class="bi bi-pencil mr-1"></i>Edit
                </button>
                <button class="todo-action-btn delete" onclick="deleteTodo(${
                  todo.id
                })">
                    <i class="bi bi-trash mr-1"></i>Delete
                </button>
            </div>
        </div>
    `;
}

// Add event listeners to todo items
function addTodoItemEventListeners() {
  const todoItems = document.querySelectorAll('.todo-item');
  todoItems.forEach((item) => {
    item.addEventListener('click', (e) => {
      if (!e.target.closest('.todo-action-btn')) {
        // Toggle completion on item click
        const todoId = parseInt(item.dataset.id);
        toggleTodo(todoId);
      }
    });
  });
}

// Toggle todo completion status
function toggleTodo(todoId) {
  if (!checkAuthentication()) return;

  const todo = todos.find((t) => t.id === todoId);
  if (!todo) return;

  const updatedData = {
    title: todo.title,
    description: todo.description,
    priority: todo.priority,
    complete: !todo.complete,
  };

  fetch(`/todos/todo/update-todo/${todoId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('access_token')}`,
    },
    body: JSON.stringify(updatedData),
  })
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
      throw new Error('Failed to update todo');
    })
    .then((data) => {
      const index = todos.findIndex((t) => t.id === todoId);
      if (index !== -1) {
        todos[index] = data;
      }
      renderTodos();
      showNotification(
        `Task ${data.complete ? 'marked as complete' : 'marked as pending'}!`,
        'success',
      );
    })
    .catch((error) => {
      console.error('Error toggling todo:', error);
      showNotification('Failed to update todo', 'error');
    });
}

// Edit todo
function editTodo(todoId) {
  const todo = todos.find((t) => t.id === todoId);
  if (!todo) return;

  const taskInput = document.getElementById('task');
  const descriptionInput = document.getElementById('description');
  const prioritySelect = document.getElementById('priority');
  const submitBtn = document.querySelector('#todoform button[type="submit"]');
  const cancelBtn = document.getElementById('cancelEditBtn');

  taskInput.value = todo.title;
  if (descriptionInput) {
    descriptionInput.value = todo.description || todo.title;
  }

  if (prioritySelect) {
    // Convert priority integer back to string for select dropdown
    const priorityMap = {
      0: 'low',
      1: 'medium',
      3: 'high',
      4: 'very_high',
      5: 'urgent',
    };
    prioritySelect.value = priorityMap[todo.priority] || 'medium';
  }

  editingTodoId = todoId;
  submitBtn.innerHTML = '<i class="bi bi-check-circle mr-2"></i>Update Task';

  // Show cancel button
  if (cancelBtn) {
    cancelBtn.style.display = 'block';
  }

  // Focus on input and scroll to form
  taskInput.focus();
  taskInput.scrollIntoView({ behavior: 'smooth' });
}

// Delete todo
function deleteTodo(todoId) {
  if (!checkAuthentication()) return;

  if (!confirm('Are you sure you want to delete this todo?')) {
    return;
  }

  fetch(`/todos/todo/${todoId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('access_token')}`,
    },
  })
    .then((response) => {
      if (response.ok) {
        todos = todos.filter((t) => t.id !== todoId);
        renderTodos();
        showNotification('Todo deleted successfully!', 'success');
      } else {
        throw new Error('Failed to delete todo');
      }
    })
    .catch((error) => {
      console.error('Error deleting todo:', error);
      showNotification('Failed to delete todo', 'error');
    });
}

// Handle search functionality
function handleSearch(e) {
  searchQuery = e.target.value.toLowerCase();
  renderTodos();
}

// Handle filter functionality
function handleFilter(filter) {
  currentFilter = filter;

  // Update active filter button
  document.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');

  renderTodos();
}

// Get filtered todos based on current filter and search
function getFilteredTodos() {
  let filtered = [...todos];

  // Apply search filter
  if (searchQuery) {
    filtered = filtered.filter(
      (todo) =>
        todo.title.toLowerCase().includes(searchQuery) ||
        (todo.description &&
          todo.description.toLowerCase().includes(searchQuery)),
    );
  }

  // Apply status filter
  switch (currentFilter) {
    case 'completed':
      filtered = filtered.filter((todo) => todo.complete);
      break;
    case 'pending':
      filtered = filtered.filter((todo) => !todo.complete);
      break;
    case 'urgent':
      filtered = filtered.filter((todo) => todo.priority === 5);
      break;
    case 'very_high':
      filtered = filtered.filter((todo) => todo.priority === 4);
      break;
    case 'high':
      filtered = filtered.filter((todo) => todo.priority === 3);
      break;
    case 'medium':
      filtered = filtered.filter((todo) => todo.priority === 1);
      break;
    case 'low':
      filtered = filtered.filter((todo) => todo.priority === 0);
      break;
    default:
      // 'all' - no filtering
      break;
  }

  return filtered;
}

// Update statistics
function updateStats() {
  const totalTodos = todos.length;
  const completedTodos = todos.filter((todo) => todo.complete).length;
  const pendingTodos = totalTodos - completedTodos;
  const highPriorityTodos = todos.filter(
    (todo) => todo.priority >= 3 && !todo.complete,
  ).length;

  // Update stats display
  const totalElement = document.getElementById('totalTodos');
  const completedElement = document.getElementById('completedTodos');
  const pendingElement = document.getElementById('pendingTodos');
  const highPriorityElement = document.getElementById('highPriorityTodos');

  if (totalElement) totalElement.textContent = totalTodos;
  if (completedElement) completedElement.textContent = completedTodos;
  if (pendingElement) pendingElement.textContent = pendingTodos;
  if (highPriorityElement) highPriorityElement.textContent = highPriorityTodos;

  // Add admin-specific stats if user is admin
  addAdminStats();
}

// Add admin-specific statistics
function addAdminStats() {
  const token = localStorage.getItem('access_token');
  if (!token) return;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userRole = payload.role;
    const userId = payload.id;

    if (userRole === 'admin') {
      // Add admin note to stats
      const statsContainer = document.querySelector('.stats-container');
      if (statsContainer && !document.getElementById('adminStatsNote')) {
        const adminNote = document.createElement('div');
        adminNote.id = 'adminStatsNote';
        adminNote.className = 'col-span-full text-center mt-2';
        adminNote.innerHTML = `
                    <p class="text-white/80 text-sm">
                        <i class="bi bi-info-circle mr-1"></i>
                        Viewing todos for User ID: ${userId} | 
                        <a href="/admin/admin-page" class="text-blue-300 hover:text-blue-200 underline">
                            View All Users' Todos
                        </a>
                    </p>
                `;
        statsContainer.appendChild(adminNote);
      }
    }
  } catch (error) {
    console.error('Error adding admin stats:', error);
  }
}

// Handle priority change
function handlePriorityChange(e) {
  // This can be used for real-time priority updates if needed
  console.log('Priority changed to:', e.target.value);
}

// Cancel edit mode
function cancelEdit() {
  editingTodoId = null;

  // Clear form fields
  document.getElementById('task').value = '';
  const descriptionInput = document.getElementById('description');
  if (descriptionInput) {
    descriptionInput.value = '';
  }

  // Reset button text
  const submitBtn = document.querySelector('#todoform button[type="submit"]');
  if (submitBtn) {
    submitBtn.innerHTML = '<i class="bi bi-plus-circle mr-2"></i>Add Task';
  }

  // Hide cancel button
  const cancelBtn = document.getElementById('cancelEditBtn');
  if (cancelBtn) {
    cancelBtn.style.display = 'none';
  }

  // Reset priority to default
  const prioritySelect = document.getElementById('priority');
  if (prioritySelect) {
    prioritySelect.value = 'medium';
  }

  showNotification('Edit mode canceled', 'info');
}

// Handle admin navigation
function handleAdminNavigation() {
  console.log('=== Admin Navigation Debug ===');
  console.log('1. Admin navigation triggered');

  // Check if user is admin before redirecting
  if (!isUserAdmin()) {
    console.log('2. User is not authorized for admin access');
    showUnauthorizedMessage();
    return;
  }

  console.log('3. User is authorized - proceeding with redirect');
  showNotification('Redirecting to Admin Panel...', 'info');

  // Try multiple redirect methods
  const adminUrl = '/admin/admin-page';
  console.log('4. Admin URL:', adminUrl);

  // Method 1: Direct window.location.href
  console.log('5. Trying window.location.href...');
  try {
    window.location.href = adminUrl;
    console.log('6. window.location.href executed');
  } catch (error) {
    console.error('7. Error with window.location.href:', error);

    // Method 2: window.location.replace
    console.log('8. Trying window.location.replace...');
    try {
      window.location.replace(adminUrl);
      console.log('9. window.location.replace executed');
    } catch (error2) {
      console.error('10. Error with window.location.replace:', error2);

      // Method 3: Create and click a link
      console.log('11. Trying link click method...');
      const link = document.createElement('a');
      link.href = adminUrl;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log('12. Link click executed');
    }
  }
}

// Handle logout
function handleLogout() {
  // Call backend logout endpoint to clear server-side session
  fetch('/auth/logout', {
    method: 'GET',
    credentials: 'include', // Include cookies in the request
  })
    .then(() => {
      // Clear client-side storage
      localStorage.removeItem('access_token');
      localStorage.removeItem('token_type');

      // Clear cookies
      document.cookie =
        'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

      showNotification('Logged out successfully', 'success');
      setTimeout(() => {
        window.location.href = '/auth/login-page';
      }, 1000);
    })
    .catch((error) => {
      console.error('Logout error:', error);
      // Even if backend logout fails, clear client-side data
      localStorage.removeItem('access_token');
      localStorage.removeItem('token_type');
      document.cookie =
        'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

      showNotification('Logged out successfully', 'success');
      setTimeout(() => {
        window.location.href = '/auth/login-page';
      }, 1000);
    });
}

// Show notification
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full`;

  const bgColor =
    type === 'success'
      ? 'bg-green-500'
      : type === 'error'
      ? 'bg-red-500'
      : type === 'warning'
      ? 'bg-yellow-500'
      : 'bg-blue-500';

  notification.className += ` ${bgColor} text-white`;

  notification.innerHTML = `
        <div class="flex items-center">
            <i class="bi bi-${
              type === 'success'
                ? 'check-circle'
                : type === 'error'
                ? 'exclamation-circle'
                : 'info-circle'
            } mr-2"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white/80 hover:text-white">
                <i class="bi bi-x"></i>
            </button>
        </div>
    `;

  document.body.appendChild(notification);

  // Animate in
  setTimeout(() => {
    notification.classList.remove('translate-x-full');
  }, 100);

  // Auto remove after 5 seconds
  setTimeout(() => {
    notification.classList.add('translate-x-full');
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 300);
  }, 5000);
}

// Setup animations
function setupAnimations() {
  const inputs = document.querySelectorAll('input, select');
  inputs.forEach((input, index) => {
    input.style.animationDelay = `${index * 0.1}s`;
  });
}

// Setup input enhancements
function setupInputEnhancements() {
  const inputs = document.querySelectorAll('input, select');
  inputs.forEach((input) => {
    input.addEventListener('focus', () => {
      input.parentElement.classList.add('focused');
    });

    input.addEventListener('blur', () => {
      input.parentElement.classList.remove('focused');
    });
  });
}

// Utility functions
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return (
    date.toLocaleDateString() +
    ' ' +
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );
}

// Test function for admin navigation (call from browser console)
function testAdminNavigation() {
  console.log('=== Testing Admin Navigation ===');
  console.log('Current URL:', window.location.href);
  console.log('Target URL:', '/admin/admin-page');

  // Test multiple navigation methods
  console.log('Testing Method 1: window.location.href');
  window.location.href = '/admin/admin-page';

  // If that doesn't work, try after a delay
  setTimeout(() => {
    console.log('Testing Method 2: window.location.replace');
    window.location.replace('/admin/admin-page');
  }, 1000);

  // If that doesn't work, try form submission
  setTimeout(() => {
    console.log('Testing Method 3: Form submission');
    const form = document.createElement('form');
    form.method = 'GET';
    form.action = '/admin/admin-page';
    document.body.appendChild(form);
    form.submit();
  }, 2000);
}

// Export functions for global access
window.toggleTodo = toggleTodo;
window.editTodo = editTodo;
window.deleteTodo = deleteTodo;
window.handleLogout = handleLogout;
window.cancelEdit = cancelEdit;
window.handleAdminNavigation = handleAdminNavigation;
window.handleAdminNavigationWithCheck = handleAdminNavigationWithCheck;
window.checkAdminAccess = checkAdminAccess;
window.testAdminNavigation = testAdminNavigation;
window.isUserAdmin = isUserAdmin;
window.showUnauthorizedMessage = showUnauthorizedMessage;

// Setup keyboard shortcuts for admin users
function setupAdminKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Check if user is admin
    if (!isUserAdmin()) return;

    // Ctrl+Shift+A to go to admin panel
    if (e.ctrlKey && e.shiftKey && e.key === 'A') {
      e.preventDefault();
      if (isUserAdmin()) {
        window.location.href = '/admin/admin-page';
        showNotification('Navigating to Admin Panel...', 'info');
      } else {
        showUnauthorizedMessage();
      }
    }

    // Ctrl+Shift+L to logout
    if (e.ctrlKey && e.shiftKey && e.key === 'L') {
      e.preventDefault();
      handleLogout();
    }
  });
}

// Test if admin route is accessible
function testAdminRoute() {
  console.log('=== Testing Admin Route Accessibility ===');

  fetch('/admin/admin-page', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('access_token')}`,
    },
  })
    .then((response) => {
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (response.ok) {
        console.log('✅ Admin route is accessible!');
        showNotification('Admin route is accessible!', 'success');
      } else {
        console.log('❌ Admin route returned status:', response.status);
        showNotification(`Admin route error: ${response.status}`, 'error');
      }
    })
    .catch((error) => {
      console.error('❌ Error accessing admin route:', error);
      showNotification('Error accessing admin route', 'error');
    });
}

// Handle admin navigation with authorization check
function handleAdminNavigationWithCheck() {
  if (!isUserAdmin()) {
    showUnauthorizedMessage();
    return;
  }
  handleAdminNavigation();
}

// Check admin access and prevent navigation if not authorized
function checkAdminAccess(event) {
  if (!isUserAdmin()) {
    event.preventDefault();
    showUnauthorizedMessage();
    return false;
  }
  return true; // Allow navigation
}

window.checkAdminAccess = checkAdminAccess;
