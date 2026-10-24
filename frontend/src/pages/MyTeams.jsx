import React, { useCallback, useState, useEffect } from 'react';
import { Loader2, Plus, Users, Trophy } from 'lucide-react';
import MatchModals from '../components/MatchModals';
import { apiFetch } from '../lib/api';

const MyTeams = ({ user }) => {
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [nuevoEquipo, setNuevoEquipo] = useState('');
  const [modalType, setModalType] = useState(null);
  const [step, setStep] = useState(1);

  const [formPartida, setFormPartida] = useState({
    equipoId: '', recinto: '', hora: '', fecha: '', tipo: 'JUGADORES'
  });

  const fetchEquipos = useCallback(async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      const data = await apiFetch(`/api/equipos?email=${encodeURIComponent(user.email)}`);
      setEquipos(data);
      setError('');
    } catch (error) {
      setError(error.message || 'No se pudieron cargar los equipos.');
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    fetchEquipos();
  }, [fetchEquipos]);

  const handleCrearEquipoDB = async (nombreDelNuevoEquipo) => {
    try {
      const guardado = await apiFetch('/api/equipos', {
        method: 'POST',
        body: JSON.stringify({ nombre: nombreDelNuevoEquipo })
      });

      setEquipos(prev => [...prev, guardado]);
      return guardado;
    } catch (error) {
      setError(error.message || 'No se pudo crear el equipo.');
      throw error;
    }
  };

  // ... (El resto del render se mantiene igual)
  if (loading) return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <Loader2 className="animate-spin text-[#CCFF00]" size={48} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      <main className="pt-36 px-4 max-w-[1200px] mx-auto pb-20">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-[#CCFF00] font-black italic uppercase tracking-widest text-xs mb-2">Gestión de Clubes</h2>
            <h1 className="text-6xl font-black italic uppercase tracking-tighter">
              Mis <span className="opacity-20">Equipos</span>
            </h1>
          </div>
          
          <button 
            onClick={() => {
              setStep(2); 
              setModalType('PARTIDA'); 
            }}
            className="bg-[#CCFF00] text-black font-black italic uppercase px-8 py-4 flex items-center gap-2 hover:bg-white transition-colors rounded-xl shadow-lg active:scale-95"
          >
            <Plus size={20} strokeWidth={3} /> Crear Club
          </button>
        </div>
        {error && (
          <div role="alert" className="mb-6 rounded-xl border border-red-400/30 bg-red-500/10 px-5 py-4 text-sm font-bold text-red-200">
            {error}
            <button type="button" onClick={fetchEquipos} className="ml-3 underline underline-offset-4">
              Reintentar
            </button>
          </div>
        )}

        {equipos.length === 0 ? (
          <div className="border border-white/5 bg-white/5 rounded-[32px] p-20 text-center">
            <Users className="mx-auto mb-4 opacity-20" size={64} />
            <p className="text-slate-500 font-bold uppercase italic">No tienes equipos creados.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {equipos.map(eq => (
              <div key={eq.id || eq._id} className="bg-[#0b1224] border border-white/5 p-8 rounded-[32px] relative overflow-hidden group hover:border-[#CCFF00]/50 transition-all">
                <div className="relative z-10">
                  <div className="bg-[#CCFF00]/10 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                    <Trophy className="text-[#CCFF00]" size={24} />
                  </div>
                  <h3 className="text-2xl font-black italic uppercase mb-1">{eq.nombre}</h3>
                  <p className="text-slate-500 text-xs font-bold uppercase mb-6 tracking-widest">Club Registrado</p>
                  <button className="text-[#CCFF00] text-[10px] font-black uppercase italic border-b border-[#CCFF00] pb-1 hover:text-white hover:border-white transition-all">
                    Gestionar Club
                  </button>
                </div>
                <Trophy className="absolute -right-4 -bottom-4 text-white/5 group-hover:text-[#CCFF00]/5 transition-colors" size={120} />
              </div>
            ))}
          </div>
        )}
      </main>

      <MatchModals 
        errorMessage={error}
        modalType={modalType}
        setModalType={setModalType}
        step={step}
        setStep={setStep}
        nuevoEquipo={nuevoEquipo}
        setNuevoEquipo={setNuevoEquipo}
        misEquipos={equipos}
        handleCrearEquipoDB={handleCrearEquipoDB}
        formPartida={formPartida} 
        setFormPartida={setFormPartida}
      />
    </div>
  );
};

export default MyTeams;