# Helix Theme System

This document describes the theme system implemented in the Helix Chrome extension.

## Overview

The theme system provides four distinct visual themes for the chat interface:

1. **Light Theme** - Clean white background with dark text
2. **Dark Theme** - Dark background with light text  
3. **System Theme** - Automatically follows your system preference
4. **Dynamic Theme** - Changes based on time of day (light during day, dark at night)

## Features

- **Theme Persistence**: Your theme choice is saved in localStorage
- **System Integration**: Automatically detects and follows system dark/light mode
- **Dynamic Switching**: Time-based theme changes for the dynamic option
- **Smooth Transitions**: CSS transitions for theme changes
- **Consistent Design**: All components use theme-aware colors

## Theme Variables

The system uses CSS custom properties for consistent theming:

### Core Colors
- `--background` - Main background color
- `--foreground` - Main text color
- `--card` - Card/component background
- `--muted` - Muted/secondary background
- `--primary` - Primary accent color
- `--border` - Border colors

### Chat-Specific Colors
- `--chat-input` - Chat input background
- `--chat-input-foreground` - Chat input text
- `--chat-input-border` - Chat input border
- `--chat-send-bg` - Send button background
- `--chat-send-foreground` - Send button text
- `--chat-icon` - Icon colors

### Sidebar Colors
- `--sidebar` - Sidebar background
- `--sidebar-foreground` - Sidebar text
- `--sidebar-primary` - Sidebar primary elements
- `--sidebar-accent` - Sidebar hover states

## Usage

### Changing Themes

1. Navigate to Settings page
2. Select your preferred theme from the Appearance section
3. Theme changes are applied immediately

### Theme Context

The theme system is implemented using React Context:

```tsx
import { useTheme } from '@/contexts/ThemeContext';

const { theme, setTheme, currentTheme } = useTheme();
```

## Implementation Details

- **ThemeProvider**: Wraps the entire app and manages theme state
- **CSS Variables**: All colors are defined as CSS custom properties
- **Tailwind Integration**: Uses Tailwind's CSS variable system
- **Responsive**: Automatically updates when system preferences change

## File Structure

```
src/
├── contexts/
│   └── ThemeContext.tsx          # Theme context and provider
├── components/
│   ├── SettingsPage.tsx          # Theme selection UI
│   ├── ChatInput.tsx             # Themed chat input
│   ├── ChatMessage.tsx           # Themed message bubbles
│   ├── Sidebar.tsx               # Themed sidebar
│   └── ...
└── index.css                     # Theme CSS variables
```

## Customization

To add new themes or modify existing ones:

1. Add new CSS variables in `index.css`
2. Update the `ThemeContext.tsx` if needed
3. Ensure all components use theme-aware colors
4. Test across all theme variations
