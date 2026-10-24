import React, { useCallback, useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import PastMatchList from '../components/Dashboard/PastMatchList';
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

      <main className="mx-auto max-w-[1100px] px-4 pb-20 pt-28 md:px-8 md:pt-36">
        <div className="mb-8">
          <h2 className="text-[11px] font-black italic text-[#CCFF00] uppercase tracking-[0.5em] ml-1">Archivo de Pichangas</h2>
          <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-[0.9] sm:text-6xl">
            Mi <span className="text-slate-500">Historial</span>
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
          <div className="rounded-2xl border border-white/10 bg-[#0b1224] p-8 text-center sm:p-12">
            <p className="font-black italic uppercase tracking-widest text-slate-300">
              No tienes partidos cancelados o finalizados.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-[#080e1d] p-3 sm:p-5">
            <PastMatchList matches={partidosPasados} />
          </div>
        )}
      </main>
    </div>
  );
};

export default Historial;