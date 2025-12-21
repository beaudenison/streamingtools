// Configuration state
const config = {
    platforms: {
        twitch: { enabled: false, username: '' },
        kick: { enabled: false, username: '' },
        youtube: { enabled: false, username: '' }
    },
    appearance: {
        textColor: '#ffffff',
        fontSize: 18,
        showLogo: true,
        showTimestamp: false
    }
};

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== Config page DOMContentLoaded fired ===');
    
    // Platform toggle listeners
    document.getElementById('platform-twitch').addEventListener('change', (e) => {
        config.platforms.twitch.enabled = e.target.checked;
        const inputContainer = document.getElementById('twitch-input-container');
        inputContainer.style.display = e.target.checked ? 'block' : 'none';
        updateBrowserSourceURL();
    });

    document.getElementById('platform-kick').addEventListener('change', (e) => {
        config.platforms.kick.enabled = e.target.checked;
        const inputContainer = document.getElementById('kick-input-container');
        inputContainer.style.display = e.target.checked ? 'block' : 'none';
        updateBrowserSourceURL();
    });

    // Username input listeners
    document.getElementById('twitch-username').addEventListener('input', (e) => {
        config.platforms.twitch.username = e.target.value.trim();
        updateBrowserSourceURL();
    });

    document.getElementById('kick-username').addEventListener('input', (e) => {
        config.platforms.kick.username = e.target.value.trim();
        updateBrowserSourceURL();
    });

    // Appearance controls
    const textColorInput = document.getElementById('text-color');
    const textColorHex = document.getElementById('text-color-hex');
    const fontSizeInput = document.getElementById('font-size');
    const fontSizeValue = document.getElementById('font-size-value');
    const showLogoCheckbox = document.getElementById('show-platform-logo');
    const showTimestampCheckbox = document.getElementById('show-timestamp');

    textColorInput.addEventListener('input', (e) => {
        config.appearance.textColor = e.target.value;
        textColorHex.value = e.target.value;
        updatePreview();
        updateBrowserSourceURL();
    });

    fontSizeInput.addEventListener('input', (e) => {
        config.appearance.fontSize = parseInt(e.target.value);
        fontSizeValue.textContent = `${e.target.value}px`;
        updatePreview();
        updateBrowserSourceURL();
    });

    showLogoCheckbox.addEventListener('change', (e) => {
        config.appearance.showLogo = e.target.checked;
        updatePreview();
        updateBrowserSourceURL();
    });

    showTimestampCheckbox.addEventListener('change', (e) => {
        config.appearance.showTimestamp = e.target.checked;
        updatePreview();
        updateBrowserSourceURL();
    });

    // Update preview
    function updatePreview() {
    const previewBox = document.getElementById('preview-box');
    const messageText = previewBox.querySelector('.message-text');
    const platformBadge = previewBox.querySelector('.platform-badge');
    
    if (messageText) {
        messageText.style.color = config.appearance.textColor;
        messageText.style.fontSize = `${config.appearance.fontSize}px`;
    }
    
    if (platformBadge) {
        platformBadge.style.display = config.appearance.showLogo ? 'inline-flex' : 'none';
    }

    // Update all preview messages
    const allMessages = previewBox.querySelectorAll('.preview-message');
    allMessages.forEach(msg => {
        const text = msg.querySelector('.message-text');
        const badge = msg.querySelector('.platform-badge');
        
        if (text) {
            text.style.color = config.appearance.textColor;
            text.style.fontSize = `${config.appearance.fontSize}px`;
        }
        if (badge) {
            badge.style.display = config.appearance.showLogo ? 'inline-flex' : 'none';
        }
    });
    }

    // Update browser source URL
    function updateBrowserSourceURL(returnOnly = false) {
    const params = new URLSearchParams();
    
    // Add enabled platforms
    const enabledPlatforms = [];
    for (const [platform, data] of Object.entries(config.platforms)) {
        if (data.enabled && data.username) {
            enabledPlatforms.push(platform);
            params.set(`${platform}_user`, data.username);
        }
    }
    
    if (enabledPlatforms.length > 0) {
        params.set('platforms', enabledPlatforms.join(','));
    }
    
    // Add appearance settings
    params.set('textColor', config.appearance.textColor.replace('#', ''));
    params.set('fontSize', config.appearance.fontSize);
    params.set('showLogo', config.appearance.showLogo ? '1' : '0');
    params.set('showTimestamp', config.appearance.showTimestamp ? '1' : '0');
    
    // Generate URL
    const baseURL = window.location.origin + window.location.pathname.replace('config.html', 'overlay.html');
    const fullURL = `${baseURL}?${params.toString()}`;
    
    // Update iframe preview
    updateIframePreview(fullURL);
    
    // Update visible URL display
    const urlDisplay = document.getElementById('browser-source-url-display');
    if (urlDisplay) {
        urlDisplay.value = fullURL;
    }
    
    if (returnOnly) {
        return fullURL;
    }
    
    // Update hidden input if it exists (for legacy support)
    const urlInput = document.getElementById('browser-source-url');
    if (urlInput) {
        urlInput.value = fullURL;
    }
    
    return fullURL;
    }

    // Update iframe preview
    function updateIframePreview(url) {
    const iframe = document.getElementById('preview-frame');
    const placeholder = document.getElementById('preview-placeholder');
    
    // Check if any platform is enabled with a username
    const hasActivePlatforms = Object.values(config.platforms).some(p => p.enabled && p.username);
    
    if (hasActivePlatforms) {
        placeholder.style.display = 'none';
        iframe.style.display = 'block';
        iframe.src = url;
    } else {
        placeholder.style.display = 'flex';
        iframe.style.display = 'none';
        iframe.src = '';
    }
    }

    // Auto-select URL on click for easy copying
    const urlDisplay = document.getElementById('browser-source-url-display');
    if (urlDisplay) {
        urlDisplay.addEventListener('click', function() {
            this.select();
        });
    }

    // Initialize
    updateBrowserSourceURL();
    updatePreview();
    
}); // End DOMContentLoaded