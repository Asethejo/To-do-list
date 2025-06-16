// Application State
class TaskManager {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('mytasks_tasks') || '[]');
        this.categories = JSON.parse(localStorage.getItem('mytasks_categories') || '[]');
        this.settings = JSON.parse(localStorage.getItem('mytasks_settings') || '{}');
        this.currentFilter = 'all';
        this.currentView = 'list';
        this.pomodoroTimer = null;
        this.pomodoroState = {
            isRunning: false,
            timeLeft: 25 * 60, // 25 minutes in seconds
            mode: 'focus', // 'focus' or 'break'
            cycle: 0
        };
        
        this.initializeDefaultCategories();
        this.initializeApp();
    }
    
    initializeDefaultCategories() {
        if (this.categories.length === 0) {
            this.categories = [
                { id: 'inbox', name: 'Inbox', color: '#6366f1', icon: 'inbox', count: 0 },
                { id: 'work', name: 'Work', color: '#ef4444', icon: 'briefcase', count: 0 },
                { id: 'personal', name: 'Personal', color: '#22c55e', icon: 'user', count: 0 },
                { id: 'shopping', name: 'Shopping', color: '#f59e0b', icon: 'shopping-cart', count: 0 },
                { id: 'health', name: 'Health', color: '#ec4899', icon: 'heart', count: 0 }
            ];
            this.saveData();
        }
    }
    
    initializeApp() {
        this.setupEventListeners();
        this.setupTheme();
        this.updateQuote();
        this.renderFeatures();
        this.renderCategories();
        this.renderTasks();
        this.updateCounts();
        this.setupPomodoro();
        this.setupVoiceRecognition();
        this.setupCalendar();
        this.renderAnalytics();
        this.loadBadges();
    }
    
    setupEventListeners() {
        // Navigation
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
        document.getElementById('mobileMenuToggle').addEventListener('click', () => this.toggleMobileMenu());
        document.getElementById('getStartedBtn').addEventListener('click', () => this.openDashboard());
        document.getElementById('signInBtn').addEventListener('click', () => this.showSignInModal());
        
        // Section Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                this.showSection(section);
            });
        });
        
        // Dashboard
        document.getElementById('closeDashboard').addEventListener('click', () => this.closeDashboard());
        document.getElementById('addTaskBtn').addEventListener('click', () => this.openAddTaskModal());
        document.getElementById('closeAddTaskModal').addEventListener('click', () => this.closeAddTaskModal());
        document.getElementById('cancelAddTask').addEventListener('click', () => this.closeAddTaskModal());
        document.getElementById('addTaskForm').addEventListener('submit', (e) => this.handleAddTask(e));
        
        // Sidebar filters
        document.querySelectorAll('.sidebar-menu a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const filter = link.dataset.filter;
                if (filter) {
                    this.setFilter(filter);
                }
            });
        });
        
        // View controls
        document.getElementById('listViewBtn').addEventListener('click', () => this.setView('list'));
        document.getElementById('calendarViewBtn').addEventListener('click', () => this.setView('calendar'));
        document.getElementById('analyticsViewBtn').addEventListener('click', () => this.setView('analytics'));
        
        // Search
        document.getElementById('searchTasks').addEventListener('input', (e) => this.searchTasks(e.target.value));
        
        // Filters
        document.getElementById('priorityFilter').addEventListener('change', () => this.renderTasks());
        document.getElementById('categoryFilter').addEventListener('change', () => this.renderTasks());
        
        // Calendar navigation
        document.getElementById('prevMonth').addEventListener('click', () => this.navigateMonth(-1));
        document.getElementById('nextMonth').addEventListener('click', () => this.navigateMonth(1));
        
        // Newsletter
        document.getElementById('newsletterForm').addEventListener('submit', (e) => this.handleNewsletter(e));
        
        // Voice input
        document.getElementById('voiceInputBtn').addEventListener('click', () => this.startVoiceInput());
        
        // Add category
        document.getElementById('addCategoryBtn').addEventListener('click', () => this.showAddCategoryModal());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
        
        // Window resize
        window.addEventListener('resize', () => this.handleResize());
    }
    
    setupTheme() {
        const savedTheme = localStorage.getItem('mytasks_theme') || 'light';
        if (savedTheme === 'dark') {
            document.body.classList.add('dark');
        }
    }
    
    toggleTheme() {
        document.body.classList.toggle('dark');
        const isDark = document.body.classList.contains('dark');
        localStorage.setItem('mytasks_theme', isDark ? 'dark' : 'light');
    }
    
    toggleMobileMenu() {
        const navMenu = document.getElementById('navMenu');
        navMenu.classList.toggle('active');
    }
    
    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show target section
        document.getElementById(sectionId).classList.add('active');
        
        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');
        
        // Close mobile menu
        document.getElementById('navMenu').classList.remove('active');
    }
    
    openDashboard() {
        document.getElementById('taskDashboard').classList.add('active');
        document.body.style.overflow = 'hidden';
        this.renderTasks();
        this.updateCounts();
    }
    
    closeDashboard() {
        document.getElementById('taskDashboard').classList.remove('active');
        document.body.style.overflow = '';
    }
    
    openAddTaskModal() {
        document.getElementById('addTaskModal').classList.add('active');
        document.getElementById('taskTitle').focus();
        this.populateCategoryOptions();
    }
    
    closeAddTaskModal() {
        document.getElementById('addTaskModal').classList.remove('active');
        document.getElementById('addTaskForm').reset();
    }
    
    populateCategoryOptions() {
        const categorySelect = document.getElementById('taskCategory');
        const filterSelect = document.getElementById('categoryFilter');
        
        // Clear existing options (except "All Categories" for filter)
        categorySelect.innerHTML = '';
        filterSelect.innerHTML = '<option value="all">All Categories</option>';
        
        this.categories.forEach(category => {
            const option1 = document.createElement('option');
            option1.value = category.id;
            option1.textContent = category.name;
            categorySelect.appendChild(option1);
            
            const option2 = document.createElement('option');
            option2.value = category.id;
            option2.textContent = category.name;
            filterSelect.appendChild(option2);
        });
    }
    
    handleAddTask(e) {
        e.preventDefault();
        
        const title = document.getElementById('taskTitle').value.trim();
        const description = document.getElementById('taskDescription').value.trim();
        const priority = document.getElementById('taskPriority').value;
        const category = document.getElementById('taskCategory').value;
        const dueDate = document.getElementById('taskDueDate').value;
        const tags = document.getElementById('taskTags').value.split(',').map(tag => tag.trim()).filter(Boolean);
        
        if (!title) return;
        
        const task = {
            id: Date.now().toString(),
            title,
            description,
            completed: false,
            priority,
            category,
            dueDate: dueDate || null,
            tags,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.addTask(task);
        this.closeAddTaskModal();
        this.showNotification('Task added successfully!', 'success');
    }
    
    addTask(task) {
        this.tasks.unshift(task);
        this.saveData();
        this.renderTasks();
        this.updateCounts();
        this.checkBadges();
        
        // Add AI suggestion
        setTimeout(() => {
            this.showAISuggestion(task);
        }, 1000);
    }
    
    editTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;
        
        // Populate form with task data
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskDescription').value = task.description || '';
        document.getElementById('taskPriority').value = task.priority;
        document.getElementById('taskCategory').value = task.category;
        document.getElementById('taskDueDate').value = task.dueDate || '';
        document.getElementById('taskTags').value = task.tags.join(', ');
        
        // Change form to edit mode
        const form = document.getElementById('addTaskForm');
        form.dataset.editId = taskId;
        
        this.openAddTaskModal();
    }
    
    deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(task => task.id !== taskId);
            this.saveData();
            this.renderTasks();
            this.updateCounts();
            this.showNotification('Task deleted successfully!', 'success');
        }
    }
    
    toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            task.updatedAt = new Date().toISOString();
            this.saveData();
            this.renderTasks();
            this.updateCounts();
            this.checkBadges();
            
            if (task.completed) {
                this.showNotification('Task completed! 🎉', 'success');
                this.addPomodoroSession(taskId);
            }
        }
    }
    
    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active sidebar item
        document.querySelectorAll('.sidebar-menu a').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        
        this.renderTasks();
    }
    
    setView(view) {
        this.currentView = view;
        
        // Update active view button
        document.querySelectorAll('.view-controls .btn-icon').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(`${view}ViewBtn`).classList.add('active');
        
        // Show/hide views
        document.querySelectorAll('.view').forEach(viewEl => {
            viewEl.classList.remove('active');
        });
        document.getElementById(`${view}View`).classList.add('active');
        
        if (view === 'calendar') {
            this.renderCalendar();
        } else if (view === 'analytics') {
            this.renderAnalytics();
        }
    }
    
    getFilteredTasks() {
        let filtered = [...this.tasks];
        
        // Apply main filter
        switch (this.currentFilter) {
            case 'today':
                const today = new Date().toDateString();
                filtered = filtered.filter(task => 
                    task.dueDate && new Date(task.dueDate).toDateString() === today
                );
                break;
            case 'upcoming':
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                filtered = filtered.filter(task => 
                    task.dueDate && new Date(task.dueDate) >= tomorrow
                );
                break;
            case 'completed':
                filtered = filtered.filter(task => task.completed);
                break;
            case 'overdue':
                const now = new Date();
                filtered = filtered.filter(task => 
                    task.dueDate && new Date(task.dueDate) < now && !task.completed
                );
                break;
        }
        
        // Apply priority filter
        const priorityFilter = document.getElementById('priorityFilter')?.value;
        if (priorityFilter && priorityFilter !== 'all') {
            filtered = filtered.filter(task => task.priority === priorityFilter);
        }
        
        // Apply category filter
        const categoryFilter = document.getElementById('categoryFilter')?.value;
        if (categoryFilter && categoryFilter !== 'all') {
            filtered = filtered.filter(task => task.category === categoryFilter);
        }
        
        // Apply search filter
        const searchTerm = document.getElementById('searchTasks')?.value.toLowerCase();
        if (searchTerm) {
            filtered = filtered.filter(task =>
                task.title.toLowerCase().includes(searchTerm) ||
                task.description?.toLowerCase().includes(searchTerm) ||
                task.tags.some(tag => tag.toLowerCase().includes(searchTerm))
            );
        }
        
        return filtered;
    }
    
    renderTasks() {
        const taskList = document.getElementById('taskList');
        const tasks = this.getFilteredTasks();
        
        if (tasks.length === 0) {
            taskList.innerHTML = `
                <div class="empty-state">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 6v6l4 2"/>
                    </svg>
                    <h3>No tasks found</h3>
                    <p>Add a new task or adjust your filters</p>
                </div>
            `;
            return;
        }
        
        taskList.innerHTML = tasks.map(task => this.renderTaskCard(task)).join('');
    }
    
    renderTaskCard(task) {
        const dueDate = task.dueDate ? new Date(task.dueDate) : null;
        const isOverdue = dueDate && dueDate < new Date() && !task.completed;
        const isToday = dueDate && dueDate.toDateString() === new Date().toDateString();
        
        return `
            <div class="task-card ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                <div class="task-header">
                    <div class="task-checkbox ${task.completed ? 'checked' : ''}" 
                         onclick="taskManager.toggleTask('${task.id}')"></div>
                    <h4 class="task-title">${task.title}</h4>
                    <div class="task-actions">
                        <button class="btn-icon" onclick="taskManager.editTask('${task.id}')" title="Edit">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </button>
                        <button class="btn-icon" onclick="taskManager.deleteTask('${task.id}')" title="Delete">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3,6 5,6 21,6"/>
                                <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"/>
                            </svg>
                        </button>
                    </div>
                </div>
                ${task.description ? `<p class="task-description">${task.description}</p>` : ''}
                <div class="task-meta">
                    <span class="task-priority ${task.priority}">${task.priority}</span>
                    <span class="task-category" style="background-color: ${this.getCategoryColor(task.category)}20; color: ${this.getCategoryColor(task.category)}">${this.getCategoryName(task.category)}</span>
                    ${dueDate ? `<span class="task-due-date ${isOverdue ? 'overdue' : ''} ${isToday ? 'today' : ''}">${this.formatDate(dueDate)}</span>` : ''}
                </div>
                ${task.tags.length > 0 ? `
                    <div class="task-tags">
                        ${task.tags.map(tag => `<span class="task-tag">${tag}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    getCategoryColor(categoryId) {
        const category = this.categories.find(c => c.id === categoryId);
        return category ? category.color : '#6366f1';
    }
    
    getCategoryName(categoryId) {
        const category = this.categories.find(c => c.id === categoryId);
        return category ? category.name : 'Unknown';
    }
    
    formatDate(date) {
        const now = new Date();
        const diffTime = date - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Tomorrow';
        if (diffDays === -1) return 'Yesterday';
        if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
        if (diffDays < 7) return `In ${diffDays} days`;
        
        return date.toLocaleDateString();
    }
    
    updateCounts() {
        const counts = {
            all: this.tasks.filter(t => !t.completed).length,
            today: this.tasks.filter(t => {
                if (!t.dueDate) return false;
                return new Date(t.dueDate).toDateString() === new Date().toDateString();
            }).length,
            upcoming: this.tasks.filter(t => {
                if (!t.dueDate) return false;
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                return new Date(t.dueDate) >= tomorrow;
            }).length,
            completed: this.tasks.filter(t => t.completed).length
        };
        
        document.getElementById('inboxCount').textContent = counts.all;
        document.getElementById('todayCount').textContent = counts.today;
        document.getElementById('upcomingCount').textContent = counts.upcoming;
        document.getElementById('completedCount').textContent = counts.completed;
        
        // Update productivity score
        const total = this.tasks.length;
        const completed = counts.completed;
        const score = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        document.getElementById('productivityScore').textContent = `${score}%`;
        
        // Update progress circle
        const circle = document.getElementById('productivityCircle');
        const circumference = 2 * Math.PI * 25; // radius is 25
        const offset = circumference - (score / 100) * circumference;
        circle.style.strokeDashoffset = offset;
    }
    
    renderCategories() {
        const categoriesMenu = document.getElementById('categoriesMenu');
        
        categoriesMenu.innerHTML = this.categories.map(category => `
            <li>
                <a href="#" data-filter="${category.id}">
                    <div class="category-icon" style="background-color: ${category.color}20; color: ${category.color}">
                        ${this.getCategoryIcon(category.icon)}
                    </div>
                    ${category.name}
                    <span class="count">${this.tasks.filter(t => t.category === category.id && !t.completed).length}</span>
                </a>
            </li>
        `).join('');
        
        // Re-attach event listeners
        categoriesMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.setFilter(link.dataset.filter);
            });
        });
    }
    
    getCategoryIcon(iconName) {
        const icons = {
            inbox: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg>',
            briefcase: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16,21V5a2,2,0,0,0-2-2H10a2,2,0,0,0-2,2V21"/></svg>',
            user: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
            'shopping-cart': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>',
            heart: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>'
        };
        return icons[iconName] || icons.inbox;
    }
    
    searchTasks(query) {
        this.renderTasks();
    }
    
    renderFeatures() {
        const features = [
            {
                icon: '➕',
                title: 'Smart Task Creation',
                description: 'Quickly add tasks with natural language processing and auto-categorization.',
                color: '#22c55e'
            },
            {
                icon: '✏️',
                title: 'Easy Editing',
                description: 'Edit tasks inline with powerful rich text editing and markdown support.',
                color: '#3b82f6'
            },
            {
                icon: '📅',
                title: 'Calendar Integration',
                description: 'Sync with Google Calendar and visualize your tasks in timeline view.',
                color: '#8b5cf6'
            },
            {
                icon: '🔔',
                title: 'Smart Reminders',
                description: 'Get intelligent notifications based on your habits and priorities.',
                color: '#f59e0b'
            },
            {
                icon: '🏷️',
                title: 'Categories & Tags',
                description: 'Organize tasks with custom categories, tags, and priority levels.',
                color: '#ec4899'
            },
            {
                icon: '🔄',
                title: 'Drag & Drop',
                description: 'Reorder tasks effortlessly with intuitive drag-and-drop interface.',
                color: '#6366f1'
            },
            {
                icon: '🤖',
                title: 'AI Suggestions',
                description: 'Get personalized task recommendations and productivity insights.',
                color: '#06b6d4'
            },
            {
                icon: '⏰',
                title: 'Pomodoro Timer',
                description: 'Built-in focus timer with customizable work and break intervals.',
                color: '#ef4444'
            },
            {
                icon: '📊',
                title: 'Analytics Dashboard',
                description: 'Track productivity with detailed charts and performance metrics.',
                color: '#10b981'
            },
            {
                icon: '🔍',
                title: 'Advanced Search',
                description: 'Find tasks instantly with powerful search and filtering options.',
                color: '#6b7280'
            },
            {
                icon: '🎤',
                title: 'Voice Input',
                description: 'Add tasks hands-free with voice recognition technology.',
                color: '#7c3aed'
            },
            {
                icon: '🏆',
                title: 'Gamification',
                description: 'Earn badges and maintain streaks to stay motivated.',
                color: '#fbbf24'
            }
        ];
        
        const featuresGrid = document.getElementById('featuresGrid');
        featuresGrid.innerHTML = features.map(feature => `
            <div class="feature-card">
                <div class="feature-icon" style="background-color: ${feature.color}20; color: ${feature.color}">
                    <span style="font-size: 24px">${feature.icon}</span>
                </div>
                <h3>${feature.title}</h3>
                <p>${feature.description}</p>
            </div>
        `).join('');
    }
    
    // Calendar functionality
    setupCalendar() {
        this.currentDate = new Date();
    }
    
    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        document.getElementById('currentMonth').textContent = 
            this.currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        
        const calendarGrid = document.getElementById('calendarGrid');
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        let html = days.map(day => `<div class="calendar-header-day">${day}</div>`).join('');
        
        for (let i = 0; i < 42; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            
            const isCurrentMonth = date.getMonth() === month;
            const isToday = date.toDateString() === new Date().toDateString();
            const hasTasks = this.getTasksForDate(date).length > 0;
            
            html += `
                <div class="calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${hasTasks ? 'has-tasks' : ''}"
                     data-date="${date.toISOString()}">
                    <div class="day-number">${date.getDate()}</div>
                    ${hasTasks ? `<div class="task-indicator">${this.getTasksForDate(date).length}</div>` : ''}
                </div>
            `;
        }
        
        calendarGrid.innerHTML = html;
    }
    
    getTasksForDate(date) {
        return this.tasks.filter(task => {
            if (!task.dueDate) return false;
            return new Date(task.dueDate).toDateString() === date.toDateString();
        });
    }
    
    navigateMonth(direction) {
        this.currentDate.setMonth(this.currentDate.getMonth() + direction);
        this.renderCalendar();
    }
    
    // Analytics functionality
    renderAnalytics() {
        this.updateAnalyticsStats();
        this.renderWeeklyChart();
        this.renderCategoryChart();
    }
    
    updateAnalyticsStats() {
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(t => t.completed).length;
        const streak = this.calculateStreak();
        const avgCompletion = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        document.getElementById('totalTasks').textContent = totalTasks;
        document.getElementById('completedTasks').textContent = completedTasks;
        document.getElementById('currentStreak').textContent = streak;
        document.getElementById('avgCompletion').textContent = `${avgCompletion}%`;
    }
    
    calculateStreak() {
        // Simple streak calculation - consecutive days with completed tasks
        let streak = 0;
        const today = new Date();
        
        for (let i = 0; i < 30; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(today.getDate() - i);
            
            const hasCompletedTasks = this.tasks.some(task => 
                task.completed && 
                new Date(task.updatedAt).toDateString() === checkDate.toDateString()
            );
            
            if (hasCompletedTasks) {
                streak++;
            } else {
                break;
            }
        }
        
        return streak;
    }
    
    renderWeeklyChart() {
        const canvas = document.getElementById('weeklyChart');
        const ctx = canvas.getContext('2d');
        
        // Simple bar chart implementation
        const data = this.getWeeklyData();
        const maxValue = Math.max(...data.map(d => d.completed));
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const barWidth = canvas.width / data.length - 10;
        const maxBarHeight = canvas.height - 40;
        
        data.forEach((day, index) => {
            const x = index * (barWidth + 10) + 5;
            const barHeight = maxValue > 0 ? (day.completed / maxValue) * maxBarHeight : 0;
            const y = canvas.height - barHeight - 20;
            
            // Draw bar
            ctx.fillStyle = '#4F46E5';
            ctx.fillRect(x, y, barWidth, barHeight);
            
            // Draw label
            ctx.fillStyle = '#6B7280';
            ctx.font = '12px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(day.day, x + barWidth / 2, canvas.height - 5);
            
            // Draw value
            if (day.completed > 0) {
                ctx.fillStyle = '#FFFFFF';
                ctx.fillText(day.completed.toString(), x + barWidth / 2, y + 15);
            }
        });
    }
    
    getWeeklyData() {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const today = new Date();
        const weekData = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            
            const completedTasks = this.tasks.filter(task => 
                task.completed && 
                new Date(task.updatedAt).toDateString() === date.toDateString()
            ).length;
            
            weekData.push({
                day: days[date.getDay()],
                completed: completedTasks
            });
        }
        
        return weekData;
    }
    
    renderCategoryChart() {
        const canvas = document.getElementById('categoryChart');
        const ctx = canvas.getContext('2d');
        
        const categoryData = this.categories.map(category => ({
            name: category.name,
            count: this.tasks.filter(t => t.category === category.id).length,
            color: category.color
        })).filter(c => c.count > 0);
        
        if (categoryData.length === 0) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#6B7280';
            ctx.font = '14px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('No data available', canvas.width / 2, canvas.height / 2);
            return;
        }
        
        const total = categoryData.reduce((sum, c) => sum + c.count, 0);
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 20;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        let currentAngle = -Math.PI / 2;
        
        categoryData.forEach(category => {
            const sliceAngle = (category.count / total) * 2 * Math.PI;
            
            // Draw slice
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            ctx.fillStyle = category.color;
            ctx.fill();
            
            // Draw label
            const labelAngle = currentAngle + sliceAngle / 2;
            const labelX = centerX + Math.cos(labelAngle) * (radius + 15);
            const labelY = centerY + Math.sin(labelAngle) * (radius + 15);
            
            ctx.fillStyle = '#374151';
            ctx.font = '12px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(category.name, labelX, labelY);
            
            currentAngle += sliceAngle;
        });
    }
    
    // Pomodoro timer functionality
    setupPomodoro() {
        document.getElementById('togglePomodoro').addEventListener('click', () => this.togglePomodoroWidget());
        document.getElementById('startTimer').addEventListener('click', () => this.startPomodoro());
        document.getElementById('pauseTimer').addEventListener('click', () => this.pausePomodoro());
        document.getElementById('resetTimer').addEventListener('click', () => this.resetPomodoro());
        
        this.updatePomodoroDisplay();
    }
    
    togglePomodoroWidget() {
        const widget = document.getElementById('pomodoroTimer');
        widget.classList.toggle('collapsed');
    }
    
    startPomodoro() {
        if (this.pomodoroState.isRunning) return;
        
        this.pomodoroState.isRunning = true;
        document.getElementById('startTimer').style.display = 'none';
        document.getElementById('pauseTimer').style.display = 'block';
        
        this.pomodoroTimer = setInterval(() => {
            this.pomodoroState.timeLeft--;
            this.updatePomodoroDisplay();
            
            if (this.pomodoroState.timeLeft <= 0) {
                this.completePomodoroSession();
            }
        }, 1000);
    }
    
    pausePomodoro() {
        this.pomodoroState.isRunning = false;
        clearInterval(this.pomodoroTimer);
        
        document.getElementById('startTimer').style.display = 'block';
        document.getElementById('pauseTimer').style.display = 'none';
    }
    
    resetPomodoro() {
        this.pausePomodoro();
        this.pomodoroState.timeLeft = this.pomodoroState.mode === 'focus' ? 25 * 60 : 5 * 60;
        this.updatePomodoroDisplay();
    }
    
    completePomodoroSession() {
        this.pausePomodoro();
        
        if (this.pomodoroState.mode === 'focus') {
            this.pomodoroState.cycle++;
            this.pomodoroState.mode = 'break';
            this.pomodoroState.timeLeft = this.pomodoroState.cycle % 4 === 0 ? 15 * 60 : 5 * 60; // Long break every 4 cycles
            this.showNotification('Focus session complete! Time for a break. 🎉', 'success');
        } else {
            this.pomodoroState.mode = 'focus';
            this.pomodoroState.timeLeft = 25 * 60;
            this.showNotification('Break time over! Ready to focus? 💪', 'info');
        }
        
        this.updatePomodoroDisplay();
        this.playNotificationSound();
    }
    
    updatePomodoroDisplay() {
        const minutes = Math.floor(this.pomodoroState.timeLeft / 60);
        const seconds = this.pomodoroState.timeLeft % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        document.getElementById('timerText').textContent = timeString;
        document.getElementById('timerMode').textContent = 
            this.pomodoroState.mode === 'focus' ? 'Focus Time' : 'Break Time';
        
        // Update progress circle
        const totalTime = this.pomodoroState.mode === 'focus' ? 25 * 60 : 5 * 60;
        const progress = (totalTime - this.pomodoroState.timeLeft) / totalTime;
        const circumference = 2 * Math.PI * 35;
        const offset = circumference - (progress * circumference);
        
        document.getElementById('timerCircle').style.strokeDashoffset = offset;
    }
    
    addPomodoroSession(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.pomodoroSessions = (task.pomodoroSessions || 0) + 1;
            this.saveData();
        }
    }
    
    // Voice recognition functionality
    setupVoiceRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';
            
            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.processVoiceInput(transcript);
            };
            
            this.recognition.onerror = (event) => {
                this.showNotification('Voice recognition error. Please try again.', 'error');
            };
        } else {
            document.getElementById('voiceInputBtn').style.display = 'none';
        }
    }
    
    startVoiceInput() {
        if (this.recognition) {
            this.recognition.start();
            this.showNotification('Listening... Speak your task.', 'info');
        }
    }
    
    processVoiceInput(transcript) {
        // Simple natural language processing
        const task = {
            id: Date.now().toString(),
            title: transcript,
            description: '',
            completed: false,
            priority: this.extractPriority(transcript),
            category: this.extractCategory(transcript),
            dueDate: this.extractDueDate(transcript),
            tags: this.extractTags(transcript),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.addTask(task);
        this.showNotification(`Task added: "${transcript}"`, 'success');
    }
    
    extractPriority(text) {
        const lowWords = ['low', 'minor', 'small'];
        const highWords = ['urgent', 'important', 'critical', 'high', 'asap'];
        
        const lowerText = text.toLowerCase();
        
        if (highWords.some(word => lowerText.includes(word))) return 'high';
        if (lowWords.some(word => lowerText.includes(word))) return 'low';
        return 'medium';
    }
    
    extractCategory(text) {
        const lowerText = text.toLowerCase();
        
        if (lowerText.includes('work') || lowerText.includes('office') || lowerText.includes('meeting')) return 'work';
        if (lowerText.includes('buy') || lowerText.includes('shop') || lowerText.includes('store')) return 'shopping';
        if (lowerText.includes('health') || lowerText.includes('doctor') || lowerText.includes('exercise')) return 'health';
        if (lowerText.includes('personal') || lowerText.includes('home') || lowerText.includes('family')) return 'personal';
        
        return 'inbox';
    }
    
    extractDueDate(text) {
        const lowerText = text.toLowerCase();
        const today = new Date();
        
        if (lowerText.includes('today')) {
            return today.toISOString();
        }
        
        if (lowerText.includes('tomorrow')) {
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);
            return tomorrow.toISOString();
        }
        
        if (lowerText.includes('next week')) {
            const nextWeek = new Date(today);
            nextWeek.setDate(today.getDate() + 7);
            return nextWeek.toISOString();
        }
        
        return null;
    }
    
    extractTags(text) {
        const tags = [];
        const lowerText = text.toLowerCase();
        
        if (lowerText.includes('urgent')) tags.push('urgent');
        if (lowerText.includes('meeting')) tags.push('meeting');
        if (lowerText.includes('call')) tags.push('call');
        if (lowerText.includes('email')) tags.push('email');
        
        return tags;
    }
    
    // Badge system
    loadBadges() {
        this.badges = [
            { id: 'first-task', name: 'Getting Started', description: 'Complete your first task', icon: '🎯', unlocked: false },
            { id: 'task-master', name: 'Task Master', description: 'Complete 10 tasks', icon: '🏆', unlocked: false },
            { id: 'streak-3', name: '3-Day Streak', description: 'Complete tasks for 3 consecutive days', icon: '🔥', unlocked: false },
            { id: 'early-bird', name: 'Early Bird', description: 'Complete a task before 9 AM', icon: '🌅', unlocked: false },
            { id: 'night-owl', name: 'Night Owl', description: 'Complete a task after 10 PM', icon: '🦉', unlocked: false },
            { id: 'pomodoro-pro', name: 'Pomodoro Pro', description: 'Complete 5 pomodoro sessions', icon: '🍅', unlocked: false }
        ];
        
        // Load saved badge states
        const savedBadges = JSON.parse(localStorage.getItem('mytasks_badges') || '[]');
        savedBadges.forEach(savedBadge => {
            const badge = this.badges.find(b => b.id === savedBadge.id);
            if (badge) {
                badge.unlocked = savedBadge.unlocked;
                badge.unlockedAt = savedBadge.unlockedAt;
            }
        });
    }
    
    checkBadges() {
        const completedTasks = this.tasks.filter(t => t.completed);
        const streak = this.calculateStreak();
        
        // First task
        if (completedTasks.length >= 1 && !this.badges.find(b => b.id === 'first-task').unlocked) {
            this.unlockBadge('first-task');
        }
        
        // Task master
        if (completedTasks.length >= 10 && !this.badges.find(b => b.id === 'task-master').unlocked) {
            this.unlockBadge('task-master');
        }
        
        // 3-day streak
        if (streak >= 3 && !this.badges.find(b => b.id === 'streak-3').unlocked) {
            this.unlockBadge('streak-3');
        }
        
        // Early bird / Night owl
        const now = new Date();
        const hour = now.getHours();
        
        if (hour < 9 && !this.badges.find(b => b.id === 'early-bird').unlocked) {
            this.unlockBadge('early-bird');
        }
        
        if (hour >= 22 && !this.badges.find(b => b.id === 'night-owl').unlocked) {
            this.unlockBadge('night-owl');
        }
    }
    
    unlockBadge(badgeId) {
        const badge = this.badges.find(b => b.id === badgeId);
        if (badge && !badge.unlocked) {
            badge.unlocked = true;
            badge.unlockedAt = new Date().toISOString();
            
            localStorage.setItem('mytasks_badges', JSON.stringify(this.badges));
            
            this.showNotification(`🎉 Badge unlocked: ${badge.name}!`, 'success');
            this.showBadgeModal(badge);
        }
    }
    
    showBadgeModal(badge) {
        // Create and show badge unlock animation
        const modal = document.createElement('div');
        modal.className = 'badge-unlock-modal';
        modal.innerHTML = `
            <div class="badge-unlock-content">
                <div class="badge-unlock-icon">${badge.icon}</div>
                <h3>Badge Unlocked!</h3>
                <h4>${badge.name}</h4>
                <p>${badge.description}</p>
                <button onclick="this.parentElement.parentElement.remove()" class="btn-primary">Awesome!</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        setTimeout(() => {
            modal.remove();
        }, 5000);
    }
    
    // Utility functions
    updateQuote() {
        const quotes = [
            { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
            { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
            { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
            { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
            { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
            { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
            { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
            { text: "Life is what happens to you while you're busy making other plans.", author: "John Lennon" }
        ];
        
        const today = new Date().toDateString();
        const savedQuoteDate = localStorage.getItem('mytasks_quote_date');
        
        if (savedQuoteDate !== today) {
            const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
            document.getElementById('quoteText').textContent = randomQuote.text;
            document.getElementById('quoteAuthor').textContent = `- ${randomQuote.author}`;
            
            localStorage.setItem('mytasks_quote_date', today);
            localStorage.setItem('mytasks_daily_quote', JSON.stringify(randomQuote));
        } else {
            const savedQuote = JSON.parse(localStorage.getItem('mytasks_daily_quote') || '{}');
            if (savedQuote.text) {
                document.getElementById('quoteText').textContent = savedQuote.text;
                document.getElementById('quoteAuthor').textContent = `- ${savedQuote.author}`;
            }
        }
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    playNotificationSound() {
        // Create a simple beep sound
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    }
    
    showAISuggestion(task) {
        const suggestions = [
            "Consider breaking this task into smaller subtasks for better progress tracking.",
            "This task might benefit from a time block in your calendar.",
            "Similar tasks are usually completed faster in the morning.",
            "You might want to add relevant tags to organize this better.",
            "Consider setting a reminder for this task if it's time-sensitive."
        ];
        
        const suggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
        this.showNotification(`💡 AI Suggestion: ${suggestion}`, 'info');
    }
    
    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + K for quick add
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            this.openAddTaskModal();
        }
        
        // Escape to close modals
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.active').forEach(modal => {
                modal.classList.remove('active');
            });
            
            if (document.getElementById('taskDashboard').classList.contains('active')) {
                this.closeDashboard();
            }
        }
    }
    
    handleResize() {
        // Re-render charts on resize
        if (this.currentView === 'analytics') {
            setTimeout(() => {
                this.renderAnalytics();
            }, 100);
        }
    }
    
    handleNewsletter(e) {
        e.preventDefault();
        const email = e.target.querySelector('input[type="email"]').value;
        this.showNotification('Thank you for subscribing to our newsletter!', 'success');
        e.target.reset();
    }
    
    showSignInModal() {
        this.showNotification('Sign in functionality coming soon!', 'info');
    }
    
    showAddCategoryModal() {
        const name = prompt('Enter category name:');
        if (name) {
            const color = prompt('Enter category color (hex):') || '#6366f1';
            const category = {
                id: Date.now().toString(),
                name,
                color,
                icon: 'folder',
                count: 0
            };
            
            this.categories.push(category);
            this.saveData();
            this.renderCategories();
            this.populateCategoryOptions();
            this.showNotification('Category added successfully!', 'success');
        }
    }
    
    saveData() {
        localStorage.setItem('mytasks_tasks', JSON.stringify(this.tasks));
        localStorage.setItem('mytasks_categories', JSON.stringify(this.categories));
        localStorage.setItem('mytasks_settings', JSON.stringify(this.settings));
    }
}

// Initialize the application
let taskManager;

document.addEventListener('DOMContentLoaded', () => {
    taskManager = new TaskManager();
});

// Add some CSS for notifications and other dynamic elements
const additionalStyles = `
<style>
.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 8px;
    color: white;
    font-weight: 500;
    z-index: 10000;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    max-width: 300px;
}

.notification.show {
    transform: translateX(0);
}

.notification-success {
    background: linear-gradient(135deg, #22c55e, #16a34a);
}

.notification-error {
    background: linear-gradient(135deg, #ef4444, #dc2626);
}

.notification-info {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
}

.notification-warning {
    background: linear-gradient(135deg, #f59e0b, #d97706);
}

.empty-state {
    text-align: center;
    padding: 60px 20px;
    color: var(--color-text-muted);
}

.empty-state svg {
    margin-bottom: 20px;
    opacity: 0.5;
}

.empty-state h3 {
    margin-bottom: 8px;
    color: var(--color-text-secondary);
}

.badge-unlock-modal {
    position: fixed;
    inset: 0;
    z-index: 10000;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.3s ease;
}

.badge-unlock-content {
    background: var(--color-surface);
    padding: 40px;
    border-radius: 20px;
    text-align: center;
    max-width: 400px;
    animation: bounceIn 0.5s ease;
}

.badge-unlock-icon {
    font-size: 4rem;
    margin-bottom: 20px;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes bounceIn {
    0% { transform: scale(0.3) translateY(-50px); opacity: 0; }
    50% { transform: scale(1.05); }
    70% { transform: scale(0.9); }
    100% { transform: scale(1) translateY(0); opacity: 1; }
}

.calendar-header-day {
    padding: 8px;
    font-weight: 600;
    text-align: center;
    background: var(--color-surface-secondary);
    color: var(--color-text-secondary);
    font-size: 0.875rem;
}

.day-number {
    font-weight: 500;
    margin-bottom: 4px;
}

.task-indicator {
    position: absolute;
    bottom: 4px;
    right: 4px;
    background: var(--color-accent);
    color: white;
    border-radius: 50%;
    width: 16px;
    height: 16px;
    font-size: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
}

.task-description {
    color: var(--color-text-secondary);
    font-size: 0.875rem;
    margin: 8px 0;
    line-height: 1.4;
}

.task-due-date.overdue {
    color: var(--color-error);
    font-weight: 600;
}

.task-due-date.today {
    color: var(--color-warning);
    font-weight: 600;
}

@media (max-width: 768px) {
    .notification {
        top: 10px;
        right: 10px;
        left: 10px;
        max-width: none;
    }
    
    .badge-unlock-content {
        margin: 20px;
        padding: 30px 20px;
    }
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', additionalStyles);