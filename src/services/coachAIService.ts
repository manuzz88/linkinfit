// Coach AI Service - Usa Supabase Edge Function per sicurezza
// Personal Trainer AI con accesso al database e memoria conversazioni

// Supabase import rimosso - le query sono nella Edge Function

// URL della Edge Function su Supabase
const COACH_AI_URL = 'https://obdlubqqjgbgjhctphcs.supabase.co/functions/v1/coach-ai';

// Supabase anon key per autenticazione
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZGx1YnFxamdiZ2poY3RwaGNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MDE2OTUsImV4cCI6MjA4MDA3NzY5NX0.7pWBVjOLYZEg_7deWsTLGrJaBD7eTyhb1U31oFxlWek';

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
  private conversationHistory: Array<{role: string, content: string}> = [];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setUserId(_userId: string) {
    // userId gestito dalla Edge Function tramite auth
  }

  // Reset conversazione (nuovo workout)
  resetConversation() {
    this.conversationHistory = [];
  }

  // Funzioni database spostate nella Edge Function per sicurezza

  // Chiamata principale al Coach AI via Supabase Edge Function con STREAMING
  async chat(
    userMessage: string, 
    context?: WorkoutContext
  ): Promise<CoachResponse> {
    
    try {
      const response = await fetch(COACH_AI_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          message: userMessage,
          context: context
        })
      });

      if (!response.ok) {
        console.error('Edge Function error:', response.status);
        return this.getLocalFallback();
      }

      // Leggi la risposta (non-streaming per semplicita)
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('text/event-stream')) {
        // Gestisci streaming
        return await this.handleStreamingResponse(response, userMessage);
      } else {
        // Risposta normale JSON
        const data = await response.json();
        return {
          message: data.message || "Forza Manuel! Continua cosi!",
          responseId: data.responseId || '',
          motivation: this.extractMotivation(data.message)
        };
      }

    } catch (error) {
      console.error('Coach AI error:', error);
      return this.getLocalFallback();
    }
  }

  // Gestisce risposta streaming
  private async handleStreamingResponse(
    response: Response, 
    userMessage: string
  ): Promise<CoachResponse> {
    const reader = response.body?.getReader();
    if (!reader) return this.getLocalFallback();

    const decoder = new TextDecoder();
    let fullMessage = '';
    let responseId = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'delta') {
                fullMessage += data.text;
              } else if (data.type === 'done') {
                fullMessage = data.message || fullMessage;
                responseId = data.responseId || '';
              }
            } catch {
              // Ignora errori parsing
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    // Salva nella history
    this.conversationHistory.push(
      { role: 'user', content: userMessage },
      { role: 'assistant', content: fullMessage }
    );
    
    if (this.conversationHistory.length > 20) {
      this.conversationHistory = this.conversationHistory.slice(-20);
    }

    return {
      message: fullMessage || "Forza Manuel! Continua cosi!",
      responseId,
      motivation: this.extractMotivation(fullMessage)
    };
  }

  // Chat con callback per streaming in tempo reale
  async chatWithStreaming(
    userMessage: string,
    onDelta: (text: string) => void,
    context?: WorkoutContext
  ): Promise<CoachResponse> {
    
    try {
      const response = await fetch(COACH_AI_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          message: userMessage,
          context: context
        })
      });

      if (!response.ok) {
        return this.getLocalFallback();
      }

      const reader = response.body?.getReader();
      if (!reader) return this.getLocalFallback();

      const decoder = new TextDecoder();
      let fullMessage = '';
      let responseId = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'delta') {
                fullMessage += data.text;
                onDelta(data.text); // Callback per ogni delta
              } else if (data.type === 'done') {
                responseId = data.responseId || '';
              }
            } catch {
              // Ignora
            }
          }
        }
      }

      reader.releaseLock();

      return {
        message: fullMessage,
        responseId,
        motivation: this.extractMotivation(fullMessage)
      };

    } catch (error) {
      console.error('Streaming error:', error);
      return this.getLocalFallback();
    }
  }

  // Fallback locale con messaggi predefiniti
  private getLocalFallback(): CoachResponse {
    const fallbackMessages = [
      "Forza Manuel! Dai il massimo in questa serie!",
      "Concentrati sulla tecnica, il peso verra dopo!",
      "Ogni ripetizione ti avvicina al tuo obiettivo!",
      "Respira, concentrati, esegui. Sei forte!",
      "Non mollare! Questa e la serie che fa la differenza!",
      "Ottimo lavoro! Continua cosi!",
      "Ricorda: la costanza batte il talento!",
      "Sei qui per migliorare. E lo stai facendo!"
    ];
    
    const randomMessage = fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];
    
    return {
      message: randomMessage,
      responseId: '',
      motivation: "Forza!"
    };
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
