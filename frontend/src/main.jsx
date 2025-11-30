import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';   // <-- Ensure this matches your actual filename
import './index.css';

const container = document.getElementById('root');

if (!container) {
  console.error('Root element not found: make sure index.html contains <div id="root"></div>');
} else {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}