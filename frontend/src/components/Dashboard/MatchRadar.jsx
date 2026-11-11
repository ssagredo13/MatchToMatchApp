import React, { useMemo, useState } from 'react';
import {
  Building2,
  CalendarDays,
  Clock3,
  LocateFixed,
  Megaphone,
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
const RECOMMENDED_RADIUS_KM = 25;

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

const NOTICE_PRESENTATION = {
  RIVAL: { label: 'Busco rival', color: '#fb923c' },
  JUGADORES: { label: 'Busco jugadores', color: '#ccff00' },
  ARQUERO: { label: 'Busco arquero', color: '#c084fc' },
  CANCHA: { label: 'Cancha disponible', color: '#38bdf8' },
};

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
  avisos = [],
  modo = 'ALL',
  setModo = () => {},
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
        if (modo === 'NEEDS' || modo === 'COURTS') return false;
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
  }, [partidos, nearbyLocation, search, maxDistanceKm, modo]);

  const items = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('es-CL');
    const noticeItems = modo === 'MATCHES'
      ? []
      : avisos
        .filter((notice) => (
          modo === 'ALL'
          || (modo === 'NEEDS' && notice.tipo !== 'CANCHA')
          || (modo === 'COURTS' && notice.tipo === 'CANCHA')
        ))
        .filter((notice) => !query || [notice.recinto, notice.detalle, notice.creadorNombre]
          .some((value) => value?.toLocaleLowerCase('es-CL').includes(query)))
        .map((notice) => ({
          ...notice,
          kind: 'notice',
          radarId: `aviso-${notice.id || notice._id}`,
          distanceKm: isValidCoordinate(notice.lat) && isValidCoordinate(notice.lng)
            ? getDistanceKm(
              nearbyLocation || TALCA_CENTER,
              Number(notice.lat),
              Number(notice.lng),
            )
            : null,
        }))
        .filter((notice) => (
          !nearbyLocation
          || maxDistanceKm === 'all'
          || (notice.distanceKm !== null && notice.distanceKm <= Number(maxDistanceKm))
        ));

    return [
      ...matches.map((match) => ({
        ...match,
        kind: 'match',
        radarId: match.id || match._id,
      })),
      ...noticeItems,
    ].sort((first, second) => {
      if (first.distanceKm !== null && second.distanceKm === null) return -1;
      if (first.distanceKm === null && second.distanceKm !== null) return 1;
      if (first.distanceKm !== null && second.distanceKm !== null
        && first.distanceKm !== second.distanceKm) {
        return first.distanceKm - second.distanceKm;
      }
      return `${first.fecha}T${first.hora}`.localeCompare(`${second.fecha}T${second.hora}`);
    });
  }, [avisos, matches, modo, nearbyLocation, maxDistanceKm, search]);

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
        setLocationMessage(
          'Ordenamos primero los partidos cercanos. Puedes unirte aunque estés fuera del radio sugerido; tu ubicación queda solo en este dispositivo.',
        );
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

  const selectItem = (item) => {
    const itemId = item.kind === 'notice'
      ? `aviso-${item.id || item._id}`
      : item.id || item._id;
    setActiveMatchId(itemId);
    if (isValidCoordinate(item.lat) && isValidCoordinate(item.lng)) {
      setMapCenter([Number(item.lat), Number(item.lng)]);
    }
    if (soundEnabled && item.kind === 'match') {
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
    <section id="match-radar" aria-labelledby="match-radar-title" className="scroll-mt-24 space-y-5">
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
              Ubicación, hora y cupos en una sola vista. {nearbyLocation
                ? 'Tu ubicación solo ordena por cercanía; no impide unirte.'
                : 'Distancias referenciales desde Talca.'}
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
              placeholder="Equipo, necesidad o recinto"
              aria-label="Buscar partidos, avisos o recintos"
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
              className="h-11 rounded-full border border-white/10 bg-[#0b1224] px-4 text-xs font-bold text-slate-300 outline-none focus:border-[#CCFF00]/50 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <option value="all">Cualquier distancia · recomendado</option>
              <option value="5">Hasta 5 km</option>
              <option value="10">Hasta 10 km</option>
              <option value="25">Hasta 25 km</option>
            </select>
            {modo !== 'NEEDS' && modo !== 'COURTS' && (
              <MatchFilters filtro={filtro} setFiltro={setFiltro} />
            )}
          </div>
        </div>

        <div
          aria-label="Filtrar radar"
          className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
        >
          {[
            { value: 'ALL', label: 'Todo el radar' },
            { value: 'MATCHES', label: 'Partidos' },
            { value: 'NEEDS', label: 'Jugadores y rivales' },
            { value: 'COURTS', label: 'Canchas libres' },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={modo === option.value}
              onClick={() => setModo(option.value)}
              className={`min-h-10 shrink-0 rounded-full border px-4 text-[11px] font-black uppercase tracking-wide transition ${
                modo === option.value
                  ? 'border-[#CCFF00]/60 bg-[#CCFF00]/10 text-[#CCFF00]'
                  : 'border-white/10 bg-[#0b1224] text-slate-400 hover:border-white/25 hover:text-white'
              }`}
            >
              {option.label}
            </button>
          ))}
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
            aria-label="Mapa de partidos, necesidades y canchas disponibles"
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
            {items.map((item) => {
              if (!isValidCoordinate(item.lat) || !isValidCoordinate(item.lng)) return null;
              const isNotice = item.kind === 'notice';
              const itemId = item.radarId;
              const isSelected = itemId === activeMatchId;
              const isReady = !isNotice && item.estado === 'PARTIDO LISTO';
              const color = isNotice
                ? NOTICE_PRESENTATION[item.tipo]?.color || '#ccff00'
                : isReady ? '#4ade80' : item.tipo === 'RIVAL' ? '#fb923c' : '#ccff00';

              return (
                <CircleMarker
                  key={itemId}
                  center={[Number(item.lat), Number(item.lng)]}
                  radius={isSelected ? 14 : 10}
                  pathOptions={{
                    color: '#020617',
                    fillColor: color,
                    fillOpacity: 0.95,
                    weight: isSelected ? 4 : 2,
                  }}
                  eventHandlers={{ click: () => selectItem(item) }}
                >
                  <Popup>
                    <strong>
                      {isNotice
                        ? NOTICE_PRESENTATION[item.tipo]?.label || 'Aviso'
                        : item.equipo || 'Partido'}
                    </strong>
                    <br />
                    {item.recinto || 'Ubicación por confirmar'}
                    <br />
                    {item.fecha} · {item.hora}
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
            <span className="rounded-full border border-white/10 bg-[#020617]/90 px-3 py-2 text-[10px] font-bold text-white shadow">
              <span className="mr-2 inline-block h-2 w-2 rounded-full bg-sky-400" />
              Cancha
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
                {modo === 'COURTS'
                  ? 'Canchas disponibles'
                  : modo === 'NEEDS'
                  ? 'Jugadores y rivales'
                  : nearbyLocation ? 'Cerca de ti' : 'Radar de Talca'}
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                {items.length} {items.length === 1 ? 'aviso disponible' : 'avisos disponibles'}
                {' · '}{nearbyLocation ? 'desde tu ubicación' : 'desde Talca'}
              </p>
            </div>
            <Navigation size={18} className="text-[#CCFF00]" />
          </div>

          <div className="custom-scrollbar flex-1 space-y-3 overflow-y-auto p-3">
            {items.map((item) => {
              const isNotice = item.kind === 'notice';
              const itemId = item.radarId;
              const isSelected = itemId === activeMatchId;
              const remaining = isNotice
                ? 0
                : Math.max(0, Number(item.total || 0) - Number(item.jugadores || 0));
              const canCancel = !isNotice && (item.creadorEmail === userEmail || isAdmin);
              const isFull = !isNotice && (remaining === 0 || item.estado === 'PARTIDO LISTO');

              return (
                <article
                  key={itemId}
                  className={`rounded-2xl border p-4 transition ${
                    isSelected
                      ? 'border-[#CCFF00]/50 bg-[#CCFF00]/[0.07]'
                      : 'border-white/10 bg-[#0b1224] hover:border-white/25'
                  }`}
                >
                  {isNotice ? (
                    <button
                      type="button"
                      onClick={() => selectItem(item)}
                      className="w-full text-left"
                      aria-pressed={isSelected}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-300">
                            {item.tipo === 'CANCHA' ? <Building2 size={13} /> : <Megaphone size={13} />}
                            {NOTICE_PRESENTATION[item.tipo]?.label || 'Aviso'}
                          </p>
                          <h4 className="mt-1 truncate text-base font-black uppercase text-white">{item.recinto}</h4>
                        </div>
                        <span className="shrink-0 rounded-full bg-white/5 px-2.5 py-1 text-[9px] font-black uppercase text-slate-300">
                          Aviso activo
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                        <span className="flex items-center gap-1.5 text-slate-300">
                          <CalendarDays size={14} className="shrink-0 text-slate-500" />
                          {formatMatchDate(item.fecha)}
                        </span>
                        <span className="flex items-center gap-1.5 text-slate-300">
                          <Clock3 size={14} className="shrink-0 text-slate-500" />
                          {item.hora}
                        </span>
                      </div>
                      {(item.cantidad || item.precio !== null && item.precio !== undefined) && (
                        <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold text-[#CCFF00]">
                          {item.cantidad && (
                            <span className="inline-flex items-center gap-1.5">
                              <Users size={14} /> {item.cantidad} {item.tipo === 'ARQUERO' ? 'arqueros' : 'jugadores'}
                            </span>
                          )}
                          {item.precio !== null && item.precio !== undefined && (
                            <span>${Number(item.precio).toLocaleString('es-CL')} CLP</span>
                          )}
                        </p>
                      )}
                      {item.detalle && <p className="mt-3 line-clamp-2 text-xs text-slate-400">{item.detalle}</p>}
                      <div className="mt-3 flex items-center justify-between gap-2 text-[10px] text-slate-500">
                        <span>Publicado por {item.creadorNombre || 'usuario'}</span>
                        <span>{item.distanceKm === null ? 'Distancia —' : formatDistance(item.distanceKm)}</span>
                      </div>
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => selectItem(item)}
                        className="w-full text-left"
                        aria-pressed={isSelected}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-base font-black italic uppercase">
                              {item.equipo || 'Equipo'}
                              {item.rival && <span className="text-[#CCFF00]"> vs {item.rival}</span>}
                            </p>
                            <p className="mt-1 truncate text-xs text-slate-400">
                              {item.recinto || 'Ubicación por confirmar'}
                            </p>
                          </div>
                          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-black uppercase ${
                            item.estado === 'PARTIDO LISTO'
                              ? 'bg-green-400/10 text-green-300'
                              : item.tipo === 'RIVAL'
                              ? 'bg-orange-400/10 text-orange-300'
                              : 'bg-[#CCFF00]/10 text-[#CCFF00]'
                          }`}>
                            {item.estado === 'PARTIDO LISTO'
                              ? 'Partido listo'
                              : item.tipo === 'RIVAL' ? 'Versus' : 'Jugadores'}
                          </span>
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-2 text-[11px]">
                          <span className="flex items-center gap-1.5 text-slate-300">
                            <CalendarDays size={14} className="shrink-0 text-slate-500" />
                            {formatMatchDate(item.fecha)}
                          </span>
                          <span className="flex items-center gap-1.5 text-slate-300">
                            <Clock3 size={14} className="shrink-0 text-slate-500" />
                            {item.hora}
                          </span>
                          <span className="flex items-center gap-1.5 text-slate-300">
                            <MapPin size={14} className="shrink-0 text-slate-500" />
                            {item.distanceKm === null ? 'Distancia —' : formatDistance(item.distanceKm)}
                          </span>
                        </div>

                        <div className="mt-3 flex items-center justify-between text-[11px]">
                          <span className="flex items-center gap-1.5 text-slate-400">
                            <Users size={14} />
                            {item.jugadores || 0}/{item.total || 0} jugadores
                          </span>
                          <span className="font-bold text-[#CCFF00]">
                            {remaining > 0 ? `${remaining} cupos` : 'Completo'}
                          </span>
                        </div>
                        {nearbyLocation && item.distanceKm !== null
                          && item.distanceKm > RECOMMENDED_RADIUS_KM && !isFull && (
                            <p className="mt-3 rounded-lg border border-amber-300/20 bg-amber-300/[0.06] px-3 py-2 text-[11px] leading-relaxed text-amber-100">
                              Está a {formatDistance(item.distanceKm)} de ti, fuera del radio sugerido de {RECOMMENDED_RADIUS_KM} km.
                              Puedes continuar si te acomoda el traslado.
                            </p>
                          )}
                      </button>

                      {isSelected && canCancel && (
                        <button
                          type="button"
                          onClick={() => onCancelMatch(item.id || item._id)}
                          className="mt-4 min-h-11 w-full rounded-xl border border-red-400/30 bg-red-500/10 px-4 text-xs font-black uppercase tracking-wide text-red-200 transition hover:bg-red-500/20"
                        >
                          Cancelar partido
                        </button>
                      )}
                      {isSelected && !canCancel && (
                        <button
                          type="button"
                          onClick={() => onSelectMatch(item)}
                          disabled={isFull}
                          className="mt-4 min-h-11 w-full rounded-xl bg-[#CCFF00] px-4 text-xs font-black uppercase tracking-wide text-black transition hover:bg-white disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-400"
                        >
                          {isFull
                            ? 'Partido completo'
                            : nearbyLocation && item.distanceKm !== null
                              && item.distanceKm > RECOMMENDED_RADIUS_KM
                              ? 'Ver y unirme igual'
                              : 'Ver partido y unirme'}
                        </button>
                      )}
                    </>
                  )}
                </article>
              );
            })}
            {items.length === 0 && (
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
                    setModo('ALL');
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
