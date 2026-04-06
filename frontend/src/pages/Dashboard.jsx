// ... (Imports de React, Hooks y Lucide se mantienen)
import MatchSilo from '../components/Dashboard/MatchSilo';
import MatchMap from '../components/Dashboard/MatchMap';
import MatchFilters from '../components/Dashboard/MatchFilters';

const Dashboard = ({ user, onLogout }) => {
  // --- MANTENEMOS ESTADOS Y HANDLERS (Igual que los tienes) ---
  // ... cargarPartidas, handleCrearPartida, handleEliminarPartido, etc.

  // LÓGICA DE SILOS
  const hoyStr = new Date().toLocaleDateString('en-CA');
  const ayer = new Date(); ayer.setDate(ayer.getDate() - 1);
  const ayerStr = ayer.toLocaleDateString('en-CA');

  const matchesFiltrados = partidos.filter(p => filtro === 'TODOS' || p.estado === filtro);
  const partidasHoy = matchesFiltrados.filter(p => p.fecha === hoyStr);
  const partidasAyer = matchesFiltrados.filter(p => p.fecha === ayerStr);
  const otrasPartidas = matchesFiltrados.filter(p => p.fecha !== hoyStr && p.fecha !== ayerStr);

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans selection:bg-[#ccff00] overflow-x-hidden">
      <Navbar user={user} onLogout={onLogout} />

      <main className="pt-36 px-4 md:px-8 max-w-[1400px] mx-auto pb-20">
        {/* CABECERA (Se puede modularizar en Hero.jsx) */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
            {/* ... Tu código de título y botón crear ... */}
        </header>

        {/* FILTROS MODULARIZADOS */}
        <MatchFilters filtro={filtro} setFiltro={setFiltro} />

        {/* SILO 1: HOY (LIVE) */}
        <MatchSilo 
          title="Match Center" subtitle="Live / Hoy"
          matches={partidasHoy} user={user} isAdmin={isAdmin}
          activeMatchId={activeMatchId} setActiveMatchId={setActiveMatchId}
          setMapCenter={setMapCenter} onDelete={handleEliminarPartido}
          onSelect={(m) => { setSelectedPartido(m); setModalType('UNIRSE'); }}
        />

        {/* SILO 2: AYER (RECUPERACIÓN) */}
        <MatchSilo 
          title="Recientes" subtitle="Ayer"
          matches={partidasAyer} user={user} isAdmin={isAdmin}
          className="opacity-60 grayscale-[0.5]"
          activeMatchId={activeMatchId} setActiveMatchId={setActiveMatchId}
          setMapCenter={setMapCenter} onDelete={handleEliminarPartido}
          onSelect={(m) => { setSelectedPartido(m); setModalType('UNIRSE'); }}
        />

        {/* MAPA AL FINAL (MODULARIZADO) */}
        <MatchMap 
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