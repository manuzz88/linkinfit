import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { workoutService, ExerciseHistory } from '../services/workoutService'

// Types
interface User {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

interface Exercise {
  name: string;
  sets: number;
  rest_time: number;
  target_reps: string;
  equipment: string;
  type: string;
  muscle_group: string;
  completed_sets?: number;
  current_weight?: number;
  notes?: string;
  history?: ExerciseHistory;
  suggested_weight?: number;
}

interface Workout {
  id: string;
  name: string;
  description: string;
  location: string;
  type: string;
  exercises: Exercise[];
}

interface WorkoutSession {
  id: string;
  workout_id: string;
  user_id: number;
  start_time: string;
  end_time?: string;
  status: 'active' | 'completed' | 'paused';
  current_exercise_index: number;
  current_set: number;
  exercises_data: any[];
}

interface WorkoutState {
  user: User | null;
  workouts: Workout[];
  currentSession: WorkoutSession | null;
  statistics: any;
  isLoading: boolean;
  error: string | null;
}

type WorkoutAction =
  | { type: 'SET_USER'; payload: User }
  | { type: 'SET_WORKOUTS'; payload: Workout[] }
  | { type: 'START_SESSION'; payload: WorkoutSession }
  | { type: 'UPDATE_SESSION'; payload: Partial<WorkoutSession> }
  | { type: 'END_SESSION' }
  | { type: 'SET_STATISTICS'; payload: any }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }

const initialState: WorkoutState = {
  user: null,
  workouts: [],
  currentSession: null,
  statistics: null,
  isLoading: false,
  error: null,
}

function workoutReducer(state: WorkoutState, action: WorkoutAction): WorkoutState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload }
    case 'SET_WORKOUTS':
      return { ...state, workouts: action.payload }
    case 'START_SESSION':
      return { ...state, currentSession: action.payload }
    case 'UPDATE_SESSION':
      return {
        ...state,
        currentSession: state.currentSession
          ? { ...state.currentSession, ...action.payload }
          : null
      }
    case 'END_SESSION':
      return { ...state, currentSession: null }
    case 'SET_STATISTICS':
      return { ...state, statistics: action.payload }
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    default:
      return state
  }
}

const WorkoutContext = createContext<{
  state: WorkoutState;
  dispatch: React.Dispatch<WorkoutAction>;
  actions: {
    loadWorkouts: () => Promise<void>;
    startWorkout: (workoutId: string) => Promise<void>;
    updateSession: (updates: Partial<WorkoutSession>) => void;
    endSession: () => Promise<void>;
    loadStatistics: () => Promise<void>;
  };
} | null>(null)

export function WorkoutProvider({ children, user }: { children: React.ReactNode; user: User }) {
  const [state, dispatch] = useReducer(workoutReducer, { ...initialState, user })

  // Mock data per sviluppo - sostituire con API calls
  const mockWorkouts: Workout[] = [
    {
      id: 'upper_a',
      name: '💪 Upper A - Push Dominante',
      description: 'Petto, Spalle, Tricipiti - 40% Compound / 60% Isolation',
      location: 'casa',
      type: 'upper',
      exercises: [
        {
          name: 'Spinte Manubri Panca Piana',
          sets: 4,
          rest_time: 120,
          target_reps: '8-10',
          equipment: 'Manubri + Panca',
          type: 'compound',
          muscle_group: 'petto'
        },
        {
          name: 'Overhead Press Rack',
          sets: 4,
          rest_time: 120,
          target_reps: '6-8',
          equipment: 'Bilanciere + Rack',
          type: 'compound',
          muscle_group: 'spalle'
        },
        {
          name: 'Dips Anelli',
          sets: 3,
          rest_time: 120,
          target_reps: '8-12',
          equipment: 'Anelli',
          type: 'compound',
          muscle_group: 'tricipiti'
        }
      ]
    },
    {
      id: 'lower_a',
      name: '🦵 Lower A - Squat Dominante',
      description: 'Quadricipiti, Glutei, Core - 40% Compound / 60% Isolation',
      location: 'casa',
      type: 'lower',
      exercises: [
        {
          name: 'Squat Rack Bilanciere',
          sets: 4,
          rest_time: 180,
          target_reps: '6-8',
          equipment: 'Bilanciere + Rack',
          type: 'compound',
          muscle_group: 'quadricipiti'
        },
        {
          name: 'Front Squat Rack',
          sets: 3,
          rest_time: 150,
          target_reps: '8-10',
          equipment: 'Bilanciere + Rack',
          type: 'compound',
          muscle_group: 'quadricipiti'
        }
      ]
    }
  ]

  const actions = {
    loadWorkouts: async () => {
      dispatch({ type: 'SET_LOADING', payload: true })
      try {
        // Simula API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        dispatch({ type: 'SET_WORKOUTS', payload: mockWorkouts })
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Errore nel caricamento dei workout' })
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    },

    startWorkout: async (workoutId: string) => {
      const workout = mockWorkouts.find(w => w.id === workoutId)
      if (!workout) return

      // Arricchisci esercizi con cronologia e suggerimenti
      const enrichedExercises = await Promise.all(workout.exercises.map(async (ex) => {
        const history = await workoutService.getExerciseHistory(ex.name)
        const suggested_weight = history ? workoutService.getSuggestedWeight(history) : 0
        
        return {
          ...ex,
          history,
          suggested_weight,
          current_weight: suggested_weight // Pre-compila con peso suggerito
        }
      }))

      const session: WorkoutSession = {
        id: Date.now().toString(),
        workout_id: workoutId,
        user_id: user.id,
        start_time: new Date().toISOString(),
        status: 'active',
        current_exercise_index: 0,
        current_set: 1,
        exercises_data: enrichedExercises.map(ex => ({
          name: ex.name,
          completed_sets: 0,
          sets_data: [],
          history: ex.history,
          suggested_weight: ex.suggested_weight
        }))
      }

      dispatch({ type: 'START_SESSION', payload: session })
    },

    updateSession: (updates: Partial<WorkoutSession>) => {
      dispatch({ type: 'UPDATE_SESSION', payload: updates })
    },

    endSession: async () => {
      // Salva sessione nel database
      dispatch({ type: 'END_SESSION' })
    },

    loadStatistics: async () => {
      dispatch({ type: 'SET_LOADING', payload: true })
      try {
        // Mock statistics
        const stats = {
          total_workouts: 45,
          current_streak: 7,
          best_streak: 12,
          total_exercises: 234,
          weekly_goal: 4,
          monthly_goal: 16
        }
        dispatch({ type: 'SET_STATISTICS', payload: stats })
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Errore nel caricamento delle statistiche' })
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    }
  }

  useEffect(() => {
    actions.loadWorkouts()
    actions.loadStatistics()
  }, [])

  return (
    <WorkoutContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </WorkoutContext.Provider>
  )
}

export function useWorkout() {
  const context = useContext(WorkoutContext)
  if (!context) {
    throw new Error('useWorkout must be used within a WorkoutProvider')
  }
  return context
}
