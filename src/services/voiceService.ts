// Voice Service - Text-to-Speech e Speech-to-Text con OpenAI
// Coach Alex parla e ascolta

const SUPABASE_FUNCTIONS_URL = 'https://obdlubqqjgbgjhctphcs.supabase.co/functions/v1';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZGx1YnFxamdiZ2poY3RwaGNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MDE2OTUsImV4cCI6MjA4MDA3NzY5NX0.7pWBVjOLYZEg_7deWsTLGrJaBD7eTyhb1U31oFxlWek';

// Voci disponibili per TTS
export type VoiceType = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

class VoiceService {
  private currentAudio: HTMLAudioElement | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private isRecording = false;
  
  // Voce del Coach (nova e una voce maschile energica)
  private coachVoice: VoiceType = 'onyx';
  
  constructor() {
    // Costruttore vuoto - inizializzazione lazy
  }

  // ==================== TEXT TO SPEECH ====================
  
  // Fa parlare il Coach
  async speak(text: string, voice?: VoiceType): Promise<void> {
    // Prima prova con Web Speech API (gratuito, offline)
    if ('speechSynthesis' in window) {
      return this.speakWithWebAPI(text);
    }
    
    // Fallback a OpenAI TTS (richiede Edge Function)
    return this.speakWithOpenAI(text, voice || this.coachVoice);
  }

  // Web Speech API (gratuito)
  private speakWithWebAPI(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'it-IT';
      utterance.rate = 1.0;
      utterance.pitch = 0.9; // Voce leggermente piu bassa
      utterance.volume = 1.0;
      
      // Cerca una voce italiana maschile
      const voices = speechSynthesis.getVoices();
      const italianVoice = voices.find(v => 
        v.lang.startsWith('it') && v.name.toLowerCase().includes('male')
      ) || voices.find(v => v.lang.startsWith('it'));
      
      if (italianVoice) {
        utterance.voice = italianVoice;
      }
      
      utterance.onend = () => resolve();
      utterance.onerror = (e) => reject(e);
      
      speechSynthesis.speak(utterance);
    });
  }

  // OpenAI TTS (qualita migliore)
  private async speakWithOpenAI(text: string, voice: VoiceType): Promise<void> {
    try {
      const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/voice-tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY
        },
        body: JSON.stringify({ text, voice })
      });

      if (!response.ok) {
        // Fallback a Web Speech API
        return this.speakWithWebAPI(text);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      return new Promise((resolve, reject) => {
        this.currentAudio = new Audio(audioUrl);
        this.currentAudio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          resolve();
        };
        this.currentAudio.onerror = reject;
        this.currentAudio.play();
      });
    } catch (error) {
      console.error('OpenAI TTS error:', error);
      return this.speakWithWebAPI(text);
    }
  }

  // Ferma l'audio corrente
  stopSpeaking(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
  }

  // ==================== SPEECH TO TEXT ====================

  // Inizia a registrare
  async startListening(): Promise<void> {
    if (this.isRecording) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start();
      this.isRecording = true;
    } catch (error) {
      console.error('Error starting recording:', error);
      throw new Error('Impossibile accedere al microfono');
    }
  }

  // Ferma la registrazione e trascrivi
  async stopListening(): Promise<string> {
    if (!this.isRecording || !this.mediaRecorder) {
      return '';
    }

    return new Promise((resolve, reject) => {
      this.mediaRecorder!.onstop = async () => {
        this.isRecording = false;
        
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        
        // Prima prova Web Speech API
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
          try {
            const text = await this.transcribeWithWebAPI();
            resolve(text);
            return;
          } catch (e) {
            // Fallback a Whisper
          }
        }
        
        // Usa Whisper via Edge Function
        try {
          const text = await this.transcribeWithWhisper(audioBlob);
          resolve(text);
        } catch (error) {
          reject(error);
        }
      };

      this.mediaRecorder!.stop();
      
      // Ferma anche lo stream
      this.mediaRecorder!.stream.getTracks().forEach(track => track.stop());
    });
  }

  // Web Speech Recognition API
  private transcribeWithWebAPI(): Promise<string> {
    return new Promise((resolve, reject) => {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        reject(new Error('Speech Recognition not supported'));
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'it-IT';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        resolve(transcript);
      };

      recognition.onerror = (event: any) => {
        reject(new Error(event.error));
      };

      recognition.start();
    });
  }

  // OpenAI Whisper (qualita migliore)
  private async transcribeWithWhisper(audioBlob: Blob): Promise<string> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/voice-stt`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error('Transcription failed');
    }

    const data = await response.json();
    return data.text || '';
  }

  // ==================== UTILITIES ====================

  // Controlla se il browser supporta le funzioni vocali
  isVoiceSupported(): { tts: boolean; stt: boolean } {
    return {
      tts: 'speechSynthesis' in window,
      stt: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices
    };
  }

  // Cambia la voce del coach
  setCoachVoice(voice: VoiceType): void {
    this.coachVoice = voice;
  }

  // Stato registrazione
  getIsRecording(): boolean {
    return this.isRecording;
  }
}

export const voiceService = new VoiceService();
