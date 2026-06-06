import { AudioClip, EqualizerSettings, DynamicAudioSettings } from "../types";

// Class to handle procedural sound synthesis and real-time audio playback nodes
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private eqFilters: BiquadFilterNode[] = [];
  private lowFreqFilter: BiquadFilterNode | null = null;
  private midFreqFilter: BiquadFilterNode | null = null;
  private highFreqFilter: BiquadFilterNode | null = null;
  private surroundDelay: DelayNode | null = null;
  private surroundGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  
  // Track playing sources with their individual processing nodes
  private activeSources: {
    id: string;
    source: AudioBufferSourceNode;
    gainNode: GainNode;
    eqFilters?: BiquadFilterNode[];
    lowShelf?: BiquadFilterNode;
    midPeak?: BiquadFilterNode;
    highShelf?: BiquadFilterNode;
    surroundGain?: GainNode;
    surroundDelay?: DelayNode;
  }[] = [];
  private isCurrentlyPlayingTimeline: boolean = false;
  private timelineStartTime: number = 0;
  private timelinePauseOffset: number = 0;
  private timelineTimer: any = null;

  constructor() {
    // Lazy initialization of AudioContext on user physical interaction
  }

  public getContext(): AudioContext {
    if (!this.ctx) {
      // @ts-ignore
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    return this.ctx;
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyserNode;
  }

  // Generate high-quality procedural loops to avoid external asset dependency
  public generateProceduralBuffer(type: string, duration: number = 8.0, sampleRate: number = 44100): AudioBuffer {
    const ctx = this.getContext();
    const length = sampleRate * duration;
    const buffer = ctx.createBuffer(2, length, sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    if (type === "Raga Drone") {
      // Procedural Sitar-like background drone chord
      const freq1 = 110.0; // A2
      const freq2 = 165.0; // E3 (Fifth)
      const freq3 = 220.0; // A3 (Octave)
      
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        // Warm saw-chord modulated with slowly sweeping low frequency LFOs
        const s1 = Math.sin(2 * Math.PI * freq1 * t + Math.sin(2 * Math.PI * 0.2 * t) * 0.1);
        const s2 = Math.sin(2 * Math.PI * freq2 * t + Math.cos(2 * Math.PI * 0.15 * t) * 0.15);
        const s3 = Math.sin(2 * Math.PI * freq3 * t);
        const noise = (Math.random() - 0.5) * 0.02 * Math.sin(2 * Math.PI * 5.0 * t); // subtle string buzz

        const val = (s1 * 0.4 + s2 * 0.3 + s3 * 0.2 + noise) * 0.25;
        // Apply smooth fade-in and fade-out
        let fade = 1.0;
        if (t < 0.8) fade = t / 0.8;
        if (t > duration - 0.8) fade = (duration - t) / 0.8;

        left[i] = val * fade;
        right[i] = val * 0.95 * fade; // subtle delay/difference
      }
    } else if (type === "Tabla Beat") {
      // Synthesis of classical teen-taal drum (Tabla) loop
      const bpm = 115;
      const beatLen = 60 / bpm; // duration of 1 beat
      
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const currentBeatIndex = Math.floor(t / beatLen) % 8;
        const timeInBeat = t % beatLen;

        let sampleVal = 0;

        // "Ghe" - Deep left-hand bass drum (1/4th of beats)
        if (currentBeatIndex === 0 || currentBeatIndex === 4 || currentBeatIndex === 6) {
          const bassFreq = 85 * (1.0 - timeInBeat * 3.5); // sliding pitch
          if (timeInBeat < 0.25) {
            sampleVal += Math.sin(2 * Math.PI * bassFreq * timeInBeat) * 0.4 * Math.exp(-timeInBeat * 12.0);
          }
        }

        // "Ta" - Sharp right-hand dry rim sound
        if (currentBeatIndex === 2 || currentBeatIndex === 3 || currentBeatIndex === 7) {
          const tapFreq = 380;
          if (timeInBeat < 0.1) {
            sampleVal += Math.sin(2 * Math.PI * tapFreq * timeInBeat) * 0.25 * Math.exp(-timeInBeat * 42.0);
            // snapping metallic click noise
            sampleVal += (Math.random() - 0.5) * 0.12 * Math.exp(-timeInBeat * 95.0);
          }
        }

        // Bass slap / "Na"
        if (currentBeatIndex === 1 || currentBeatIndex === 5) {
          const tapFreq = 260;
          if (timeInBeat < 0.15) {
            sampleVal += Math.sin(2 * Math.PI * tapFreq * timeInBeat) * 0.3 * Math.exp(-timeInBeat * 25.0);
          }
        }

        // Add background dynamic shakers
        const shakerTick = (t % (beatLen / 2));
        sampleVal += (Math.random() - 0.5) * 0.015 * Math.exp(-shakerTick * 80.0);

        let fade = 1.0;
        if (t < 0.2) fade = t / 0.2;
        if (t > duration - 0.2) fade = (duration - t) / 0.2;

        left[i] = sampleVal * fade;
        right[i] = sampleVal * fade;
      }
    } else if (type === "Punjabi Dhol") {
      // Energetic Punjabi 125BPM heavy double-tap loop
      const bpm = 125;
      const beatLen = 60 / bpm;

      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const timeInBeat = t % beatLen;
        const currentBeatIndex = Math.floor(t / beatLen) % 4;

        let val = 0;

        // Heavy bass thud "Dhumm"
        if (currentBeatIndex === 0 || currentBeatIndex === 2) {
          const slideF = 65 * Math.exp(-timeInBeat * 4);
          if (timeInBeat < 0.4) {
            val += Math.sin(2 * Math.PI * slideF * timeInBeat) * 0.55 * Math.exp(-timeInBeat * 8);
          }
        }

        // High snappy rim sound "Chadd"
        const rimTick = (t % (beatLen / 4));
        const subSubBeat = Math.floor(t / (beatLen / 4)) % 16;
        if (subSubBeat === 2 || subSubBeat === 3 || subSubBeat === 6 || subSubBeat === 9 || subSubBeat === 14) {
          val += (Math.random() - 0.5) * 0.22 * Math.exp(-rimTick * 140.0);
          val += Math.sin(2 * Math.PI * 550 * rimTick) * 0.1 * Math.exp(-rimTick * 70.0);
        }

        let fade = 1.0;
        if (t < 0.2) fade = t / 0.2;
        if (t > duration - 0.2) fade = (duration - t) / 0.2;

        left[i] = val * fade;
        right[i] = val * fade * 0.9 + (Math.random() - 0.5) * 0.01;
      }
    } else if (type === "Sufi Flute") {
      // Elegant classical flute solo pitch synthesized melodically
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        // Melodic line: changes notes over time in Bhairavi scale
        const phraseDuration = 2.0;
        const phraseIndex = Math.floor(t / phraseDuration) % 4;
        const timeInPhrase = t % phraseDuration;

        let baseFreq = 440; // A4
        if (phraseIndex === 0) baseFreq = 440; // A4
        else if (phraseIndex === 1) baseFreq = 494; // B4
        else if (phraseIndex === 2) baseFreq = 523; // C5
        else if (phraseIndex === 3) baseFreq = 587; // D5

        // Simple slide/glide from previous note
        if (timeInPhrase < 0.3) {
          let prevFreq = 440;
          if (phraseIndex === 1) prevFreq = 440;
          if (phraseIndex === 2) prevFreq = 494;
          if (phraseIndex === 3) prevFreq = 523;
          if (phraseIndex === 0) prevFreq = 587;
          
          const ratio = timeInPhrase / 0.3;
          baseFreq = prevFreq + (baseFreq - prevFreq) * ratio;
        }

        // Add natural breathy vibrato and LFO tremolo
        const vibrato = Math.sin(2 * Math.PI * 6.5 * t) * 4.0;
        const breathOsc = (Math.random() - 0.5) * 0.08 * Math.sin(2 * Math.PI * baseFreq * t);
        const wave = Math.sin(2 * Math.PI * (baseFreq + vibrato) * t);
        
        let sampleVal = (wave * 0.3 + breathOsc * 0.25);

        // Breath attack at start of note
        if (timeInPhrase < 0.15) {
          const attackRatio = timeInPhrase / 0.15;
          sampleVal *= attackRatio;
          sampleVal += (Math.random() - 0.5) * 0.05 * (1.0 - attackRatio);
        }

        // Note release at end of note
        if (timeInPhrase > phraseDuration - 0.25) {
          const releaseRatio = (phraseDuration - timeInPhrase) / 0.25;
          sampleVal *= releaseRatio;
        }

        let fade = 1.0;
        if (t < 0.2) fade = t / 0.2;
        if (t > duration - 0.2) fade = (duration - t) / 0.2;

        left[i] = sampleVal * fade;
        right[i] = sampleVal * fade;
      }
    } else {
      // Default: Pinkish acoustic sweeping noise pad
      let lastOut = 0.0;
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const white = Math.random() - 0.5;
        // LPF formulation
        lastOut = 0.992 * lastOut + 0.008 * white;
        let val = lastOut * 1.5 * Math.sin(2 * Math.PI * 1.5 * t);
        
        left[i] = val;
        right[i] = val;
      }
    }

    return buffer;
  }

  // Helper to build a processing chain for a single source node with its specific Equalizer and Dynamic Audio settings.
  public buildClipAudioChain(
    source: AudioBufferSourceNode,
    trackGain: GainNode,
    eq: EqualizerSettings,
    dyn: DynamicAudioSettings,
    destination: AudioNode
  ) {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    source.connect(trackGain);
    let lastNode: AudioNode = trackGain;

    const eqFilters: BiquadFilterNode[] = [];
    const freqs = [60, 230, 910, 3600, 14000];
    const bands = [eq.hz60, eq.hz230, eq.hz910, eq.hz3600, eq.hz14000];
    const extraBass = eq.isBassBoost ? 6 : 0;

    freqs.forEach((f, idx) => {
      const filter = ctx.createBiquadFilter();
      filter.type = "peaking";
      filter.Q.setValueAtTime(1.0, now);
      filter.frequency.setValueAtTime(f, now);
      
      let gainVal = bands[idx];
      if (eq.isEnabled) {
        if (idx === 0) gainVal += extraBass;
        if (idx === 1) gainVal += extraBass * 0.5;
      } else {
        gainVal = 0; // bypassed
      }
      
      gainVal = Math.max(-12, Math.min(12, gainVal));
      filter.gain.setValueAtTime(gainVal, now);

      lastNode.connect(filter);
      lastNode = filter;
      eqFilters.push(filter);
    });

    const gainToDb = (mult: number) => 20 * Math.log10(Math.max(0.01, mult));

    const lowShelf = ctx.createBiquadFilter();
    lowShelf.type = "lowshelf";
    lowShelf.frequency.setValueAtTime(250, now);
    lowShelf.gain.setValueAtTime(gainToDb(dyn.lowFreq), now);
    lastNode.connect(lowShelf);
    lastNode = lowShelf;

    const midPeak = ctx.createBiquadFilter();
    midPeak.type = "peaking";
    midPeak.frequency.setValueAtTime(1500, now);
    midPeak.Q.setValueAtTime(0.5, now);
    midPeak.gain.setValueAtTime(gainToDb(dyn.medFreq), now);
    lastNode.connect(midPeak);
    lastNode = midPeak;

    const highShelf = ctx.createBiquadFilter();
    highShelf.type = "highshelf";
    highShelf.frequency.setValueAtTime(4000, now);
    highShelf.gain.setValueAtTime(gainToDb(dyn.highFreq), now);
    lastNode.connect(highShelf);
    lastNode = highShelf;

    // We ALWAYS create the surround delay nodes so we can switch them ON/OFF dynamically
    const surroundDelay = ctx.createDelay(1.0);
    const surroundGain = ctx.createGain();
    const panner = ctx.createStereoPanner();
    panner.pan.setValueAtTime(1.0, now);

    if (eq.isEnabled && eq.isSurroundSound) {
      surroundDelay.delayTime.setValueAtTime(0.025, now);
      surroundGain.gain.setValueAtTime(0.7, now);
    } else {
      surroundDelay.delayTime.setValueAtTime(0.005, now);
      surroundGain.gain.setValueAtTime(0.0, now);
    }

    // Connect both lines to destination
    lastNode.connect(destination);

    lastNode.connect(surroundDelay);
    surroundDelay.connect(surroundGain);
    surroundGain.connect(panner);
    panner.connect(destination);

    return {
      eqFilters,
      lowShelf,
      midPeak,
      highShelf,
      surroundDelay,
      surroundGain,
    };
  }

  // Update dynamic fader values in real-time during live playlist playback
  public updateActiveClipParams(
    clipId: string,
    eq: EqualizerSettings,
    dyn: DynamicAudioSettings
  ) {
    const activeInfo = this.activeSources.find((s) => s.id === clipId);
    if (!activeInfo) return;

    const ctx = this.getContext();
    const now = ctx.currentTime;
    const safeDb = (g: number) => Math.max(-12, Math.min(12, g));
    const gainToDb = (mult: number) => 20 * Math.log10(Math.max(0.01, mult));

    if (activeInfo.eqFilters && activeInfo.eqFilters.length === 5) {
      if (eq.isEnabled) {
        const extraBass = eq.isBassBoost ? 6 : 0;
        activeInfo.eqFilters[0].gain.setTargetAtTime(safeDb(eq.hz60 + extraBass), now, 0.05);
        activeInfo.eqFilters[1].gain.setTargetAtTime(safeDb(eq.hz230 + extraBass * 0.5), now, 0.05);
        activeInfo.eqFilters[2].gain.setTargetAtTime(safeDb(eq.hz910), now, 0.05);
        activeInfo.eqFilters[3].gain.setTargetAtTime(safeDb(eq.hz3600), now, 0.05);
        activeInfo.eqFilters[4].gain.setTargetAtTime(safeDb(eq.hz14000), now, 0.05);
      } else {
        activeInfo.eqFilters.forEach((f) => f.gain.setTargetAtTime(0, now, 0.05));
      }
    }

    if (activeInfo.lowShelf) {
      activeInfo.lowShelf.gain.setTargetAtTime(gainToDb(dyn.lowFreq), now, 0.05);
    }
    if (activeInfo.midPeak) {
      activeInfo.midPeak.gain.setTargetAtTime(gainToDb(dyn.medFreq), now, 0.05);
    }
    if (activeInfo.highShelf) {
      activeInfo.highShelf.gain.setTargetAtTime(gainToDb(dyn.highFreq), now, 0.05);
    }

    if (activeInfo.surroundGain && activeInfo.surroundDelay) {
      if (eq.isEnabled && eq.isSurroundSound) {
        activeInfo.surroundDelay.delayTime.setTargetAtTime(0.025, now, 0.05);
        activeInfo.surroundGain.gain.setTargetAtTime(0.7, now, 0.05);
      } else {
        activeInfo.surroundDelay.delayTime.setTargetAtTime(0.005, now, 0.05);
        activeInfo.surroundGain.gain.setTargetAtTime(0.0, now, 0.05);
      }
    }
  }

  // Set up the simple, hardware-friendly master output stream routing
  public initializeRouteNodes(
    eqSettings: EqualizerSettings,
    dynamicAudioSettings: DynamicAudioSettings
  ) {
    const ctx = this.getContext();

    if (!this.masterGain) {
      this.masterGain = ctx.createGain();
      this.masterGain.gain.setValueAtTime(1.0, ctx.currentTime);

      this.analyserNode = ctx.createAnalyser();
      this.analyserNode.fftSize = 128;

      // Clean master path: masterGain directly enters analyser then destination
      this.masterGain.connect(this.analyserNode);
      this.analyserNode.connect(ctx.destination);
    }
  }

  // Backwards compatibility method for simple direct update
  public updateAudioNodesParams(
    eq: EqualizerSettings,
    dyn: DynamicAudioSettings
  ) {
    // This is now handled independently per-clip, so this functions as a master fallback
  }

  // Play custom timeline clips
  public playTimeline(
    clips: AudioClip[],
    eqSettings: EqualizerSettings,
    dynamicAudioSettings: DynamicAudioSettings,
    onProgress: (currentTime: number) => void,
    onEnded: () => void,
    startPos: number = 0
  ) {
    this.stopPlayingTimeline();
    
    const ctx = this.getContext();
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    this.initializeRouteNodes(eqSettings, dynamicAudioSettings);

    const timelineLen = this.getTimelineLength(clips);
    if (startPos >= timelineLen) {
      onEnded();
      return;
    }

    this.isCurrentlyPlayingTimeline = true;
    this.timelineStartTime = ctx.currentTime - startPos;
    this.timelinePauseOffset = startPos;

    clips.forEach((clip) => {
      // Calculate start and end offsets relative to current timeline playhead index
      const clipStartOnTimeline = clip.startOffset;
      const clipDurationOnTimeline = clip.durationInCut / clip.speed;
      const clipEndOnTimeline = clipStartOnTimeline + clipDurationOnTimeline;

      // Skip clips that have fully played prior to current playhead
      if (clipEndOnTimeline <= startPos) {
        return;
      }

      const source = ctx.createBufferSource();
      source.buffer = clip.buffer;
      source.playbackRate.value = clip.speed;

      const trackGain = ctx.createGain();
      trackGain.gain.setValueAtTime(1.0, ctx.currentTime);

      // Resolve specific clip settings, fell back to defaults if not added yet
      const eq = clip.equalizer || eqSettings;
      const dyn = clip.dynamicAudio || dynamicAudioSettings;

      // Build chain and get processing nodes
      const nodes = this.buildClipAudioChain(source, trackGain, eq, dyn, this.masterGain!);

      // Calculate where inside clip to start playing based on current playing offset
      let delayToPlay = 0; // seconds from now to call start()
      let startOffsetInClip = clip.startInCut; // offset inside actual clip sample array

      if (clipStartOnTimeline >= startPos) {
        // Future clip - schedule it
        delayToPlay = clipStartOnTimeline - startPos;
      } else {
        // Active clip - slice it mid-way
        const elapsedInsideClipOnTimeline = startPos - clipStartOnTimeline;
        startOffsetInClip += elapsedInsideClipOnTimeline * clip.speed;
      }

      source.start(ctx.currentTime + delayToPlay, startOffsetInClip, remainingDurationInCut(clip, startOffsetInClip));

      this.activeSources.push({
        id: clip.id,
        source,
        gainNode: trackGain,
        ...nodes
      });
    });

    const checkInterval = 100; // ms
    this.timelineTimer = setInterval(() => {
      const currentPos = ctx.currentTime - this.timelineStartTime;
      onProgress(currentPos);
      if (currentPos >= timelineLen + 0.2) {
        this.stopPlayingTimeline();
        onEnded();
      }
    }, checkInterval);
  }

  public stopPlayingTimeline() {
    this.isCurrentlyPlayingTimeline = false;
    clearInterval(this.timelineTimer);
    this.activeSources.forEach(({ source }) => {
      try {
        source.stop();
      } catch (e) {}
    });
    this.activeSources = [];
  }

  // Length calculation helper
  public getTimelineLength(clips: AudioClip[]): number {
    if (clips.length === 0) return 0;
    return Math.max(...clips.map((c) => c.startOffset + c.durationInCut / c.speed));
  }

  // Slices/Splits a clip on the timeline
  public splitClip(clips: AudioClip[], clipId: string, splitPoint: number): AudioClip[] {
    const clipIndex = clips.findIndex((c) => c.id === clipId);
    if (clipIndex === -1) return clips;

    const clip = clips[clipIndex];
    if (splitPoint <= clip.startOffset || splitPoint >= (clip.startOffset + clip.durationInCut / clip.speed)) {
      return clips; // Split is out of bounds
    }

    const elapsedOnTimeline = splitPoint - clip.startOffset;
    const elapsedInClip = elapsedOnTimeline * clip.speed;

    // Clip 1: Left segment
    const clipLeft: AudioClip = {
      ...clip,
      id: `${clip.id}-left-${Date.now()}`,
      durationInCut: elapsedInClip,
    };

    // Clip 2: Right segment
    const clipRight: AudioClip = {
      ...clip,
      id: `${clip.id}-right-${Date.now()}`,
      startOffset: splitPoint,
      startInCut: clip.startInCut + elapsedInClip,
      durationInCut: clip.durationInCut - elapsedInClip,
    };

    const newClips = [...clips];
    newClips.splice(clipIndex, 1, clipLeft, clipRight);
    return newClips;
  }

  // Create a single consolidated raw stereo audio compound buffer from active channel components (Baking)
  public async bakeAndCompileTimeline(
    clips: AudioClip[],
    eqSettings: EqualizerSettings,
    dynamicAudioSettings: DynamicAudioSettings
  ): Promise<AudioBuffer> {
    const totalDuration = this.getTimelineLength(clips) || 2.0; // clamp empty to 2.0s
    const sampleRate = 44100;
    
    // Web Audio Offline Audio Context handles hardware-independent audio baking/compositing wonderfully!
    // @ts-ignore
    const OfflineCtxClass = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    const offlineCtx = new OfflineCtxClass(2, sampleRate * totalDuration, sampleRate);

    // Offline equivalent of master output node
    const offlineMasterGain = offlineCtx.createGain();
    offlineMasterGain.gain.setValueAtTime(1.0, 0);
    offlineMasterGain.connect(offlineCtx.destination);

    // Render each clip with its individual processing pipeline to the offline context
    clips.forEach((clip) => {
      const source = offlineCtx.createBufferSource();
      source.buffer = clip.buffer;
      source.playbackRate.setValueAtTime(clip.speed, 0);

      const trackGain = offlineCtx.createGain();
      trackGain.gain.setValueAtTime(1.0, 0);

      // Resolve specific clip settings, fall back to defaults
      const eq = clip.equalizer || eqSettings;
      const dyn = clip.dynamicAudio || dynamicAudioSettings;

      source.connect(trackGain);
      let lastNode: AudioNode = trackGain;

      // 5-band equalizer processing per track layer
      const freqs = [60, 230, 910, 3600, 14000];
      const bands = [eq.hz60, eq.hz230, eq.hz910, eq.hz3600, eq.hz14000];
      const extraBass = eq.isBassBoost ? 6 : 0;

      freqs.forEach((f, idx) => {
        const filter = offlineCtx.createBiquadFilter();
        filter.type = "peaking";
        filter.Q.setValueAtTime(1.0, 0);
        filter.frequency.setValueAtTime(f, 0);
        
        let gainVal = bands[idx];
        if (eq.isEnabled) {
          if (idx === 0) gainVal += extraBass;
          if (idx === 1) gainVal += extraBass * 0.5;
        } else {
          gainVal = 0;
        }

        gainVal = Math.max(-12, Math.min(12, gainVal));
        filter.gain.setValueAtTime(gainVal, 0);

        lastNode.connect(filter);
        lastNode = filter;
      });

      const gainToDb = (mult: number) => 20 * Math.log10(Math.max(0.01, mult));

      // Dynamic Low Shelf
      const lowShelf = offlineCtx.createBiquadFilter();
      lowShelf.type = "lowshelf";
      lowShelf.frequency.setValueAtTime(250, 0);
      lowShelf.gain.setValueAtTime(gainToDb(dyn.lowFreq), 0);
      lastNode.connect(lowShelf);
      lastNode = lowShelf;

      // Dynamic Mid Peak
      const midPeak = offlineCtx.createBiquadFilter();
      midPeak.type = "peaking";
      midPeak.frequency.setValueAtTime(1500, 0);
      midPeak.Q.setValueAtTime(0.5, 0);
      midPeak.gain.setValueAtTime(gainToDb(dyn.medFreq), 0);
      lastNode.connect(midPeak);
      lastNode = midPeak;

      // Dynamic High Shelf
      const highShelf = offlineCtx.createBiquadFilter();
      highShelf.type = "highshelf";
      highShelf.frequency.setValueAtTime(4000, 0);
      highShelf.gain.setValueAtTime(gainToDb(dyn.highFreq), 0);
      lastNode.connect(highShelf);
      lastNode = highShelf;

      // Direct route to master output
      lastNode.connect(offlineMasterGain);

      // Haas surround delay path if activated
      if (eq.isEnabled && eq.isSurroundSound) {
        const offDelay = offlineCtx.createDelay(1.0);
        offDelay.delayTime.setValueAtTime(0.025, 0);

        const offSurroundGain = offlineCtx.createGain();
        offSurroundGain.gain.setValueAtTime(0.7, 0);

        const panner = offlineCtx.createStereoPanner();
        panner.pan.setValueAtTime(1.0, 0);

        lastNode.connect(offDelay);
        offDelay.connect(offSurroundGain);
        offSurroundGain.connect(panner);
        panner.connect(offlineMasterGain);
      }

      // Start timing
      source.start(
        clip.startOffset,
        clip.startInCut,
        clip.durationInCut / clip.speed
      );
    });

    return await offlineCtx.startRendering();
  }

  // WAV compilation with embedded ID3v2 container containing lyrics metadata, cover art and background wallpaper
  public encodeWavWithID3Lyrics(
    buffer: AudioBuffer,
    title: string,
    lyrics: string,
    coverDataUrl?: string,
    wallpaperDataUrl?: string
  ): Blob {
    const numOfChan = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // Uncompressed integer PCM
    const bitDepth = 16;
    
    // Step 1: Pack 16-bit audio data
    const resultChannelData = [];
    let samplesLength = buffer.length;
    for (let c = 0; c < numOfChan; c++) {
      resultChannelData.push(buffer.getChannelData(c));
    }

    const dataBuffer = new ArrayBuffer(samplesLength * numOfChan * 2);
    const dataView = new DataView(dataBuffer);
    let offset = 0;

    for (let i = 0; i < samplesLength; i++) {
      for (let c = 0; c < numOfChan; c++) {
        let sample = resultChannelData[c][i];
        // clip amplitude safely
        sample = Math.max(-1.0, Math.min(1.0, sample));
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        dataView.setInt16(offset, intSample, true);
        offset += 2;
      }
    }

    // Step 2: Build standard ID3v2.3 tag containing lyrics (USLT) and Title (TIT2) in UTF-16 with BOM for 100% Android player support of all languages
    const titleBytes = stringToUtf16BEWithBOM(title);
    const lyricsBytes = stringToUtf16BEWithBOM(lyrics);

    // Frame TIT2 Frame: Frame ID (4B), Size (4B), Flags (2B), Text Encoding (1B, 1=UTF-16), String Bytes
    const tit2FrameHeaderSize = 10;
    const tit2ContentSize = 1 + titleBytes.length; // encoding byte + string length
    const tit2FrameBytes = new Uint8Array(tit2FrameHeaderSize + tit2ContentSize);
    // Write frame ID "TIT2"
    writeStringToBytes(tit2FrameBytes, 0, "TIT2");
    // Write size (excluding header)
    writeUint32BE(tit2FrameBytes, 4, tit2ContentSize);
    // Flags: 00 00
    tit2FrameBytes[8] = 0x00;
    tit2FrameBytes[9] = 0x00;
    tit2FrameBytes[10] = 0x01; // UTF-16 with BOM
    tit2FrameBytes.set(titleBytes, 11);

    // Frame USLT (Unsynchronized lyrics) Frame:
    // ID (4B), Size (4B), Flags (2B), Text Encoding (1B, 1=UTF-16), Language (3B, 'eng'), Content Desc (2B Unicode double Null terminator), String Bytes
    const usltFrameHeaderSize = 10;
    const usltContentSize = 1 + 3 + 2 + lyricsBytes.length; // encoding + language + body null descriptor for UTF-16 (2B) + string length
    const usltFrameBytes = new Uint8Array(usltFrameHeaderSize + usltContentSize);
    writeStringToBytes(usltFrameBytes, 0, "USLT");
    writeUint32BE(usltFrameBytes, 4, usltContentSize);
    usltFrameBytes[8] = 0x00;
    usltFrameBytes[9] = 0x00;
    usltFrameBytes[10] = 0x01; // UTF-16 with BOM
    writeStringToBytes(usltFrameBytes, 11, "eng"); // standard language tag
    usltFrameBytes[14] = 0x00; // empty descriptor null bytes for UTF-16
    usltFrameBytes[15] = 0x00;
    usltFrameBytes.set(lyricsBytes, 16);

    // Build lists of frames to combine
    const framesToCombine: Uint8Array[] = [tit2FrameBytes, usltFrameBytes];

    if (coverDataUrl) {
      const coverFrame = buildApicFrame(coverDataUrl, 0x03, "Front Cover");
      if (coverFrame) {
        framesToCombine.push(coverFrame);
      }
    }

    if (wallpaperDataUrl) {
      const wallpaperFrame = buildApicFrame(wallpaperDataUrl, 0x04, "Wallpaper Background");
      if (wallpaperFrame) {
        framesToCombine.push(wallpaperFrame);
      }
    }

    // Sum up tag sizes
    let totalTagFramesSize = 0;
    for (const frame of framesToCombine) {
      totalTagFramesSize += frame.length;
    }

    const id3HeaderSize = 10;
    const id3TagBytes = new Uint8Array(id3HeaderSize + totalTagFramesSize);
    
    // ID3 Header: "ID3" (3B), Major Version (1B, 3), Micro Version (1B, 0), Flags (1B, 0), Size (4B Synchsafe)
    writeStringToBytes(id3TagBytes, 0, "ID3");
    id3TagBytes[3] = 0x03; // ID3v2.3
    id3TagBytes[4] = 0x00;
    id3TagBytes[5] = 0x00; // Flags
    writeSynchsafeUInt32(id3TagBytes, 6, totalTagFramesSize);

    // Copy frames to main ID3 container
    let offsetInTag = id3HeaderSize;
    for (const frame of framesToCombine) {
      id3TagBytes.set(frame, offsetInTag);
      offsetInTag += frame.length;
    }

    // Step 3: Build RIFF WAV byte format with subchunks: "fmt ", "ID3 " (containing ID3v2 tags), and "data" (audio samples)
    const id3PaddingLength = id3TagBytes.length % 2; // RIFF chunks must be 2-byte aligned
    const id3ChunkHeaderSize = 8;
    const dataChunkHeaderSize = 8;
    const riffHeaderAndFmtChunkSize = 36; // RIFF + WAVE + fmt header/body = 12 + 24 = 36

    // Total file size after "RIFF" (4 bytes) and FileSize (4 bytes):
    // "WAVE" (4) + "fmt " chunk (8 + 16 = 24) + "ID3 " chunk (8 + id3TagBytes.length + id3PaddingLength) + "data" chunk (8 + dataBuffer.byteLength)
    const totalRiffLength = 4 + 24 + id3ChunkHeaderSize + id3TagBytes.length + id3PaddingLength + dataChunkHeaderSize + dataBuffer.byteLength;

    const wavHeaderBuffer = new ArrayBuffer(riffHeaderAndFmtChunkSize + id3ChunkHeaderSize);
    const wavView = new DataView(wavHeaderBuffer);

    // 1. RIFF Header
    writeStringToDataView(wavView, 0, "RIFF");
    wavView.setUint32(4, totalRiffLength, true); // Total length after 'RIFF'
    writeStringToDataView(wavView, 8, "WAVE");

    // 2. fmt Subchunk
    writeStringToDataView(wavView, 12, "fmt ");
    wavView.setUint32(16, 16, true);
    wavView.setUint16(20, format, true);
    wavView.setUint16(22, numOfChan, true);
    wavView.setUint32(24, sampleRate, true);
    wavView.setUint32(28, sampleRate * numOfChan * (bitDepth / 8), true);
    wavView.setUint16(32, numOfChan * (bitDepth / 8), true);
    wavView.setUint16(34, bitDepth, true);

    // 3. ID3 Subchunk Header (RIFF spec expects uppercase "ID3 ")
    writeStringToDataView(wavView, 36, "ID3 "); 
    wavView.setUint32(40, id3TagBytes.length, true); // size of ID3 content

    const dataChunkHeaderBuffer = new ArrayBuffer(dataChunkHeaderSize);
    const dataChunkHeaderView = new DataView(dataChunkHeaderBuffer);
    writeStringToDataView(dataChunkHeaderView, 0, "data");
    dataChunkHeaderView.setUint32(4, dataBuffer.byteLength, true);

    // Prepend id3TagBytes at byte 0 of the final blob parts, and also embed it as a WAV subchunk.
    // This allows player clients checking index 0 (like Pulsar, Musicolet, BlackPlayer, ExoPlayer)
    // to discover and load it immediately, while keeping container-based audio tools working!
    const parts: (ArrayBuffer | Uint8Array)[] = [
      id3TagBytes,      // PREPENDED ID3v2 CONTAINER (Byte 0, absolute best for Android players!)
      wavHeaderBuffer,  // Standard WAV header
      id3TagBytes       // Embedded subchunk (for strict WAV/RIFF compliance)
    ];

    if (id3PaddingLength > 0) {
      parts.push(new Uint8Array(1)); // 0x00 padding byte to keep 16-bit alignment
    }

    parts.push(dataChunkHeaderBuffer);
    parts.push(dataBuffer);

    return new Blob(parts, { type: "audio/wav" });
  }
}

