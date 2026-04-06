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
    const intervalo = setInterval(cargarPartidas, 30000);
    return () => clearInterval(intervalo);
  }, []);

  // --- HANDLERS ---
  const handleCrearPartida = async () => {
    const eq = misEquipos.find(e => (e._id || e.id) === formPartida.equipoId);
    const iniciales = Number(formPartida.jugadoresInvitados) || 1; 
    const totalCupos = Number(formPartida.jugadoresPorLado) * 2;

    // Validación de fecha con hora local
    const [year, month, day] = formPartida.fecha.split('-').map(Number);
    const [hours, minutes] = formPartida.hora.split(':').map(Number);
    const fechaPartida = new Date(year, month - 1, day, hours, minutes);
    const ahora = new Date();

    if (fechaPartida < ahora) {
      alert("❌ No puedes organizar un partido para el pasado. ¡Ajusta el reloj, capitán!");
      return;
    }

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

  // --- LÓGICA DE SILOS: CLASIFICACIÓN Y MUERTE SÚBITA ---
  const ahora = new Date();
  const hoyStr = ahora.toLocaleDateString('en-CA');
  const LIMITE_MINUTOS = 30; // Margen para confirmar

  const matchesFiltrados = partidos.filter(p => filtro === 'TODOS' || p.estado === filtro);

  const partidasPasadas = [];
  const partidasHoy = [];
  const partidasFuturas = [];

  matchesFiltrados.forEach(p => {
    const [y, m, d] = p.fecha.split('-').map(Number);
    const [h, min] = p.hora.split(':').map(Number);
    const fechaMatch = new Date(y, m - 1, d, h, min);

    // Muerte súbita: 30 minutos antes del inicio
    const limiteConfirmacion = new Date(fechaMatch.getTime() - LIMITE_MINUTOS * 60000);
    const esFallida = ahora > limiteConfirmacion && p.estado !== 'PARTIDO LISTO';
    const yaPaso = ahora > fechaMatch;

    if (p.fecha < hoyStr || yaPaso || esFallida) {
      partidasPasadas.push({
        ...p,
        estadoEspecial: esFallida && !yaPaso ? 'FALLIDA' : null
      });
    } else if (p.fecha === hoyStr) {
      partidasHoy.push(p);
    } else {
      partidasFuturas.push(p);
    }
  });

  // Ordenar cronológicamente
  partidasHoy.sort((a, b) => a.hora.localeCompare(b.hora));
  partidasFuturas.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  partidasPasadas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  const modalProps = {
    user, modalType, setModalType, selectedPartido, handleUnirseMatch,
    misEquipos, step, setStep, formPartida, setFormPartida,
    handleCrearPartida, nuevoEquipo, setNuevoEquipo, setMisEquipos,
    recintosOficiales, handleCrearEquipoDB: async (n) => {
        const nuevo = { nombre: n, creadorEmail: user.email };
        const res = await fetch(`${API_URL}/equipos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nuevo)
        });
        if (res.ok) {
            const g = await res.json();
            setMisEquipos(prev => [...prev, g]);
            return g;
        }
    }
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

      <main className="pt-36 px-4 md:px-8 max-w-[1500px] mx-auto pb-20">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
          <div className="space-y-2">
            <h2 className="text-[11px] font-black italic text-[#CCFF00] uppercase tracking-[0.5em] ml-1">Talca Hub</h2>
            <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter leading-[0.85]">
              Dashboard <span className="opacity-10">M2M</span>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mb-20">
          
          {/* SILO: HISTORIAL */}
          <div className="bg-black/20 p-6 rounded-[40px] border border-white/5 opacity-40 hover:opacity-100 transition-all duration-500 order-2 lg:order-1">
            <MatchSilo 
              title="Historial" 
              subtitle="PASADO / RECIENTE"
              matches={partidasPasadas.slice(0, 8)} 
              user={user} isAdmin={isAdmin}
              activeMatchId={activeMatchId} setActiveMatchId={setActiveMatchId}
              setMapCenter={setMapCenter} onDelete={handleEliminarPartido}
              onSelect={(m) => { 
                if (m.estadoEspecial === 'FALLIDA') return; // BLOQUEO TOTAL
                setSelectedPartido(m); 
                setModalType('UNIRSE'); 
              }}
            />
          </div>

          {/* SILO: MATCH CENTER (HOY) */}
          <div className="relative order-1 lg:order-2 lg:scale-105 z-10">
            <div className="absolute -inset-1 bg-[#CCFF00]/10 blur-2xl rounded-[50px] -z-10" />
            <div className="bg-white/[0.03] p-8 rounded-[48px] border-2 border-[#CCFF00]/20 shadow-2xl">
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
                <div className="py-12 text-center border-2 border-dashed border-[#CCFF00]/10 rounded-3xl">
                  <p className="text-[#CCFF00]/40 font-black italic uppercase tracking-[0.2em] text-xs italic">
                    Nada para hoy todavía
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* SILO: PRÓXIMAMENTE */}
          <div className="bg-white/[0.02] p-6 rounded-[40px] border border-white/5 hover:border-[#CCFF00]/20 transition-all duration-500 order-3">
            <MatchSilo 
              title="Próximamente" 
              subtitle="FUTURO / AGENDA"
              matches={partidasFuturas} 
              user={user} isAdmin={isAdmin}
              activeMatchId={activeMatchId} setActiveMatchId={setActiveMatchId}
              setMapCenter={setMapCenter} onDelete={handleEliminarPartido}
              onSelect={(m) => { setSelectedPartido(m); setModalType('UNIRSE'); }}
            />
          </div>
        </div>

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