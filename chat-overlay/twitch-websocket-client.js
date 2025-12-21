/**
 * Native WebSocket Twitch Chat Client
 * Browser-compatible, zero dependencies
 * Works perfectly in OBS Browser Source
 * December 2025 - Best practice implementation
 */

class TwitchWebSocketClient {
    constructor(channel, options = {}) {
        this.channel = channel.toLowerCase();
        this.ws = null;
        this.connected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = options.maxReconnectAttempts || 5;
        this.reconnectDelay = options.reconnectDelay || 1000;
        this.pingInterval = null;
        
        // Callbacks
        this.callbacks = {
            onMessage: null,
            onConnected: null,
            onDisconnected: null,
            onError: null,
            onReconnecting: null
        };
    }

    /**
     * Connect to Twitch IRC via WebSocket
     * Uses anonymous login - no OAuth required for read-only chat
     */
    connect() {
        console.log(`[TwitchChat] Connecting to channel: #${this.channel}`);
        
        try {
            // Connect to Twitch IRC WebSocket server
            // This endpoint has no CORS restrictions and works from browsers
            this.ws = new WebSocket('wss://irc-ws.chat.twitch.tv:443');
            
            this.ws.onopen = () => this.handleOpen();
            this.ws.onmessage = (event) => this.handleMessage(event);
            this.ws.onerror = (error) => this.handleError(error);
            this.ws.onclose = () => this.handleClose();
            
        } catch (error) {
            console.error('[TwitchChat] Failed to create WebSocket:', error);
            this.triggerCallback('onError', error);
        }
    }

    /**
     * Handle WebSocket connection opened
     */
    handleOpen() {
        console.log('[TwitchChat] WebSocket connection opened');
        
        // Request capabilities for tags and commands
        // Tags provide user info, colors, badges, etc.
        this.sendRaw('CAP REQ :twitch.tv/tags twitch.tv/commands');
        
        // Anonymous login (no authentication needed for read-only)
        // justinfan + random numbers is the convention for anonymous users
        const anonUsername = 'justinfan' + Math.floor(Math.random() * 100000);
        this.sendRaw('PASS SCHMOOPIIE');
        this.sendRaw(`NICK ${anonUsername}`);
        
        // Join the channel
        this.sendRaw(`JOIN #${this.channel}`);
        
        // Start ping interval to keep connection alive
        this.startPingInterval();
    }

    /**
     * Handle incoming WebSocket messages
     */
    handleMessage(event) {
        const messages = event.data.split('\r\n');
        
        messages.forEach(message => {
            if (!message) return;
            
            // Log raw IRC message for debugging
            if (message !== '') {
                console.log('[TwitchChat] IRC:', message);
            }
            
            // Handle PING to keep connection alive
            if (message.startsWith('PING')) {
                this.sendRaw('PONG :tmi.twitch.tv');
                return;
            }
            
            // Handle PRIVMSG (chat messages)
            if (message.includes('PRIVMSG')) {
                const parsed = this.parsePrivMsg(message);
                if (parsed) {
                    this.triggerCallback('onMessage', parsed);
                }
            }
            
            // Handle successful join
            if (message.includes('376') || message.includes('End of /NAMES list')) {
                this.connected = true;
                this.reconnectAttempts = 0;
                console.log(`[TwitchChat] Successfully joined #${this.channel}`);
                this.triggerCallback('onConnected', { channel: this.channel });
            }
            
            // Handle JOIN confirmation
            if (message.includes(`JOIN #${this.channel}`)) {
                console.log(`[TwitchChat] JOIN confirmed for #${this.channel}`);
            }
        });
    }

