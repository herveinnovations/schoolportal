import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app/App'
import './styles/index.css'
import logo from './assets/alphatech-logo.png'

try {
  const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]') ?? Object.assign(document.createElement('link'), { rel: 'icon' })
  link.type = 'image/png'; link.href = logo; document.head.appendChild(link)
} catch { /* favicon is optional */ }

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
