import React, { useState, useEffect, useRef } from "react";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronLeft, 
  Edit3, 
  Check, 
  Download,
  Music
} from "lucide-react";
import { AudioEngine } from "../utils/audioEngine";



interface PlayerViewProps {
  engine: AudioEngine;
  bakedBuffer: AudioBuffer | null;
  onBackToEditor: () => void;
  clips: any[];
  equalizer: any;
  dynamicAudio: any;
}

export const PlayerView: React.FC<PlayerViewProps> = ({
  engine,
  bakedBuffer,
  onBackToEditor,
  clips,
  equalizer,
  dynamicAudio,
}) => {
  const [songTitle, setSongTitle] = useState("");
  const [lyrics, setLyrics] = useState(
    "[Intro]\n\n[Chorus]\nCompose your catchy song hook here...\n\n[Verse 1]\nWrite your rhythmic verses...\n\n[Chorus]\nRepeat your main chorus hook...\n\n[Outro]"
  );

  const [isEditingLyrics, setIsEditingLyrics] = useState(false);
  const [editableLyricsText, setEditableLyricsText] = useState(
    "[Intro]\n\n[Chorus]\nCompose your catchy song hook here...\n\n[Verse 1]\nWrite your rhythmic verses...\n\n[Chorus]\nRepeat your main chorus hook...\n\n[Outro]"
  );

  // Consolidated Player Playback logic
  const [isPlaying, setIsPlaying] = useState(false);
  const [playProgress, setPlayProgress] = useState(0); // in seconds
  
  const playbackSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const playStartTimeRef = useRef<number>(0);
  const pausedTimeOffsetRef = useRef<number>(0);
  const progressIntervalRef = useRef<any>(null);

  const totalDuration = bakedBuffer ? bakedBuffer.duration : 8.0;



  useEffect(() => {
    // Reset player on mount or buffer rebuild
    return () => {
      stopPlayback();
    };
  }, [bakedBuffer]);

  const startPlayback = () => {
    if (!bakedBuffer) return;
    stopPlayback();

    const ctx = engine.getContext();
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const source = ctx.createBufferSource();
    source.buffer = bakedBuffer;
    
    // Connect to standard output
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(1.0, ctx.currentTime);

    // Also connect to visualizer
    const analyser = engine.getAnalyser();
    if (analyser) {
      source.connect(masterGain);
      masterGain.connect(analyser);
    } else {
      source.connect(ctx.destination);
    }

    const startPos = pausedTimeOffsetRef.current;
    source.start(ctx.currentTime, startPos);
    
    playbackSourceRef.current = source;
    playStartTimeRef.current = ctx.currentTime - startPos;
    setIsPlaying(true);

    progressIntervalRef.current = setInterval(() => {
      const elapsed = ctx.currentTime - playStartTimeRef.current;
      if (elapsed >= totalDuration) {
        stopPlayback();
        setPlayProgress(0);
        pausedTimeOffsetRef.current = 0;
      } else {
        setPlayProgress(elapsed);
      }
    }, 50);
  };

  const pausePlayback = () => {
    if (isPlaying && playbackSourceRef.current) {
      const ctx = engine.getContext();
      pausedTimeOffsetRef.current = ctx.currentTime - playStartTimeRef.current;
      
      try {
        playbackSourceRef.current.stop();
      } catch (e) {}
      
      clearInterval(progressIntervalRef.current);
      setIsPlaying(false);
    }
  };

  const stopPlayback = () => {
    if (playbackSourceRef.current) {
      try {
        playbackSourceRef.current.stop();
      } catch (e) {}
    }
    clearInterval(progressIntervalRef.current);
    setIsPlaying(false);
    setPlayProgress(0);
    pausedTimeOffsetRef.current = 0;
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      pausePlayback();
    } else {
      startPlayback();
    }
  };

  // Apply manual text updates to state
  const handleSaveEditedLyrics = () => {
    setLyrics(editableLyricsText);
    setIsEditingLyrics(false);
  };

  // Compile full ID3 tagged WAV download
  const handleDownloadStructuredSong = () => {
    if (!bakedBuffer) return;
    try {
      // Assemble the final WAV blob having embedded ID3 USLT lyrics
      const finalBlob = engine.encodeWavWithID3Lyrics(
        bakedBuffer, 
        songTitle || "Untitled", 
        lyrics
      );
      const downloadUrl = URL.createObjectURL(finalBlob);

      const linkNode = document.createElement("a");
      linkNode.href = downloadUrl;
      
      const fileSafeTitle = (songTitle || "untitled").toLowerCase().replace(/[^a-z0-9]/gi, "_");
      linkNode.download = `${fileSafeTitle}_final.wav`;
      
      document.body.appendChild(linkNode);
      linkNode.click();
      document.body.removeChild(linkNode);
    } catch (error) {
      console.error("Audio block tagging download failed", error);
    }
  };

  return (
    <div id="player-view-container" className="flex-1 flex flex-col p-4 bg-slate-950 gap-4 justify-start pb-24">
      {/* Back button & title header */}
      <div className="flex items-center gap-2">
        <button
          id="player-back-btn"
          onClick={onBackToEditor}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-colors active:scale-95"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-500 font-mono">FINALIZING</span>
      </div>

      {/* Visual Disc Player Card representing the track */}
      <div id="final-master-disc-card" className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-5 flex flex-col items-center gap-5 relative overflow-hidden shadow-xl shadow-blue-950/20">
        <div className="absolute -right-16 -top-16 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -left-16 -bottom-16 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl"></div>
        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] pointer-events-none"></div>

        {/* Realistic Vinyl disc animation */}
        <div className="relative w-40 h-40 flex items-center justify-center z-10">
          <div 
            id="vinyl-record-disc"
            className={`w-full h-full rounded-full bg-slate-950 border-4 border-slate-800 shadow-inner flex items-center justify-center relative ${
              isPlaying ? "animate-spin" : ""
            }`}
            style={{ animationDuration: "3.5s" }}
          >
            {/* Grooves */}
            <div className="absolute inset-2 border border-slate-900/60 rounded-full"></div>
            <div className="absolute inset-5 border border-slate-900/60 rounded-full"></div>
            <div className="absolute inset-9 border border-slate-950 rounded-full"></div>
            <div className="absolute inset-12 border border-slate-950 rounded-full"></div>
            
            {/* Center Label */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-950 border border-slate-700/50 flex flex-col items-center justify-center text-[7px] font-bold text-center p-1 text-slate-100 z-10 shadow-md relative">
              <span className="uppercase tracking-widest text-[5px] text-blue-450 mb-0.5">MASTER</span>
              <span className="truncate w-full max-w-[48px] text-[7px]" title={songTitle || "YOUR"}>{songTitle || "YOUR"}</span>
              <span className="text-[5px] font-mono text-slate-400 mt-0.5">STEREO</span>
              <div className="absolute inset-x-0 inset-y-0 m-auto w-3 h-3 bg-slate-950 border border-slate-805 rounded-full shadow-inner"></div>
            </div>
          </div>
        </div>

        {/* Title Input area */}
        <div className="w-full flex flex-col items-center gap-1.5 z-20">
          <label className="text-[9px] font-mono tracking-widest text-slate-500 uppercase">RENAME FINAL SONG</label>
          <input
            id="finalize-song-title-input"
            type="text"
            value={songTitle}
            onChange={(e) => setSongTitle(e.target.value)}
            placeholder="Type song name..."
            className="w-full text-center bg-slate-950 px-3 py-1.5 border border-slate-800 rounded-xl text-md font-semibold text-white focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Scrub progress bar */}
        <div className="w-full flex flex-col gap-1 select-none z-20">
          <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden relative">
            <div 
              style={{ width: `${(playProgress / totalDuration) * 100}%` }}
              className="absolute top-0 bottom-0 left-0 bg-blue-500 rounded-full transition-all duration-75"
            ></div>
          </div>
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
            <span>{playProgress.toFixed(1)}s</span>
            <span>{totalDuration.toFixed(1)}s</span>
          </div>
        </div>

        {/* Direct Playback Controls */}
        <div className="flex items-center gap-3 z-20">
          <button
            id="final-player-reset-btn"
            onClick={stopPlayback}
            className="p-2.5 rounded-full bg-slate-850 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center active:scale-95 transition-all"
          >
            <RotateCcw size={16} />
          </button>

          <button
            id="final-player-play-btn"
            onClick={handleTogglePlay}
            className="p-4 rounded-full bg-blue-600 text-slate-950 font-bold hover:bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-900/30 active:scale-95 transition-all"
          >
            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
          </button>
        </div>
      </div>

      {/* Structured Song Lyrics Editor Panel */}
      <div id="lyrics-editor-block" className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex flex-col gap-4">
        {/* Title / Info */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-1.5">
            <Music size={14} className="text-blue-400" />
            <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">TRACK LYRICS EDITOR</span>
          </div>
          
          <div className="text-[10px] text-blue-400 font-mono flex items-center gap-1 bg-blue-950/50 px-2 py-0.5 rounded-full border border-blue-900/30">
            Form: Active
          </div>
        </div>

        {/* Lyrics box displaying current text */}
        <div id="lyrics-display-framer" className="bg-slate-950 rounded-2xl border border-slate-850 p-3.5 relative min-h-48 flex flex-col justify-between">
          
          {isEditingLyrics ? (
            <textarea
              id="lyrics-manual-editor-textarea"
              value={editableLyricsText}
              onChange={(e) => setEditableLyricsText(e.target.value)}
              rows={8}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 font-sans focus:outline-none focus:border-blue-500"
              placeholder="Write your custom lyrics here..."
            />
          ) : (
            <div id="lyrics-render-viewport" className="text-xs text-slate-300 font-medium leading-relaxed font-sans whitespace-pre-line text-center max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 py-1">
              {lyrics}
            </div>
          )}

          {/* Edit toggling bar */}
          <div className="flex items-center justify-end border-t border-slate-900/60 pt-2.5 gap-2 mt-3 select-none">
            {isEditingLyrics ? (
              <>
                <button
                  id="cancel-lyrics-edit-btn"
                  onClick={() => {
                    setEditableLyricsText(lyrics);
                    setIsEditingLyrics(false);
                  }}
                  className="py-1 px-3 rounded-lg border border-slate-800 hover:bg-slate-900 text-slate-400 text-[10px] font-mono transition-colors cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  id="save-lyrics-edit-btn"
                  onClick={handleSaveEditedLyrics}
                  className="py-1 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-slate-100 text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Check size={11} /> SAVE CHANGES
                </button>
              </>
            ) : (
              <button
                id="toggle-lyrics-edit-mode"
                onClick={() => setIsEditingLyrics(true)}
                className="py-1 px-2.5 rounded-lg border border-slate-800 hover:bg-slate-900 text-blue-400 text-[10px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Edit Lyrics Manual"
              >
                <Edit3 size={11} className="text-blue-500" />
                EDIT LYRICS TEXT
              </button>
            )}
          </div>
        </div>

        <p className="text-[10px] text-slate-500 leading-snug font-sans text-center">
          ℹ️ Your edited lyrics are directly bundled as standard <b>Unsynchronized Lyrics (USLT) Metadata tags</b> inside the WAV audio download blocks, guaranteeing player compatibility!
        </p>
      </div>

      {/* Download Action fixed down bar */}
      <div className="fixed bottom-0 left-0 right-0 sm:absolute bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent p-4 flex justify-center z-45 border-t border-slate-900/60 pb-5">
        <button
          id="player-download-trigger"
          onClick={handleDownloadStructuredSong}
          className="w-full max-w-[390px] py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold tracking-wider text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-900/40 hover:shadow-emerald-500/20 active:scale-[0.98] transition-all"
        >
          <Download size={17} />
          DOWNLOAD LYRIC-EMBEDDED SONG (.WAV)
        </button>
      </div>
    </div>
  );
};
