// ExerciseDB API Service
// API gratuita con 1300+ esercizi e GIF animate

const RAPIDAPI_KEY = 'e352a46286mshc593f35371136dcp179511jsnc493f6b084c6';
const RAPIDAPI_HOST = 'exercisedb.p.rapidapi.com';
const BASE_URL = 'https://exercisedb.p.rapidapi.com';

// Cache locale per evitare chiamate ripetute
const exerciseCache = new Map<string, ExerciseData>();

export interface ExerciseData {
  id: string;
  name: string;
  target: string;
  bodyPart: string;
  equipment: string;
  gifUrl: string;
  secondaryMuscles: string[];
  instructions: string[];
}

// Mapping esercizi italiani -> ExerciseDB
const EXERCISE_MAPPING: Record<string, string> = {
  // PETTO
  "Spinte Manubri Panca Piana": "dumbbell bench press",
  "Spinte Manubri Incline 30°": "incline dumbbell press",
  "Spinte Manubri Incline": "incline dumbbell press",
  "Croci Manubri Panca Piana": "dumbbell fly",
  "Dips Parallele Weighted": "chest dip",
  "Dips Parallele": "chest dip",
  "Dips Parallele Petto": "chest dip",
  "Push-up Anelli": "push up",
  "Close Grip Push-up": "diamond push up",
  
  // TRICIPITI
  "Skull Crusher Manubri": "dumbbell skull crusher",
  "Overhead Extension Elastico": "overhead triceps extension",
  "French Press Manubri": "dumbbell lying triceps extension",
  "Kickback Manubri": "dumbbell kickback",
  
  // SPALLE
  "Spinte Manubri Seduto": "dumbbell shoulder press",
  "Military Press Manubri": "dumbbell shoulder press",
  "Arnold Press Manubri": "arnold press",
  "Alzate Laterali Manubri": "dumbbell lateral raise",
  "Alzate Frontali Manubri": "dumbbell front raise",
  "Alzate Frontali Alternate": "dumbbell front raise",
  "Alzate Posteriori Manubri Piegato": "dumbbell rear delt fly",
  "Alzate Posteriori Panca Incline": "dumbbell rear delt fly",
  "Face Pull TRX": "face pull",
  
  // DORSALI
  "Trazioni Sbarra Presa Larga": "pull up",
  "Trazioni Sbarra": "pull up",
  "Trazioni Presa Stretta": "close grip pull up",
  "Trazioni Presa Neutra": "neutral grip pull up",
  "Rematore Manubri Piegato": "dumbbell bent over row",
  "Rematore Manubri Unilaterale": "dumbbell row",
  "Pullover Manubrio": "dumbbell pullover",
  "TRX Rows": "inverted row",
  
  // BICIPITI
  "Curl Bilanciere EZ": "barbell curl",
  "Curl Manubri Alternati": "dumbbell alternate bicep curl",
  "Hammer Curl Manubri": "dumbbell hammer curl",
  "Curl Concentrato Manubrio": "dumbbell concentration curl",
  "Curl Concentrato": "dumbbell concentration curl",
  "Curl Incline Manubri": "incline dumbbell curl",
  "Curl 21s": "barbell curl",
  
  // GAMBE
  "Squat Rack Bilanciere": "barbell squat",
  "Front Squat Rack": "barbell front squat",
  "Goblet Squat Manubrio": "goblet squat",
  "Affondi Camminati Manubri": "dumbbell walking lunge",
  "Affondi Bulgari Manubri": "dumbbell bulgarian split squat",
  "Affondi Laterali Manubri": "dumbbell lateral lunge",
  "Stacchi Rumeni Manubri": "dumbbell romanian deadlift",
  "Glute Kickback Elastico": "cable kickback",
  "Calf Raises Manubri": "dumbbell calf raise",
  "Calf Raises Unilaterali": "single leg calf raise",
  "Calf Raises Bilanciere": "barbell calf raise",
  
  // ADDOMINALI
  "Hanging Leg Raises": "hanging leg raise",
  "Seated Knee Tucks Panca": "seated knee tucks",
  "Plank": "plank",
  "Plank Weighted": "weighted plank",
  "Russian Twist Manubrio": "russian twist",
  "Dead Bug": "dead bug",
  "Side Plank": "side plank",
  
  // TRAPEZI
  "Shrugs Manubri": "dumbbell shrug"
};

