import React from 'react'
import { TrendingUp, Target, Calendar, Award } from 'lucide-react'
import { useWorkout } from '../contexts/WorkoutContext'

const Statistics: React.FC = () => {
  const { state } = useWorkout()
  const stats = state.statistics || {}

  const statCards = [
    {
      title: 'Workout Totali',
      value: stats.total_workouts || 0,
      icon: TrendingUp,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Streak Attuale',
      value: `${stats.current_streak || 0} giorni`,
      icon: Target,
      color: 'text-green-500',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Miglior Streak',
      value: `${stats.best_streak || 0} giorni`,
      icon: Award,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Esercizi Totali',
      value: stats.total_exercises || 0,
      icon: Calendar,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50'
    }
  ]

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center py-4">
        <h1 className="text-2xl font-bold tg-text mb-2">📊 Statistiche</h1>
        <p className="tg-hint">I tuoi progressi nel fitness</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {statCards.map((stat, index) => (
          <div key={index} className="card text-center">
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${stat.bgColor} mb-3`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div className="text-2xl font-bold tg-text mb-1">
              {stat.value}
            </div>
            <div className="text-sm tg-hint">
              {stat.title}
            </div>
          </div>
        ))}
      </div>

      {/* Weekly Progress */}
      <div className="card">
        <h3 className="font-semibold tg-text mb-4">Progresso Settimanale</h3>
        <div className="space-y-3">
          {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map((day, index) => (
            <div key={day} className="flex items-center justify-between">
              <span className="tg-text font-medium">{day}</span>
              <div className={`w-4 h-4 rounded-full ${
                index < 3 ? 'bg-green-500' : 'tg-secondary-bg'
              }`} />
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Goals */}
      <div className="card">
        <h3 className="font-semibold tg-text mb-4">Obiettivi Mensili</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="tg-text">Workout</span>
              <span className="tg-hint">12/16</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '75%' }} />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="tg-text">Consistenza</span>
              <span className="tg-hint">85%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '85%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Workouts */}
      <div className="card">
        <h3 className="font-semibold tg-text mb-4">Workout Recenti</h3>
        <div className="space-y-3">
          {[
            { name: 'Upper A', date: 'Oggi', duration: '58 min' },
            { name: 'Lower A', date: 'Ieri', duration: '62 min' },
            { name: 'Upper B', date: '2 giorni fa', duration: '55 min' }
          ].map((workout, index) => (
            <div key={index} className="flex items-center justify-between p-3 tg-secondary-bg rounded-lg">
              <div>
                <div className="font-medium tg-text">{workout.name}</div>
                <div className="text-sm tg-hint">{workout.date}</div>
              </div>
              <div className="text-sm tg-hint">{workout.duration}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Statistics
