// Parse URL parameters
const urlParams = new URLSearchParams(window.location.search);

function getIntParam(name, fallback, min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER) {
    const raw = parseInt(urlParams.get(name), 10);
    if (Number.isNaN(raw)) return fallback;
    return Math.min(max, Math.max(min, raw));
}

function getHexParam(name, fallback) {
    const raw = (urlParams.get(name) || '').trim();
    if (/^[0-9a-fA-F]{6}$/.test(raw)) return `#${raw.toLowerCase()}`;
    if (/^#[0-9a-fA-F]{6}$/.test(raw)) return raw.toLowerCase();
    return fallback;
}

function hexToRgbString(hex) {
    const safeHex = hex.replace('#', '');
    const r = parseInt(safeHex.slice(0, 2), 16);
    const g = parseInt(safeHex.slice(2, 4), 16);
    const b = parseInt(safeHex.slice(4, 6), 16);
    return `${r}, ${g}, ${b}`;
}

function getFontFamily(value) {
    const map = {
        system: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif",
        inter: "'Inter', sans-serif",
        poppins: "'Poppins', sans-serif",
        jetbrainsmono: "'JetBrains Mono', monospace",
        montserrat: "'Montserrat', sans-serif"
    };
    return map[value] || map.system;
}

const config = {
    platforms: urlParams.get('platforms')?.split(',').filter(Boolean) || [],
    usernames: {
        twitch: urlParams.get('twitch_user') || '',
        kick: urlParams.get('kick_user') || '',
        youtube: urlParams.get('youtube_user') || ''
    },
    appearance: {
        textColor: getHexParam('textColor', '#ffffff'),
        fontSize: getIntParam('fontSize', 18, 12, 60),
        fontWeight: getIntParam('fontWeight', 500, 300, 900),
        fontFamily: urlParams.get('fontFamily') || 'system',
        usernameColorMode: urlParams.get('usernameColorMode') || 'platform',
        usernameColor: getHexParam('usernameColor', '#ffd166'),
        showLogo: urlParams.get('showLogo') !== '0',
        showBackground: urlParams.get('showBackground') !== '0',
        backgroundColor: getHexParam('backgroundColor', '#000000'),
        backgroundOpacity: getIntParam('backgroundOpacity', 60, 0, 100),
        borderRadius: getIntParam('borderRadius', 8, 0, 40),
        messageGap: getIntParam('messageGap', 8, 0, 40),
        messagePadding: getIntParam('messagePadding', 12, 4, 40),
        shadowStrength: getIntParam('shadowStrength', 40, 0, 100),
        animationStyle: urlParams.get('animationStyle') || 'slide-left',
        animationDuration: getIntParam('animationDuration', 300, 0, 2500),
        containerPosition: urlParams.get('containerPosition') === 'top' ? 'top' : 'bottom',
        containerPadding: getIntParam('containerPadding', 20, 0, 100),
        maxMessages: getIntParam('maxMessages', 50, 10, 300),
        showTimestamp: urlParams.get('showTimestamp') === '1',
        messageTimeout: getIntParam('messageTimeout', 0, 0, 300)
    }
};

const chatContainer = document.getElementById('chat-container');
let messageCount = 0;

const platformInfo = {
    twitch: {
        name: 'Twitch',
        color: '#9147ff',
        icon: 'M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z'
    },
    kick: {
        name: 'Kick',
        color: '#53fc18',
        icon: 'M12 2L2 7v10l10 5 10-5V7l-10-5zm0 2.18L19.82 8 12 11.82 4.18 8 12 4.18zM4 9.47l7 3.5v7.85l-7-3.5V9.47zm16 0v7.85l-7 3.5v-7.85l7-3.5z'
    },
    youtube: {
        name: 'YouTube',
        color: '#ff0000',
        icon: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z'
    }
};

function applyAppearanceSettings() {
    const root = document.documentElement;
    const p = config.appearance;
    const verticalPadding = Math.max(4, Math.round(p.messagePadding * 0.67));
    const shadowAlpha = (p.shadowStrength / 100) * 0.6;

    root.style.setProperty('--overlay-font-family', getFontFamily(p.fontFamily));
    root.style.setProperty('--message-text-color', p.textColor);
    root.style.setProperty('--message-font-size', `${p.fontSize}px`);
    root.style.setProperty('--message-font-weight', `${p.fontWeight}`);
    root.style.setProperty('--container-padding', `${p.containerPadding}px`);
    root.style.setProperty('--message-gap', `${p.messageGap}px`);
    root.style.setProperty('--message-border-radius', `${p.borderRadius}px`);
    root.style.setProperty('--message-padding-y', `${verticalPadding}px`);
    root.style.setProperty('--message-padding-x', `${p.messagePadding}px`);
    root.style.setProperty('--message-shadow', `0 6px 18px rgba(0, 0, 0, ${shadowAlpha.toFixed(2)})`);
    root.style.setProperty('--message-bg-rgb', hexToRgbString(p.backgroundColor));
    root.style.setProperty('--message-bg-opacity', (p.backgroundOpacity / 100).toFixed(2));
    root.style.setProperty('--animation-duration', `${p.animationDuration}ms`);

    chatContainer.classList.toggle('position-top', p.containerPosition === 'top');
}

function getUsernameColor(platform) {
    if (config.appearance.usernameColorMode === 'custom') {
        return config.appearance.usernameColor;
    }
    return platformInfo[platform]?.color || '#ffffff';
}

function getAnimationClass() {
    const style = config.appearance.animationStyle;
    const allowed = new Set(['slide-left', 'slide-right', 'fade', 'pop', 'none']);
    return allowed.has(style) ? `anim-${style}` : 'anim-slide-left';
}

function formatTimestamp(timestamp) {
    return timestamp.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Add a chat message to the display
function addChatMessage(platform, username, message, timestamp = new Date(), emotes = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${getAnimationClass()}`;

    if (config.appearance.showBackground) {
        messageDiv.classList.add('with-background');
    }

    const info = platformInfo[platform] || {
        color: '#ffffff',
        icon: '',
        name: 'Unknown'
    };

    let html = '';

    if (config.appearance.showLogo && info.icon) {
        html += `
            <div class="platform-badge" style="background: ${info.color};">
                <svg viewBox="0 0 24 24" fill="white">
                    <path d="${info.icon}"/>
                </svg>
            </div>
        `;
    }

    html += '<div class="message-content">';

    const processedMessage = processEmotes(message, emotes, platform);
    const usernameColor = getUsernameColor(platform);

    if (config.appearance.showTimestamp) {
        html += `<span class="timestamp" style="color: ${config.appearance.textColor};">[${formatTimestamp(timestamp)}]</span>`;
    }

    html += `
        <span class="username" style="color: ${usernameColor};">${escapeHtml(username)}:</span>
        <span class="message-text">${processedMessage}</span>
    `;

    html += '</div>';

    messageDiv.innerHTML = html;
    chatContainer.appendChild(messageDiv);
    messageCount++;

    if (config.appearance.messageTimeout > 0) {
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.classList.add('removing');
                setTimeout(() => {
                    if (messageDiv.parentNode) {
                        messageDiv.remove();
                        messageCount--;
                    }
                }, 300);
            }
        }, config.appearance.messageTimeout * 1000);
    }

    while (messageCount > config.appearance.maxMessages) {
        const oldMessage = chatContainer.firstChild;
        if (!oldMessage) break;
        oldMessage.remove();
        messageCount--;
    }

    if (config.appearance.containerPosition === 'bottom') {
        setTimeout(() => {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }, 10);
    } else {
        chatContainer.scrollTop = 0;
    }
}

function processEmotes(message, emotes, platform) {
    if (platform === 'twitch') {
        if (!emotes || Object.keys(emotes).length === 0) {
            return escapeHtml(message);
        }
        return processTwitchEmotes(message, emotes);
    }

    if (platform === 'kick') {
        return processKickEmotes(message, emotes);
    }

    return escapeHtml(message);
}

function processTwitchEmotes(message, emotesData) {
    if (!emotesData || Object.keys(emotesData).length === 0) {
        return escapeHtml(message);
    }

    const replacements = [];
    for (const [emoteId, positions] of Object.entries(emotesData)) {
        positions.forEach(([start, end]) => {
            replacements.push({
                start: parseInt(start, 10),
                end: parseInt(end, 10),
                img: `<img src="https://static-cdn.jtvnw.net/emoticons/v2/${emoteId}/default/dark/1.0" class="emote" alt="emote">`
            });
        });
    }

    replacements.sort((a, b) => b.start - a.start);

    let result = message;
    replacements.forEach(({ start, end, img }) => {
        result = result.substring(0, start) + img + result.substring(end + 1);
    });

    return escapeHtml(result).replace(/&lt;img [^&]*&gt;/g, (match) => {
        return match.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
    });
}

function processKickEmotes(message) {
    const emoteRegex = /\[emote:(\d+):([^\]]+)\]/g;

    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = emoteRegex.exec(message)) !== null) {
        const fullMatch = match[0];
        const emoteId = match[1];
        const emoteName = match[2];
        const matchStart = match.index;

        if (matchStart > lastIndex) {
            parts.push(escapeHtml(message.substring(lastIndex, matchStart)));
        }

        const emoteUrl = `https://files.kick.com/emotes/${emoteId}/fullsize`;
        parts.push(`<img src="${emoteUrl}" class="emote" alt="${emoteName}" title="${emoteName}">`);

        lastIndex = matchStart + fullMatch.length;
    }

    if (lastIndex < message.length) {
        parts.push(escapeHtml(message.substring(lastIndex)));
    }

    if (parts.length === 0) {
        return escapeHtml(message);
    }

    return parts.join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Twitch Chat Integration (using WebSocket directly)
let twitchSocket = null;

function connectTwitch() {
    if (!config.usernames.twitch) return;

    try {
        twitchSocket = new WebSocket('wss://irc-ws.chat.twitch.tv:443');

        twitchSocket.onopen = () => {
            twitchSocket.send('CAP REQ :twitch.tv/tags twitch.tv/commands');
            twitchSocket.send('PASS SCHMOOPIIE');
            twitchSocket.send('NICK justinfan' + Math.floor(Math.random() * 99999));
            twitchSocket.send('JOIN #' + config.usernames.twitch.toLowerCase());
        };

        twitchSocket.onmessage = (event) => {
            const lines = event.data.split('\r\n');

            lines.forEach(line => {
                if (!line) return;

                if (line.startsWith('PING')) {
                    twitchSocket.send('PONG :tmi.twitch.tv');
                    return;
                }

                if (line.includes('PRIVMSG')) {
                    let emotes = null;
                    const tagsMatch = line.match(/^@([^ ]+) /);
                    if (tagsMatch) {
                        const tags = {};
                        tagsMatch[1].split(';').forEach(tag => {
                            const [key, value] = tag.split('=');
                            tags[key] = value;
                        });

                        if (tags.emotes && tags.emotes !== '') {
                            emotes = {};
                            tags.emotes.split('/').forEach(emote => {
                                const [id, positions] = emote.split(':');
                                emotes[id] = positions.split(',').map(pos => {
                                    const [start, end] = pos.split('-');
                                    return [parseInt(start, 10), parseInt(end, 10)];
                                });
                            });
                        }
                    }

                    const match = line.match(/:(\w+)!.*PRIVMSG #\w+ :(.+)/);
                    if (match) {
                        const username = match[1];
                        const message = match[2];
                        addChatMessage('twitch', username, message, new Date(), emotes);
                    }
                }

                if (line.includes('366')) {
                    addChatMessage('twitch', 'System', 'Connected to Twitch chat', new Date());
                }
            });
        };

        twitchSocket.onerror = () => {
            addChatMessage('twitch', 'System', 'Connection error', new Date());
        };

        twitchSocket.onclose = () => {
            setTimeout(() => {
                if (config.usernames.twitch) {
                    connectTwitch();
                }
            }, 5000);
        };

    } catch (error) {
        addChatMessage('twitch', 'System', 'Failed to connect: ' + error.message, new Date());
    }
}

// Kick Chat Integration
let kickSocket = null;
let kickChannelId = null;

async function connectKick() {
    if (!config.usernames.kick) return;

    try {
        let channelData = null;
        let channelResponse;

        try {
            channelResponse = await fetch(`https://kick.com/api/v2/channels/${config.usernames.kick}`, {
                headers: { Accept: 'application/json' }
            });
            if (channelResponse.ok) channelData = await channelResponse.json();
        } catch (e) {
            console.warn('Kick v2 failed:', e.message);
        }

        if (!channelData) {
            try {
                channelResponse = await fetch(`https://kick.com/api/v1/channels/${config.usernames.kick}`, {
                    headers: { Accept: 'application/json' }
                });
                if (channelResponse.ok) channelData = await channelResponse.json();
            } catch (e) {
                console.warn('Kick v1 failed:', e.message);
            }
        }

        if (!channelData) {
            try {
                channelResponse = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(`https://kick.com/api/v2/channels/${config.usernames.kick}`)}`);
                if (channelResponse.ok) {
                    const data = await channelResponse.json();
                    channelData = JSON.parse(data.contents);
                }
            } catch (e) {
                console.warn('Kick proxy failed:', e.message);
            }
        }

        if (!channelData) {
            addChatMessage('kick', 'System', `Could not find channel: ${config.usernames.kick}`, new Date());
            return;
        }

        kickChannelId = channelData.id;
        const chatroomId = channelData.chatroom?.id || channelData.chatroom_id || channelData.chatroom || channelData.id;

        if (!chatroomId) {
            addChatMessage('kick', 'System', 'Channel found but no chatroom available', new Date());
            return;
        }

        if (typeof Pusher !== 'undefined') {
            initKickClient(chatroomId);
            return;
        }

        let attempts = 0;
        const checkPusher = setInterval(() => {
            attempts++;
            if (typeof Pusher !== 'undefined') {
                clearInterval(checkPusher);
                initKickClient(chatroomId);
            } else if (attempts > 50) {
                clearInterval(checkPusher);
                addChatMessage('kick', 'System', 'Failed to load chat library', new Date());
            }
        }, 100);

    } catch (error) {
        addChatMessage('kick', 'System', 'Failed to connect to Kick chat: ' + error.message, new Date());
    }
}

function initKickClient(chatroomId) {
    const pusher = new Pusher('32cbd69e4b950bf97679', {
        cluster: 'us2',
        wsHost: 'ws-us2.pusher.com',
        wsPort: 443,
        wssPort: 443,
        enabledTransports: ['ws', 'wss'],
        forceTLS: true
    });

    const channel = pusher.subscribe(`chatrooms.${chatroomId}.v2`);

    channel.bind('App\\Events\\ChatMessageEvent', function(data) {
        if (data.sender && data.content) {
            const username = data.sender.username || data.sender.slug;
            const emotes = data.metadata?.emotes || [];
            addChatMessage('kick', username, data.content, new Date(), emotes);
        }
    });

    channel.bind('pusher:subscription_succeeded', function() {
        addChatMessage('kick', 'System', 'Connected to Kick chat', new Date());
    });

    channel.bind('pusher:subscription_error', function() {
        addChatMessage('kick', 'System', 'Failed to subscribe to chat', new Date());
    });

    kickSocket = pusher;
}

// YouTube Chat placeholder
let youtubeInterval = null;

function connectYouTube() {
    if (!config.usernames.youtube) return;

    setTimeout(() => {
        addChatMessage('youtube', 'System', 'YouTube chat requires live stream ID and API key', new Date());
    }, 1500);
}

function init() {
    applyAppearanceSettings();

    config.platforms.forEach(platform => {
        switch (platform) {
            case 'twitch':
                if (config.usernames.twitch) connectTwitch();
                break;
            case 'kick':
                if (config.usernames.kick) connectKick();
                break;
            case 'youtube':
                if (config.usernames.youtube) connectYouTube();
                break;
        }
    });

    if (config.platforms.length === 0) {
        const msgDiv = document.createElement('div');
        msgDiv.style.cssText = 'color: white; padding: 20px; text-align: center; background: rgba(0,0,0,0.8); border-radius: 8px;';
        msgDiv.innerHTML = `
            <h2>Chat Overlay Not Configured</h2>
            <p style="margin-top: 10px;">Please configure your chat overlay at the configuration page.</p>
        `;
        chatContainer.appendChild(msgDiv);
    }
}

window.addEventListener('DOMContentLoaded', init);

window.addEventListener('beforeunload', () => {
    if (twitchSocket) twitchSocket.close();
    if (kickSocket) kickSocket.disconnect();
    if (youtubeInterval) clearInterval(youtubeInterval);
});

if (urlParams.get('demo') === '1') {
    const demoMessages = [
        { platform: 'twitch', user: 'Viewer1', text: 'Hello everyone!' },
        { platform: 'twitch', user: 'CoolStreamer', text: 'Thanks for watching!' },
        { platform: 'youtube', user: 'YTFan', text: 'Great stream!' },
        { platform: 'kick', user: 'KickUser', text: 'This overlay looks awesome!' },
        { platform: 'twitch', user: 'ProGamer', text: 'GG!' }
    ];

    let demoIndex = 0;
    setInterval(() => {
        const msg = demoMessages[demoIndex % demoMessages.length];
        if (config.platforms.includes(msg.platform)) {
            addChatMessage(msg.platform, msg.user, msg.text);
        }
        demoIndex++;
    }, 3000);
}
