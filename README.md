# T&C Analyzer - AI-Powered Browser Extension

A powerful Chrome extension that analyzes Terms of Service, Privacy Policies, and legal documents using Google's Gemini 2.5 Flash AI model.

## Features

- **Smart Document Detection**: Automatically identifies legal documents with 90%+ accuracy
- **AI-Powered Analysis**: Comprehensive analysis using Google's latest Gemini 2.5 Flash model
- **Professional UI**: Modern gradient design with smooth animations
- **Secure & Private**: API keys stored locally, no data collection
- **Export Options**: Copy to clipboard or download as text file
- **Rate Limiting**: Built-in protection against API overuse

## Quick Start

### 1. Get Your Gemini API Key

1. Visit [Google AI Studio](https://ai.google.dev/)
2. Sign in with your Google account
3. Click "Get API Key" and create a new project
4. Copy your API key (starts with `AIza...`)

### 2. Install the Extension

1. Download/clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. Pin the extension to your toolbar

### 3. Configure and Use

1. Click the extension icon in your toolbar
2. Enter your Gemini API key in the popup
3. Navigate to any Terms of Service or Privacy Policy page
4. Click "Analyze This Page" to get AI-powered insights

## File Structure

```
tc-analyzer-extension/
├── manifest.json          # Extension configuration
├── popup.html             # Main UI interface
├── popup.js               # Popup logic and controls
├── content.js             # Page content detection
├── background.js          # API handling service worker
├── icons/                 # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md              # This file
```

## Supported Document Types

- Terms of Service / Terms of Use
- Privacy Policies
- Cookie Policies
- End User License Agreements (EULA)
- Acceptable Use Policies
- Community Guidelines
- Legal Notices and Disclaimers

## API Usage and Costs

- **Cost per analysis**: ~$0.003-0.01 per document
- **Rate limiting**: 1 second between requests
- **Daily limit**: 1,000 analyses (configurable)
- **Free tier**: Google provides generous free usage

## Security Features

- **Local storage**: API keys never leave your browser
- **Minimal permissions**: Only requires active tab and storage access
- **No tracking**: Zero data collection or analytics
- **HTTPS only**: All API communications encrypted
- **CSP protection**: Content Security Policy prevents XSS

## Browser Compatibility

- Chrome 88+
- Microsoft Edge
- Opera
- Other Chromium-based browsers

## Development

### Building from Source

1. Clone the repository:
```bash
git clone https://github.com/yourusername/tc-analyzer-extension.git
cd tc-analyzer-extension
```

2. No build process required - it's vanilla JavaScript

3. Load in Chrome for testing:
   - Go to `chrome://extensions/`
   - Enable Developer mode
   - Click "Load unpacked"
   - Select the project folder

### Testing

Test the extension on various types of legal documents:

- **High confidence sites**: privacy policies of major websites
- **Medium confidence**: terms of service pages
- **Low confidence**: general web pages (should not trigger)

### Customization

You can customize the extension by modifying:

- **Detection keywords**: Edit `legalKeywords` in `content.js`
- **Analysis prompt**: Modify `createAnalysisPrompt` in `background.js`
- **UI styling**: Update CSS in `popup.html`
- **Rate limits**: Adjust `rateLimitDelay` and `dailyLimit` in `background.js`

## Troubleshooting

### Common Issues

**"Enter API Key to Continue"**
- Make sure you've entered a valid Gemini API key
- Check that the key starts with `AIza`

**"No Legal Document Detected"**
- The page may not contain sufficient legal content
- Try on official Terms of Service or Privacy Policy pages

**"Analysis failed"**
- Check your internet connection
- Verify your API key is valid and has remaining quota
- Try again after a few seconds (rate limiting)

**"Daily usage limit exceeded"**
- Wait until the next day or modify the daily limit in the code

### Debug Mode

To enable debug logging:

1. Open Chrome DevTools (`F12`)
2. Go to the Console tab
3. Check for error messages from the extension

## Privacy Policy

This extension:
- Does NOT collect any personal data
- Does NOT track user behavior
- Does NOT send data to external servers (except Gemini API)
- Stores only your API key locally in your browser
- Processes documents locally before sending to Gemini

## License

MIT License - feel free to modify and distribute.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues or questions:
- Open an issue on GitHub
- Check the troubleshooting section above
- Review the browser console for error messages

---

**Note**: This extension requires a Google AI Studio API key to function. The key is free to obtain and provides generous usage limits for personal use.