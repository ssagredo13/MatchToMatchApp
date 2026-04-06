import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Componente interno para manejar el movimiento de la cámara
const MapController = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, 15, { duration: 1.5 });
    }
  }, [center, map]);
  return null;
};

// CAMBIAMOS EL NOMBRE AQUÍ
const MatchMapLive = ({ partidos, mapCenter, activeMatchId, setActiveMatchId, neonIcon }) => {
  return (
    <section className="mt-20">
      <div className="mb-8">
        <h2 className="text-[11px] font-black italic text-[#CCFF00] uppercase tracking-[0.5em] ml-1">Geolocalización</h2>
        <h3 className="text-4xl font-black italic uppercase tracking-tighter">Mapa de <span className="opacity-10">Recintos</span></h3>
      </div>

      <div className="h-[500px] lg:h-[600px] w-full border border-white/10 rounded-[48px] overflow-hidden bg-[#0b1224] relative shadow-2xl">
        <MapContainer 
          center={mapCenter} 
          zoom={13} 
          className="h-full w-full"
          scrollWheelZoom={false} 
        >
          <MapController center={mapCenter} />
          <TileLayer 
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" 
            attribution='&copy; OpenStreetMap contributors'
          />
          
          {partidos.map(p => {
            const pId = p._id || p.id;
            if (!p.lat || !p.lng) return null;
            
            return (
              <Marker 
                key={pId} 
                position={[p.lat, p.lng]} 
                icon={activeMatchId === pId ? neonIcon : new L.Icon.Default()}
                eventHandlers={{ 
                  click: () => setActiveMatchId(pId) 
                }}
              >
                <Popup>
                  <div className="text-black p-1 font-sans">
                    <span className="text-blue-600 block font-black uppercase text-[10px] italic">{p.equipo}</span>
                    <span className="font-bold">{p.recinto}</span>
                    <div className="mt-1 text-[9px] text-slate-400 uppercase font-bold italic">{p.fecha} - {p.hora}</div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </section>
  );
};

// Y CAMBIAMOS EL EXPORT AQUÍ
export default MatchMapLive;