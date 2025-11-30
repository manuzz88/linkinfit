// SmartCoachHome - Il Coach AI guida tutto automaticamente
// Niente menu, niente selezioni. Solo tu e il tuo Personal Trainer.

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mic, Send, Dumbbell, Play, 
  Clock, TrendingUp, Flame,
  Volume2, VolumeX, Loader2
} from 'lucide-react';
import { coachAI } from '../services/coachAIService';
import { voiceService } from '../services/voiceService';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Message {
  role: 'coach' | 'user';
  content: string;
  timestamp: Date;
}

interface WorkoutSuggestion {
  workoutId: string;
  workoutName: string;
  reason: string;
  exercises: number;
  estimatedTime: number;
}

const SmartCoachHome: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [suggestion, setSuggestion] = useState<WorkoutSuggestion | null>(null);
  const [, setLastWorkout] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Carica dati e inizia conversazione
  useEffect(() => {
    initializeCoach();
  }, [user]);

  // Scroll automatico ai nuovi messaggi
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initializeCoach = async () => {
    setIsLoading(true);
    
    try {
      let lastWorkoutData = null;
      
      // Carica ultimo workout (senza .single() per evitare errori se vuoto)
      const { data: workouts } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', user?.id)
        .eq('completed', true)
        .order('end_time', { ascending: false })
        .limit(1);
      
      if (workouts && workouts.length > 0) {
        lastWorkoutData = workouts[0];
        setLastWorkout(lastWorkoutData);
      }

      // Carica statistiche
      const { count: totalWorkouts } = await supabase
        .from('workout_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)
        .eq('completed', true);

      const { count: weekWorkouts } = await supabase
        .from('workout_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)
        .eq('completed', true)
        .gte('start_time', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      setStats({
        total: totalWorkouts || 0,
        thisWeek: weekWorkouts || 0
      });

      // Determina il workout consigliato
      const nextWorkout = determineNextWorkout(lastWorkoutData);
      setSuggestion(nextWorkout);

      // Messaggio iniziale del Coach
      const greeting = await generateGreeting(lastWorkoutData, nextWorkout);
      addCoachMessage(greeting);

    } catch (error) {
      console.error('Error initializing coach:', error);
      // Fallback - mostra comunque l'interfaccia
      const nextWorkout = determineNextWorkout(null);
      setSuggestion(nextWorkout);
      addCoachMessage("Ciao Manuel! Sono Coach Alex, il tuo personal trainer. Pronto per allenarti oggi?");
    } finally {
      setIsLoading(false);
    }
  };

  const determineNextWorkout = (lastWorkout: any): WorkoutSuggestion => {
    // Logica rotazione Upper/Lower Split
    const workouts = [
      { id: 'upper_a', name: 'Upper A - Petto & Tricipiti', exercises: 9, time: 60 },
      { id: 'lower_a', name: 'Lower A - Quadricipiti', exercises: 9, time: 55 },
      { id: 'upper_b', name: 'Upper B - Dorso & Bicipiti', exercises: 9, time: 60 },
      { id: 'lower_b', name: 'Lower B - Glutei & Femorali', exercises: 9, time: 55 },
    ];

    let nextIndex = 0;
    let reason = "E' il momento di iniziare il tuo programma!";

    if (lastWorkout) {
      const lastId = lastWorkout.workout_id;
      const lastIndex = workouts.findIndex(w => w.id === lastId);
      nextIndex = (lastIndex + 1) % workouts.length;
      
      const daysSince = Math.floor((Date.now() - new Date(lastWorkout.end_time).getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSince === 0) {
        reason = "Hai gia fatto un ottimo workout oggi! Ma se vuoi...";
      } else if (daysSince === 1) {
        reason = "Perfetto timing! Un giorno di recupero e sei pronto.";
      } else if (daysSince >= 3) {
        reason = `Sono ${daysSince} giorni dall'ultimo allenamento. Riprendiamo!`;
      } else {
        reason = "Seguendo la rotazione del tuo programma.";
      }
    }

    const next = workouts[nextIndex];
    return {
      workoutId: next.id,
      workoutName: next.name,
      reason,
      exercises: next.exercises,
      estimatedTime: next.time
    };
  };

  const generateGreeting = async (lastWorkout: any, suggestion: WorkoutSuggestion): Promise<string> => {
    const hour = new Date().getHours();
    let timeGreeting = "Ciao";
    if (hour < 12) timeGreeting = "Buongiorno";
    else if (hour < 18) timeGreeting = "Buon pomeriggio";
    else timeGreeting = "Buonasera";

    let context = `${timeGreeting} Manuel!`;

    if (lastWorkout) {
      const lastDate = new Date(lastWorkout.end_time);
      const daysSince = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      const duration = lastWorkout.duration_minutes || Math.floor((new Date(lastWorkout.end_time).getTime() - new Date(lastWorkout.start_time).getTime()) / 60000);
      
      if (daysSince === 0) {
        context += ` Oggi hai gia completato ${lastWorkout.workout_name} in ${duration} minuti. Ottimo lavoro!`;
      } else if (daysSince === 1) {
        context += ` Ieri hai fatto ${lastWorkout.workout_name}. Oggi tocca a ${suggestion.workoutName}.`;
      } else {
        context += ` L'ultimo allenamento e stato ${daysSince} giorni fa: ${lastWorkout.workout_name}.`;
      }
    } else {
      context += " Benvenuto! Sono Coach Alex, il tuo personal trainer AI.";
    }

    context += `\n\nOggi ti consiglio: ${suggestion.workoutName}\n${suggestion.reason}`;
    context += `\n\nVuoi iniziare? Dimmi "Inizia" oppure chiedimi qualsiasi cosa!`;

    return context;
  };

  const addCoachMessage = async (content: string) => {
    setMessages(prev => [...prev, {
      role: 'coach',
      content,
      timestamp: new Date()
    }]);
    
    // Se il suono e abilitato, fai parlare il coach
    if (soundEnabled && content) {
      setIsSpeaking(true);
      try {
        await voiceService.speak(content);
      } catch (e) {
        console.error('TTS error:', e);
      } finally {
        setIsSpeaking(false);
      }
    }
  };

  const addUserMessage = (content: string) => {
    setMessages(prev => [...prev, {
      role: 'user',
      content,
      timestamp: new Date()
    }]);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = inputText.trim();
    setInputText('');
    addUserMessage(userMessage);
    setIsTyping(true);

    // Controlla comandi speciali
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('inizia') || lowerMessage.includes('parti') || lowerMessage.includes('vai') || lowerMessage.includes('pronto')) {
      // Avvia il workout consigliato
      addCoachMessage(`Perfetto! Avvio ${suggestion?.workoutName}. Preparati, si parte!`);
      setTimeout(() => {
        navigate('/workout', { state: { workoutId: suggestion?.workoutId } });
      }, 1500);
      setIsTyping(false);
      return;
    }

    if (lowerMessage.includes('upper a') || lowerMessage.includes('petto')) {
      navigate('/workout', { state: { workoutId: 'upper_a' } });
      setIsTyping(false);
      return;
    }
    if (lowerMessage.includes('lower a') || lowerMessage.includes('quadricipiti')) {
      navigate('/workout', { state: { workoutId: 'lower_a' } });
      setIsTyping(false);
      return;
    }
    if (lowerMessage.includes('upper b') || lowerMessage.includes('dorso')) {
      navigate('/workout', { state: { workoutId: 'upper_b' } });
      setIsTyping(false);
      return;
    }
    if (lowerMessage.includes('lower b') || lowerMessage.includes('glutei')) {
      navigate('/workout', { state: { workoutId: 'lower_b' } });
      setIsTyping(false);
      return;
    }

    // Chiedi al Coach AI
    try {
      const response = await coachAI.chat(userMessage, {
        currentExercise: suggestion?.workoutName,
        totalExercises: suggestion?.exercises
      });
      addCoachMessage(response.message);
    } catch (error) {
      addCoachMessage("Scusa, ho avuto un problema. Riprova!");
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startWorkout = () => {
    if (suggestion) {
      navigate('/workout', { state: { workoutId: suggestion.workoutId } });
    }
  };

  // Gestione microfono - Speech to Text
  const toggleListening = async () => {
    if (isListening) {
      // Ferma registrazione e trascrivi
      setIsListening(false);
      try {
        const transcript = await voiceService.stopListening();
        if (transcript) {
          setInputText(transcript);
          // Auto-invia il messaggio
          addUserMessage(transcript);
          setIsTyping(true);
          
          const response = await coachAI.chat(transcript, {
            currentExercise: suggestion?.workoutName,
            totalExercises: suggestion?.exercises
          });
          addCoachMessage(response.message);
          setIsTyping(false);
        }
      } catch (e) {
        console.error('STT error:', e);
      }
    } else {
      // Inizia registrazione
      try {
        await voiceService.startListening();
        setIsListening(true);
      } catch (e) {
        console.error('Mic error:', e);
        alert('Impossibile accedere al microfono');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center animate-pulse">
            <Dumbbell className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Coach Alex</h2>
          <p className="text-gray-400">Sto analizzando i tuoi allenamenti...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex flex-col">
      {/* Header minimo */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center ${isSpeaking ? 'animate-pulse ring-4 ring-purple-400' : ''}`}>
            <Dumbbell className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">Coach Alex</h1>
            <p className="text-purple-300 text-sm">
              {isSpeaking ? 'Sta parlando...' : 'Il tuo Personal Trainer AI'}
            </p>
          </div>
        </div>
        <button 
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-2 rounded-lg bg-white/10 text-white"
        >
          {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
      </div>

      {/* Stats rapide */}
      {stats && (
        <div className="px-4 pb-4">
          <div className="flex gap-3">
            <div className="flex-1 bg-white/10 rounded-xl p-3 flex items-center gap-3">
              <Flame className="w-8 h-8 text-orange-400" />
              <div>
                <div className="text-2xl font-bold text-white">{stats.thisWeek}</div>
                <div className="text-xs text-gray-400">Questa settimana</div>
              </div>
            </div>
            <div className="flex-1 bg-white/10 rounded-xl p-3 flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-green-400" />
              <div>
                <div className="text-2xl font-bold text-white">{stats.total}</div>
                <div className="text-xs text-gray-400">Totali</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        {messages.map((msg, index) => (
          <div 
            key={index}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                msg.role === 'user' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-white/10 text-white'
              }`}
            >
              <p className="whitespace-pre-line">{msg.content}</p>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white/10 rounded-2xl px-4 py-3 text-white">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Workout suggerito - Card grande */}
      {suggestion && (
        <div className="px-4 pb-4">
          <div 
            onClick={startWorkout}
            className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-5 cursor-pointer hover:from-purple-500 hover:to-pink-500 transition-all transform hover:scale-[1.02]"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-purple-200 text-sm mb-1">Workout consigliato</div>
                <div className="text-white text-xl font-bold mb-2">{suggestion.workoutName}</div>
                <div className="flex items-center gap-4 text-purple-200 text-sm">
                  <span className="flex items-center gap-1">
                    <Dumbbell className="w-4 h-4" />
                    {suggestion.exercises} esercizi
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    ~{suggestion.estimatedTime} min
                  </span>
                </div>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <Play className="w-8 h-8 text-white fill-white" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="p-4 bg-gray-900/50 backdrop-blur">
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleListening}
            className={`p-3 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-white/10'} text-white transition-all`}
          >
            {isListening ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </button>
          
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Parla con Coach Alex..."
            className="flex-1 bg-white/10 text-white placeholder-gray-400 rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          
          <button 
            onClick={handleSendMessage}
            disabled={!inputText.trim()}
            className="p-3 rounded-full bg-purple-600 text-white disabled:opacity-50"
          >
            <Send className="w-6 h-6" />
          </button>
        </div>
        
        {/* Quick actions */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
          <button 
            onClick={() => { setInputText("Inizia workout"); handleSendMessage(); }}
            className="px-4 py-2 bg-white/10 text-white rounded-full text-sm whitespace-nowrap hover:bg-white/20"
          >
            Inizia
          </button>
          <button 
            onClick={() => setInputText("Che esercizi faccio oggi?")}
            className="px-4 py-2 bg-white/10 text-white rounded-full text-sm whitespace-nowrap hover:bg-white/20"
          >
            Cosa faccio oggi?
          </button>
          <button 
            onClick={() => setInputText("Com'e andato l'ultimo allenamento?")}
            className="px-4 py-2 bg-white/10 text-white rounded-full text-sm whitespace-nowrap hover:bg-white/20"
          >
            Ultimo allenamento
          </button>
          <button 
            onClick={() => setInputText("Dammi consigli per migliorare")}
            className="px-4 py-2 bg-white/10 text-white rounded-full text-sm whitespace-nowrap hover:bg-white/20"
          >
            Consigli
          </button>
        </div>
      </div>
    </div>
  );
};

export default SmartCoachHome;
