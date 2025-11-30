import React, { useState } from 'react'
import { CheckCircle, AlertCircle } from 'lucide-react'
import { useTelegramWebApp } from '../hooks/useTelegramWebApp'

interface Supplement {
  name: string;
  dosage: string;
  timing: string;
  benefits: string;
  taken: boolean;
}

const Supplements: React.FC = () => {
  const { hapticFeedback } = useTelegramWebApp()
  
  const [workoutDay] = useState(true) // Mock: today is workout day
  
  const [workoutSupplements, setWorkoutSupplements] = useState<Supplement[]>([
    {
      name: 'Creatina Creapure',
      dosage: '5g',
      timing: 'Post-workout',
      benefits: 'Forza e volume muscolare',
      taken: false
    },
    {
      name: 'Iso-FUJI Whey Isolate',
      dosage: '30g',
      timing: 'Post-workout (entro 30min)',
      benefits: 'Sintesi proteica e recupero',
      taken: false
    },
    {
      name: 'BCAA',
      dosage: '10g',
      timing: 'Durante workout',
      benefits: 'Energia e anti-catabolismo',
      taken: false
    },
    {
      name: 'Beta-Alanina',
      dosage: '3g',
      timing: 'Pre-workout (30min prima)',
      benefits: 'Resistenza muscolare',
      taken: false
    },
    {
      name: 'Caffeina',
      dosage: '200mg',
      timing: 'Pre-workout (45min prima)',
      benefits: 'Energia e focus',
      taken: false
    }
  ])

  const [restSupplements, setRestSupplements] = useState<Supplement[]>([
    {
      name: 'Creatina Creapure',
      dosage: '5g',
      timing: 'Mattina',
      benefits: 'Mantenimento saturazione',
      taken: false
    },
    {
      name: 'Multivitaminico',
      dosage: '1 cpr',
      timing: 'Colazione',
      benefits: 'Supporto generale',
      taken: false
    },
    {
      name: 'Omega-3',
      dosage: '2g',
      timing: 'Pranzo',
      benefits: 'Antinfiammatorio',
      taken: false
    },
    {
      name: 'Magnesio',
      dosage: '400mg',
      timing: 'Sera',
      benefits: 'Recupero e sonno',
      taken: false
    },
    {
      name: 'Vitamina D3',
      dosage: '2000 UI',
      timing: 'Colazione',
      benefits: 'Salute ossea e ormonale',
      taken: false
    }
  ])

  const currentSupplements = workoutDay ? workoutSupplements : restSupplements
  const setCurrentSupplements = workoutDay ? setWorkoutSupplements : setRestSupplements

  const toggleSupplement = (index: number) => {
    hapticFeedback('impact', 'light')
    
    setCurrentSupplements(prev => 
      prev.map((supp, i) => 
        i === index ? { ...supp, taken: !supp.taken } : supp
      )
    )
  }

  const completedCount = currentSupplements.filter(s => s.taken).length
  const totalCount = currentSupplements.length
  const completionPercentage = (completedCount / totalCount) * 100

  const getTimingIcon = (timing: string) => {
    if (timing.includes('Pre-workout') || timing.includes('Mattina')) return '🌅'
    if (timing.includes('Durante')) return '🏋️'
    if (timing.includes('Post-workout') || timing.includes('Pranzo')) return '🍽️'
    if (timing.includes('Sera')) return '🌙'
    return '⏰'
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center py-4">
        <div className="text-4xl mb-2">💊</div>
        <h1 className="text-2xl font-bold tg-text mb-2">Integratori</h1>
        <p className="tg-hint">
          Piano per {workoutDay ? 'giorno di allenamento' : 'giorno di riposo'}
        </p>
      </div>

      {/* Progress Card */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold tg-text">Progresso Giornaliero</h3>
          <span className="text-sm tg-hint">
            {completedCount}/{totalCount}
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
          <div 
            className="bg-green-500 h-3 rounded-full transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
        
        <div className="text-center">
          <span className="text-2xl font-bold tg-text">
            {Math.round(completionPercentage)}%
          </span>
          <span className="text-sm tg-hint ml-2">completato</span>
        </div>
      </div>

      {/* Day Toggle */}
      <div className="flex bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => hapticFeedback('selection')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            workoutDay 
              ? 'tg-button text-white' 
              : 'tg-text'
          }`}
        >
          🏋️ Workout Day
        </button>
        <button
          onClick={() => hapticFeedback('selection')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            !workoutDay 
              ? 'tg-button text-white' 
              : 'tg-text'
          }`}
        >
          😴 Rest Day
        </button>
      </div>

      {/* Supplements List */}
      <div className="space-y-3">
        {currentSupplements.map((supplement, index) => (
          <div
            key={index}
            className={`card transition-all duration-200 ${
              supplement.taken 
                ? 'bg-green-50 border-green-200' 
                : 'hover:shadow-md'
            }`}
          >
            <div className="flex items-start space-x-3">
              <button
                onClick={() => toggleSupplement(index)}
                className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all haptic-medium ${
                  supplement.taken
                    ? 'bg-green-500 border-green-500'
                    : 'border-gray-300 hover:border-green-400'
                }`}
              >
                {supplement.taken && (
                  <CheckCircle className="w-4 h-4 text-white" />
                )}
              </button>
              
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className={`font-semibold ${
                    supplement.taken ? 'text-green-700 line-through' : 'tg-text'
                  }`}>
                    {supplement.name}
                  </h4>
                  <span className="text-sm font-medium tg-link">
                    {supplement.dosage}
                  </span>
                </div>
                
                <div className="flex items-center space-x-4 text-sm tg-hint mb-2">
                  <span className="flex items-center">
                    {getTimingIcon(supplement.timing)}
                    <span className="ml-1">{supplement.timing}</span>
                  </span>
                </div>
                
                <p className="text-sm tg-hint">
                  {supplement.benefits}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tips Card */}
      <div className="card tg-secondary-bg">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
          <div>
            <h4 className="font-semibold tg-text mb-1">💡 Suggerimenti</h4>
            <ul className="text-sm tg-hint space-y-1">
              <li>• Assumi la creatina sempre alla stessa ora</li>
              <li>• Bevi molta acqua con la creatina</li>
              <li>• Le proteine sono più efficaci entro 30min dal workout</li>
              <li>• Il magnesio aiuta il sonno se preso la sera</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => {
            hapticFeedback('notification', 'success')
            setCurrentSupplements(prev => 
              prev.map(supp => ({ ...supp, taken: true }))
            )
          }}
          className="btn btn-success py-3 haptic-medium"
        >
          ✅ Segna Tutti
        </button>
        
        <button
          onClick={() => {
            hapticFeedback('selection')
            setCurrentSupplements(prev => 
              prev.map(supp => ({ ...supp, taken: false }))
            )
          }}
          className="btn btn-secondary py-3 haptic-light"
        >
          🔄 Reset
        </button>
      </div>
    </div>
  )
}

export default Supplements
