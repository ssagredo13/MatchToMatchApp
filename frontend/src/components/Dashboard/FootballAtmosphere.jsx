import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';

const FootballAtmosphere = ({ soundEnabled, onToggleSound, soundMessage }) => (
  <section className="stadium-atmosphere" aria-label="Ambiente de fútbol">
    <svg
      className="stadium-atmosphere__art"
      viewBox="0 0 1000 280"
      role="img"
      aria-label="Ilustración de jugadores haciendo un rondo dentro de un estadio"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="stadium-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#172554" />
          <stop offset=".55" stopColor="#111827" />
          <stop offset="1" stopColor="#052e16" />
        </linearGradient>
        <linearGradient id="stadium-light" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d9ff68" stopOpacity=".46" />
          <stop offset="1" stopColor="#d9ff68" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="stadium-shade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#020617" stopOpacity=".2" />
          <stop offset=".46" stopColor="#020617" stopOpacity=".08" />
          <stop offset="1" stopColor="#020617" stopOpacity=".56" />
        </linearGradient>
        <pattern id="stadium-crowd" width="18" height="14" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="5" r="2" fill="#e2e8f0" opacity=".44" />
          <circle cx="11" cy="9" r="2" fill="#ccff00" opacity=".58" />
        </pattern>
      </defs>

      <rect width="1000" height="280" fill="url(#stadium-sky)" />
      <path d="M0 78 Q500 -68 1000 78 L1000 112 Q500 4 0 112Z" fill="#0f172a" />
      <path d="M0 93 Q500 -10 1000 93 L1000 125 Q500 31 0 125Z" fill="url(#stadium-crowd)" />
      <path d="M0 111 Q500 32 1000 111 L1000 142 Q500 64 0 142Z" fill="#111827" />
      <path d="M0 121 Q500 50 1000 121 L1000 149 Q500 78 0 149Z" fill="url(#stadium-crowd)" opacity=".7" />

      <g className="stadium-atmosphere__lights">
        <path d="M98 40 L164 40 L380 196 L282 196Z" fill="url(#stadium-light)" />
        <path d="M858 34 L917 34 L710 193 L625 193Z" fill="url(#stadium-light)" />
        <path d="M83 37h93v8H83zM842 31h91v8h-91z" fill="#e2e8f0" />
        <path d="M96 48h11v5H96zm20 0h11v5h-11zm20 0h11v5h-11zm20 0h11v5h-11zM855 42h11v5h-11zm20 0h11v5h-11zm20 0h11v5h-11z" fill="#f8fafc" />
      </g>

      <path d="M0 176 Q500 104 1000 176 V280 H0Z" fill="#14532d" />
      <path d="M0 203 Q500 139 1000 203" fill="none" stroke="#86efac" strokeOpacity=".42" strokeWidth="2" />
      <path d="M0 236 Q500 180 1000 236" fill="none" stroke="#86efac" strokeOpacity=".24" strokeWidth="2" />
      <ellipse cx="690" cy="220" rx="196" ry="49" fill="none" stroke="#dcfce7" strokeOpacity=".48" strokeWidth="2" strokeDasharray="7 7" />
      <ellipse cx="690" cy="220" rx="137" ry="31" fill="#052e16" fillOpacity=".45" stroke="#bbf7d0" strokeOpacity=".35" />

      <g className="rondo-player rondo-player--one" transform="translate(535 206)">
        <circle cy="-15" r="7" fill="#f1c7a5" />
        <path d="M-9-7 Q0-12 9-7 L13 10 H-13Z" fill="#f8fafc" />
        <path d="M-6 9 L-9 25 M6 9 L9 25 M-9 25 L-16 28 M9 25 L16 28" stroke="#0f172a" strokeWidth="5" strokeLinecap="round" />
      </g>
      <g className="rondo-player rondo-player--two" transform="translate(610 174)">
        <circle cy="-15" r="7" fill="#d6a889" />
        <path d="M-9-7 Q0-12 9-7 L13 10 H-13Z" fill="#ccff00" />
        <path d="M-6 9 L-9 25 M6 9 L9 25 M-9 25 L-16 28 M9 25 L16 28" stroke="#0f172a" strokeWidth="5" strokeLinecap="round" />
      </g>
      <g className="rondo-player rondo-player--three" transform="translate(759 184)">
        <circle cy="-15" r="7" fill="#efc3a2" />
        <path d="M-9-7 Q0-12 9-7 L13 10 H-13Z" fill="#f97316" />
        <path d="M-6 9 L-9 25 M6 9 L9 25 M-9 25 L-16 28 M9 25 L16 28" stroke="#0f172a" strokeWidth="5" strokeLinecap="round" />
      </g>
      <g className="rondo-player rondo-player--four" transform="translate(834 214)">
        <circle cy="-15" r="7" fill="#c99473" />
        <path d="M-9-7 Q0-12 9-7 L13 10 H-13Z" fill="#38bdf8" />
        <path d="M-6 9 L-9 25 M6 9 L9 25 M-9 25 L-16 28 M9 25 L16 28" stroke="#0f172a" strokeWidth="5" strokeLinecap="round" />
      </g>
      <g className="rondo-player rondo-player--five" transform="translate(721 250)">
        <circle cy="-15" r="7" fill="#edc6a7" />
        <path d="M-9-7 Q0-12 9-7 L13 10 H-13Z" fill="#e2e8f0" />
        <path d="M-6 9 L-9 25 M6 9 L9 25 M-9 25 L-16 28 M9 25 L16 28" stroke="#0f172a" strokeWidth="5" strokeLinecap="round" />
      </g>
      <g transform="translate(684 218)">
        <circle cy="-15" r="7" fill="#ddb594" />
        <path d="M-9-7 Q0-12 9-7 L13 10 H-13Z" fill="#111827" stroke="#facc15" strokeWidth="2" />
        <path d="M-6 9 L-9 25 M6 9 L9 25 M-9 25 L-16 28 M9 25 L16 28" stroke="#111827" strokeWidth="5" strokeLinecap="round" />
        <path d="M-7-2 L7-2" stroke="#facc15" strokeWidth="2" />
      </g>
      <circle className="rondo-ball-static" cx="565" cy="228" r="5" fill="#fff" stroke="#020617" strokeWidth="2" />
      <circle className="rondo-ball" r="5" fill="#fff" stroke="#020617" strokeWidth="2">
        <animateMotion
          dur="3.4s"
          repeatCount="indefinite"
          path="M 565 228 C 590 160 655 172 677 202 C 710 174 767 180 790 204 C 828 227 790 244 755 235 C 723 267 654 260 628 234 C 600 252 572 244 565 228"
        />
      </circle>
      <rect width="1000" height="280" fill="url(#stadium-shade)" />
    </svg>

    <div className="stadium-atmosphere__copy">
      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#CCFF00]">
        Sala de espera · Estadio abierto
      </p>
      <h2 className="mt-2 max-w-md text-2xl font-black italic uppercase leading-none tracking-tight sm:text-3xl">
        Calienta motores.<br />
        <span className="text-[#CCFF00]">La próxima es tuya.</span>
      </h2>
      <p className="mt-2 max-w-sm text-xs text-slate-300">
        Un rondo, dos toques y a la cancha.
      </p>
    </div>

    <button
      type="button"
      onClick={onToggleSound}
      aria-pressed={soundEnabled}
      aria-describedby="stadium-sound-note"
      className="stadium-atmosphere__sound"
    >
      {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
      {soundEnabled ? 'Silbato activado' : 'Activar silbato'}
    </button>
    <span id="stadium-sound-note" className="sr-only">
      Efecto original sintetizado; el sonido se activa únicamente al pulsar este control.
    </span>
    {soundMessage && (
      <p role="status" className="stadium-atmosphere__status">{soundMessage}</p>
    )}
  </section>
);

export default FootballAtmosphere;
