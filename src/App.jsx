import React from 'react';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { OrgProvider } from './context/OrgContext';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import AppRoutes from './routes/AppRoutes';
import CommandPalette from './components/CommandPalette';
import ScrollToTop from './components/ScrollToTop';

const isNativeMobile = window.Capacitor && window.Capacitor.getPlatform && window.Capacitor.getPlatform() !== 'web';
const Router = isNativeMobile ? HashRouter : BrowserRouter;

function App() {
  return (
    <Router>
      <ScrollToTop />
      <ThemeProvider>
        <OrgProvider>
          <NotificationProvider>
            <AuthProvider>
              <CommandPalette />
              <AppRoutes />
            </AuthProvider>
          </NotificationProvider>
        </OrgProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