    /**
     * Parse IRC PRIVMSG into usable data
     * Format: @tags :user!user@user.tmi.twitch.tv PRIVMSG #channel :message
     */
    parsePrivMsg(rawMessage) {
        try {
            let tags = {};
            let message = rawMessage;
            
            // Extract IRC tags if present
            if (message.startsWith('@')) {
                const tagEnd = message.indexOf(' ');
                const tagString = message.substring(1, tagEnd);
                message = message.substring(tagEnd + 1);
                
                // Parse tags into object
                tagString.split(';').forEach(tag => {
                    const [key, value] = tag.split('=');
                    tags[key] = value || '';
                });
            }
            
            // Parse username and message content
            // Format: :username!username@username.tmi.twitch.tv PRIVMSG #channel :message text
            const msgMatch = message.match(/:(.+?)!.+?@.+? PRIVMSG #.+ :(.+)/);
            if (!msgMatch) return null;
            
            const username = msgMatch[1];
            const text = msgMatch[2];
            
            // Extract display name (with proper capitalization)
            const displayName = tags['display-name'] || username;
            
            // Generate color if not provided
            let color = tags['color'];
            if (!color || color === '') {
                // Generate consistent color from username
                color = this.generateColorFromUsername(username);
            }
            
            return {
                // User information
                username: username,
                displayName: displayName,
                userId: tags['user-id'],
                
                // Message content
                message: text,
                
                // Visual styling
                color: color,
                
                // Badges (broadcaster, moderator, subscriber, etc.)
                badges: this.parseBadges(tags['badges']),
                
                // Emotes data (for replacing with images)
                emotes: tags['emotes'],
                
                // Metadata
                timestamp: new Date(),
                id: tags['id'],
                
                // User type flags
                isMod: tags['mod'] === '1',
                isSubscriber: tags['subscriber'] === '1',
                isBroadcaster: tags['badges']?.includes('broadcaster'),
                
                // Raw tags for advanced use
                rawTags: tags
            };
            
        } catch (error) {
            console.error('[TwitchChat] Failed to parse message:', error);
            return null;
        }
    }

    /**
     * Parse badge string into array
     * Format: "broadcaster/1,subscriber/12"
     */
    parseBadges(badgeString) {
        if (!badgeString) return [];
        
        return badgeString.split(',').map(badge => {
            const [name, version] = badge.split('/');
            return { name, version };
        });
    }

    /**
     * Generate consistent color from username
     */
    generateColorFromUsername(username) {
        // Predefined color palette (Twitch-like colors)
        const colors = [
            '#FF0000', '#0000FF', '#008000', '#B22222', '#FF7F50',
            '#9ACD32', '#FF4500', '#2E8B57', '#DAA520', '#D2691E',
            '#5F9EA0', '#1E90FF', '#FF69B4', '#8A2BE2', '#00FF7F'
        ];
        
        // Generate hash from username
        let hash = 0;
        for (let i = 0; i < username.length; i++) {
            hash = username.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        // Use hash to pick color
        const index = Math.abs(hash) % colors.length;
        return colors[index];
    }

    /**
     * Send raw IRC command
     */
    sendRaw(command) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(command + '\r\n');
        }
    }

    /**
     * Start ping interval to keep connection alive
     */
    startPingInterval() {
        // Send PING every 4 minutes (Twitch disconnects after 5 minutes of inactivity)
        this.pingInterval = setInterval(() => {
            if (this.connected) {
                this.sendRaw('PING :tmi.twitch.tv');
            }
        }, 240000); // 4 minutes
    }

    /**
     * Handle WebSocket errors
     */
    handleError(error) {
        console.error('[TwitchChat] WebSocket error:', error);
        this.triggerCallback('onError', error);
    }

    /**
     * Handle WebSocket connection closed
     */
    handleClose() {
        console.log('[TwitchChat] WebSocket connection closed');
        this.connected = false;
        
        // Clear ping interval
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
        
        this.triggerCallback('onDisconnected', { 
            reconnectAttempts: this.reconnectAttempts 
        });
        
        // Attempt to reconnect with exponential backoff
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
            
            console.log(`[TwitchChat] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            
            this.triggerCallback('onReconnecting', {
                attempt: this.reconnectAttempts,
                maxAttempts: this.maxReconnectAttempts,
                delay: delay
            });
            
            setTimeout(() => this.connect(), delay);
        } else {
            console.error('[TwitchChat] Max reconnection attempts reached');
        }
    }

    /**
     * Trigger callback if defined
     */
    triggerCallback(callbackName, data) {
        if (typeof this.callbacks[callbackName] === 'function') {
            this.callbacks[callbackName](data);
        }
    }

    /**
     * Register callback functions
     */
    on(event, callback) {
        const eventName = 'on' + event.charAt(0).toUpperCase() + event.slice(1);
        if (this.callbacks.hasOwnProperty(eventName)) {
            this.callbacks[eventName] = callback;
        } else {
            console.warn(`[TwitchChat] Unknown event: ${event}`);
        }
        return this; // Allow chaining
    }

    /**
     * Disconnect from chat
     */
    disconnect() {
        console.log('[TwitchChat] Disconnecting...');
        
        // Prevent auto-reconnect
        this.reconnectAttempts = this.maxReconnectAttempts;
        
        // Clear ping interval
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
        
        // Close WebSocket
        if (this.ws) {
            this.sendRaw('PART #' + this.channel);
            this.ws.close();
            this.ws = null;
        }
        
        this.connected = false;
    }

    /**
     * Check if currently connected
     */
    isConnected() {
        return this.connected && this.ws && this.ws.readyState === WebSocket.OPEN;
    }
}

// Export for use in modules or make globally available
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TwitchWebSocketClient;
}
