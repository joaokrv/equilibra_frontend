import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { OpenAPI } from './api'
import { useAuthStore } from './store/useAuthStore'
import { ToastContainer } from './components/ui/Toast'
import './index.css'
import App from './App.tsx'

// Configuração da API gerada pelo Swagger
// Base vazia = usa proxy do Vite em dev, ou same-origin em produção
OpenAPI.BASE = ''
OpenAPI.WITH_CREDENTIALS = true
OpenAPI.TOKEN = async () => {
  return useAuthStore.getState().token || '';
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <ToastContainer />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
