import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Plus } from 'lucide-react';
import L from 'leaflet';

// COMPONENTES EXTRAÍDOS
import Navbar from '../components/Navbar';
import MatchCard from '../components/MatchCard';
import MatchModals from '../components/MatchModals';

// Fix para los iconos de Leaflet
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
    if (center) {
      map.flyTo(center, 15, { duration: 1.5 });
    }
  }, [center, map]);
  return null;
};

const Dashboard = ({ user, onLogout }) => {
  // --- ESTADOS ---
  const [partidos, setPartidos] = useState(() => {
    const saved = localStorage.getItem('partidos_v_final');
    return saved ? JSON.parse(saved) : [
      { 
        id: 1, 
        equipo: "TALCA UNITED", 
        creadorEmail: "admin@talca.cl",
        rival: null, 
        cancha: "Estadio Fiscal", 
        hora: "20:00", 
        fecha: "2026-02-26", 
        jugadores: 10, 
        total: 12, 
        estado: "BUSCANDO JUGADORES", 
        tipo: "JUGADORES", 
        lat: -35.4264, 
        lng: -71.6554, 
        jugadoresInscritos: [] 
      },
    ];
  });

  const [misEquipos, setMisEquipos] = useState(() => {
    const saved = localStorage.getItem('mis_equipos_v_final');
    // Por defecto, asignamos el equipo inicial al usuario logueado para que pueda probar
    return saved ? JSON.parse(saved) : [{ id: 101, nombre: "TALCA UNITED FC", creadorEmail: user?.email }];
  });

  const [filtro, setFiltro] = useState('TODOS');
  const [modalType, setModalType] = useState(null); 
  const [step, setStep] = useState(1);
  const [selectedPartido, setSelectedPartido] = useState(null);
  const [activeMatchId, setActiveMatchId] = useState(null);
  const [mapCenter, setMapCenter] = useState([-35.4264, -71.6554]);
  const [nuevoEquipo, setNuevoEquipo] = useState('');
  
  // Formulario con campos de Fecha y Hora vacíos para forzar selección
  const [formPartida, setFormPartida] = useState({ 
    equipoId: '', recinto: '', recintoId: '', hora: '', fecha: '', tipo: 'JUGADORES', requiereArquero: false, canchaConfirmada: false 
  });

  const isAdmin = user?.email === 'ssagredo13@gmail.com';

  useEffect(() => {
    localStorage.setItem('partidos_v_final', JSON.stringify(partidos));
    localStorage.setItem('mis_equipos_v_final', JSON.stringify(misEquipos));
  }, [partidos, misEquipos]);

  // --- HANDLERS ---
  
  const handleCrearPartida = () => {
    if (!formPartida.equipoId || !formPartida.fecha || !formPartida.hora) {
      alert("⚠️ Error: Debes seleccionar tu equipo, fecha y hora del encuentro.");
      return; 
    }

    const eq = misEquipos.find(e => e.id === Number(formPartida.equipoId));
    
    const nueva = {
      ...formPartida, 
      id: Date.now(), 
      equipo: eq?.nombre || "Sin Equipo", 
      creadorEmail: user.email, // Registro de quién creó la pichanga
      rival: null,
      cancha: formPartida.recinto || "Por definir", 
      jugadores: 1, 
      jugadoresInscritos: [user.email], 
      total: 12, 
      estado: formPartida.tipo === 'RIVAL' ? 'BUSCANDO RIVAL' : 'BUSCANDO JUGADORES',
      lat: formPartida.lat || -35.4264 + (Math.random() * 0.01), 
      lng: formPartida.lng || -71.6554 + (Math.random() * 0.01)
    };

    setPartidos([nueva, ...partidos]);
    setModalType(null);
    // Limpiar form
    setFormPartida({ equipoId: '', recinto: '', recintoId: '', hora: '', fecha: '', tipo: 'JUGADORES', requiereArquero: false, canchaConfirmada: false });
  };

  const handleUnirseMatch = (pId, mode, equipoData = null) => {
    const partidoDestino = partidos.find(p => p.id === pId);

    // VALIDACIÓN PUNTO 2: No jugar contra el mismo equipo (por nombre)
    if (mode === 'TEAM' && equipoData && partidoDestino.equipo === equipoData.nombre) {
      alert("❌ No puedes retar a tu equipo con el mismo club. Selecciona otro de tus equipos registrados.");
      return;
    }

    if (mode === 'PLAYER' && partidoDestino.jugadoresInscritos?.includes(user.email)) {
      alert("¡Ya estás inscrito en esta pichanga!");
      return;
    }

    setPartidos(prev => prev.map(p => {
      if (p.id === pId) {
        if (mode === 'PLAYER') {
          const nuevosInscritos = [...(p.jugadoresInscritos || []), user.email];
          const cantidad = nuevosInscritos.length;
          return { ...p, jugadores: cantidad, jugadoresInscritos: nuevosInscritos, estado: cantidad === p.total ? "COMPLETO" : p.estado };
        }
        // Modo TEAM (Reto)
        return { ...p, rival: equipoData.nombre, estado: "PARTIDO LISTO" };
      }
      return p;
    }));
    setModalType(null);
  };

  const handleEliminarPartido = (e, pId) => {
    e.stopPropagation(); 
    const p = partidos.find(item => item.id === pId);
    const esDuenio = p?.creadorEmail === user.email;

    if (isAdmin || esDuenio) {
      if (window.confirm("¿Deseas eliminar esta partida?")) {
        setPartidos(prev => prev.filter(p => p.id !== pId));
      }
    } else {
      alert("No tienes permisos para eliminar esta partida.");
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans selection:bg-[#ccff00] overflow-x-hidden">
      <Navbar user={user} onLogout={onLogout} />

      <main className="pt-36 px-4 md:px-8 max-w-[1400px] mx-auto pb-20">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
          <div className="space-y-2">
            <h2 className="text-[11px] font-black italic text-[#CCFF00] uppercase tracking-[0.5em] ml-1">Talca Hub</h2>
            <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter leading-[0.85]">
              Partidas <span className="opacity-10">Activas</span>
            </h1>
          </div>
          
          <button 
            onClick={() => {setModalType('PARTIDA'); setStep(1);}} 
            className="bg-[#CCFF00] text-black h-16 px-10 rounded-none skew-x-[-12deg] hover:bg-white transition-all group shadow-[0_0_30px_rgba(204,255,0,0.15)] active:scale-95"
          >
            <div className="skew-x-[12deg] flex items-center gap-3">
              <Plus size={24} strokeWidth={3}/>
              <span className="font-black italic uppercase text-base">Crear Partida</span>
            </div>
          </button>
        </div>

        <div className="flex gap-3 mb-12 overflow-x-auto pb-4 no-scrollbar">
          {['TODOS', 'BUSCANDO JUGADORES', 'BUSCANDO RIVAL', 'PARTIDO LISTO'].map(f => (
            <button 
              key={f} 
              onClick={() => setFiltro(f)} 
              className={`px-8 py-3 rounded-full text-[10px] font-black italic border transition-all uppercase tracking-widest whitespace-nowrap ${
                filtro === f 
                ? 'bg-white/10 text-[#ccff00] border-[#ccff00]/50 shadow-[0_0_15px_rgba(204,255,0,0.1)]' 
                : 'border-white/5 text-slate-500 hover:text-white hover:border-white/20'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-8 lg:gap-12 items-start">
          
          <div className="col-span-12 lg:col-span-5 space-y-6 max-h-[800px] overflow-y-auto pr-4 custom-scrollbar scroll-smooth">
            {partidos
              .filter(p => filtro === 'TODOS' || p.estado === filtro)
              .map(p => (
                <div 
                  key={p.id}
                  onClick={() => {
                    setActiveMatchId(p.id);
                    setMapCenter([p.lat, p.lng]);
                  }}
                  className={`transition-all duration-500 ${activeMatchId === p.id ? 'scale-[1.02]' : ''}`}
                >
                  <MatchCard 
                    partido={p} 
                    user={user} // Pasamos user para validar dueño
                    isAdmin={isAdmin} 
                    isActive={activeMatchId === p.id}
                    onDelete={handleEliminarPartido}
                    onSelect={(match) => { setSelectedPartido(match); setModalType('UNIRSE'); }}
                    isJoined={p.jugadoresInscritos?.includes(user?.email)}
                  />
                </div>
            ))}
          </div>

          <div className="col-span-12 lg:col-span-7 h-[500px] lg:h-[800px] sticky top-32">
            <div className="h-full w-full border border-white/10 rounded-[48px] overflow-hidden shadow-2xl relative bg-[#0b1224]">
              <div className="absolute top-6 right-6 z-[500] bg-[#020617]/80 backdrop-blur-xl px-5 py-2 border border-white/10 rounded-full shadow-xl">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#CCFF00] rounded-full animate-pulse" />
                  <p className="text-[10px] font-black italic text-white uppercase tracking-widest">Live Talca Map</p>
                </div>
              </div>
              
              <MapContainer center={mapCenter} zoom={13} className="h-full w-full grayscale-[0.2] contrast-[1.1]">
                <MapController center={mapCenter} />
                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                {partidos.map(p => (
                  <Marker 
                    key={p.id} 
                    position={[p.lat, p.lng]}
                    icon={activeMatchId === p.id ? neonIcon : new L.Icon.Default()}
                    eventHandlers={{
                      click: () => setActiveMatchId(p.id),
                    }}
                  >
                    <Popup className="custom-popup">
                      <div className="bg-slate-950 text-white p-3 font-black italic uppercase text-[11px] rounded-lg">
                        <span className="text-[#CCFF00] block mb-1">{p.equipo}</span>
                        <span className="text-slate-400">{p.cancha}</span>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>
        </div>
      </main>

      <MatchModals 
        user={user}
        modalType={modalType} setModalType={setModalType}
        selectedPartido={selectedPartido} handleUnirseMatch={handleUnirseMatch}
        misEquipos={misEquipos} step={step} setStep={setStep}
        formPartida={formPartida} setFormPartida={setFormPartida}
        handleCrearPartida={handleCrearPartida} nuevoEquipo={nuevoEquipo}
        setNuevoEquipo={setNuevoEquipo} setMisEquipos={setMisEquipos}
      />
    </div>
  );
};

export default Dashboard;