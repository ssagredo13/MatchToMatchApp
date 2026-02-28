import React, { useState } from 'react';
import { X, UserPlus, Swords, Calendar, MapPin, ChevronRight, Clock, CheckCircle, Loader2 } from 'lucide-react';
import RecintoSelector from './RecintoSelector';

export const RECINTOS_OFICIALES = [
  { id: 'r1', nombre: "GREEN CLUB", ciudad: "TALCA", direccion: "24 Norte 1245", lat: -35.4120, lng: -71.6420 },
  { id: 'r2', nombre: "ESTADIO FISCAL", ciudad: "TALCA", direccion: "Alameda 251", lat: -35.4264, lng: -71.6554 },
  { id: 'r3', nombre: "CANCHITA 7", ciudad: "TALCA", direccion: "Av. Colín 0830", lat: -35.4410, lng: -71.6710 },
];

const MatchModals = ({ 
  user, modalType, setModalType, selectedPartido, handleUnirseMatch, 
  misEquipos, step, setStep, formPartida, setFormPartida, 
  handleCrearPartida, nuevoEquipo, setNuevoEquipo, setMisEquipos,
  handleCrearEquipoDB 
}) => {
  
  const [isCreating, setIsCreating] = useState(false);

  if (!modalType) return null;

  // Helper para obtener el ID real (sea _id de Mongo o id simple)
  const getEntityId = (entity) => entity?._id || entity?.id;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 md:p-6">
      <div 
        className="absolute inset-0 bg-[#020617]/80 backdrop-blur-xl" 
        onClick={() => setModalType(null)} 
      />

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
                <button 
                  onClick={() => handleUnirseMatch(getEntityId(selectedPartido), 'PLAYER')} 
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
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2 ml-2">
                    <Swords size={16} className="text-orange-500" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-orange-500 italic">Lanza un reto con tu club:</p>
                  </div>
                  
                  <div className="grid gap-3">
                    {misEquipos.map(me => {
                      const isSameTeam = selectedPartido.equipo === me.nombre;
                      const teamId = getEntityId(me);
                      return (
                        <button 
                          key={teamId} 
                          disabled={isSameTeam}
                          onClick={() => handleUnirseMatch(getEntityId(selectedPartido), 'TEAM', me)} 
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
                    {misEquipos.map(e => (
                      <option key={getEntityId(e)} value={getEntityId(e)} className="bg-slate-900">
                        {e.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest italic px-1">Fecha</label>
                    <input 
                      type="date" 
                      value={formPartida.fecha}
                      onChange={(e) => setFormPartida({...formPartida, fecha: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 h-14 px-5 rounded-2xl text-white outline-none focus:border-[#ccff00] font-bold uppercase transition-all [color-scheme:dark]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest italic px-1">Hora</label>
                    <input 
                      type="time" 
                      value={formPartida.hora}
                      onChange={(e) => setFormPartida({...formPartida, hora: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 h-14 px-5 rounded-2xl text-white outline-none focus:border-[#ccff00] font-bold transition-all [color-scheme:dark]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest italic px-1">Ubicación</label>
                  <RecintoSelector 
                    defaultValue={formPartida.recinto}
                    onSelectRecinto={(datos) => {
                      const coincidencia = RECINTOS_OFICIALES.find(
                        r => r.nombre.toUpperCase() === datos.nombre.toUpperCase()
                      );
                      setFormPartida({
                        ...formPartida, 
                        recinto: datos.nombre,
                        direccion: datos.direccion,
                        lat: datos.lat,
                        lng: datos.lng,
                        isOficial: !!coincidencia
                      });
                    }}
                  />
                  <div className="flex items-center justify-between px-1">
                    {formPartida.isOficial ? (
                      <p className="text-[9px] text-[#ccff00] font-black uppercase flex items-center gap-1 italic">
                        <CheckCircle size={10} strokeWidth={3} /> Recinto Oficial Verificado
                      </p>
                    ) : formPartida.recinto ? (
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tight">
                        📍 {formPartida.direccion || 'Recinto sugerido por usuario'}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-3 bg-white/5 p-5 rounded-[24px] border border-white/5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest italic">¿Con cuántos jugadores cuentas?</label>
                    <span className="text-[#ccff00] font-black italic text-sm">{formPartida.jugadoresInvitados || 0} / 6</span>
                  </div>
                  <div className="flex gap-2">
                    {[0, 1, 2, 3, 4, 5, 6].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setFormPartida({ ...formPartida, jugadoresInvitados: num })}
                        className={`flex-1 h-10 rounded-xl font-black transition-all border ${
                          (formPartida.jugadoresInvitados || 0) === num 
                          ? 'bg-[#ccff00] text-black border-[#ccff00] scale-105 shadow-lg shadow-[#ccff00]/20' 
                          : 'bg-white/5 text-white border-white/10 hover:border-white/40'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setFormPartida({...formPartida, tipo: 'JUGADORES'})} 
                    className={`flex-1 py-5 rounded-2xl font-black italic text-[11px] uppercase border transition-all ${formPartida.tipo === 'JUGADORES' ? 'bg-[#ccff00] text-black border-[#ccff00]' : 'border-white/5 text-slate-500 hover:text-white hover:bg-white/5'}`}
                  > Modo Mix </button>
                  <button 
                    type="button"
                    onClick={() => setFormPartida({...formPartida, tipo: 'RIVAL'})} 
                    className={`flex-1 py-5 rounded-2xl font-black italic text-[11px] uppercase border transition-all ${formPartida.tipo === 'RIVAL' ? 'bg-orange-500 text-black border-orange-500' : 'border-white/5 text-slate-500 hover:text-white hover:bg-white/5'}`}
                  > Modo Versus </button>
                </div>

                <button 
                  onClick={handleCrearPartida} 
                  disabled={!formPartida.equipoId || !formPartida.recinto || !formPartida.fecha || !formPartida.hora}
                  className={`w-full h-20 text-lg font-black italic uppercase rounded-[28px] transition-all shadow-xl active:scale-95 mt-4 ${
                    formPartida.equipoId && formPartida.recinto && formPartida.fecha && formPartida.hora
                    ? 'bg-[#ccff00] text-black shadow-[#ccff00]/20 hover:bg-white' 
                    : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
                  }`}
                > Lanzar Pichanga </button>
              </div>
            ) : (
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
                  disabled={!nuevoEquipo.trim() || isCreating}
                  onClick={async () => {
                    if (!nuevoEquipo.trim()) return;
                    setIsCreating(true);
                    try {
                      const equipoGuardado = await handleCrearEquipoDB(nuevoEquipo.toUpperCase());
                      if (equipoGuardado) {
                        setNuevoEquipo('');
                        setStep(1);
                        // ✅ Sincronización con el ID de la DB (sea _id o id)
                        setFormPartida({...formPartida, equipoId: getEntityId(equipoGuardado)});
                      }
                    } catch (error) {
                      console.error("Error al registrar equipo:", error);
                    } finally {
                      setIsCreating(false);
                    }
                  }} 
                  className="w-full h-16 bg-[#ccff00] text-black font-black italic uppercase rounded-[24px] hover:bg-white transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                >
                  {isCreating ? <><Loader2 className="animate-spin" size={20} /> Registrando...</> : 'Registrar Club Oficial'}
                </button>
                <button onClick={() => setStep(1)} disabled={isCreating} className="w-full text-[10px] font-black uppercase text-slate-500 hover:text-white">
                  Volver atrás
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchModals;