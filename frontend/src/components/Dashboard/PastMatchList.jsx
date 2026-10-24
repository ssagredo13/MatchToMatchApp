import React, { useState } from 'react';
import { CalendarDays, ChevronDown, MapPin, Users } from 'lucide-react';

const formatDate = (date) => {
  const parsedDate = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsedDate.getTime())
    ? date
    : parsedDate.toLocaleDateString('es-CL', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
};

const PastMatchList = ({ matches, emptyMessage = 'No hay partidos anteriores.' }) => {
  const [hoveredId, setHoveredId] = useState(null);
  const [pinnedId, setPinnedId] = useState(null);

  if (matches.length === 0) {
    return (
      <p className="rounded-xl border border-white/10 bg-[#0b1224] px-4 py-5 text-sm text-slate-400">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {matches.map((match) => {
        const matchId = match.id || match._id;
        const isExpanded = pinnedId === matchId || hoveredId === matchId;
        const opponent = match.rival ? ` vs ${match.rival}` : '';
        const status = match.estadoEspecial === 'FALLIDA'
          ? 'No se completó'
          : match.estado === 'CANCELADO' ? 'Cancelado' : 'Finalizado';

        return (
          <li
            key={matchId}
            onMouseEnter={() => setHoveredId(matchId)}
            onMouseLeave={() => setHoveredId(null)}
            onFocus={() => setHoveredId(matchId)}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) setHoveredId(null);
            }}
            className={`overflow-hidden rounded-xl border transition-colors ${
              isExpanded
                ? 'border-[#CCFF00]/35 bg-[#0c1526]'
                : 'border-white/10 bg-[#0b1224] hover:border-white/20'
            }`}
          >
            <button
              type="button"
              aria-expanded={isExpanded}
              onClick={() => {
                setPinnedId((currentId) => (currentId === matchId ? null : matchId));
                setHoveredId(null);
              }}
              className="past-match-row__toggle flex min-h-14 w-full items-center justify-between gap-4 px-4 py-3 text-left"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-black uppercase text-white">
                  {match.equipo || 'Partido'}{opponent}
                </span>
                <span className="mt-1 block text-xs text-slate-300">
                  {formatDate(match.fecha)} · {match.hora}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-3">
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-slate-300">
                  {status}
                </span>
                <ChevronDown
                  size={16}
                  aria-hidden="true"
                  className={`text-[#CCFF00] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                />
              </span>
            </button>

            <div
              className={`grid transition-[grid-template-rows,opacity] duration-200 ${
                isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              }`}
            >
              <div className="min-h-0 overflow-hidden">
                <div className="grid gap-3 border-t border-white/10 px-4 py-3 text-xs text-slate-300 sm:grid-cols-3">
                  <span className="flex items-center gap-2">
                    <MapPin size={14} className="shrink-0 text-[#CCFF00]" />
                    <span className="truncate">{match.recinto || 'Ubicación no disponible'}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <Users size={14} className="shrink-0 text-[#CCFF00]" />
                    {match.jugadores || 0} / {match.total || 0} jugadores
                  </span>
                  <span className="flex items-center gap-2">
                    <CalendarDays size={14} className="shrink-0 text-[#CCFF00]" />
                    {match.creadorNombre || 'Organizador'}
                  </span>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default PastMatchList;
