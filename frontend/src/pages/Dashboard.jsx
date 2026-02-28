import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Plus, Loader2 } from 'lucide-react';
import L from 'leaflet';

// COMPONENTES
import Navbar from '../components/Navbar';
import MatchCard from '../components/MatchCard';
import MatchModals from '../components/MatchModals';

// --- CONFIGURACIÓN DE ICONOS LEAFLET ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const neonIcon = new L.DivIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: #ccff00; width: 15px; height: 15px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 15px #ccff00;"></div>`,
  iconSize: [15, 15],
  iconAnchor: [7, 7]
});

const MapController = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, 15, { duration: 1.5 });
    }
  }, [center, map]);
  return null;
};

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

  // --- CARGA INICIAL ---
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

  // ✅ POLLING: Sincronización automática cada 20 segundos
  useEffect(() => {
    const intervalo = setInterval(() => {
      cargarPartidas();
    }, 20000);
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
    if (!formPartida.equipoId || !formPartida.fecha || !formPartida.hora || !formPartida.recinto) {
      alert("⚠️ Faltan datos críticos."); return; 
    }

    const eq = misEquipos.find(e => (e._id || e.id) === formPartida.equipoId);
    const iniciales = Number(formPartida.jugadoresInvitados) || 1; 
    const totalCupos = Number(formPartida.jugadoresPorLado) * 2;

    const nuevaPartida = {
      ...formPartida,
      equipo: eq?.nombre || "Sin Equipo",
      creadorEmail: user.email,
      jugadores: iniciales, 
      jugadoresInscritos: [user.email],
      total: totalCupos,
      estado: formPartida.tipo === 'RIVAL' ? 'BUSCANDO RIVAL' : 'BUSCANDO JUGADORES'
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
        setFormPartida({ 
          equipoId: '', recinto: '', recintoId: '', lat: null, lng: null, 
          hora: '', fecha: '', tipo: 'JUGADORES', jugadoresPorLado: 6,
          jugadoresInvitados: 0, requiereArquero: false, canchaConfirmada: false 
        });
      }
    } catch (error) {
      alert("❌ Error al guardar partida");
    }
  };

  // ✅ CORRECCIÓN: handleUnirseMatch Sincronizado con Base de Datos
  const handleUnirseMatch = async (pId, mode, equipoData = null) => {
    try {
      // Definimos qué datos enviar según si es Jugador o Equipo
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
        // Actualizamos estado local inmediatamente
        setPartidos(prev => prev.map(p => 
          (p._id || p.id) === pId ? partidoActualizado : p
        ));
        setModalType(null);
      } else {
        alert("No se pudo procesar la unión al partido.");
      }
    } catch (error) {
      console.error("Error uniendo al match:", error);
      alert("Error de conexión con el servidor.");
    }
  };

  const handleEliminarPartido = async (e, pId) => {
    e.stopPropagation();
    if (!window.confirm("¿Deseas eliminar esta partida?")) return;
    try {
      const res = await fetch(`${API_URL}/partidos/${pId}`, { method: 'DELETE' });
      if (res.ok) {
        setPartidos(prev => prev.filter(p => (p._id || p.id) !== pId));
      }
    } catch (error) {
      alert("No se pudo eliminar.");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-[#CCFF00]" size={48} />
      <p className="font-black italic text-white uppercase tracking-widest animate-pulse">Sincronizando con la red...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans selection:bg-[#ccff00] overflow-x-hidden">
      <Navbar user={user} onLogout={onLogout} />

      <main className="pt-36 px-4 md:px-8 max-w-[1400px] mx-auto pb-20">
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
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
        </div>

        {/* Filtros */}
        <div className="flex gap-3 mb-12 overflow-x-auto pb-4 no-scrollbar">
          {['TODOS', 'BUSCANDO JUGADORES', 'BUSCANDO RIVAL', 'PARTIDO LISTO'].map(f => (
            <button 
              key={f} 
              onClick={() => setFiltro(f)} 
              className={`px-8 py-3 rounded-full text-[10px] font-black italic border transition-all uppercase tracking-widest ${
                filtro === f ? 'bg-white/10 text-[#ccff00] border-[#ccff00]/50' : 'border-white/5 text-slate-500 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Lista de Partidas */}
          <div className="col-span-12 lg:col-span-5 space-y-6 max-h-[800px] overflow-y-auto pr-4 custom-scrollbar">
            {partidos.filter(p => filtro === 'TODOS' || p.estado === filtro).length === 0 ? (
              <div className="border border-white/5 bg-white/5 p-10 text-center rounded-3xl">
                <p className="text-slate-500 font-black italic uppercase text-sm">No hay partidas en esta categoría.</p>
              </div>
            ) : (
              partidos
                .filter(p => filtro === 'TODOS' || p.estado === filtro)
                .map(p => {
                  const pId = p._id || p.id;
                  return (
                    <div key={pId} onClick={() => { setActiveMatchId(pId); if(p.lat) setMapCenter([p.lat, p.lng]); }} 
                         className={`transition-all duration-300 ${activeMatchId === pId ? 'scale-[1.02]' : ''}`}>
                      <MatchCard 
                        partido={p} user={user} isAdmin={isAdmin} isActive={activeMatchId === pId}
                        onDelete={handleEliminarPartido} onSelect={(match) => { setSelectedPartido(match); setModalType('UNIRSE'); }}
                        isJoined={p.jugadoresInscritos?.includes(user?.email)}
                      />
                    </div>
                  );
                })
            )}
          </div>

          {/* Mapa */}
          <div className="col-span-12 lg:col-span-7 h-[500px] lg:h-[800px] sticky top-32">
            <div className="h-full w-full border border-white/10 rounded-[48px] overflow-hidden bg-[#0b1224] relative shadow-2xl">
              <MapContainer center={mapCenter} zoom={13} className="h-full w-full">
                <MapController center={mapCenter} />
                <TileLayer 
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" 
                  attribution='&copy; OpenStreetMap contributors'
                />
                {partidos.map(p => (
                  p.lat && p.lng && (
                    <Marker 
                      key={p._id || p.id} position={[p.lat, p.lng]} 
                      icon={activeMatchId === (p._id || p.id) ? neonIcon : new L.Icon.Default()}
                      eventHandlers={{ click: () => setActiveMatchId(p._id || p.id) }}
                    >
                      <Popup>
                        <div className="text-black p-1 font-bold">
                          <span className="text-blue-600 block">{p.equipo}</span>
                          <span>{p.recinto}</span>
                        </div>
                      </Popup>
                    </Marker>
                  )
                ))}
              </MapContainer>
            </div>
          </div>
        </div>
      </main>

      <MatchModals 
        user={user} modalType={modalType} setModalType={setModalType}
        selectedPartido={selectedPartido} handleUnirseMatch={handleUnirseMatch}
        misEquipos={misEquipos} step={step} setStep={setStep}
        formPartida={formPartida} setFormPartida={setFormPartida}
        handleCrearPartida={handleCrearPartida} nuevoEquipo={nuevoEquipo}
        setNuevoEquipo={setNuevoEquipo} setMisEquipos={setMisEquipos}
        recintosOficiales={recintosOficiales} 
        handleCrearEquipoDB={handleCrearEquipoDB}
      />
    </div>
  );
};

export default Dashboard;