import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import './styles/global.css'

// Guarda en global el aviso nativo de instalación para poder dispararlo
// desde el botón "Instalar app" de la barra superior.
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault()
  window.__pwaInstallPrompt = event
  window.dispatchEvent(new Event('pwa-install-changed'))
})

// Registra el service worker para que la app sea instalable como PWA.
if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
