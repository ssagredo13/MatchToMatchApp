import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Plus } from 'lucide-react';

// COMPONENTES EXTRAÍDOS
import Navbar from '../components/Navbar';
import MatchCard from '../components/MatchCard';
import MatchModals from '../components/MatchModals';

const Dashboard = ({ user, onLogout }) => {
  // --- ESTADOS ---
  const [partidos, setPartidos] = useState(() => {
    const saved = localStorage.getItem('partidos_v_final');
    // Agregamos jugadoresInscritos al partido inicial si no existe
    return saved ? JSON.parse(saved) : [
      { 
        id: 1, 
        equipo: "TALCA UNITED", 
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
        requiereArquero: true, 
        canchaConfirmada: true,
        jugadoresInscritos: [] // Lista de emails de quienes se unieron
      },
    ];
  });

  const [misEquipos, setMisEquipos] = useState(() => {
    const saved = localStorage.getItem('mis_equipos_v_final');
    return saved ? JSON.parse(saved) : [{ id: 101, nombre: "TALCA UNITED FC" }];
  });

  const [filtro, setFiltro] = useState('TODOS');
  const [modalType, setModalType] = useState(null); 
  const [step, setStep] = useState(1);
  const [selectedPartido, setSelectedPartido] = useState(null);
  const [nuevoEquipo, setNuevoEquipo] = useState('');
  const [formPartida, setFormPartida] = useState({ 
    equipoId: '', recinto: '', hora: '20:00', fecha: '', tipo: 'JUGADORES', requiereArquero: false, canchaConfirmada: false 
  });

  const isAdmin = user?.email === 'ssagredo13@gmail.com';

  useEffect(() => {
    localStorage.setItem('partidos_v_final', JSON.stringify(partidos));
    localStorage.setItem('mis_equipos_v_final', JSON.stringify(misEquipos));
  }, [partidos, misEquipos]);

  // --- HANDLERS ---
  
  const handleCrearPartida = () => {
    if (!formPartida.equipoId) return; 
    const eq = misEquipos.find(e => e.id === Number(formPartida.equipoId));
    
    const nueva = {
      ...formPartida, 
      id: Date.now(), 
      equipo: eq?.nombre || "Sin Equipo", 
      rival: null,
      cancha: formPartida.recinto || "Por definir", 
      jugadores: 1, 
      // Al crearla, el usuario actual se inscribe automáticamente
      jugadoresInscritos: [user.email], 
      total: 12, 
      estado: formPartida.tipo === 'RIVAL' ? 'BUSCANDO RIVAL' : 'BUSCANDO JUGADORES',
      lat: -35.4264 + (Math.random() * 0.01), 
      lng: -71.6554 + (Math.random() * 0.01)
    };
    setPartidos([nueva, ...partidos]);
    setModalType(null);
  };

  const handleUnirseMatch = (pId, mode, equipoData = null) => {
    const partidoDestino = partidos.find(p => p.id === pId);

    // VALIDACIÓN 1: ¿Ya estás en este partido?
    if (mode === 'PLAYER' && partidoDestino.jugadoresInscritos?.includes(user.email)) {
      alert("¡Ya estás inscrito en esta pichanga!");
      return;
    }

    // VALIDACIÓN 2: ¿Choque de horario? (Mismo día y misma hora)
    const choque = partidos.find(p => 
      p.jugadoresInscritos?.includes(user.email) && 
      p.fecha === partidoDestino.fecha && 
      p.hora === partidoDestino.hora
    );

    if (choque) {
      alert(`Error: Ya tienes un partido a esa misma hora en ${choque.cancha}`);
      return;
    }

    setPartidos(prev => prev.map(p => {
      if (p.id === pId) {
        if (mode === 'PLAYER') {
          const nuevosInscritos = [...(p.jugadoresInscritos || []), user.email];
          const cantidad = nuevosInscritos.length;
          return { 
            ...p, 
            jugadores: cantidad, 
            jugadoresInscritos: nuevosInscritos,
            estado: cantidad === p.total ? "COMPLETO" : p.estado 
          };
        }
        return { ...p, rival: equipoData.nombre, jugadores: 12, estado: "PARTIDO LISTO" };
      }
      return p;
    }));
    setModalType(null);
  };

  const handleEliminarPartido = (e, pId) => {
    e.stopPropagation(); 
    if (window.confirm("¿Deseas eliminar esta partida?")) {
      setPartidos(prev => prev.filter(p => p.id !== pId));
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans selection:bg-[#ccff00]">
      <Navbar user={user} onLogout={onLogout} />

      <main className="pt-32 px-6 max-w-7xl mx-auto pb-20">
        {/* ... Resto de tu JSX (Cabecera, Filtros, Grid, Mapa) se mantiene igual ... */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div className="space-y-1">
            <h2 className="text-[10px] font-black italic text-[#CCFF00] uppercase tracking-[0.4em]">Talca Hub</h2>
            <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-none">
              Pichangas <span className="text-white/20">Activas</span>
            </h1>
          </div>
          
          <button 
            onClick={() => {setModalType('PARTIDA'); setStep(1);}} 
            className="bg-[#CCFF00] text-black h-14 px-8 rounded-none skew-x-[-12deg] hover:bg-white transition-all group shadow-[0_0_20px_rgba(204,255,0,0.2)]"
          >
            <div className="skew-x-[12deg] flex items-center gap-3">
              <Plus size={20} strokeWidth={3}/>
              <span className="font-black italic uppercase text-sm">Crear Partida</span>
            </div>
          </button>
        </div>

        <div className="flex gap-2 mb-10 overflow-x-auto pb-2 custom-scrollbar">
          {['TODOS', 'BUSCANDO JUGADORES', 'BUSCANDO RIVAL'].map(f => (
            <button 
              key={f} 
              onClick={() => setFiltro(f)} 
              className={`px-6 py-2 rounded-full text-[9px] font-black italic border transition-all uppercase tracking-widest ${
                filtro === f 
                ? 'bg-white/10 text-[#ccff00] border-[#ccff00]/50' 
                : 'border-white/5 text-slate-500 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-8 items-start">
          <div className="col-span-12 lg:col-span-5 space-y-4 max-h-[700px] overflow-y-auto pr-4 custom-scrollbar">
            {partidos
              .filter(p => filtro === 'TODOS' || p.estado === filtro)
              .map(p => (
                <MatchCard 
                  key={p.id} 
                  partido={p} 
                  isAdmin={isAdmin} 
                  onDelete={handleEliminarPartido}
                  onSelect={(match) => { setSelectedPartido(match); setModalType('UNIRSE'); }}
                  // OPCIONAL: Pasar una prop para saber si el usuario ya está dentro
                  isJoined={p.jugadoresInscritos?.includes(user?.email)}
                />
            ))}
          </div>

          <div className="col-span-12 lg:col-span-7 h-[500px] lg:h-[700px] sticky top-28">
            <div className="h-full w-full border border-white/5 rounded-[32px] overflow-hidden shadow-2xl relative">
              <div className="absolute top-4 right-4 z-[500] bg-[#020617]/80 backdrop-blur-md px-4 py-2 border border-white/10 rounded-full">
                <p className="text-[9px] font-black italic text-[#CCFF00] uppercase tracking-widest">Live Talca Map</p>
              </div>
              
              <MapContainer center={[-35.4264, -71.6554]} zoom={13} className="h-full w-full">
                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                {partidos.map(p => (
                  <Marker key={p.id} position={[p.lat, p.lng]}>
                    <Popup>
                      <div className="bg-slate-950 text-white p-2 font-black italic uppercase text-[10px]">{p.equipo}</div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>
        </div>
      </main>

      <MatchModals 
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