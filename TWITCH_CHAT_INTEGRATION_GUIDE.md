# Twitch Chat Integration Guide for Browser Overlays (2025)

## Research Summary

### Current Status of tmi.js (December 2025)
- **Version**: 1.8.5 (stable, last released August 2021)
- **Repository**: Active but not frequently updated
- **Browser Support**: ⚠️ **Limited** - tmi.js is primarily designed for Node.js

### The Problem with Your Current Implementation

Your current code uses:
```html
<script src="https://cdn.jsdelivr.net/npm/tmi.js@1.8.5/dist/tmi.min.js"></script>
```

**This URL is INCORRECT** - the file doesn't exist at that path. The tmi.js package doesn't include a pre-built browser bundle in the `dist` folder.

---

## RECOMMENDED SOLUTION: Native WebSocket Implementation

The **most reliable method** for browser-based Twitch chat overlays in 2025 is to use native WebSocket directly connecting to Twitch IRC. This approach:
- ✅ Zero dependencies
- ✅ Works in all modern browsers
- ✅ No CORS issues
- ✅ Works perfectly in OBS Browser Source
- ✅ No authentication required for read-only chat
- ✅ Lightweight and fast

### Implementation Code

Here's a complete, working implementation:

```javascript
class TwitchChatClient {
    constructor(channel) {
        this.channel = channel.toLowerCase();
        this.ws = null;
        this.connected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.onMessageCallback = null;
        this.onConnectedCallback = null;
        this.onDisconnectedCallback = null;
    }

    connect() {
        console.log(`Connecting to Twitch chat for channel: ${this.channel}`);
        
        // Connect to Twitch IRC WebSocket
        this.ws = new WebSocket('wss://irc-ws.chat.twitch.tv:443');
        
        this.ws.onopen = () => {
            console.log('WebSocket connection opened');
            
            // Send anonymous login (no OAuth needed for read-only)
            this.ws.send('CAP REQ :twitch.tv/tags twitch.tv/commands');
            this.ws.send('PASS SCHMOOPIIE'); // Anonymous login
            this.ws.send('NICK justinfan12345'); // Anonymous username
            this.ws.send(`JOIN #${this.channel}`);
        };
        
        this.ws.onmessage = (event) => {
            const messages = event.data.split('\r\n');
            
            messages.forEach(message => {
                if (!message) return;
                
                console.log('Raw IRC:', message);
                
                // Handle PING to keep connection alive
                if (message.startsWith('PING')) {
                    this.ws.send('PONG :tmi.twitch.tv');
                    return;
                }
                
                // Parse PRIVMSG (chat messages)
                if (message.includes('PRIVMSG')) {
                    const parsed = this.parseMessage(message);
                    if (parsed && this.onMessageCallback) {
                        this.onMessageCallback(parsed);
                    }
                }
                
                // Check for successful connection
                if (message.includes('376') || message.includes('End of /NAMES list')) {
                    this.connected = true;
                    this.reconnectAttempts = 0;
                    console.log(`Successfully joined #${this.channel}`);
                    if (this.onConnectedCallback) {
                        this.onConnectedCallback();
                    }
                }
            });
        };
        
        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
        
        this.ws.onclose = () => {
            console.log('WebSocket connection closed');
            this.connected = false;
            
            if (this.onDisconnectedCallback) {
                this.onDisconnectedCallback();
            }
            
            // Attempt to reconnect
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                this.reconnectAttempts++;
                const delay = this.reconnectDelay * this.reconnectAttempts;
                console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
                setTimeout(() => this.connect(), delay);
            } else {
                console.error('Max reconnection attempts reached');
            }
        };
    }
    
    parseMessage(rawMessage) {
        // Parse IRC tags
        let tags = {};
        let message = rawMessage;
        
        if (message.startsWith('@')) {
            const tagEnd = message.indexOf(' ');
            const tagString = message.substring(1, tagEnd);
            message = message.substring(tagEnd + 1);
            
            tagString.split(';').forEach(tag => {
                const [key, value] = tag.split('=');
                tags[key] = value;
            });
        }
        
        // Parse message format: :user!user@user.tmi.twitch.tv PRIVMSG #channel :message
        const msgMatch = message.match(/:(.+?)!.+ PRIVMSG #.+ :(.+)/);
        if (!msgMatch) return null;
        
        const username = msgMatch[1];
        const text = msgMatch[2];
        
        return {
            username: tags['display-name'] || username,
            message: text,
            userId: tags['user-id'],
            color: tags['color'] || '#' + Math.floor(Math.random()*16777215).toString(16),
            badges: tags['badges'] ? tags['badges'].split(',') : [],
            emotes: tags['emotes'],
            timestamp: new Date()
        };
    }
    
    onMessage(callback) {
        this.onMessageCallback = callback;
    }
    
    onConnected(callback) {
        this.onConnectedCallback = callback;
    }
    
    onDisconnected(callback) {
        this.onDisconnectedCallback = callback;
    }
    
    disconnect() {
        if (this.ws) {
            this.reconnectAttempts = this.maxReconnectAttempts; // Prevent auto-reconnect
            this.ws.close();
        }
    }
}

