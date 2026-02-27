import React from 'react';
import { X, UserPlus, Swords, Calendar, MapPin, ChevronRight, Clock } from 'lucide-react';

// Datos de recintos oficiales para el selector
export const RECINTOS_OFICIALES = [
  { id: 'r1', nombre: "GREEN CLUB", ciudad: "TALCA", direccion: "24 Norte 1245", lat: -35.4120, lng: -71.6420 },
  { id: 'r2', nombre: "ESTADIO FISCAL", ciudad: "TALCA", direccion: "Alameda 251", lat: -35.4264, lng: -71.6554 },
  { id: 'r3', nombre: "CANCHITA 7", ciudad: "TALCA", direccion: "Av. Colín 0830", lat: -35.4410, lng: -71.6710 },
];

const MatchModals = ({ 
  user, modalType, setModalType, selectedPartido, handleUnirseMatch, 
  misEquipos, step, setStep, formPartida, setFormPartida, 
  handleCrearPartida, nuevoEquipo, setNuevoEquipo, setMisEquipos 
}) => {
  
  if (!modalType) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 md:p-6">
      {/* OVERLAY */}
      <div 
        className="absolute inset-0 bg-[#020617]/80 backdrop-blur-xl" 
        onClick={() => setModalType(null)} 
      />

      {/* CONTENEDOR MODAL */}
      <div className="relative bg-[#0b1224] border border-white/10 w-full max-w-xl rounded-[40px] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.8)]">
        
        {/* MODAL UNIRSE / RETAR */}
        {modalType === 'UNIRSE' && selectedPartido && (
          <div className="p-8 md:p-10 space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-4xl font-black italic uppercase tracking-tighter leading-none">
                  Confirmar <span className="text-[#ccff00]">Acción</span>
                </h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-2">
                  {selectedPartido.equipo} vs {selectedPartido.rival || '???'}
                </p>
              </div>
              <button onClick={() => setModalType(null)} className="p-3 hover:bg-white/5 rounded-full transition-colors text-slate-400">
                <X size={24}/>
              </button>
            </div>
            
            <div className="space-y-4">
              {selectedPartido.tipo === 'JUGADORES' ? (
                /* MODO JUGADOR INDIVIDUAL */
                <button 
                  onClick={() => handleUnirseMatch(selectedPartido.id, 'PLAYER')} 
                  className="w-full bg-white/5 border border-white/5 p-8 rounded-[32px] flex items-center gap-6 hover:bg-[#ccff00]/10 hover:border-[#ccff00] transition-all group text-left"
                >
                  <div className="bg-[#ccff00] p-4 rounded-2xl text-black shadow-lg shadow-[#ccff00]/20 group-hover:scale-110 transition-transform">
                    <UserPlus size={28} strokeWidth={3}/>
                  </div>
                  <div>
                    <p className="font-black italic uppercase text-xl tracking-tight">Sumarme a la pichanga</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Como jugador individual</p>
                  </div>
                </button>
              ) : (
                /* MODO VERSUS (RETO DE EQUIPO) */
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2 ml-2">
                    <Swords size={16} className="text-orange-500" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-orange-500 italic">Lanza un reto con tu club:</p>
                  </div>
                  
                  <div className="grid gap-3">
                    {misEquipos.map(me => {
                      // Validación: No puedes retarte a ti mismo con el mismo equipo
                      const isSameTeam = selectedPartido.equipo === me.nombre;
                      
                      return (
                        <button 
                          key={me.id} 
                          disabled={isSameTeam}
                          onClick={() => handleUnirseMatch(selectedPartido.id, 'TEAM', me)} 
                          className={`w-full p-6 rounded-[28px] flex items-center justify-between transition-all group border
                            ${isSameTeam 
                              ? 'bg-white/5 border-white/5 opacity-40 cursor-not-allowed' 
                              : 'bg-white/5 border-white/5 hover:border-orange-500 hover:bg-orange-500/5'}`}
                        >
                          <div className="flex items-center gap-5">
                            <div className={`p-3 rounded-xl transition-all ${isSameTeam ? 'bg-slate-800' : 'bg-orange-500/20 text-orange-500 group-hover:bg-orange-500 group-hover:text-black'}`}>
                              <Swords size={24}/>
                            </div>
                            <div className="text-left">
                              <p className="font-black italic uppercase text-lg leading-none">{me.nombre}</p>
                              {isSameTeam && <p className="text-[9px] font-bold text-orange-500 mt-1 uppercase">Tu equipo ya es el host</p>}
                            </div>
                          </div>
                          {!isSameTeam && <ChevronRight className="text-slate-600 group-hover:text-orange-500 group-hover:translate-x-1 transition-all"/>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODAL CREAR PARTIDA */}
        {modalType === 'PARTIDA' && (
          <div className="p-8 md:p-10 space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-4xl font-black italic uppercase tracking-tighter leading-none">
                {step === 1 ? 'Nueva' : 'Registrar'} <span className="text-[#ccff00]">{step === 1 ? 'Partida' : 'Club'}</span>
              </h2>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-white"><X size={24}/></button>
            </div>
            
            {step === 1 ? (
              <div className="space-y-5">
                {/* FILA 1: EQUIPO */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest italic">Selecciona tu Club</label>
                    <button onClick={() => setStep(2)} className="text-[#ccff00] text-[10px] font-black uppercase hover:underline">+ Crear Club</button>
                  </div>
                  <select 
                    value={formPartida.equipoId}
                    onChange={(e) => setFormPartida({...formPartida, equipoId: e.target.value})} 
                    className="w-full bg-white/5 border border-white/10 h-14 px-5 rounded-2xl text-white outline-none focus:border-[#ccff00] appearance-none cursor-pointer font-bold italic uppercase transition-all"
                  >
                    <option value="" className="bg-slate-900">-- SELECCIONA TU EQUIPO --</option>
                    {misEquipos.map(e => <option key={e.id} value={e.id} className="bg-slate-900">{e.nombre}</option>)}
                  </select>
                </div>

                {/* FILA 2: FECHA Y HORA (NUEVO) */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest italic px-1">Fecha</label>
                    <div className="relative">
                      <input 
                        type="date" 
                        value={formPartida.fecha}
                        onChange={(e) => setFormPartida({...formPartida, fecha: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 h-14 px-5 rounded-2xl text-white outline-none focus:border-[#ccff00] font-bold uppercase transition-all [color-scheme:dark]"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest italic px-1">Hora</label>
                    <div className="relative">
                      <input 
                        type="time" 
                        value={formPartida.hora}
                        onChange={(e) => setFormPartida({...formPartida, hora: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 h-14 px-5 rounded-2xl text-white outline-none focus:border-[#ccff00] font-bold transition-all [color-scheme:dark]"
                      />
                    </div>
                  </div>
                </div>

                {/* FILA 3: RECINTO */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest italic px-1">Ubicación (Recinto Oficial)</label>
                  <div className="relative">
                    <select 
                      value={formPartida.recintoId}
                      onChange={(e) => {
                        const rec = RECINTOS_OFICIALES.find(r => r.id === e.target.value);
                        if(rec) {
                          setFormPartida({
                            ...formPartida, 
                            recintoId: e.target.value, 
                            recinto: rec.nombre,
                            lat: rec.lat,
                            lng: rec.lng
                          });
                        }
                      }}
                      className="w-full bg-white/5 border border-white/10 h-14 px-5 rounded-2xl text-white outline-none focus:border-[#ccff00] appearance-none cursor-pointer font-bold italic uppercase transition-all"
                    >
                      <option value="" className="bg-slate-900">-- SELECCIONAR CANCHA --</option>
                      {RECINTOS_OFICIALES.map(r => (
                        <option key={r.id} value={r.id} className="bg-slate-900">{r.nombre} ({r.ciudad})</option>
                      ))}
                    </select>
                    <MapPin className="absolute right-5 top-4 text-slate-600" size={20}/>
                  </div>
                </div>

                {/* FILA 4: TOGGLE CANCHA */}
                <div className="bg-white/5 p-5 rounded-[24px] border border-white/5 flex justify-between items-center group hover:bg-white/[0.07] transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl transition-all ${formPartida.canchaConfirmada ? 'bg-[#ccff00] text-black' : 'bg-white/5 text-slate-500'}`}>
                      <Calendar size={20}/>
                    </div>
                    <div>
                      <p className="text-xs font-black italic uppercase">Cancha Reservada</p>
                      <p className="text-[9px] text-slate-500 font-bold uppercase">Activa si ya pagaste el turno</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setFormPartida({...formPartida, canchaConfirmada: !formPartida.canchaConfirmada})}
                    className={`w-14 h-8 rounded-full transition-all relative ${formPartida.canchaConfirmada ? 'bg-[#ccff00]' : 'bg-slate-700'}`}
                  >
                    <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all shadow-md ${formPartida.canchaConfirmada ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>

                {/* SELECTOR MODO */}
                <div className="flex gap-4">
                  <button 
                    onClick={() => setFormPartida({...formPartida, tipo: 'JUGADORES'})} 
                    className={`flex-1 py-5 rounded-2xl font-black italic text-[11px] uppercase border transition-all ${formPartida.tipo === 'JUGADORES' ? 'bg-[#ccff00] text-black border-[#ccff00]' : 'border-white/5 text-slate-500 hover:text-white hover:bg-white/5'}`}
                  >
                    Modo Mix
                  </button>
                  <button 
                    onClick={() => setFormPartida({...formPartida, tipo: 'RIVAL'})} 
                    className={`flex-1 py-5 rounded-2xl font-black italic text-[11px] uppercase border transition-all ${formPartida.tipo === 'RIVAL' ? 'bg-orange-500 text-black border-orange-500' : 'border-white/5 text-slate-500 hover:text-white hover:bg-white/5'}`}
                  >
                    Modo Versus
                  </button>
                </div>

                <button 
                  onClick={handleCrearPartida} 
                  disabled={!formPartida.equipoId || !formPartida.recintoId || !formPartida.fecha || !formPartida.hora}
                  className={`w-full h-20 text-lg font-black italic uppercase rounded-[28px] transition-all shadow-xl active:scale-95 mt-4 ${
                    formPartida.equipoId && formPartida.recintoId && formPartida.fecha && formPartida.hora
                    ? 'bg-[#ccff00] text-black shadow-[#ccff00]/20 hover:bg-white' 
                    : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
                  }`}
                >
                  Lanzar Pichanga
                </button>
              </div>
            ) : (
              /* REGISTRO DE NUEVO CLUB */
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest italic ml-1">Nombre de la Institución</label>
                  <input 
                    type="text" 
                    placeholder="E J :   T A L C A   W A R R I O R S" 
                    className="w-full bg-white/5 border border-white/10 h-20 px-6 rounded-[24px] text-white outline-none focus:border-[#ccff00] font-black italic uppercase text-xl placeholder:text-white/10" 
                    value={nuevoEquipo} 
                    onChange={(e) => setNuevoEquipo(e.target.value)} 
                    autoFocus
                  />
                </div>
                <button 
                  onClick={() => {
                    if (!nuevoEquipo.trim()) return;
                    const n = { id: Date.now(), nombre: nuevoEquipo.toUpperCase(), creadorEmail: user?.email };
                    setMisEquipos([...misEquipos, n]);
                    setNuevoEquipo('');
                    setStep(1);
                    setFormPartida({...formPartida, equipoId: n.id});
                  }} 
                  className="w-full h-16 bg-[#ccff00] text-black font-black italic uppercase rounded-[24px] hover:bg-white transition-all shadow-lg active:scale-95"
                >
                  Registrar Club Oficial
                </button>
                <button onClick={() => setStep(1)} className="w-full text-[10px] font-black uppercase text-slate-500 hover:text-white">Volver atrás</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchModals;