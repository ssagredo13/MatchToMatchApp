import React from 'react';
import { Clock, MapPin, Users, Trash2, Settings2 } from 'lucide-react';

const MatchCard = ({ partido, isActive, isAdmin, isJoined, onSelect, onDelete, user }) => {
  // Verificamos si el usuario actual es el creador de esta pichanga
  const isHost = partido.creadorEmail === user?.email;

  return (
    <div 
      className={`
        relative p-8 rounded-[32px] border transition-all duration-500 cursor-pointer overflow-hidden group
        ${isActive 
          ? 'bg-[#0f172a] border-[#CCFF00] shadow-[0_0_40px_rgba(204,255,0,0.15)] scale-[1.02]' 
          : 'bg-[#0f172a]/40 border-white/5 hover:border-white/20 hover:bg-[#0f172a]/60'}
      `}
    >
      {/* INDICADOR LATERAL DE ACTIVIDAD (NEÓN) */}
      {isActive && (
        <div className="absolute left-0 top-1/4 bottom-1/4 w-1.5 bg-[#CCFF00] rounded-r-full shadow-[4px_0_15px_#CCFF00]" />
      )}

      {/* HEADER: EQUIPOS Y ESTADO */}
      <div className="flex justify-between items-start mb-8">
        <div className="space-y-1">
          <h3 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter leading-[0.9]">
            {partido.equipo} 
            {partido.rival && (
              <span className="block text-[#CCFF00] mt-1">
                <span className="text-white/30 text-sm mr-2">VS</span> 
                {partido.rival}
              </span>
            )}
          </h3>
          {isHost && (
            <span className="inline-block text-[7px] font-black bg-[#CCFF00] text-black px-2 py-0.5 rounded mt-2 uppercase tracking-tighter">
              Tu Organización
            </span>
          )}
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <span className={`px-4 py-1.5 rounded-full text-[9px] font-black italic uppercase tracking-[0.15em] border ${
            partido.estado === 'PARTIDO LISTO' 
              ? 'bg-green-500/10 text-green-400 border-green-500/20' 
              : 'bg-[#CCFF00]/10 text-[#CCFF00] border-[#CCFF00]/20'
          }`}>
            {partido.estado}
          </span>
          {isJoined && !isHost && (
            <span className="text-[8px] font-black text-[#CCFF00] uppercase tracking-widest bg-white/5 px-2 py-1 rounded">
              ✓ Estás inscrito
            </span>
          )}
        </div>
      </div>

      {/* DATA GRID: INFO DE LA PICHANGA */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/5 rounded-xl text-slate-400">
            <Clock size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase">Hora y Fecha</p>
            <p className="text-xs font-black italic uppercase text-white">{partido.hora} — {partido.fecha}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/5 rounded-xl text-slate-400">
            <MapPin size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase">Recinto</p>
            <p className="text-xs font-black italic uppercase text-white truncate max-w-[120px]">
              {partido.cancha}
            </p>
          </div>
        </div>
      </div>

      {/* FOOTER: PROGRESO Y ACCIONES */}
      <div className="flex items-center justify-between gap-6">
        <div className="flex-1 space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Users size={14} className="text-[#CCFF00]" />
              <span className="text-[10px] font-black italic uppercase tracking-widest">
                {partido.jugadores} / {partido.total} Jugadores
              </span>
            </div>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#CCFF00] transition-all duration-1000 shadow-[0_0_10px_#CCFF00]"
              style={{ width: `${(partido.jugadores / partido.total) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Botón Eliminar: Visible para Admin o si eres el Dueño */}
          {(isAdmin || isHost) && (
            <button 
              onClick={(e) => onDelete(e, partido.id)}
              className="p-4 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-lg group-hover:scale-105 active:scale-90"
              title="Eliminar Partida"
            >
              <Trash2 size={20} />
            </button>
          )}
          
          {/* BOTÓN DE ACCIÓN DINÁMICO */}
          <button 
            onClick={(e) => { e.stopPropagation(); onSelect(partido); }}
            className={`
              h-14 px-6 rounded-2xl font-black italic uppercase text-xs transition-all flex items-center gap-2
              ${isHost 
                ? 'bg-cyan-500 text-black hover:bg-white shadow-[0_0_20px_rgba(6,182,212,0.3)]' 
                : (partido.estado === 'PARTIDO LISTO' || isJoined)
                  ? 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/10'
                  : 'bg-white text-black hover:bg-[#CCFF00] shadow-xl active:scale-95'}
            `}
          >
            {isHost ? (
              <>
                <Settings2 size={16} />
                Gestionar
              </>
            ) : isJoined ? (
              'Dentro'
            ) : (
              'Unirse'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MatchCard;