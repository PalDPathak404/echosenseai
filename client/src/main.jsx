import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

import { BrowserRouter } from 'react-router';

import { HelmetProvider } from 'react-helmet-async';

import ErrorBoundary from './components/ErrorBoundary';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </HelmetProvider>
    </ErrorBoundary>
  </StrictMode>,
);
