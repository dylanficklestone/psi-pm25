import React, { useEffect, useRef } from 'react';

interface WeatherAtmosphereProps {
  hazeIntensity: number; // 0 (clear) to 1 (dense)
  weatherMode?: 'live' | 'clear' | 'hazy' | 'humid' | 'rainy';
}

export const WeatherAtmosphere: React.FC<WeatherAtmosphereProps> = ({
  hazeIntensity,
  weatherMode = 'live',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Compute effective haze level
  const effectiveHaze = React.useMemo(() => {
    if (weatherMode === 'clear') return 0.05;
    if (weatherMode === 'hazy') return 0.9;
    if (weatherMode === 'humid') return 0.35;
    if (weatherMode === 'rainy') return 0.4;
    return Math.max(0, Math.min(1, hazeIntensity));
  }, [weatherMode, hazeIntensity]);

  const isRainy = weatherMode === 'rainy';

  // Particle simulation on canvas for haze particulates or raindrops
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Number of particles proportional to haze or rain
    const particleCount = isRainy
      ? 120
      : Math.floor(20 + effectiveHaze * 100);

    interface Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      length?: number;
    }

    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: isRainy ? 1.5 : Math.random() * 2.5 + 1,
        speedX: isRainy ? -1.5 : (Math.random() - 0.3) * 0.4,
        speedY: isRainy ? Math.random() * 8 + 12 : (Math.random() - 0.5) * 0.2,
        opacity: Math.random() * 0.4 + 0.1,
        length: isRainy ? Math.random() * 18 + 10 : 0,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Only draw particulate particles if there is noticeable haze or rain
      if (effectiveHaze > 0.15 || isRainy) {
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];

          if (isRainy) {
            // Draw rain streak
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x + p.speedX * 2, p.y + (p.length || 15));
            ctx.strokeStyle = `rgba(186, 230, 253, ${p.opacity * 0.6})`;
            ctx.lineWidth = p.size;
            ctx.stroke();

            p.x += p.speedX;
            p.y += p.speedY;

            if (p.y > height) {
              p.y = -20;
              p.x = Math.random() * width;
            }
          } else {
            // Draw floating haze particulate / smoke mote
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            // Particulate color: warm amber/sepia smoke dust
            const alpha = p.opacity * Math.min(0.6, effectiveHaze * 0.7);
            ctx.fillStyle = `rgba(245, 158, 11, ${alpha})`;
            ctx.fill();

            p.x += p.speedX;
            p.y += p.speedY;

            if (p.x > width) p.x = 0;
            if (p.x < 0) p.x = width;
            if (p.y > height) p.y = 0;
            if (p.y < 0) p.y = height;
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [effectiveHaze, isRainy]);

  return (
    <div
      className="fixed inset-0 pointer-events-none -z-5 overflow-hidden transition-opacity duration-1000"
      aria-hidden="true"
    >
      {/* Dynamic Particulate Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Volumetric Haze Mist Layer 1 - Lower Bay Mist */}
      {effectiveHaze > 0.2 && (
        <div
          className="absolute bottom-16 -left-[20%] w-[140%] h-64 blur-2xl animate-haze-slow pointer-events-none transition-opacity duration-1000"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(180, 83, 9, 0.22) 0%, rgba(120, 53, 15, 0.12) 50%, transparent 80%)',
            opacity: Math.min(0.9, effectiveHaze * 0.95),
          }}
        />
      )}

      {/* Volumetric Haze Mist Layer 2 - Skyline Mid-Elevation Smoke Drift */}
      {effectiveHaze > 0.35 && (
        <div
          className="absolute bottom-36 -right-[20%] w-[140%] h-80 blur-3xl animate-haze-fast pointer-events-none transition-opacity duration-1000"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(146, 64, 14, 0.25) 0%, rgba(180, 83, 9, 0.14) 45%, transparent 75%)',
            opacity: Math.min(0.85, (effectiveHaze - 0.2) * 1.1),
          }}
        />
      )}

      {/* Volumetric Haze Mist Layer 3 - Severe Smog Cap */}
      {effectiveHaze > 0.65 && (
        <div
          className="absolute inset-0 bg-amber-950/20 blur-xl pointer-events-none transition-opacity duration-1000 animate-pulse-subtle"
          style={{
            opacity: (effectiveHaze - 0.5) * 1.3,
          }}
        />
      )}

      {/* Screen Tint Scrim for Severe Haze */}
      {effectiveHaze > 0.5 && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-1000 mix-blend-color"
          style={{
            backgroundColor: '#78350f',
            opacity: (effectiveHaze - 0.4) * 0.4,
          }}
        />
      )}
    </div>
  );
};
