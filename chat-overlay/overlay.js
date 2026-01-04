// Parse URL parameters
const urlParams = new URLSearchParams(window.location.search);

const config = {
    platforms: urlParams.get('platforms')?.split(',') || [],
    usernames: {
        twitch: urlParams.get('twitch_user') || '',
        kick: urlParams.get('kick_user') || '',
        youtube: urlParams.get('youtube_user') || ''
    },
    appearance: {
        textColor: '#' + (urlParams.get('textColor') || 'ffffff'),
        fontSize: parseInt(urlParams.get('fontSize')) || 18,
        showLogo: urlParams.get('showLogo') === '1',
        showTimestamp: urlParams.get('showTimestamp') === '1',
        showBackground: urlParams.get('showBackground') !== '0',  // true unless explicitly set to '0'
        messageTimeout: parseInt(urlParams.get('messageTimeout')) || 0
    }
};

console.log('Overlay config loaded:', config);
console.log('showBackground param:', urlParams.get('showBackground'));
console.log('messageTimeout param:', urlParams.get('messageTimeout'));

const chatContainer = document.getElementById('chat-container');
const MAX_MESSAGES = 50; // Maximum messages to display
let messageCount = 0;

// Platform info
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

// Add a chat message to the display
function addChatMessage(platform, username, message, timestamp = new Date(), emotes = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message';
    
    // Add background class if enabled
    if (config.appearance.showBackground) {
        messageDiv.classList.add('with-background');
    }
    
    const info = platformInfo[platform];
    
    let html = '';
    
    // Platform badge
    if (config.appearance.showLogo) {
        html += `
            <div class="platform-badge" style="background: ${info.color};">
                <svg viewBox="0 0 24 24" fill="white">
                    <path d="${info.icon}"/>
                </svg>
            </div>
        `;
    }
    
    html += '<div class="message-content">';
    
    // Timestamp
    if (config.appearance.showTimestamp) {
        const time = timestamp.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        html += `<span class="timestamp" style="color: ${config.appearance.textColor};">[${time}]</span>`;
    }
    
    // Process message with emotes
    const processedMessage = processEmotes(message, emotes, platform);
    
    // Username and message
    html += `
        <span class="username" style="color: ${info.color};">${escapeHtml(username)}:</span>
        <span class="message-text" style="color: ${config.appearance.textColor}; font-size: ${config.appearance.fontSize}px;">${processedMessage}</span>
    `;
    
    html += '</div>';
    
    messageDiv.innerHTML = html;
    chatContainer.appendChild(messageDiv);
    messageCount++;
    
    // Auto-remove message after timeout if configured
    if (config.appearance.messageTimeout > 0) {
        console.log(`Message will be removed in ${config.appearance.messageTimeout} seconds`);
        setTimeout(() => {
            if (messageDiv.parentNode) {
                console.log('Removing message after timeout');
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
    
    // Remove old messages if we exceed the limit
    if (messageCount > MAX_MESSAGES) {
        const oldMessage = chatContainer.firstChild;
        if (oldMessage) {
            oldMessage.classList.add('removing');
            setTimeout(() => {
                oldMessage.remove();
                messageCount--;
            }, 300);
        }
    }
    
    // Auto-scroll to bottom smoothly
    setTimeout(() => {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }, 10);
}

// Process emotes in messages
function processEmotes(message, emotes, platform) {
    if (platform === 'twitch') {
        // Twitch emotes format: { id: [[start, end], ...] }
        if (!emotes || Object.keys(emotes).length === 0) {
            return escapeHtml(message);
        }
        return processTwitchEmotes(message, emotes);
    } else if (platform === 'kick') {
        // Kick emotes are embedded in the message as [emote:ID:NAME]
        // Always process Kick messages to handle emotes
        return processKickEmotes(message, emotes);
    }
    
    return escapeHtml(message);
}

// Process Twitch emotes
function processTwitchEmotes(message, emotesData) {
    if (!emotesData || Object.keys(emotesData).length === 0) {
        return escapeHtml(message);
    }
    
    // Build array of replacements
    const replacements = [];
    for (const [emoteId, positions] of Object.entries(emotesData)) {
        positions.forEach(([start, end]) => {
            replacements.push({
                start: parseInt(start),
                end: parseInt(end),
                img: `<img src="https://static-cdn.jtvnw.net/emoticons/v2/${emoteId}/default/dark/1.0" class="emote" alt="emote">`
            });
        });
    }
    
    // Sort by position (reverse order to replace from end to start)
    replacements.sort((a, b) => b.start - a.start);
    
    // Replace emotes
    let result = message;
    replacements.forEach(({ start, end, img }) => {
        result = result.substring(0, start) + img + result.substring(end + 1);
    });
    
    return escapeHtml(result).replace(/&lt;img [^&]*&gt;/g, (match) => {
        return match.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
    });
}

// Process Kick emotes
function processKickEmotes(message, emotes) {
    console.log('Processing Kick emotes. Message:', message, 'Emotes metadata:', emotes);
    
    // Kick sends emotes in the format [emote:ID:NAME] directly in the message
    // We need to parse these and replace them with actual images
    const emoteRegex = /\[emote:(\d+):([^\]]+)\]/g;
    
    const parts = [];
    let lastIndex = 0;
    let match;
    
    while ((match = emoteRegex.exec(message)) !== null) {
        const fullMatch = match[0];
        const emoteId = match[1];
        const emoteName = match[2];
        const matchStart = match.index;
        
        // Add text before this emote (escaped)
        if (matchStart > lastIndex) {
            parts.push(escapeHtml(message.substring(lastIndex, matchStart)));
        }
        
        // Add the emote as an img tag (not escaped)
        const emoteUrl = `https://files.kick.com/emotes/${emoteId}/fullsize`;
        parts.push(`<img src="${emoteUrl}" class="emote" alt="${emoteName}" title="${emoteName}">`);
        
        // Update lastIndex to after this emote
        lastIndex = matchStart + fullMatch.length;
    }
    
    // Add any remaining text after the last emote
    if (lastIndex < message.length) {
        parts.push(escapeHtml(message.substring(lastIndex)));
    }
    
    // If no emotes were found, just return the escaped message
    if (parts.length === 0) {
        return escapeHtml(message);
    }
    
    return parts.join('');
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Twitch Chat Integration (using WebSocket directly)
let twitchSocket = null;

function connectTwitch() {
    if (!config.usernames.twitch) return;
    
    console.log('Connecting to Twitch IRC for:', config.usernames.twitch);
    
    try {
        // Connect to Twitch IRC via WebSocket
        twitchSocket = new WebSocket('wss://irc-ws.chat.twitch.tv:443');
        
        twitchSocket.onopen = () => {
            console.log('Twitch WebSocket opened');
            // Send PASS and NICK (anonymous login)
            twitchSocket.send('CAP REQ :twitch.tv/tags twitch.tv/commands');
            twitchSocket.send('PASS SCHMOOPIIE');  // Anonymous auth
            twitchSocket.send('NICK justinfan' + Math.floor(Math.random() * 99999));  // Anonymous user
            twitchSocket.send('JOIN #' + config.usernames.twitch.toLowerCase());
        };
        
        twitchSocket.onmessage = (event) => {
            const lines = event.data.split('\r\n');
            
            lines.forEach(line => {
                if (!line) return;
                
                console.log('Twitch IRC:', line);
                
                // Respond to PING
                if (line.startsWith('PING')) {
                    twitchSocket.send('PONG :tmi.twitch.tv');
                    return;
                }
                
                // Parse PRIVMSG (chat messages)
                if (line.includes('PRIVMSG')) {
                    // Parse IRC tags for emotes
                    let emotes = null;
                    const tagsMatch = line.match(/^@([^ ]+) /);
                    if (tagsMatch) {
                        const tags = {};
                        tagsMatch[1].split(';').forEach(tag => {
                            const [key, value] = tag.split('=');
                            tags[key] = value;
                        });
                        
                        // Parse emotes tag: emote_id:start-end,start-end/emote_id:start-end
                        if (tags.emotes && tags.emotes !== '') {
                            emotes = {};
                            tags.emotes.split('/').forEach(emote => {
                                const [id, positions] = emote.split(':');
                                emotes[id] = positions.split(',').map(pos => {
                                    const [start, end] = pos.split('-');
                                    return [parseInt(start), parseInt(end)];
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
                
                // Check for successful join
                if (line.includes('366')) {  // End of NAMES list
                    console.log('Successfully joined Twitch channel');
                    addChatMessage('twitch', 'System', '✓ Connected to Twitch chat', new Date());
                }
            });
        };
        
        twitchSocket.onerror = (error) => {
            console.error('Twitch WebSocket error:', error);
            addChatMessage('twitch', 'System', '✗ Connection error', new Date());
        };
        
        twitchSocket.onclose = () => {
            console.log('Twitch WebSocket closed');
            // Attempt to reconnect after 5 seconds
            setTimeout(() => {
                if (config.usernames.twitch) {
                    console.log('Attempting to reconnect to Twitch...');
                    connectTwitch();
                }
            }, 5000);
        };
        
    } catch (error) {
        console.error('Error connecting to Twitch:', error);
        addChatMessage('twitch', 'System', 'Failed to connect: ' + error.message, new Date());
    }
}

function initTwitchClient() {
    // Legacy function - no longer used, kept for compatibility
    console.log('Using direct WebSocket connection instead');
}

// Kick Chat Integration (using direct WebSocket)
let kickSocket = null;
let kickChannelId = null;

async function connectKick() {
    if (!config.usernames.kick) return;
    
    try {
        // First, get the channel ID from the username
        console.log('Fetching Kick channel info for:', config.usernames.kick);
        
        // Try multiple methods to fetch channel data
        let channelData = null;
        let channelResponse;
        
        // Method 1: Try v2 API directly
        try {
            console.log('Trying Kick API v2...');
            channelResponse = await fetch(`https://kick.com/api/v2/channels/${config.usernames.kick}`, {
                headers: {
                    'Accept': 'application/json'
                }
            });
            if (channelResponse.ok) {
                channelData = await channelResponse.json();
                console.log('API v2 successful:', channelData);
            } else {
                console.log('API v2 failed with status:', channelResponse.status);
            }
        } catch (e) {
            console.log('API v2 fetch error:', e.message);
        }
        
        // Method 2: Try v1 API
        if (!channelData) {
            try {
                console.log('Trying Kick API v1...');
                channelResponse = await fetch(`https://kick.com/api/v1/channels/${config.usernames.kick}`, {
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                if (channelResponse.ok) {
                    channelData = await channelResponse.json();
                    console.log('API v1 successful:', channelData);
                }
            } catch (e) {
                console.log('API v1 fetch error:', e.message);
            }
        }
        
        // Method 3: Try CORS proxy with v2
        if (!channelData) {
            try {
                console.log('Trying CORS proxy...');
                channelResponse = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(`https://kick.com/api/v2/channels/${config.usernames.kick}`)}`);
                if (channelResponse.ok) {
                    const data = await channelResponse.json();
                    channelData = JSON.parse(data.contents);
                    console.log('CORS proxy successful:', channelData);
                }
            } catch (e) {
                console.log('CORS proxy failed:', e.message);
            }
        }
        
        if (!channelData) {
            console.error('Failed to fetch Kick channel info from all sources');
            addChatMessage('kick', 'System', `⚠️ Could not find channel: ${config.usernames.kick}`, new Date());
            addChatMessage('kick', 'System', 'Please check the username is correct', new Date());
            return;
        }
        
        kickChannelId = channelData.id;
        
        // Log the full response to debug
        console.log('Full Kick channel data:', JSON.stringify(channelData, null, 2));
        
        // Try multiple possible chatroom ID locations
        let chatroomId = channelData.chatroom?.id || 
                        channelData.chatroom_id || 
                        channelData.chatroom ||
                        channelData.id; // Sometimes the channel ID itself is used
        
        if (!chatroomId) {
            console.error('No chatroom ID found in channel data');
            console.log('Available keys:', Object.keys(channelData));
            console.log('Chatroom object:', channelData.chatroom);
            addChatMessage('kick', 'System', '⚠️ Channel found but no chatroom available', new Date());
            addChatMessage('kick', 'System', 'Debug: Check console for channel data structure', new Date());
            return;
        }
        
        console.log('Kick channel ID:', kickChannelId, 'Chatroom ID:', chatroomId);
        
        // Check if Pusher is already loaded
        if (typeof Pusher !== 'undefined') {
            initKickClient(chatroomId);
        } else {
            // Wait for Pusher to load
            let attempts = 0;
            const checkPusher = setInterval(() => {
                attempts++;
                if (typeof Pusher !== 'undefined') {
                    clearInterval(checkPusher);
                    initKickClient(chatroomId);
                } else if (attempts > 50) { // 5 seconds timeout
                    clearInterval(checkPusher);
                    console.error('Pusher library failed to load');
                    addChatMessage('kick', 'System', '✗ Failed to load chat library', new Date());
                }
            }, 100);
        }
        
    } catch (error) {
        console.error('Error connecting to Kick:', error);
        addChatMessage('kick', 'System', 'Failed to connect to Kick chat: ' + error.message, new Date());
    }
}

function initKickClient(chatroomId) {
    console.log('Initializing Kick client with chatroom:', chatroomId);
    
    // Kick's Pusher configuration
    const pusher = new Pusher('32cbd69e4b950bf97679', {
        cluster: 'us2',
        wsHost: 'ws-us2.pusher.com',
        wsPort: 443,
        wssPort: 443,
        enabledTransports: ['ws', 'wss'],
        forceTLS: true
    });
    
    // Subscribe to the chatroom channel
    const channelName = `chatrooms.${chatroomId}.v2`;
    console.log('Subscribing to Kick channel:', channelName);
    const channel = pusher.subscribe(channelName);
    
    // Listen for different message events
    channel.bind('App\\Events\\ChatMessageEvent', function(data) {
        console.log('Received Kick message event:', data);
        console.log('Message content:', data.content);
        console.log('Message metadata:', data.metadata);
        if (data.sender && data.content) {
            const username = data.sender.username || data.sender.slug;
            const emotes = data.metadata?.emotes || [];
            console.log('Extracted emotes:', emotes);
            addChatMessage('kick', username, data.content, new Date(), emotes);
        }
    });
    
    channel.bind('pusher:subscription_succeeded', function() {
        console.log('Successfully subscribed to Kick channel');
        addChatMessage('kick', 'System', '✓ Connected to Kick chat', new Date());
    });
    
    channel.bind('pusher:subscription_error', function(status) {
        console.error('Kick subscription error:', status);
        addChatMessage('kick', 'System', '✗ Failed to subscribe to chat', new Date());
    });
    
    // Connection status
    pusher.connection.bind('connected', function() {
        console.log('Connected to Kick WebSocket');
    });
    
    pusher.connection.bind('disconnected', function() {
        console.log('Disconnected from Kick WebSocket');
    });
    
    pusher.connection.bind('error', function(err) {
        console.error('Kick connection error:', err);
    });
    
    pusher.connection.bind('state_change', function(states) {
        console.log('Kick connection state change:', states.previous, '->', states.current);
    });
    
    kickSocket = pusher;
}

// YouTube Chat Integration (using YouTube Live Streaming API)
let youtubeInterval = null;

function connectYouTube() {
    if (!config.usernames.youtube) return;
    
    // Note: YouTube Live Chat API requires OAuth2
    // This is a placeholder
    console.log('YouTube integration ready for:', config.usernames.youtube);
    
    // Simulate a connection message
    setTimeout(() => {
        addChatMessage('youtube', 'System', 'YouTube chat requires live stream ID and API key', new Date());
    }, 1500);
}

// Initialize connections
function init() {
    console.log('Initializing chat overlay with config:', config);
    
    // Connect to enabled platforms
    config.platforms.forEach(platform => {
        switch(platform) {
            case 'twitch':
                if (config.usernames.twitch) {
                    connectTwitch();
                }
                break;
            case 'kick':
                if (config.usernames.kick) {
                    connectKick();
                }
                break;
            case 'youtube':
                if (config.usernames.youtube) {
                    connectYouTube();
                }
                break;
        }
    });
    
    // If no platforms configured, show a helpful message
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

// Start when page loads
window.addEventListener('DOMContentLoaded', init);

// Cleanup on unload
window.addEventListener('beforeunload', () => {
    if (twitchSocket) {
        twitchSocket.close();
    }
    if (kickSocket) {
        kickSocket.disconnect();
    }
    if (youtubeInterval) {
        clearInterval(youtubeInterval);
    }
});

// Demo mode for testing (generates fake messages)
if (urlParams.get('demo') === '1') {
    const demoMessages = [
        { platform: 'twitch', user: 'Viewer1', text: 'Hello everyone! 👋' },
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
