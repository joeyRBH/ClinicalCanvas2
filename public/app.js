// ==========================================
// HealthCanvas - Main Application
// ==========================================

// Global State
const AppState = {
    user: null,
    token: null,
    currentSection: 'dashboard'
};

// API Base URL
const API_BASE = window.location.origin;

// ==========================================
// Authentication
// ==========================================

function initAuth() {
    const loginForm = document.getElementById('login-form');
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');

    // Check for existing session
    const token = localStorage.getItem('healthcanvas_token');
    if (token) {
        AppState.token = token;
        showApp();
        loadUserData();
    }

    // Login form submit
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            showLoading('Signing in...');

            try {
                const response = await fetch(`${API_BASE}/api/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();
                hideLoading();

                if (data.success || data.token) {
                    AppState.token = data.token;
                    AppState.user = data.user;
                    localStorage.setItem('healthcanvas_token', data.token);
                    showApp();
                    loadDashboard();
                } else {
                    alert('Login failed: ' + (data.error || 'Unknown error'));
                }
            } catch (error) {
                hideLoading();
                console.error('Login error:', error);
                alert('Login error: ' + error.message);
            }
        });
    }

    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }

    function showApp() {
        if (authContainer) authContainer.style.display = 'none';
        if (appContainer) appContainer.style.display = 'block';
    }

    function logout() {
        localStorage.removeItem('healthcanvas_token');
        AppState.token = null;
        AppState.user = null;
        location.reload();
    }
}

async function loadUserData() {
    // Load user profile and update UI
    const userName = document.getElementById('user-name');
    const userAvatar = document.getElementById('user-avatar');

    // For now, use placeholder data
    // In production, this would call /api/user-profile
    if (userName) userName.textContent = 'Dr. Smith';
    if (userAvatar) userAvatar.textContent = 'DS';
}

// ==========================================
// Navigation
// ==========================================

function initNavigation() {
    const menuItems = document.querySelectorAll('.menu-item');
    const sections = document.querySelectorAll('.content-section');

    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = item.getAttribute('data-section');
            navigateToSection(sectionId);
        });
    });

    // User menu dropdown
    const userMenu = document.getElementById('user-menu');
    const userDropdown = document.getElementById('user-dropdown');

    if (userMenu && userDropdown) {
        userMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = userDropdown.style.display === 'block';
            userDropdown.style.display = isVisible ? 'none' : 'block';
        });

        document.addEventListener('click', () => {
            userDropdown.style.display = 'none';
        });
    }

    // Handle hash navigation
    window.addEventListener('hashchange', () => {
        const hash = window.location.hash.substring(1);
        if (hash) navigateToSection(hash);
    });

    // Initial hash
    const initialHash = window.location.hash.substring(1);
    if (initialHash) navigateToSection(initialHash);
}

function navigateToSection(sectionId) {
    // Update active menu item
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-section') === sectionId) {
            item.classList.add('active');
        }
    });

    // Show active section
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });

    const activeSection = document.getElementById(sectionId);
    if (activeSection) {
        activeSection.classList.add('active');
        activeSection.style.display = 'block';
    }

    AppState.currentSection = sectionId;
    window.location.hash = sectionId;

    // Load section data
    loadSectionData(sectionId);
}

// ==========================================
// Dashboard
// ==========================================

async function loadDashboard() {
    try {
        showLoading('Loading dashboard...');

        // Load dashboard stats from new API
        const response = await apiCall('/api/dashboard-stats');

        hideLoading();

        if (response.success && response.data) {
            const { stats, today_appointments, recent_activity } = response.data;

            // Update stat cards with real data
            updateStatCard('stat-appointments', stats.appointments_today);
            updateStatCard('stat-clients', stats.active_clients);
            updateStatCard('stat-messages', stats.unread_messages);
            updateStatCard('stat-revenue', `$${stats.weekly_revenue.toFixed(2)}`);

            // Update badge counts
            const messagesCount = document.getElementById('messages-count');
            if (messagesCount) messagesCount.textContent = stats.unread_messages;

            // Load today's schedule with real data
            displayTodaySchedule(today_appointments);

            // Load recent activity with real data
            displayRecentActivity(recent_activity);

        } else {
            // Fallback to loading individual endpoints
            await loadDashboardFallback();
        }

    } catch (error) {
        console.error('Dashboard load error:', error);
        hideLoading();
        await loadDashboardFallback();
    }
}

async function loadDashboardFallback() {
    // Fallback method if dashboard-stats API fails
    try {
        updateStatCard('stat-appointments', 0);
        updateStatCard('stat-clients', 0);
        updateStatCard('stat-messages', 0);
        updateStatCard('stat-revenue', '$0.00');

        await loadTodaySchedule();
        await loadRecentActivity();
    } catch (error) {
        console.error('Fallback load error:', error);
    }
}

function updateStatCard(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

async function loadTodaySchedule() {
    const container = document.getElementById('today-schedule');
    if (!container) return;

    try {
        const response = await apiCall('/api/appointments');

        if (response.success && response.data && response.data.length > 0) {
            const today = new Date().toISOString().split('T')[0];
            const todayAppointments = response.data.filter(apt =>
                apt.appointment_date === today
            ).slice(0, 5);

            if (todayAppointments.length > 0) {
                container.innerHTML = todayAppointments.map(apt => `
                    <div class="appointment-item">
                        <div class="appointment-time">${apt.appointment_time}</div>
                        <div class="appointment-client">${apt.client_name || 'Unknown Client'}</div>
                        <div class="appointment-type">${apt.type || 'Appointment'}</div>
                    </div>
                `).join('');
            } else {
                container.innerHTML = '<p class="text-center">No appointments scheduled for today</p>';
            }
        } else {
            container.innerHTML = '<p class="text-center">No appointments found</p>';
        }
    } catch (error) {
        console.error('Error loading today schedule:', error);
        container.innerHTML = '<p class="text-center text-secondary">Unable to load appointments</p>';
    }
}

function displayTodaySchedule(appointments) {
    const container = document.getElementById('today-schedule');
    if (!container) return;

    if (appointments && appointments.length > 0) {
        container.innerHTML = appointments.map(apt => `
            <div class="appointment-item" style="padding: 16px; border-bottom: 1px solid var(--border-light); cursor: pointer; transition: background 0.2s;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="flex: 1;">
                        <div style="font-size: 16px; font-weight: 600; color: var(--primary-color); margin-bottom: 4px;">
                            ${apt.appointment_time} ${apt.modality === 'telehealth' ? '<i class="fas fa-video" style="font-size: 12px; margin-left: 8px;"></i>' : ''}
                        </div>
                        <div style="font-size: 14px; font-weight: 500; margin-bottom: 2px;">${apt.client_name || 'Unknown Client'}</div>
                        <div style="font-size: 13px; color: var(--text-secondary);">
                            ${apt.type || 'Appointment'} • ${apt.duration || 60} min
                        </div>
                    </div>
                    <div class="status-badge" style="padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;
                        ${apt.status === 'completed' ? 'background: #d1fae5; color: #065f46;' :
                          apt.status === 'confirmed' ? 'background: #dbeafe; color: #1e40af;' :
                          'background: #fef3c7; color: #92400e;'}">
                        ${apt.status || 'scheduled'}
                    </div>
                </div>
            </div>
        `).join('');
    } else {
        container.innerHTML = `
            <div class="text-center" style="padding: 48px 24px; color: var(--text-secondary);">
                <i class="fas fa-calendar-day" style="font-size: 48px; margin-bottom: 16px; opacity: 0.3;"></i>
                <p style="margin: 0; font-size: 16px;">No appointments scheduled for today</p>
                <button class="btn btn-sm btn-primary" style="margin-top: 16px;" onclick="navigateToSection('appointments')">
                    <i class="fas fa-plus"></i> Schedule Appointment
                </button>
            </div>
        `;
    }
}

function displayRecentActivity(activities) {
    const container = document.getElementById('recent-activity');
    if (!container) return;

    if (activities && activities.length > 0) {
        container.innerHTML = activities.map(act => {
            const timeAgo = getTimeAgo(act.timestamp);
            return `
                <div class="activity-item" style="padding: 12px; border-bottom: 1px solid var(--border-light);">
                    <div style="display: flex; gap: 12px; align-items: start;">
                        <i class="fas ${act.icon}" style="color: var(--primary-color); margin-top: 4px; font-size: 16px;"></i>
                        <div style="flex: 1;">
                            <p style="margin: 0; font-size: 14px; line-height: 1.5;">${act.text}</p>
                            <span style="font-size: 12px; color: var(--text-tertiary);">${timeAgo}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } else {
        container.innerHTML = `
            <div class="text-center" style="padding: 48px 24px; color: var(--text-secondary);">
                <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 16px; opacity: 0.3;"></i>
                <p style="margin: 0;">No recent activity</p>
            </div>
        `;
    }
}

async function loadRecentActivity() {
    // Kept for fallback compatibility
    const container = document.getElementById('recent-activity');
    if (!container) return;

    container.innerHTML = `
        <div class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
            Loading activity...
        </div>
    `;
}

// ==========================================
// Section Data Loading
// ==========================================

async function loadSectionData(sectionId) {
    switch (sectionId) {
        case 'dashboard':
            await loadDashboard();
            break;
        case 'appointments':
            await loadAppointments();
            break;
        case 'clients':
            await loadClients();
            break;
        case 'clinical-notes':
            await loadClinicalNotes();
            break;
        // Add more cases as sections are implemented
        default:
            console.log(`Section ${sectionId} not yet implemented`);
    }
}

async function loadAppointments() {
    const container = document.getElementById('appointments-list');
    if (!container) return;

    try {
        showLoading('Loading appointments...');

        const response = await apiCall('/api/appointments');

        hideLoading();

        if (response.success && response.data) {
            let appointments = response.data;

            // Sort by date and time (newest first)
            appointments.sort((a, b) => {
                const dateCompare = new Date(b.appointment_date) - new Date(a.appointment_date);
                if (dateCompare !== 0) return dateCompare;
                return (b.appointment_time || '').localeCompare(a.appointment_time || '');
            });

            displayAppointments(appointments);
            initAppointmentFilters(appointments);
        } else {
            container.innerHTML = `
                <div class="section-placeholder">
                    <i class="fas fa-calendar-alt"></i>
                    <p>No appointments found</p>
                    <button class="btn btn-primary" onclick="showNotification('Appointment creation coming soon!')">
                        <i class="fas fa-plus"></i> Schedule First Appointment
                    </button>
                </div>
            `;
        }
    } catch (error) {
        hideLoading();
        console.error('Error loading appointments:', error);
        container.innerHTML = `
            <div class="section-placeholder">
                <i class="fas fa-exclamation-circle" style="color: var(--danger-color);"></i>
                <p>Failed to load appointments</p>
            </div>
        `;
    }
}

function displayAppointments(appointments) {
    const container = document.getElementById('appointments-list');
    if (!appointments || appointments.length === 0) {
        container.innerHTML = `
            <div class="section-placeholder">
                <i class="fas fa-calendar-alt"></i>
                <p>No appointments found</p>
            </div>
        `;
        return;
    }

    container.innerHTML = appointments.map(apt => `
        <div class="card" style="margin-bottom: 16px;">
            <div style="padding: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: start; flex-wrap: wrap; gap: 16px;">
                    <div style="flex: 1; min-width: 200px;">
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                            <div style="font-size: 24px; font-weight: 700; color: var(--primary-color);">
                                ${formatTime(apt.appointment_time)}
                            </div>
                            ${apt.modality === 'telehealth' ? '<i class="fas fa-video" style="color: var(--info-color); font-size: 18px;" title="Telehealth"></i>' : ''}
                        </div>
                        <div style="font-size: 18px; font-weight: 600; margin-bottom: 4px;">
                            ${apt.client_name || 'Unknown Client'}
                        </div>
                        <div style="color: var(--text-secondary); font-size: 14px;">
                            ${formatDate(apt.appointment_date)} • ${apt.duration || 60} minutes
                        </div>
                        ${apt.type ? `<div style="color: var(--text-tertiary); font-size: 13px; margin-top: 4px;">${apt.type}</div>` : ''}
                    </div>
                    <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
                        <div class="status-badge" style="padding: 6px 16px; border-radius: 16px; font-size: 13px; font-weight: 600; text-transform: capitalize;
                            ${apt.status === 'completed' ? 'background: #d1fae5; color: #065f46;' :
                              apt.status === 'confirmed' ? 'background: #dbeafe; color: #1e40af;' :
                              apt.status === 'cancelled' ? 'background: #fee2e2; color: #991b1b;' :
                              'background: #fef3c7; color: #92400e;'}">
                            ${apt.status || 'scheduled'}
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <button class="btn btn-sm btn-secondary" onclick="showNotification('View details coming soon!')">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-secondary" onclick="showNotification('Edit coming soon!')">
                                <i class="fas fa-edit"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function initAppointmentFilters(allAppointments) {
    const dateFilter = document.getElementById('appointment-date-filter');
    const statusFilter = document.getElementById('appointment-status-filter');
    const modalityFilter = document.getElementById('appointment-modality-filter');
    const clearBtn = document.getElementById('clear-filters');

    const applyFilters = () => {
        let filtered = [...allAppointments];

        if (dateFilter.value) {
            filtered = filtered.filter(apt => apt.appointment_date === dateFilter.value);
        }
        if (statusFilter.value) {
            filtered = filtered.filter(apt => apt.status === statusFilter.value);
        }
        if (modalityFilter.value) {
            filtered = filtered.filter(apt => apt.modality === modalityFilter.value);
        }

        displayAppointments(filtered);
    };

    dateFilter.addEventListener('change', applyFilters);
    statusFilter.addEventListener('change', applyFilters);
    modalityFilter.addEventListener('change', applyFilters);
    clearBtn.addEventListener('click', () => {
        dateFilter.value = '';
        statusFilter.value = '';
        modalityFilter.value = '';
        displayAppointments(allAppointments);
    });
}

async function loadClients() {
    const tbody = document.getElementById('clients-table-body');
    if (!tbody) return;

    try {
        showLoading('Loading clients...');

        const response = await apiCall('/api/clients');

        hideLoading();

        if (response.success && response.data) {
            let clients = response.data;
            displayClients(clients);
            initClientSearch(clients);
        } else {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="section-placeholder">
                        <i class="fas fa-users"></i>
                        <p>No clients found</p>
                    </td>
                </tr>
            `;
        }
    } catch (error) {
        hideLoading();
        console.error('Error loading clients:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="section-placeholder">
                    <i class="fas fa-exclamation-circle" style="color: var(--danger-color);"></i>
                    <p>Failed to load clients</p>
                </td>
            </tr>
        `;
    }
}

function displayClients(clients) {
    const tbody = document.getElementById('clients-table-body');
    if (!clients || clients.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="section-placeholder">
                    <i class="fas fa-users"></i>
                    <p>No clients found</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = clients.map(client => `
        <tr style="border-bottom: 1px solid var(--border-light); transition: background 0.2s;"
            onmouseover="this.style.background='var(--background-color)'"
            onmouseout="this.style.background='transparent'">
            <td style="padding: 16px;">
                <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 2px;">${client.name}</div>
            </td>
            <td style="padding: 16px; color: var(--text-secondary);">${client.email || '—'}</td>
            <td style="padding: 16px; color: var(--text-secondary);">${client.phone || '—'}</td>
            <td style="padding: 16px; color: var(--text-secondary);">${client.dob ? formatDate(client.dob) : '—'}</td>
            <td style="padding: 16px; color: var(--text-secondary);">${formatDate(client.created_at)}</td>
            <td style="padding: 16px; text-align: center;">
                <button class="btn btn-sm btn-secondary" onclick="showNotification('View client details coming soon!')" title="View Details">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function initClientSearch(allClients) {
    const searchInput = document.getElementById('client-search');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();

        if (!query) {
            displayClients(allClients);
            return;
        }

        const filtered = allClients.filter(client =>
            (client.name && client.name.toLowerCase().includes(query)) ||
            (client.email && client.email.toLowerCase().includes(query)) ||
            (client.phone && client.phone.includes(query))
        );

        displayClients(filtered);
    });
}

async function loadClinicalNotes() {
    console.log('Loading clinical notes...');
    showNotification('Clinical notes interface coming soon!', 'info');
}

// ==========================================
// API Helper Functions
// ==========================================

async function apiCall(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (AppState.token) {
        headers['Authorization'] = `Bearer ${AppState.token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
    });

    const data = await response.json();
    return data;
}

// ==========================================
// Utility Functions
// ==========================================

function showLoading(message = 'Loading...') {
    const overlay = document.getElementById('loading-overlay');
    const text = document.querySelector('.loading-text');
    if (text) text.textContent = message;
    if (overlay) overlay.classList.add('active');
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.classList.remove('active');
}

function showNotification(message, type = 'info') {
    // Simple notification system
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? 'var(--danger-color)' : 'var(--success-color)'};
        color: white;
        padding: 16px 24px;
        border-radius: var(--border-radius-sm);
        box-shadow: var(--shadow-medium);
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function getTimeAgo(timestamp) {
    if (!timestamp) return 'Just now';

    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return past.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

function formatTime(time) {
    if (!time) return '';
    // Convert 24h format to 12h format
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
}

// ==========================================
// Event Listeners
// ==========================================

function initEventListeners() {
    // Quick Add button
    const quickAddBtn = document.getElementById('quick-add-btn');
    if (quickAddBtn) {
        quickAddBtn.addEventListener('click', () => {
            showNotification('Quick Add feature coming soon!', 'info');
        });
    }

    // View Full Calendar button
    const viewCalendarBtn = document.getElementById('view-full-calendar');
    if (viewCalendarBtn) {
        viewCalendarBtn.addEventListener('click', () => {
            navigateToSection('calendar');
        });
    }

    // Notification badge counters
    updateBadgeCounts();
}

function updateBadgeCounts() {
    const notificationsCount = document.getElementById('notifications-count');
    const messagesCount = document.getElementById('messages-count');

    // In production, these would be fetched from API
    if (notificationsCount) notificationsCount.textContent = '3';
    if (messagesCount) messagesCount.textContent = '5';
}

// ==========================================
// Initialization
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('HealthCanvas initializing...');

    initAuth();
    initNavigation();
    initEventListeners();

    console.log('HealthCanvas ready!');
});

// Add CSS animation for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }

    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100px);
        }
    }
`;
document.head.appendChild(style);
