import React from 'react';
import { Clock, MapPin, Users, Trash2, Settings2, Crown, AlertTriangle } from 'lucide-react';

const MatchCard = ({ partido, isActive, isAdmin, isJoined, onSelect, onDelete, user }) => {
  // Verificamos si el usuario actual es el creador
  const isHost = partido.creadorEmail === user?.email;
  
  // Detectar si la partida viene marcada como fallida desde el Dashboard
  const esFallida = partido.estadoEspecial === 'FALLIDA';

  // Formateo de fecha para el Badge (Ej: 05 ABR)
  const fechaObj = new Date(partido.fecha + 'T00:00:00');
  const dia = fechaObj.toLocaleDateString('es-CL', { day: '2-digit' });
  const mes = fechaObj.toLocaleDateString('es-CL', { month: 'short' }).replace('.', '').toUpperCase();

  return (
    <div 
      onClick={() => !esFallida && onSelect(partido)}
      className={`
        relative p-6 rounded-[32px] border transition-all duration-500 cursor-pointer overflow-hidden group
        ${isActive 
          ? 'bg-[#0f172a] border-[#CCFF00] shadow-[0_0_40px_rgba(204,255,0,0.15)] scale-[1.02]' 
          : esFallida 
            ? 'bg-red-950/20 border-red-500/20 grayscale-[0.5] opacity-80' 
            : 'bg-[#0f172a]/40 border-white/5 hover:border-white/20 hover:bg-[#0f172a]/60'}
      `}
    >
      {/* INDICADOR LATERAL DE ACTIVIDAD (NEÓN) */}
      {isActive && (
        <div className="absolute left-0 top-1/4 bottom-1/4 w-1.5 bg-[#CCFF00] rounded-r-full shadow-[4px_0_15px_#CCFF00]" />
      )}

      {/* HEADER: EQUIPOS Y ESTADO */}
      <div className="flex justify-between items-start mb-6">
        <div className="space-y-1">
          <h3 className={`text-2xl md:text-3xl font-black italic uppercase tracking-tighter leading-[0.9] ${esFallida ? 'text-slate-500' : 'text-white'}`}>
            {partido.equipo} 
            {partido.rival && (
              <span className={`block mt-1 ${esFallida ? 'text-red-400/50' : 'text-[#CCFF00]'}`}>
                <span className="text-white/30 text-sm mr-2">VS</span> 
                {partido.rival}
              </span>
            )}
          </h3>
          
          <div className="flex flex-col gap-1 mt-3">
            <div className="flex items-center gap-1.5">
              <Crown size={10} className={isHost ? "text-[#CCFF00]" : "text-slate-500"} />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Organiza: <span className="text-white italic">{partido.creadorNombre || 'Organizador'}</span>
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <span className={`px-4 py-1.5 rounded-full text-[9px] font-black italic uppercase tracking-[0.15em] border ${
            esFallida 
              ? 'bg-red-500/20 text-red-500 border-red-500/30'
              : partido.estado === 'PARTIDO LISTO' 
                ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                : 'bg-[#CCFF00]/10 text-[#CCFF00] border-[#CCFF00]/20'
          }`}>
            {esFallida ? 'SIN QUÓRUM' : partido.estado}
          </span>
        </div>
      </div>

      {/* --- SECCIÓN DE FECHA Y HORA --- */}
      <div className="flex gap-2 mb-4">
        <div className={`flex-1 p-3 rounded-2xl flex flex-col items-center justify-center transition-transform group-hover:scale-105 shadow-[0_8px_20px_rgba(0,0,0,0.2)] 
          ${esFallida ? 'bg-slate-800' : 'bg-[#CCFF00]'}`}>
          <span className={`text-[9px] font-black uppercase leading-none ${esFallida ? 'text-white/30' : 'text-black/50'}`}>Fecha</span>
          <span className={`text-xl font-black italic leading-none mt-1 ${esFallida ? 'text-slate-400' : 'text-black'}`}>
            {dia} {mes}
          </span>
        </div>
        
        <div className="flex-1 bg-white/5 border border-white/10 p-3 rounded-2xl flex flex-col items-center justify-center">
          <span className={`text-[9px] font-black uppercase leading-none tracking-widest ${esFallida ? 'text-red-500/50' : 'text-[#CCFF00]'}`}>Cita</span>
          <span className="text-xl font-black italic text-white leading-none mt-1">
            {partido.hora}
          </span>
        </div>
      </div>

      {/* BLOQUE DE RECINTO */}
      <div className="flex items-center gap-3 bg-black/40 p-4 rounded-2xl border border-white/5 mb-6">
        <div className={`p-2 bg-white/5 rounded-lg ${esFallida ? 'text-slate-600' : 'text-[#CCFF00]'}`}>
          <MapPin size={18} />
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em]">Recinto</span>
          <span className="text-xs font-black italic uppercase text-white truncate">
            {partido.recinto || "Por confirmar"}
          </span>
        </div>
      </div>

      {/* FOOTER: PROGRESO Y ACCIONES */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Users size={14} className={esFallida ? "text-red-500/50" : "text-[#CCFF00]"} />
              <span className={`text-[10px] font-black italic uppercase tracking-widest ${esFallida ? 'text-red-500/50' : 'text-white/70'}`}>
                {partido.jugadores} / {partido.total}
              </span>
            </div>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${esFallida ? 'bg-red-900/40' : 'bg-[#CCFF00] shadow-[0_0_10px_#CCFF00]'}`}
              style={{ width: `${(partido.jugadores / partido.total) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(isAdmin || isHost) && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                const confirmMsg = isHost ? "¿Cancelar tu pichanga?" : "¿Eliminar partida?";
                if (window.confirm(confirmMsg)) onDelete(e, partido._id || partido.id);
              }}
              className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all active:scale-90"
            >
              <Trash2 size={18} />
            </button>
          )}
          
          <button 
            disabled={esFallida}
            onClick={(e) => { e.stopPropagation(); onSelect(partido); }}
            className={`
              h-11 px-5 rounded-xl font-black italic uppercase text-[10px] transition-all flex items-center gap-2
              ${esFallida 
                ? 'bg-red-500/10 text-red-500/50 border border-red-500/20 cursor-not-allowed' 
                : isHost 
                  ? 'bg-cyan-500 text-black hover:bg-white shadow-[0_0_20px_rgba(6,182,212,0.3)]' 
                  : (partido.estado === 'PARTIDO LISTO' || isJoined)
                    ? 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/10'
                    : 'bg-white text-black hover:bg-[#CCFF00] active:scale-95'}
            `}
          >
            {esFallida ? (
              <><AlertTriangle size={14} /> Expirada</>
            ) : isHost ? (
              <><Settings2 size={14} /> Gestión</>
            ) : isJoined ? (
              'Listo'
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