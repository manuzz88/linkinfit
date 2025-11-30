import { hapticFeedback } from '../utils/haptics';
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Calendar, Target, Flame, Award, Zap } from 'lucide-react'
import { useWorkout } from '../contexts/WorkoutContext'
import { getUserStats, WorkoutStats } from '../services/apiService'

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const { state } = useWorkout()
  const [stats, setStats] = useState<WorkoutStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Carica statistiche reali dal backend
    const loadStats = async () => {
      try {
        const userId = state.user?.id || 1019529575 // Fallback al tuo ID
        const data = await getUserStats(userId)
        setStats(data)
      } catch (error) {
        console.error('Errore caricamento stats:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadStats()
  }, [state.user])

  const handleStartWorkout = () => {
    hapticFeedback('impact', 'medium')
    navigate('/workout')
  }

  const handleQuickAction = (action: string) => {
    hapticFeedback('selection')
    navigate(`/${action}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <div className="text-lg font-bold">Caricamento...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dashboard-container">
      {/* Hero Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Ciao {state.user?.first_name}
          </h1>
          <p className="text-gray-600 mb-6">
            Pronto per l'allenamento di oggi?
          </p>
          
          <button
            onClick={handleStartWorkout}
            className="inline-flex items-center px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors haptic-medium shadow-sm"
          >
            <Play className="w-5 h-5 mr-2 fill-current" />
            Inizia Workout
          </button>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6 pb-20">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Flame className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-3xl font-bold text-gray-900">{stats?.current_streak || 0}</span>
            </div>
            <p className="text-sm text-gray-600 font-medium">Giorni consecutivi</p>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-3xl font-bold text-gray-900">{stats?.total_workouts || 0}</span>
            </div>
            <p className="text-sm text-gray-600 font-medium">Workout totali</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Azioni rapide</h2>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleQuickAction('statistics')}
              className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 flex flex-col items-start hover:border-blue-300 transition-colors haptic-light"
            >
              <div className="text-sm font-semibold text-gray-900 mb-1">Statistiche</div>
              <div className="text-xs text-gray-500">Progressi</div>
            </button>

            <button
              onClick={() => handleQuickAction('ai-coach')}
              className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 flex flex-col items-start hover:border-blue-300 transition-colors haptic-light"
            >
              <div className="text-sm font-semibold text-gray-900 mb-1">Coach AI</div>
              <div className="text-xs text-gray-500">Consigli</div>
            </button>

            <button
              onClick={() => handleQuickAction('supplements')}
              className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 flex flex-col items-start hover:border-blue-300 transition-colors haptic-light"
            >
              <div className="text-sm font-semibold text-gray-900 mb-1">Integratori</div>
              <div className="text-xs text-gray-500">Piano</div>
            </button>

            <button
              onClick={() => handleQuickAction('settings')}
              className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 flex flex-col items-start hover:border-blue-300 transition-colors haptic-light"
            >
              <div className="text-sm font-semibold text-gray-900 mb-1">Impostazioni</div>
              <div className="text-xs text-gray-500">Profilo</div>
            </button>
          </div>
        </div>

        {/* Today's Plan */}
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Piano di oggi</h3>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-semibold text-gray-900 mb-2">Upper A - Push</div>
                <div className="flex items-center text-gray-600 space-x-4 text-sm">
                  <span className="flex items-center">
                    <Target className="w-4 h-4 mr-1" />
                    9 esercizi
                  </span>
                  <span className="flex items-center">
                    <Zap className="w-4 h-4 mr-1" />
                    ~60 min
                  </span>
                </div>
              </div>
              <button
                onClick={handleStartWorkout}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors haptic-light flex items-center text-sm"
              >
                <Play className="w-4 h-4 mr-1 fill-current" />
                Inizia
              </button>
            </div>
          </div>
        </div>

        {/* Weekly Progress */}
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
              <Target className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Progresso settimanale</h3>
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-3xl font-bold text-gray-900">
                {stats?.week_count || 0}<span className="text-xl text-gray-500">/{stats?.weekly_goal || 4}</span>
              </div>
              <div className="text-sm text-gray-600">Workout completati</div>
            </div>
            
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900">{stats?.week_percentage || 0}%</div>
              <div className="text-sm text-gray-600">Obiettivo</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{ width: `${stats?.week_percentage || 0}%` }}></div>
          </div>
          
          {/* Week Days */}
          <div className="flex justify-between gap-1">
            {['L', 'M', 'M', 'G', 'V', 'S', 'D'].map((day, i) => {
              const hasWorkout = stats?.weekly_workouts?.[i]
              const today = new Date().getDay()
              const todayIndex = today === 0 ? 6 : today - 1
              const isToday = i === todayIndex
              
              return (
                <div key={`day-${i}`} className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-semibold ${
                    hasWorkout ? 'bg-green-600 text-white' : 
                    isToday ? 'bg-blue-600 text-white' : 
                    'bg-gray-100 text-gray-400'
                  }`}>
                    {day}
                  </div>
                  <div className="text-xs mt-1 text-gray-500">
                    {hasWorkout ? '✓' : ''}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}

export default Dashboard
