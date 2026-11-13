import React, { useCallback, useState, useEffect, useRef } from 'react';
import { Plus, Users, Building2, Loader2 } from 'lucide-react';
import { apiFetch } from '../lib/api';
import MatchModals from '../components/MatchModals';
import MatchRadar from '../components/Dashboard/MatchRadar';
import PastMatchList from '../components/Dashboard/PastMatchList';

const Dashboard = ({ user }) => {
  const isRecinto = user?.role === 'recinto' || user?.role === 'admin';
  const [partidos, setPartidos] = useState([]);
  const [misEquipos, setMisEquipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [modalType, setModalType] = useState(null);
  const [selectedPartido, setSelectedPartido] = useState(null);
  const [formPartida, setFormPartida] = useState({
    equipoId: '', recinto: '', recintoId: '', lat: null, lng: null,
    hora: '', fecha: '', tipo: 'JUGADORES', jugadoresPorLado: 6,
    jugadoresInvitados: 0, requiereArquero: false, canchaConfirmada: false,
  });
  const [nuevoEquipo, setNuevoEquipo] = useState('');
  const matchCreationRef = useRef({ inFlight: false, fingerprint: '', key: '' });
  const matchUpdateInFlightRef = useRef(false);

  const cargarPartidas = useCallback(async () => {
    try {
      const data = await apiFetch('/api/partidos');
      setPartidos(data);
      setLoadError('');
    } catch (e) {
      setLoadError(e.message || 'No se pudieron cargar los partidos.');
    }
  }, []);

  const cargarDatosBase = useCallback(async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      const [, equipos] = await Promise.all([
        apiFetch('/api/recintos'),
        apiFetch(`/api/equipos?email=${encodeURIComponent(user.email)}`),
      ]);
      setMisEquipos(equipos);
      await cargarPartidas();
    } catch (e) {
      setLoadError(e.message || 'No se pudieron cargar los datos.');
    } finally {
      setLoading(false);
    }
  }, [user?.email, cargarPartidas]);

  useEffect(() => { cargarDatosBase(); }, [cargarDatosBase]);
  useEffect(() => { const i = setInterval(cargarPartidas, 30000); return () => clearInterval(i); }, [cargarPartidas]);

  const handleCrearPartida = async () => {
    if (matchCreationRef.current.inFlight) return;
    const iniciales = Number(formPartida.jugadoresInvitados) || 1;
    const totalCupos = Number(formPartida.jugadoresPorLado) * 2;
    const [y, m, d] = formPartida.fecha.split('-').map(Number);
    const [h, min] = formPartida.hora.split(':').map(Number);
    const fp = new Date(y, m - 1, d, h, min);
    if (fp < new Date()) { alert('No puedes organizar un partido para el pasado.'); return; }
    const np = {
      equipoId: String(formPartida.equipoId), recinto: formPartida.recinto,
      lat: parseFloat(formPartida.lat), lng: parseFloat(formPartida.lng),
      hora: formPartida.hora, fecha: formPartida.fecha,
      timezoneOffsetMinutes: -new Date(`${formPartida.fecha}T${formPartida.hora}:00`).getTimezoneOffset(),
      tipo: formPartida.tipo, jugadores: iniciales, total: totalCupos,
      arqueroFaltante: !!formPartida.requiereArquero,
    };
    const fp2 = JSON.stringify(np);
    if (matchCreationRef.current.fingerprint !== fp2) {
      matchCreationRef.current = { inFlight: false, fingerprint: fp2, key: crypto.randomUUID() };
    }
    matchCreationRef.current.inFlight = true;
    try {
      const g = await apiFetch('/api/partidos', {
        method: 'POST',
        headers: { 'Idempotency-Key': matchCreationRef.current.key },
        body: JSON.stringify(np),
      });
      setPartidos(p => [g, ...p]);
      setModalType(null);
      setLoadError('');
      matchCreationRef.current = { inFlight: false, fingerprint: '', key: '' };
    } catch (e) {
      setLoadError(e.message || 'No se pudo publicar la partida.');
    } finally {
      matchCreationRef.current.inFlight = false;
    }
  };

  const handleEliminarPartido = async (pId) => {
    if (!window.confirm('¿Cancelar este partido?')) return;
    try {
      await apiFetch(`/api/partidos/${pId}/cancelar`, { method: 'PATCH' });
      setPartidos(p => p.filter(p => (p._id || p.id) !== pId));
      setLoadError('');
    } catch (e) {
      setLoadError(e.message || 'No se pudo cancelar el partido.');
    }
  };

  const handleUnirseMatch = async (pId, mode, equipoData = null) => {
    if (matchUpdateInFlightRef.current) return;
    matchUpdateInFlightRef.current = true;
    try {
      const payload = mode === 'PLAYER'
        ? { action: 'join' }
        : { action: 'challenge', rival_team_id: equipoData?.id || equipoData?._id };
      const g = await apiFetch(`/api/partidos/${pId}`, {
        method: 'PATCH', body: JSON.stringify(payload),
      });
      setPartidos(p => p.map(p => (p._id || p.id) === pId ? g : p));
      setModalType(null);
      setLoadError('');
    } catch (e) {
      setLoadError(e.message || 'No se pudo actualizar la partida.');
    } finally {
      matchUpdateInFlightRef.current = false;
    }
  };

  const ahora = new Date();
  const hoy = ahora.toLocaleDateString('en-CA');
  const activas = partidos.filter(p => p.fecha >= hoy && p.estado !== 'CANCELADO' && p.estado !== 'PARTIDO LISTO');
  const listas = partidos.filter(p => p.estado === 'PARTIDO LISTO' && p.fecha >= hoy);
  const pasadas = partidos.filter(p => p.fecha < hoy || p.estado === 'CANCELADO');
  const clearNotice = useCallback(() => {}, []);

  const modalProps = {
    modalType, setModalType, selectedPartido, handleUnirseMatch,
    misEquipos, errorMessage: loadError,
    handleCrearPartida, nuevoEquipo, setNuevoEquipo,
    handleCrearEquipoDB: async (nombre) => {
      const g = await apiFetch('/api/equipos', { method: 'POST', body: JSON.stringify({ nombre }) });
      return g;
    },
    isCreatingMatch: matchCreationRef.current.inFlight,
    isUpdatingMatch: matchUpdateInFlightRef.current,
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black italic uppercase text-white">Partidos disponibles</h1>
            <p className="text-slate-400 text-sm">Encuentra una pichanga o publica tu cancha.</p>
          </div>
          <button
            type="button"
            onClick={() => { setModalType('PARTIDA'); }}
            disabled={matchCreationRef.current.inFlight}
            className={`min-h-10 px-4 rounded-xl font-black uppercase text-[10px] tracking-wide transition ${matchCreationRef.current.inFlight ? 'opacity-60 cursor-not-allowed' : isRecinto ? 'bg-sky-300 text-slate-950 hover:bg-white' : 'bg-[#ccff00] text-black hover:bg-white'}`}
          >
            {matchCreationRef.current.inFlight ? 'Publicando...' : isRecinto ? 'Publicar cancha libre' : 'Crear mi partido'}
          </button>
        </div>

        {loadError && (
          <div role="alert" className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-200">
            {loadError}
          </div>
        )}

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-black uppercase italic text-white">Hoy y próximos</h2>
          <MatchRadar
            partidos={partidos}
            avisos={[]}
            modo="ALL"
            setModo={() => {}}
            filtro="TODOS"
            setFiltro={() => {}}
            mapCenter={[-35.4264, -71.6554]}
            setMapCenter={() => {}}
            activeMatchId={null}
            setActiveMatchId={() => {}}
            userEmail={user?.email}
            isAdmin={isRecinto}
            onCancelMatch={handleEliminarPartido}
            onSelectMatch={(m) => { setSelectedPartido(m); setModalType('UNIRSE'); }}
          />
        </section>

        <details className="rounded-2xl border border-white/10 bg-[#080e1d] p-4">
          <summary className="cursor-pointer text-sm font-black italic uppercase tracking-wide text-slate-300">
            Historial reciente · {pasadas.length}
          </summary>
          <div className="mt-3">
            <PastMatchList matches={pasadas.slice(0, 5)} emptyMessage="Sin partidos recientes." />
          </div>
        </details>

        <MatchModals {...modalProps} />
      </main>
    </div>
  );
};

export default Dashboard;