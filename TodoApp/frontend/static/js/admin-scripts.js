// Admin Page JavaScript

class AdminTodoManager {
    constructor() {
        this.todos = [];
        this.filteredTodos = [];
        this.currentFilter = 'all';
        this.searchTerm = '';
        this.selectedUser = '';
        this.deleteTodoId = null;
        
        this.initializeEventListeners();
        this.loadTodos();
    }

    initializeEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value.toLowerCase();
                this.filterTodos();
            });
        }

        // Filter buttons
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                // Remove active class from all buttons
                filterButtons.forEach(btn => btn.classList.remove('active'));
                // Add active class to clicked button
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.filterTodos();
            });
        });

        // User filter
        const userFilter = document.getElementById('userFilter');
        if (userFilter) {
            userFilter.addEventListener('change', (e) => {
                this.selectedUser = e.target.value;
                this.filterTodos();
            });
        }

        // Navigation buttons
        const dashboardBtn = document.getElementById('dashboardBtn');
        if (dashboardBtn) {
            dashboardBtn.addEventListener('click', () => {
                window.location.href = '/todos/todo-page';
            });
        }

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }

        // Modal event listeners
        const closeModal = document.getElementById('closeModal');
        const cancelDelete = document.getElementById('cancelDelete');
        const confirmDelete = document.getElementById('confirmDelete');

        if (closeModal) {
            closeModal.addEventListener('click', () => this.hideDeleteModal());
        }

        if (cancelDelete) {
            cancelDelete.addEventListener('click', () => this.hideDeleteModal());
        }

        if (confirmDelete) {
            confirmDelete.addEventListener('click', () => this.deleteTodo());
        }

        // Close modal when clicking outside
        const modalOverlay = document.getElementById('deleteModal');
        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) {
                    this.hideDeleteModal();
                }
            });
        }
    }

    async loadTodos() {
        try {
            this.showLoading(true);
            
            const response = await fetch('/admin/todo', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    // Unauthorized - redirect to login
                    window.location.href = '/auth/login-page';
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            this.todos = await response.json();
            this.filteredTodos = [...this.todos];
            
            this.updateStats();
            this.populateUserFilter();
            this.renderTodos();
            this.showLoading(false);
            
            // Add admin user info
            this.displayAdminInfo();
            
        } catch (error) {
            console.error('Error loading todos:', error);
            this.showError('Failed to load todos. Please try again.');
            this.showLoading(false);
        }
    }

    updateStats() {
        const totalTodos = this.todos.length;
        const completedTodos = this.todos.filter(todo => todo.complete).length;
        const pendingTodos = totalTodos - completedTodos;
        
        // Count unique users
        const uniqueUsers = new Set(this.todos.map(todo => todo.owner_id)).size;

        // Update stats display
        const totalTodosEl = document.getElementById('totalTodos');
        const totalUsersEl = document.getElementById('totalUsers');
        const completedTodosEl = document.getElementById('completedTodos');
        const pendingTodosEl = document.getElementById('pendingTodos');

        if (totalTodosEl) totalTodosEl.textContent = totalTodos;
        if (totalUsersEl) totalUsersEl.textContent = uniqueUsers;
        if (completedTodosEl) completedTodosEl.textContent = completedTodos;
        if (pendingTodosEl) pendingTodosEl.textContent = pendingTodos;
    }

    populateUserFilter() {
        const userFilter = document.getElementById('userFilter');
        if (!userFilter) return;

        // Clear existing options except "All Users"
        userFilter.innerHTML = '<option value="">All Users</option>';

        // Get unique user IDs
        const uniqueUsers = [...new Set(this.todos.map(todo => todo.owner_id))];
        
        uniqueUsers.forEach(userId => {
            const option = document.createElement('option');
            option.value = userId;
            option.textContent = `User ${userId}`;
            userFilter.appendChild(option);
        });
    }

    filterTodos() {
        this.filteredTodos = this.todos.filter(todo => {
            // Search filter
            const matchesSearch = !this.searchTerm || 
                todo.title?.toLowerCase().includes(this.searchTerm) ||
                todo.description?.toLowerCase().includes(this.searchTerm) ||
                `user ${todo.owner_id}`.toLowerCase().includes(this.searchTerm);

            // User filter
            const matchesUser = !this.selectedUser || todo.owner_id.toString() === this.selectedUser;

            // Status filter
            let matchesStatus = true;
            if (this.currentFilter === 'completed') {
                matchesStatus = todo.complete;
            } else if (this.currentFilter === 'pending') {
                matchesStatus = !todo.complete;
            }

            // Priority filter
            let matchesPriority = true;
            if (this.currentFilter === 'urgent') {
                matchesPriority = todo.priority === 5;
            } else if (this.currentFilter === 'very_high') {
                matchesPriority = todo.priority === 4;
            } else if (this.currentFilter === 'high') {
                matchesPriority = todo.priority === 3;
            } else if (this.currentFilter === 'medium') {
                matchesPriority = todo.priority === 2;
            } else if (this.currentFilter === 'low') {
                matchesPriority = todo.priority === 1;
            }

            return matchesSearch && matchesUser && matchesStatus && matchesPriority;
        });

        this.renderTodos();
    }

    renderTodos() {
        const todoList = document.getElementById('adminTodoList');
        const emptyState = document.getElementById('emptyState');

        if (!todoList) return;

        if (this.filteredTodos.length === 0) {
            todoList.innerHTML = '';
            if (emptyState) {
                emptyState.style.display = 'block';
            }
            return;
        }

        if (emptyState) {
            emptyState.style.display = 'none';
        }

        todoList.innerHTML = this.filteredTodos.map(todo => this.createTodoElement(todo)).join('');
    }

    createTodoElement(todo) {
        const priorityMap = {
            1: { text: 'Low', class: 'priority-low' },
            2: { text: 'Medium', class: 'priority-medium' },
            3: { text: 'High', class: 'priority-high' },
            4: { text: 'Very High', class: 'priority-very_high' },
            5: { text: 'Urgent', class: 'priority-urgent' }
        };

        const priority = priorityMap[todo.priority] || { text: 'Unknown', class: 'priority-medium' };
        const statusClass = todo.complete ? 'status-complete' : 'status-pending';
        const statusText = todo.complete ? 'Completed' : 'Pending';
        const completedClass = todo.complete ? 'completed' : '';

        return `
            <div class="admin-todo-item ${completedClass} animate-slide-in" data-todo-id="${todo.id}">
                <div class="todo-text">
                    ${todo.title}
                    <span class="priority-badge ${priority.class}">${priority.text}</span>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </div>
                
                ${todo.description ? `<div class="todo-description">${todo.description}</div>` : ''}
                
                <div class="todo-meta">
                    <span class="todo-user">User ${todo.owner_id}</span>
                    <span class="text-white/60 text-xs">ID: ${todo.id}</span>
                </div>
                
                <div class="todo-actions">
                    <button class="todo-action-btn delete" onclick="adminManager.showDeleteModal(${todo.id}, '${todo.title}', ${todo.owner_id})">
                        <i class="bi bi-trash mr-1"></i>Delete
                    </button>
                    <button class="todo-action-btn view" onclick="adminManager.viewTodoDetails(${todo.id})">
                        <i class="bi bi-eye mr-1"></i>View Details
                    </button>
                </div>
            </div>
        `;
    }

    showDeleteModal(todoId, todoTitle, userId) {
        this.deleteTodoId = todoId;
        
        const modal = document.getElementById('deleteModal');
        const deleteTodoTitle = document.getElementById('deleteTodoTitle');
        const deleteTodoUser = document.getElementById('deleteTodoUser');

        if (deleteTodoTitle) deleteTodoTitle.textContent = todoTitle;
        if (deleteTodoUser) deleteTodoUser.textContent = `User ${userId}`;
        if (modal) modal.style.display = 'flex';
    }

    hideDeleteModal() {
        const modal = document.getElementById('deleteModal');
        if (modal) modal.style.display = 'none';
        this.deleteTodoId = null;
    }

    async deleteTodo() {
        if (!this.deleteTodoId) return;

        try {
            const response = await fetch(`/admin/todo/${this.deleteTodoId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    window.location.href = '/auth/login-page';
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Remove todo from local arrays
            this.todos = this.todos.filter(todo => todo.id !== this.deleteTodoId);
            this.filteredTodos = this.filteredTodos.filter(todo => todo.id !== this.deleteTodoId);

            // Update UI
            this.updateStats();
            this.renderTodos();
            this.hideDeleteModal();
            this.showSuccess('Todo deleted successfully!');

        } catch (error) {
            console.error('Error deleting todo:', error);
            this.showError('Failed to delete todo. Please try again.');
        }
    }

    viewTodoDetails(todoId) {
        const todo = this.todos.find(t => t.id === todoId);
        if (!todo) return;

        const priorityMap = {
            1: 'Low',
            2: 'Medium', 
            3: 'High',
            4: 'Very High',
            5: 'Urgent'
        };

        const details = `
            Todo ID: ${todo.id}
            Title: ${todo.title}
            Description: ${todo.description || 'No description'}
            Priority: ${priorityMap[todo.priority] || 'Unknown'}
            Status: ${todo.complete ? 'Completed' : 'Pending'}
            Owner ID: ${todo.owner_id}
        `;

        alert(details);
    }

    showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.style.display = show ? 'block' : 'none';
        }
    }

    showSuccess(message) {
        // Create a simple success notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    showError(message) {
        // Create a simple error notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    getToken() {
        // Get token from localStorage or cookies - use the same key as todo scripts
        return localStorage.getItem('access_token') || this.getCookie('access_token');
    }

    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }

    logout() {
        // Call backend logout endpoint to clear server-side session
        fetch('/auth/logout', {
            method: 'GET',
            credentials: 'include' // Include cookies in the request
        })
        .then(() => {
            // Clear client-side storage
            localStorage.removeItem('access_token');
            localStorage.removeItem('token_type');
            
            // Clear cookies
            document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            
            this.showSuccess('Logged out successfully');
            setTimeout(() => {
                window.location.href = '/auth/login-page';
            }, 1000);
        })
        .catch(error => {
            console.error('Logout error:', error);
            // Even if backend logout fails, clear client-side data
            localStorage.removeItem('access_token');
            localStorage.removeItem('token_type');
            document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            
            this.showSuccess('Logged out successfully');
            setTimeout(() => {
                window.location.href = '/auth/login-page';
            }, 1000);
        });
    }

    displayAdminInfo() {
        const token = this.getToken();
        if (!token) return;
        
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const username = payload.sub;
            const userId = payload.id;
            
            // Add admin info to the header
            const header = document.querySelector('.text-center.mb-6');
            if (header) {
                const adminInfo = document.createElement('div');
                adminInfo.className = 'mt-2';
                adminInfo.innerHTML = `
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <i class="bi bi-person-check mr-1"></i>Logged in as: ${username} (ID: ${userId})
                    </span>
                `;
                header.appendChild(adminInfo);
            }
        } catch (error) {
            console.error('Error displaying admin info:', error);
        }
    }
}

// Initialize admin manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminManager = new AdminTodoManager();
}); 