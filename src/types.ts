export interface AudioClip {
  id: string;
  name: string;
  trackId: string;
  buffer: AudioBuffer;
  duration: number; // in seconds
  startOffset: number; // when relative to timeline (seconds)
  startInCut: number; // crop start position (seconds)
  durationInCut: number; // crop duration (seconds)
  speed: number; // play speed factor
  equalizer?: EqualizerSettings;
  dynamicAudio?: DynamicAudioSettings;
}

export interface TrackChannel {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface EqualizerSettings {
  isEnabled: boolean;
  hz60: number; // gain dB -12 to 12
  hz230: number;
  hz910: number;
  hz3600: number;
  hz14000: number;
  isBassBoost: boolean;
  isSurroundSound: boolean;
}

export interface DynamicAudioSettings {
  lowFreq: number; // volume multiplier (0 to 1.5)
  medFreq: number; // volume multiplier (0 to 1.5)
  highFreq: number; // volume multiplier (0 to 1.5)
}

export interface SongPreset {
  id: string;
  title: string;
  language: string;
  subgenre: string;
}

export const INDIAN_LANGUAGES = [
  { code: "hindi", name: "Hindi (Hinglish)" },
  { code: "bengali", name: "Bengali (Benglish)" },
  { code: "punjabi", name: "Punjabi (Romanized)" },
  { code: "tamil", name: "Tamil (Romanized)" },
  { code: "telugu", name: "Telugu (Romanized)" },
  { code: "kannada", name: "Kannada (Romanized)" },
  { code: "marathi", name: "Marathi (Romanized)" },
  { code: "gujarati", name: "Gujarati (Romanized)" },
];
