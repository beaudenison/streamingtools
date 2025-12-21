# Streaming Tools

An open-source toolkit of browser-based utilities for streamers and content creators. Use the hosted service or fork and customize for your own needs.

## 🚀 Use the Service

<div align="center">

### 👉 [**🎥 ACCESS STREAMING TOOLS →**](https://beaudenison.github.io/streamingtools) 👈

[![Live Site](https://img.shields.io/badge/🌐_Live_Site-Click_Here-5865f2?style=for-the-badge&labelColor=2b2d31)](https://beaudenison.github.io/streamingtools)
[![Status](https://img.shields.io/badge/Status-Online-00d9a3?style=for-the-badge&labelColor=2b2d31)](https://beaudenison.github.io/streamingtools)
[![Free](https://img.shields.io/badge/💯_Free-No_Signup-00d9a3?style=for-the-badge&labelColor=2b2d31)](https://beaudenison.github.io/streamingtools)

</div>

All tools are free to use, work directly in your browser, and require no installation.

## 🛠️ Build Your Own

This project is open source and designed to be a foundation for your own streaming tools:

- **Fork & Customize**: Modify existing tools to fit your workflow
- **Add New Features**: Build additional tools using the existing codebase as a starting point
- **Self-Host**: Deploy your own version on GitHub Pages or any static host
- **Learn & Experiment**: Explore how browser-based streaming tools work

Feel free to use this as a baseline and make it your own!

## ✨ Current Tools

### Multi-Platform Chat Overlay

Display chat messages from multiple streaming platforms simultaneously in OBS.

**Features:**
- **Platforms**: Twitch (live), Kick (live), YouTube (in development)
- **Customization**: Text colors, font sizes, platform logos, timestamps
- **Easy Setup**: No authentication required, just enter usernames
- **OBS Ready**: Copy-paste browser source URL

**Quick Start:**
1. Visit the [configuration page](https://beaudenison.github.io/streamingtools/chat-overlay/config.html)
2. Select platforms and enter usernames
3. Customize appearance
4. Copy the browser source URL
5. Add to OBS as a Browser Source (recommended: 800x600)

**Demo Mode**: Add `&demo=1` to the overlay URL to test without live chat

---

*More tools coming soon...*

## � For Developers

### Project Structure

```
streamingtools/
├── index.html              # Main landing page
├── styles.css              # Global styles
├── chat-overlay/
│   ├── config.html        # Configuration interface
│   ├── overlay.html       # Chat overlay display
│   ├── config.js          # Configuration logic
│   ├── overlay.js         # Chat integration logic
│   └── chat-overlay.css   # Overlay-specific styles
└── README.md
```

### Tech Stack

- **Pure HTML/CSS/JavaScript** - No build tools required
- **Client-side only** - Perfect for GitHub Pages
- **TMI.js** - Twitch IRC integration (loaded via CDN)

### Customization

All styling is done via CSS variables - edit [styles.css](styles.css) or [chat-overlay.css](chat-overlay/chat-overlay.css) to customize colors, fonts, and layouts.

### Deployment

1. Fork this repository
2. Enable GitHub Pages in Settings → Pages
3. Set source to `main` branch
4. Your tools will be available at `https://yourusername.github.io/streamingtools`

### API Integration Notes

- **Twitch**: Works anonymously via TMI.js IRC connection
- **Kick**: Uses Pusher WebSocket API to connect to Kick's chatroom system
- **YouTube**: Requires OAuth2 and Live Streaming API setup

## 💡 Tips

- Test your overlay before going live using demo mode
- Keep overlay dimensions reasonable to avoid performance issues
- Use contrasting colors for better readability
- Consider your stream's background when choosing colors

## 🤝 Contributing

This is an open-source project! Contributions, ideas, and improvements are welcome:
- Report bugs or suggest features via Issues
- Submit pull requests with enhancements
- Share your custom tools or modifications
- Help improve documentation

## 📝 License

This project is open source and available under the MIT License. Feel free to use, modify, and distribute as you see fit.

---

**Use it as a service or make it your own** • Created by [@beaudenison](https://x.com/beaudenison)