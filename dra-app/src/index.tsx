import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';
import App from './App';

try {
  const localTheme = localStorage.getItem('dra-theme');
  if (localTheme === 'light') {
    document.documentElement.classList.remove('dark');
  } else {
    document.documentElement.classList.add('dark');
  }
} catch {
  // Ignore storage restrictions
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