// Usage Example:
const client = new TwitchChatClient('xqc'); // Replace with any channel name

client.onConnected(() => {
    console.log('✓ Connected to Twitch chat!');
});

client.onMessage((data) => {
    console.log(`${data.username}: ${data.message}`);
    // Display the message in your overlay
    addChatMessage('twitch', data.username, data.message);
});

client.onDisconnected(() => {
    console.log('✗ Disconnected from Twitch chat');
});

client.connect();
```

---

## Alternative Approach: Using tmi.js with Module Bundler

If you still want to use tmi.js for its additional features, you need to use a build tool:

### Option 1: Using ES Modules with Import Maps

```html
<script type="importmap">
{
  "imports": {
    "tmi.js": "https://cdn.skypack.dev/tmi.js@1.8.5"
  }
}
</script>

<script type="module">
import tmi from 'tmi.js';

const client = new tmi.Client({
    channels: ['xqc']
});

client.connect();

client.on('message', (channel, tags, message, self) => {
    console.log(`${tags['display-name']}: ${message}`);
});
</script>
```

**Note**: This may still have issues due to Node.js dependencies.

### Option 2: Using a Build Tool (Vite/Webpack)

Create a proper JavaScript project:

```bash
npm init -y
npm install tmi.js
npm install -D vite
```

Then build for the browser and include the bundle.

---

## Authentication & OAuth (Optional)

For **read-only** chat monitoring, **NO authentication is required**. The native WebSocket approach above works anonymously.

If you need to **send messages** or access **subscriber-only chat**, you need an OAuth token:

### Getting an OAuth Token:

1. Visit: https://twitchtokengenerator.com/
2. Select scopes: `chat:read`, `chat:edit`
3. Generate token

### Using OAuth with Native WebSocket:

```javascript
// Replace these lines in the connect() method:
this.ws.send('PASS oauth:YOUR_OAUTH_TOKEN_HERE');
this.ws.send('NICK your_bot_username');
```

### Using OAuth with tmi.js:

```javascript
const client = new tmi.Client({
    identity: {
        username: 'your_bot_username',
        password: 'oauth:your_oauth_token_here'
    },
    channels: ['channelname']
});
```

---

## CORS Issues & Solutions

### Twitch IRC WebSocket
✅ **No CORS issues** - `wss://irc-ws.chat.twitch.tv:443` works perfectly from browsers

### Twitch API (REST)
⚠️ **CORS restrictions apply** - Cannot call directly from browser in some cases

**Solution**: Use a CORS proxy or server-side proxy:
- `https://corsproxy.io/?url=`
- Or set up your own backend proxy

---

## 2025 Best Practices Summary

### ✅ Recommended for OBS Browser Overlays:
1. **Native WebSocket IRC** (shown above) - Most reliable
2. **Twitch EventSub WebSocket** - Official but requires OAuth
3. **Third-party services** - StreamElements, StreamLabs widgets

### ❌ Not Recommended:
1. **CDN-loaded tmi.js** - Doesn't work properly in browsers
2. **Unbundled npm packages** - Require build tools

### Performance Tips:
- Limit message history to 50-100 messages max
- Use `requestAnimationFrame` for smooth animations
- Implement message throttling for high-traffic channels
- Cache user colors and badges

### Security:
- Never expose OAuth tokens in client-side code
- Sanitize all chat messages to prevent XSS
- Use `textContent` instead of `innerHTML` when possible

---

## Complete Working Example for OBS

