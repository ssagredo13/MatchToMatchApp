import React, { useState, useEffect } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';

const RecintoSelector = ({ onSelectRecinto, onInputChange, defaultValue }) => {
  const [query, setQuery] = useState(defaultValue || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Función para buscar en OpenStreetMap (Nominatim)
  const searchAddress = async (text) => {
    if (text.length < 3) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      // Limitamos la búsqueda a Chile para mayor precisión
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&countrycodes=cl&addressdetails=1&limit=5`
      );
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Error buscando dirección:", error);
    } finally {
      setLoading(false);
    }
  };

  // Debounce simple para no saturar el servidor gratuito
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query && showDropdown) searchAddress(query);
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="relative w-full">
      <div className="relative group">
        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#ccff00] group-focus-within:scale-110 transition-transform">
          {loading ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
        </div>
        
        <input
          type="text"
          value={query}
          placeholder="Busca una cancha o dirección..."
          className="w-full bg-white/5 border border-white/10 h-14 pl-14 pr-5 rounded-2xl text-white outline-none focus:border-[#ccff00] font-bold italic uppercase transition-all"
          onChange={(e) => {
            const val = e.target.value;
            setQuery(val);
            setShowDropdown(true);
            if (onInputChange) onInputChange(val); // Esto desbloquea el botón
          }}
          onFocus={() => setShowDropdown(true)}
        />
      </div>

      {showDropdown && (query.length >= 3) && (
        <div className="absolute z-[3000] w-full mt-2 bg-[#0b1224] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          {results.map((res) => (
            <button
              key={res.place_id}
              className="w-full px-5 py-4 flex items-start gap-4 hover:bg-[#ccff00]/10 border-b border-white/5 last:border-0 transition-colors text-left"
              onClick={() => {
                const nombreCorto = res.display_name.split(',')[0].toUpperCase();
                const datos = {
                  nombre: nombreCorto,
                  direccion: res.display_name,
                  lat: parseFloat(res.lat),
                  lng: parseFloat(res.lon)
                };
                setQuery(nombreCorto);
                setShowDropdown(false);
                onSelectRecinto(datos);
              }}
            >
              <MapPin size={18} className="mt-1 text-slate-500 shrink-0" />
              <div>
                <p className="text-white font-black italic uppercase text-xs">{res.display_name.split(',')[0]}</p>
                <p className="text-[9px] text-slate-500 uppercase font-bold mt-1 line-clamp-1">{res.display_name}</p>
              </div>
            </button>
          ))}
          {results.length === 0 && !loading && (
            <div className="p-4 text-[10px] text-slate-500 font-bold uppercase italic text-center">
              No se encontraron resultados oficiales
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RecintoSelector;