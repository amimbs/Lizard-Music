import React from 'react'
import ReactDOM from 'react-dom/client'
import { initTheme } from './hooks/useTheme.js'
import App from './App.jsx'
import './index.css'

initTheme()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
