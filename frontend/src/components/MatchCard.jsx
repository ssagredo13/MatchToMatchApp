import React from 'react';
import { Users, Settings2, Crown, Lock, Trash2, UserPlus } from 'lucide-react';

const MatchCard = ({ partido, isActive, isAdmin, onSelect, onDelete, user }) => {
  const isHost = user?.email && partido.creadorEmail === user.email;
  
  const ahora = new Date();
  const fechaPartido = new Date(`${partido.fecha}T${partido.hora}`);
  const yaPaso = ahora > fechaPartido;
  const esFallida = partido.estadoEspecial === 'FALLIDA' || yaPaso;

  const fechaObj = new Date(partido.fecha + 'T00:00:00');
  const dia = fechaObj.toLocaleDateString('es-CL', { day: '2-digit' });
  const mes = fechaObj.toLocaleDateString('es-CL', { month: 'short' }).replace('.', '').toUpperCase();

  return (
    <div 
      onClick={() => !esFallida && onSelect(partido)}
      className={`
        relative p-6 rounded-[32px] border transition-all duration-500 overflow-hidden group
        ${esFallida 
          ? 'bg-slate-950/40 border-white/5 cursor-default opacity-80' 
          : isActive 
            ? 'bg-[#0f172a] border-[#CCFF00] shadow-[0_0_40px_rgba(204,255,0,0.15)] scale-[1.02] cursor-pointer' 
            : 'bg-[#0f172a]/40 border-white/5 hover:border-white/20 hover:bg-[#0f172a]/60 cursor-pointer'}
      `}
    >
      {/* HEADER */}
      <div className="flex justify-between items-start mb-6">
        <div className="space-y-1">
          <h3 className={`text-2xl md:text-3xl font-black italic uppercase tracking-tighter leading-[0.9] ${esFallida ? 'text-slate-600' : 'text-white'}`}>
            {partido.equipo} 
            {partido.rival && (
              <span className={`block mt-1 ${esFallida ? 'text-slate-700' : 'text-[#CCFF00]'}`}>
                <span className="text-white/20 text-sm mr-2">VS</span> 
                {partido.rival}
              </span>
            )}
          </h3>
          
          <div className="flex items-center gap-1.5 mt-3">
            <Crown size={12} className={isHost && !esFallida ? "text-[#CCFF00]" : "text-slate-700"} />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Organiza: <span className={esFallida ? "text-slate-600" : "text-white italic"}>{partido.creadorNombre || 'Organizador'}</span>
            </span>
          </div>
        </div>
        
        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black italic uppercase tracking-[0.15em] border ${
          esFallida 
            ? 'bg-red-500/5 text-red-900 border-red-900/20'
            : partido.estado === 'PARTIDO LISTO' 
              ? 'bg-green-500/10 text-green-400 border-green-500/20' 
              : 'bg-[#CCFF00]/10 text-[#CCFF00] border-[#CCFF00]/20'
        }`}>
          {esFallida ? 'EXPIRADA' : partido.estado}
        </span>
      </div>

      {/* FECHA/HORA */}
      <div className="flex gap-2 mb-4">
        <div className={`flex-1 p-3 rounded-2xl flex flex-col items-center justify-center ${esFallida ? 'bg-slate-900/50' : 'bg-[#CCFF00]'}`}>
          <span className={`text-[9px] font-black uppercase ${esFallida ? 'text-slate-700' : 'text-black/50'}`}>Fecha</span>
          <span className={`text-xl font-black italic ${esFallida ? 'text-slate-600' : 'text-black'}`}>{dia} {mes}</span>
        </div>
        <div className="flex-1 bg-white/5 border border-white/10 p-3 rounded-2xl flex flex-col items-center justify-center">
          <span className={`text-[9px] font-black uppercase ${esFallida ? 'text-slate-700' : 'text-[#CCFF00]'}`}>Cita</span>
          <span className={`text-xl font-black italic ${esFallida ? 'text-slate-600' : 'text-white'}`}>{partido.hora}</span>
        </div>
      </div>

      {/* FOOTER */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Users size={14} className={esFallida ? "text-slate-800" : "text-[#CCFF00]"} />
            <span className={`text-[10px] font-black italic uppercase ${esFallida ? 'text-slate-700' : 'text-white/70'}`}>
              {partido.jugadores} / {partido.total}
            </span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${esFallida ? 'bg-slate-800' : 'bg-[#CCFF00]'}`}
              style={{ width: `${(partido.jugadores / partido.total) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* BOTÓN ELIMINAR: Deshabilitado si es fallida/pasada */}
          {isHost && !esFallida && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(partido._id || partido.id);
              }}
              className="h-11 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 transition-colors"
            >
              <Trash2 size={18} />
            </button>
          )}

          <div className={`h-11 px-6 rounded-xl font-black italic uppercase text-[10px] flex items-center gap-2 border transition-all
            ${esFallida 
              ? 'bg-transparent text-slate-700 border-white/5' 
              : isHost 
                ? 'bg-cyan-500 text-black border-cyan-400 hover:bg-cyan-400' 
                : 'bg-white text-black border-white hover:bg-[#CCFF00] hover:border-[#CCFF00]'}`}>
            {esFallida ? (
              <><Lock size={14}/> Cerrada</>
            ) : isHost ? (
              <><Settings2 size={14}/> Gestionar</>
            ) : (
              <><UserPlus size={14}/> Unirse</>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchCard;