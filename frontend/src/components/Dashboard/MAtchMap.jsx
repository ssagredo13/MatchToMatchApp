// src/components/Dashboard/ActivePlayers.jsx
import React, { useState, useEffect } from 'react';
import { Users, MapPin, Loader2, Search } from 'lucide-react';

const PlayerAvatar = ({ src, online }) => (
  <div className="relative flex-shrink-0">
    <img 
      src={src || '/default-avatar.png'} 
      alt="Pichanguero"
      className="w-12 h-12 rounded-full border-2 border-slate-700 object-cover"
    />
    {online && (
      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#CCFF00] rounded-full border-2 border-[#0b1224] shadow-[0_0_10px_#CCFF00]" />
    )}
  </div>
);

const formatTimeAgo = (timestamp) => {
  if (!timestamp) return 'Hace tiempo';
  const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) return `Hace ${Math.floor(interval)} años`;
  interval = seconds / 2592000;
  if (interval > 1) return `Hace ${Math.floor(interval)} meses`;
  interval = seconds / 86400;
  if (interval > 1) return `Hace ${Math.floor(interval)} días`;
  interval = seconds / 3600;
  if (interval > 1) return `Hace ${Math.floor(interval)}h`;
  interval = seconds / 60;
  if (interval > 1) return `Hace ${Math.floor(interval)}min`;
  
  return 'Reciente';
};

const ActivePlayers = ({ currentUserEmail, className = "" }) => {
  // Inicializamos con un objeto que tiene las listas vacías para evitar errores de .length
  const [jugadores, setJugadores] = useState({ online: [], recientes: [] });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000") + "/api";

  useEffect(() => {
    const cargarJugadores = async () => {
      try {
        const res = await fetch(`${API_URL}/usuarios/activos?email=${currentUserEmail}`);
        if (res.ok) {
          const data = await res.json();
          // El backend ya envía { online: [], recientes: [] }, así que lo guardamos directo
          setJugadores(data);
        }
      } catch (err) {
        console.error("Error cargando jugadores activos:", err);
      } finally {
        setLoading(false);
      }
    };
    if (currentUserEmail) cargarJugadores();
  }, [currentUserEmail, API_URL]);

  const filtrarJugadores = (lista) => {
    if (!searchTerm) return lista;
    const term = searchTerm.toLowerCase();
    return lista.filter(j => 
      j.nombreReal?.toLowerCase().includes(term) || 
      j.ciudad?.toLowerCase().includes(term)
    );
  };

  if (loading) return (
    <div className="bg-[#0b1224] p-8 rounded-[40px] border border-white/5 flex flex-col items-center justify-center gap-4 h-[600px]">
      <Loader2 className="animate-spin text-[#CCFF00]" size={32} />
      <p className="text-sm text-slate-500 font-bold uppercase tracking-widest animate-pulse">Buscando pichangueros...</p>
    </div>
  );

  const totalActivos = (jugadores.online?.length || 0) + (jugadores.recientes?.length || 0);

  return (
    <aside className={`bg-[#0b1224] p-8 rounded-[40px] border border-white/5 h-full flex flex-col ${className}`}>
      
      {/* HEADER PANEL */}
      <div className="flex justify-between items-center mb-8 gap-4">
        <div>
          <h2 className="text-[11px] font-black italic text-[#CCFF00] uppercase tracking-[0.5em] ml-1">Comunidad M2M</h2>
          <h3 className="text-3xl font-black italic uppercase tracking-tighter">
            Pichangueros <span className="opacity-10">Live</span>
          </h3>
        </div>
        <div className="flex items-center gap-2.5 bg-white/5 px-5 py-3 rounded-full border border-white/5">
          <Users size={20} className="text-[#CCFF00]" />
          <span className="text-xl font-black italic text-white">{totalActivos}</span>
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
        <input 
          type="text"
          placeholder="Ej: Sebastián - Talca"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-12 pl-12 pr-6 bg-white/5 border border-white/5 rounded-2xl text-white outline-none focus:border-[#CCFF00]/40 font-bold placeholder:text-slate-600 transition-all text-sm"
        />
      </div>

      <div className="flex-1 space-y-8 overflow-y-auto pr-3 no-scrollbar h-[500px]">
        
        {/* ONLINE NOW */}
        {jugadores.online?.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase text-[#CCFF00] tracking-[0.2em] ml-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#CCFF00] rounded-full animate-pulse" />
              Jugando o Conectados (Talca Hub)
            </h4>
            <div className="flex flex-wrap gap-3">
              {filtrarJugadores(jugadores.online).map(j => (
                <div key={j._id || j.id} className="group relative" title={`${j.nombreReal} - ${j.ciudad}`}>
                  <PlayerAvatar src={j.photoURL} online={true} />
                  <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 px-2 py-0.5 rounded text-[9px] font-bold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    {j.nombreReal?.split(' ')[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RECIENTES Y ACTIVIDAD */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">Actividad Reciente / Comunidad</h4>
          <div className="space-y-3">
            {filtrarJugadores(jugadores.recientes || []).map(j => (
              <div 
                key={j._id || j.id} 
                className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-center justify-between gap-4 group hover:border-[#CCFF00]/20 hover:bg-[#CCFF00]/5 transition-all"
              >
                <div className="flex items-center gap-4">
                  <PlayerAvatar src={j.photoURL} online={false} />
                  <div>
                    <p className="font-black italic uppercase text-lg leading-none">{j.nombreReal}</p>
                    <div className="flex items-center gap-1.5 mt-1.5 text-slate-600 group-hover:text-slate-400 transition-colors">
                      <MapPin size={12} />
                      <p className="text-[9px] font-bold uppercase tracking-widest">{j.ciudad || 'Ciudad'}</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest whitespace-nowrap">Últ. vez</span>
                  <span className="text-xs font-black italic text-slate-500 group-hover:text-white transition-colors">
                    {formatTimeAgo(j.ultimaConexion)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default ActivePlayers;