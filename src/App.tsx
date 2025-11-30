import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useTelegramWebApp } from './hooks/useTelegramWebApp'
import { WorkoutProvider } from './contexts/WorkoutContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'

// Components
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import WorkoutSession from './components/WorkoutSession'
import Statistics from './components/Statistics'
import AICoach from './components/AICoach'
import Settings from './components/Settings'
import Supplements from './components/Supplements'
import LoadingScreen from './components/LoadingScreen'
import { LoginPage } from './components/Auth/LoginPage'

// Types
interface User {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

function AppContent() {
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const { webApp, isAvailable } = useTelegramWebApp()
  const { user: supabaseUser, loading: authLoading } = useAuth()

  useEffect(() => {
    // Initialize app
    const initApp = async () => {
      try {
        // Se abbiamo un utente Supabase, usalo
        if (supabaseUser) {
          setUser({
            id: 1019529575,
            first_name: supabaseUser.email?.split('@')[0] || 'Manuel',
            last_name: '',
            username: supabaseUser.email?.split('@')[0] || 'manuel',
            language_code: 'it'
          })
        } else {
          // Get user data from Telegram or mock data
          const userData = window.telegramUser || null
          setUser(userData)
        }
        
        // Configure Telegram WebApp if available
        if (webApp && isAvailable) {
          // Set main button
          webApp.MainButton.setText('Inizia Workout')
          webApp.MainButton.show()
          
          // Set back button handler
          webApp.BackButton.onClick(() => {
            window.history.back()
          })
          
          console.log('Telegram WebApp configured')
        }
        
        // Simulate loading time
        await new Promise(resolve => setTimeout(resolve, 1000))
        
      } catch (error) {
        console.error('Error initializing app:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (!authLoading) {
      initApp()
    }
  }, [webApp, isAvailable, supabaseUser, authLoading])

  if (isLoading || authLoading) {
    return <LoadingScreen />
  }

  // Se non c'e utente Telegram e non c'e utente Supabase, mostra login
  if (!user && !supabaseUser) {
    return <LoginPage />
  }

  return (
    <WorkoutProvider user={user || { id: 0, first_name: 'Guest' }}>
      <Router>
        <div className="min-h-screen tg-bg">
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="workout" element={<WorkoutSession />} />
              <Route path="statistics" element={<Statistics />} />
              <Route path="ai-coach" element={<AICoach />} />
              <Route path="supplements" element={<Supplements />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </div>
      </Router>
    </WorkoutProvider>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
