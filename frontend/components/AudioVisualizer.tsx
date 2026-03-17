'use client';
import { useRef, useEffect } from 'react';

interface AudioVisualizerProps {
  audioData: Uint8Array | null;
  isActive: boolean;
  width?: number;
  height?: number;
}

export default function AudioVisualizer({ audioData, isActive, width = 300, height = 48 }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = 'rgb(15, 23, 42)';
      ctx.fillRect(0, 0, width, height);

      if (!audioData || !isActive) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgb(71, 85, 105)';
        ctx.lineWidth = 1.5;
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
        return;
      }

      ctx.beginPath();
      ctx.strokeStyle = 'rgb(59, 130, 246)';
      ctx.lineWidth = 2;
      const sliceWidth = width / audioData.length;
      let x = 0;
      for (let i = 0; i < audioData.length; i++) {
        const v = audioData[i] / 128.0;
        const y = (v * height) / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.lineTo(width, height / 2);
      ctx.stroke();
      animFrameRef.current = requestAnimationFrame(draw);
    };

    if (!isActive) {
      // Draw the flat idle line once; no animation loop needed when inactive
      draw();
      return;
    }
    animFrameRef.current = requestAnimationFrame(draw);
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [audioData, isActive, width, height]);

  return <canvas ref={canvasRef} width={width} height={height} className="rounded-lg" />;
}
