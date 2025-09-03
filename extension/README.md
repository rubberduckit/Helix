# Helix - AI-Powered Chrome Extension

Helix is a Manifest V3 Chrome extension that uses a side panel UI to chat with an assistant powered by the Gemini Flash API. Given a user prompt, Helix generates small userscripts to modify the current page (e.g., restyle links, add buttons, tweak interactions) and can inject them on demand.

## Features

- **Modern Chat Interface**: Clean, responsive chat UI built with React and Tailwind CSS
- **Side Panel Navigation**: Easy access to chat, history, and settings
- **Chat History**: View and resume previous conversations
- **Settings Management**: Configure API keys and extension preferences
- **AI-Powered Scripts**: Generate userscripts based on natural language descriptions

## UI Components

### Chat Page
- Main chat interface with message history
- User and AI message bubbles with timestamps
- Loading indicators for AI responses
- Welcome message for new conversations

### History Page
- List of previous chat sessions
- Resume conversations from where you left off
- Delete old conversations
- Session metadata (title, last message, timestamp, message count)

### Settings Page
- API key configuration for Gemini
- Extension information and version details
- About section with documentation links
- Save and reset functionality

### Sidebar Navigation
- Helix logo and branding
- New chat button (plus icon)
- Chat history button (clock icon)
- Settings button (gear icon)

## Technology Stack

- **Frontend**: React 19 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Build Tool**: Vite
- **Package Manager**: npm

## Development

### Prerequisites
- Node.js 18+ 
- npm

### Setup
1. Clone the repository
2. Navigate to the `extension` directory
3. Install dependencies:
   ```bash
   npm install
   ```

### Development Server
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Linting
```bash
npm run lint
```

## Project Structure

```
src/
├── components/
│   ├── ui/           # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── textarea.tsx
│   ├── ChatInput.tsx
│   ├── ChatMessage.tsx
│   ├── ChatPage.tsx
│   ├── HistoryPage.tsx
│   ├── SettingsPage.tsx
│   └── Sidebar.tsx
├── lib/
│   └── utils.ts      # Utility functions
├── App.tsx           # Main application component
├── main.tsx          # Application entry point
└── index.css         # Global styles and CSS variables
```

## Usage

1. **Start a New Chat**: Click the plus icon in the sidebar to begin a new conversation
2. **Describe Changes**: Tell Helix what you want to modify on the current page
3. **Review Scripts**: Helix will generate and show you the userscript code
4. **Inject Scripts**: Apply the changes directly to the current page
5. **Save Conversations**: All chats are automatically saved to your history

## Future Enhancements

- [ ] Gemini API integration for actual AI responses
- [ ] Userscript generation and injection
- [ ] Chrome storage for persistent data
- [ ] Dark mode support
- [ ] Export/import chat history
- [ ] Custom userscript templates

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.
