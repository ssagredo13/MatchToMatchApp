import React, { useMemo, useState } from 'react';
import {
  CalendarDays,
  Clock3,
  LocateFixed,
  MapPin,
  Navigation,
  Search,
  Users,
} from 'lucide-react';
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import MatchFilters from './MatchFilters';
import FootballAtmosphere from './FootballAtmosphere';
import { playRefereeWhistle } from '../../lib/footballSound';

const TALCA_CENTER = [-35.4264, -71.6554];

const isValidCoordinate = (value) => (
  value !== null
  && value !== undefined
  && value !== ''
  && Number.isFinite(Number(value))
);

const getDistanceKm = (origin, latitude, longitude) => {
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const latDifference = toRadians(latitude - origin[0]);
  const lngDifference = toRadians(longitude - origin[1]);
  const originLatitude = toRadians(origin[0]);
  const destinationLatitude = toRadians(latitude);
  const haversine = Math.sin(latDifference / 2) ** 2
    + Math.cos(originLatitude) * Math.cos(destinationLatitude)
    * Math.sin(lngDifference / 2) ** 2;

  return 2 * earthRadiusKm * Math.atan2(
    Math.sqrt(haversine),
    Math.sqrt(1 - haversine),
  );
};

const formatDistance = (distance) => (
  distance < 1
    ? `${Math.round(distance * 1000)} m`
    : `${distance.toFixed(1).replace('.', ',')} km`
);

const formatMatchDate = (date) => new Date(`${date}T00:00:00`).toLocaleDateString(
  'es-CL',
  { weekday: 'short', day: 'numeric', month: 'short' },
);

const MapCamera = ({ center, zoom }) => {
  const map = useMap();

  React.useEffect(() => {
    if (center?.every(Number.isFinite)) {
      map.flyTo(center, zoom, { duration: 0.8 });
    }
  }, [center, map, zoom]);

  return null;
};

