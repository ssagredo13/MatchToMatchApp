import React from 'react';
import { Clock, MapPin, Users, Trash2, Settings2, Crown, AlertTriangle, Lock } from 'lucide-react';

const MatchCard = ({ partido, isActive, isAdmin, isJoined, onSelect, onDelete, user }) => {
  const isHost = partido.creadorEmail === user?.email;
  const esFallida = partido.estadoEspecial === 'FALLIDA';

  const fechaObj = new Date(partido.fecha + 'T00:00:00');
  const dia = fechaObj.toLocaleDateString('es-CL', { day: '2-digit' });
  const mes = fechaObj.toLocaleDateString('es-CL', { month: 'short' }).replace('.', '').toUpperCase();

  // Función para manejar el click en la tarjeta solo si no es fallida
  const handleCardClick = () => {
    if (!esFallida) {
      onSelect(partido);
    }
  };

  return (
    <div 
      onClick={handleCardClick}
      className={`
        relative p-6 rounded-[32px] border transition-all duration-500 overflow-hidden group
        ${esFallida 
          ? 'bg-[#0f172a]/20 border-white/5 cursor-default opacity-60 grayscale-[0.8]' 
          : isActive 
            ? 'bg-[#0f172a] border-[#CCFF00] shadow-[0_0_40px_rgba(204,255,0,0.15)] scale-[1.02] cursor-pointer' 
            : 'bg-[#0f172a]/40 border-white/5 hover:border-white/20 hover:bg-[#0f172a]/60 cursor-pointer'}
      `}
    >
      {/* INDICADOR LATERAL: Solo si está activa y NO es fallida */}
      {isActive && !esFallida && (
        <div className="absolute left-0 top-1/4 bottom-1/4 w-1.5 bg-[#CCFF00] rounded-r-full shadow-[4px_0_15px_#CCFF00]" />
      )}

      {/* HEADER: EQUIPOS Y ESTADO */}
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
          
          <div className="flex flex-col gap-1 mt-3">
            <div className="flex items-center gap-1.5">
              <Crown size={10} className={isHost && !esFallida ? "text-[#CCFF00]" : "text-slate-700"} />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Organiza: <span className={esFallida ? "text-slate-600" : "text-white italic"}>{partido.creadorNombre || 'Organizador'}</span>
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <span className={`px-4 py-1.5 rounded-full text-[9px] font-black italic uppercase tracking-[0.15em] border ${
            esFallida 
              ? 'bg-red-500/5 text-red-900 border-red-900/20'
              : partido.estado === 'PARTIDO LISTO' 
                ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                : 'bg-[#CCFF00]/10 text-[#CCFF00] border-[#CCFF00]/20'
          }`}>
            {esFallida ? 'PARTIDA EXPIRADA' : partido.estado}
          </span>
        </div>
      </div>

      {/* SECCIÓN FECHA/HORA */}
      <div className="flex gap-2 mb-4">
        <div className={`flex-1 p-3 rounded-2xl flex flex-col items-center justify-center transition-transform ${!esFallida && 'group-hover:scale-105'} 
          ${esFallida ? 'bg-slate-900/50 border border-white/5' : 'bg-[#CCFF00] shadow-[0_8px_20px_rgba(204,255,0,0.15)]'}`}>
          <span className={`text-[9px] font-black uppercase leading-none ${esFallida ? 'text-slate-700' : 'text-black/50'}`}>Fecha</span>
          <span className={`text-xl font-black italic leading-none mt-1 ${esFallida ? 'text-slate-600' : 'text-black'}`}>
            {dia} {mes}
          </span>
        </div>
        
        <div className="flex-1 bg-white/5 border border-white/10 p-3 rounded-2xl flex flex-col items-center justify-center">
          <span className={`text-[9px] font-black uppercase leading-none tracking-widest ${esFallida ? 'text-slate-700' : 'text-[#CCFF00]'}`}>Cita</span>
          <span className={`text-xl font-black italic leading-none mt-1 ${esFallida ? 'text-slate-600' : 'text-white'}`}>
            {partido.hora}
          </span>
        </div>
      </div>

      {/* RECINTO */}
      <div className={`flex items-center gap-3 p-4 rounded-2xl border mb-6 ${esFallida ? 'bg-black/10 border-white/5' : 'bg-black/40 border-white/5'}`}>
        <div className={`p-2 rounded-lg ${esFallida ? 'text-slate-800' : 'text-[#CCFF00]'}`}>
          <MapPin size={18} />
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em]">Recinto</span>
          <span className="text-xs font-black italic uppercase text-slate-500 truncate">
            {partido.recinto || "No definido"}
          </span>
        </div>
      </div>

      {/* FOOTER */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Users size={14} className={esFallida ? "text-slate-800" : "text-[#CCFF00]"} />
              <span className={`text-[10px] font-black italic uppercase tracking-widest ${esFallida ? 'text-slate-700' : 'text-white/70'}`}>
                {partido.jugadores} / {partido.total}
              </span>
            </div>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${esFallida ? 'bg-slate-800' : 'bg-[#CCFF00] shadow-[0_0_10px_#CCFF00]'}`}
              style={{ width: `${(partido.jugadores / partido.total) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* BOTÓN ELIMINAR: Deshabilitado si es fallida */}
          {(isAdmin || isHost) && (
            <button 
              disabled={esFallida}
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm("¿Eliminar registro histórico?")) onDelete(e, partido._id || partido.id);
              }}
              className={`p-3 rounded-xl transition-all ${esFallida ? 'text-slate-800 cursor-not-allowed' : 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white active:scale-90'}`}
            >
              <Trash2 size={18} />
            </button>
          )}
          
          {/* BOTÓN ACCIÓN: Bloqueado totalmente si es fallida */}
          <button 
            disabled={esFallida}
            onClick={(e) => { e.stopPropagation(); onSelect(partido); }}
            className={`
              h-11 px-5 rounded-xl font-black italic uppercase text-[10px] transition-all flex items-center gap-2
              ${esFallida 
                ? 'bg-transparent text-slate-700 border border-white/5 cursor-not-allowed' 
                : isHost 
                  ? 'bg-cyan-500 text-black hover:bg-white shadow-[0_0_20px_rgba(6,182,212,0.3)]' 
                  : (partido.estado === 'PARTIDO LISTO' || isJoined)
                    ? 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/10'
                    : 'bg-white text-black hover:bg-[#CCFF00] active:scale-95'}
            `}
          >
            {esFallida ? (
              <><Lock size={14} /> Cerrada</>
            ) : isHost ? (
              <><Settings2 size={14} /> Gestionar</>
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