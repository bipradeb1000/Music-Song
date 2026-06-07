import React, { useRef, useEffect } from "react";

interface WaveformVisualizerProps {
  analyser: AnalyserNode | null;
  isPlaying: boolean;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({ analyser, isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animationId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas resolution
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const bufferLength = analyser ? analyser.frequencyBinCount : 64;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationId = requestAnimationFrame(draw);

      const width = rect.width;
      const height = rect.height;

      // Draw elegant semi-transparent dark background sweep to create trailing neon glow
      ctx.fillStyle = "rgba(10, 15, 30, 0.25)";
      ctx.fillRect(0, 0, width, height);

      let hasSignal = false;
      if (analyser) {
        analyser.getByteFrequencyData(dataArray);
        // Check if any frequency has a signal indicating active playing (threshold > 4 to filter quiet buzz)
        for (let i = 0; i < bufferLength; i++) {
          if (dataArray[i] > 4) {
            hasSignal = true;
            break;
          }
        }
      }

      if (analyser && (isPlaying || hasSignal)) {
        const barWidth = (width / bufferLength) * 1.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const percent = dataArray[i] / 255;
          const barHeight = percent * height * 0.95;

          // Multi-color ocean blue to sky blue gradient
          const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
          gradient.addColorStop(0, "rgba(29, 78, 216, 0.95)");  // Deep royal blue
          gradient.addColorStop(0.5, "rgba(37, 99, 235, 0.85)"); // vibrant blue
          gradient.addColorStop(1, "rgba(96, 165, 250, 0.95)");  // Neon light blue

          ctx.fillStyle = gradient;
          
          // Draw rounded bars
          ctx.beginPath();
          ctx.roundRect(x, height - barHeight, barWidth - 2, barHeight, [3, 3, 0, 0]);
          ctx.fill();

          x += barWidth;
        }

        // Draw horizontal pulsing ambient line
        ctx.strokeStyle = "rgba(59, 130, 246, 0.45)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        for (let i = 0; i < width; i += 8) {
          const val = dataArray[Math.floor((i / width) * bufferLength)] || 10;
          const offset = (val / 255) * 18 * Math.sin(i * 0.05 + Date.now() * 0.005);
          ctx.lineTo(i, height / 2 + offset);
        }
        ctx.stroke();

      } else {
        // Draw idle beautiful wave animation
        ctx.strokeStyle = "rgba(59, 130, 246, 0.25)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, height - 10);
        
        for (let i = 0; i < width; i++) {
          const y = height / 2 + Math.sin(i * 0.03 + Date.now() * 0.003) * 10 * Math.sin(Date.now() * 0.001);
          ctx.lineTo(i, y);
        }
        ctx.stroke();

        // Elegant centered status string
        ctx.fillStyle = "rgba(148, 163, 184, 0.65)";
        ctx.font = "11px jetbrainsMono, monospace";
        ctx.textAlign = "center";
        ctx.fillText("TAP PLAY TO ACTIVATE ANALYSIS", width / 2, height / 2 + 4);
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [analyser, isPlaying]);

  return (
    <div className="w-full h-24 bg-slate-950/80 rounded-2xl border border-blue-900/30 overflow-hidden relative shadow-inner shadow-blue-950/40">
      <div className="absolute top-2 left-3 px-2 py-0.5 rounded-full bg-blue-950/60 border border-blue-900/40 text-[9px] font-mono tracking-widest text-blue-400 font-semibold flex items-center gap-1">
        <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? "bg-emerald-500 animate-pulse" : "bg-slate-600"}`}></span>
        DYNAMIC DEVIATION ANALYZER
      </div>
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};
