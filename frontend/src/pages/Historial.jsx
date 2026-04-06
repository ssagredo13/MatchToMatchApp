import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import MatchCard from '../components/MatchCard';
import { Loader2 } from 'lucide-react';

const Historial = ({ user, onLogout }) => {
  const [partidosPasados, setPartidosPasados] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // URL Dinámica según el entorno
  const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000") + "/api";

  useEffect(() => {
    const cargarHistorial = async () => {
      setLoading(true);
      try {
        // CORRECCIÓN: Usamos 'solo_activos=false' para que el backend no filtre los cancelados
        // y pasamos el email para que el backend haga el filtro de pertenencia directamente.
        const url = `${API_URL}/partidos?solo_activos=false&email=${user.email}`;
        const res = await fetch(url);
        
        if (res.ok) {
          const todos = await res.json();
          
          // Filtramos en el cliente para mostrar solo lo que NO está activo (Historial Real)
          const misPartidosNoActivos = todos.filter(p => p.activo === false);
          
          setPartidosPasados(misPartidosNoActivos);
        }
      } catch (err) {
        console.error("Error cargando el historial:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.email) {
      cargarHistorial();
    }
  }, [user.email, API_URL]);

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