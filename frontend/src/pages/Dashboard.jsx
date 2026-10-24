import React, { useCallback, useState, useEffect } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import L from 'leaflet';
import { apiFetch } from '../lib/api';

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
  const [loadError, setLoadError] = useState('');
  
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

  const isAdmin = user?.role === 'admin';
  const cargarPartidas = useCallback(async () => {
    try {
      const data = await apiFetch('/api/partidos');
      setPartidos(data);
      setLoadError('');
    } catch (error) {
      setLoadError(error.message || 'No se pudieron cargar las partidas.');
    }
  }, []);

  const cargarDatosBase = useCallback(async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      const [recintos, equipos] = await Promise.all([
        apiFetch('/api/recintos'),
        apiFetch(`/api/equipos?email=${encodeURIComponent(user.email)}`),
      ]);
      setRecintosOficiales(recintos);
      setMisEquipos(equipos);
      await cargarPartidas();
    } catch (error) {
      setLoadError(error.message || 'No se pudieron cargar los datos del dashboard.');
    } finally {
      setLoading(false);
    }
  }, [user?.email, cargarPartidas]);

  useEffect(() => {
    cargarDatosBase();
  }, [cargarDatosBase]);

  useEffect(() => {
    const intervalo = setInterval(cargarPartidas, 30000);
    return () => clearInterval(intervalo);
  }, [cargarPartidas]);

  // --- HANDLERS ---
  const handleCrearPartida = async () => {
    const iniciales = Number(formPartida.jugadoresInvitados) || 1; 
    const totalCupos = Number(formPartida.jugadoresPorLado) * 2;

    const [year, month, day] = formPartida.fecha.split('-').map(Number);
    const [hours, minutes] = formPartida.hora.split(':').map(Number);
    const fechaPartida = new Date(year, month - 1, day, hours, minutes);
    const ahora = new Date();

    if (fechaPartida < ahora) {
      alert("❌ No puedes organizar un partido para el pasado. ¡Ajusta el reloj, capitán!");
      return;
    }

    const nuevaPartida = {
      equipoId: String(formPartida.equipoId),
      recinto: formPartida.recinto,
      lat: parseFloat(formPartida.lat),
      lng: parseFloat(formPartida.lng),
      hora: formPartida.hora,
      fecha: formPartida.fecha,
      tipo: formPartida.tipo,
      jugadores: iniciales, 
      total: totalCupos,
      arqueroFaltante: !!formPartida.requiereArquero,
    };

    try {
      const guardada = await apiFetch('/api/partidos', {
        method: 'POST',
        body: JSON.stringify(nuevaPartida)
      });
      setPartidos(prev => [guardada, ...prev]);
      setModalType(null);
      setLoadError('');
    } catch (error) {
      setLoadError(error.message || 'No se pudo publicar la partida.');
    }
  };

  // HANDLER EDITADO: Blindado para evitar errores de propagación y usar el endpoint correcto
  const handleEliminarPartido = async (pId) => {
    if (!window.confirm("¿Estás seguro de que quieres cancelar esta partida?")) return;

    try {
      await apiFetch(`/api/partidos/${pId}/cancelar`, { method: 'PATCH' });
      setPartidos(prev => prev.filter(p => (p._id || p.id) !== pId));
      setLoadError('');
    } catch (error) {
      setLoadError(error.message || 'No se pudo cancelar el partido.');
    }
  };

  const handleUnirseMatch = async (pId, mode, equipoData = null) => {
    try {
      const payload = mode === 'PLAYER'
        ? { action: 'join' }
        : { action: 'challenge', rival_team_id: equipoData?.id || equipoData?._id };

      const partidoActualizado = await apiFetch(`/api/partidos/${pId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
      setPartidos(prev => prev.map(p => (p._id || p.id) === pId ? partidoActualizado : p));
      setModalType(null);
      setLoadError('');
    } catch (error) {
      setLoadError(error.message || 'No se pudo actualizar la partida.');
    }
  };

  // --- LÓGICA DE SILOS ---
  const ahora = new Date();
  const hoyStr = ahora.toLocaleDateString('en-CA');
  const LIMITE_MINUTOS = 30;

  const matchesFiltrados = partidos.filter(p => filtro === 'TODOS' || p.estado === filtro);

  const partidasPasadas = [];
  const partidasHoy = [];
  const partidasFuturas = [];

  matchesFiltrados.forEach(p => {
    const [y, m, d] = p.fecha.split('-').map(Number);
    const [h, min] = p.hora.split(':').map(Number);
    const fechaMatch = new Date(y, m - 1, d, h, min);

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

  partidasHoy.sort((a, b) => a.hora.localeCompare(b.hora));
  partidasFuturas.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  partidasPasadas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  const modalProps = {
    modalType, setModalType, selectedPartido, handleUnirseMatch,
    errorMessage: loadError,
    misEquipos, step, setStep, formPartida, setFormPartida,
    handleCrearPartida, nuevoEquipo, setNuevoEquipo,
    recintosOficiales, handleCrearEquipoDB: async (n) => {
        try {
          const creado = await apiFetch('/api/equipos', {
            method: 'POST',
            body: JSON.stringify({ nombre: n })
          });
          setMisEquipos(prev => [...prev, creado]);
          setLoadError('');
          return creado;
        } catch (error) {
          setLoadError(error.message || 'No se pudo crear el equipo.');
          throw error;
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
        {loadError && (
          <div role="alert" className="mb-6 rounded-xl border border-red-400/30 bg-red-500/10 px-5 py-4 text-sm font-bold text-red-200">
            {loadError}
            <button
              type="button"
              onClick={cargarDatosBase}
              className="ml-3 underline underline-offset-4"
            >
              Reintentar
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mb-20">
          
          <div className="bg-black/20 p-6 rounded-[40px] border border-white/5 opacity-40 hover:opacity-100 transition-all duration-500 order-2 lg:order-1">
            <MatchSilo 
              title="Historial" 
              subtitle="PASADO / RECIENTE"
              matches={partidasPasadas.slice(0, 8)} 
              user={user} isAdmin={isAdmin}
              activeMatchId={activeMatchId} setActiveMatchId={setActiveMatchId}
              setMapCenter={setMapCenter} 
              onDelete={handleEliminarPartido}
              onSelect={(m) => { 
                if (m.estadoEspecial === 'FALLIDA') return;
                setSelectedPartido(m); 
                setModalType('UNIRSE'); 
              }}
            />
          </div>

          <div className="relative order-1 lg:order-2 lg:scale-105 z-10">
            <div className="absolute -inset-1 bg-[#CCFF00]/10 blur-2xl rounded-[50px] -z-10" />
            <div className="bg-white/[0.03] p-8 rounded-[48px] border-2 border-[#CCFF00]/20 shadow-2xl">
              <MatchSilo 
                title="Match Center" 
                subtitle="LIVE / HOY"
                matches={partidasHoy} 
                user={user} isAdmin={isAdmin}
                activeMatchId={activeMatchId} setActiveMatchId={setActiveMatchId}
                setMapCenter={setMapCenter} 
                onDelete={handleEliminarPartido}
                onSelect={(m) => { setSelectedPartido(m); setModalType('UNIRSE'); }}
              />
              {partidasHoy.length === 0 && (
                <div className="py-12 text-center border-2 border-dashed border-[#CCFF00]/10 rounded-3xl">
                  <p className="text-[#CCFF00]/40 font-black italic uppercase tracking-[0.2em] text-xs">
                    Nada para hoy todavía
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white/[0.02] p-6 rounded-[40px] border border-white/5 hover:border-[#CCFF00]/20 transition-all duration-500 order-3">
            <MatchSilo 
              title="Próximamente" 
              subtitle="FUTURO / AGENDA"
              matches={partidasFuturas} 
              user={user} isAdmin={isAdmin}
              activeMatchId={activeMatchId} setActiveMatchId={setActiveMatchId}
              setMapCenter={setMapCenter} 
              onDelete={handleEliminarPartido}
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