import React from 'react';

const MatchFilters = ({ filtro, setFiltro }) => {
  const opciones = ['TODOS', 'BUSCANDO JUGADORES', 'BUSCANDO RIVAL', 'PARTIDO LISTO'];

  return (
    <div className="flex gap-3 mb-12 overflow-x-auto pb-4 no-scrollbar">
      {opciones.map(f => (
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
  );
};

export default MatchFilters;