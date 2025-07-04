import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ThemeProvider } from './contexts/ThemeContext.tsx';
import './index.css';

// Error boundary for the entire application
const renderApp = () => {
  try {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </StrictMode>
    );
  } catch (error) {
    console.error('Failed to render application:', error);
    
    // Render fallback UI if the app fails to load
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="font-family: system-ui, sans-serif; padding: 2rem; text-align: center;">
          <h1 style="color: #4b5563; margin-bottom: 1rem;">Something went wrong</h1>
          <p style="color: #6b7280; margin-bottom: 2rem;">We're having trouble loading the application. Please try refreshing the page.</p>
          <button onclick="window.location.reload()" style="background: #3b82f6; color: white; border: none; padding: 0.5rem 1rem; border-radius: 0.375rem; cursor: pointer;">
            Refresh Page
          </button>
        </div>
      `;
    }
  }
};

renderApp();