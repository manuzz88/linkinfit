import { hapticFeedback } from '../utils/haptics';
import React from 'react'
import { User, Bell, Dumbbell, Palette, Info, LogOut } from 'lucide-react'
import { useWorkout } from '../contexts/WorkoutContext'

const Settings: React.FC = () => {
  const { state } = useWorkout()

  const settingsGroups = [
    {
      title: 'Profilo',
      items: [
        {
          icon: User,
          label: 'Informazioni Personali',
          value: `${state.user?.first_name} ${state.user?.last_name || ''}`.trim(),
          action: () => hapticFeedback('selection')
        },
        {
          icon: Dumbbell,
          label: 'Obiettivi Fitness',
          value: 'Aumento massa muscolare',
          action: () => hapticFeedback('selection')
        }
      ]
    },
    {
      title: 'Allenamento',
      items: [
        {
          icon: Bell,
          label: 'Promemoria',
          value: 'Attivi',
          action: () => hapticFeedback('selection')
        },
        {
          icon: Dumbbell,
          label: 'Piano Settimanale',
          value: 'Upper/Lower Split',
          action: () => hapticFeedback('selection')
        }
      ]
    },
    {
      title: 'Interfaccia',
      items: [
        {
          icon: Palette,
          label: 'Tema',
          value: 'Telegram Auto',
          action: () => hapticFeedback('selection')
        }
      ]
    },
    {
      title: 'Altro',
      items: [
        {
          icon: Info,
          label: 'Informazioni App',
          value: 'v1.0.0',
          action: () => hapticFeedback('selection')
        },
        {
          icon: LogOut,
          label: 'Chiudi App',
          value: '',
          action: () => {
            hapticFeedback('impact', 'medium')
            close()
          }
        }
      ]
    }
  ]

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center py-4">
        <div className="text-4xl mb-2">⚙️</div>
        <h1 className="text-2xl font-bold tg-text mb-2">Impostazioni</h1>
        <p className="tg-hint">Personalizza la tua esperienza</p>
      </div>

      {/* User Card */}
      <div className="card text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
          <span className="text-2xl text-white">
            {state.user?.first_name?.charAt(0) || 'M'}
          </span>
        </div>
        <h3 className="font-semibold tg-text">
          {state.user?.first_name} {state.user?.last_name || ''}
        </h3>
        <p className="text-sm tg-hint">@{state.user?.username || 'username'}</p>
        <div className="mt-3 text-xs tg-hint">
          ID: {state.user?.id}
        </div>
      </div>

      {/* Settings Groups */}
      {settingsGroups.map((group, groupIndex) => (
        <div key={groupIndex} className="space-y-3">
          <h3 className="font-semibold tg-text text-sm uppercase tracking-wide">
            {group.title}
          </h3>
          
          <div className="card space-y-0 p-0 overflow-hidden">
            {group.items.map((item, itemIndex) => (
              <button
                key={itemIndex}
                onClick={item.action}
                className={`w-full flex items-center justify-between p-4 text-left transition-colors hover:tg-secondary-bg haptic-light ${
                  itemIndex < group.items.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 tg-secondary-bg rounded-lg flex items-center justify-center">
                    <item.icon className="w-4 h-4 tg-text" />
                  </div>
                  <span className="font-medium tg-text">{item.label}</span>
                </div>
                
                {item.value && (
                  <span className="text-sm tg-hint">{item.value}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Stats Summary */}
      <div className="card">
        <h3 className="font-semibold tg-text mb-3">Riepilogo Attività</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xl font-bold tg-link">
              {state.statistics?.total_workouts || 0}
            </div>
            <div className="text-xs tg-hint">Workout</div>
          </div>
          <div>
            <div className="text-xl font-bold tg-link">
              {state.statistics?.current_streak || 0}
            </div>
            <div className="text-xs tg-hint">Streak</div>
          </div>
          <div>
            <div className="text-xl font-bold tg-link">
              {state.statistics?.total_exercises || 0}
            </div>
            <div className="text-xs tg-hint">Esercizi</div>
          </div>
        </div>
      </div>

      {/* App Info */}
      <div className="text-center text-xs tg-hint space-y-1">
        <div>Phoenix Workout Mini App</div>
        <div>Versione 1.0.0</div>
        <div>Sviluppato per Manuel</div>
      </div>
    </div>
  )
}

export default Settings
