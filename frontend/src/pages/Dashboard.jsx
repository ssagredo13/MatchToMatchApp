import React, { useState, useEffect } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import L from 'leaflet';

// COMPONENTES MODULARIZADOS
import Navbar from '../components/Navbar';
import MatchModals from '../components/MatchModals';
import MatchSilo from '../components/Dashboard/MatchSilo';
import MatchMapLive from '../components/Dashboard/MatchMapLive';
import MatchFilters from '../components/Dashboard/MatchFilters';

// --- CONFIGURACIÓN DE ICONOS LEAFLET ---
const neonIcon = new L.DivIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: #ccff00; width: 15px; height: 15px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 15px #ccff00;"></div>`,
  iconSize: [15, 15],
  iconAnchor: [7, 7]
});

const Dashboard = ({ user, onLogout }) => {
  // --- ESTADOS ---
  const [partidos, setPartidos] = useState([]);
  const [recintosOficiales, setRecintosOficiales] = useState([]);
  const [misEquipos, setMisEquipos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [filtro, setFiltro] = useState('TODOS');
  const [modalType, setModalType] = useState(null); 
  const [step, setStep] = useState(1);
  const [selectedPartido, setSelectedPartido] = useState(null);
  const [activeMatchId, setActiveMatchId] = useState(null);
  const [mapCenter, setMapCenter] = useState([-35.4264, -71.6554]); 
  const [nuevoEquipo, setNuevoEquipo] = useState('');
  
  const [formPartida, setFormPartida] = useState({ 
    equipoId: '', recinto: '', recintoId: '', lat: null, lng: null,
    hora: '', fecha: '', tipo: 'JUGADORES', jugadoresPorLado: 6,
    jugadoresInvitados: 0, requiereArquero: false, canchaConfirmada: false 
  });

  const isAdmin = user?.email === 'ssagredo13@gmail.com';
  const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000") + "/api";

  // --- CARGA DE DATOS ---
  const cargarPartidas = async () => {
    try {
      const res = await fetch(`${API_URL}/partidos`);
      if (res.ok) setPartidos(await res.json());
    } catch (err) {
      console.error("Error cargando partidas:", err);
    }
  };

  useEffect(() => {
    const cargarDatosBase = async () => {
      setLoading(true);
      try {
        const [resRecintos, resEquipos] = await Promise.all([
          fetch(`${API_URL}/recintos`),
          fetch(`${API_URL}/equipos?email=${user.email}`)
        ]);
        if (resRecintos.ok) setRecintosOficiales(await resRecintos.json());
        if (resEquipos.ok) setMisEquipos(await resEquipos.json());
        await cargarPartidas();
      } catch (err) {
        console.error("⚠️ Error conectando al backend:", err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.email) cargarDatosBase();
  }, [user.email, API_URL]);

  useEffect(() => {
    const intervalo = setInterval(cargarPartidas, 20000);
    return () => clearInterval(intervalo);
  }, []);

  // --- HANDLERS ---
  const handleCrearEquipoDB = async (nombreNuevo) => {
    const nuevo = { nombre: nombreNuevo, creadorEmail: user.email };
    try {
      const res = await fetch(`${API_URL}/equipos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevo)
      });
      if (res.ok) {
        const guardado = await res.json();
        setMisEquipos(prev => [...prev, guardado]);
        return guardado;
      }
    } catch (e) {
      alert("❌ Error al guardar el equipo");
    }
  };
  
  const handleCrearPartida = async () => {
    const eq = misEquipos.find(e => (e._id || e.id) === formPartida.equipoId);
    const iniciales = Number(formPartida.jugadoresInvitados) || 1; 
    const totalCupos = Number(formPartida.jugadoresPorLado) * 2;

    const nuevaPartida = {
      equipo: eq?.nombre || "Sin Equipo",
      equipoId: String(formPartida.equipoId),
      creadorEmail: user.email,
      creadorNombre: user.nombreReal || user.name || "Organizador",
      recinto: formPartida.recinto,
      lat: parseFloat(formPartida.lat),
      lng: parseFloat(formPartida.lng),
      hora: formPartida.hora,
      fecha: formPartida.fecha,
      tipo: formPartida.tipo,
      jugadores: iniciales, 
      total: totalCupos,
      arqueroFaltante: !!formPartida.requiereArquero,
      jugadoresInscritos: [user.email],
      estado: formPartida.tipo === 'RIVAL' ? 'BUSCANDO RIVAL' : 'BUSCANDO JUGADORES',
      activo: true 
    };

    try {
      const res = await fetch(`${API_URL}/partidos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevaPartida)
      });

      if (res.ok) {
        const guardada = await res.json();
        setPartidos([guardada, ...partidos]);
        setModalType(null);
        alert("✅ Partida publicada exitosamente");
      }
    } catch (error) {
      alert("❌ Error de red.");
    }
  };

  const handleUnirseMatch = async (pId, mode, equipoData = null) => {
    try {
      const payload = mode === 'PLAYER' 
        ? { nuevoJugadorEmail: user.email }
        : { rival: equipoData.nombre, estado: "PARTIDO LISTO", jugadores: 12 };

      const res = await fetch(`${API_URL}/partidos/${pId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const partidoActualizado = await res.json();
        setPartidos(prev => prev.map(p => (p._id || p.id) === pId ? partidoActualizado : p));
        setModalType(null);
      }
    } catch (error) {
      console.error("Error uniendo al match:", error);
    }
  };

  const handleEliminarPartido = async (e, pId) => {
    e.stopPropagation();
    try {
      const res = await fetch(`${API_URL}/partidos/${pId}/cancelar`, { method: 'PATCH' });
      if (res.ok) {
        setPartidos(prev => prev.filter(p => (p._id || p.id) !== pId));
      }
    } catch (error) {
      console.error("Error al cancelar:", error);
    }
  };

  // --- LÓGICA DE SILOS (PASADO, HOY, FUTURO) ---
  const hoy = new Date();
  const hoyStr = hoy.toLocaleDateString('en-CA');

  const haceSieteDias = new Date();
  haceSieteDias.setDate(hoy.getDate() - 7);
  const haceSieteDiasStr = haceSieteDias.toLocaleDateString('en-CA');

  const matchesFiltrados = partidos.filter(p => filtro === 'TODOS' || p.estado === filtro);

  const partidasHoy = matchesFiltrados.filter(p => p.fecha === hoyStr);
  const partidasFuturas = matchesFiltrados
    .filter(p => p.fecha > hoyStr)
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  const partidasPasadas = matchesFiltrados
    .filter(p => p.fecha < hoyStr && p.fecha >= haceSieteDiasStr)
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  // --- PROPS PARA MODALES ---
  const modalProps = {
    user, modalType, setModalType, selectedPartido, handleUnirseMatch,
    misEquipos, step, setStep, formPartida, setFormPartida,
    handleCrearPartida, nuevoEquipo, setNuevoEquipo, setMisEquipos,
    recintosOficiales, handleCrearEquipoDB
  };

  if (loading) return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-[#CCFF00]" size={48} />
      <p className="font-black italic text-white uppercase tracking-widest animate-pulse">Sincronizando red...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans selection:bg-[#ccff00] overflow-x-hidden">
      <Navbar user={user} onLogout={onLogout} />

      <main className="pt-36 px-4 md:px-8 max-w-[1400px] mx-auto pb-20">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
          <div className="space-y-2">
            <h2 className="text-[11px] font-black italic text-[#CCFF00] uppercase tracking-[0.5em] ml-1">Live Talca Hub</h2>
            <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter leading-[0.85]">
              Partidas <span className="opacity-10">Activas</span>
            </h1>
          </div>
          <button 
            onClick={() => {setModalType('PARTIDA'); setStep(1);}} 
            className="bg-[#CCFF00] text-black h-16 px-10 rounded-none skew-x-[-12deg] hover:bg-white transition-all shadow-[0_0_30px_rgba(204,255,0,0.15)] active:scale-95"
          >
            <div className="skew-x-[12deg] flex items-center gap-3 font-black italic uppercase text-base">
              <Plus size={24} strokeWidth={3}/> Crear Partida
            </div>
          </button>
        </header>

        <MatchFilters filtro={filtro} setFiltro={setFiltro} />

        {/* --- CONTENEDOR DE SILOS --- */}
        <div className="space-y-20 mb-20">
          
          {/* NIVEL 1: HOY (DESTACADO - ANCHO COMPLETO) */}
          <div className="relative w-full">
            <div className="absolute -inset-4 bg-[#CCFF00]/5 blur-3xl rounded-[60px] -z-10" />
            <MatchSilo 
              title="Match Center" 
              subtitle="LIVE / HOY"
              matches={partidasHoy} 
              user={user} isAdmin={isAdmin}
              activeMatchId={activeMatchId} setActiveMatchId={setActiveMatchId}
              setMapCenter={setMapCenter} onDelete={handleEliminarPartido}
              onSelect={(m) => { setSelectedPartido(m); setModalType('UNIRSE'); }}
            />
            {partidasHoy.length === 0 && (
              <div className="border-2 border-dashed border-white/5 rounded-[40px] py-16 text-center">
                <p className="text-white/20 font-black italic uppercase tracking-[0.3em] text-sm">
                  No hay acción para hoy... <span className="text-[#CCFF00]/40">¡Organiza el primero!</span>
                </p>
              </div>
            )}
          </div>

          {/* NIVEL 2 Y 3: GRILLA SECUNDARIA (DOS COLUMNAS AMPLIAS) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            
            {/* PRÓXIMAMENTE */}
            <div className="bg-white/[0.02] p-8 rounded-[48px] border border-white/5 hover:border-[#CCFF00]/20 transition-all duration-500">
              <MatchSilo 
                title="Próximamente" 
                subtitle="CALENDARIO / PLANES"
                matches={partidasFuturas} 
                user={user} isAdmin={isAdmin}
                activeMatchId={activeMatchId} setActiveMatchId={setActiveMatchId}
                setMapCenter={setMapCenter} onDelete={handleEliminarPartido}
                onSelect={(m) => { setSelectedPartido(m); setModalType('UNIRSE'); }}
              />
              {partidasFuturas.length === 0 && (
                <p className="text-white/10 italic text-xs uppercase tracking-widest text-center py-10">Sin partidos futuros</p>
              )}
            </div>

            {/* HISTORIAL */}
            <div className="bg-black/40 p-8 rounded-[48px] border border-white/5 opacity-60 hover:opacity-100 transition-all duration-500">
              <MatchSilo 
                title="Historial" 
                subtitle="RECIENTES / 7 DÍAS"
                matches={partidasPasadas} 
                user={user} isAdmin={isAdmin}
                activeMatchId={activeMatchId} setActiveMatchId={setActiveMatchId}
                setMapCenter={setMapCenter} onDelete={handleEliminarPartido}
                onSelect={(m) => { setSelectedPartido(m); setModalType('UNIRSE'); }}
              />
              {partidasPasadas.length === 0 && (
                <p className="text-white/10 italic text-xs uppercase tracking-widest text-center py-10">Historial vacío</p>
              )}
            </div>

          </div>
        </div>

        {/* MAPA */}
        <MatchMapLive
          partidos={matchesFiltrados} 
          mapCenter={mapCenter} 
          activeMatchId={activeMatchId}
          setActiveMatchId={setActiveMatchId}
          neonIcon={neonIcon}
        />
      </main>

      <MatchModals {...modalProps} />
    </div>
  );
};

export default Dashboard;