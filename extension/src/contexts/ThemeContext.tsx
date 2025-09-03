import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'system' | 'dynamic';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  currentTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('system');
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('helix-theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    // Save theme to localStorage
    localStorage.setItem('helix-theme', theme);
  }, [theme]);

  useEffect(() => {
    const updateCurrentTheme = () => {
      let newTheme: 'light' | 'dark';

      if (theme === 'system') {
        newTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      } else if (theme === 'dynamic') {
        // Dynamic theme changes based on time of day
        const hour = new Date().getHours();
        if (hour >= 6 && hour < 18) {
          newTheme = 'light';
        } else {
          newTheme = 'dark';
        }
      } else {
        newTheme = theme;
      }

      setCurrentTheme(newTheme);
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
      document.documentElement.classList.toggle('dynamic', theme === 'dynamic');
    };

    updateCurrentTheme();

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', updateCurrentTheme);
      return () => mediaQuery.removeEventListener('change', updateCurrentTheme);
    }

    if (theme === 'dynamic') {
      const interval = setInterval(updateCurrentTheme, 60000); // Check every minute
      return () => clearInterval(interval);
    }
  }, [theme]);

  const value: ThemeContextType = {
    theme,
    setTheme,
    currentTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