const MatchRadar = ({
  partidos,
  filtro,
  setFiltro,
  mapCenter,
  setMapCenter,
  activeMatchId,
  setActiveMatchId,
  onSelectMatch,
  onCancelMatch,
  userEmail,
  isAdmin,
}) => {
  const [search, setSearch] = useState('');
  const [maxDistanceKm, setMaxDistanceKm] = useState('all');
  const [nearbyLocation, setNearbyLocation] = useState(null);
  const [locationMessage, setLocationMessage] = useState('');
  const [locating, setLocating] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [soundMessage, setSoundMessage] = useState('');

  const matches = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('es-CL');
    const filteredMatches = partidos
      .filter((match) => {
        if (!query) return true;
        return [match.equipo, match.rival, match.recinto]
          .some((value) => value?.toLocaleLowerCase('es-CL').includes(query));
      })
      .map((match) => ({
        ...match,
        distanceKm: isValidCoordinate(match.lat)
          && isValidCoordinate(match.lng)
          ? getDistanceKm(
            nearbyLocation || TALCA_CENTER,
            Number(match.lat),
            Number(match.lng),
          )
          : null,
      }))
      .sort((first, second) => {
        if (first.distanceKm !== null && second.distanceKm === null) return -1;
        if (first.distanceKm === null && second.distanceKm !== null) return 1;
        if (first.distanceKm !== null && second.distanceKm !== null
          && first.distanceKm !== second.distanceKm) {
          return first.distanceKm - second.distanceKm;
        }
        return `${first.fecha}T${first.hora}`.localeCompare(`${second.fecha}T${second.hora}`);
      });

    if (!nearbyLocation || maxDistanceKm === 'all') return filteredMatches;
    return filteredMatches.filter(
      (match) => match.distanceKm !== null && match.distanceKm <= Number(maxDistanceKm),
    );
  }, [partidos, nearbyLocation, search, maxDistanceKm]);

  const locateUser = () => {
    if (!navigator.geolocation) {
      setLocationMessage('Este navegador no permite consultar la ubicación. Puedes explorar el mapa de Talca.');
      return;
    }

    setLocating(true);
    setLocationMessage('');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const position = [coords.latitude, coords.longitude];
        setNearbyLocation(position);
        setMapCenter(position);
        setLocationMessage('Mostrando primero los partidos más cercanos a ti.');
        setLocating(false);
      },
      (error) => {
        const message = error.code === error.PERMISSION_DENIED
          ? 'No se concedió acceso a la ubicación. El radar sigue mostrando partidos de Talca.'
          : 'No pudimos obtener tu ubicación. Puedes explorar el mapa de Talca.';
        setLocationMessage(message);
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  };

  const selectMatch = (match) => {
    const matchId = match.id || match._id;
    setActiveMatchId(matchId);
    if (isValidCoordinate(match.lat) && isValidCoordinate(match.lng)) {
      setMapCenter([Number(match.lat), Number(match.lng)]);
    }
    if (soundEnabled) {
      playRefereeWhistle().catch(() => {
        setSoundEnabled(false);
        setSoundMessage('No se pudo reproducir audio. El radar sigue disponible sin sonido.');
      });
    }
  };

  const toggleSound = async () => {
    if (soundEnabled) {
      setSoundEnabled(false);
      setSoundMessage('Silbato desactivado.');
      return;
    }

    try {
      await playRefereeWhistle();
      setSoundEnabled(true);
      setSoundMessage('Silbato activado. Sonará al seleccionar un partido.');
    } catch {
      setSoundEnabled(false);
      setSoundMessage('El audio no está disponible en este navegador. El radar sigue funcionando.');
    }
  };

  return (
    <section aria-labelledby="match-radar-title" className="space-y-5">
      <FootballAtmosphere
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        soundMessage={soundMessage}
      />
      <div className="flex flex-col gap-4">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-[10px] font-black italic uppercase tracking-[0.35em] text-[#CCFF00]">
              {nearbyLocation ? 'Radar cerca de ti' : 'Radar local · Talca'}
            </p>
            <h2
              id="match-radar-title"
              className="text-3xl font-black italic uppercase tracking-tight sm:text-4xl"
            >
              Encuentra tu <span className="text-[#CCFF00]">partido</span>
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Ubicación, hora y cupos en una sola vista. Distancia desde {nearbyLocation ? 'ti' : 'Talca'}.
            </p>
          </div>
          <button
            type="button"
            onClick={locateUser}
            disabled={locating}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#CCFF00]/30 bg-[#CCFF00]/10 px-4 text-xs font-black uppercase tracking-wide text-[#CCFF00] transition hover:bg-[#CCFF00]/20 disabled:cursor-wait disabled:opacity-60"
          >
            <LocateFixed size={16} className={locating ? 'animate-pulse' : ''} />
            {locating ? 'Buscando ubicación…' : nearbyLocation ? 'Actualizar mi ubicación' : 'Cerca de mí'}
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <label className="relative block">
            <Search
              aria-hidden="true"
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Busca por equipo o recinto"
              aria-label="Buscar partidos por equipo o recinto"
              className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#CCFF00]/50"
            />
          </label>
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center md:justify-self-end">
            <label className="sr-only" htmlFor="match-distance-filter">Distancia máxima</label>
            <select
              id="match-distance-filter"
              value={maxDistanceKm}
              onChange={(event) => setMaxDistanceKm(event.target.value)}
              disabled={!nearbyLocation}
              className="h-10 rounded-full border border-white/10 bg-[#0b1224] px-4 text-xs font-bold text-slate-300 outline-none focus:border-[#CCFF00]/50 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <option value="all">Cualquier distancia</option>
              <option value="5">Hasta 5 km</option>
              <option value="10">Hasta 10 km</option>
              <option value="25">Hasta 25 km</option>
            </select>
            <MatchFilters filtro={filtro} setFiltro={setFiltro} />
          </div>
        </div>

        {locationMessage && (
          <p role="status" className="text-xs text-slate-400">{locationMessage}</p>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(340px,0.85fr)]">
        <div className="relative h-[38vh] min-h-[300px] overflow-hidden rounded-3xl border border-white/10 bg-[#0b1224] shadow-2xl sm:h-[480px] lg:h-[620px]">
          <MapContainer
            center={mapCenter || TALCA_CENTER}
            zoom={13}
            className="h-full w-full"
            scrollWheelZoom={false}
            aria-label="Mapa de partidos disponibles"
          >
            <MapCamera center={mapCenter || TALCA_CENTER} zoom={13} />
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
              attribution='Tiles &copy; Esri, HERE, Garmin, &copy; OpenStreetMap contributors, and the GIS user community'
              maxNativeZoom={16}
              maxZoom={19}
            />
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
              attribution='Tiles &copy; Esri, HERE, Garmin, &copy; OpenStreetMap contributors, and the GIS user community'
              maxNativeZoom={16}
              maxZoom={19}
              pane="overlayPane"
            />
            {nearbyLocation && (
              <CircleMarker
                center={nearbyLocation}
                radius={9}
                pathOptions={{ color: '#fff', fillColor: '#38bdf8', fillOpacity: 1, weight: 3 }}
              >
                <Popup>Tu ubicación aproximada (solo visible en este dispositivo)</Popup>
              </CircleMarker>
            )}
            {matches.map((match) => {
              if (!isValidCoordinate(match.lat) || !isValidCoordinate(match.lng)) return null;
              const matchId = match.id || match._id;
              const isSelected = matchId === activeMatchId;
              const isReady = match.estado === 'PARTIDO LISTO';
              const color = isReady ? '#4ade80' : match.tipo === 'RIVAL' ? '#fb923c' : '#ccff00';

              return (
                <CircleMarker
                  key={matchId}
                  center={[Number(match.lat), Number(match.lng)]}
                  radius={isSelected ? 14 : 10}
                  pathOptions={{
                    color: '#020617',
                    fillColor: color,
                    fillOpacity: 0.95,
                    weight: isSelected ? 4 : 2,
                  }}
                  eventHandlers={{ click: () => selectMatch(match) }}
                >
                  <Popup>
                    <strong>{match.equipo || 'Partido'}</strong>
                    <br />
                    {match.recinto || 'Ubicación por confirmar'}
                    <br />
                    {match.fecha} · {match.hora}
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
          <div className="pointer-events-none absolute left-3 top-3 z-[400] flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-[#020617]/90 px-3 py-2 text-[10px] font-bold text-white shadow">
              <span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#CCFF00]" />
              Jugadores
            </span>
            <span className="rounded-full border border-white/10 bg-[#020617]/90 px-3 py-2 text-[10px] font-bold text-white shadow">
              <span className="mr-2 inline-block h-2 w-2 rounded-full bg-orange-400" />
              Rival
            </span>
            <span className="rounded-full border border-white/10 bg-[#020617]/90 px-3 py-2 text-[10px] font-bold text-white shadow">
              <span className="mr-2 inline-block h-2 w-2 rounded-full bg-green-400" />
              Completo
            </span>
          </div>
        </div>

        <aside
          aria-label="Partidos disponibles"
          className="flex min-h-[320px] flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#080e1d] lg:h-[620px]"
        >
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
            <div>
              <h3 className="font-black italic uppercase tracking-wide">
                {nearbyLocation ? 'Cerca de ti' : 'Partidos en Talca'}
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                {matches.length} {matches.length === 1 ? 'partido disponible' : 'partidos disponibles'}
                {' · '}{nearbyLocation ? 'desde tu ubicación' : 'desde Talca'}
              </p>
            </div>
            <Navigation size={18} className="text-[#CCFF00]" />
          </div>

          <div className="custom-scrollbar flex-1 space-y-3 overflow-y-auto p-3">
            {matches.map((match) => {
              const matchId = match.id || match._id;
              const isSelected = matchId === activeMatchId;
              const remaining = Math.max(0, Number(match.total || 0) - Number(match.jugadores || 0));
              const canCancel = match.creadorEmail === userEmail || isAdmin;
              const isFull = remaining === 0 || match.estado === 'PARTIDO LISTO';

              return (
                <article
                  key={matchId}
                  className={`rounded-2xl border p-4 transition ${
                    isSelected
                      ? 'border-[#CCFF00]/50 bg-[#CCFF00]/[0.07]'
                      : 'border-white/10 bg-[#0b1224] hover:border-white/25'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => selectMatch(match)}
                    className="w-full text-left"
                    aria-pressed={isSelected}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-base font-black italic uppercase">
                          {match.equipo || 'Equipo'}
                          {match.rival && <span className="text-[#CCFF00]"> vs {match.rival}</span>}
                        </p>
                        <p className="mt-1 truncate text-xs text-slate-400">
                          {match.recinto || 'Ubicación por confirmar'}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-black uppercase ${
                        match.estado === 'PARTIDO LISTO'
                          ? 'bg-green-400/10 text-green-300'
                          : match.tipo === 'RIVAL'
                          ? 'bg-orange-400/10 text-orange-300'
                          : 'bg-[#CCFF00]/10 text-[#CCFF00]'
                      }`}>
                        {match.estado === 'PARTIDO LISTO'
                          ? 'Partido listo'
                          : match.tipo === 'RIVAL' ? 'Versus' : 'Jugadores'}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2 text-[11px]">
                      <span className="flex items-center gap-1.5 text-slate-300">
                        <CalendarDays size={14} className="shrink-0 text-slate-500" />
                        {formatMatchDate(match.fecha)}
                      </span>
                      <span className="flex items-center gap-1.5 text-slate-300">
                        <Clock3 size={14} className="shrink-0 text-slate-500" />
                        {match.hora}
                      </span>
                      <span className="flex items-center gap-1.5 text-slate-300">
                        <MapPin size={14} className="shrink-0 text-slate-500" />
                        {match.distanceKm === null ? 'Distancia —' : formatDistance(match.distanceKm)}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Users size={14} />
                        {match.jugadores || 0}/{match.total || 0} jugadores
                      </span>
                      <span className="font-bold text-[#CCFF00]">
                        {remaining > 0 ? `${remaining} cupos` : 'Completo'}
                      </span>
                    </div>
                  </button>

                  {isSelected && canCancel && (
                    <button
                      type="button"
                      onClick={() => onCancelMatch(matchId)}
                      className="mt-4 min-h-11 w-full rounded-xl border border-red-400/30 bg-red-500/10 px-4 text-xs font-black uppercase tracking-wide text-red-200 transition hover:bg-red-500/20"
                    >
                      Cancelar partido
                    </button>
                  )}
                  {isSelected && !canCancel && (
                    <button
                      type="button"
                      onClick={() => onSelectMatch(match)}
                      disabled={isFull}
                      className="mt-4 min-h-11 w-full rounded-xl bg-[#CCFF00] px-4 text-xs font-black uppercase tracking-wide text-black transition hover:bg-white disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-400"
                    >
                      {isFull ? 'Partido completo' : 'Ver partido y unirme'}
                    </button>
                  )}
                </article>
              );
            })}
            {matches.length === 0 && (
              <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
                <MapPin size={28} className="mb-3 text-slate-600" />
                <p className="font-bold text-white">No encontramos partidos con estos filtros</p>
                <p className="mt-2 text-xs text-slate-500">
                  Prueba otra búsqueda o vuelve a ver todos los partidos.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setFiltro('TODOS');
                    setMaxDistanceKm('all');
                  }}
                  className="mt-4 text-xs font-black uppercase text-[#CCFF00] underline underline-offset-4"
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
};

export default MatchRadar;
