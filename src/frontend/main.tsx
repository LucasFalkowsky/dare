import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './app.css'
import './lib/i18n'
import App from './App.tsx'
import { TRPCProvider } from './lib/trpc-provider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TRPCProvider>
      <App />
    </TRPCProvider>
  </StrictMode>,
)
