import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CalendarDays, Clock3, MapPin, Megaphone, Plus, Send, Trash2, Users, X } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import RecintoSelector from '../RecintoSelector';

const NOTICE_TYPES = [
  { value: 'RIVAL', label: 'Busco rival', description: 'Arma un versus para tu equipo.', icon: '⚔️' },
  { value: 'JUGADORES', label: 'Necesito jugadores', description: 'Completa los cupos de la pichanga.', icon: '👥' },
  { value: 'ARQUERO', label: 'Busco arquero', description: 'Encuentra un arquero para el partido.', icon: '🧤' },
  { value: 'CANCHA', label: 'Cancha disponible', description: 'Publica un horario libre del recinto.', icon: '🏟️' },
];

const formatDateInput = (date) => {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const getInitialSchedule = () => {
  const date = new Date(Date.now() + 2 * 60 * 60 * 1000);
  date.setMinutes(Math.ceil(date.getMinutes() / 30) * 30, 0, 0);
  const pad = (value) => String(value).padStart(2, '0');
  return {
    fecha: formatDateInput(date),
    hora: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  };
};

const formatDate = (date) => new Date(`${date}T00:00:00`).toLocaleDateString(
  'es-CL',
  { weekday: 'short', day: '2-digit', month: 'short' },
);

const QuickNotices = ({ initialType, onInitialTypeHandled, onNoticesChange }) => {
  const [avisos, setAvisos] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [recintoSelectorKey, setRecintoSelectorKey] = useState(0);
  const [form, setForm] = useState(() => ({
    ...getInitialSchedule(),
    recinto: '',
    lat: null,
    lng: null,
    detalle: '',
    cantidad: 1,
    precio: '',
  }));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadNotices = useCallback(async () => {
    try {
      const data = await apiFetch('/api/avisos');
      setAvisos(data);
      setError('');
    } catch (loadError) {
      setError(loadError.message || 'No se pudieron cargar los avisos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotices();
    const intervalId = setInterval(loadNotices, 30000);
    return () => clearInterval(intervalId);
  }, [loadNotices]);

  useEffect(() => {
    onNoticesChange(avisos);
  }, [avisos, onNoticesChange]);

  useEffect(() => {
    if (!initialType) return;
    setSelectedType(initialType);
    onInitialTypeHandled();
    document.getElementById('quick-notices-title')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, [initialType, onInitialTypeHandled]);

  const updateForm = (changes) => setForm((current) => ({ ...current, ...changes }));

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!selectedType || saving) return;

    const payload = {
      tipo: selectedType,
      recinto: form.recinto.trim(),
      fecha: form.fecha,
      hora: form.hora,
      timezoneOffsetMinutes: -new Date(`${form.fecha}T${form.hora}:00`).getTimezoneOffset(),
      detalle: form.detalle.trim(),
    };
    if (form.lat !== null && form.lng !== null) {
      payload.lat = form.lat;
      payload.lng = form.lng;
    }
    if (selectedType === 'JUGADORES' || selectedType === 'ARQUERO') {
      payload.cantidad = Number(form.cantidad);
    }
    if (selectedType === 'CANCHA' && form.precio !== '') {
      payload.precio = Number(form.precio);
    }

    setSaving(true);
    setError('');
    try {
      const created = await apiFetch('/api/avisos', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setAvisos((current) => [...current, created].sort(
        (first, second) => `${first.fecha}T${first.hora}`.localeCompare(`${second.fecha}T${second.hora}`),
      ));
      setSelectedType(null);
      setRecintoSelectorKey((current) => current + 1);
      setForm({ ...getInitialSchedule(), recinto: '', lat: null, lng: null, detalle: '', cantidad: 1, precio: '' });
    } catch (createError) {
      setError(createError.message || 'No se pudo publicar el aviso.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (notice) => {
    if (!window.confirm('¿Quieres retirar este aviso?')) return;
    try {
      await apiFetch(`/api/avisos/${notice.id}`, { method: 'DELETE' });
      setAvisos((current) => current.filter((item) => item.id !== notice.id));
    } catch (cancelError) {
      setError(cancelError.message || 'No se pudo retirar el aviso.');
    }
  };

  return (
    <section id="quick-notices" aria-labelledby="quick-notices-title" className="mb-7 scroll-mt-24 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-[#CCFF00]">
            <Megaphone size={14} /> Avisos rápidos
          </p>
          <h2 id="quick-notices-title" className="text-xl font-black italic uppercase text-white sm:text-2xl">
            ¿Qué necesita tu equipo o recinto?
          </h2>
        </div>
        <span className="text-xs text-slate-400">Los avisos vencen a la hora publicada · máximo 30 días</span>
      </div>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {NOTICE_TYPES.map((type) => (
          <button
            key={type.value}
            type="button"
            aria-pressed={selectedType === type.value}
            onClick={() => setSelectedType((current) => current === type.value ? null : type.value)}
            className={`min-h-[92px] rounded-2xl border p-3 text-left transition-colors sm:p-4 ${
              selectedType === type.value
                ? 'border-[#CCFF00]/60 bg-[#CCFF00]/10'
                : 'border-white/10 bg-[#0b1224] hover:border-white/25'
            }`}
          >
            <span className="flex items-start justify-between gap-2">
              <span className="text-lg" aria-hidden="true">{type.icon}</span>
              {selectedType === type.value ? <X size={15} className="text-[#CCFF00]" /> : <Plus size={15} className="text-slate-400" />}
            </span>
            <span className="mt-2 block text-xs font-black uppercase text-white sm:text-sm">{type.label}</span>
            <span className="mt-1 hidden text-[11px] text-slate-400 sm:block">{type.description}</span>
          </button>
        ))}
      </div>

      {selectedType && (
        <form onSubmit={handleCreate} className="grid gap-4 rounded-2xl border border-[#CCFF00]/20 bg-[#0b1224] p-4 sm:p-5 lg:grid-cols-2">
          <div className="flex items-center justify-between lg:col-span-2">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#CCFF00]">Nuevo aviso</p>
              <h3 className="mt-1 text-lg font-black italic uppercase text-white">
                {NOTICE_TYPES.find((type) => type.value === selectedType)?.label}
              </h3>
            </div>
            <button type="button" onClick={() => setSelectedType(null)} aria-label="Cerrar formulario" className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white">
              <X size={18} />
            </button>
          </div>

          <div className="space-y-2 lg:col-span-2">
            <label className="text-xs font-bold uppercase text-slate-300">Cancha o ubicación</label>
            <RecintoSelector
              key={recintoSelectorKey}
              defaultValue={form.recinto}
              onInputChange={(recinto) => updateForm({ recinto, lat: null, lng: null })}
              onSelectRecinto={(place) => updateForm({
                recinto: place.nombre,
                lat: place.lat,
                lng: place.lng,
              })}
            />
            <p className="text-[11px] text-slate-500">Puedes elegir una sugerencia para ubicar el aviso en el mapa o ingresar el nombre.</p>
          </div>

          <label className="space-y-2 text-xs font-bold uppercase text-slate-300">
            <span className="flex items-center gap-2"><CalendarDays size={14} /> Fecha</span>
            <input
              required
              type="date"
              min={formatDateInput(new Date())}
              value={form.fecha}
              onChange={(event) => updateForm({ fecha: event.target.value })}
              className="h-11 w-full rounded-xl border border-white/10 bg-[#020617] px-3 text-sm text-white [color-scheme:dark]"
            />
          </label>
          <label className="space-y-2 text-xs font-bold uppercase text-slate-300">
            <span className="flex items-center gap-2"><Clock3 size={14} /> Hora</span>
            <input
              required
              type="time"
              value={form.hora}
              onChange={(event) => updateForm({ hora: event.target.value })}
              className="h-11 w-full rounded-xl border border-white/10 bg-[#020617] px-3 text-sm text-white [color-scheme:dark]"
            />
          </label>

          {(selectedType === 'JUGADORES' || selectedType === 'ARQUERO') && (
            <label className="space-y-2 text-xs font-bold uppercase text-slate-300">
              <span>{selectedType === 'ARQUERO' ? 'Arqueros requeridos' : 'Jugadores requeridos'}</span>
              <input
                required
                min="1"
                max="30"
                type="number"
                value={form.cantidad}
                onChange={(event) => updateForm({ cantidad: event.target.value })}
                className="h-11 w-full rounded-xl border border-white/10 bg-[#020617] px-3 text-sm text-white"
              />
            </label>
          )}

          {selectedType === 'CANCHA' && (
            <label className="space-y-2 text-xs font-bold uppercase text-slate-300">
              <span>Precio opcional (CLP)</span>
              <input
                min="0"
                max="10000000"
                type="number"
                value={form.precio}
                onChange={(event) => updateForm({ precio: event.target.value })}
                placeholder="Ej. 30000"
                className="h-11 w-full rounded-xl border border-white/10 bg-[#020617] px-3 text-sm text-white placeholder:text-slate-600"
              />
            </label>
          )}

          <label className="space-y-2 text-xs font-bold uppercase text-slate-300 lg:col-span-2">
            <span>Detalle opcional</span>
            <textarea
              maxLength={240}
              rows={2}
              value={form.detalle}
              onChange={(event) => updateForm({ detalle: event.target.value })}
              placeholder="Agrega información útil para coordinar..."
              className="w-full resize-y rounded-xl border border-white/10 bg-[#020617] px-3 py-2 text-sm text-white placeholder:text-slate-600"
            />
          </label>

          {error && (
            <p role="alert" className="flex items-center gap-2 text-sm text-red-300 lg:col-span-2">
              <AlertCircle size={16} /> {error}
            </p>
          )}
          <button
            type="submit"
            disabled={saving || !form.recinto.trim()}
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#CCFF00] px-4 text-xs font-black uppercase tracking-wide text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 lg:col-span-2"
          >
            <Send size={15} />
            {saving ? 'Publicando aviso…' : 'Publicar aviso'}
          </button>
        </form>
      )}

      {error && !selectedType && (
        <p role="alert" className="flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">
          <AlertCircle size={16} /> {error}
          <button type="button" onClick={loadNotices} className="ml-auto underline">Reintentar</button>
        </p>
      )}

      <div className="space-y-3">
        {loading ? (
          <p role="status" className="text-sm text-slate-400">Cargando avisos activos…</p>
        ) : avisos.length === 0 ? (
          <p className="rounded-xl border border-white/10 bg-[#080e1d] px-4 py-4 text-sm text-slate-400">
            Todavía no hay avisos activos. Publica el primero para coordinar más rápido.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {avisos.map((notice) => {
              const type = NOTICE_TYPES.find((item) => item.value === notice.tipo);
              const canCancel = notice.isOwner;
              const countLabel = notice.tipo === 'ARQUERO'
                ? (notice.cantidad === 1 ? 'arquero' : 'arqueros')
                : (notice.cantidad === 1 ? 'jugador' : 'jugadores');
              return (
                <article key={notice.id} className="rounded-2xl border border-white/10 bg-[#080e1d] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#CCFF00]">
                        {type?.label || 'Aviso'}
                      </p>
                      <h3 className="mt-1 truncate font-black uppercase text-white">{notice.recinto}</h3>
                    </div>
                    {canCancel && (
                      <button
                        type="button"
                        onClick={() => handleCancel(notice)}
                        aria-label="Retirar aviso"
                        className="min-h-10 min-w-10 rounded-lg border border-white/10 text-slate-400 transition hover:border-red-400/30 hover:text-red-300"
                      >
                        <Trash2 size={16} className="mx-auto" />
                      </button>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-300">
                    <span className="flex items-center gap-1.5"><CalendarDays size={14} className="text-slate-500" />{formatDate(notice.fecha)}</span>
                    <span className="flex items-center gap-1.5"><Clock3 size={14} className="text-slate-500" />{notice.hora}</span>
                    {notice.cantidad && (
                      <span className="flex items-center gap-1.5">
                        <Users size={14} className="text-slate-500" />
                        {notice.cantidad} {countLabel}
                      </span>
                    )}
                    {notice.precio !== null && notice.precio !== undefined && <span>${Number(notice.precio).toLocaleString('es-CL')} CLP</span>}
                  </div>
                  {notice.detalle && <p className="mt-3 text-sm text-slate-300">{notice.detalle}</p>}
                  <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
                    <MapPin size={13} /> Publicado por {notice.creadorNombre || 'Jugador'}
                  </p>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default QuickNotices;
