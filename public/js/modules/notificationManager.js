// Mòdul de notificacions toast reutilitzable

class NotificationManager {
    constructor() {
        this.containerId = 'notification-toast-container';
        this.defaultTimeout = 4000;
        this.ensureContainer();
    }

    ensureContainer() {
        if (!document.getElementById(this.containerId)) {
            const container = document.createElement('div');
            container.id = this.containerId;
            container.style.position = 'fixed';
            container.style.top = '1.5rem';
            container.style.right = '1.5rem';
            container.style.zIndex = '9999';
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.gap = '0.75rem';
            container.style.maxWidth = '350px';
            document.body.appendChild(container);
        }
    }

    show(message, type = 'info', timeout = this.defaultTimeout) {
        this.ensureContainer();
        const container = document.getElementById(this.containerId);
        const toast = document.createElement('div');
        toast.className = `notification-toast notification-toast-${type}`;
        toast.innerHTML = `
            <span class="notification-toast-message">${message}</span>
            <button class="notification-toast-close" aria-label="Tanca">&times;</button>
        `;
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        toast.style.transition = 'opacity 0.3s, transform 0.3s';

        // Tancar manualment
        toast.querySelector('.notification-toast-close').onclick = () => {
            this.hideToast(toast);
        };

        // Afegir al contenidor
        container.appendChild(toast);
        // Forçar reflow per animació
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        }, 10);

        // Auto-hide
        if (timeout > 0) {
            setTimeout(() => {
                this.hideToast(toast);
            }, timeout);
        }
    }

    hideToast(toast) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 300);
    }





    /**
     * Mostra un toast de success
     */
    success(message, timeout) {
        this.show(message, 'success', timeout);
    }

    error(message, timeout) {
        this.show(message, 'error', timeout);
    }
    
    info(message, timeout) {
        this.show(message, 'info', timeout);
    }
    
    warning(message, timeout) {
        this.show(message, 'warning', timeout);
    }
}

export { NotificationManager }; 