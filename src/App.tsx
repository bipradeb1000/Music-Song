import React, { useState, useRef } from "react";
import { Music, Activity } from "lucide-react";
import { MobileFrame } from "./components/MobileFrame";
import { EditorView } from "./components/EditorView";
import { PlayerView } from "./components/PlayerView";
import { AudioEngine } from "./utils/audioEngine";
import { AudioClip, EqualizerSettings, DynamicAudioSettings } from "./types";

interface HistorySnapshot {
  clips: AudioClip[];
  equalizer: EqualizerSettings;
  dynamicAudio: DynamicAudioSettings;
}

export default function App() {
  const engineRef = useRef(new AudioEngine());
  
  // Track Clips configuration
  const [clips, setClips] = useState<AudioClip[]>([]);

  // State parameters for equalizer settings
  const [equalizer, setEqualizer] = useState<EqualizerSettings>({
    isEnabled: true,
    hz60: 3,   // slightly warm bass default
    hz230: 1,
    hz910: 0,
    hz3600: 2,  // crisp presence
    hz14000: 3, // sparkling air
    isBassBoost: false,
    isSurroundSound: false,
  });

  // Dynamic Audio Freq ranges multiplier (0.0 to 1.5 multiplier)
  const [dynamicAudio, setDynamicAudio] = useState<DynamicAudioSettings>({
    lowFreq: 1.0,
    medFreq: 1.0,
    highFreq: 1.0,
  });

  // Undo/Redo Stacks
  const [undoStack, setUndoStack] = useState<HistorySnapshot[]>([]);
  const [redoStack, setRedoStack] = useState<HistorySnapshot[]>([]);

  // Pre-interaction snapshot to record clean history checkpoints for range sliders on drag-complete
  const preInteractionSnapshotRef = useRef<HistorySnapshot | null>(null);

  const takeInteractionSnapshot = () => {
    preInteractionSnapshotRef.current = {
      clips: JSON.parse(JSON.stringify(clips)), // Deep copy clips to avoid reference mutation issues
      equalizer: { ...equalizer },
      dynamicAudio: { ...dynamicAudio },
    };
  };

  const commitInteractionSnapshot = () => {
    if (!preInteractionSnapshotRef.current) return;
    
    const current = {
      clips,
      equalizer,
      dynamicAudio,
    };
    
    const hasChanged = JSON.stringify(preInteractionSnapshotRef.current) !== JSON.stringify(current);
    if (hasChanged) {
      setUndoStack((prev) => {
        const next = [...prev, preInteractionSnapshotRef.current!];
        if (next.length > 50) next.shift();
        return next;
      });
      setRedoStack([]); // Clear redo stack on new atomic action
    }
    preInteractionSnapshotRef.current = null;
  };

  // Wrapper setters that automatically record history for non-sliding instant actions (split, delete, instruments, etc.)
  const updateClipsWithHistory = (
    value: React.SetStateAction<AudioClip[]>
  ) => {
    setClips((prev) => {
      const next = typeof value === "function" ? (value as Function)(prev) : value;
      if (JSON.stringify(prev) !== JSON.stringify(next)) {
        if (!preInteractionSnapshotRef.current) {
          const snapshot: HistorySnapshot = {
            clips: prev,
            equalizer: { ...equalizer },
            dynamicAudio: { ...dynamicAudio },
          };
          setUndoStack((prevUndo) => {
            const nextUndo = [...prevUndo, snapshot];
            if (nextUndo.length > 50) nextUndo.shift();
            return nextUndo;
          });
          setRedoStack([]);
        }
      }
      return next;
    });
  };

  const updateEqualizerWithHistory = (
    value: React.SetStateAction<EqualizerSettings>
  ) => {
    setEqualizer((prev) => {
      const next = typeof value === "function" ? (value as Function)(prev) : value;
      if (JSON.stringify(prev) !== JSON.stringify(next)) {
        if (!preInteractionSnapshotRef.current) {
          const snapshot: HistorySnapshot = {
            clips: [...clips],
            equalizer: prev,
            dynamicAudio: { ...dynamicAudio },
          };
          setUndoStack((prevUndo) => {
            const nextUndo = [...prevUndo, snapshot];
            if (nextUndo.length > 50) nextUndo.shift();
            return nextUndo;
          });
          setRedoStack([]);
        }
      }
      return next;
    });
  };

  const updateDynamicAudioWithHistory = (
    value: React.SetStateAction<DynamicAudioSettings>
  ) => {
    setDynamicAudio((prev) => {
      const next = typeof value === "function" ? (value as Function)(prev) : value;
      if (JSON.stringify(prev) !== JSON.stringify(next)) {
        if (!preInteractionSnapshotRef.current) {
          const snapshot: HistorySnapshot = {
            clips: [...clips],
            equalizer: { ...equalizer },
            dynamicAudio: prev,
          };
          setUndoStack((prevUndo) => {
            const nextUndo = [...prevUndo, snapshot];
            if (nextUndo.length > 50) nextUndo.shift();
            return nextUndo;
          });
          setRedoStack([]);
        }
      }
      return next;
    });
  };

  const undo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, prev.length - 1));
    
    const current: HistorySnapshot = {
      clips: [...clips],
      equalizer: { ...equalizer },
      dynamicAudio: { ...dynamicAudio },
    };
    setRedoStack((prev) => [...prev, current]);
    
    setClips(previous.clips);
    setEqualizer(previous.equalizer);
    setDynamicAudio(previous.dynamicAudio);
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, prev.length - 1));
    
    const current: HistorySnapshot = {
      clips: [...clips],
      equalizer: { ...equalizer },
      dynamicAudio: { ...dynamicAudio },
    };
    setUndoStack((prev) => [...prev, current]);
    
    setClips(next.clips);
    setEqualizer(next.equalizer);
    setDynamicAudio(next.dynamicAudio);
  };

  // Switch tabs/view between editor and finalize
  const [isFinalized, setIsFinalized] = useState(false);
  const [bakedBuffer, setBakedBuffer] = useState<AudioBuffer | null>(null);
  const [isFinalizingProgress, setIsFinalizingProgress] = useState(false);

  // Trigger OfflineAudioContext to render the timeline to single buffer
  const handleFinalize = async () => {
    engineRef.current.stopPlayingTimeline();
    setIsFinalizingProgress(true);
    
    try {
      const buffer = await engineRef.current.bakeAndCompileTimeline(
        clips,
        equalizer,
        dynamicAudio
      );
      setBakedBuffer(buffer);
      setIsFinalized(true);
    } catch (e) {
      console.error("Failed to compile audio timeline", e);
      alert("Uh oh! Failed to compile track clips. Ensure some media blocks are present on the timeline.");
    } finally {
      setIsFinalizingProgress(false);
    }
  };

  const handleBackToEditor = () => {
    setIsFinalized(false);
  };

  return (
    <MobileFrame>
      {/* Header bar branding */}
      <header id="app-branding-header" className="bg-slate-900 border-b border-slate-800 p-4 shrink-0 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2 select-none">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/30">
            <Music size={16} className="text-white animate-bounce" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-widest text-white leading-none">YOUR</h1>
            <span className="text-[8px] font-bold text-blue-400 font-mono tracking-widest uppercase">Music Studio</span>
          </div>
        </div>

        {/* Real-time status indicator */}
        <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800">
          <Activity size={10} className="text-blue-500" />
          <span className="text-[8px] font-mono tracking-widest font-bold text-slate-400">
            {isFinalized ? "PLAYER VIEW" : "EDITOR ACTIVE"}
          </span>
        </div>
      </header>

      {/* Main workspace container switch */}
      <main id="main-app-content" className="flex-1 flex flex-col relative overflow-hidden overflow-y-auto">
        {isFinalized ? (
          <PlayerView
            engine={engineRef.current}
            bakedBuffer={bakedBuffer}
            onBackToEditor={handleBackToEditor}
            clips={clips}
            equalizer={equalizer}
            dynamicAudio={dynamicAudio}
          />
        ) : (
          <EditorView
            engine={engineRef.current}
            clips={clips}
            setClips={updateClipsWithHistory}
            equalizer={equalizer}
            setEqualizer={updateEqualizerWithHistory}
            dynamicAudio={dynamicAudio}
            setDynamicAudio={updateDynamicAudioWithHistory}
            onFinalize={handleFinalize}
            undo={undo}
            redo={redo}
            canUndo={undoStack.length > 0}
            canRedo={redoStack.length > 0}
            takeInteractionSnapshot={takeInteractionSnapshot}
            commitInteractionSnapshot={commitInteractionSnapshot}
          />
        )}
      </main>

      {/* Compiler Loading Indicator HUD Overlay */}
      {isFinalizingProgress && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-6 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center max-w-xs flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <div>
              <p className="text-sm font-semibold text-slate-100 mb-1">Baking Master Track...</p>
              <p className="text-[10px] text-slate-400 leading-normal">
                Compositing multi-channel track nodes, executing graphic equalizer convolutions, and compiling offline PCM vectors...
              </p>
            </div>
          </div>
        </div>
      )}
    </MobileFrame>
  );
}
