import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Initialize Telegram WebApp
declare global {
  interface Window {
    Telegram?: {
      WebApp: any;
    };
    telegramUser?: any;
    telegramWebApp?: any;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
