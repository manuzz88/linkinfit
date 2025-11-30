// Workout Service - Supabase Integration
import { supabase, WorkoutSession, WorkoutSet } from '../lib/supabase';

interface ExerciseHistory {
  exercise_name: string;
  last_weight: number;
  last_reps: number;
  last_date: string;
  best_weight: number;
  best_reps: number;
  total_sessions: number;
}

interface WorkoutProgress {
  workout_type: string;
  exercises: ExerciseHistory[];
}

class WorkoutService {
  private userId: string | null = null;

  // Imposta l'utente corrente
  setUserId(userId: string) {
    this.userId = userId;
  }

  // Ottieni utente corrente
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      this.userId = user.id;
    }
    return user;
  }

  // === SESSIONI WORKOUT ===

  // Crea nuova sessione workout
  async startWorkoutSession(workoutType: string, workoutName: string): Promise<WorkoutSession | null> {
    if (!this.userId) await this.getCurrentUser();
    if (!this.userId) return null;

    const { data, error } = await supabase
      .from('workout_sessions')
      .insert({
        user_id: this.userId,
        workout_type: workoutType,
        workout_name: workoutName,
        start_time: new Date().toISOString(),
        completed: false
      })
      .select()
      .single();

    if (error) {
      console.error('Errore creazione sessione:', error);
      return null;
    }
    return data;
  }

  // Completa sessione workout
  async completeWorkoutSession(sessionId: string, totalExercises: number, totalSets: number): Promise<boolean> {
    const { error } = await supabase
      .from('workout_sessions')
      .update({
        end_time: new Date().toISOString(),
        completed: true,
        total_exercises: totalExercises,
        total_sets: totalSets
      })
      .eq('id', sessionId);

    if (error) {
      console.error('Errore completamento sessione:', error);
      return false;
    }
    return true;
  }

  // Ottieni ultime sessioni
  async getRecentSessions(limit: number = 10): Promise<WorkoutSession[]> {
    if (!this.userId) await this.getCurrentUser();
    if (!this.userId) return [];

    const { data, error } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('user_id', this.userId)
      .order('start_time', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Errore recupero sessioni:', error);
      return [];
    }
    return data || [];
  }

  // === SET WORKOUT ===

  // Salva un set completato
  async saveSet(
    sessionId: string,
    exerciseName: string,
    setNumber: number,
    weight: number | null,
    reps: number,
    targetReps?: string,
    restTime?: number
  ): Promise<WorkoutSet | null> {
    if (!this.userId) await this.getCurrentUser();
    if (!this.userId) return null;

    const { data, error } = await supabase
      .from('workout_sets')
      .insert({
        session_id: sessionId,
        user_id: this.userId,
        exercise_name: exerciseName,
        set_number: setNumber,
        weight: weight,
        reps: reps,
        target_reps: targetReps,
        rest_time: restTime,
        completed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Errore salvataggio set:', error);
      return null;
    }

    // Aggiorna record personale se necessario
    if (weight) {
      await this.updatePersonalRecord(exerciseName, weight, reps);
    }

    return data;
  }

  // === RECORD PERSONALI ===

  // Aggiorna record personale
  async updatePersonalRecord(exerciseName: string, weight: number, reps: number): Promise<void> {
    if (!this.userId) return;

    // Calcola 1RM stimato (formula Brzycki)
    const oneRm = weight * (36 / (37 - reps));

    const { data: existing } = await supabase
      .from('personal_records')
      .select('*')
      .eq('user_id', this.userId)
      .eq('exercise_name', exerciseName)
      .single();

    if (existing) {
      // Aggiorna solo se e un nuovo record
      const updates: Record<string, number | string> = {};
      if (!existing.max_weight || weight > existing.max_weight) {
        updates.max_weight = weight;
      }
      if (!existing.max_reps || reps > existing.max_reps) {
        updates.max_reps = reps;
      }
      if (!existing.one_rm || oneRm > existing.one_rm) {
        updates.one_rm = oneRm;
        updates.achieved_at = new Date().toISOString();
      }

      if (Object.keys(updates).length > 0) {
        await supabase
          .from('personal_records')
          .update(updates)
          .eq('id', existing.id);
      }
    } else {
      // Crea nuovo record
      await supabase
        .from('personal_records')
        .insert({
          user_id: this.userId,
          exercise_name: exerciseName,
          max_weight: weight,
          max_reps: reps,
          one_rm: oneRm
        });
    }
  }

  // === STATISTICHE ===

  // Recupera cronologia esercizio
  async getExerciseHistory(exerciseName: string): Promise<ExerciseHistory | null> {
    if (!this.userId) await this.getCurrentUser();
    if (!this.userId) return null;

    // Ultimo set per questo esercizio
    const { data: lastSet } = await supabase
      .from('workout_sets')
      .select('*')
      .eq('user_id', this.userId)
      .eq('exercise_name', exerciseName)
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();

    // Record personale
    const { data: record } = await supabase
      .from('personal_records')
      .select('*')
      .eq('user_id', this.userId)
      .eq('exercise_name', exerciseName)
      .single();

    // Conta sessioni totali
    const { count } = await supabase
      .from('workout_sets')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', this.userId)
      .eq('exercise_name', exerciseName);

    if (!lastSet) return null;

    return {
      exercise_name: exerciseName,
      last_weight: lastSet.weight || 0,
      last_reps: lastSet.reps,
      last_date: lastSet.completed_at,
      best_weight: record?.max_weight || lastSet.weight || 0,
      best_reps: record?.max_reps || lastSet.reps,
      total_sessions: count || 0
    };
  }

  // Statistiche generali
  async getStats(): Promise<{
    totalWorkouts: number;
    thisWeek: number;
    thisMonth: number;
    lastWorkout: WorkoutSession | null;
  }> {
    if (!this.userId) await this.getCurrentUser();
    if (!this.userId) return { totalWorkouts: 0, thisWeek: 0, thisMonth: 0, lastWorkout: null };

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Totale workout completati
    const { count: total } = await supabase
      .from('workout_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', this.userId)
      .eq('completed', true);

    // Questa settimana
    const { count: week } = await supabase
      .from('workout_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', this.userId)
      .eq('completed', true)
      .gte('start_time', weekAgo.toISOString());

    // Questo mese
    const { count: month } = await supabase
      .from('workout_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', this.userId)
      .eq('completed', true)
      .gte('start_time', monthAgo.toISOString());

    // Ultimo workout
    const { data: last } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('user_id', this.userId)
      .eq('completed', true)
      .order('end_time', { ascending: false })
      .limit(1)
      .single();

    return {
      totalWorkouts: total || 0,
      thisWeek: week || 0,
      thisMonth: month || 0,
      lastWorkout: last || null
    };
  }

  // Suggerimento peso basato su cronologia
  getSuggestedWeight(exerciseHistory: ExerciseHistory | null): number {
    if (!exerciseHistory) return 0;
    
    const { last_weight, last_reps } = exerciseHistory;
    
    if (last_reps >= 10) {
      return Math.round((last_weight + 2.5) * 2) / 2;
    } else if (last_reps >= 8) {
      return last_weight;
    } else {
      return Math.max(0, Math.round((last_weight - 1.25) * 2) / 2);
    }
  }

  // === INTEGRATORI ===

  async logSupplement(name: string, timing: string, notes?: string): Promise<boolean> {
    if (!this.userId) await this.getCurrentUser();
    if (!this.userId) return false;

    const { error } = await supabase
      .from('supplement_logs')
      .insert({
        user_id: this.userId,
        supplement_name: name,
        timing: timing,
        notes: notes
      });

    return !error;
  }

  async getSupplementHistory(days: number = 7) {
    if (!this.userId) await this.getCurrentUser();
    if (!this.userId) return [];

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);

    const { data } = await supabase
      .from('supplement_logs')
      .select('*')
      .eq('user_id', this.userId)
      .gte('taken_at', daysAgo.toISOString())
      .order('taken_at', { ascending: false });

    return data || [];
  }
}

export const workoutService = new WorkoutService();
export type { ExerciseHistory, WorkoutProgress };
