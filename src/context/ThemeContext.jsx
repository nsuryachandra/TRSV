import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Force light theme only — no dark mode toggle
  const [theme] = useState('light');

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark');
    localStorage.setItem('trsv-theme', 'light');
  }, []);

  // toggleTheme is a no-op to prevent breaking any existing references
  const toggleTheme = () => {};

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: false }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