class ExerciseDbService {
  private apiKey: string;
  
  constructor() {
    this.apiKey = RAPIDAPI_KEY;
  }
  
  setApiKey(key: string) {
    this.apiKey = key;
  }
  
  private async fetchFromApi(endpoint: string): Promise<any> {
    if (!this.apiKey || this.apiKey === 'YOUR_RAPIDAPI_KEY') {
      console.warn('ExerciseDB API key not configured');
      return null;
    }
    
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        headers: {
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': RAPIDAPI_HOST
        }
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('ExerciseDB API error:', error);
      return null;
    }
  }
  
  // Cerca esercizio per nome
  async searchExercise(name: string): Promise<ExerciseData | null> {
    // Controlla cache
    if (exerciseCache.has(name.toLowerCase())) {
      return exerciseCache.get(name.toLowerCase())!;
    }
    
    // Cerca il mapping italiano -> inglese
    const englishName = EXERCISE_MAPPING[name] || name;
    
    const data = await this.fetchFromApi(`/exercises/name/${encodeURIComponent(englishName.toLowerCase())}`);
    
    if (data && data.length > 0) {
      const exercise = data[0];
      exerciseCache.set(name.toLowerCase(), exercise);
      return exercise;
    }
    
    return null;
  }
  
  // Ottieni GIF per esercizio italiano
  async getExerciseGif(italianName: string): Promise<string | null> {
    const exercise = await this.searchExercise(italianName);
    return exercise?.gifUrl || null;
  }
  
  // Ottieni dati completi esercizio
  async getExerciseData(italianName: string): Promise<ExerciseData | null> {
    return await this.searchExercise(italianName);
  }
  
  // Ottieni esercizi per muscolo target
  async getExercisesByMuscle(muscle: string): Promise<ExerciseData[]> {
    const data = await this.fetchFromApi(`/exercises/target/${encodeURIComponent(muscle)}`);
    return data || [];
  }
  
  // Ottieni esercizi per attrezzatura
  async getExercisesByEquipment(equipment: string): Promise<ExerciseData[]> {
    const data = await this.fetchFromApi(`/exercises/equipment/${encodeURIComponent(equipment)}`);
    return data || [];
  }
  
  // Ottieni tutti i muscoli target disponibili
  async getTargetMuscles(): Promise<string[]> {
    const data = await this.fetchFromApi('/exercises/targetList');
    return data || [];
  }
  
  // Ottieni tutte le attrezzature disponibili
  async getEquipmentList(): Promise<string[]> {
    const data = await this.fetchFromApi('/exercises/equipmentList');
    return data || [];
  }
  
  // Fallback: genera URL placeholder se API non disponibile
  getPlaceholderGif(exerciseName: string): string {
    // Usa un placeholder generico basato sul tipo di esercizio
    const name = exerciseName.toLowerCase();
    
    if (name.includes('push') || name.includes('spint') || name.includes('panca')) {
      return '/exercises/chest-placeholder.gif';
    }
    if (name.includes('pull') || name.includes('traz') || name.includes('remat')) {
      return '/exercises/back-placeholder.gif';
    }
    if (name.includes('squat') || name.includes('affond') || name.includes('stacch')) {
      return '/exercises/legs-placeholder.gif';
    }
    if (name.includes('curl') || name.includes('bicip')) {
      return '/exercises/biceps-placeholder.gif';
    }
    if (name.includes('tricip') || name.includes('dips') || name.includes('skull')) {
      return '/exercises/triceps-placeholder.gif';
    }
    if (name.includes('alzat') || name.includes('spall') || name.includes('press')) {
      return '/exercises/shoulders-placeholder.gif';
    }
    
    return '/exercises/generic-placeholder.gif';
  }
}

export const exerciseDbService = new ExerciseDbService();
export { EXERCISE_MAPPING };
