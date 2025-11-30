import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://obdlubqqjgbgjhctphcs.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZGx1YnFxamdiZ2poY3RwaGNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MDE2OTUsImV4cCI6MjA4MDA3NzY5NX0.7pWBVjOLYZEg_7deWsTLGrJaBD7eTyhb1U31oFxlWek'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types per il database
export interface Profile {
  id: string
  user_id: string
  name: string
  age: number
  height: number
  weight: number
  goal: string
  created_at: string
  updated_at: string
}

export interface WorkoutSession {
  id: string
  user_id: string
  workout_type: string
  workout_name: string
  start_time: string
  end_time: string | null
  completed: boolean
  total_exercises: number
  total_sets: number
  notes: string | null
  created_at: string
}

export interface WorkoutSet {
  id: string
  session_id: string
  user_id: string
  exercise_name: string
  set_number: number
  weight: number | null
  reps: number
  target_reps: string | null
  rest_time: number | null
  completed_at: string
  notes: string | null
}

export interface PersonalRecord {
  id: string
  user_id: string
  exercise_name: string
  max_weight: number | null
  max_reps: number | null
  one_rm: number | null
  achieved_at: string
}

export interface SupplementLog {
  id: string
  user_id: string
  supplement_name: string
  timing: string
  taken_at: string
  notes: string | null
}

export interface UserPreferences {
  id: string
  user_id: string
  weekly_plan: string
  reminder_enabled: boolean
  theme: string
  settings: Record<string, unknown>
  updated_at: string
}
