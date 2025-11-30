import { hapticFeedback, showBackButton, hideBackButton, hideMainButton } from '../utils/haptics';
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Play, SkipForward, CheckCircle } from 'lucide-react'
import { useWorkout } from '../contexts/WorkoutContext'

const WorkoutSession: React.FC = () => {
  const navigate = useNavigate()
  const { state, actions } = useWorkout()
  
  const [timer, setTimer] = useState(0)
  const [isResting, setIsResting] = useState(false)
  const [currentWeight, setCurrentWeight] = useState('')
  const [currentReps, setCurrentReps] = useState('')

  useEffect(() => {
    // Configure Telegram UI
    showBackButton(() => navigate('/'))
    hideMainButton()

    // Start workout if not already started
    if (!state.currentSession) {
      actions.startWorkout('upper_a')
    }

    return () => {
      hideBackButton()
    }
  }, [showBackButton, hideMainButton, navigate, state.currentSession, actions])

  // Timer di riposo
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined
    if (isResting && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            setIsResting(false)
            hapticFeedback('notification', 'success')
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isResting, timer, hapticFeedback])

  // Pre-compila i campi con i valori suggeriti quando cambia esercizio
  useEffect(() => {
    if (!state.currentSession) return
    
    const currentWorkout = state.workouts.find(w => w.id === state.currentSession?.workout_id)
    if (!currentWorkout) return
    
    const currentExerciseData = state.currentSession.exercises_data?.[state.currentSession.current_exercise_index]
    
    if (currentExerciseData?.suggested_weight) {
      setCurrentWeight(currentExerciseData.suggested_weight.toString())
    } else {
      setCurrentWeight('')
    }
    if (currentExerciseData?.suggested_reps) {
      setCurrentReps(currentExerciseData.suggested_reps.toString())
    } else {
      setCurrentReps('')
    }
  }, [state.currentSession, state.workouts])

  if (!state.currentSession) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <div className="tg-text">Caricamento workout...</div>
        </div>
      </div>
    )
  }

  const currentWorkout = state.workouts.find(w => w.id === state.currentSession?.workout_id)
  if (!currentWorkout) return null

  const currentExercise = currentWorkout.exercises[state.currentSession.current_exercise_index]
  const progress = ((state.currentSession.current_exercise_index + 1) / currentWorkout.exercises.length) * 100
  
  const handleCompleteSet = () => {
    if (!currentWeight || !currentReps) return
    
    hapticFeedback('notification', 'success')
    
    // Salva i dati della serie
    // TODO: Implementare salvataggio dati serie nel context
    
    // Se non è l'ultima serie, avvia il timer di riposo
    if (state.currentSession!.current_set < currentExercise.sets) {
      setTimer(currentExercise.rest_time)
      setIsResting(true)
      
      // Update session
      actions.updateSession({
        current_set: state.currentSession!.current_set + 1
      })
    } else {
      // Ultima serie completata, passa al prossimo esercizio
      handleNextExercise()
    }
    
    // Clear inputs
    setCurrentWeight('')
    setCurrentReps('')
  }

  const handleNextExercise = () => {
    hapticFeedback('impact', 'medium')
    setIsResting(false)
    setTimer(0)
    
    if (state.currentSession!.current_exercise_index < currentWorkout.exercises.length - 1) {
      actions.updateSession({
        current_exercise_index: state.currentSession!.current_exercise_index + 1,
        current_set: 1
      })
      // Reset inputs per il nuovo esercizio
      setCurrentWeight('')
      setCurrentReps('')
    } else {
      // Workout completed
      hapticFeedback('notification', 'success')
      actions.endSession()
      navigate('/')
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen tg-bg">
      {/* Header */}
      <div className="sticky top-0 tg-bg border-b border-gray-200 p-4">
        <div className="flex items-center mb-2">
          <button
            onClick={() => navigate('/')}
            className="mr-3 p-2 rounded-full tg-secondary-bg haptic-light"
          >
            <ArrowLeft className="w-5 h-5 tg-text" />
          </button>
          <div>
            <h1 className="font-bold tg-text">{currentWorkout.name}</h1>
            <p className="text-sm tg-hint">
              Esercizio {state.currentSession.current_exercise_index + 1} di {currentWorkout.exercises.length}
            </p>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="tg-button h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Current Exercise */}
        <div className="card">
          <h2 className="text-xl font-bold tg-text mb-2">
            {currentExercise.name}
          </h2>
          <div className="flex items-center space-x-4 text-sm tg-hint mb-4">
            <span>🎯 {currentExercise.target_reps} reps</span>
            <span>⏱️ {currentExercise.rest_time}s riposo</span>
            <span>🏋️ {currentExercise.equipment}</span>
          </div>
          
          <div className="text-lg font-semibold tg-text">
            Serie {state.currentSession.current_set} di {currentExercise.sets}
          </div>
        </div>

        {/* Rest Timer */}
        {isResting && (
          <div className="card text-center tg-button">
            <div className="text-white">
              <div className="text-3xl font-bold mb-2">
                {formatTime(timer)}
              </div>
              <div className="text-sm opacity-90">Riposo in corso...</div>
              {timer <= 10 && timer > 0 && (
                <div className="mt-2 text-lg animate-pulse">
                  Preparati! 🔥
                </div>
              )}
            </div>
          </div>
        )}

        {/* Input Form */}
        {!isResting && (
          <div className="card space-y-4">
            <h3 className="font-semibold tg-text">Registra la serie</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm tg-hint mb-1">Peso (kg)</label>
                <input
                  type="number"
                  value={currentWeight}
                  onChange={(e) => setCurrentWeight(e.target.value)}
                  className="input"
                  placeholder="0"
                  step="0.5"
                />
              </div>
              
              <div>
                <label className="block text-sm tg-hint mb-1">Ripetizioni</label>
                <input
                  type="number"
                  value={currentReps}
                  onChange={(e) => setCurrentReps(e.target.value)}
                  className="input"
                  placeholder="0"
                />
              </div>
            </div>
            
            <button
              onClick={handleCompleteSet}
              disabled={!currentWeight || !currentReps}
              className="btn btn-success w-full py-3 haptic-medium disabled:opacity-50"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Completa Serie
            </button>
          </div>
        )}

        {/* Rest Timer Controls */}
        {isResting && (
          <div className="flex space-x-3">
            <button
              onClick={() => {
                setIsResting(false)
                setTimer(0)
              }}
              className="btn btn-secondary flex-1 py-3 haptic-light"
            >
              <Play className="w-5 h-5 mr-2" />
              Salta Riposo
            </button>
            
            {state.currentSession.current_set >= currentExercise.sets && (
              <button
                onClick={handleNextExercise}
                className="btn btn-primary flex-1 py-3 haptic-medium"
              >
                <SkipForward className="w-5 h-5 mr-2" />
                Prossimo Esercizio
              </button>
            )}
          </div>
        )}

        {/* Exercise List */}
        <div className="card">
          <h3 className="font-semibold tg-text mb-3">Esercizi del Workout</h3>
          <div className="space-y-2">
            {currentWorkout.exercises.map((exercise, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg flex items-center justify-between ${
                  index === state.currentSession!.current_exercise_index
                    ? 'tg-button text-white'
                    : index < state.currentSession!.current_exercise_index
                    ? 'bg-green-100 text-green-800'
                    : 'tg-secondary-bg tg-text'
                }`}
              >
                <div>
                  <div className="font-medium">{exercise.name}</div>
                  <div className="text-sm opacity-75">
                    {exercise.sets} serie × {exercise.target_reps}
                  </div>
                </div>
                
                {index === state.currentSession!.current_exercise_index ? (
                  <div className="text-sm">In corso</div>
                ) : index < state.currentSession!.current_exercise_index ? (
                  <CheckCircle className="w-5 h-5" />
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default WorkoutSession
