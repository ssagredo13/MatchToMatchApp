import React from 'react';
import { X, UserPlus, Swords, Calendar } from 'lucide-react';

const MatchModals = ({ 
  modalType, 
  setModalType, 
  selectedPartido, 
  handleUnirseMatch, 
  misEquipos, 
  step, 
  setStep, 
  formPartida, 
  setFormPartida, 
  handleCrearPartida, 
  nuevoEquipo, 
  setNuevoEquipo, 
  setMisEquipos 
}) => {
  if (!modalType) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl">
      <div className="bg-[#0f172a] border border-white/10 w-full max-w-xl rounded-[48px] overflow-hidden shadow-2xl">
        
        {/* MODAL UNIRSE */}
        {modalType === 'UNIRSE' && selectedPartido && (
          <div className="p-12 space-y-8">
            <div className="flex justify-between items-center border-b border-white/5 pb-6">
              <h2 className="text-4xl font-black italic uppercase tracking-tighter">Confirmar <span className="text-[#ccff00]">Acción</span></h2>
              <button onClick={() => setModalType(null)} className="p-3 hover:bg-white/5 rounded-full transition-all"><X size={24}/></button>
            </div>
            
            <div className="space-y-4">
              {selectedPartido.tipo === 'JUGADORES' ? (
                <button onClick={() => handleUnirseMatch(selectedPartido.id, 'PLAYER')} className="w-full bg-slate-900 border border-white/10 p-8 rounded-[32px] flex items-center gap-6 hover:border-[#ccff00] transition-all group text-left">
                  <div className="bg-[#ccff00]/10 p-5 rounded-2xl text-[#ccff00] group-hover:bg-[#ccff00] group-hover:text-black transition-all shadow-lg"><UserPlus size={32} strokeWidth={2.5}/></div>
                  <div>
                    <p className="font-black italic uppercase text-lg tracking-tight">Sumarme al equipo</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Ingresas como jugador individual a {selectedPartido.equipo}</p>
                  </div>
                </button>
              ) : (
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#ccff00] italic">Aceptar desafío con uno de tus equipos:</p>
                  {misEquipos.map(me => (
                    <button key={me.id} onClick={() => handleUnirseMatch(selectedPartido.id, 'TEAM', me)} className="w-full bg-slate-900 border border-white/10 p-8 rounded-[32px] flex items-center gap-6 hover:border-orange-500 transition-all group text-left">
                      <div className="bg-orange-500/10 p-5 rounded-2xl text-orange-500 group-hover:bg-orange-500 group-hover:text-black transition-all shadow-lg"><Swords size={32} strokeWidth={2.5}/></div>
                      <div>
                        <p className="font-black italic uppercase text-lg tracking-tight">Retar con {me.nombre}</p>
                        <p className="text-[10px] text-orange-500 font-bold uppercase tracking-widest mt-1">Matchmaking 6 vs 6 automático</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODAL CREAR PARTIDA / EQUIPO */}
        {modalType === 'PARTIDA' && (
          <div className="p-12 space-y-8">
            <div className="flex justify-between items-center border-b border-white/5 pb-6">
              <h2 className="text-4xl font-black italic uppercase tracking-tighter">{step === 1 ? 'Nueva Partida' : 'Registrar Club'}</h2>
              <button onClick={() => setModalType(null)}><X size={24}/></button>
            </div>
            
            {step === 1 ? (
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-[10px] font-black uppercase text-slate-500 italic tracking-widest">Selecciona tu Club</label>
                    <button onClick={() => setStep(2)} className="text-[#ccff00] text-[10px] font-black uppercase hover:underline">+ Crear Club</button>
                  </div>
                  <select 
                    value={formPartida.equipoId}
                    onChange={(e) => setFormPartida({...formPartida, equipoId: e.target.value})} 
                    className="input-dark cursor-pointer appearance-none w-full"
                  >
                    <option value="">-- Elige un equipo para liderar --</option>
                    {misEquipos.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                  </select>
                </div>

                <input 
                  type="text" 
                  placeholder="NOMBRE DEL RECINTO (EJ: CANCHA 7)" 
                  className="input-dark uppercase w-full"
                  value={formPartida.recinto}
                  onChange={(e) => setFormPartida({...formPartida, recinto: e.target.value})}
                />

                <div className="bg-white/5 p-6 rounded-2xl border border-white/10 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Calendar className="text-[#ccff00]" size={20}/>
                    <div>
                      <p className="text-xs font-black italic uppercase tracking-tight">¿Ya reservaste la cancha?</p>
                      <p className="text-[9px] text-slate-500 font-bold uppercase">Marca esto si el turno ya es tuyo</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setFormPartida({...formPartida, canchaConfirmada: !formPartida.canchaConfirmada})}
                    className={`w-14 h-8 rounded-full transition-all relative ${formPartida.canchaConfirmada ? 'bg-[#ccff00]' : 'bg-slate-700'}`}
                  >
                    <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${formPartida.canchaConfirmada ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>

                <div className="flex gap-4">
                  <button onClick={() => setFormPartida({...formPartida, tipo: 'JUGADORES'})} className={`flex-1 py-5 rounded-2xl font-black italic text-[11px] uppercase border transition-all ${formPartida.tipo === 'JUGADORES' ? 'bg-[#ccff00] text-black border-[#ccff00]' : 'border-white/10 text-slate-500'}`}>Modo Mix</button>
                  <button onClick={() => setFormPartida({...formPartida, tipo: 'RIVAL'})} className={`flex-1 py-5 rounded-2xl font-black italic text-[11px] uppercase border transition-all ${formPartida.tipo === 'RIVAL' ? 'bg-orange-500 text-black border-orange-500' : 'border-white/10 text-slate-500'}`}>Modo Versus</button>
                </div>

                <button 
                  onClick={handleCrearPartida} 
                  disabled={!formPartida.equipoId}
                  className="w-full btn-primary h-20 text-lg"
                >
                  Publicar Pichanga
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <input type="text" placeholder="NOMBRE DEL NUEVO CLUB" className="input-dark uppercase w-full" value={nuevoEquipo} onChange={(e) => setNuevoEquipo(e.target.value)} />
                <button onClick={() => {
                  if (!nuevoEquipo) return;
                  const n = { id: Date.now(), nombre: nuevoEquipo.toUpperCase() };
                  setMisEquipos([...misEquipos, n]);
                  setNuevoEquipo('');
                  setStep(1);
                }} className="w-full btn-primary">Registrar Club en la Liga</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchModals;