import React, { useState, useEffect, useRef } from "react";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Check, 
  X, 
  Radio, 
  Zap, 
  Sparkles, 
  Volume2, 
  CornerRightDown,
  Info,
  Sliders,
  Music,
  Activity
} from "lucide-react";
import { AudioClip } from "../types";

// Simple cached noise generator to prevent overhead
let cachedNoiseBuffer: AudioBuffer | null = null;
const getNoiseBuffer = (ctx: BaseAudioContext): AudioBuffer => {
  if (cachedNoiseBuffer && cachedNoiseBuffer.sampleRate === ctx.sampleRate) {
    return cachedNoiseBuffer;
  }
  const size = ctx.sampleRate * 2; // 2 seconds of noise
  const buffer = ctx.createBuffer(1, size, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < size; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  cachedNoiseBuffer = buffer;
  return buffer;
};

// 52 Custom Instruments with categories and emojis
export interface CustomInstrument {
  id: string;
  name: string;
  emoji: string;
  category: "keyboard" | "strings" | "wind" | "percussion";
  color: string;
  desc: string;
}

const INSTRUMENTS_LIST: CustomInstrument[] = [
  { id: "grand_piano", name: "Grand Piano", emoji: "🎹", category: "keyboard", color: "from-blue-600 to-indigo-600", desc: "Classic concert piano with warm resonance" },
  { id: "acoustic_guitar", name: "Acoustic Guitar", emoji: "🎸", category: "strings", color: "from-amber-600 to-orange-700", desc: "Bright and woody nylon strings plucking" },
  { id: "indian_sitar", name: "Classical Sitar", emoji: "🪕", category: "strings", color: "from-amber-500 to-yellow-600", desc: "Drone-backed traditional resonance and side buzz" },
  { id: "classical_tabla", name: "Classical Tabla", emoji: "🥁", category: "percussion", color: "from-yellow-700 to-amber-900", desc: "North Indian rhythm tablay strikes (Dha, Ghe, Ta)" },
  { id: "bansuri_flute", name: "Bansuri Flute", emoji: "🌬️", category: "wind", color: "from-emerald-500 to-teal-650", desc: "Organic, breathy wooden flute with vibrato" },
  { id: "saraswati_veena", name: "Saraswati Veena", emoji: "𓏵", category: "strings", color: "from-amber-700 to-orange-850", desc: "Deep ancient Carnatic stringed resonance" },
  { id: "symphony_violin", name: "Symphony Violin", emoji: "🎻", category: "strings", color: "from-red-650 to-amber-750", desc: "Sustained orchestral solo string resonance" },
  { id: "punjabi_dhol", name: "Punjabi Dhol", emoji: "🛢️", category: "percussion", color: "from-orange-600 to-red-650", desc: "Loud festive double-sided bhangra drum" },
  { id: "cosmic_synth", name: "Cosmic Synth", emoji: "💻", category: "keyboard", color: "from-purple-650 to-pink-600", desc: "Hypnotic fat electronic detuned square pads" },
  { id: "indian_harmonium", name: "Harmonium", emoji: "🎹", category: "keyboard", color: "from-yellow-600 to-amber-800", desc: "Traditional sweet bellows-pumped reed organ" },
  { id: "santoor_pad", name: "Santoor Pad", emoji: "𓍝", category: "strings", color: "from-cyan-600 to-blue-700", desc: "Chiming mallet-struck Kashmiri 100-string dulcimer" },
  { id: "classic_accordion", name: "Accordion", emoji: "🪗", category: "keyboard", color: "from-red-500 to-rose-650", desc: "Romantic retro French pleat reeds" },
  { id: "classical_sarod", name: "Classical Sarod", emoji: "𓏲", category: "strings", color: "from-stone-600 to-slate-800", desc: "Fretless metal-plate wooden plucked string drone" },
  { id: "festive_shehnai", name: "Festive Shehnai", emoji: "🪵", category: "wind", color: "from-amber-850 to-yellow-900", desc: "Auspicious wedding oboe-like high nasal wind" },
  { id: "jazz_trumpet", name: "Jazz Trumpet", emoji: "🎺", category: "wind", color: "from-yellow-550 to-amber-600", desc: "Bright open brass melody horns" },
  { id: "amber_marimba", name: "Amber Marimba", emoji: "🪜", category: "keyboard", color: "from-amber-800 to-yellow-900", desc: "Deep rich wooden bar mallets" },
  { id: "celestial_harp", name: "Celestial Harp", emoji: "𓏢", category: "strings", color: "from-sky-500 to-indigo-600", desc: "Angelic flowing wire strings sweep" },
  { id: "sultry_sax", name: "Sultry Saxphone", emoji: "🎷", category: "wind", color: "from-yellow-600 to-orange-650", desc: "Smooth brass woodwind jazz tones" },
  { id: "drum_machine", name: "808 Drum Grid", emoji: "🔋", category: "percussion", color: "from-slate-700 to-zinc-900", desc: "Futuristic synthetic hi-hats, kicks, and claps" },
  { id: "chill_vibraphone", name: "Vibraphone", emoji: "🔔", category: "keyboard", color: "from-teal-500 to-cyan-600", desc: "Tremolo metallic ambient vibraphone bells" },
  { id: "thumb_kalimba", name: "Thumb Kalimba", emoji: "🎯", category: "keyboard", color: "from-emerald-600 to-lime-600", desc: "Intimate african plucking tines in resonance" },
  { id: "folk_mandolin", name: "Folk Mandolin", emoji: "🎼", category: "strings", color: "from-rose-650 to-amber-850", desc: "Plucky doubled string rapid-fire folk accents" },
  { id: "indian_dholak", name: "Folk Dholak", emoji: "🥁", category: "percussion", color: "from-amber-700 to-yellow-800", desc: "Two-headed North Indian folk hand drum" },
  { id: "indian_mridangam", name: "Carnatic Mridangam", emoji: "𓏾", category: "percussion", color: "from-orange-850 to-amber-950", desc: "Primary rhythmic accompaniment in Carnatic music" },
  { id: "indian_pakhawaj", name: "Temple Pakhawaj", emoji: "🥁", category: "percussion", color: "from-yellow-800 to-red-950", desc: "Deep barrel-shaped court percussion drone" },
  { id: "indian_ghatam", name: "Clay Ghatam", emoji: "🏺", category: "percussion", color: "from-amber-600 to-orange-850", desc: "Earthenware clay pot rhythmic instrument" },
  { id: "indian_kanjira", name: "South Kanjira", emoji: "🥁", category: "percussion", color: "from-zinc-700 to-slate-900", desc: "Small tambourine frame drum with high pitch slaps" },
  { id: "indian_esraj", name: "Esraj Bow", emoji: "🎻", category: "strings", color: "from-rose-600 to-red-800", desc: "Soulful bowed string Indian hybrid lute" },
  { id: "indian_dilruba", name: "Dilruba Solo", emoji: "🎻", category: "strings", color: "from-pink-700 to-purple-850", desc: "Heart-touching bowed string from Sikh traditions" },
  { id: "indian_tanpura", name: "Tanpura Drone", emoji: "🪕", category: "strings", color: "from-teal-600 to-emerald-800", desc: "Sustained hypnotic drone string background backdrop" },
  { id: "rudra_veena", name: "Rudra Veena", emoji: "𓏵", category: "strings", color: "from-red-800 to-orange-950", desc: "Ancient deep resonant chordophone with gourd resonators" },
  { id: "classical_rebab", name: "Afghan Rebab", emoji: "𓏲", category: "strings", color: "from-stone-700 to-amber-900", desc: "Plucked wooden double-chamber folk lute" },
  { id: "baul_ektara", name: "Baul Ektara", emoji: "𓏲", category: "strings", color: "from-amber-500 to-yellow-700", desc: "Single-string Bengali mystic folk instrument" },
  { id: "shepard_flute", name: "Shepherd Pipe", emoji: "🌬️", category: "wind", color: "from-lime-600 to-emerald-700", desc: "High pitched pastoral wooden recorder flute" },
  { id: "sacred_shankha", name: "Sacred Conch", emoji: "🐚", category: "wind", color: "from-slate-100 to-blue-200", desc: "Ritual shell horn with echoing spiritual drone" },
  { id: "snake_pungi", name: "Folk Pungi", emoji: "📯", category: "wind", color: "from-yellow-700 to-amber-850", desc: "Traditional sweet snake charmer gourd pipe" },
  { id: "indian_bulbul", name: "Bulbul Tarang", emoji: "🎹", category: "strings", color: "from-cyan-500 to-blue-650", desc: "Key-plucked Indian banjo with buzzing string drones" },
  { id: "jal_tarang", name: "Jal Tarang", emoji: "🥣", category: "keyboard", color: "from-teal-400 to-cyan-500", desc: "Chiming ceramic water bowls played with wooden sticks" },
  { id: "steel_handpan", name: "Steel Handpan", emoji: "🛸", category: "keyboard", color: "from-slate-650 to-indigo-950", desc: "Ethereal metallic hanging space drum" },
  { id: "gopi_yantra", name: "Gopi Yantra", emoji: "𓏲", category: "strings", color: "from-orange-550 to-red-700", desc: "Traditional one-string plucker with bamboo forks" },
  { id: "indian_ghungroo", name: "Ankle Ghungroo", emoji: "🔔", category: "percussion", color: "from-yellow-500 to-yellow-600", desc: "Sustained rhythmic bronze ankle bell rings" },
  { id: "indian_manjira", name: "Manjira Cymbals", emoji: "🪙", category: "percussion", color: "from-amber-400 to-yellow-600", desc: "Tiny brass prayer hand cymbals" },
  { id: "yakshagana_maddale", name: "Maddale Drum", emoji: "🥁", category: "percussion", color: "from-rose-800 to-red-950", desc: "Traditional Yakshagana theatre folk drum" },
  { id: "temple_nadaswaram", name: "Nadaswaram", emoji: "📯", category: "wind", color: "from-yellow-800 to-amber-950", desc: "Powerful classical temple double-reed oboe" },
  { id: "tamil_murasu", name: "Tamil Murasu", emoji: "🥁", category: "percussion", color: "from-red-750 to-stone-900", desc: "Ancient heavy war kettle drum of Southern India" },
  { id: "shiva_udukkai", name: "Shiva Udukkai", emoji: "🪘", category: "percussion", color: "from-yellow-900 to-orange-950", desc: "Hourglass squeeze-drum with snapping hand percussion" },
  { id: "carnatic_pulangoil", name: "Pulangoil Flute", emoji: "🌬️", category: "wind", color: "from-emerald-600 to-teal-800", desc: "South Indian traditional bamboo flute with deep bass" },
  { id: "khol_mridanga", name: "Bengal Khol", emoji: "🥁", category: "percussion", color: "from-stone-500 to-amber-800", desc: "Clay double-headed folk drum loved in devotional kirtan" },
  { id: "mystic_dotara", name: "Folk Dotara", emoji: "🪕", category: "strings", color: "from-yellow-600 to-orange-700", desc: "Four-stringed plucking rhythm lute for folk songs" },
  { id: "ragas_lead_synth", name: "Ragas Synth Lead", emoji: "🎛️", category: "keyboard", color: "from-violet-600 to-fuchsia-700", desc: "Portamento-enabled lead synthesizer tailored for microtonal sweeps" },
  { id: "church_bellows", name: "Reed Harmonium Bass", emoji: "🎹", category: "keyboard", color: "from-stone-800 to-stone-950", desc: "Deep continuous bass reeds keyboard pad" },
  { id: "rajasthani_morchang", name: "Rajasthani Morchang", emoji: "✂️", category: "wind", color: "from-slate-500 to-slate-700", desc: "Traditional Rajasthani steel harp plucked with breathing resonance" },
];

interface RecordedNote {
  pitch: number;      // Frequency in Hz or index
  name: string;       // Note string identifier
  time: number;       // Trigger timestamp relative to recording offset (seconds)
  duration: number;   // Note length (seconds)
  instrumentId: string;
}

interface CustomInstrumentsBoardProps {
  audioContext: AudioContext;
  onAddRecordedClip: (clip: AudioClip) => void;
  onClose: () => void;
  externalAnalyser?: AnalyserNode | null;
}

export const CustomInstrumentsBoard: React.FC<CustomInstrumentsBoardProps> = ({
  audioContext,
  onAddRecordedClip,
  onClose,
  externalAnalyser,
}) => {
  const [selectedInst, setSelectedInst] = useState<CustomInstrument | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isStudioPanelExpanded, setIsStudioPanelExpanded] = useState<boolean>(false);
  
  // Recording State variables
  const [isRecording, setIsRecording] = useState(false);
  const [recordedNotes, setRecordedNotes] = useState<RecordedNote[]>([]);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
  const [playBackProgress, setPlayBackProgress] = useState<number>(0);
  
  // Playback State variables
  const [isPlayingBack, setIsPlayingBack] = useState(false);
  const [isPlaybackPaused, setIsPlaybackPaused] = useState(false);
  const [isRecordingPaused, setIsRecordingPaused] = useState(false);
  
  const playbackTimersRef = useRef<NodeJS.Timeout[]>([]);
  const activeOscillatorsRef = useRef<(() => void)[]>([]);
  const playbackTimeStartRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const recordingPauseTimeRef = useRef<number | null>(null);
  const totalPausedDurationRef = useRef<number>(0);

  // Advanced Master Effects State Hook Extensions
  const [acousticSpace, setAcousticSpace] = useState<"dry" | "concert" | "temple" | "space">("concert");
  const [pitchScalePreset, setPitchScalePreset] = useState<"chromatic" | "major" | "bhairavi" | "yaman" | "pentatonic" | "maqam">("chromatic");
  const [synthReleaseMult, setSynthReleaseMult] = useState<number>(1.2);
  const [harmonicBooster, setHarmonicBooster] = useState<"none" | "bass" | "sparkles" | "warmth">("sparkles");
  const [vibratoRate, setVibratoRate] = useState<number>(6.0);

  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Real-time canvas oscilloscope renderer
  useEffect(() => {
    let animationId: number;
    const canvas = canvasRef.current;
    
    const draw = () => {
      animationId = requestAnimationFrame(draw);
      const analyser = analyserRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (!analyser) {
        // Draw flat line if idle
        ctx.fillStyle = "rgba(10, 15, 30, 0.4)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "#475569";
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
        return;
      }

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteTimeDomainData(dataArray);

      // Clear with trailing alpha for organic analog motion trails
      ctx.fillStyle = "rgba(10, 15, 30, 0.4)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.shadowBlur = 8;
      ctx.shadowColor = "#38bdf8";
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "#38bdf8";
      ctx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
      ctx.shadowBlur = 0; // reset shadow effects
    };

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [selectedInst, audioContext]);

  // Auto-setup of Analyser Node on live AudioContext
  useEffect(() => {
    if (externalAnalyser) {
      analyserRef.current = externalAnalyser;
    } else if (audioContext && !analyserRef.current) {
      try {
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyser.connect(audioContext.destination);
        analyserRef.current = analyser;
      } catch (err) {
        console.warn("Failed to initiate audio context analyser feedback", err);
      }
    }
  }, [audioContext, externalAnalyser]);

  // Sound generator parameters
  const getNoteFrequency = (octaveNote: string) => {
    // Standard 12-tone chromatic temperament frequencies
    const chromatic: Record<string, number> = {
      "C4": 261.63, "C#4": 277.18, "D4": 293.66, "D#4": 311.13, "E4": 329.63,
      "F4": 349.23, "F#4": 369.99, "G4": 391.13, "G#4": 415.30, "A4": 440.00,
      "A#4": 466.16, "B4": 493.88, "C5": 523.25, "C#5": 554.37, "D5": 587.33,
      "D#5": 622.25, "E5": 659.25, "F5": 698.46, "G5": 783.99, "A5": 880.00
    };

    const freq = chromatic[octaveNote] || 440.0;

    if (pitchScalePreset === "chromatic") {
      return freq;
    }

    // Remap standard keys into beautiful traditional scales for playing diverse musical moods
    if (pitchScalePreset === "major") {
      // Clean major scale (Bilawal) - happy & hopeful tones
      return freq;
    }

    if (pitchScalePreset === "bhairavi") {
      // Phrygian/Bhairavi mode which lowers the 2nd, 3rd, 6th, and 7th degrees
      const bhairaviMap: Record<string, number> = {
        "C4": 261.63,
        "C#4": 272.0,   // Komal Re
        "D4": 277.18,   
        "D#4": 311.13,
        "E4": 311.13,   // Komal Ga
        "F4": 349.23,   // Shuddh Ma
        "F#4": 349.23,
        "G4": 391.13,   // Pa
        "G#4": 408.0,   // Komal Dha
        "A4": 415.30,
        "A#4": 466.16,
        "B4": 466.16,   // Komal Ni
        "C5": 523.25,   // Tar Sa
        "C#5": 544.0,
        "D5": 554.37,
        "D#5": 622.25,
        "E5": 622.25,
      };
      return bhairaviMap[octaveNote] || freq;
    }

    if (pitchScalePreset === "yaman") {
      // Majestic Lydian mode with a raised 4th (F#) - romantic, peaceful and evening-suited
      const yamanMap: Record<string, number> = {
        "C4": 261.63,
        "C#4": 293.66,
        "D4": 293.66,
        "D#4": 329.63,
        "E4": 329.63,
        "F4": 369.99,   // Raised Ma (F#)
        "F#4": 369.99,
        "G4": 391.13,
        "G#4": 440.00,
        "A4": 440.00,
        "A#4": 493.88,
        "B4": 493.88,
        "C5": 523.25,
        "C#5": 587.33,
        "D5": 587.33,
        "D#5": 659.25,
        "E5": 659.25,
      };
      return yamanMap[octaveNote] || freq;
    }

    if (pitchScalePreset === "pentatonic") {
      // 5-Tone Pentatonic Scale (Bhupali) - clean, uplifting melodies
      const pentatonicMap: Record<string, number> = {
        "C4": 261.63,
        "C#4": 261.63,
        "D4": 293.66,
        "D#4": 293.66,
        "E4": 329.63,
        "F4": 391.13,   // Skip F, leap to G
        "F#4": 391.13,
        "G4": 391.13,
        "G#4": 440.00,  
        "A4": 440.00,
        "A#4": 440.00,
        "B4": 523.25,   // Leap to C5
        "C5": 523.25,
        "C#5": 523.25,
        "D5": 587.33,
        "D#5": 587.33,
        "E5": 659.25,
      };
      return pentatonicMap[octaveNote] || freq;
    }

    if (pitchScalePreset === "maqam") {
      // Exotic Hijaz Maqam with traditional 1/4-tone adjustments
      const maqamMap: Record<string, number> = {
        "C4": 261.63,
        "C#4": 277.18,
        "D4": 285.5,    // Quarter-tone komal re (neutral second degree)
        "D#4": 311.13,
        "E4": 329.63,
        "F4": 349.23,
        "F#4": 369.99,
        "G4": 391.13,
        "G#4": 415.30,
        "A4": 425.2,    // Neutral sixth quarter-tone!
        "A#4": 466.16,
        "B4": 493.88,
        "C5": 523.25,
        "C#5": 554.37,
        "D5": 570.0,
        "D#5": 622.25,
        "E5": 659.25,
      };
      return maqamMap[octaveNote] || freq;
    }

    return freq;
  };

  const keyboardKeys = [
    { keyName: "C4", isBlack: false, hotkey: "A" },
    { keyName: "C#4", isBlack: true, hotkey: "W" },
    { keyName: "D4", isBlack: false, hotkey: "S" },
    { keyName: "D#4", isBlack: true, hotkey: "E" },
    { keyName: "E4", isBlack: false, hotkey: "D" },
    { keyName: "F4", isBlack: false, hotkey: "F" },
    { keyName: "F#4", isBlack: true, hotkey: "T" },
    { keyName: "G4", isBlack: false, hotkey: "G" },
    { keyName: "G#4", isBlack: true, hotkey: "Y" },
    { keyName: "A4", isBlack: false, hotkey: "H" },
    { keyName: "A#4", isBlack: true, hotkey: "U" },
    { keyName: "B4", isBlack: false, hotkey: "J" },
    { keyName: "C5", isBlack: false, hotkey: "K" },
    { keyName: "C#5", isBlack: true, hotkey: "O" },
    { keyName: "D5", isBlack: false, hotkey: "L" },
    { keyName: "D#5", isBlack: true, hotkey: "P" },
    { keyName: "E5", isBlack: false, hotkey: ";" },
  ];

  const stringFrets = [
    { name: "Bass drone (Sa)", freq: 110.0, label: "Strings 1 (Low)" },
    { name: "Pancham (Pa)", freq: 164.81, label: "Strings 2" },
    { name: "Madhyam (Ma)", freq: 220.0, label: "Strings 3" },
    { name: "Tar Sa (Sa)", freq: 261.63, label: "Strings 4" },
    { name: "Re Melody", freq: 293.66, label: "Strings 5" },
    { name: "Ga Melody", freq: 329.63, label: "Strings 6" },
    { name: "Ma Accent", freq: 349.23, label: "Strings 7" },
    { name: "Pa Accent", freq: 392.0, label: "Strings 8 (High)" },
  ];

  const percussionPads = [
    { name: "Dha (Open Rim)", type: "dha", noteName: "DHA" },
    { name: "Ghe (Deep Bass)", type: "ghe", noteName: "GHE" },
    { name: "Ta (Sharp Rim)", type: "ta", noteName: "TA" },
    { name: "Tin (Soft Stroke)", type: "tin", noteName: "TIN" },
    { name: "Dhol Boom (Low)", type: "dhol_low", noteName: "BOOM" },
    { name: "Dhol Tak (High)", type: "dhol_high", noteName: "TAK" },
    { name: "808 Kick Synth", type: "808_kick", noteName: "KICK" },
    { name: "808 Snare Burst", type: "808_snare", noteName: "SNARE" },
    { name: "808 Hi-Hat", type: "808_hat", noteName: "HAT" },
    { name: "Hand Clap", type: "808_clap", noteName: "CLAP" },
    { name: "Tuned Bell", type: "bell", noteName: "BELL" },
    { name: "Rim Shaker", type: "shaker", noteName: "SHAKE" },
  ];

  // Stop any active playbacks on unmount
  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, []);

  // Keyboard hotkey listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedInst) return;
      const key = e.key.toUpperCase();
      const matchKey = keyboardKeys.find(k => k.hotkey === key);
      if (matchKey && selectedInst.category !== "percussion") {
        playAndRecordNote(matchKey.keyName, getNoteFrequency(matchKey.keyName));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedInst, isRecording, recordingStartTime]);

  // Master Routing Chain with Customizable High-Fidelity Filters & Environment Spaces
  const routeWithMasterEffects = (ctx: BaseAudioContext, inputNode: AudioNode, destination: AudioNode, time: number) => {
    let currentNode: AudioNode = inputNode;

    // Apply Harmonic EQ filter booster
    if (harmonicBooster !== "none") {
      try {
        const eqFilter = ctx.createBiquadFilter();
        if (harmonicBooster === "bass") {
          eqFilter.type = "lowshelf";
          eqFilter.frequency.setValueAtTime(100, time);
          eqFilter.gain.setValueAtTime(9.5, time); // fat sub bass presence
        } else if (harmonicBooster === "sparkles") {
          eqFilter.type = "highshelf";
          eqFilter.frequency.setValueAtTime(5500, time);
          eqFilter.gain.setValueAtTime(10.0, time); // sparkling HD high end details
        } else if (harmonicBooster === "warmth") {
          eqFilter.type = "peaking";
          eqFilter.frequency.setValueAtTime(800, time);
          eqFilter.Q.setValueAtTime(1.1, time);
          eqFilter.gain.setValueAtTime(7.0, time); // cozy warm acoustic wooden box weight
        }
        currentNode.connect(eqFilter);
        currentNode = eqFilter;
      } catch (e) {}
    }

    // Apply Space Echo and Concert/Temple Reverb Delay loop!
    if (acousticSpace === "dry") {
      currentNode.connect(destination);
      return;
    }

    try {
      const delay = ctx.createDelay(1.5);
      const feedback = ctx.createGain();
      const delayFilter = ctx.createBiquadFilter();

      let delayTimeSec = 0.0;
      let feedbackGainVal = 0.0;
      let filterCutoffHz = 20000;

      if (acousticSpace === "concert") {
        delayTimeSec = 0.28;
        feedbackGainVal = 0.26;
        filterCutoffHz = 2400; // soft ceiling reflection
      } else if (acousticSpace === "temple") {
        delayTimeSec = 0.46;
        feedbackGainVal = 0.44;
        filterCutoffHz = 1200; // ancient dampening limestone walls
      } else if (acousticSpace === "space") {
        delayTimeSec = 0.68;
        feedbackGainVal = 0.54;
        filterCutoffHz = 5500; // crisp cosmic solar space feedback
      }

      if (delayTimeSec > 0.0) {
        delay.delayTime.setValueAtTime(delayTimeSec, time);
        feedback.gain.setValueAtTime(feedbackGainVal, time);
        delayFilter.type = "lowpass";
        delayFilter.frequency.setValueAtTime(filterCutoffHz, time);

        // Connect raw tone direct to destination and master output
        currentNode.connect(destination);

        // Direct wet feed bypass loop
        currentNode.connect(delayFilter);
        delayFilter.connect(delay);
        delay.connect(feedback);
        feedback.connect(delay); // feedback loop
        feedback.connect(destination);
      } else {
        currentNode.connect(destination);
      }
    } catch (err) {
      currentNode.connect(destination); // fallback safety
    }
  };

  // Synthesize and play real-time sound based on instrument configurations
  const synthesizeSound = (ctx: BaseAudioContext, frequency: number, noteType: string, destinationNodeRef: AudioNode | null = null, scheduledStartTime?: number) => {
    const time = scheduledStartTime !== undefined ? scheduledStartTime : ctx.currentTime;
    const gainNode = ctx.createGain();
    const filterNode = ctx.createBiquadFilter();

    // Use output target if provided (to enable perfect recording routing or default standard output)
    const connectorNode = destinationNodeRef || ctx.destination;
    routeWithMasterEffects(ctx, gainNode, connectorNode, time);

    const sources: (OscillatorNode | AudioBufferSourceNode)[] = [];
    const reg = <T extends OscillatorNode | AudioBufferSourceNode>(node: T): T => {
      sources.push(node);
      return node;
    };

    const instId = noteType;
    const decayScale = synthReleaseMult / 1.2;
    const activeVibRate = vibratoRate;

    const getInstrumentDecayFactor = (id: string): number => {
      switch (id) {
        case "grand_piano": return 1.8;
        case "cosmic_synth":
        case "ragas_lead_synth": return 2.0;
        case "church_bellows": return 2.8;
        case "classic_accordion": return 1.4;
        case "indian_harmonium": return 1.9;
        case "jal_tarang": return 1.0;
        case "thumb_kalimba": return 0.9;
        case "amber_marimba": return 0.75;
        case "chill_vibraphone": return 2.5;
        case "steel_handpan": return 2.4;
        case "folk_mandolin": return 0.75;
        case "celestial_harp": return 2.8;
        case "mystic_dotara": return 1.15;
        case "acoustic_guitar": return 1.75;
        case "indian_sitar": return 3.0;
        case "rudra_veena": return 2.8;
        case "santoor_pad": return 2.2;
        case "saraswati_veena":
        case "classical_sarod":
        case "indian_bulbul": return 1.6;
        case "indian_tanpura": return 3.5;
        case "baul_ektara":
        case "gopi_yantra": return 1.25;
        case "symphony_violin":
        case "indian_esraj":
        case "indian_dilruba": return 2.4;
        case "shepard_flute": return 1.25;
        case "flute":
        case "carnatic_pulangoil": return 1.75;
        case "festive_shehnai":
        case "temple_nadaswaram":
        case "snake_pungi": return 1.8;
        case "jazz_trumpet":
        case "sultry_sax": return 1.6;
        case "sacred_shankha": return 3.2;
        case "rajasthani_morchang": return 0.85;
        default: return 1.0;
      }
    };
    const maxDuration = getInstrumentDecayFactor(instId) * decayScale;

    if (instId === "grand_piano") {
      // Classic concert piano with warm resonance and initial hammer click
      const osc1 = reg(ctx.createOscillator());
      const osc2 = reg(ctx.createOscillator());
      const osc3 = reg(ctx.createOscillator());
      const hammer = reg(ctx.createOscillator());
      const hammerGain = ctx.createGain();

      osc1.type = "triangle";
      osc1.frequency.setValueAtTime(frequency, time);

      osc2.type = "sawtooth";
      osc2.frequency.setValueAtTime(frequency * 2.0 + 0.15, time); // detuned octave harmonic

      osc3.type = "sine";
      osc3.frequency.setValueAtTime(frequency * 3.0, time); // 3rd harmonic (fifth)

      // hammer strike pluck thud
      hammer.type = "sine";
      hammer.frequency.setValueAtTime(frequency * 6.0, time);
      hammerGain.gain.setValueAtTime(0.08, time);
      hammerGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

      filterNode.type = "lowpass";
      filterNode.frequency.setValueAtTime(frequency * 4.0, time);
      filterNode.frequency.exponentialRampToValueAtTime(frequency * 1.5, time + 0.9 * decayScale);
      filterNode.Q.setValueAtTime(1.0, time);

      osc1.connect(filterNode);
      osc2.connect(filterNode);
      osc3.connect(filterNode);
      hammer.connect(hammerGain);
      hammerGain.connect(filterNode);
      filterNode.connect(gainNode);

      const osc3Gain = ctx.createGain();
      osc3Gain.gain.setValueAtTime(0.06, time);
      osc3.connect(osc3Gain);
      osc3Gain.connect(gainNode);

      gainNode.gain.setValueAtTime(0.35, time);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + 1.8 * decayScale);

      osc1.start(time);
      osc2.start(time);
      osc3.start(time);
      hammer.start(time);
    } else if (instId === "cosmic_synth" || instId === "ragas_lead_synth") {
      // Hypnotic, ultra-wide detuned analog triple-oscillator lead with sweep
      const osc1 = reg(ctx.createOscillator());
      const osc2 = reg(ctx.createOscillator());
      const osc3 = reg(ctx.createOscillator());
      const lfo = reg(ctx.createOscillator());
      const lfoGain = ctx.createGain();

      osc1.type = "sawtooth";
      osc1.frequency.setValueAtTime(frequency - 2.5, time);

      osc2.type = "square";
      osc2.frequency.setValueAtTime(frequency + 2.5, time);

      osc3.type = "sawtooth";
      osc3.frequency.setValueAtTime(frequency * 0.5, time); // sub bass weight

      lfo.frequency.setValueAtTime(instId === "cosmic_synth" ? activeVibRate * 0.75 : activeVibRate * 1.25, time);
      lfoGain.gain.setValueAtTime(instId === "cosmic_synth" ? 150 : 80, time);

      filterNode.type = "lowpass";
      filterNode.frequency.setValueAtTime(250, time);
      filterNode.frequency.exponentialRampToValueAtTime(instId === "cosmic_synth" ? 3200 : 2200, time + 0.15 * decayScale);
      filterNode.frequency.exponentialRampToValueAtTime(instId === "cosmic_synth" ? 300 : 900, time + 1.5 * decayScale);
      filterNode.Q.setValueAtTime(instId === "cosmic_synth" ? 6.0 : 4.0, time);

      lfo.connect(lfoGain);
      lfoGain.connect(filterNode.frequency);

      osc1.connect(filterNode);
      osc2.connect(filterNode);
      osc3.connect(filterNode);
      filterNode.connect(gainNode);

      gainNode.gain.setValueAtTime(0.001, time);
      gainNode.gain.linearRampToValueAtTime(0.25, time + 0.05); // punchy attack
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + 2.0 * decayScale);

      lfo.start(time);
      osc1.start(time);
      osc2.start(time);
      osc3.start(time);
    } else if (instId === "indian_harmonium" || instId === "church_bellows" || instId === "classic_accordion") {
      // Bellows reeds with subtle detune phase-beating and pump pressure tremolo
      const osc1 = reg(ctx.createOscillator());
      const osc2 = reg(ctx.createOscillator());
      const osc3 = reg(ctx.createOscillator());
      const vibrator = reg(ctx.createOscillator());
      const vibGain = ctx.createGain();

      osc1.type = "sawtooth";
      osc1.frequency.setValueAtTime(frequency - 1.5, time); // slightly lowered reed

      osc2.type = "sawtooth";
      osc2.frequency.setValueAtTime(frequency + 1.5, time); // slightly raised reed

      osc3.type = "triangle";
      osc3.frequency.setValueAtTime(frequency * 0.5, time); // low oct octave anchor reed

      // organic hand pumping pressure tremolo (amplitude modulation)
      vibrator.frequency.setValueAtTime(4.8, time);
      vibGain.gain.setValueAtTime(0.07, time);
      vibrator.connect(vibGain);
      vibGain.connect(gainNode.gain);

      filterNode.type = "bandpass";
      filterNode.frequency.setValueAtTime(instId === "church_bellows" ? 600 : (instId === "classic_accordion" ? 1400 : 1000), time);
      filterNode.Q.setValueAtTime(2.0, time);

      osc1.connect(filterNode);
      osc2.connect(filterNode);
      osc3.connect(filterNode);
      filterNode.connect(gainNode);

      const decayTime = (instId === "church_bellows" ? 2.8 : (instId === "classic_accordion" ? 1.4 : 1.9)) * decayScale;
      gainNode.gain.setValueAtTime(0.001, time);
      gainNode.gain.linearRampToValueAtTime(0.24, time + 0.12 * decayScale); // slow squeeze bellows attack
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

      vibrator.start(time);
      osc1.start(time);
      osc2.start(time);
      osc3.start(time);
    } else if (instId === "amber_marimba" || instId === "thumb_kalimba" || instId === "jal_tarang") {
      // Elegant acoustic struck percussion (wood mallet, steel kalimba tines, ceramic glass bowls)
      const osc1 = reg(ctx.createOscillator());
      const osc2 = reg(ctx.createOscillator());
      const chime = reg(ctx.createOscillator());
      const chimeGain = ctx.createGain();

      osc1.type = "sine";
      osc1.frequency.setValueAtTime(frequency, time);

      osc2.type = instId === "amber_marimba" ? "triangle" : "sine";
      osc2.frequency.setValueAtTime(
        instId === "amber_marimba" ? frequency * 3.0 : (instId === "thumb_kalimba" ? frequency * 5.0 : frequency * 4.0), 
        time
      );

      // high-frequency sharp mallet / tine pluck strike transient
      chime.type = "sine";
      chime.frequency.setValueAtTime(frequency * 9.0, time);
      chimeGain.gain.setValueAtTime(0.18, time);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

      filterNode.type = "lowpass";
      filterNode.frequency.setValueAtTime(instId === "amber_marimba" ? 1800 : (instId === "thumb_kalimba" ? 2500 : 4000), time);
      filterNode.Q.setValueAtTime(1.0, time);

      osc1.connect(filterNode);
      osc2.connect(filterNode);
      chime.connect(chimeGain);
      chimeGain.connect(filterNode);
      filterNode.connect(gainNode);

      const decayTime = (instId === "jal_tarang" ? 1.0 : (instId === "thumb_kalimba" ? 0.9 : 0.75)) * decayScale;
      const volume = instId === "jal_tarang" ? 0.38 : (instId === "thumb_kalimba" ? 0.44 : 0.48);

      gainNode.gain.setValueAtTime(volume, time);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

      osc1.start(time);
      osc2.start(time);
      chime.start(time);
    } else if (instId === "chill_vibraphone") {
      // Warm, sweet vibraphone bells with beautiful motor-rotating metal tremolo
      const osc1 = reg(ctx.createOscillator());
      const osc2 = reg(ctx.createOscillator());
      const tremolo = reg(ctx.createOscillator());
      const tremoloGain = ctx.createGain();

      osc1.type = "sine";
      osc1.frequency.setValueAtTime(frequency, time);

      osc2.type = "sine";
      osc2.frequency.setValueAtTime(frequency * 2.0, time); // pure octave chime overtone

      // rotating resonator motor tremolo (sine low speed)
      tremolo.frequency.setValueAtTime(activeVibRate, time);
      tremoloGain.gain.setValueAtTime(0.12, time);
      tremolo.connect(tremoloGain);
      tremoloGain.connect(gainNode.gain);

      filterNode.type = "lowpass";
      filterNode.frequency.setValueAtTime(3000, time);

      osc1.connect(filterNode);
      osc2.connect(filterNode);
      filterNode.connect(gainNode);

      gainNode.gain.setValueAtTime(0.42, time);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + 2.5 * decayScale);

      tremolo.start(time);
      osc1.start(time);
      osc2.start(time);
    } else if (instId === "steel_handpan") {
      // Mystical hang drum layout - fundamental, fifth and octave ringings
      const osc1 = reg(ctx.createOscillator());
      const osc2 = reg(ctx.createOscillator());
      const osc3 = reg(ctx.createOscillator());
      const slap = reg(ctx.createOscillator());
      const slapGain = ctx.createGain();

      osc1.type = "sine";
      osc1.frequency.setValueAtTime(frequency, time);

      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(frequency * 1.5, time); // fifth overtone (fifth)

      osc3.type = "sine";
      osc3.frequency.setValueAtTime(frequency * 3.0, time); // high ringing overtone

      // initial hand slap transient
      slap.type = "sine";
      slap.frequency.setValueAtTime(frequency * 7.0, time);
      slapGain.gain.setValueAtTime(0.14, time);
      slapGain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

      filterNode.type = "lowpass";
      filterNode.frequency.setValueAtTime(2200, time);

      osc1.connect(filterNode);
      osc2.connect(filterNode);
      osc3.connect(filterNode);
      slap.connect(slapGain);
      slapGain.connect(filterNode);
      filterNode.connect(gainNode);

      gainNode.gain.setValueAtTime(0.45, time);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + 2.4 * decayScale);

      osc1.start(time);
      osc2.start(time);
      osc3.start(time);
      slap.start(time);
    } else if (instId === "acoustic_guitar" || instId === "celestial_harp" || instId === "folk_mandolin" || instId === "mystic_dotara") {
      // Sharp string pucks with woody resonance chamber
      const osc1 = reg(ctx.createOscillator());
      const osc2 = reg(ctx.createOscillator());
      const pluck = reg(ctx.createOscillator());
      const pluckGain = ctx.createGain();

      osc1.type = instId === "celestial_harp" ? "sine" : "triangle";
      osc1.frequency.setValueAtTime(frequency, time);

      osc2.type = instId === "acoustic_guitar" ? "sawtooth" : "sine";
      osc2.frequency.setValueAtTime(frequency * 2.0, time);

      pluck.type = "sine";
      pluck.frequency.setValueAtTime(frequency * 5.0, time);
      pluckGain.gain.setValueAtTime(instId === "celestial_harp" ? 0.05 : 0.16, time);
      pluckGain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

      const resonanceGain = ctx.createGain();
      resonanceGain.gain.setValueAtTime(instId === "celestial_harp" ? 0.08 : 0.14, time);

      filterNode.type = "lowpass";
      filterNode.frequency.setValueAtTime(instId === "celestial_harp" ? 2800 : 1500, time);

      osc1.connect(filterNode);
      osc2.connect(resonanceGain);
      resonanceGain.connect(filterNode);
      pluck.connect(pluckGain);
      pluckGain.connect(filterNode);
      filterNode.connect(gainNode);

      if (instId === "folk_mandolin") {
        // Double overlapping rapid plucking (mandolin tremolo)
        const oscOverlap = reg(ctx.createOscillator());
        oscOverlap.type = "triangle";
        oscOverlap.frequency.setValueAtTime(frequency * 1.015, time + 0.07 * decayScale);
        oscOverlap.connect(filterNode);
        oscOverlap.start(time + 0.07 * decayScale);

        const oscOverlap2 = reg(ctx.createOscillator());
        oscOverlap2.type = "sine";
        oscOverlap2.frequency.setValueAtTime(frequency * 2.0, time + 0.14 * decayScale);
        oscOverlap2.connect(filterNode);
        oscOverlap2.start(time + 0.14 * decayScale);

        gainNode.gain.setValueAtTime(0.38, time);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.75 * decayScale);
      } else {
        const decayTime = (instId === "celestial_harp" ? 2.8 : (instId === "mystic_dotara" ? 1.15 : 1.75)) * decayScale;
        gainNode.gain.setValueAtTime(0.32, time);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + decayTime);
      }

      osc1.start(time);
      osc2.start(time);
      pluck.start(time);
    } else if (instId === "indian_sitar" || instId === "saraswati_veena" || instId === "classical_sarod" || instId === "indian_bulbul" || instId === "santoor_pad" || instId === "rudra_veena") {
      // Indian Plucked Strings with high buzzing metallic bridge resonance (Jawari comb filter emulation)
      const osc1 = reg(ctx.createOscillator());
      const osc2 = reg(ctx.createOscillator());
      const buzzy = reg(ctx.createOscillator());
      const sympathetic = reg(ctx.createOscillator());

      osc1.type = "sawtooth";
      osc1.frequency.setValueAtTime(frequency, time);

      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(frequency * 2.0, time);

      buzzy.type = "sawtooth"; // creates the buzzing bridge string grit
      buzzy.frequency.setValueAtTime(frequency * 3.0 - 1.0, time);

      sympathetic.type = "sine"; // ringing resonant drone string
      sympathetic.frequency.setValueAtTime(frequency * 4.0, time);

      const buzzGain = ctx.createGain();
      buzzGain.gain.setValueAtTime(instId === "indian_sitar" ? 0.35 : (instId === "rudra_veena" ? 0.25 : 0.18), time);

      const symGain = ctx.createGain();
      symGain.gain.setValueAtTime(0.12, time);

      // high-pass or peaking formant filter to get nasal resonance peaks of wooden gourd chambers
      filterNode.type = "peaking";
      filterNode.frequency.setValueAtTime(
        instId === "indian_sitar" ? 1800 : 
        (instId === "saraswati_veena" ? 950 : 
        (instId === "classical_sarod" ? 1350 : 
        (instId === "rudra_veena" ? 650 : 
        (instId === "santoor_pad" ? 2800 : 1600)))), 
        time
      );
      filterNode.Q.setValueAtTime(instId === "indian_sitar" ? 8.0 : (instId === "rudra_veena" ? 5.5 : 6.0), time);
      filterNode.gain.setValueAtTime(instId === "indian_sitar" ? 28 : (instId === "saraswati_veena" ? 22 : 18), time);

      osc1.connect(filterNode);
      osc2.connect(filterNode);
      buzzy.connect(buzzGain);
      buzzGain.connect(filterNode);
      sympathetic.connect(symGain);
      symGain.connect(filterNode);
      filterNode.connect(gainNode);

      const decValue = (instId === "indian_sitar" ? 3.0 : (instId === "rudra_veena" ? 2.8 : (instId === "santoor_pad" ? 2.2 : 1.6))) * decayScale;
      gainNode.gain.setValueAtTime(0.35, time);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + decValue);

      osc1.start(time);
      osc2.start(time);
      buzzy.start(time);
      sympathetic.start(time);
    } else if (instId === "indian_tanpura") {
      // Hypnotic multi-string drone chord Sa-Pa-Sa-Sa
      const oSa1 = reg(ctx.createOscillator());
      const oPa = reg(ctx.createOscillator());
      const oSa2 = reg(ctx.createOscillator());
      const oSaH = reg(ctx.createOscillator());

      oSa1.type = "sawtooth"; oSa1.frequency.setValueAtTime(frequency * 0.5, time); // Low Sa
      oPa.type = "sawtooth"; oPa.frequency.setValueAtTime(frequency * 0.75, time); // Pa (Fifth chord)
      oSa2.type = "triangle"; oSa2.frequency.setValueAtTime(frequency, time);      // Mid Sa
      oSaH.type = "sawtooth"; oSaH.frequency.setValueAtTime(frequency * 1.5, time);  // High Pa octave detuned

      filterNode.type = "peaking";
      filterNode.frequency.setValueAtTime(1600, time);
      filterNode.Q.setValueAtTime(6.0, time);
      filterNode.gain.setValueAtTime(20, time);

      oSa1.connect(filterNode);
      oPa.connect(filterNode);
      oSa2.connect(filterNode);
      oSaH.connect(filterNode);
      filterNode.connect(gainNode);

      gainNode.gain.setValueAtTime(0.001, time);
      gainNode.gain.linearRampToValueAtTime(0.24, time + 0.2 * decayScale); // graceful rising sweep
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + 3.5 * decayScale);

      oSa1.start(time);
      oPa.start(time);
      oSa2.start(time);
      oSaH.start(time);
    } else if (instId === "baul_ektara" || instId === "gopi_yantra") {
      // Sliding single string pluck of Bengali mystic bauls with bamboo fork squeeze
      const osc = reg(ctx.createOscillator());
      const over = reg(ctx.createOscillator());

      osc.type = "triangle";
      over.type = "sawtooth";

      // authentic bamboo squeeze pitch-bends
      osc.frequency.setValueAtTime(frequency * 0.85, time);
      osc.frequency.linearRampToValueAtTime(frequency * 1.35, time + 0.25 * decayScale);
      osc.frequency.exponentialRampToValueAtTime(frequency, time + 0.65 * decayScale);

      over.frequency.setValueAtTime(frequency * 1.7, time);
      over.frequency.linearRampToValueAtTime(frequency * 2.7, time + 0.25 * decayScale);
      over.frequency.exponentialRampToValueAtTime(frequency * 2.0, time + 0.65 * decayScale);

      const overGain = ctx.createGain();
      overGain.gain.setValueAtTime(0.08, time);

      filterNode.type = "lowpass";
      filterNode.frequency.setValueAtTime(1200, time);

      osc.connect(filterNode);
      over.connect(overGain);
      overGain.connect(filterNode);
      filterNode.connect(gainNode);

      gainNode.gain.setValueAtTime(0.36, time);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + 1.25 * decayScale);

      osc.start(time);
      over.start(time);
    } else if (instId === "symphony_violin" || instId === "indian_esraj" || instId === "indian_dilruba") {
      // Continuous bowed orchestral string with bow traction friction noise burst
      const osc1 = reg(ctx.createOscillator());
      const osc2 = reg(ctx.createOscillator());
      const noise = reg(ctx.createBufferSource());
      const noiseFilter = ctx.createBiquadFilter();
      const noiseGain = ctx.createGain();

      osc1.type = "sawtooth";
      osc1.frequency.setValueAtTime(frequency, time);

      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(frequency * 2.0 + 0.5, time); // detuned overtone

      // Bow resin high frequency scrape friction
      noise.buffer = getNoiseBuffer(ctx);
      noise.loop = true;
      noiseFilter.type = "bandpass";
      noiseFilter.frequency.setValueAtTime(3200, time);
      noiseFilter.Q.setValueAtTime(4.0, time);
      noiseGain.gain.setValueAtTime(0.001, time);
      noiseGain.gain.linearRampToValueAtTime(0.06, time + 0.08 * decayScale);
      noiseGain.gain.linearRampToValueAtTime(0.001, time + 0.45 * decayScale);

      const vibrato = reg(ctx.createOscillator());
      const vibGain = ctx.createGain();
      vibrato.frequency.setValueAtTime(activeVibRate, time);
      vibGain.gain.setValueAtTime(instId === "indian_esraj" ? 5.5 : 7.0, time);

      vibrato.connect(vibGain);
      vibGain.connect(osc1.frequency);
      vibGain.connect(osc2.frequency);

      // formant peak filter modelling the wooden chamber
      filterNode.type = "lowpass";
      filterNode.frequency.setValueAtTime(instId === "indian_esraj" ? 1100 : 1600, time);

      osc1.connect(filterNode);
      osc2.connect(filterNode);
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(gainNode);
      filterNode.connect(gainNode);

      gainNode.gain.setValueAtTime(0.001, time);
      gainNode.gain.linearRampToValueAtTime(0.25, time + 0.18 * decayScale); // bow stroke swipe build
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + 2.4 * decayScale);

      vibrato.start(time);
      osc1.start(time);
      osc2.start(time);
      noise.start(time);
    } else if (instId.includes("flute") || instId === "carnatic_pulangoil" || instId === "shepard_flute") {
      // Wind bamboo flute with organic air friction breath and sliding finger hole scooping
      const osc = reg(ctx.createOscillator());
      const osc2 = reg(ctx.createOscillator());
      const breath = reg(ctx.createBufferSource());
      const breathGain = ctx.createGain();
      const breathFilter = ctx.createBiquadFilter();

      osc.type = "sine";
      // natural human organic pitch scoop trigger
      osc.frequency.setValueAtTime(frequency * 0.94, time);
      osc.frequency.exponentialRampToValueAtTime(frequency, time + 0.12 * decayScale);

      osc2.type = "sine";
      osc2.frequency.setValueAtTime(frequency * 2.0, time); // warm secondary octave harmonic
      const secondaryGain = ctx.createGain();
      secondaryGain.gain.setValueAtTime(instId === "shepard_flute" ? 0.03 : 0.12, time);

      // turbulence airflow breath hiss
      breath.buffer = getNoiseBuffer(ctx);
      breath.loop = true;
      breathFilter.type = "bandpass";
      breathFilter.frequency.setValueAtTime(instId === "shepard_flute" ? 3200 : 2000, time);
      breathFilter.Q.setValueAtTime(3.0, time);

      breathGain.gain.setValueAtTime(0.05, time);
      breathGain.gain.exponentialRampToValueAtTime(0.01, time + 0.5 * decayScale);

      const vibrato = reg(ctx.createOscillator());
      const vibGain = ctx.createGain();
      vibrato.frequency.setValueAtTime(activeVibRate * 0.95, time);
      vibGain.gain.setValueAtTime(4.2, time);

      vibrato.connect(vibGain);
      vibGain.connect(osc.frequency);

      osc.connect(gainNode);
      osc2.connect(secondaryGain);
      secondaryGain.connect(gainNode);

      breath.connect(breathFilter);
      breathFilter.connect(breathGain);
      breathGain.connect(gainNode);

      const decayTime = (instId === "shepard_flute" ? 1.25 : 1.75) * decayScale;
      gainNode.gain.setValueAtTime(0.01, time);
      gainNode.gain.linearRampToValueAtTime(0.28, time + 0.1 * decayScale); // rising breath velocity
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

      vibrato.start(time);
      osc.start(time);
      osc2.start(time);
      breath.start(time);
    } else if (instId === "festive_shehnai" || instId === "temple_nadaswaram" || instId === "snake_pungi") {
      // Powerful buzzing nasal double reeds (intensely celebratory)
      const osc1 = reg(ctx.createOscillator());
      const osc2 = reg(ctx.createOscillator());
      const drone = reg(ctx.createOscillator());

      osc1.type = "sawtooth";
      osc1.frequency.setValueAtTime(frequency, time);

      osc2.type = "sawtooth";
      osc2.frequency.setValueAtTime(frequency * 1.02, time); // detuned lead stack

      if (instId === "snake_pungi") {
        drone.type = "triangle";
        drone.frequency.setValueAtTime(frequency * 0.5, time); // continuous hypnotic fifth drone
      }

      filterNode.type = "peaking";
      filterNode.frequency.setValueAtTime(instId === "festive_shehnai" ? 2400 : (instId === "snake_pungi" ? 1300 : 2800), time);
      filterNode.Q.setValueAtTime(6.5, time);
      filterNode.gain.setValueAtTime(22, time);

      const vibrato = reg(ctx.createOscillator());
      const vibGain = ctx.createGain();
      vibrato.frequency.setValueAtTime(activeVibRate * 1.25, time); // fast double-reed flutter tremolo
      vibGain.gain.setValueAtTime(0.08, time);

      vibrato.connect(vibGain);
      vibGain.connect(gainNode.gain);

      osc1.connect(filterNode);
      osc2.connect(filterNode);
      if (instId === "snake_pungi") {
        const droneGain = ctx.createGain();
        droneGain.gain.setValueAtTime(0.08, time);
        drone.connect(droneGain);
        droneGain.connect(gainNode);
      }
      filterNode.connect(gainNode);

      gainNode.gain.setValueAtTime(0.001, time);
      gainNode.gain.linearRampToValueAtTime(0.25, time + 0.08 * decayScale);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + 1.8 * decayScale);

      vibrato.start(time);
      osc1.start(time);
      osc2.start(time);
      if (instId === "snake_pungi") {
        drone.start(time);
      }
    } else if (instId === "jazz_trumpet" || instId === "sultry_sax") {
      // Rich brass and woodwind horn blast with lips filter lip sweep
      const osc1 = reg(ctx.createOscillator());
      const osc2 = reg(ctx.createOscillator());
      const sub = reg(ctx.createOscillator());

      osc1.type = "sawtooth";
      osc1.frequency.setValueAtTime(frequency, time);

      osc2.type = "sawtooth";
      osc2.frequency.setValueAtTime(frequency * 2.0 + 1.0, time);

      sub.type = "triangle";
      sub.frequency.setValueAtTime(frequency * 0.5, time); // low horn support

      filterNode.type = "lowpass";
      filterNode.frequency.setValueAtTime(150, time);
      // gorgeous lip pressure filter sweeps
      filterNode.frequency.exponentialRampToValueAtTime(instId === "jazz_trumpet" ? 2400 : 1500, time + 0.14 * decayScale);
      filterNode.frequency.exponentialRampToValueAtTime(instId === "jazz_trumpet" ? 950 : 650, time + 0.7 * decayScale);
      filterNode.Q.setValueAtTime(2.5, time);

      osc1.connect(filterNode);
      osc2.connect(filterNode);
      sub.connect(filterNode);
      filterNode.connect(gainNode);

      gainNode.gain.setValueAtTime(0.001, time);
      gainNode.gain.linearRampToValueAtTime(0.26, time + 0.09 * decayScale);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + 1.6 * decayScale);

      osc1.start(time);
      osc2.start(time);
      sub.start(time);
    } else if (instId === "sacred_shankha") {
      // Spiritual giant shell conch - massive sweeping low horn blast
      const osc1 = reg(ctx.createOscillator());
      const osc2 = reg(ctx.createOscillator());
      const lowBass = reg(ctx.createOscillator());

      osc1.type = "sawtooth"; osc1.frequency.setValueAtTime(frequency * 0.5, time);
      osc2.type = "triangle"; osc2.frequency.setValueAtTime(frequency * 1.5, time);
      lowBass.type = "sine"; lowBass.frequency.setValueAtTime(frequency * 0.25, time); // floor rumbler

      filterNode.type = "lowpass";
      filterNode.frequency.setValueAtTime(100, time);
      filterNode.frequency.exponentialRampToValueAtTime(650, time + 0.5 * decayScale);
      filterNode.Q.setValueAtTime(3.0, time);

      osc1.connect(filterNode);
      osc2.connect(filterNode);
      lowBass.connect(filterNode);
      filterNode.connect(gainNode);

      gainNode.gain.setValueAtTime(0.001, time);
      gainNode.gain.linearRampToValueAtTime(0.35, time + 0.45 * decayScale); // slow divine conch build
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + 3.2 * decayScale);

      osc1.start(time);
      osc2.start(time);
      lowBass.start(time);
    } else if (instId === "rajasthani_morchang") {
      // Steel Jew's harp twing-twang with human vocal sweep wah modulation
      const osc1 = reg(ctx.createOscillator());
      const osc2 = reg(ctx.createOscillator());
      const sweeps = reg(ctx.createOscillator());
      const sweepGain = ctx.createGain();

      osc1.type = "sawtooth";
      osc1.frequency.setValueAtTime(frequency, time);

      osc2.type = "sawtooth";
      osc2.frequency.setValueAtTime(frequency * 3.0, time); // buzz overtone

      // wah frequency sweeps
      sweeps.frequency.setValueAtTime(5.2, time);
      sweepGain.gain.setValueAtTime(800, time);

      filterNode.type = "bandpass";
      filterNode.frequency.setValueAtTime(1100, time);
      filterNode.Q.setValueAtTime(4.5, time);

      sweeps.connect(sweepGain);
      sweepGain.connect(filterNode.frequency);

      osc1.connect(filterNode);
      osc2.connect(filterNode);
      filterNode.connect(gainNode);

      gainNode.gain.setValueAtTime(0.35, time);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.85 * decayScale);

      sweeps.start(time);
      osc1.start(time);
      osc2.start(time);
    } else {
      // Default / fallback
      const osc = reg(ctx.createOscillator());
      osc.type = "sine";
      osc.frequency.setValueAtTime(frequency, time);
      osc.connect(gainNode);
      gainNode.gain.setValueAtTime(0.2, time);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.6);
      osc.start(time);
    }

    // Auto-stop all oscillators and source nodes to prevent Web Audio thread resource leaks and cracking
    const stopTime = time + maxDuration + 0.5;
    sources.forEach(src => {
      try {
        src.stop(stopTime);
      } catch (e) {}
    });

    return () => {
      try {
        gainNode.gain.cancelScheduledValues(ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);
      } catch (e) {}
      setTimeout(() => {
        sources.forEach(src => {
          try { src.stop(); } catch (e) {}
        });
      }, 60);
    };
  };

  // Play special percussion synthesizer sounds with high-accuracy matching real acoustic properties
  const synthesizePercussion = (
    ctx: BaseAudioContext,
    drumType: string,
    destinationNodeRef: AudioNode | null = null,
    scheduledStartTime?: number,
    instrumentId?: string
  ) => {
    const time = scheduledStartTime !== undefined ? scheduledStartTime : ctx.currentTime;
    const gainNode = ctx.createGain();
    const filterNode = ctx.createBiquadFilter();

    const dest = destinationNodeRef || ctx.destination;
    routeWithMasterEffects(ctx, gainNode, dest, time);

    const sources: (OscillatorNode | AudioBufferSourceNode)[] = [];
    const reg = <T extends OscillatorNode | AudioBufferSourceNode>(node: T): T => {
      sources.push(node);
      return node;
    };

    const instId = instrumentId || selectedInst?.id || "classical_tabla";

    const getPercussionDecay = (id: string): number => {
      switch (id) {
        case "tamil_murasu": return 1.4;
        case "shiva_udukkai": return 0.38;
        case "indian_ghungroo": return 0.5;
        case "indian_manjira": return 2.5;
        case "indian_ghatam": return 0.88;
        case "heavy_dholak": return 0.55;
        case "punjabi_dhol": return 0.55;
        case "rajasthani_khartal": return 0.75;
        case "bengali_khol": return 0.16;
        case "south_mridangam": return 0.72;
        case "tribal_madal": return 0.18;
        case "classical_tabla": return 0.35;
        default: return 1.0;
      }
    };
    const maxDuration = getPercussionDecay(instId);

    // 1. TAMIL MURASU (War kettle drum - heavy booming roaring)
    if (instId === "tamil_murasu") {
      const oscLow = reg(ctx.createOscillator());
      const oscMid = reg(ctx.createOscillator());
      const thudNoise = reg(ctx.createBufferSource());
      const noiseFilter = ctx.createBiquadFilter();
      const noiseGain = ctx.createGain();

      const bassFreq = (drumType === "ghe" || drumType === "dhol_low") ? 62 : 115;
      
      oscLow.type = "sine";
      oscLow.frequency.setValueAtTime(bassFreq * 1.5, time);
      oscLow.frequency.exponentialRampToValueAtTime(bassFreq, time + 0.16);

      oscMid.type = "triangle";
      oscMid.frequency.setValueAtTime(bassFreq * 2.2, time);
      oscMid.frequency.exponentialRampToValueAtTime(bassFreq * 1.1, time + 0.22);

      // Low drum leather body air rumble
      thudNoise.buffer = getNoiseBuffer(ctx);
      noiseFilter.type = "lowpass";
      noiseFilter.frequency.setValueAtTime(140, time);
      noiseFilter.Q.setValueAtTime(3.0, time);
      noiseGain.gain.setValueAtTime(0.18, time);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

      filterNode.type = "lowpass";
      filterNode.frequency.setValueAtTime(280, time);

      oscLow.connect(filterNode);
      oscMid.connect(filterNode);
      thudNoise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(gainNode);
      filterNode.connect(gainNode);

      gainNode.gain.setValueAtTime(0.68, time); // highly immersive, powerful war kettle drum
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + 1.4);

      oscLow.start(time);
      oscMid.start(time);
      thudNoise.start(time);

    // 2. SHIVA UDUKKAI (Hourglass squeezable fast-bending drum with ringy tines)
    } else if (instId === "shiva_udukkai") {
      const fund = reg(ctx.createOscillator());
      const chime = reg(ctx.createOscillator());
      const rattle = reg(ctx.createBufferSource());
      const rattleFilter = ctx.createBiquadFilter();
      const rattleGain = ctx.createGain();

      fund.type = "triangle";
      chime.type = "sine";

      const uFreq = (drumType === "ghe" || drumType === "dhol_low") ? 170 : 310;
      
      // squeezable pitch squeeze bends
      fund.frequency.setValueAtTime(uFreq * 0.75, time);
      fund.frequency.exponentialRampToValueAtTime(uFreq * 1.6, time + 0.08);
      fund.frequency.exponentialRampToValueAtTime(uFreq * 0.95, time + 0.22);

      chime.frequency.setValueAtTime(uFreq * 2.8, time);
      chime.frequency.exponentialRampToValueAtTime(uFreq * 3.4, time + 0.08);
      chime.frequency.exponentialRampToValueAtTime(uFreq * 2.1, time + 0.22);

      // organic brass side-rattlers
      rattle.buffer = getNoiseBuffer(ctx);
      rattleFilter.type = "bandpass";
      rattleFilter.frequency.setValueAtTime(3500, time);
      rattleFilter.Q.setValueAtTime(2.0, time);
      rattleGain.gain.setValueAtTime(0.06, time);
      rattleGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

      fund.connect(gainNode);
      chime.connect(gainNode);
      rattle.connect(rattleFilter);
      rattleFilter.connect(rattleGain);
      rattleGain.connect(gainNode);

      gainNode.gain.setValueAtTime(0.48, time);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.38);

      fund.start(time);
      chime.start(time);
      rattle.start(time);

    // 3. ANKLE GHUNGROO (Ringing bunch of ankle bronze bells with high-passed shimmer)
    } else if (instId === "indian_ghungroo") {
      // 4 discrete metal bell resonances reflecting a cluster of ankle bells
      const b1 = reg(ctx.createOscillator());
      const b2 = reg(ctx.createOscillator());
      const b3 = reg(ctx.createOscillator());
      const b4 = reg(ctx.createOscillator());
      const shakeNoise = reg(ctx.createBufferSource());
      const shakeFilter = ctx.createBiquadFilter();
      const shakeGain = ctx.createGain();

      b1.type = "sine"; b1.frequency.setValueAtTime(3250, time);
      b2.type = "sine"; b2.frequency.setValueAtTime(4580, time);
      b3.type = "sine"; b3.frequency.setValueAtTime(6120, time);
      b4.type = "sine"; b4.frequency.setValueAtTime(8200, time);

      // Shaking leather cord + micro-silver ball clappers
      shakeNoise.buffer = getNoiseBuffer(ctx);
      shakeFilter.type = "highpass";
      shakeFilter.frequency.setValueAtTime(7500, time);
      shakeGain.gain.setValueAtTime(0.24, time);
      shakeGain.gain.exponentialRampToValueAtTime(0.002, time + 0.24);

      const brassGain = ctx.createGain();
      brassGain.gain.setValueAtTime(0.16, time);

      b1.connect(brassGain);
      b2.connect(brassGain);
      b3.connect(brassGain);
      b4.connect(brassGain);

      brassGain.connect(gainNode);
      shakeNoise.connect(shakeFilter);
      shakeFilter.connect(shakeGain);
      shakeGain.connect(gainNode);

      gainNode.gain.setValueAtTime(0.48, time);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.5);

      b1.start(time);
      b2.start(time);
      b3.start(time);
      b4.start(time);
      shakeNoise.start(time);

    // 4. MANJIRA CYMBALS (High-frequency, long-decay prayer metallic bell chimes)
    } else if (instId === "indian_manjira") {
      const fundamental = reg(ctx.createOscillator());
      const secondHarmonic = reg(ctx.createOscillator());
      const overtoneNode = reg(ctx.createOscillator());
      const sustainRinger = reg(ctx.createOscillator());

      // Authentic bell overtones ratios with phase-beating
      fundamental.type = "sine"; fundamental.frequency.setValueAtTime(2650, time);
      secondHarmonic.type = "sine"; secondHarmonic.frequency.setValueAtTime(4290, time); // root * 1.62
      overtoneNode.type = "sine"; overtoneNode.frequency.setValueAtTime(6300, time);  // root * 2.38
      sustainRinger.type = "sine"; sustainRinger.frequency.setValueAtTime(2652, time); // detuned ringer beat

      const mixGain = ctx.createGain();
      mixGain.gain.setValueAtTime(0.18, time);

      fundamental.connect(mixGain);
      secondHarmonic.connect(mixGain);
      overtoneNode.connect(mixGain);
      sustainRinger.connect(mixGain);
      mixGain.connect(gainNode);

      gainNode.gain.setValueAtTime(0.46, time);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + 2.5); // long divine sustain cymbal ring

      fundamental.start(time);
      secondHarmonic.start(time);
      overtoneNode.start(time);
      sustainRinger.start(time);

    // 5. CLAY GHATAM (Baked clay pot earthenware hand clicks and hollow belly boom)
    } else if (instId === "indian_ghatam") {
      const bodyThud = reg(ctx.createOscillator());
      const handSlap = reg(ctx.createOscillator());
      const mouthUudu = reg(ctx.createOscillator());

      const ghatFreq = (drumType === "ghe" || drumType === "dhol_low") ? 140 : 540;

      // Outer belly clay resonance
      bodyThud.type = "triangle";
      bodyThud.frequency.setValueAtTime(ghatFreq, time);

      // Hyper-dry clay skin knock slap
      handSlap.type = "sine";
      handSlap.frequency.setValueAtTime(ghatFreq * 3.8, time);
      const slapGain = ctx.createGain();
      slapGain.gain.setValueAtTime(0.18, time);
      slapGain.gain.exponentialRampToValueAtTime(0.001, time + 0.02);

      // Hollow clay mouth pot air-resonance ("uundu" bass blow)
      mouthUudu.type = "sine";
      mouthUudu.frequency.setValueAtTime(75, time);
      const uunduGain = ctx.createGain();
      uunduGain.gain.setValueAtTime(drumType === "ghe" ? 0.45 : 0.08, time);
      uunduGain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);

      filterNode.type = "bandpass";
      filterNode.frequency.setValueAtTime(950, time);
      filterNode.Q.setValueAtTime(3.5, time);

      bodyThud.connect(filterNode);
      handSlap.connect(slapGain);
      slapGain.connect(filterNode);
      mouthUudu.connect(uunduGain);
      uunduGain.connect(gainNode);
      filterNode.connect(gainNode);

      gainNode.gain.setValueAtTime(0.45, time);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.15); // hyper dry earthenware hit

      bodyThud.start(time);
      handSlap.start(time);
      mouthUudu.start(time);

    // 6. DRUM MACHINE (Futuristic synthetic 808 trap pads)
    } else if (instId === "drum_machine") {
      if (drumType === "808_kick" || drumType === "ghe" || drumType === "dhol_low") {
        // Ultimate trap 808 chest-pound low boom
        const subFund = reg(ctx.createOscillator());
        const subPunch = reg(ctx.createOscillator());

        subFund.type = "sine";
        subFund.frequency.setValueAtTime(56, time);
        subFund.frequency.exponentialRampToValueAtTime(26, time + 0.28);

        subPunch.type = "triangle";
        subPunch.frequency.setValueAtTime(140, time);
        subPunch.frequency.exponentialRampToValueAtTime(45, time + 0.05);

        const punchGain = ctx.createGain();
        punchGain.gain.setValueAtTime(0.35, time);
        punchGain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

        subFund.connect(gainNode);
        subPunch.connect(punchGain);
        punchGain.connect(gainNode);

        gainNode.gain.setValueAtTime(0.64, time);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.88);

        subFund.start(time);
        subPunch.start(time);
      } else if (drumType === "808_snare" || drumType === "ta" || drumType === "dhol_high") {
        // Snappy saturated 808 snare drum
        const coreTone = reg(ctx.createOscillator());
        const snapNoise = reg(ctx.createBufferSource());
        const noiseFilter = ctx.createBiquadFilter();

        coreTone.type = "triangle";
        coreTone.frequency.setValueAtTime(175, time);
        coreTone.frequency.exponentialRampToValueAtTime(120, time + 0.08);

        snapNoise.buffer = getNoiseBuffer(ctx);
        noiseFilter.type = "bandpass";
        noiseFilter.frequency.setValueAtTime(1800, time);
        noiseFilter.Q.setValueAtTime(1.5, time);

        coreTone.connect(gainNode);
        snapNoise.connect(noiseFilter);
        noiseFilter.connect(gainNode);

        gainNode.gain.setValueAtTime(0.46, time);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.42);

        coreTone.start(time);
        snapNoise.start(time);
      } else if (drumType === "808_clap" || drumType === "clap") {
        // Multi-staggered clap trigger engine
        const noise = reg(ctx.createBufferSource());
        const noiseFilter = ctx.createBiquadFilter();

        noise.buffer = getNoiseBuffer(ctx);
        noiseFilter.type = "bandpass";
        noiseFilter.frequency.setValueAtTime(1050, time);
        noiseFilter.Q.setValueAtTime(1.0, time);

        noise.connect(noiseFilter);
        noiseFilter.connect(gainNode);

        gainNode.gain.setValueAtTime(0.001, time);
        gainNode.gain.linearRampToValueAtTime(0.36, time + 0.012);
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.055);
        gainNode.gain.linearRampToValueAtTime(0.32, time + 0.075);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.32);

        noise.start(time);
      } else {
        // Crisp high hat / shaker
        const hatNoise = reg(ctx.createBufferSource());
        const filterHat = ctx.createBiquadFilter();

        hatNoise.buffer = getNoiseBuffer(ctx);
        filterHat.type = "highpass";
        filterHat.frequency.setValueAtTime(9800, time);

        hatNoise.connect(filterHat);
        filterHat.connect(gainNode);

        gainNode.gain.setValueAtTime(0.24, time);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

        hatNoise.start(time);
      }

    // 7. CLASSICAL TABLA (Slide Bayan, Metallic Dayan harmonic resonance)
    } else if (instId === "classical_tabla") {
      if (drumType === "ghe") {
        // Divine sliding wet bass swoop (heel slide)
        const oscLow = reg(ctx.createOscillator());
        const oscSlide = reg(ctx.createOscillator());
        const boomRes = reg(ctx.createOscillator());

        oscLow.type = "sine";
        oscLow.frequency.setValueAtTime(65, time);
        oscLow.frequency.exponentialRampToValueAtTime(125, time + 0.25);

        oscSlide.type = "sine";
        oscSlide.frequency.setValueAtTime(65 * 2.0, time);
        oscSlide.frequency.exponentialRampToValueAtTime(125 * 2.1, time + 0.25);

        boomRes.type = "triangle";
        boomRes.frequency.setValueAtTime(65 * 0.5, time); // low sub belly hum

        const slideGain = ctx.createGain();
        slideGain.gain.setValueAtTime(0.16, time);

        oscSlide.connect(slideGain);
        slideGain.connect(gainNode);
        oscLow.connect(gainNode);
        boomRes.connect(gainNode);

        gainNode.gain.setValueAtTime(0.55, time);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.55);

        oscLow.start(time);
        oscSlide.start(time);
        boomRes.start(time);
      } else if (drumType === "dha") {
        // Combined bass bayan swoop + high ringing tuned dayan ringer
        const bayanBase = reg(ctx.createOscillator());
        const dayanTuned = reg(ctx.createOscillator());
        const dayanSecond = reg(ctx.createOscillator());

        bayanBase.type = "sine";
        bayanBase.frequency.setValueAtTime(70, time);
        bayanBase.frequency.exponentialRampToValueAtTime(110, time + 0.2);

        dayanTuned.type = "sine";
        dayanTuned.frequency.setValueAtTime(293.66, time); // tuned ring dayaan (Re 293Hz)

        dayanSecond.type = "sine";
        dayanSecond.frequency.setValueAtTime(293.66 * 2.0, time); // pure harmonic octave ring
        const secGain = ctx.createGain();
        secGain.gain.setValueAtTime(0.12, time);

        filterNode.type = "peaking";
        filterNode.frequency.setValueAtTime(1250, time);
        filterNode.Q.setValueAtTime(5.5, time);
        filterNode.gain.setValueAtTime(16, time);

        bayanBase.connect(gainNode);
        dayanTuned.connect(filterNode);
        dayanSecond.connect(secGain);
        secGain.connect(filterNode);
        filterNode.connect(gainNode);

        gainNode.gain.setValueAtTime(0.48, time);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.55);

        bayanBase.start(time);
        dayanTuned.start(time);
        dayanSecond.start(time);
      } else if (drumType === "tin") {
        // Ringing open treble bell drone (classic metallic hum)
        const coreRing = reg(ctx.createOscillator());
        const secondaryRing = reg(ctx.createOscillator());

        coreRing.type = "sine";
        coreRing.frequency.setValueAtTime(329.63, time); // tuned open treble ring (Mi 329Hz)

        secondaryRing.type = "sine";
        secondaryRing.frequency.setValueAtTime(329.63 * 3.0, time); // 3rd odd harmonic clang

        const extraGain = ctx.createGain();
        extraGain.gain.setValueAtTime(0.08, time);

        filterNode.type = "peaking";
        filterNode.frequency.setValueAtTime(1318, time);
        filterNode.Q.setValueAtTime(6.5, time);
        filterNode.gain.setValueAtTime(20, time);

        coreRing.connect(filterNode);
        secondaryRing.connect(extraGain);
        extraGain.connect(filterNode);
        filterNode.connect(gainNode);

        gainNode.gain.setValueAtTime(0.42, time);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.75);

        coreRing.start(time);
        secondaryRing.start(time);
      } else {
        // ta strike / rim daylight crisp finger tap
        const sharpTap = reg(ctx.createOscillator());
        const rimClick = reg(ctx.createOscillator());

        sharpTap.type = "triangle";
        sharpTap.frequency.setValueAtTime(460, time);

        rimClick.type = "sine";
        rimClick.frequency.setValueAtTime(920, time);

        const ClickGain = ctx.createGain();
        ClickGain.gain.setValueAtTime(0.12, time);

        sharpTap.connect(gainNode);
        rimClick.connect(ClickGain);
        ClickGain.connect(gainNode);

        gainNode.gain.setValueAtTime(0.42, time);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.16);

        sharpTap.start(time);
        rimClick.start(time);
      }

    // 8. PUNJABI DHOL / DHOLAK / TEMPLE PAKHAWAJ / BENGAL KHOL (Skin hand drums)
    } else {
      const isDhol = instId.includes("dhol");
      const isMridangam = instId.includes("mridangam") || instId.includes("maddale");
      const isKhol = instId.includes("khol");

      if (drumType === "ghe" || drumType === "dhol_low" || drumType === "808_kick") {
        // Deep warm skin low bass resonance
        const bassOsc = reg(ctx.createOscillator());
        const bassHarmonic = reg(ctx.createOscillator());

        const dFreq = isDhol ? 80 : (isMridangam ? 90 : (isKhol ? 100 : 70));
        
        bassOsc.type = "sine";
        bassOsc.frequency.setValueAtTime(dFreq * 1.6, time);
        bassOsc.frequency.exponentialRampToValueAtTime(dFreq, time + 0.14);

        bassHarmonic.type = "triangle";
        bassHarmonic.frequency.setValueAtTime(dFreq * 3.0, time);
        const harmGain = ctx.createGain();
        harmGain.gain.setValueAtTime(0.08, time);

        bassOsc.connect(gainNode);
        bassHarmonic.connect(harmGain);
        harmGain.connect(gainNode);

        const lVol = isDhol ? 0.62 : 0.46;
        gainNode.gain.setValueAtTime(lVol, time);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + (isDhol ? 0.72 : 0.48));

        bassOsc.start(time);
        bassHarmonic.start(time);
      } else if (drumType === "ta" || drumType === "dhol_high" || drumType === "808_snare") {
        // Sizzling wood-gourd hand acoustic pluck slap
        const slapOsc = reg(ctx.createOscillator());
        const skinNoisy = reg(ctx.createBufferSource());
        const noiseFilter = ctx.createBiquadFilter();
        const noiseGain = ctx.createGain();

        const dFreq = isKhol ? 560 : (isMridangam ? 240 : 390);
        slapOsc.type = "triangle";
        slapOsc.frequency.setValueAtTime(dFreq, time);

        skinNoisy.buffer = getNoiseBuffer(ctx);
        noiseFilter.type = "bandpass";
        noiseFilter.frequency.setValueAtTime(dFreq * 4.0, time);
        noiseGain.gain.setValueAtTime(0.12, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

        filterNode.type = "lowpass";
        filterNode.frequency.setValueAtTime(dFreq * 3.2, time);

        slapOsc.connect(filterNode);
        skinNoisy.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(gainNode);
        filterNode.connect(gainNode);

        gainNode.gain.setValueAtTime(0.44, time);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

        slapOsc.start(time);
        skinNoisy.start(time);
      } else {
        // Singing open face treble hum strike
        const humOsc = reg(ctx.createOscillator());
        const resonantPeak = reg(ctx.createOscillator());

        const dFreq = isMridangam ? 180 : 255;
        humOsc.type = "sine";
        humOsc.frequency.setValueAtTime(dFreq, time);

        resonantPeak.type = "sine";
        resonantPeak.frequency.setValueAtTime(dFreq * 2.0, time);
        const pGain = ctx.createGain();
        pGain.gain.setValueAtTime(0.06, time);

        humOsc.connect(gainNode);
        resonantPeak.connect(pGain);
        pGain.connect(gainNode);

        gainNode.gain.setValueAtTime(0.36, time);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

        humOsc.start(time);
        resonantPeak.start(time);
      }
    }

    // Auto-stop all oscillators and source nodes to prevent Web Audio thread resource leaks and cracking
    const stopTime = time + maxDuration + 0.5;
    sources.forEach(src => {
      try {
        src.stop(stopTime);
      } catch (e) {}
    });

    return () => {
      try {
        gainNode.gain.cancelScheduledValues(ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);
      } catch (e) {}
      setTimeout(() => {
        sources.forEach(src => {
          try { src.stop(); } catch (e) {}
        });
      }, 50);
    };
  };

  // Play a note live and write to recorded notes array if recording is active
  const playAndRecordNote = (noteName: string, frequencyOrPercType: number | string) => {
    if (!selectedInst) return;

    // Trigger physical audio synthesizer
    let stopFn: () => void = () => {};
    const feedbackNode = analyserRef.current || null;
    if (selectedInst.category === "percussion" && typeof frequencyOrPercType === "string") {
      stopFn = synthesizePercussion(audioContext, frequencyOrPercType, feedbackNode, undefined, selectedInst.id);
    } else if (typeof frequencyOrPercType === "number") {
      stopFn = synthesizeSound(audioContext, frequencyOrPercType, selectedInst.id, feedbackNode);
    }

    // Capture record trigger and reference times
    if (isRecording && !isRecordingPaused) {
      const now = audioContext.currentTime;
      const startTimeStamp = recordingStartTime || now;
      const timeOffset = Math.max(0.0, now - startTimeStamp - totalPausedDurationRef.current);

      const note: RecordedNote = {
        pitch: typeof frequencyOrPercType === "number" ? frequencyOrPercType : 0,
        name: noteName,
        time: timeOffset,
        duration: 0.8, // Standard safe trigger duration
        instrumentId: selectedInst.id,
      };

      setRecordedNotes(prev => [...prev, note]);
    }
  };

  // Toggle master recording of the virtual instrument
  const toggleRecording = () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      setIsRecordingPaused(false);
    } else {
      // Start recording
      stopPlayback();
      setRecordedNotes([]);
      setRecordingStartTime(audioContext.currentTime);
      setIsRecording(true);
      setIsRecordingPaused(false);
      totalPausedDurationRef.current = 0;
      recordingPauseTimeRef.current = null;
    }
  };

  // Pause or Resume live recording
  const pauseRecording = () => {
    if (!isRecording) return;
    if (isRecordingPaused) {
      // Resume recording
      if (recordingPauseTimeRef.current !== null) {
        const pausedTime = audioContext.currentTime - recordingPauseTimeRef.current;
        totalPausedDurationRef.current += pausedTime;
      }
      setIsRecordingPaused(false);
      recordingPauseTimeRef.current = null;
    } else {
      // Pause recording
      recordingPauseTimeRef.current = audioContext.currentTime;
      setIsRecordingPaused(true);
    }
  };

  // Restart recorded sequence entirely
  const restartRecording = () => {
    stopPlayback();
    setRecordedNotes([]);
    setRecordingStartTime(audioContext.currentTime);
    setIsRecording(true);
    setIsRecordingPaused(false);
    totalPausedDurationRef.current = 0;
    recordingPauseTimeRef.current = null;
  };

  // Start program playback of notes played by user
  const startPlayback = (resumeFromTime?: number) => {
    if (recordedNotes.length === 0) return;
    stopPlayback();
    setIsPlayingBack(true);
    setIsPlaybackPaused(false);
    setPlayBackProgress(0);

    const now = audioContext.currentTime;
    const startTimeOffset = resumeFromTime || 0;
    playbackTimeStartRef.current = Date.now() - (startTimeOffset * 1000);
    pausedTimeRef.current = startTimeOffset;
    
    // Playback loop duration
    const maxDuration = Math.max(...recordedNotes.map(n => n.time + n.duration)) || 4.0;
    const remainingTime = maxDuration - startTimeOffset;
    
    // Schedule all notes trigger timers
    recordedNotes.forEach(note => {
      if (note.time >= startTimeOffset) {
        const delay = (note.time - startTimeOffset) * 1000;
        const timer = setTimeout(() => {
          let stopFn: () => void = () => {};
          
          if (selectedInst) {
            const feedNode = analyserRef.current || null;
            if (selectedInst.category === "percussion") {
              stopFn = synthesizePercussion(audioContext, note.name.toLowerCase(), feedNode, undefined, note.instrumentId);
            } else {
              stopFn = synthesizeSound(audioContext, note.pitch, note.instrumentId, feedNode);
            }
            activeOscillatorsRef.current.push(stopFn);
          }
        }, delay);

        playbackTimersRef.current.push(timer);
      }
    });

    // Schedule stop event at end
    const finalTimer = setTimeout(() => {
      setIsPlayingBack(false);
      setIsPlaybackPaused(false);
      pausedTimeRef.current = 0;
    }, remainingTime * 1000);
    playbackTimersRef.current.push(finalTimer);
  };

  // Pause playback of recorded sequence
  const pausePlayback = () => {
    if (!isPlayingBack || isPlaybackPaused) return;

    playbackTimersRef.current.forEach(clearTimeout);
    playbackTimersRef.current = [];
    activeOscillatorsRef.current.forEach(stop => stop());
    activeOscillatorsRef.current = [];

    const elapsed = (Date.now() - playbackTimeStartRef.current) / 1000;
    pausedTimeRef.current = elapsed;

    setIsPlayingBack(false);
    setIsPlaybackPaused(true);
  };

  // Stop current active simulated playbacks
  const stopPlayback = () => {
    playbackTimersRef.current.forEach(clearTimeout);
    playbackTimersRef.current = [];
    activeOscillatorsRef.current.forEach(stop => stop());
    activeOscillatorsRef.current = [];
    setIsPlayingBack(false);
    setIsPlaybackPaused(false);
    pausedTimeRef.current = 0;
  };

  // Add recorded audio track to primary project view
  const addRecordedProjectTrack = async () => {
    if (recordedNotes.length === 0) {
      alert("Please play or record some notes first before adding!");
      return;
    }

    stopPlayback();
    const lastNote = recordedNotes[recordedNotes.length - 1];
    // Keep exact length with high-fidelity limit of 180 seconds to allow long complete plays
    const sequenceDuration = Math.min(180.0, Math.max(2.0, (lastNote?.time || 0) + (lastNote?.duration || 0.8)));

    // Generate programmed high fidelity stereophonic sample buffer via OfflineAudioContext!
    const sampleRate = 44100;
    const offlineCtx = new OfflineAudioContext(2, sampleRate * sequenceDuration, sampleRate);

    // Schedule all synthesizer units onto OfflineAudioContext with exact triggerTime
    recordedNotes.forEach(note => {
      const triggerTime = note.time;
      const frequency = note.pitch;
      const instId = note.instrumentId;

      if (selectedInst?.category === "percussion") {
        synthesizePercussion(offlineCtx, note.name.toLowerCase(), null, triggerTime, note.instrumentId);
      } else {
        synthesizeSound(offlineCtx, frequency, instId, null, triggerTime);
      }
    });

    try {
      const renderedBuffer = await offlineCtx.startRendering();

      // Package synthesized content inside a portable AudioClip format
      const newClip: AudioClip = {
        id: `custom-inst-recording-${Date.now()}`,
        name: `${selectedInst?.name || "Instrument"} Solo Rec`,
        trackId: "instrument",
        buffer: renderedBuffer,
        duration: sequenceDuration,
        startOffset: 0.0, // starts straight at the track's default timeline
        startInCut: 0.0,
        durationInCut: sequenceDuration,
        speed: 1.0,
        equalizer: {
          isEnabled: true,
          hz60: 0,
          hz230: 0,
          hz910: 0,
          hz3600: 0,
          hz14000: 0,
          isBassBoost: false,
          isSurroundSound: false,
        },
        dynamicAudio: {
          lowFreq: 1.0,
          medFreq: 1.0,
          highFreq: 1.0,
        },
      };

      onAddRecordedClip(newClip);
      onClose();
    } catch (e) {
      console.error("Failed to render offline synthesizer buffer", e);
      alert("Sound rendering failed. Please try playing a shorter melody loop.");
    }
  };

  return (
    <div id="custom-instruments-slide-overlay" className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-50 overflow-y-auto p-4 flex flex-col gap-4 animate-fade-in">
      
      {/* Top action header bar */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-3">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <Radio className="text-blue-500 animate-pulse" size={18} />
            <span className="text-sm font-black tracking-widest text-slate-150 uppercase">VIRTUAL INSTRUMENT RACK</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5">Program, record and convert notes instantly into high-fidelity layers</span>
        </div>
        
        <button 
          onClick={onClose} 
          className="p-1 px-3 border border-slate-800 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-all text-xs flex items-center gap-1 font-bold"
        >
          <X size={14} />
          <span>Exit Rack</span>
        </button>
      </div>

      {/* Main split display: Instrument selector left, advance workspace right */}
      {!selectedInst ? (
        <div className="flex flex-col gap-4 max-w-5xl mx-auto w-full pt-4">
          <div className="bg-blue-950/20 border border-blue-900/30 rounded-2xl p-4 flex gap-3 text-xs text-blue-300">
            <Info size={18} className="shrink-0 text-blue-400 mt-0.5" />
            <div className="flex flex-col gap-1">
              <span className="font-bold">Virtual Studio Integration Mode Active</span>
              <span>Tap on any of the 52 instruments to open its live interactive playing deck. Mobile views will shift automatically to landscape layout simulation with customized keyboard scales, string frets or pad grids mapped perfectly for fingers and keys!</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 py-2 items-center">
            <span className="text-xs font-bold tracking-widest text-slate-550 uppercase">CHOOSE AN INSTRUMENT TO PLAY</span>
            
            {/* Elegant categories list tabs tailored for mobile fast selection */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full max-w-xl pb-2 scrollbar-none justify-start sm:justify-center px-2">
              {[
                { id: "all", label: "All", emoji: "✨" },
                { id: "keyboard", label: "Keys", emoji: "🎹" },
                { id: "strings", label: "Strings", emoji: "🪕" },
                { id: "percussion", label: "Drums", emoji: "🥁" },
                { id: "wind", label: "Wind", emoji: "🌬️" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-full whitespace-nowrap transition-all duration-150 cursor-pointer border ${
                    categoryFilter === cat.id
                      ? "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-950/40 scale-105"
                      : "bg-slate-900 text-slate-400 border-slate-850 hover:bg-slate-850 hover:text-slate-350"
                  }`}
                >
                  <span className="mr-1">{cat.emoji}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div id="instruments-grid-categories" className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 pt-1">
            {INSTRUMENTS_LIST.filter(inst => categoryFilter === "all" || inst.category === categoryFilter).map((inst, index) => (
              <button
                key={inst.id}
                id={`inst-circle-button-${inst.id}`}
                onClick={() => {
                  setSelectedInst(inst);
                  setRecordedNotes([]);
                  setIsRecording(false);
                }}
                className="group flex flex-col items-center gap-3 bg-slate-900 hover:bg-slate-850 border border-slate-800/80 hover:border-slate-700 p-4 rounded-3xl transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-950 active:scale-95 text-center cursor-pointer"
              >
                {/* Colored circle emoji holder */}
                <div className={`w-14 h-14 rounded-full bg-gradient-to-tr ${inst.color} flex items-center justify-center text-2xl shadow-md transform group-hover:scale-110 transition-transform`}>
                  {inst.emoji}
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] font-bold text-slate-200 group-hover:text-blue-450 transition-colors">{inst.name}</span>
                  <span className="text-[8px] font-mono tracking-wider text-slate-500 uppercase">{inst.category}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Advance Landscape Mode Instrument play area */
        <div id="advance-instrument-canvas" className="flex flex-col gap-4 max-w-6xl mx-auto w-full">
          
          {/* Deck top-bar header */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900 border border-slate-850 p-3 rounded-2xl">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  stopPlayback();
                  setSelectedInst(null);
                  setIsRecording(false);
                }}
                className="text-xs font-bold text-blue-400 bg-blue-950/40 border border-blue-900/30 px-3 py-1.5 rounded-lg hover:bg-blue-950/80"
              >
                ← Back to Deck
              </button>
              <div className="flex items-center gap-2">
                <span className="text-xl">{selectedInst.emoji}</span>
                <div className="flex flex-col">
                  <span className="text-xs font-black tracking-wide text-slate-100">{selectedInst.name}</span>
                  <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">{selectedInst.category} Mode</span>
                </div>
              </div>
            </div>

            {/* Live studio tape deck recording controls */}
            <div className="flex items-center gap-2">
              {/* Record Button */}
              <button
                onClick={toggleRecording}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all ${
                  isRecording 
                    ? "bg-red-500 border-red-600 text-white animate-pulse" 
                    : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-705"
                }`}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-red-650 shrink-0"></div>
                <span>{isRecording ? "Stop Rec" : "Record"}</span>
              </button>

              {/* Pause Recording Button */}
              {isRecording && (
                <button
                  onClick={pauseRecording}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all ${
                    isRecordingPaused
                      ? "bg-amber-600 border-amber-500 text-white animate-pulse shadow shadow-amber-900/50"
                      : "bg-slate-800 border-slate-700 text-amber-550 hover:bg-slate-750"
                  }`}
                >
                  {isRecordingPaused ? <Play size={12} /> : <Pause size={12} />}
                  <span>{isRecordingPaused ? "Resume Rec" : "Pause Rec"}</span>
                </button>
              )}

              {/* Play Recorded Sequence Button */}
              <button
                disabled={recordedNotes.length === 0}
                onClick={() => {
                  if (isPlayingBack) {
                    stopPlayback();
                  } else {
                    startPlayback(isPlaybackPaused ? pausedTimeRef.current : 0);
                  }
                }}
                className={`p-1.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 border ${
                  recordedNotes.length === 0 
                    ? "opacity-40 cursor-not-allowed bg-slate-900 border-slate-850 text-slate-600" 
                    : isPlayingBack
                      ? "bg-blue-650/40 border-blue-500/40 text-blue-400 animate-pulse hover:bg-blue-600/50"
                      : "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-750"
                }`}
              >
                {isPlayingBack ? <Pause size={12} /> : <Play size={12} />}
                <span>{isPlayingBack ? "Stop Play" : isPlaybackPaused ? "Resume Play" : "Listen Play"}</span>
              </button>

              {/* Playback Pause Button */}
              {isPlayingBack && (
                <button
                  id="playback-pause-action"
                  onClick={pausePlayback}
                  className="p-1.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 border bg-slate-800 border-slate-705 text-indigo-400 hover:bg-slate-750 animate-fade-in"
                >
                  <Pause size={12} />
                  <span>Pause Play</span>
                </button>
              )}

              {/* Clear/Restart Button */}
              <button
                disabled={recordedNotes.length === 0}
                onClick={restartRecording}
                className={`p-1.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1 border ${
                  recordedNotes.length === 0 
                    ? "opacity-40 cursor-not-allowed bg-slate-900 border-slate-850 text-slate-600" 
                    : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750"
                }`}
              >
                <RotateCcw size={12} />
                <span>Restart</span>
              </button>

              {/* Add Master Loop Button - only appears after something is recorded! */}
              {recordedNotes.length > 0 && (
                <button
                  onClick={addRecordedProjectTrack}
                  className="p-1.5 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-lg shadow-emerald-950 border border-emerald-700 text-center animate-fade-in"
                >
                  <Check size={14} className="stroke-[3px]" />
                  <span>Add</span>
                </button>
              )}
            </div>
          </div>

          {/* Collapsible studio effects & visualizer panel */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setIsStudioPanelExpanded(!isStudioPanelExpanded)}
              className="flex items-center justify-between w-full p-3 bg-slate-900 hover:bg-slate-850 border border-slate-850 rounded-2xl cursor-pointer select-none transition-all duration-150 group active:scale-[0.99] shadow"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-350 group-hover:text-amber-400">
                <Sliders size={13} className="text-blue-500 animate-pulse" />
                <span>🎛️ STUDIO CONTROL PANEL & EFFECTS</span>
                <span className="text-[9px] text-slate-500 font-normal hidden sm:inline ml-1">(Reverb, EQ Boosters, scales & live spectrum)</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-black px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400 group-hover:text-amber-400 transition-colors uppercase">
                  {isStudioPanelExpanded ? "Collapse ▲" : "Expand FX ▼"}
                </span>
              </div>
            </button>
            
            <div className={`bg-slate-900 border border-slate-850 p-4 rounded-3xl gap-5 items-center ${
              isStudioPanelExpanded ? "grid grid-cols-1 md:grid-cols-12" : "hidden"
            }`}>
              
              {/* Neon Scope Feed Visualizer Display (Col-4) */}
              <div className="md:col-span-4 flex flex-col gap-1.5 h-full justify-between">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <Activity size={14} className="text-sky-400 animate-pulse" />
                    <span className="text-[10px] font-black tracking-widest text-slate-300 uppercase">ANALYZER OSCILLOSCOPE</span>
                  </div>
                  <span className="text-[8px] text-slate-500 font-mono">Analog low-latency spectrum waveform monitor</span>
                </div>
                <div className="relative bg-slate-950/90 border border-slate-850 rounded-2xl overflow-hidden p-1.5 mt-1">
                  <canvas 
                    ref={canvasRef} 
                    className="w-full h-20 block rounded-xl border border-slate-900" 
                    width={340} 
                    height={80}
                  />
                  <div className="absolute bottom-2.5 right-3.5 flex items-center gap-1 text-[8px] font-mono text-sky-400/80 bg-slate-950/90 px-1.5 py-0.5 border border-slate-800 rounded-md shadow">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping"></span>
                    <span>FEED LIVE</span>
                  </div>
                </div>
              </div>

              {/* Studio Effects Control Center (Col-8) */}
              <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
                
                {/* 1. Acoustic Space Reverb Presets */}
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Sliders size={10} className="text-blue-400" />
                    <span>Acoustic Space</span>
                  </label>
                  <select
                    value={acousticSpace}
                    onChange={(e) => setAcousticSpace(e.target.value as any)}
                    className="p-1 px-1.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-medium text-slate-200 outline-none hover:bg-slate-900 transition-colors cursor-pointer"
                  >
                    <option value="dry">Dry Studio (Flat)</option>
                    <option value="concert">Concert Hall (Warm)</option>
                    <option value="temple">Ancient Temple (Huge)</option>
                    <option value="space">Cosmic Void (Echoes)</option>
                  </select>
                  <span className="text-[8px] text-slate-550 leading-none">Spatial reverb & feedback</span>
                </div>

                {/* 2. Harmonic Equalizer Boosters */}
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles size={10} className="text-amber-400" />
                    <span>Harmo Booster</span>
                  </label>
                  <select
                    value={harmonicBooster}
                    onChange={(e) => setHarmonicBooster(e.target.value as any)}
                    className="p-1 px-1.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-medium text-slate-200 outline-none hover:bg-slate-900 transition-colors cursor-pointer"
                  >
                    <option value="none">Pure (No Boost)</option>
                    <option value="bass">Sub Bass Presence</option>
                    <option value="sparkles">HD Sparkly Highs</option>
                    <option value="warmth">Cozy Analog Warmth</option>
                  </select>
                  <span className="text-[8px] text-slate-550 leading-none">Peaking EQ details</span>
                </div>

                {/* 3. Dynamic Ragas & Melodic Scales */}
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Music size={10} className="text-violet-400" />
                    <span>Melodic Scale</span>
                  </label>
                  <select
                    value={pitchScalePreset}
                    onChange={(e) => setPitchScalePreset(e.target.value as any)}
                    className="p-1 px-1.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-medium text-slate-200 outline-none hover:bg-slate-900 transition-colors cursor-pointer"
                  >
                    <option value="chromatic">12-Tone Chromatic</option>
                    <option value="major">Uplifting Major Scale</option>
                    <option value="bhairavi">Raga Bhairavi (Mystical)</option>
                    <option value="yaman">Raga Yaman (Cosmic Sitar)</option>
                    <option value="pentatonic">Pentatonic Bhupali</option>
                    <option value="maqam">Maqam Hijaz (Arabic)</option>
                  </select>
                  <span className="text-[8px] text-slate-550 leading-none">Instant chord remapping</span>
                </div>

                {/* 4. Adjustable Envelope Sustain Decay */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>Envelope Release</span>
                    <span className="font-mono text-[8px] text-blue-450">{synthReleaseMult.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="4.0"
                    step="0.1"
                    value={synthReleaseMult}
                    onChange={(e) => setSynthReleaseMult(parseFloat(e.target.value))}
                    className="w-full accent-blue-500 h-1 mt-1 bg-slate-950 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-[8px] text-slate-550 leading-none mt-1">Multiplies sound decay lengths</span>
                </div>

                {/* 5. Custom Vibrato Modulation Frequency */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>Vibrato Rate</span>
                    <span className="font-mono text-[8px] text-sky-400">{vibratoRate.toFixed(1)}Hz</span>
                  </div>
                  <input
                    type="range"
                    min="2.0"
                    max="15.0"
                    step="0.5"
                    value={vibratoRate}
                    onChange={(e) => setVibratoRate(parseFloat(e.target.value))}
                    className="w-full accent-sky-400 h-1 mt-1 bg-slate-950 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-[8px] text-slate-550 leading-none mt-1">Adjust LFO frequency sweeps</span>
                </div>

              </div>

            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3">
            {/* Play Stats and Guide info panel left */}
            <div className="w-full sm:w-1/4 flex flex-col gap-3">
              <div className="bg-slate-900 border border-slate-850 rounded-2xl p-4 flex flex-col gap-3">
                <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">TAPE TRACK RECORDS</span>
                
                <div className="flex flex-col gap-1 text-[11px] font-mono">
                  <div className="flex justify-between border-b border-slate-850 pb-1.5">
                    <span className="text-slate-500">Recorded Notes:</span>
                    <span className="font-semibold text-slate-200 text-right">{recordedNotes.length} notes</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-850 py-1.5">
                    <span className="text-slate-500">Audio Length:</span>
                    <span className="font-semibold text-slate-200 text-right">
                      {recordedNotes.length > 0 
                        ? `${Math.max(...recordedNotes.map(n => n.time + n.duration)).toFixed(1)}s` 
                        : "0.0s"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500">Status:</span>
                    <span className={`font-semibold text-right ${isRecording ? "text-red-500 animate-pulse" : isPlayingBack ? "text-amber-500" : "text-green-500"}`}>
                      {isRecording ? "● RECORDING" : isPlayingBack ? "■ PLAYBACK" : "✓ STANBY"}
                    </span>
                  </div>
                </div>

                {isRecording && (
                  <div className="p-2 border border-dashed border-red-500/20 bg-red-950/10 rounded-lg flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 justify-center">
                      <div className="w-2 h-2 rounded-full bg-red-650 animate-ping"></div>
                      <span className="text-[9px] font-bold text-red-400 uppercase tracking-widest font-mono">Capture Mode Live</span>
                    </div>
                    <span className="text-[8px] text-slate-500 font-mono text-center">Tapping any touch deck elements below writes directly to sequencer!</span>
                  </div>
                )}
              </div>

              {/* Mini Instruction Board */}
              <div className="bg-slate-900 border border-slate-850 rounded-2xl p-4 flex flex-col gap-2">
                <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">Interactive guide</span>
                <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                  <Sparkles size={14} className="text-blue-500" />
                  <span>You can use the typing keyboard indices mapped to physical keys to trigger and compose loops automatically!</span>
                </div>
              </div>
            </div>

            {/* Custom Interactive Widescreen Playing Deck right */}
            <div className="w-full sm:w-3/4 bg-slate-900/50 border border-slate-850 rounded-2xl p-4 flex flex-col gap-4 relative">
              
              {/* Simulate Mobile automatically rotates to Landscape Mode banner indicator and controls */}
              <div className="flex items-center justify-between border-b border-slate-800/85 pb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                  <Zap size={14} className="text-amber-500" />
                  <span>Landscape Board Emulator (Optimal Mobile View)</span>
                </div>
                <span className="text-[10px] bg-slate-800 text-slate-400 border border-slate-700/60 px-2 py-0.5 rounded-lg select-none font-mono font-medium">
                   {selectedInst.name}
                </span>
              </div>

              {/* RENDER CATEGORY INSTRUMENT DECK */}
              {selectedInst.category === "percussion" ? (
                /* Percussion Pad Layout Mode */
                <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-4 gap-2 py-2 w-full h-full min-h-[220px]">
                  {percussionPads.map((pad, idx) => (
                    <button
                      key={pad.type}
                      id={`percussion-pad-${pad.type}`}
                      onClick={() => playAndRecordNote(pad.name, pad.type)}
                      className="group flex flex-col items-center justify-center gap-1 p-2 sm:p-4 bg-slate-850 hover:bg-slate-800 border-2 border-slate-800/80 hover:border-blue-500 rounded-xl sm:rounded-2xl hover:shadow-inner hover:shadow-blue-500/20 active:scale-95 cursor-pointer transform hover:-translate-y-0.5 transition-all text-center h-[75px] sm:h-[90px]"
                    >
                      <span className="text-base sm:text-xl font-black text-slate-300 group-hover:scale-110 transition-transform">{pad.noteName}</span>
                      <span className="text-[9px] sm:text-[10px] text-slate-500 truncate w-full group-hover:text-slate-350">{pad.name}</span>
                    </button>
                  ))}
                </div>
              ) : selectedInst.category === "strings" ? (
                /* Strings Plucked Fretboard Layout Mode */
                <div className="flex flex-col gap-3 py-6 min-h-[220px] justify-center">
                  <div className="bg-amber-950/20 border border-amber-900/30 p-2 text-center rounded-xl mb-2 flex items-center justify-center gap-1 text-[11px] text-amber-300">
                    <CornerRightDown size={14} />
                    <span>Trigger plucks by clicking the sound bar strings below:</span>
                  </div>
                  {/* Standard Fret bars */}
                  <div className="flex flex-col gap-2.5">
                    {stringFrets.map((fret, fretIdx) => (
                      <button
                        key={fretIdx}
                        id={`string-fret-line-${fretIdx}`}
                        onClick={() => playAndRecordNote(fret.name, fret.freq)}
                        className="group relative flex items-center justify-between w-full h-[32px] px-4 rounded-xl bg-gradient-to-r from-slate-900 to-slate-850 hover:from-slate-850 hover:to-slate-800 border border-slate-800 hover:border-amber-500 transition-all cursor-pointer shadow-sm overflow-hidden"
                      >
                        {/* String visual representation line */}
                        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] bg-slate-700/80 group-hover:bg-amber-500 group-hover:animate-vibrate shadow"></div>
                        
                        <span className="z-10 text-[10px] font-bold text-slate-400 group-hover:text-amber-400 transition-colors">{fret.label}</span>
                        <div className="z-10 bg-slate-950 px-2 py-0.5 border border-slate-800 rounded font-mono text-[9px] text-slate-500 group-hover:text-amber-400">
                           {fret.name}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Keyboard Style Mode (Piano, synthesizers, Accordion, Flutes etc.) */
                <div className="flex flex-col items-center justify-center py-4 min-h-[220px] w-full">
                  <div className="text-[10px] text-slate-500 font-bold mb-2 flex items-center gap-1.5 sm:hidden uppercase tracking-wider animate-pulse">
                    <span>↔ Scroll or Swipe horizontally for more keys</span>
                  </div>
                  
                  {/* Horizontally scrollable wrapper on mobile */}
                  <div className="w-full overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-slate-900/50">
                    <div className="relative flex w-[640px] sm:w-full max-w-xl mx-auto h-[160px] bg-slate-900 rounded-xl p-1.5 border border-slate-800 select-none shrink-0 mb-1">
                      {keyboardKeys.map((keyboardKey, keyIdx) => {
                        // Style keyboard keys properly
                        if (keyboardKey.isBlack) {
                          // Black Keys overlay
                          return (
                            <button
                              key={keyIdx}
                              id={`piano-black-key-${keyboardKey.keyName}`}
                              onClick={() => playAndRecordNote(keyboardKey.keyName, getNoteFrequency(keyboardKey.keyName))}
                              className="absolute z-25 bg-slate-950 hover:bg-slate-900 active:bg-blue-600 border border-slate-850 w-7 h-[90px] rounded-b-lg flex flex-col justify-end pb-2 items-center cursor-pointer shadow transition-all transform hover:scale-x-105"
                              style={{
                                left: `calc(${(keyIdx * 6.5) - 1.5}% + 8px)`
                              }}
                            >
                              <span className="text-[8px] font-mono font-black text-slate-500">{keyboardKey.hotkey}</span>
                            </button>
                          );
                        }
                        
                        // White Keys base
                        return (
                          <button
                            key={keyIdx}
                            id={`piano-white-key-${keyboardKey.keyName}`}
                            onClick={() => playAndRecordNote(keyboardKey.keyName, getNoteFrequency(keyboardKey.keyName))}
                            className="flex-1 bg-white hover:bg-slate-200 active:bg-blue-200 border-r border-slate-200 last:border-0 rounded-b-lg flex flex-col justify-end pb-4 items-center gap-1 cursor-pointer shadow transition-all"
                          >
                            <span className="text-[9px] text-slate-400 font-black font-sans select-none">{keyboardKey.keyName}</span>
                            <span className="text-[8px] font-mono font-bold text-slate-500">{keyboardKey.hotkey}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
          
        </div>
      )}
    </div>
  );
};
