// src/pages/Landing.jsx
import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { Trophy, Target, Zap } from 'lucide-react';

const Landing = ({ onLoginSuccess }) => (
  <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-4 md:p-6 relative overflow-hidden">
    
    {/* FONDO DE IMPACTO: Collage / Imagen de Cancha con Overlay */}
    <div className="absolute inset-0 z-0">
      <img 
        src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2000&auto=format&fit=crop" 
        alt="Cancha de fútbol" 
        className="w-full h-full object-cover opacity-40 scale-105"
      />
      {/* Gradiente para asegurar legibilidad */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#020617]/90 via-[#020617]/70 to-[#020617]"></div>
    </div>

    {/* BLUR DECORATIVO (EL GUIÑO) */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-[#CCFF00]/10 blur-[80px] md:blur-[120px] rounded-full pointer-events-none"></div>

    <div className="relative z-10 text-center w-full max-w-5xl">
      
      {/* GUIÑO A OTROS DEPORTES (BADGE) */}
      <div className="flex justify-center gap-6 mb-8 opacity-60">
        <div className="flex items-center gap-2 text-[10px] font-black italic text-white/50 tracking-[0.3em] uppercase">
          <Target size={14} className="text-[#CCFF00]" /> Fútbol
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black italic text-white/30 tracking-[0.3em] uppercase">
           Padel <span className="text-[8px] bg-white/10 px-1 rounded text-[#CCFF00]">SOON</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black italic text-white/30 tracking-[0.3em] uppercase">
           Tenis <span className="text-[8px] bg-white/10 px-1 rounded text-[#CCFF00]">SOON</span>
        </div>
      </div>

      <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-[120px] font-black text-white italic uppercase mb-2 tracking-tighter leading-[0.85]">
        MATCH TO <br className="block md:hidden" /> 
        <span className="text-[#CCFF00]">MATCH</span>
      </h1>

      <div className="h-1.5 w-24 md:w-40 bg-[#CCFF00] mx-auto mb-8 md:mb-12 skew-x-[-15deg] shadow-[0_0_20px_rgba(204,255,0,0.5)]"></div>

      <p className="text-slate-300 mb-12 md:mb-16 text-lg md:text-3xl font-medium max-w-sm md:max-w-2xl mx-auto leading-tight px-4 italic">
        La red deportiva más grande de <span className="text-white font-bold border-b-2 border-[#CCFF00]">Talca</span>. 
        Encuentra tu próximo 6 vs 6 en segundos.
      </p>

      <div className="flex flex-col items-center gap-4">
        {/* CONTENEDOR LOGIN ESTILO TECH */}
        <div className="bg-white/5 backdrop-blur-xl p-10 border border-white/10 rounded-[40px] shadow-[0_0_80px_rgba(0,0,0,0.5)] skew-x-[-2deg] relative group overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#CCFF00] scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
          
          <div className="skew-x-[2deg] flex flex-col items-center">
            <p className="text-white font-black italic mb-8 uppercase tracking-[0.2em] text-sm">
              Acceso <span className="text-[#CCFF00]">Pro Player</span>
            </p>
            
            <GoogleLogin 
              onSuccess={onLoginSuccess}
              onError={() => console.log('Login Failed')}
              useOneTap
              theme="filled_blue"
              shape="pill"
            />
          </div>
        </div>

        {/* MÉTRICAS RÁPIDAS */}
        <div className="mt-12 flex gap-10 text-white/40 font-black italic text-[10px] uppercase tracking-widest">
          <div className="flex flex-col items-center gap-1">
            <span className="text-white text-lg font-black tracking-normal">+500</span>
            Jugadores
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-white text-lg font-black tracking-normal">+20</span>
            Canchas
          </div>
          <div className="flex flex-col items-center gap-1">
             <span className="text-white text-lg font-black tracking-normal">24/7</span>
             Activo
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default Landing;