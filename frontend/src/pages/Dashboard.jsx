import React, { useCallback, useState, useEffect, useRef } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { apiFetch } from '../lib/api';

// COMPONENTES MODULARIZADOS
import Navbar from '../components/Navbar';
import MatchModals from '../components/MatchModals';
import MatchSilo from '../components/Dashboard/MatchSilo';
import MatchRadar from '../components/Dashboard/MatchRadar';

const Dashboard = ({ user, onLogout }) => {
  // --- ESTADOS ---
  const [partidos, setPartidos] = useState([]);
  const [recintosOficiales, setRecintosOficiales] = useState([]);
  const [misEquipos, setMisEquipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreatingMatch, setIsCreatingMatch] = useState(false);
  const [loadError, setLoadError] = useState('');
  const matchCreationRef = useRef({ inFlight: false, fingerprint: '', key: '' });
  
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
    if (matchCreationRef.current.inFlight) return;

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

    const fingerprint = JSON.stringify(nuevaPartida);
    if (matchCreationRef.current.fingerprint !== fingerprint) {
      matchCreationRef.current = {
        inFlight: false,
        fingerprint,
        key: crypto.randomUUID(),
      };
    }
    matchCreationRef.current.inFlight = true;
    setIsCreatingMatch(true);

    try {
      const guardada = await apiFetch('/api/partidos', {
        method: 'POST',
        headers: { 'Idempotency-Key': matchCreationRef.current.key },
        body: JSON.stringify(nuevaPartida)
      });
      setPartidos(prev => [guardada, ...prev]);
      setModalType(null);
      setLoadError('');
      matchCreationRef.current = { inFlight: false, fingerprint: '', key: '' };
    } catch (error) {
      setLoadError(error.message || 'No se pudo publicar la partida.');
    } finally {
      matchCreationRef.current.inFlight = false;
      setIsCreatingMatch(false);
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
  const partidasRadar = [...partidasHoy, ...partidasFuturas];

  const modalProps = {
    modalType, setModalType, selectedPartido, handleUnirseMatch,
    errorMessage: loadError,
    misEquipos, step, setStep, formPartida, setFormPartida,
    handleCrearPartida, nuevoEquipo, setNuevoEquipo,
    isCreatingMatch,
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

      <main className="mx-auto max-w-[1600px] px-3 pb-12 pt-28 sm:px-5 md:px-8 md:pt-32">
        <header className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-[10px] font-black italic uppercase tracking-[0.4em] text-[#CCFF00]">
              Match to Match · Talca
            </p>
            <h1 className="text-4xl font-black italic uppercase leading-none tracking-tight sm:text-5xl">
              Partidos <span className="text-white/30">cerca</span>
            </h1>
          </div>
          <button 
            onClick={() => {setModalType('PARTIDA'); setStep(1);}} 
            className="min-h-12 self-start rounded-xl bg-[#CCFF00] px-5 text-black transition-all hover:bg-white active:scale-95 sm:self-auto"
          >
            <div className="flex items-center gap-2 font-black italic uppercase text-xs">
              <Plus size={18} strokeWidth={3}/> Publicar partido
            </div>
          </button>
        </header>

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

        <MatchRadar
          partidos={partidasRadar}
          filtro={filtro}
          setFiltro={setFiltro}
          mapCenter={mapCenter}
          setMapCenter={setMapCenter}
          activeMatchId={activeMatchId}
          setActiveMatchId={setActiveMatchId}
          userEmail={user?.email}
          isAdmin={isAdmin}
          onCancelMatch={handleEliminarPartido}
          onSelectMatch={(match) => {
            setSelectedPartido(match);
            setModalType('UNIRSE');
          }}
        />

        <details className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <summary className="cursor-pointer text-sm font-black italic uppercase tracking-wide text-slate-300 marker:text-[#CCFF00]">
            Historial reciente · {partidasPasadas.length}
          </summary>
          <div className="mt-6">
            <MatchSilo
              title="Tus partidos anteriores"
              subtitle="PASADO / RECIENTE"
              matches={partidasPasadas.slice(0, 8)}
              user={user}
              isAdmin={isAdmin}
              activeMatchId={activeMatchId}
              setActiveMatchId={setActiveMatchId}
              setMapCenter={setMapCenter}
              onDelete={handleEliminarPartido}
              onSelect={(match) => {
                if (match.estadoEspecial === 'FALLIDA') return;
                setSelectedPartido(match);
                setModalType('UNIRSE');
              }}
            />
          </div>
        </details>
      </main>

      <MatchModals {...modalProps} />
    </div>
  );
};

export default Dashboard;