import MatchCard from '../MatchCard';

const MatchSilo = ({ 
  title, 
  subtitle, 
  matches, 
  user, 
  isAdmin, 
  onDelete, 
  onSelect, 
  activeMatchId, 
  setActiveMatchId, 
  setMapCenter, 
  className = "" 
}) => {
  
  return (
    <section className={`${className}`}>
      <div className="mb-8">
        <h2 className="text-[11px] font-black italic text-[#CCFF00] uppercase tracking-[0.5em] ml-1">
          {subtitle}
        </h2>
        <h3 className="text-4xl font-black italic uppercase tracking-tighter">
          {title}
        </h3>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        {matches.map(p => {
          const pId = p._id || p.id;
          const esFallida = p.estadoEspecial === 'FALLIDA'; // <--- Detectamos si es fallida

          return (
            <div 
              key={pId} 
              onClick={() => { 
                if (esFallida) return; // <--- BLOQUEO: No activamos ID ni movemos mapa si falló
                setActiveMatchId(pId); 
                if(p.lat) setMapCenter([p.lat, p.lng]); 
              }}
              className={`transition-all duration-300 ${
                activeMatchId === pId ? 'scale-[1.02]' : ''
              } ${esFallida ? 'cursor-default' : 'cursor-pointer'}`} // <--- Cursor coherente
            >
              <MatchCard 
                partido={p} 
                user={user} 
                isAdmin={isAdmin} 
                isActive={activeMatchId === pId}
                onDelete={onDelete} 
                onSelect={onSelect}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default MatchSilo;