// Helper to convert data URL containing base64 data back to raw byte buffer for ID3 metadata embedding
function dataURLToBytes(dataUrl: string): { mimeType: string; bytes: Uint8Array } | null {
  try {
    const parts = dataUrl.split(",");
    if (parts.length !== 2) return null;
    const meta = parts[0];
    const mimeMatch = meta.match(/data:(image\/[a-z0-9\-+.]+);base64/i);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
    const base64Str = parts[1];
    
    const binaryStr = atob(base64Str);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return { mimeType, bytes };
  } catch (e) {
    console.error("Failed to decode base64 data URL to bytes", e);
    return null;
  }
}

// Builds the raw byte structure for an ID3v2 APIC (Attached Picture) metadata header frame
function buildApicFrame(imageDataUrl: string, picType: number, description: string): Uint8Array | null {
  if (!imageDataUrl) return null;
  
  const decoded = dataURLToBytes(imageDataUrl);
  if (!decoded) return null;
  
  const { mimeType, bytes: picBytes } = decoded;
  const mimeBytes = stringToLatin1Bytes(mimeType);
  const descBytes = stringToLatin1Bytes(description);
  
  const headerSize = 10;
  // Content size: 1 byte (encoding: 0 for ISO-8859-1) + mimeBytes.length + 1 null byte + 1 byte (picType) + descBytes.length + 1 null byte + picture body bytes
  const apicContentSize = 1 + mimeBytes.length + 1 + 1 + descBytes.length + 1 + picBytes.length;
  
  const apicFrameBytes = new Uint8Array(headerSize + apicContentSize);
  
  // Tag ID "APIC"
  writeStringToBytes(apicFrameBytes, 0, "APIC");
  
  // Frame size excluding the frame header itself
  writeUint32BE(apicFrameBytes, 4, apicContentSize);
  
  // Custom flags (00 00)
  apicFrameBytes[8] = 0x00;
  apicFrameBytes[9] = 0x00;
  
  let contentOffset = headerSize;
  
  // Text encoding (0: ISO-8859-1 / Latin1)
  apicFrameBytes[contentOffset] = 0x00;
  contentOffset += 1;
  
  // MIME string + Null term
  apicFrameBytes.set(mimeBytes, contentOffset);
  contentOffset += mimeBytes.length;
  apicFrameBytes[contentOffset] = 0x00;
  contentOffset += 1;
  
  // Picture type byte (e.g., 0x03 for front cover, 0x04 for back cover)
  apicFrameBytes[contentOffset] = picType;
  contentOffset += 1;
  
  // Description string + Null term
  apicFrameBytes.set(descBytes, contentOffset);
  contentOffset += descBytes.length;
  apicFrameBytes[contentOffset] = 0x00;
  contentOffset += 1;
  
  // Physical picture bytes
  apicFrameBytes.set(picBytes, contentOffset);
  
  return apicFrameBytes;
}

