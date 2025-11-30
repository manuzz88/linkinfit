// GymMonitorWorkout - Layout ottimizzato per monitor palestra
// Timer gigante, esercizio ben visibile, bottoni grandi

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Play, Pause, SkipForward, CheckCircle, 
  ChevronRight, Volume2, VolumeX, Dumbbell,
  Clock, Target, Flame, Trophy
} from 'lucide-react';
import { useWorkout } from '../contexts/WorkoutContext';
import { coachAI } from '../services/coachAIService';
import { exerciseDbService } from '../services/exerciseDbService';

const GymMonitorWorkout: React.FC = () => {
  const navigate = useNavigate();
  const { state, actions } = useWorkout();
  
  // Stati
  const [timer, setTimer] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentWeight, setCurrentWeight] = useState('');
  const [currentReps, setCurrentReps] = useState('');
  const [coachMessage, setCoachMessage] = useState('');
  const [exerciseGif, setExerciseGif] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showExerciseList, setShowExerciseList] = useState(false);
  const [workoutStartTime] = useState(Date.now());

  // Audio per notifiche
  const playSound = useCallback((type: 'beep' | 'complete' | 'rest') => {
    if (!soundEnabled) return;
    
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    switch (type) {
      case 'beep':
        oscillator.frequency.value = 800;
        gainNode.gain.value = 0.3;
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
        break;
      case 'complete':
        oscillator.frequency.value = 1000;
        gainNode.gain.value = 0.4;
        oscillator.start();
        setTimeout(() => {
          oscillator.frequency.value = 1200;
        }, 100);
        oscillator.stop(audioContext.currentTime + 0.3);
        break;
      case 'rest':
        oscillator.frequency.value = 600;
        gainNode.gain.value = 0.5;
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.5);
        break;
    }
  }, [soundEnabled]);

  // Inizializza workout
  useEffect(() => {
    if (!state.currentSession) {
      actions.startWorkout('upper_a');
    }
    
    // Messaggio iniziale del coach
    const initCoach = async () => {
      const response = await coachAI.onWorkoutStart('Upper A - Petto & Tricipiti');
      setCoachMessage(response.message);
    };
    initCoach();
  }, []);

  // Carica GIF esercizio
  useEffect(() => {
    if (!state.currentSession) return;
    
    const currentWorkout = state.workouts.find(w => w.id === state.currentSession?.workout_id);
    if (!currentWorkout) return;
    
    const currentExercise = currentWorkout.exercises[state.currentSession.current_exercise_index];
    
    const loadGif = async () => {
      const gif = await exerciseDbService.getExerciseGif(currentExercise.name);
      setExerciseGif(gif);
    };
    loadGif();
    
    // Messaggio coach per nuovo esercizio
    const getCoachAdvice = async () => {
      const response = await coachAI.onExerciseStart(
        currentExercise.name,
        currentExercise.sets,
        currentExercise.target_reps,
        state.currentSession!.current_exercise_index + 1,
        currentWorkout.exercises.length
      );
      setCoachMessage(response.message);
    };
    getCoachAdvice();
    
  }, [state.currentSession?.current_exercise_index]);

  // Timer di riposo
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    
    if (isResting && !isPaused && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => {
          // Beep negli ultimi 5 secondi
          if (prev <= 5 && prev > 0) {
            playSound('beep');
          }
          
          if (prev <= 1) {
            setIsResting(false);
            playSound('rest');
            
            // Coach: riposo finito
            coachAI.onRestEnd().then(r => setCoachMessage(r.message));
            
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isResting, isPaused, timer, playSound]);

  if (!state.currentSession) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <Dumbbell className="w-24 h-24 mx-auto mb-6 animate-pulse" />
          <div className="text-3xl font-bold">Caricamento workout...</div>
        </div>
      </div>
    );
  }

  const currentWorkout = state.workouts.find(w => w.id === state.currentSession?.workout_id);
  if (!currentWorkout) return null;

  const currentExercise = currentWorkout.exercises[state.currentSession.current_exercise_index];
  const progress = ((state.currentSession.current_exercise_index) / currentWorkout.exercises.length) * 100;
  const setProgress = ((state.currentSession.current_set - 1) / currentExercise.sets) * 100;

  // Completa serie
  const handleCompleteSet = async () => {
    if (!currentWeight || !currentReps) return;
    
    playSound('complete');
    
    const weight = parseFloat(currentWeight);
    const reps = parseInt(currentReps);
    
    // Coach feedback
    const response = await coachAI.onSetComplete(
      currentExercise.name,
      state.currentSession!.current_set,
      currentExercise.sets,
      weight,
      reps
    );
    setCoachMessage(response.message);
    
    // Se non e l'ultima serie, avvia riposo
    if (state.currentSession!.current_set < currentExercise.sets) {
      setTimer(currentExercise.rest_time);
      setIsResting(true);
      
      actions.updateSession({
        current_set: state.currentSession!.current_set + 1
      });
    } else {
      // Ultima serie, passa al prossimo esercizio
      handleNextExercise();
    }
    
    // Reset inputs
    setCurrentWeight('');
    setCurrentReps('');
  };

  // Prossimo esercizio
  const handleNextExercise = () => {
    setIsResting(false);
    setTimer(0);
    
    if (state.currentSession!.current_exercise_index < currentWorkout.exercises.length - 1) {
      actions.updateSession({
        current_exercise_index: state.currentSession!.current_exercise_index + 1,
        current_set: 1
      });
    } else {
      // Workout completato
      const duration = Date.now() - workoutStartTime;
      coachAI.onWorkoutComplete(
        currentWorkout.name,
        currentWorkout.exercises.length,
        currentWorkout.exercises.reduce((acc, ex) => acc + ex.sets, 0),
        duration
      ).then(r => {
        setCoachMessage(r.message);
        setTimeout(() => navigate('/'), 3000);
      });
    }
  };

  // Formatta tempo
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Tempo workout
  const workoutDuration = Math.floor((Date.now() - workoutStartTime) / 1000);

  return (
    <div className="min-h-screen bg-gray-900 text-white overflow-hidden">
      {/* Header compatto */}
      <div className="bg-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Dumbbell className="w-8 h-8 text-purple-500" />
          <div>
            <h1 className="text-xl font-bold">{currentWorkout.name}</h1>
            <p className="text-gray-400 text-sm">
              Esercizio {state.currentSession.current_exercise_index + 1}/{currentWorkout.exercises.length}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          {/* Tempo totale */}
          <div className="flex items-center gap-2 text-gray-400">
            <Clock className="w-5 h-5" />
            <span className="text-lg font-mono">{formatTime(workoutDuration)}</span>
          </div>
          
          {/* Sound toggle */}
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600"
          >
            {soundEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
          </button>
          
          {/* Lista esercizi */}
          <button 
            onClick={() => setShowExerciseList(!showExerciseList)}
            className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm"
          >
            Lista Esercizi
          </button>
        </div>
      </div>

      {/* Progress bar workout */}
      <div className="h-2 bg-gray-800">
        <div 
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Main content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Colonna sinistra - GIF esercizio */}
        <div className="w-1/3 p-6 flex flex-col">
          <div className="flex-1 bg-gray-800 rounded-2xl overflow-hidden flex items-center justify-center">
            {exerciseGif ? (
              <img 
                src={exerciseGif} 
                alt={currentExercise.name}
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <div className="text-center text-gray-500">
                <Dumbbell className="w-24 h-24 mx-auto mb-4 opacity-50" />
                <p>GIF non disponibile</p>
              </div>
            )}
          </div>
          
          {/* Info esercizio */}
          <div className="mt-4 bg-gray-800 rounded-xl p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-gray-400 text-sm">Target</div>
                <div className="text-lg font-bold">{currentExercise.target_reps}</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">Riposo</div>
                <div className="text-lg font-bold">{currentExercise.rest_time}s</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">Attrezzo</div>
                <div className="text-lg font-bold truncate">{currentExercise.equipment}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Colonna centrale - Timer e controlli */}
        <div className="flex-1 p-6 flex flex-col">
          {/* Nome esercizio GRANDE */}
          <div className="text-center mb-6">
            <h2 className="text-4xl lg:text-5xl xl:text-6xl font-bold current-exercise">
              {currentExercise.name}
            </h2>
            <div className="text-2xl text-gray-400 mt-2 sets-display">
              Serie {state.currentSession.current_set} di {currentExercise.sets}
            </div>
          </div>

          {/* Progress serie */}
          <div className="h-3 bg-gray-800 rounded-full mb-8 progress-bar">
            <div 
              className="h-full bg-green-500 rounded-full transition-all duration-300"
              style={{ width: `${setProgress}%` }}
            />
          </div>

          {/* Timer o Input */}
          {isResting ? (
            // TIMER GIGANTE
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="text-[12rem] lg:text-[16rem] xl:text-[20rem] font-bold font-mono timer-display leading-none">
                {formatTime(timer)}
              </div>
              <div className="text-3xl text-gray-400 mt-4">
                {timer <= 10 ? "Preparati!" : "Riposo"}
              </div>
              
              {/* Controlli timer */}
              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setIsPaused(!isPaused)}
                  className="px-8 py-4 rounded-xl bg-gray-700 hover:bg-gray-600 text-xl font-semibold flex items-center gap-2"
                >
                  {isPaused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
                  {isPaused ? 'Riprendi' : 'Pausa'}
                </button>
                <button
                  onClick={() => { setIsResting(false); setTimer(0); }}
                  className="px-8 py-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-xl font-semibold flex items-center gap-2"
                >
                  <SkipForward className="w-6 h-6" />
                  Salta Riposo
                </button>
              </div>
            </div>
          ) : (
            // INPUT PESO E REPS
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="grid grid-cols-2 gap-8 w-full max-w-2xl mb-8">
                {/* Peso */}
                <div>
                  <label className="block text-2xl text-gray-400 mb-3 text-center">Peso (kg)</label>
                  <input
                    type="number"
                    value={currentWeight}
                    onChange={(e) => setCurrentWeight(e.target.value)}
                    className="w-full text-6xl font-bold text-center bg-gray-800 border-4 border-gray-700 rounded-2xl py-6 focus:border-purple-500 focus:outline-none"
                    placeholder="0"
                    step="0.5"
                  />
                </div>
                
                {/* Ripetizioni */}
                <div>
                  <label className="block text-2xl text-gray-400 mb-3 text-center">Ripetizioni</label>
                  <input
                    type="number"
                    value={currentReps}
                    onChange={(e) => setCurrentReps(e.target.value)}
                    className="w-full text-6xl font-bold text-center bg-gray-800 border-4 border-gray-700 rounded-2xl py-6 focus:border-purple-500 focus:outline-none"
                    placeholder="0"
                  />
                </div>
              </div>
              
              {/* Bottone completa */}
              <button
                onClick={handleCompleteSet}
                disabled={!currentWeight || !currentReps}
                className="px-16 py-6 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-3xl font-bold flex items-center gap-4 transition-all transform hover:scale-105"
              >
                <CheckCircle className="w-10 h-10" />
                Completa Serie
              </button>
            </div>
          )}
        </div>

        {/* Colonna destra - Coach AI */}
        <div className="w-1/4 p-6 flex flex-col">
          {/* Coach Message */}
          <div className="bg-gradient-to-br from-purple-900 to-pink-900 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                <Flame className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-lg">Coach Alex</div>
                <div className="text-purple-300 text-sm">AI Personal Trainer</div>
              </div>
            </div>
            <p className="text-lg leading-relaxed">
              {coachMessage || "Pronto per iniziare! Dai il massimo oggi!"}
            </p>
          </div>

          {/* Prossimo esercizio */}
          {state.currentSession.current_exercise_index < currentWorkout.exercises.length - 1 && (
            <div className="bg-gray-800 rounded-2xl p-6 mb-6">
              <div className="text-gray-400 text-sm mb-2">Prossimo</div>
              <div className="flex items-center gap-3">
                <ChevronRight className="w-6 h-6 text-purple-500" />
                <div>
                  <div className="font-bold">
                    {currentWorkout.exercises[state.currentSession.current_exercise_index + 1].name}
                  </div>
                  <div className="text-gray-400 text-sm">
                    {currentWorkout.exercises[state.currentSession.current_exercise_index + 1].sets} serie
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stats sessione */}
          <div className="bg-gray-800 rounded-2xl p-6 mt-auto">
            <div className="text-gray-400 text-sm mb-4">Sessione</div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-500" />
                  <span>Esercizi</span>
                </div>
                <span className="font-bold">
                  {state.currentSession.current_exercise_index}/{currentWorkout.exercises.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  <span>Serie totali</span>
                </div>
                <span className="font-bold">
                  {/* Calcola serie completate */}
                  {currentWorkout.exercises
                    .slice(0, state.currentSession.current_exercise_index)
                    .reduce((acc, ex) => acc + ex.sets, 0) + state.currentSession.current_set - 1}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal lista esercizi */}
      {showExerciseList && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setShowExerciseList(false)}
        >
          <div 
            className="bg-gray-800 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold mb-6">Esercizi del Workout</h3>
            <div className="space-y-3">
              {currentWorkout.exercises.map((exercise, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl flex items-center justify-between ${
                    index === state.currentSession!.current_exercise_index
                      ? 'bg-purple-600'
                      : index < state.currentSession!.current_exercise_index
                      ? 'bg-green-900/50'
                      : 'bg-gray-700'
                  }`}
                >
                  <div>
                    <div className="font-semibold">{exercise.name}</div>
                    <div className="text-sm text-gray-400">
                      {exercise.sets} serie x {exercise.target_reps}
                    </div>
                  </div>
                  {index < state.currentSession!.current_exercise_index && (
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  )}
                  {index === state.currentSession!.current_exercise_index && (
                    <span className="text-sm bg-white/20 px-3 py-1 rounded-full">In corso</span>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowExerciseList(false)}
              className="w-full mt-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-semibold"
            >
              Chiudi
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GymMonitorWorkout;
