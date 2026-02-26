import React from 'react';
import { MapPin, Clock, Users, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';

const MatchCard = ({ partido, onSelect, isAdmin, onDelete }) => {
  return (
    <div 
      onClick={() => onSelect(partido)} 
      className="glass-card group relative"
    >
      <div className={`absolute left-0 top-0 bottom-0 w-2 ${partido.estado === 'COMPLETO' ? 'bg-slate-800' : 'bg-[#ccff00]'}`} />
      
      <div className="p-8">
        <div className="flex justify-between items-start mb-8">
          <div className="space-y-3">
            <h3 className="text-4xl font-black italic uppercase group-hover:text-[#ccff00] transition-colors leading-none tracking-tighter">
              {partido.equipo} {partido.rival && <span className="text-[#ccff00] text-sm block mt-2 tracking-normal italic uppercase">vs {partido.rival}</span>}
            </h3>
            <div className="flex flex-col gap-2">
              <p className="text-[11px] text-slate-400 font-bold uppercase flex items-center gap-2 italic">
                <MapPin size={14} className="text-[#ccff00]"/> {partido.cancha}
              </p>
              <span className={`flex items-center gap-1.5 text-[9px] font-black italic uppercase ${partido.canchaConfirmada ? 'text-green-400' : 'text-orange-400'}`}>
                {partido.canchaConfirmada ? <CheckCircle2 size={12}/> : <AlertCircle size={12}/>}
                {partido.canchaConfirmada ? 'Cancha Reservada' : 'Cancha por Confirmar'}
              </span>
            </div>
          </div>
          
          <div className="text-right flex flex-col items-end gap-3">
            <span className={`text-[10px] font-black italic px-4 py-1.5 rounded-lg border tracking-wider ${partido.estado === 'PARTIDO LISTO' ? 'bg-green-500/20 text-green-500 border-green-500/30' : 'bg-[#ccff00]/10 text-[#ccff00] border-transparent'}`}>
              {partido.estado}
            </span>
            
            {isAdmin && (
              <button 
                onClick={(e) => onDelete(e, partido.id)}
                className="p-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-lg"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-black/60 p-5 rounded-[20px] border border-white/5 flex flex-col gap-1 shadow-inner">
            <span className="text-[9px] text-slate-500 font-black uppercase italic tracking-widest">Kick Off</span>
            <div className="flex items-center gap-2 font-black italic text-base text-white/90">
              <Clock className="text-[#ccff00]" size={16}/> {partido.hora}
            </div>
          </div>
          <div className="bg-black/60 p-5 rounded-[20px] border border-white/5 flex flex-col gap-1 shadow-inner">
            <span className="text-[9px] text-slate-500 font-black uppercase italic tracking-widest">Escuadra</span>
            <div className="flex items-center gap-2 font-black italic text-base text-white/90">
              <Users className="text-[#ccff00]" size={16}/> {partido.jugadores}/{partido.total}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchCard;