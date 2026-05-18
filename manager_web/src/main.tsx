import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { FeaturesProvider } from './context/FeaturesContext'
import { AuthProvider } from './context/AuthContext'
import './index.css'
import router from './router'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <FeaturesProvider>
        <RouterProvider router={router} />
      </FeaturesProvider>
    </AuthProvider>
  </StrictMode>,
)
