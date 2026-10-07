import React from 'react';

interface SkylineBackgroundProps {
  hazeIntensity: number; // 0 (clear) to 1 (dense haze)
  isDaytime?: boolean;
  timeOfDay?: 'day' | 'golden' | 'night' | 'auto';
  weatherEffect?: 'live' | 'clear' | 'hazy' | 'humid' | 'rainy';
}

export const SkylineBackground: React.FC<SkylineBackgroundProps> = ({
  hazeIntensity = 0.1,
  timeOfDay = 'auto',
  weatherEffect = 'live',
}) => {
  // Determine effective time of day in Singapore (UTC+8)
  const currentHourSG = React.useMemo(() => {
    const d = new Date();
    const utc = d.getTime() + d.getTimezoneOffset() * 60000;
    const sgTime = new Date(utc + 8 * 3600000);
    return sgTime.getHours();
  }, []);

  const effectiveTime = React.useMemo(() => {
    if (timeOfDay !== 'auto') return timeOfDay;
    if (currentHourSG >= 6 && currentHourSG < 18) return 'day';
    if (currentHourSG >= 18 && currentHourSG < 20) return 'golden';
    return 'night';
  }, [timeOfDay, currentHourSG]);

  // Adjust haze based on override or live
  const effectiveHaze = React.useMemo(() => {
    if (weatherEffect === 'clear') return 0.05;
    if (weatherEffect === 'hazy') return 0.85;
    return Math.max(0.05, Math.min(1, hazeIntensity));
  }, [weatherEffect, hazeIntensity]);

  // Sky gradient styling based on time of day and haze level
  const skyGradient = React.useMemo(() => {
    if (effectiveHaze > 0.6) {
      // Hazy sky: murky amber / brownish-gray overcast particulate scatter
      return 'linear-gradient(to bottom, #1f1d19 0%, #362e24 40%, #524434 75%, #3d3326 100%)';
    }

    if (effectiveTime === 'day') {
      return 'linear-gradient(to bottom, #091a2e 0%, #0d2948 45%, #143d6a 80%, #1a4a7e 100%)';
    } else if (effectiveTime === 'golden') {
      return 'linear-gradient(to bottom, #170d24 0%, #371435 45%, #59253e 75%, #73373e 100%)';
    } else {
      // Night
      return 'linear-gradient(to bottom, #030712 0%, #080d1a 50%, #0b1528 85%, #0f1c34 100%)';
    }
  }, [effectiveTime, effectiveHaze]);

  // Silhouette opacity & contrast decreases as haze gets thicker
  const silhouetteOpacity = Math.max(0.3, 1 - effectiveHaze * 0.55);
  const silhouetteFilter = `blur(${effectiveHaze * 2.5}px) brightness(${
    effectiveTime === 'night' ? 0.9 : 0.85 + effectiveHaze * 0.3
  })`;

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden select-none -z-10 transition-colors duration-1000"
      style={{ background: skyGradient }}
      aria-hidden="true"
    >
      {/* Distant atmospheric glow / sun or moon */}
      <div
        className="absolute top-12 right-[18%] w-72 h-72 rounded-full blur-3xl transition-opacity duration-700"
        style={{
          background:
            effectiveHaze > 0.5
              ? 'radial-gradient(circle, rgba(245, 158, 11, 0.25) 0%, rgba(180, 83, 9, 0.05) 70%, transparent 100%)'
              : effectiveTime === 'day'
              ? 'radial-gradient(circle, rgba(56, 189, 248, 0.2) 0%, rgba(14, 116, 144, 0.05) 70%, transparent 100%)'
              : effectiveTime === 'golden'
              ? 'radial-gradient(circle, rgba(251, 146, 60, 0.25) 0%, rgba(217, 70, 239, 0.08) 70%, transparent 100%)'
              : 'radial-gradient(circle, rgba(147, 197, 253, 0.15) 0%, rgba(59, 130, 246, 0.03) 70%, transparent 100%)',
          opacity: Math.max(0.2, 1 - effectiveHaze * 0.4),
        }}
      />

      {/* Stars (visible at night if low haze) */}
      {effectiveTime === 'night' && effectiveHaze < 0.4 && (
        <div
          className="absolute inset-0 opacity-40 mix-blend-screen"
          style={{
            backgroundImage: `radial-gradient(1px 1px at 20px 30px, #ffffff, rgba(0,0,0,0)),
              radial-gradient(1.5px 1.5px at 150px 80px, #ffffff, rgba(0,0,0,0)),
              radial-gradient(1px 1px at 320px 140px, #cbd5e1, rgba(0,0,0,0)),
              radial-gradient(1px 1px at 480px 40px, #e2e8f0, rgba(0,0,0,0)),
              radial-gradient(1.5px 1.5px at 680px 110px, #ffffff, rgba(0,0,0,0)),
              radial-gradient(1px 1px at 850px 60px, #93c5fd, rgba(0,0,0,0)),
              radial-gradient(1px 1px at 1050px 130px, #ffffff, rgba(0,0,0,0)),
              radial-gradient(1px 1px at 1280px 75px, #fef08a, rgba(0,0,0,0))`,
            backgroundRepeat: 'repeat',
            backgroundSize: '1400px 300px',
          }}
        />
      )}

      {/* Iconic Singapore Skyline Silhouette SVG */}
      <div
        className="absolute bottom-0 left-0 right-0 w-full transition-all duration-700 ease-out"
        style={{
          opacity: silhouetteOpacity,
          filter: silhouetteFilter,
        }}
      >
        <svg
          viewBox="0 0 1600 480"
          className="w-full h-auto max-h-[48vh] min-h-[220px] object-cover object-bottom"
          preserveAspectRatio="xMidYMax slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Skyline gradient fill */}
            <linearGradient id="skylineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0f172a" stopOpacity="0.95" />
              <stop offset="60%" stopColor="#090d16" stopOpacity="0.98" />
              <stop offset="100%" stopColor="#030712" stopOpacity="1" />
            </linearGradient>

            <linearGradient id="mbsLights" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.1" />
            </linearGradient>

            <linearGradient id="waterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#030712" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#020617" stopOpacity="0.98" />
            </linearGradient>

            <filter id="hazeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* BACK LAYER: Distant skyline silhouette & Raffles Place / Tanjong Pagar towers */}
          <g fill="#0b1120" opacity="0.65">
            {/* Distant Tanjong Pagar towers */}
            <rect x="20" y="240" width="35" height="200" rx="1" />
            <rect x="65" y="220" width="45" height="220" rx="1" />
            <polygon points="65,220 87,195 110,220" />
            <rect x="120" y="260" width="38" height="180" rx="1" />
            <rect x="168" y="205" width="50" height="235" rx="1" />
            <polygon points="168,205 193,175 218,205" />

            {/* Guoco Tower (tallest Singapore building) */}
            <rect x="230" y="160" width="48" height="280" rx="1" />
            <polygon points="230,160 254,130 278,160" />

            {/* CBD clusters */}
            <rect x="290" y="215" width="42" height="225" />
            <rect x="340" y="185" width="55" height="255" />
            <polygon points="340,185 367,160 395,185" />
            <rect x="405" y="235" width="40" height="205" />
            <rect x="455" y="210" width="52" height="230" />

            {/* Distant background arches / bridge */}
            <path d="M 1320 380 Q 1420 330 1520 380 L 1520 440 L 1320 440 Z" />
          </g>

          {/* MID LAYER: Singapore Flyer observation wheel */}
          <g transform="translate(1330, 210)" stroke="#1e293b" strokeWidth="2.5" fill="none">
            {/* Outer Rim */}
            <circle cx="90" cy="90" r="85" />
            <circle cx="90" cy="90" r="80" stroke="#334155" strokeWidth="1" strokeDasharray="4 6" />
            <circle cx="90" cy="90" r="16" fill="#1e293b" />
            {/* Spokes */}
            <line x1="90" y1="5" x2="90" y2="175" />
            <line x1="5" y1="90" x2="175" y2="90" />
            <line x1="30" y1="30" x2="150" y2="150" />
            <line x1="30" y1="150" x2="150" y2="30" />
            <line x1="15" y1="60" x2="165" y2="120" />
            <line x1="15" y1="120" x2="165" y2="60" />
            {/* Observation capsules */}
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => {
              const rad = (deg * Math.PI) / 180;
              const cx = 90 + 85 * Math.cos(rad);
              const cy = 90 + 85 * Math.sin(rad);
              return (
                <rect
                  key={deg}
                  x={cx - 3.5}
                  y={cy - 2}
                  width="7"
                  height="4"
                  rx="1.5"
                  fill="#475569"
                />
              );
            })}
            {/* Base A-frame support structure */}
            <polygon points="90,90 45,210 135,210" fill="#0f172a" />
          </g>

          {/* MAIN FOREGROUND SILHOUETTE */}
          <g fill="url(#skylineGrad)">
            {/* Financial District Skyscrapers (Left Side) */}
            {/* One Raffles Place & UOB Plaza */}
            <rect x="520" y="170" width="55" height="270" rx="1" />
            <polygon points="520,170 547,135 575,170" />

            <rect x="585" y="150" width="60" height="290" rx="2" />
            {/* UOB Plaza stepped geometric top */}
            <rect x="595" y="130" width="40" height="20" />
            <rect x="605" y="115" width="20" height="15" />
            <line x1="615" y1="115" x2="615" y2="85" stroke="#334155" strokeWidth="2" />

            {/* Republic Plaza */}
            <polygon points="655,440 655,200 685,155 715,200 715,440" />

            {/* OCBC Centre stepped structure */}
            <rect x="725" y="210" width="50" height="230" />
            <rect x="732" y="190" width="36" height="20" />

            {/* Merlion fountain landmark (Raffles place bay) */}
            <path
              d="M 505 400 
                 C 505 385, 512 375, 520 375 
                 C 525 375, 528 379, 528 385 
                 C 528 390, 524 394, 525 398 
                 C 527 404, 522 412, 515 415 
                 L 500 415 Z"
            />
            {/* Merlion water jet stream */}
            <path
              d="M 522 380 Q 545 378 555 415"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="1.5"
              strokeOpacity="0.4"
            />

            {/* MARINA BAY SANDS (Centerpiece) */}
            {/* Tower 1 */}
            <path
              d="M 800 440 
                 L 806 200 
                 C 806 195, 832 195, 832 200 
                 L 838 440 Z"
            />
            {/* Tower 2 */}
            <path
              d="M 852 440 
                 L 856 200 
                 C 856 195, 882 195, 882 200 
                 L 886 440 Z"
            />
            {/* Tower 3 */}
            <path
              d="M 900 440 
                 L 904 200 
                 C 904 195, 930 195, 930 200 
                 L 934 440 Z"
            />

            {/* MBS SkyPark (Cantilever Boat Terrace) */}
            <path
              d="M 770 195 
                 C 830 194, 890 194, 980 190 
                 C 1000 189, 1025 186, 1030 188 
                 C 1032 192, 1010 198, 970 202 
                 C 880 207, 820 208, 770 205 
                 Z"
              fill="#0f172a"
              stroke="#334155"
              strokeWidth="1.5"
            />
            {/* Infinity Pool subtle rim glow */}
            <line
              x1="785"
              y1="194"
              x2="945"
              y2="192"
              stroke="#38bdf8"
              strokeWidth="2"
              strokeOpacity="0.7"
            />

            {/* ArtScience Museum (The Lotus Blossom) */}
            <g transform="translate(1005, 335)">
              <path
                d="M 0 65 
                   C 10 30, 20 20, 28 45 
                   C 35 15, 48 10, 52 40 
                   C 60 5, 75 8, 72 45 
                   C 82 20, 95 30, 90 65 
                   Z"
                fill="#0f172a"
                stroke="#334155"
                strokeWidth="1"
              />
              {/* Museum base reflection */}
              <ellipse cx="45" cy="65" rx="45" ry="8" fill="#090d16" />
            </g>

            {/* Gardens by the Bay - Supertree Grove */}
            {/* Supertree 1 */}
            <g transform="translate(1120, 290)">
              {/* Flared organic crown */}
              <path
                d="M 12 110 
                   C 14 70, 0 35, -15 20 
                   C 10 15, 35 10, 55 10 
                   C 75 10, 100 15, 125 20 
                   C 110 35, 96 70, 98 110 
                   Z"
                fill="#0b1324"
              />
              <ellipse cx="55" cy="18" rx="70" ry="14" fill="#0f172a" stroke="#1e293b" strokeWidth="1" />
              {/* Organic branch webbing */}
              <path
                d="M 55 32 L 20 70 M 55 32 L 55 80 M 55 32 L 90 70"
                stroke="#334155"
                strokeWidth="1.5"
              />
            </g>

            {/* Supertree 2 (Smaller) */}
            <g transform="translate(1225, 320)">
              <path
                d="M 10 80 
                   C 12 50, 0 25, -10 14 
                   C 10 10, 30 6, 45 6 
                   C 60 6, 80 10, 100 14 
                   C 90 25, 78 50, 80 80 
                   Z"
                fill="#0b1324"
              />
              <ellipse cx="45" cy="14" rx="55" ry="10" fill="#0f172a" />
            </g>

            {/* The Esplanade (The Twin Durian Domes) */}
            <g transform="translate(400, 345)">
              {/* Left Durian Dome */}
              <path
                d="M 10 55 
                   C 15 25, 45 15, 75 18 
                   C 105 20, 125 35, 130 55 
                   Z"
                fill="#0f172a"
                stroke="#334155"
                strokeWidth="1.5"
              />
              {/* Right Durian Dome */}
              <path
                d="M 115 55 
                   C 120 28, 148 18, 178 20 
                   C 208 22, 230 38, 235 55 
                   Z"
                fill="#0b1324"
                stroke="#1e293b"
                strokeWidth="1.5"
              />
            </g>
          </g>

          {/* Waterfront / Marina Bay Water Line & Ripple Reflections */}
          <rect x="0" y="430" width="1600" height="50" fill="url(#waterGrad)" />
          <line
            x1="0"
            y1="430"
            x2="1600"
            y2="430"
            stroke="#0284c7"
            strokeOpacity="0.2"
            strokeWidth="1.5"
          />

          {/* Subtle water reflection streaks for MBS & skyline */}
          <ellipse
            cx="865"
            cy="442"
            rx="120"
            ry="3"
            fill="#38bdf8"
            fillOpacity={effectiveTime === 'night' ? 0.15 : 0.05}
          />
          <ellipse
            cx="600"
            cy="446"
            rx="80"
            ry="2.5"
            fill="#0ea5e9"
            fillOpacity={effectiveTime === 'night' ? 0.12 : 0.04}
          />
          <ellipse
            cx="1050"
            cy="448"
            rx="50"
            ry="2"
            fill="#a855f7"
            fillOpacity={effectiveTime === 'night' ? 0.1 : 0.03}
          />
        </svg>
      </div>

      {/* Atmospheric Horizon Haze Scrim - Scales with Haze Level */}
      <div
        className="absolute bottom-0 left-0 right-0 h-80 transition-all duration-700 pointer-events-none"
        style={{
          background:
            effectiveHaze > 0.4
              ? `linear-gradient(to top, rgba(82, 68, 52, ${
                  0.35 + effectiveHaze * 0.45
                }) 0%, rgba(54, 46, 36, ${0.2 + effectiveHaze * 0.3}) 50%, transparent 100%)`
              : `linear-gradient(to top, rgba(2, 6, 23, 0.85) 0%, rgba(2, 6, 23, 0.4) 60%, transparent 100%)`,
        }}
      />
    </div>
  );
};
