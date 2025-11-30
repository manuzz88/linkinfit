// Coach AI Service - OpenAI Responses API Integration
// Personal Trainer AI con accesso al database e memoria conversazioni

import { supabase } from '../lib/supabase';

// @ts-ignore - Vite env
const OPENAI_API_KEY: string = import.meta.env?.VITE_OPENAI_API_KEY || '';
const OPENAI_API_URL = 'https://api.openai.com/v1/responses';

// Tipo per la risposta del coach
interface CoachResponse {
  message: string;
  responseId: string;
  suggestions?: string[];
  motivation?: string;
}

// Contesto workout corrente
interface WorkoutContext {
  currentExercise?: string;
  currentSet?: number;
  totalSets?: number;
  weight?: number;
  reps?: number;
  restTime?: number;
  workoutType?: string;
  exerciseIndex?: number;
  totalExercises?: number;
}

class CoachAIService {
  private previousResponseId: string | null = null;
  private userId: string | null = null;
  
  // Istruzioni sistema per il coach
  private systemInstructions = `Sei Coach Alex, il personal trainer AI di Manuel.

PROFILO UTENTE:
- Nome: Manuel
- Eta: 37 anni
- Altezza: 173cm
- Peso: 76kg
- Obiettivo: Aumento massa muscolare
- Attrezzatura: Home gym completo (manubri, bilanciere, rack, panca, sbarra, TRX, parallele, elastici)
- Piano: Upper/Lower Split con rotazione progressiva

IL TUO RUOLO:
1. Guida Manuel durante gli allenamenti con consigli tecnici
2. Motiva con messaggi brevi e incisivi
3. Suggerisci pesi basandoti sullo storico
4. Correggi la tecnica quando necessario
5. Celebra i progressi e i record personali

STILE DI COMUNICAZIONE:
- Messaggi BREVI e DIRETTI (max 2-3 frasi)
- Usa emoji per enfatizzare
- Sii energico e motivante
- Parla in italiano
- Quando dai istruzioni tecniche, sii preciso ma conciso

FUNZIONI DISPONIBILI:
- Puoi accedere allo storico workout di Manuel
- Puoi vedere i suoi record personali
- Puoi suggerire pesi basati sulle performance passate

IMPORTANTE: Durante il workout, i messaggi devono essere MOLTO brevi perche Manuel li legge su un monitor mentre si allena.`;

  setUserId(userId: string) {
    this.userId = userId;
  }

  // Reset conversazione (nuovo workout)
  resetConversation() {
    this.previousResponseId = null;
  }

  // Funzioni per accesso database (tools)
  private async getWorkoutHistory(): Promise<any> {
    if (!this.userId) return { error: 'User not authenticated' };
    
    const { data, error } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('user_id', this.userId)
      .eq('completed', true)
      .order('end_time', { ascending: false })
      .limit(10);
    
    if (error) return { error: error.message };
    return { workouts: data };
  }

  private async getExerciseStats(exerciseName: string): Promise<any> {
    if (!this.userId) return { error: 'User not authenticated' };
    
    // Ultimi set per questo esercizio
    const { data: recentSets } = await supabase
      .from('workout_sets')
      .select('*')
      .eq('user_id', this.userId)
      .eq('exercise_name', exerciseName)
      .order('completed_at', { ascending: false })
      .limit(20);
    
    // Record personale
    const { data: record } = await supabase
      .from('personal_records')
      .select('*')
      .eq('user_id', this.userId)
      .eq('exercise_name', exerciseName)
      .single();
    
    return {
      exercise: exerciseName,
      recentSets: recentSets || [],
      personalRecord: record || null,
      lastWeight: recentSets?.[0]?.weight || null,
      lastReps: recentSets?.[0]?.reps || null
    };
  }

  private async getPersonalRecords(): Promise<any> {
    if (!this.userId) return { error: 'User not authenticated' };
    
    const { data, error } = await supabase
      .from('personal_records')
      .select('*')
      .eq('user_id', this.userId)
      .order('achieved_at', { ascending: false });
    
    if (error) return { error: error.message };
    return { records: data };
  }

