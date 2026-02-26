// src/pages/Landing.jsx
import React from 'react';
import { GoogleLogin } from '@react-oauth/google';

const Landing = ({ onLoginSuccess }) => (
  <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-4 md:p-6 relative overflow-hidden">
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-[#CCFF00]/10 blur-[80px] md:blur-[120px] rounded-full pointer-events-none"></div>
    <div className="relative z-10 text-center w-full max-w-4xl">
      <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-[110px] font-black text-white italic uppercase mb-2 tracking-tighter leading-[0.9]">
        MATCH TO <br className="block md:hidden" /> 
        <span className="text-[#CCFF00]">MATCH</span>
      </h1>
      <div className="h-1 w-20 md:w-32 bg-[#CCFF00] mx-auto mb-6 md:mb-10 skew-x-[-15deg]"></div>
      <p className="text-slate-400 mb-10 md:mb-14 text-lg md:text-2xl font-medium max-w-sm md:max-w-xl mx-auto leading-tight px-4">
        La red de futbolito más grande de <span className="text-white">Talca</span>. 
        Encuentra tu próximo 6 vs 6 en segundos.
      </p>
      <div className="flex flex-col items-center gap-4">
        <div className="bg-white/5 backdrop-blur-md p-8 border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(204,255,0,0.1)] skew-x-[-5deg]">
          <div className="skew-x-[5deg] flex flex-col items-center">
            <p className="text-[#CCFF00] font-black italic mb-6 uppercase tracking-widest text-sm">Inicia sesión para jugar</p>
            <GoogleLogin 
              onSuccess={onLoginSuccess}
              onError={() => console.log('Login Failed')}
              useOneTap
              theme="filled_blue"
              shape="pill"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default Landing;