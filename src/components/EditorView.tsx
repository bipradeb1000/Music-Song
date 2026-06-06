import React, { useRef, useState, useEffect } from "react";
import { 
  Play, 
  Square, 
  Scissors, 
  Trash2, 
  Plus, 
  Sliders, 
  Volume2, 
  Activity, 
  Music, 
  Compass,
  Upload, 
  Maximize2,
  ListRestart,
  RotateCcw,
  Undo2,
  Redo2
} from "lucide-react";
import { AudioClip, EqualizerSettings, DynamicAudioSettings } from "../types";
import { AudioEngine } from "../utils/audioEngine";
import { WaveformVisualizer } from "./WaveformVisualizer";

interface EditorViewProps {
  engine: AudioEngine;
  clips: AudioClip[];
  setClips: React.Dispatch<React.SetStateAction<AudioClip[]>>;
  equalizer: EqualizerSettings;
  setEqualizer: React.Dispatch<React.SetStateAction<EqualizerSettings>>;
  dynamicAudio: DynamicAudioSettings;
  setDynamicAudio: React.Dispatch<React.SetStateAction<DynamicAudioSettings>>;
  onFinalize: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  takeInteractionSnapshot: () => void;
  commitInteractionSnapshot: () => void;
}

export const EditorView: React.FC<EditorViewProps> = ({
  engine,
  clips,
  setClips,
  equalizer,
  setEqualizer,
  dynamicAudio,
  setDynamicAudio,
  onFinalize,
  undo,
  redo,
  canUndo,
  canRedo,
  takeInteractionSnapshot,
  commitInteractionSnapshot,
}) => {
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [playhead, setPlayhead] = useState(0); // in seconds
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedClipDetails, setSelectedClipDetails] = useState<AudioClip | null>(null);

  // Audio loading / setup flags
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const instrumentInputRef = useRef<HTMLInputElement | null>(null);

  const timelineLength = Math.max(8.0, engine.getTimelineLength(clips));

  useEffect(() => {
    if (selectedClipId) {
      const match = clips.find((c) => c.id === selectedClipId);
      setSelectedClipDetails(match || null);
    } else {
      setSelectedClipDetails(null);
    }
  }, [selectedClipId, clips]);

  // Find currently highlighted clip to connect EQ & Dynamic bands independently
  const currentClip = clips.find((c) => c.id === selectedClipId);

  // Resolved active state variables for GUI sliders
  const activeEq = currentClip?.equalizer || {
    isEnabled: false,
    hz60: 0,
    hz230: 0,
    hz910: 0,
    hz3600: 0,
    hz14000: 0,
    isBassBoost: false,
    isSurroundSound: false,
  };

  const activeDyn = currentClip?.dynamicAudio || {
    lowFreq: 1.0,
    medFreq: 1.0,
    highFreq: 1.0,
  };

  const updateActiveEq = (newEq: EqualizerSettings) => {
    if (selectedClipId) {
      setClips((prev) =>
        prev.map((c) => {
          if (c.id === selectedClipId) {
            const updated = { ...c, equalizer: newEq };
            if (isPlaying) {
              engine.updateActiveClipParams(c.id, newEq, c.dynamicAudio || activeDyn);
            }
            return updated;
          }
          return c;
        })
      );
    } else {
      setEqualizer(newEq);
    }
  };

  const updateActiveDyn = (newDyn: DynamicAudioSettings) => {
    if (selectedClipId) {
      setClips((prev) =>
        prev.map((c) => {
          if (c.id === selectedClipId) {
            const updated = { ...c, dynamicAudio: newDyn };
            if (isPlaying) {
              engine.updateActiveClipParams(c.id, c.equalizer || activeEq, newDyn);
            }
            return updated;
          }
          return c;
        })
      );
    } else {
      setDynamicAudio(newDyn);
    }
  };

  const resetActiveEq = () => {
    const defaultEq: EqualizerSettings = {
      isEnabled: true,
      hz60: 0,
      hz230: 0,
      hz910: 0,
      hz3600: 0,
      hz14000: 0,
      isBassBoost: false,
      isSurroundSound: false,
    };
    updateActiveEq(defaultEq);
  };

  const resetActiveDyn = () => {
    const defaultDyn: DynamicAudioSettings = {
      lowFreq: 1.0,
      medFreq: 1.0,
      highFreq: 1.0,
    };
    updateActiveDyn(defaultDyn);
  };

  // Lazy synthesize default multi-track loops if timeline is empty
  const loadDefaultPresetLoops = async () => {
    setIsSynthesizing(true);
    try {
      engine.getContext(); // trigger init
      
      const sitarDrone = engine.generateProceduralBuffer("Raga Drone", 8.0);
      const tablaPerc = engine.generateProceduralBuffer("Tabla Beat", 8.0);
      const dholPerc = engine.generateProceduralBuffer("Punjabi Dhol", 8.0);
      const sufiFlute = engine.generateProceduralBuffer("Sufi Flute", 8.0);

      const defaultClips: AudioClip[] = [
        {
          id: "track-1-drone",
          name: "Sitar Alap Drone",
          trackId: "drone",
          buffer: sitarDrone,
          duration: 8.0,
          startOffset: 0.0,
          startInCut: 0.0,
          durationInCut: 8.0,
          speed: 1.0,
          equalizer: {
            isEnabled: true,
            hz60: 2,
            hz230: 1,
            hz910: 0,
            hz3600: 3,
            hz14000: 5,
            isBassBoost: false,
            isSurroundSound: true, // Swirling atmospheric feel
          },
          dynamicAudio: {
            lowFreq: 0.9,
            medFreq: 1.1,
            highFreq: 1.25,
          }
        },
        {
          id: "track-2-tabla",
          name: "Classic TeenTaal Tabla",
          trackId: "tabla",
          buffer: tablaPerc,
          duration: 8.0,
          startOffset: 0.0,
          startInCut: 0.0,
          durationInCut: 8.0,
          speed: 1.0,
          equalizer: {
            isEnabled: true,
            hz60: 4,
            hz230: 2,
            hz910: -1,
            hz3600: 0,
            hz14000: 1,
            isBassBoost: true, // Deep resonant ghe strokes
            isSurroundSound: false,
          },
          dynamicAudio: {
            lowFreq: 1.2,
            medFreq: 0.95,
            highFreq: 0.9,
          }
        },
        {
          id: "track-3-dhol",
          name: "Neon Punjabi Dhol Beat",
          trackId: "dhol",
          buffer: dholPerc,
          duration: 8.0,
          startOffset: 2.0, // starts slightly staggered
          startInCut: 0.0,
          durationInCut: 6.0,
          speed: 1.0,
          equalizer: {
            isEnabled: true,
            hz60: 6,
            hz230: 3,
            hz910: -1,
            hz3600: 1,
            hz14000: 3,
            isBassBoost: true, // Thumping low-end kick energy
            isSurroundSound: false,
          },
          dynamicAudio: {
            lowFreq: 1.35,
            medFreq: 0.9,
            highFreq: 1.15,
          }
        },
        {
          id: "track-4-flute",
          name: "Sufi Flute Solo",
          trackId: "flute",
          buffer: sufiFlute,
          duration: 8.0,
          startOffset: 1.0,
          startInCut: 0.0,
          durationInCut: 7.0,
          speed: 1.0,
          equalizer: {
            isEnabled: true,
            hz60: -4, // Keep low frequencies clean/uncluttered
            hz230: 0,
            hz910: 2,
            hz3600: 4,
            hz14000: 5, // Shimmering high-end breath presence
            isBassBoost: false,
            isSurroundSound: true,
          },
          dynamicAudio: {
            lowFreq: 0.5,
            medFreq: 1.2,
            highFreq: 1.3,
          }
        },
      ];

      setClips(defaultClips);
      setSelectedClipId("track-1-drone");
    } catch (e) {
      console.error(e);
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Prepopulate on component mount is removed to keep timeline empty by default
  useEffect(() => {
    // Keep timeline completely empty on load
  }, []);

  const handleTogglePlay = () => {
    if (isPlaying) {
      engine.stopPlayingTimeline();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      engine.playTimeline(
        clips,
        equalizer,
        dynamicAudio,
        (currentPos) => {
          setPlayhead(Math.min(timelineLength, currentPos));
        },
        () => {
          setIsPlaying(false);
          setPlayhead(0);
        },
        playhead
      );
    }
  };

  const handleStop = () => {
    engine.stopPlayingTimeline();
    setIsPlaying(false);
    setPlayhead(0);
  };

  // Perform split clip at current playhead cursor
  const handleSplit = () => {
    if (!selectedClipId) return;
    const splitRes = engine.splitClip(clips, selectedClipId, playhead);
    setClips(splitRes);
  };

  // Delete clip from timeline
  const handleDeleteSelected = () => {
    if (!selectedClipId) return;
    const remains = clips.filter((c) => c.id !== selectedClipId);
    setClips(remains);
    setSelectedClipId(remains[0]?.id || null);
  };

  // Add individual predefined procedural synthesizer segment 
  const handleAddTrack = (name: string, type: string) => {
    const defaultOffset = timelineLength; // append at end
    const buf = engine.generateProceduralBuffer(type, 8.0);
    const newClip: AudioClip = {
      id: `${type.toLowerCase()}-${Date.now()}`,
      name: `${name} ${clips.length + 1}`,
      trackId: type.toLowerCase().replace(" ", "-"),
      buffer: buf,
      duration: 8.0,
      startOffset: defaultOffset,
      startInCut: 0.0,
      durationInCut: 8.0,
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
    setClips([...clips, newClip]);
    setSelectedClipId(newClip.id);
  };

  // Instrument customs file uploads
  const handleInstrumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsSynthesizing(true);
    try {
      const audioCtx = engine.getContext();
      const arrayBuffer = await file.arrayBuffer();
      const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);

      const newClip: AudioClip = {
        id: `instrument-upload-${Date.now()}`,
        name: file.name.substring(0, 24) || "My Instrument",
        trackId: "instrument",
        buffer: decodedBuffer,
        duration: decodedBuffer.duration,
        startOffset: engine.getTimelineLength(clips),
        startInCut: 0.0,
        durationInCut: decodedBuffer.duration,
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

      setClips([...clips, newClip]);
      setSelectedClipId(newClip.id);
    } catch (e) {
      console.error("Failed to decode instrument audio file", e);
      alert("Unsupported format. Please select standard MP3, WAV or AAC audio files.");
    } finally {
      setIsSynthesizing(false);
    }
  };

  // User customs file uploads
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsSynthesizing(true);
    try {
      const audioCtx = engine.getContext();
      const arrayBuffer = await file.arrayBuffer();
      const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);

      const newClip: AudioClip = {
        id: `user-upload-${Date.now()}`,
        name: file.name.substring(0, 24) || "My Upload",
        trackId: "user",
        buffer: decodedBuffer,
        duration: decodedBuffer.duration,
        startOffset: engine.getTimelineLength(clips),
        startInCut: 0.0,
        durationInCut: decodedBuffer.duration,
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

      setClips([...clips, newClip]);
      setSelectedClipId(newClip.id);
    } catch (e) {
      console.error("Failed to decode custom audio file", e);
      alert("Unsupported format. Please select standard MP3, WAV or AAC audio files.");
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Clip speed value updates
  const handleClipSpeedChange = (speedVal: number) => {
    if (!selectedClipId) return;
    setClips(
      clips.map((c) => {
        if (c.id === selectedClipId) {
          return { ...c, speed: speedVal };
        }
        return c;
      })
    );
  };

  // Clip start offset updates (horizontal drag mock)
  const handleClipOffsetChange = (offsetVal: number) => {
    if (!selectedClipId) return;
    setClips(
      clips.map((c) => {
        if (c.id === selectedClipId) {
          return { ...c, startOffset: Math.max(0, offsetVal) };
        }
        return c;
      })
    );
  };

  return (
    <div id="editor-view-container" className="flex-1 flex flex-col p-4 gap-4 bg-slate-950 pb-20 justify-start">
      {/* Waveform Realtime Visualizer */}
      <WaveformVisualizer analyser={engine.getAnalyser()} isPlaying={isPlaying} />

      {/* Main Transport Playback Controls */}
      <div id="control-panel-bar" className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              id="transport-play-btn"
              onClick={handleTogglePlay}
              className={`p-3 rounded-full flex items-center justify-center transition-all ${
                isPlaying 
                  ? "bg-amber-500 text-slate-950 hover:bg-amber-400" 
                  : "bg-blue-600 text-white hover:bg-blue-500 shadow-md shadow-blue-900/40"
              }`}
            >
              {isPlaying ? <Square size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
            </button>
            <button
              id="transport-stop-btn"
              onClick={handleStop}
              className="p-3 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center"
            >
              <ListRestart size={18} />
            </button>

            {/* Vertical separator */}
            <div className="w-[1px] h-8 bg-slate-850 self-center mx-1"></div>

            {/* Undo button */}
            <button
              id="history-undo-btn"
              onClick={undo}
              disabled={!canUndo}
              title={canUndo ? "Undo last action" : "Nothing to undo"}
              className={`p-3 rounded-full flex items-center justify-center transition-all ${
                canUndo
                  ? "bg-slate-800 text-slate-100 hover:bg-slate-700 hover:text-white" 
                  : "bg-slate-900/50 text-slate-600 cursor-not-allowed"
              }`}
            >
              <Undo2 size={18} />
            </button>

            {/* Redo button */}
            <button
              id="history-redo-btn"
              onClick={redo}
              disabled={!canRedo}
              title={canRedo ? "Redo action" : "Nothing to redo"}
              className={`p-3 rounded-full flex items-center justify-center transition-all ${
                canRedo
                  ? "bg-slate-800 text-slate-100 hover:bg-slate-700 hover:text-white" 
                  : "bg-slate-900/50 text-slate-600 cursor-not-allowed"
              }`}
            >
              <Redo2 size={18} />
            </button>
          </div>
          
          <div className="text-right">
            <div className="text-[9px] font-mono text-slate-500 tracking-wider">PLAYHEAD TIMER</div>
            <div className="text-xl font-mono text-blue-400 font-bold">
              {playhead.toFixed(2)}s <span className="text-xs text-slate-600">/ {timelineLength.toFixed(1)}s</span>
            </div>
          </div>
        </div>

        {/* Playhead Scrub Slider */}
        <input
          id="playhead-scrub-timeline"
          type="range"
          min="0"
          max={timelineLength}
          step="0.05"
          value={playhead}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            setPlayhead(val);
            if (isPlaying) {
              // restart live context playhead
              engine.playTimeline(clips, equalizer, dynamicAudio, (currentPos) => {
                setPlayhead(Math.min(timelineLength, currentPos));
              }, () => {
                setIsPlaying(false);
                setPlayhead(0);
              }, val);
            }
          }}
          className="w-full h-1.5 bg-slate-950 rounded-full appearance-none cursor-pointer accent-blue-500 focus:outline-none"
        />
      </div>

      {/* Visual Tracks & Clips Timeline */}
      <div id="tracks-timeline-section" className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-3 flex flex-col gap-2.5">
        <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
          <span className="text-xs font-bold tracking-widest text-slate-400 flex items-center gap-1.5">
            <Activity size={13} className="text-blue-500" />
            TIMELINE TRACK LAYERS
          </span>
          <span className="text-[10px] text-slate-500 font-mono">Tap clip to edit</span>
        </div>

        {clips.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500 flex flex-col gap-2 items-center">
            <span>No audio track parts found.</span>
          </div>
        ) : (
          <div id="timeline-tracks-scroller" className="flex flex-col gap-3 max-h-56 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 p-1">
            {/* Standard clip rendering */}
            {clips.map((clip) => {
              const startPct = (clip.startOffset / timelineLength) * 100;
              const durationPct = ((clip.durationInCut / clip.speed) / timelineLength) * 100;
              const isSelected = selectedClipId === clip.id;

              return (
                <div 
                  key={clip.id} 
                  id={`track-wrapper-${clip.id}`}
                  className="relative h-12 bg-slate-950/60 rounded-xl border border-slate-800/40 p-1 overflow-hidden"
                >
                  {/* Backdrop track row label */}
                  <span className="absolute left-2.5 top-1 text-[8px] font-bold uppercase tracking-wider text-slate-600 select-none z-0">
                    {clip.name}
                  </span>

                  {/* Render Clip block */}
                  <div
                    id={`clip-block-${clip.id}`}
                    onClick={() => setSelectedClipId(clip.id)}
                    style={{
                      left: `${startPct}%`,
                      width: `${Math.max(12, durationPct)}%`,
                    }}
                    className={`absolute top-4 bottom-1 rounded-lg border flex items-center justify-between px-2 cursor-pointer transition-all z-10 ${
                      isSelected
                        ? "bg-blue-600/30 border-blue-500 shadow-lg shadow-blue-950 text-blue-200"
                        : "bg-slate-800/80 border-slate-700 hover:bg-slate-700/80 text-slate-400"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <Music size={11} className={isSelected ? "text-blue-400 animate-pulse" : "text-slate-500"} />
                      <span className="text-[10px] font-semibold truncate">{clip.name}</span>
                    </div>

                    <div className="flex items-center gap-1 text-[9px] font-mono text-slate-500 shrink-0">
                      <span>{clip.speed.toFixed(1)}x</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Clip editor operations */}
        {selectedClipDetails && (
          <div id="clip-editing-subpanel" className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl flex flex-col gap-3 font-sans">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-wider text-blue-400 truncate uppercase">
                ⚙️ Clip: {selectedClipDetails.name}
              </span>
              <button
                id="clip-delete-btn"
                onClick={handleDeleteSelected}
                className="text-rose-400 hover:text-rose-300 p-1 flex items-center gap-1 text-[11px] font-medium"
              >
                <Trash2 size={13} /> Delete
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              {/* Slip Position Slider */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] text-slate-500 font-mono flex justify-between">
                  <span>START TIME</span>
                  <span className="text-blue-400 font-semibold">{selectedClipDetails.startOffset.toFixed(1)}s</span>
                </span>
                <input
                  id="clip-offset-input-range"
                  type="range"
                  min="0"
                  max={Math.max(8.0, timelineLength - 1.0)}
                  step="0.1"
                  value={selectedClipDetails.startOffset}
                  onMouseDown={takeInteractionSnapshot}
                  onTouchStart={takeInteractionSnapshot}
                  onMouseUp={commitInteractionSnapshot}
                  onTouchEnd={commitInteractionSnapshot}
                  onChange={(e) => handleClipOffsetChange(parseFloat(e.target.value))}
                  className="w-full accent-blue-500 h-1 rounded"
                />
              </div>

              {/* Clip Speed slider */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] text-slate-500 font-mono flex justify-between">
                  <span>SPEED RATE</span>
                  <span className="text-blue-400 font-semibold">{selectedClipDetails.speed.toFixed(2)}x</span>
                </span>
                <input
                  id="clip-speed-input-range"
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={selectedClipDetails.speed}
                  onMouseDown={takeInteractionSnapshot}
                  onTouchStart={takeInteractionSnapshot}
                  onMouseUp={commitInteractionSnapshot}
                  onTouchEnd={commitInteractionSnapshot}
                  onChange={(e) => handleClipSpeedChange(parseFloat(e.target.value))}
                  className="w-full accent-blue-500 h-1 rounded"
                />
              </div>
            </div>

            {/* Split actions */}
            <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
              <button
                id="clip-split-trigger"
                disabled={playhead <= selectedClipDetails.startOffset || playhead >= (selectedClipDetails.startOffset + selectedClipDetails.durationInCut / selectedClipDetails.speed)}
                onClick={handleSplit}
                className="flex-1 py-1 px-2 text-[11px] font-medium rounded-lg bg-blue-950 text-blue-300 border border-blue-900/50 hover:bg-blue-900/40 flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Scissors size={12} /> Split at Playhead ({playhead.toFixed(2)}s)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add elements / uploads */}
      <div id="add-elements-grid" className="grid grid-cols-2 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col gap-2 justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">🎹 ADD INDIAN INSTRUMENTS</span>
            <p className="text-[9px] text-slate-500">Upload and import custom Indian instrument loops, pads or voice tracks.</p>
          </div>
          <button
            id="browse-instrument-trigger"
            onClick={() => instrumentInputRef.current?.click()}
            className="w-full py-3 bg-slate-850 border border-dashed border-slate-700 text-slate-400 hover:bg-slate-800/80 rounded-xl text-center text-xs font-semibold flex flex-col items-center gap-1 hover:text-slate-200 transition-colors"
          >
            <Upload size={16} />
            <span>select instrument file</span>
          </button>
          <input
            id="hidden-instrument-uploader-node"
            ref={instrumentInputRef}
            type="file"
            accept="audio/*"
            onChange={handleInstrumentUpload}
            className="hidden"
          />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col gap-2 justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">📤 IMPORT SOUND FILE</span>
            <p className="text-[9px] text-slate-500">Upload your own .mp3, .wav or instrumentation file to edit.</p>
          </div>
          <button
            id="browse-upload-trigger"
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-3 bg-blue-950/60 border border-dashed border-blue-800 text-blue-400 hover:bg-blue-950/90 rounded-xl text-center text-xs font-semibold flex flex-col items-center gap-1"
          >
            <Upload size={16} />
            <span>Select Audio File</span>
          </button>
          <input
            id="hidden-uploader-node"
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Equalizer (60Hz, 230Hz, 910Hz, 3600Hz, 14000Hz, bass boost, surround settings) with switch */}
      <div id="equalizer-settings-container" className="bg-slate-900 border border-slate-800 rounded-[22px] p-4 flex flex-col gap-4">
        {/* Toggle Title Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Sliders className="text-blue-500" size={16} />
              <span className="text-xs font-bold tracking-widest text-slate-400">GRAPHIC EQUALIZER</span>
            </div>
            {selectedClipDetails ? (
              <span className="text-[10px] font-mono font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 w-fit uppercase">
                🎛️ Layer: {selectedClipDetails.name}
              </span>
            ) : (
              <span className="text-[10px] font-mono text-slate-500">
                ⚠️ No clip selected (editing default profile)
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              id="reset-eq-btn"
              onClick={resetActiveEq}
              title="Reset Equalizer to flat profile"
              className="px-2 py-1 flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-bold tracking-wide border border-slate-700/80 font-mono transition-all active:scale-95"
            >
              <RotateCcw size={10} className="text-blue-400" />
              RESET
            </button>
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                id="equalizer-master-toggle"
                type="checkbox"
                checked={activeEq.isEnabled}
                onChange={(e) => {
                  const updated = { ...activeEq, isEnabled: e.target.checked };
                  updateActiveEq(updated);
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-checked:after:bg-white peer-checked:after:border-white"></div>
              <span className="ml-2 text-[10px] font-semibold text-slate-400 uppercase tracking-widest font-mono">
                {activeEq.isEnabled ? "ON" : "OFF"}
              </span>
            </label>
          </div>
        </div>

        {/* 5 bands and sliders */}
        <div id="equalizer-fader-slots" className={`grid grid-cols-5 gap-1 pt-1 transition-opacity ${activeEq.isEnabled ? "opacity-100" : "opacity-35 pointer-events-none"}`}>
          {[
            { tag: "60Hz", key: "hz60" },
            { tag: "230Hz", key: "hz230" },
            { tag: "910Hz", key: "hz910" },
            { tag: "3.6kHz", key: "hz3600" },
            { tag: "14kHz", key: "hz14000" },
          ].map(({ tag, key }) => {
            const val = activeEq[key as keyof EqualizerSettings] as number;
            return (
              <div key={tag} className="flex flex-col items-center gap-2">
                <span className="text-[9px] font-mono font-medium text-slate-400">{tag}</span>
                <div className="h-28 flex items-center justify-center p-1.5 relative bg-slate-950 rounded-xl border border-slate-800/80 w-8">
                  {/* Vertical slider scale mark lines */}
                  <div className="absolute inset-y-2 left-1/2 -translate-x-1/2 w-0.5 bg-slate-900 border-dashed"></div>
                  
                  <input
                    id={`eq-fader-${key}`}
                    type="range"
                    min="-12"
                    max="12"
                    step="1"
                    value={val}
                    style={{ writingMode: "vertical-lr", direction: "rtl" }}
                    onMouseDown={takeInteractionSnapshot}
                    onTouchStart={takeInteractionSnapshot}
                    onMouseUp={commitInteractionSnapshot}
                    onTouchEnd={commitInteractionSnapshot}
                    onChange={(e) => {
                      const updated = { ...activeEq, [key]: parseInt(e.target.value) };
                      updateActiveEq(updated);
                    }}
                    className="h-full vertical-range accent-blue-500 cursor-pointer appearance-none bg-transparent w-full z-10"
                  />
                </div>
                <span className="text-[10px] font-mono text-blue-500 font-bold">{val > 0 ? `+${val}` : val}dB</span>
              </div>
            );
          })}
        </div>

        {/* Equalizer sub-settings (Bass boost, Surround sound) */}
        <div id="equalizer-special-modes" className="grid grid-cols-2 gap-3 pt-2.5 border-t border-slate-800/80">
          <div className="flex items-center justify-between bg-slate-950/60 p-2.5 rounded-xl border border-slate-850">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 tracking-wide">BASS BOOST</span>
              <span className="text-[8px] text-slate-500 font-mono">Thumping sub-bass</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                id="eq-bassboost-toggle"
                type="checkbox"
                disabled={!activeEq.isEnabled}
                checked={activeEq.isBassBoost}
                onChange={(e) => {
                  const updated = { ...activeEq, isBassBoost: e.target.checked };
                  updateActiveEq(updated);
                }}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-focus:outline-none peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 peer-checked:after:bg-white disabled:opacity-40"></div>
            </label>
          </div>

          <div className="flex items-center justify-between bg-slate-950/60 p-2.5 rounded-xl border border-slate-850">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 tracking-wide">SURROUND</span>
              <span className="text-[8px] text-slate-500 font-mono">Haas wide audio</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                id="eq-surround-toggle"
                type="checkbox"
                disabled={!activeEq.isEnabled}
                checked={activeEq.isSurroundSound}
                onChange={(e) => {
                  const updated = { ...activeEq, isSurroundSound: e.target.checked };
                  updateActiveEq(updated);
                }}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-focus:outline-none peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 peer-checked:after:bg-white disabled:opacity-40"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Dynamic Audio Section (Low Freq, Med Freq, High Freq sliders) */}
      <div id="dynamic-settings-container" className="bg-slate-900 border border-slate-800 rounded-[22px] p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Volume2 className="text-blue-500" size={16} />
            <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">DYNAMIC AUDIO BANDS</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="reset-dyn-btn"
              onClick={resetActiveDyn}
              title="Reset dynamic bands to default 1.0x"
              className="px-2 py-1 flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-bold tracking-wide border border-slate-700/80 font-mono transition-all active:scale-95"
            >
              <RotateCcw size={10} className="text-blue-400" />
              RESET
            </button>
            {selectedClipDetails && (
              <span className="text-[9px] font-mono text-slate-400 bg-slate-850 px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                Layer Active
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {/* Low Freq Slider */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[11px] font-medium text-slate-400 font-mono">
              <span>LOW BAND (BASS) Vol</span>
              <span className="text-blue-400 font-bold">{activeDyn.lowFreq.toFixed(2)}x</span>
            </div>
            <input
              id="dynamic-lowfreq-slider"
              type="range"
              min="0.0"
              max="1.5"
              step="0.05"
              value={activeDyn.lowFreq}
              onMouseDown={takeInteractionSnapshot}
              onTouchStart={takeInteractionSnapshot}
              onMouseUp={commitInteractionSnapshot}
              onTouchEnd={commitInteractionSnapshot}
              onChange={(e) => {
                const updated = { ...activeDyn, lowFreq: parseFloat(e.target.value) };
                updateActiveDyn(updated);
              }}
              className="w-full accent-blue-500 h-1.5 rounded cursor-pointer appearance-none bg-slate-950"
            />
          </div>

          {/* Med Freq Slider */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[11px] font-medium text-slate-400 font-mono">
              <span>MID BAND (VOCAL) Vol</span>
              <span className="text-blue-400 font-bold">{activeDyn.medFreq.toFixed(2)}x</span>
            </div>
            <input
              id="dynamic-medfreq-slider"
              type="range"
              min="0.0"
              max="1.5"
              step="0.05"
              value={activeDyn.medFreq}
              onMouseDown={takeInteractionSnapshot}
              onTouchStart={takeInteractionSnapshot}
              onMouseUp={commitInteractionSnapshot}
              onTouchEnd={commitInteractionSnapshot}
              onChange={(e) => {
                const updated = { ...activeDyn, medFreq: parseFloat(e.target.value) };
                updateActiveDyn(updated);
              }}
              className="w-full accent-blue-500 h-1.5 rounded cursor-pointer appearance-none bg-slate-950"
            />
          </div>

          {/* High Freq Slider */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[11px] font-medium text-slate-400 font-mono">
              <span>HIGH BAND (TREBLE) Vol</span>
              <span className="text-blue-400 font-bold">{activeDyn.highFreq.toFixed(2)}x</span>
            </div>
            <input
              id="dynamic-highfreq-slider"
              type="range"
              min="0.0"
              max="1.5"
              step="0.05"
              value={activeDyn.highFreq}
              onMouseDown={takeInteractionSnapshot}
              onTouchStart={takeInteractionSnapshot}
              onMouseUp={commitInteractionSnapshot}
              onTouchEnd={commitInteractionSnapshot}
              onChange={(e) => {
                const updated = { ...activeDyn, highFreq: parseFloat(e.target.value) };
                updateActiveDyn(updated);
              }}
              className="w-full accent-blue-500 h-1.5 rounded cursor-pointer appearance-none bg-slate-950"
            />
          </div>
        </div>
      </div>

      {isSynthesizing && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-6 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center max-w-xs flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-semibold text-slate-200">Synthesizing audio samples and preparing master timeline elements...</p>
          </div>
        </div>
      )}

      {/* Finalize Button Bar */}
      <div className="fixed bottom-0 left-0 right-0 sm:absolute bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent p-4 flex justify-center z-45">
        <button
          id="editor-finalize-trigger"
          onClick={onFinalize}
          className="w-full max-w-[390px] py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold tracking-wider text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-900/50 hover:shadow-blue-500/30 transition-all active:scale-[0.98]"
        >
          <Maximize2 size={16} />
          FINALIZE
        </button>
      </div>
    </div>
  );
};
