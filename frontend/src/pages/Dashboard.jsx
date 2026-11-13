import React, { useCallback, useState, useEffect, useRef } from 'react';
import { Building2, Loader2, Megaphone, Plus, Search, Users } from 'lucide-react';
import { apiFetch } from '../lib/api';

// COMPONENTES MODULARIZADOS
import MatchModals from '../components/MatchModals';
import MatchRadar from '../components/Dashboard/MatchRadar';
import PastMatchList from '../components/Dashboard/PastMatchList';
import QuickNotices from '../components/Dashboard/QuickNotices';

const Dashboard = ({ user }) => {
  // --- ESTADOS ---
  const [partidos, setPartidos] = useState([]);
  const [recintosOficiales, setRecintosOficiales] = useState([]);
  const [misEquipos, setMisEquipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreatingMatch, setIsCreatingMatch] = useState(false);
  const [isUpdatingMatch, setIsUpdatingMatch] = useState(false);
  const [loadError, setLoadError] = useState('');
  const matchCreationRef = useRef({ inFlight: false, fingerprint: '', key: '' });
  const matchUpdateInFlightRef = useRef(false);
  
  const [filtro, setFiltro] = useState('TODOS');
  const [modalType, setModalType] = useState(null); 
  const [step, setStep] = useState(1);
  const [selectedPartido, setSelectedPartido] = useState(null);
  const [activeMatchId, setActiveMatchId] = useState(null);
  const [avisos, setAvisos] = useState([]);
  const [radarMode, setRadarMode] = useState('ALL');
  const [noticeIntent, setNoticeIntent] = useState(null);
  const [mapCenter, setMapCenter] = useState([-35.4264, -71.6554]); 
  const [nuevoEquipo, setNuevoEquipo] = useState('');
  
  const [formPartida, setFormPartida] = useState({ 
    equipoId: '', recinto: '', recintoId: '', lat: null, lng: null,
    hora: '', fecha: '', tipo: 'JUGADORES', jugadoresPorLado: 6,
    jugadoresInvitados: 0, requiereArquero: false, canchaConfirmada: false 
  });

  const isAdmin = user?.role === 'admin';
  const clearNoticeIntent = useCallback(() => setNoticeIntent(null), []);

  const scrollToRadar = () => {
    setRadarMode('ALL');
    document.getElementById('match-radar')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };
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
      timezoneOffsetMinutes: -new Date(
        `${formPartida.fecha}T${formPartida.hora}:00`,
      ).getTimezoneOffset(),
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
    if (matchUpdateInFlightRef.current) return;
    matchUpdateInFlightRef.current = true;
    setIsUpdatingMatch(true);
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
    } finally {
      matchUpdateInFlightRef.current = false;
      setIsUpdatingMatch(false);
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
    isUpdatingMatch,
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
      <main className="mx-auto max-w-[1600px] px-3 pb-12 pt-28 sm:px-5 md:px-8 md:pt-32">
        <header className="mb-6 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-[10px] font-black italic uppercase tracking-[0.4em] text-[#CCFF00]">
              Match to Match · Tu zona
            </p>
            <h1 className="max-w-3xl text-4xl font-black italic uppercase leading-[0.95] tracking-tight sm:text-5xl">
              La pichanga que falta, <span className="text-[#CCFF00]">a un toque.</span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-400 sm:text-base">
              Encuentra partido, completa tu equipo o ayuda a llenar una cancha libre.
            </p>
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

        <section aria-label="Accesos rápidos" className="mb-7 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-[#CCFF00]/20 bg-gradient-to-br from-[#CCFF00]/[0.09] to-[#0b1224] p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#CCFF00]/10 text-[#CCFF00]">
                <Users size={20} />
              </span>
              <div className="min-w-0">
                <h2 className="font-black uppercase text-white">Busco jugar</h2>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  Mira partidos cercanos o publica que te faltan jugadores, arquero o rival.
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={scrollToRadar}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#CCFF00] px-4 text-[11px] font-black uppercase tracking-wide text-black transition hover:bg-white"
              >
                <Search size={15} /> Explorar partidos
              </button>
              <button
                type="button"
                onClick={() => setNoticeIntent('JUGADORES')}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-[#020617]/60 px-4 text-[11px] font-black uppercase tracking-wide text-slate-200 transition hover:border-[#CCFF00]/40 hover:text-[#CCFF00]"
              >
                <Megaphone size={15} /> Publicar necesidad
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-sky-400/20 bg-gradient-to-br from-sky-400/[0.08] to-[#0b1224] p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-400/10 text-sky-300">
                <Building2 size={20} />
              </span>
              <div className="min-w-0">
                <h2 className="font-black uppercase text-white">Tengo un recinto</h2>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  Publica un horario disponible y haz que aparezca en el radar de jugadores.
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setNoticeIntent('CANCHA')}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-sky-300 px-4 text-[11px] font-black uppercase tracking-wide text-slate-950 transition hover:bg-white"
              >
                <Plus size={15} /> Publicar cancha libre
              </button>
              <button
                type="button"
                onClick={() => {
                  setRadarMode('COURTS');
                  document.getElementById('match-radar')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-[#020617]/60 px-4 text-[11px] font-black uppercase tracking-wide text-slate-200 transition hover:border-sky-300/40 hover:text-sky-200"
              >
                <Search size={15} /> Ver canchas libres
              </button>
            </div>
          </div>
        </section>

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
          avisos={avisos}
          modo={radarMode}
          setModo={setRadarMode}
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

        <QuickNotices
          initialType={noticeIntent}
          onInitialTypeHandled={clearNoticeIntent}
          onNoticesChange={setAvisos}
        />

        <details className="mt-8 rounded-2xl border border-white/10 bg-[#080e1d] p-5">
          <summary className="cursor-pointer text-sm font-black italic uppercase tracking-wide text-slate-300 marker:text-[#CCFF00]">
            Historial reciente · {partidasPasadas.length}
          </summary>
          <div className="mt-4">
            <PastMatchList
              matches={partidasPasadas.slice(0, 8)}
              emptyMessage="Tu historial aparecerá aquí cuando tengas partidos anteriores."
            />
          </div>
        </details>
      </main>

      <MatchModals {...modalProps} />
    </div>
  );
};

export default Dashboard;