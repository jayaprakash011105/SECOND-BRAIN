/**
 * app.js - Core Application Logic
 * Contains global utilities, UI components, and dashboard interactivity.
 */

// 1. Global Utilities
window.utils = {
    /**
     * Escapes HTML special characters to prevent XSS.
     */
    escapeHtml: function(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Formats a date string.
     */
    formatDate: function(dateStr) {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return date.toLocaleDateString();
    }
};

// 2. Toast Notification System
window.showToast = function(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 12px;
            pointer-events: none;
        `;
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.style.cssText = `
        padding: 12px 20px;
        border-radius: 8px;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        font-weight: 500;
        font-size: 0.875rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        transform: translateY(20px);
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        pointer-events: auto;
    `;
    toast.textContent = message;
    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
        toast.style.transform = 'translateY(0)';
        toast.style.opacity = '1';
    });

    // Remove after delay
    setTimeout(() => {
        toast.style.transform = 'translateY(10px)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

// 3. Confirmation Dialog
window.confirmDelete = function(message = 'Are you sure you want to delete this?') {
    return new Promise((resolve) => {
        const confirmed = window.confirm(message);
        resolve(confirmed);
    });
};

// 4. Quick Capture Component
window.quickCapture = {
    toggleModal: function() {
        // Find or create a simple capture modal
        let modal = document.getElementById('quickCaptureModal');
        if (!modal) {
            this.createModal();
            modal = document.getElementById('quickCaptureModal');
        }
        modal.classList.toggle('active');
    },

    createModal: function() {
        const modalHtml = `
            <div class="modal-overlay" id="quickCaptureModal">
                <div class="modal card-premium">
                    <div class="modal-header">
                        <h2 class="modal-title">✨ Quick Capture</h2>
                        <button class="modal-close" onclick="quickCapture.toggleModal()">×</button>
                    </div>
                    <div class="form-group">
                        <label class="form-label">What's on your mind?</label>
                        <textarea id="captureInput" class="form-input" rows="3" placeholder="Type something..."></textarea>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="quickCapture.toggleModal()">Cancel</button>
                        <button class="btn btn-primary" onclick="quickCapture.save()">Save to Inbox</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    save: function() {
        const input = document.getElementById('captureInput');
        const text = input.value.trim();
        if (text) {
            // Save to tasks backlog by default
            if (window.dataManager) {
                window.dataManager.addItem('tasks', {
                    name: text,
                    status: 'Backlog',
                    priority: 'Medium',
                    timeBlock: '15m'
                });
                window.showToast('Captured to Backlog!');
                input.value = '';
                this.toggleModal();
            }
        }
    }
};

// 5. Live Dashboard Interactivity
window.liveDashboard = {
    updateDisplay: function(groupId, iconKey) {
        // This is called on hover in index.html
        // The actual logic is handled in index.html's inline script, 
        // but we provide the object here to avoid errors.
        console.log(`Dashboard Group ${groupId} updated to ${iconKey}`);
    }
};

// 6. Global Initialization
document.addEventListener('DOMContentLoaded', () => {
    console.log('Second Brain App Initialized');
    
    // Global modal close on overlay click
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            e.target.classList.remove('active');
        }
    });
});