  private async getTodayStats(): Promise<any> {
    if (!this.userId) return { error: 'User not authenticated' };
    
    const today = new Date().toISOString().split('T')[0];
    
    const { data: todayWorkout } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('user_id', this.userId)
      .gte('start_time', today)
      .single();
    
    const { count: weekCount } = await supabase
      .from('workout_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', this.userId)
      .eq('completed', true)
      .gte('start_time', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
    
    return {
      todayWorkout: todayWorkout || null,
      weeklyWorkouts: weekCount || 0
    };
  }

  // Definizione tools per OpenAI
  private getTools() {
    return [
      {
        type: 'function',
        name: 'get_workout_history',
        description: 'Ottieni lo storico degli ultimi 10 workout completati da Manuel',
        parameters: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      {
        type: 'function',
        name: 'get_exercise_stats',
        description: 'Ottieni statistiche e storico per un esercizio specifico',
        parameters: {
          type: 'object',
          properties: {
            exercise_name: {
              type: 'string',
              description: 'Nome dell\'esercizio in italiano'
            }
          },
          required: ['exercise_name']
        }
      },
      {
        type: 'function',
        name: 'get_personal_records',
        description: 'Ottieni tutti i record personali di Manuel',
        parameters: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      {
        type: 'function',
        name: 'get_today_stats',
        description: 'Ottieni statistiche di oggi e della settimana',
        parameters: {
          type: 'object',
          properties: {},
          required: []
        }
      }
    ];
  }

  // Esegui tool call
  private async executeToolCall(name: string, args: any): Promise<any> {
    switch (name) {
      case 'get_workout_history':
        return await this.getWorkoutHistory();
      case 'get_exercise_stats':
        return await this.getExerciseStats(args.exercise_name);
      case 'get_personal_records':
        return await this.getPersonalRecords();
      case 'get_today_stats':
        return await this.getTodayStats();
      default:
        return { error: 'Unknown function' };
    }
  }

  // Chiamata principale al Coach AI
  async chat(
    userMessage: string, 
    context?: WorkoutContext
  ): Promise<CoachResponse> {
    
    if (!OPENAI_API_KEY) {
      return {
        message: "API key non configurata. Configura VITE_OPENAI_API_KEY.",
        responseId: '',
        motivation: "Forza Manuel! Dai il massimo!"
      };
    }

    // Costruisci il messaggio con contesto
    let fullMessage = userMessage;
    if (context) {
      fullMessage = `[CONTESTO WORKOUT]
Esercizio: ${context.currentExercise || 'N/A'}
Serie: ${context.currentSet || 0}/${context.totalSets || 0}
Peso: ${context.weight || 0}kg
Ripetizioni target: ${context.reps || 'N/A'}
Riposo: ${context.restTime || 0}s
Progresso workout: ${context.exerciseIndex || 0}/${context.totalExercises || 0}

[MESSAGGIO]
${userMessage}`;
    }

    try {
      const requestBody: any = {
        model: 'gpt-4o', // Usa gpt-4o per ora, gpt-5 quando disponibile
        instructions: this.systemInstructions,
        input: fullMessage,
        tools: this.getTools(),
        store: true // Mantieni stato conversazione
      };

      // Se abbiamo una risposta precedente, collegala
      if (this.previousResponseId) {
        requestBody.previous_response_id = this.previousResponseId;
      }

      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('OpenAI API error:', errorData);
        
        // Fallback a Chat Completions se Responses non disponibile
        return await this.fallbackToCompletions(fullMessage);
      }

      const data = await response.json();
      
      // Salva response ID per continuita conversazione
      this.previousResponseId = data.id;

      // Processa tool calls se presenti
      let finalMessage = '';
      for (const item of data.output || []) {
        if (item.type === 'function_call') {
          const toolResult = await this.executeToolCall(
            item.name, 
            JSON.parse(item.arguments)
          );
          
          // Continua la conversazione con il risultato del tool
          const followUp = await this.continueWithToolResult(
            item.call_id, 
            toolResult
          );
          finalMessage = followUp;
        } else if (item.type === 'message') {
          finalMessage = item.content?.[0]?.text || '';
        }
      }

      // Se c'e output_text diretto
      if (!finalMessage && data.output_text) {
        finalMessage = data.output_text;
      }

      return {
        message: finalMessage || "Forza Manuel! Continua cosi!",
        responseId: data.id,
        motivation: this.extractMotivation(finalMessage)
      };

    } catch (error) {
      console.error('Coach AI error:', error);
      return await this.fallbackToCompletions(fullMessage);
    }
  }

  // Continua conversazione dopo tool call
  private async continueWithToolResult(callId: string, result: any): Promise<string> {
    try {
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          previous_response_id: this.previousResponseId,
          input: [{
            type: 'function_call_output',
            call_id: callId,
            output: JSON.stringify(result)
          }]
        })
      });