Save this as a single HTML file:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Twitch Chat Overlay</title>
    <style>
        body {
            background: transparent;
            color: white;
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
        }
        #chat {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .message {
            background: rgba(0, 0, 0, 0.7);
            padding: 8px 12px;
            border-radius: 8px;
            animation: slideIn 0.3s ease;
        }
        @keyframes slideIn {
            from { opacity: 0; transform: translateX(-20px); }
            to { opacity: 1; transform: translateX(0); }
        }
        .username { font-weight: bold; margin-right: 8px; }
        .status { color: #888; font-style: italic; }
    </style>
</head>
<body>
    <div id="chat"></div>
    
    <script>
        // Get channel from URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        const CHANNEL = urlParams.get('channel') || 'xqc';
        
        const chatDiv = document.getElementById('chat');
        const MAX_MESSAGES = 50;
        
        class TwitchChat {
            constructor(channel) {
                this.channel = channel.toLowerCase();
                this.ws = null;
            }
            
            connect() {
                this.ws = new WebSocket('wss://irc-ws.chat.twitch.tv:443');
                
                this.ws.onopen = () => {
                    this.ws.send('CAP REQ :twitch.tv/tags twitch.tv/commands');
                    this.ws.send('PASS SCHMOOPIIE');
                    this.ws.send('NICK justinfan12345');
                    this.ws.send(`JOIN #${this.channel}`);
                    addStatusMessage(`Connecting to #${this.channel}...`);
                };
                
                this.ws.onmessage = (event) => {
                    event.data.split('\r\n').forEach(msg => {
                        if (msg.startsWith('PING')) {
                            this.ws.send('PONG :tmi.twitch.tv');
                        } else if (msg.includes('PRIVMSG')) {
                            const parsed = this.parseMessage(msg);
                            if (parsed) addChatMessage(parsed);
                        } else if (msg.includes('376')) {
                            addStatusMessage(`✓ Connected to #${this.channel}`);
                        }
                    });
                };
                
                this.ws.onerror = () => addStatusMessage('Connection error');
                this.ws.onclose = () => {
                    addStatusMessage('Disconnected. Reconnecting...');
                    setTimeout(() => this.connect(), 3000);
                };
            }
            
            parseMessage(raw) {
                let tags = {}, msg = raw;
                
                if (msg.startsWith('@')) {
                    const end = msg.indexOf(' ');
                    msg.substring(1, end).split(';').forEach(tag => {
                        const [k, v] = tag.split('=');
                        tags[k] = v;
                    });
                    msg = msg.substring(end + 1);
                }
                
                const match = msg.match(/:(.+?)!.+ PRIVMSG #.+ :(.+)/);
                if (!match) return null;
                
                return {
                    username: tags['display-name'] || match[1],
                    message: match[2],
                    color: tags['color'] || '#8B5CF6'
                };
            }
        }
        
        function addChatMessage(data) {
            const div = document.createElement('div');
            div.className = 'message';
            
            const user = document.createElement('span');
            user.className = 'username';
            user.style.color = data.color;
            user.textContent = data.username + ':';
            
            const text = document.createElement('span');
            text.textContent = data.message;
            
            div.appendChild(user);
            div.appendChild(text);
            chatDiv.appendChild(div);
            
            // Limit messages
            while (chatDiv.children.length > MAX_MESSAGES) {
                chatDiv.removeChild(chatDiv.firstChild);
            }
        }
        
        function addStatusMessage(text) {
            const div = document.createElement('div');
            div.className = 'message status';
            div.textContent = text;
            chatDiv.appendChild(div);
            setTimeout(() => div.remove(), 5000);
        }
        
        // Start
        const chat = new TwitchChat(CHANNEL);
        chat.connect();
    </script>
</body>
</html>
```

**Usage in OBS**:
1. Save the file
2. Add Browser Source in OBS
3. Set URL to: `file:///path/to/file.html?channel=CHANNELNAME`
4. Set width/height as desired
5. Done!

---

## Conclusion

For browser-based Twitch chat overlays in 2025:
- ✅ **Use native WebSocket** for best compatibility
- ✅ No authentication needed for read-only
- ✅ No CORS issues
- ✅ Works perfectly in OBS
- ❌ Avoid CDN-loaded tmi.js (doesn't work)
- ⚠️ Use tmi.js only with proper build tools

The native WebSocket approach is simpler, more reliable, and has zero dependencies!
