import React from 'react';
import { Users, Shield, Plus } from 'lucide-react';

const MyTeams = ({ user }) => {
  // Datos de ejemplo (luego vendrán del backend)
  const equipos = [
    { id: 101, nombre: "TALCA UNITED FC", categoria: "Sénior", miembros: 14, victorias: 25 },
    { id: 102, nombre: "RANGERS AMATEUR", categoria: "Todo Competidor", miembros: 12, victorias: 10 }
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-white pt-32 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Cabecera */}
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-[10px] font-black italic text-[#CCFF00] uppercase tracking-[0.4em]">Gestión de Clubes</h2>
            <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-none">
              Mis <span className="text-white/20">Equipos</span>
            </h1>
          </div>
          <button className="bg-white text-black h-14 px-8 skew-x-[-12deg] hover:bg-[#CCFF00] transition-all flex items-center gap-3 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
            <Plus size={20} strokeWidth={3} className="skew-x-[12deg]"/>
            <span className="font-black italic uppercase text-sm skew-x-[12deg]">Crear Club</span>
          </button>
        </div>

        {/* Rejilla de Equipos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {equipos.map(equipo => (
            <div key={equipo.id} className="group relative bg-white/5 border border-white/10 p-8 hover:border-[#CCFF00]/50 transition-all overflow-hidden">
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-20 transition-opacity">
                <Shield size={120} color="#CCFF00" />
              </div>
              
              <div className="relative z-10">
                <div className="w-12 h-12 bg-[#CCFF00]/10 flex items-center justify-center mb-6">
                  <Shield className="text-[#CCFF00]" size={24} />
                </div>
                <h3 className="text-2xl font-black italic uppercase mb-2">{equipo.nombre}</h3>
                <div className="flex gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <span>{equipo.categoria}</span>
                  <span className="text-[#CCFF00]">•</span>
                  <span>{equipo.miembros} Jugadores</span>
                </div>
                
                <div className="mt-8 flex justify-between items-center">
                  <div className="text-center">
                    <p className="text-[#CCFF00] text-xl font-black italic">{equipo.victorias}</p>
                    <p className="text-[8px] text-slate-500 uppercase font-bold">Victorias</p>
                  </div>
                  <button className="text-[10px] font-black italic uppercase border-b border-[#CCFF00] text-[#CCFF00] pb-1 hover:text-white hover:border-white transition-all">
                    Ver Plantilla
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MyTeams;