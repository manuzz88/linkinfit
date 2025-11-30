import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { WorkoutProvider } from './contexts/WorkoutContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'

// Components
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import SmartCoachHome from './components/SmartCoachHome'
import WorkoutSession from './components/WorkoutSession'
import GymMonitorWorkout from './components/GymMonitorWorkout'
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
  const { user: supabaseUser, loading: authLoading } = useAuth()

  useEffect(() => {
    const initApp = async () => {
      try {
        if (supabaseUser) {
          setUser({
            id: 1019529575,
            first_name: supabaseUser.email?.split('@')[0] || 'Manuel',
            last_name: '',
            username: supabaseUser.email?.split('@')[0] || 'manuel',
            language_code: 'it'
          })
        }
        
        await new Promise(resolve => setTimeout(resolve, 500))
        
      } catch (error) {
        console.error('Error initializing app:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (!authLoading) {
      initApp()
    }
  }, [supabaseUser, authLoading])

  if (isLoading || authLoading) {
    return <LoadingScreen />
  }

  if (!supabaseUser) {
    return <LoginPage />
  }

  return (
    <WorkoutProvider user={user || { id: 0, first_name: 'Guest' }}>
      <Router>
        <div className="min-h-screen bg-gray-900">
          <Routes>
            {/* Home principale - Coach AI guida tutto */}
            <Route index element={<SmartCoachHome />} />
            
            {/* Workout - Layout monitor palestra */}
            <Route path="workout" element={<GymMonitorWorkout />} />
            
            {/* Altre pagine con layout */}
            <Route path="/" element={<Layout />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="workout-mobile" element={<WorkoutSession />} />
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
