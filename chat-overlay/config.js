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
        fontWeight: 500,
        fontFamily: 'system',
        usernameColorMode: 'platform',
        usernameColor: '#ffd166',
        showLogo: true,
        showBackground: true,
        backgroundColor: '#000000',
        backgroundOpacity: 60,
        borderRadius: 8,
        messageGap: 8,
        messagePadding: 12,
        shadowStrength: 40,
        animationStyle: 'slide-left',
        animationDuration: 300,
        containerPosition: 'bottom',
        containerPadding: 20,
        maxMessages: 50,
        showTimestamp: false,
        messageTimeout: 0
    }
};

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    const controls = {
        platformTwitch: document.getElementById('platform-twitch'),
        platformKick: document.getElementById('platform-kick'),
        twitchUsername: document.getElementById('twitch-username'),
        kickUsername: document.getElementById('kick-username'),
        twitchInputContainer: document.getElementById('twitch-input-container'),
        kickInputContainer: document.getElementById('kick-input-container'),
        textColor: document.getElementById('text-color'),
        textColorHex: document.getElementById('text-color-hex'),
        usernameColorMode: document.getElementById('username-color-mode'),
        usernameColorGroup: document.getElementById('username-color-group'),
        usernameColor: document.getElementById('username-color'),
        usernameColorHex: document.getElementById('username-color-hex'),
        fontFamily: document.getElementById('font-family'),
        fontSize: document.getElementById('font-size'),
        fontSizeValue: document.getElementById('font-size-value'),
        fontWeight: document.getElementById('font-weight'),
        fontWeightValue: document.getElementById('font-weight-value'),
        backgroundColor: document.getElementById('background-color'),
        backgroundColorHex: document.getElementById('background-color-hex'),
        backgroundOpacity: document.getElementById('background-opacity'),
        backgroundOpacityValue: document.getElementById('background-opacity-value'),
        borderRadius: document.getElementById('border-radius'),
        borderRadiusValue: document.getElementById('border-radius-value'),
        messageGap: document.getElementById('message-gap'),
        messageGapValue: document.getElementById('message-gap-value'),
        messagePadding: document.getElementById('message-padding'),
        messagePaddingValue: document.getElementById('message-padding-value'),
        shadowStrength: document.getElementById('shadow-strength'),
        shadowStrengthValue: document.getElementById('shadow-strength-value'),
        animationStyle: document.getElementById('animation-style'),
        animationDuration: document.getElementById('animation-duration'),
        animationDurationValue: document.getElementById('animation-duration-value'),
        containerPosition: document.getElementById('container-position'),
        containerPadding: document.getElementById('container-padding'),
        containerPaddingValue: document.getElementById('container-padding-value'),
        maxMessages: document.getElementById('max-messages'),
        maxMessagesValue: document.getElementById('max-messages-value'),
        showLogo: document.getElementById('show-platform-logo'),
        showBackground: document.getElementById('show-background'),
        showTimestamp: document.getElementById('show-timestamp'),
        messageTimeout: document.getElementById('message-timeout'),
        messageTimeoutValue: document.getElementById('message-timeout-value'),
        previewFrame: document.getElementById('preview-frame'),
        previewPlaceholder: document.getElementById('preview-placeholder'),
        browserSourceDisplay: document.getElementById('browser-source-url-display')
    };

    controls.platformTwitch.addEventListener('change', (e) => {
        config.platforms.twitch.enabled = e.target.checked;
        controls.twitchInputContainer.style.display = e.target.checked ? 'block' : 'none';
        updateBrowserSourceURL();
    });

    controls.platformKick.addEventListener('change', (e) => {
        config.platforms.kick.enabled = e.target.checked;
        controls.kickInputContainer.style.display = e.target.checked ? 'block' : 'none';
        updateBrowserSourceURL();
    });

    controls.twitchUsername.addEventListener('input', (e) => {
        config.platforms.twitch.username = e.target.value.trim();
        updateBrowserSourceURL();
    });

    controls.kickUsername.addEventListener('input', (e) => {
        config.platforms.kick.username = e.target.value.trim();
        updateBrowserSourceURL();
    });

    controls.textColor.addEventListener('input', (e) => {
        config.appearance.textColor = e.target.value;
        controls.textColorHex.value = e.target.value;
        updateBrowserSourceURL();
    });

    controls.usernameColorMode.addEventListener('change', (e) => {
        config.appearance.usernameColorMode = e.target.value;
        updateConditionalControls();
        updateBrowserSourceURL();
    });

    controls.usernameColor.addEventListener('input', (e) => {
        config.appearance.usernameColor = e.target.value;
        controls.usernameColorHex.value = e.target.value;
        updateBrowserSourceURL();
    });

    controls.fontFamily.addEventListener('change', (e) => {
        config.appearance.fontFamily = e.target.value;
        updateBrowserSourceURL();
    });

    controls.fontSize.addEventListener('input', (e) => {
        const value = parseInt(e.target.value, 10);
        config.appearance.fontSize = value;
        controls.fontSizeValue.textContent = `${value}px`;
        updateBrowserSourceURL();
    });

    controls.fontWeight.addEventListener('input', (e) => {
        const value = parseInt(e.target.value, 10);
        config.appearance.fontWeight = value;
        controls.fontWeightValue.textContent = `${value}`;
        updateBrowserSourceURL();
    });

    controls.backgroundColor.addEventListener('input', (e) => {
        config.appearance.backgroundColor = e.target.value;
        controls.backgroundColorHex.value = e.target.value;
        updateBrowserSourceURL();
    });

    controls.backgroundOpacity.addEventListener('input', (e) => {
        const value = parseInt(e.target.value, 10);
        config.appearance.backgroundOpacity = value;
        controls.backgroundOpacityValue.textContent = `${value}%`;
        updateBrowserSourceURL();
    });

    controls.borderRadius.addEventListener('input', (e) => {
        const value = parseInt(e.target.value, 10);
        config.appearance.borderRadius = value;
        controls.borderRadiusValue.textContent = `${value}px`;
        updateBrowserSourceURL();
    });

    controls.messageGap.addEventListener('input', (e) => {
        const value = parseInt(e.target.value, 10);
        config.appearance.messageGap = value;
        controls.messageGapValue.textContent = `${value}px`;
        updateBrowserSourceURL();
    });

    controls.messagePadding.addEventListener('input', (e) => {
        const value = parseInt(e.target.value, 10);
        config.appearance.messagePadding = value;
        const vertical = Math.max(4, Math.round(value * 0.67));
        controls.messagePaddingValue.textContent = `${vertical}px vertical / ${value}px horizontal`;
        updateBrowserSourceURL();
    });

    controls.shadowStrength.addEventListener('input', (e) => {
        const value = parseInt(e.target.value, 10);
        config.appearance.shadowStrength = value;
        controls.shadowStrengthValue.textContent = `${value}%`;
        updateBrowserSourceURL();
    });

    controls.animationStyle.addEventListener('change', (e) => {
        config.appearance.animationStyle = e.target.value;
        updateBrowserSourceURL();
    });

    controls.animationDuration.addEventListener('input', (e) => {
        const value = parseInt(e.target.value, 10);
        config.appearance.animationDuration = value;
        controls.animationDurationValue.textContent = `${value}ms`;
        updateBrowserSourceURL();
    });

    controls.containerPosition.addEventListener('change', (e) => {
        config.appearance.containerPosition = e.target.value;
        updateBrowserSourceURL();
    });

    controls.containerPadding.addEventListener('input', (e) => {
        const value = parseInt(e.target.value, 10);
        config.appearance.containerPadding = value;
        controls.containerPaddingValue.textContent = `${value}px`;
        updateBrowserSourceURL();
    });

    controls.maxMessages.addEventListener('input', (e) => {
        const value = parseInt(e.target.value, 10);
        config.appearance.maxMessages = value;
        controls.maxMessagesValue.textContent = `${value}`;
        updateBrowserSourceURL();
    });

    controls.showLogo.addEventListener('change', (e) => {
        config.appearance.showLogo = e.target.checked;
        updateBrowserSourceURL();
    });

    controls.showBackground.addEventListener('change', (e) => {
        config.appearance.showBackground = e.target.checked;
        updateBrowserSourceURL();
    });

    controls.showTimestamp.addEventListener('change', (e) => {
        config.appearance.showTimestamp = e.target.checked;
        updateBrowserSourceURL();
    });

    controls.messageTimeout.addEventListener('input', (e) => {
        const value = parseInt(e.target.value, 10);
        config.appearance.messageTimeout = value;
        controls.messageTimeoutValue.textContent = value === 0 ? 'Never disappear' : `${value} seconds`;
        updateBrowserSourceURL();
    });

    function updateConditionalControls() {
        const useCustomNameColor = config.appearance.usernameColorMode === 'custom';
        controls.usernameColorGroup.style.display = useCustomNameColor ? 'block' : 'none';
    }

    function updateBrowserSourceURL() {
        const params = new URLSearchParams();
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

        params.set('textColor', config.appearance.textColor.replace('#', ''));
        params.set('fontSize', config.appearance.fontSize);
        params.set('fontWeight', config.appearance.fontWeight);
        params.set('fontFamily', config.appearance.fontFamily);
        params.set('usernameColorMode', config.appearance.usernameColorMode);
        params.set('usernameColor', config.appearance.usernameColor.replace('#', ''));
        params.set('showLogo', config.appearance.showLogo ? '1' : '0');
        params.set('showBackground', config.appearance.showBackground ? '1' : '0');
        params.set('backgroundColor', config.appearance.backgroundColor.replace('#', ''));
        params.set('backgroundOpacity', config.appearance.backgroundOpacity);
        params.set('borderRadius', config.appearance.borderRadius);
        params.set('messageGap', config.appearance.messageGap);
        params.set('messagePadding', config.appearance.messagePadding);
        params.set('shadowStrength', config.appearance.shadowStrength);
        params.set('animationStyle', config.appearance.animationStyle);
        params.set('animationDuration', config.appearance.animationDuration);
        params.set('containerPosition', config.appearance.containerPosition);
        params.set('containerPadding', config.appearance.containerPadding);
        params.set('maxMessages', config.appearance.maxMessages);
        params.set('showTimestamp', config.appearance.showTimestamp ? '1' : '0');
        params.set('messageTimeout', config.appearance.messageTimeout);

        const baseURL = window.location.origin + window.location.pathname.replace('config.html', 'overlay.html');
        const fullURL = `${baseURL}?${params.toString()}`;

        updateIframePreview(fullURL);
        controls.browserSourceDisplay.value = fullURL;
        return fullURL;
    }

    function updateIframePreview(url) {
        const hasActivePlatforms = Object.values(config.platforms).some(p => p.enabled && p.username);

        if (hasActivePlatforms) {
            controls.previewPlaceholder.style.display = 'none';
            controls.previewFrame.style.display = 'block';
            controls.previewFrame.src = url;
            return;
        }

        controls.previewPlaceholder.style.display = 'flex';
        controls.previewFrame.style.display = 'none';
        controls.previewFrame.src = '';
    }

    if (controls.browserSourceDisplay) {
        controls.browserSourceDisplay.addEventListener('click', function() {
            this.select();
        });
    }

    updateConditionalControls();
    updateBrowserSourceURL();
});
