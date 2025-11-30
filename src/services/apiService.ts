/**
 * API Service per comunicare con il backend Flask
 */

const API_BASE_URL = 'http://localhost:5001/api';

export interface WorkoutStats {
  current_streak: number;
  total_workouts: number;
  week_count: number;
  weekly_goal: number;
  week_percentage: number;
  last_workout: {
    type: string;
    date: string;
  } | null;
  weekly_workouts: {
    [key: number]: string; // day_index -> workout_type
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Ottiene le statistiche dell'utente
 */
export async function getUserStats(userId: number): Promise<WorkoutStats> {
  try {
    const response = await fetch(`${API_BASE_URL}/stats/${userId}`);
    const result: ApiResponse<WorkoutStats> = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Errore nel recupero delle statistiche');
    }
    
    return result.data;
  } catch (error) {
    console.error('Errore API getUserStats:', error);
    throw error;
  }
}

/**
 * Health check dell'API
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/api/health`);
    const result = await response.json();
    return result.status === 'ok';
  } catch (error) {
    console.error('Errore health check:', error);
    return false;
  }
}