// Math/duration helpers
function remainingDurationInCut(clip: AudioClip, currentOffset: number): number {
  const elapsedInsideBuffer = currentOffset - clip.startInCut;
  const remainingInClip = clip.durationInCut - (elapsedInsideBuffer / clip.speed);
  return Math.max(0, remainingInClip);
}

// Binary conversion helpers
function stringToUtf16BEWithBOM(str: string): Uint8Array {
  const bytes = new Uint8Array(2 + str.length * 2);
  bytes[0] = 0xFE;
  bytes[1] = 0xFF;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    bytes[2 + i * 2] = (code >> 8) & 0xff;
    bytes[2 + i * 2 + 1] = code & 0xff;
  }
  return bytes;
}

function stringToLatin1Bytes(str: string): Uint8Array {
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    bytes[i] = charCode < 256 ? charCode : 63; // fallback to '?' for non-ansi
  }
  return bytes;
}

function stringToUtf8Bytes(str: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(str);
}

function writeStringToBytes(target: Uint8Array, offset: number, value: string) {
  for (let i = 0; i < value.length; i++) {
    target[offset + i] = value.charCodeAt(i);
  }
}

function writeStringToDataView(view: DataView, offset: number, value: string) {
  for (let i = 0; i < value.length; i++) {
    view.setUint8(offset + i, value.charCodeAt(i));
  }
}

function writeUint32BE(target: Uint8Array, offset: number, value: number) {
  target[offset] = (value >> 24) & 0xff;
  target[offset + 1] = (value >> 16) & 0xff;
  target[offset + 2] = (value >> 8) & 0xff;
  target[offset + 3] = value & 0xff;
}

function writeSynchsafeUInt32(target: Uint8Array, offset: number, value: number) {
  // ID3 uses 7-bit bytes to denote sizes to prevent emulator glitches
  target[offset] = (value >> 21) & 0x7f;
  target[offset + 1] = (value >> 14) & 0x7f;
  target[offset + 2] = (value >> 7) & 0x7f;
  target[offset + 3] = value & 0x7f;
}
