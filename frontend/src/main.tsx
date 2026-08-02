import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import App from './app/App.tsx'
import { TravelConditionsProvider } from './contexts/TravelConditionsProvider.tsx'
import './styles/tokens.css'
import './styles/reset.css'
import './styles/globals.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <TravelConditionsProvider>
        <App />
      </TravelConditionsProvider>
    </BrowserRouter>
  </StrictMode>,
)
