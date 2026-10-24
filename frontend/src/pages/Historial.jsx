import React, { useCallback, useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import MatchCard from '../components/MatchCard';
import { Loader2 } from 'lucide-react';
import { apiFetch } from '../lib/api';

const Historial = ({ user, onLogout }) => {
  const [partidosPasados, setPartidosPasados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const cargarHistorial = useCallback(async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      const todos = await apiFetch(
        `/api/partidos?solo_activos=false&email=${encodeURIComponent(user.email)}`
      );
      setPartidosPasados(todos.filter(p => p.activo === false));
      setError('');
    } catch (err) {
      setError(err.message || 'No se pudo cargar el historial.');
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    cargarHistorial();
  }, [cargarHistorial]);

  if (loading) return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-[#CCFF00]" size={48} />
      <p className="font-black italic text-white uppercase tracking-widest animate-pulse">Consultando registros...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans selection:bg-[#ccff00] overflow-x-hidden">
      <Navbar user={user} onLogout={onLogout} />

      <main className="pt-36 px-4 md:px-8 max-w-[1400px] mx-auto pb-20">
        <div className="mb-16">
          <h2 className="text-[11px] font-black italic text-[#CCFF00] uppercase tracking-[0.5em] ml-1">Archivo de Pichangas</h2>
          <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter leading-[0.85]">
            Mi <span className="opacity-10">Historial</span>
          </h1>
        </div>

        {error && (
          <div role="alert" className="mb-6 rounded-xl border border-red-400/30 bg-red-500/10 px-5 py-4 text-sm font-bold text-red-200">
            {error}
            <button type="button" onClick={cargarHistorial} className="ml-3 underline underline-offset-4">
              Reintentar
            </button>
          </div>
        )}

        {partidosPasados.length === 0 ? (
          <div className="border border-white/5 bg-white/5 p-20 text-center rounded-[48px]">
            <p className="text-slate-500 font-black italic uppercase text-lg tracking-widest">
              No tienes partidos cancelados o finalizados.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {partidosPasados.map(p => {
              const pId = p._id || p.id;
              return (
                <div 
                  key={pId} 
                  className="transition-all duration-500 opacity-60 hover:opacity-100 grayscale-[0.4] hover:grayscale-0"
                >
                  <MatchCard 
                    partido={p} 
                    user={user} 
                    readOnly={true} // Evitamos que se puedan "cancelar" denuevo desde aquí
                  />
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Historial;