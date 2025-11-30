// Banner notification system - matches index_mobile-script.js exactly

export function showBanner(message, variant = 'info', title) {
    try {
        const normalizedVariant = (variant === 'notice') ? 'info' : variant;
    } catch {}

    // Check for existing banner and remove with smooth animation
    let hasExisting = false;
    try {
        const existing = document.getElementById('app-banner');
        if (existing) {
            hasExisting = true;
            existing.classList.add('app-banner--removing');
            setTimeout(() => existing.remove(), 300);
        }
    } catch {}

    // Function to create and show the new banner
    const createAndShowBanner = () => {
        const banner = document.createElement('div');
        banner.id = 'app-banner';
        const normalizedVariant = (variant === 'notice') ? 'info' : variant;
        banner.className = `app-banner app-banner--${normalizedVariant}`;
        const safeMsg = (typeof message === 'string') ? message : (message && message.message) || String(message);
        const heading = title || (normalizedVariant === 'error' ? 'Error' : (normalizedVariant === 'success' ? 'Success' : 'Notice'));
        banner.setAttribute('role', 'alert');
        banner.setAttribute('aria-live', 'assertive');
        banner.innerHTML = `
            <span class="app-banner__icon" aria-hidden="true">${getBannerIcon(normalizedVariant)}</span>
            <div class="app-banner__title">${heading}</div>
            <div style="flex:1;">${safeMsg}</div>
            <button class="app-banner__close" aria-label="Close">&times;</button>
        `;
        
        // Smooth removal function
        const removeBanner = () => {
            banner.classList.add('app-banner--removing');
            setTimeout(() => {
                if (banner.parentElement) {
                    banner.remove();
                }
            }, 300);
        };
        
        banner.querySelector('.app-banner__close').addEventListener('click', removeBanner);
        document.body.appendChild(banner);

        // Auto-dismiss after 5 seconds with smooth animation
        setTimeout(() => { 
            if (banner.parentElement) {
                removeBanner();
            }
        }, 5000);
    };

    // If there was an existing banner, wait for its removal animation to complete
    if (hasExisting) {
        setTimeout(createAndShowBanner, 320);
    } else {
        createAndShowBanner();
    }
}

function getBannerIcon(variant) {
    if (variant === 'success') {
        return `<svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.707a1 1 0 00-1.414-1.414L9 10.172 7.707 8.879a1 1 0 10-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>`;
    }
    if (variant === 'error') {
        return `<svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>`;
    }
    if (variant === 'favorite') {
        return `<svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"/></svg>`;
    }
    return `<svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path fill-rule="evenodd" d="M18 10A8 8 0 11.001 10 8 8 0 0118 10zM9 8a1 1 0 112 0v5a1 1 0 11-2 0V8zm1-3a1.25 1.25 0 100 2.5A1.25 1.25 0 0010 5z" clip-rule="evenodd"/></svg>`;
}

export function detectBannerVariant(msg) {
    try {
        const t = String((typeof msg === 'string') ? msg : (msg && msg.message) || msg).toLowerCase();
        if (t.includes('error') || t.includes('failed') || t.includes('unable') || t.includes('cannot')) return 'error';
        if (
            t.includes('success') || t.includes('saved') || t.includes('welcome') || t.includes('processed') ||
            t.includes('approved') || t.includes('accepted') || t.includes('confirmed') || t.includes('completed') || t.includes('paid')
        ) return 'success';
        if (t.includes('declined') || t.includes('cancelled') || t.includes('canceled') || t.includes('notice') || t.includes('reminder') || t.includes('pending')) return 'notice';
        return 'info';
    } catch { return 'info'; }
}

export function showSuccess(message) {
    showBanner(message, 'success');
}

export function showError(message) {
    showBanner(message, 'error');
}

export function showInfo(message) {
    showBanner(message, 'info');
}