      const data = await response.json();
      this.previousResponseId = data.id;
      
      return data.output_text || data.output?.[0]?.content?.[0]?.text || '';
    } catch (error) {
      console.error('Tool result error:', error);
      return '';
    }
  }

  // Fallback a Chat Completions API
  private async fallbackToCompletions(message: string): Promise<CoachResponse> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: this.systemInstructions },
            { role: 'user', content: message }
          ],
          max_tokens: 150
        })
      });

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "Forza Manuel!";

      return {
        message: content,
        responseId: data.id || '',
        motivation: this.extractMotivation(content)
      };
    } catch (error) {
      console.error('Fallback error:', error);
      return {
        message: "Dai il massimo Manuel! Ogni ripetizione conta!",
        responseId: '',
        motivation: "Forza!"
      };
    }
  }

  // Estrai frase motivazionale
  private extractMotivation(text: string): string {
    const motivationalPhrases = [
      "Forza!", "Dai tutto!", "Ottimo lavoro!", "Continua cosi!",
      "Sei forte!", "Non mollare!", "Ancora una!", "Perfetto!"
    ];
    
    // Cerca frasi motivazionali nel testo
    for (const phrase of motivationalPhrases) {
      if (text.toLowerCase().includes(phrase.toLowerCase())) {
        return phrase;
      }
    }
    
    return "Forza!";
  }

  // === MESSAGGI PREDEFINITI PER EVENTI SPECIFICI ===

  async onWorkoutStart(workoutName: string): Promise<CoachResponse> {
    return await this.chat(
      `Sto iniziando il workout "${workoutName}". Dammi una breve motivazione per iniziare!`
    );
  }

  async onExerciseStart(
    exerciseName: string, 
    sets: number, 
    targetReps: string,
    exerciseIndex: number,
    totalExercises: number
  ): Promise<CoachResponse> {
    return await this.chat(
      `Nuovo esercizio: ${exerciseName}. ${sets} serie da ${targetReps}. Dammi un consiglio tecnico breve.`,
      {
        currentExercise: exerciseName,
        totalSets: sets,
        currentSet: 1,
        reps: parseInt(targetReps) || 10,
        exerciseIndex,
        totalExercises
      }
    );
  }

  async onSetComplete(
    exerciseName: string,
    setNumber: number,
    totalSets: number,
    weight: number,
    reps: number
  ): Promise<CoachResponse> {
    return await this.chat(
      `Ho completato la serie ${setNumber}/${totalSets} di ${exerciseName}: ${weight}kg x ${reps} reps. Commenta brevemente!`,
      {
        currentExercise: exerciseName,
        currentSet: setNumber,
        totalSets,
        weight,
        reps
      }
    );
  }

  async onRestStart(restTime: number, nextSet: number, totalSets: number): Promise<CoachResponse> {
    return await this.chat(
      `Inizio riposo di ${restTime} secondi. Prossima serie: ${nextSet}/${totalSets}. Dammi una frase breve per prepararmi.`
    );
  }

  async onRestEnd(): Promise<CoachResponse> {
    return await this.chat(
      `Riposo finito! Dammi una frase motivazionale brevissima per la prossima serie.`
    );
  }

  async onWorkoutComplete(
    workoutName: string,
    totalExercises: number,
    totalSets: number,
    duration: number
  ): Promise<CoachResponse> {
    return await this.chat(
      `Ho completato "${workoutName}"! ${totalExercises} esercizi, ${totalSets} serie totali in ${Math.round(duration / 60)} minuti. Celebra il mio risultato!`
    );
  }

  async onNewPersonalRecord(
    exerciseName: string,
    weight: number,
    reps: number
  ): Promise<CoachResponse> {
    return await this.chat(
      `NUOVO RECORD PERSONALE! ${exerciseName}: ${weight}kg x ${reps} reps! Celebra questo momento!`
    );
  }

  async suggestWeight(exerciseName: string): Promise<CoachResponse> {
    return await this.chat(
      `Che peso mi consigli per ${exerciseName} oggi? Basati sul mio storico.`
    );
  }

  async askTechnique(exerciseName: string): Promise<CoachResponse> {
    return await this.chat(
      `Dammi 2-3 punti chiave sulla tecnica corretta per ${exerciseName}.`
    );
  }
}

export const coachAI = new CoachAIService();
