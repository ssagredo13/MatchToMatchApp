import MatchCard from '../MatchCard';

const MatchSilo = ({ title, subtitle, matches, user, isAdmin, onDelete, onSelect, activeMatchId, setActiveMatchId, setMapCenter, className = "" }) => {
  if (matches.length === 0) return null;

  return (
    <section className={`mb-16 ${className}`}>
      <div className="mb-8">
        <h2 className="text-[11px] font-black italic text-[#CCFF00] uppercase tracking-[0.5em] ml-1">{subtitle}</h2>
        <h3 className="text-4xl font-black italic uppercase tracking-tighter">{title}</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {matches.map(p => {
          const pId = p._id || p.id;
          return (
            <div 
              key={pId} 
              onClick={() => { setActiveMatchId(pId); if(p.lat) setMapCenter([p.lat, p.lng]); }}
              className={`transition-all duration-300 ${activeMatchId === pId ? 'scale-[1.02]' : ''}`}
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