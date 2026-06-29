import { useEffect, useRef } from 'react';

interface Props {
  duration: number;
  width: number;
  height?: number;
}

export function TimelineRuler({ duration, width, height = 20 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width  = width  * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const pps = width / duration; // pixels per second

    // Choose a step that gives roughly 60–120 px between major ticks
    const rawStep = 60 / pps;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const normalized = rawStep / magnitude;
    const niceStep = normalized < 1.5 ? magnitude
                   : normalized < 3.5 ? 2 * magnitude
                   : normalized < 7.5 ? 5 * magnitude
                   : 10 * magnitude;

    const minorStep = niceStep / 5;

    ctx.font = '9px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';

    // Minor ticks
    ctx.strokeStyle = 'rgba(80,85,100,0.6)';
    ctx.lineWidth = 1;
    for (let t = 0; t <= duration + minorStep * 0.5; t += minorStep) {
      const x = (t / duration) * width;
      if (x > width) break;
      ctx.beginPath();
      ctx.moveTo(x, height);
      ctx.lineTo(x, height - 4);
      ctx.stroke();
    }

    // Major ticks + labels
    ctx.strokeStyle = 'rgba(120,130,155,0.8)';
    ctx.lineWidth = 1;
    ctx.fillStyle = 'rgba(139,145,158,0.9)';
    for (let t = 0; t <= duration + niceStep * 0.5; t += niceStep) {
      const x = Math.round((t / duration) * width);
      if (x > width + 1) break;
      ctx.beginPath();
      ctx.moveTo(x, height);
      ctx.lineTo(x, height - 8);
      ctx.stroke();
      // Label
      const label = t < 1 ? t.toFixed(2) + 's' : t.toFixed(1) + 's';
      ctx.fillText(label, x, height - 10);
    }
  }, [duration, width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height, display: 'block', userSelect: 'none' }}
    />
  );
}
