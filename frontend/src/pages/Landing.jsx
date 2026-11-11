import React from 'react';
import { ArrowDownRight, ArrowUpRight, MapPin, Target } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { Link } from 'react-router-dom';

const Landing = ({
  onLoginSuccess,
  onGoogleError,
  authError,
  isAuthenticating,
  googleClientIdConfigured,
}) => (
  <div className="relative isolate min-h-screen overflow-hidden bg-[#050806] text-white">
    <div aria-hidden="true" className="absolute inset-0 -z-10">
      <img
        src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2000&auto=format&fit=crop"
        alt=""
        className="h-full min-h-screen w-full object-cover object-[62%_center] opacity-45"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,4,0.98)_0%,rgba(2,6,4,0.86)_42%,rgba(2,6,4,0.38)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(0deg,#050806_0%,transparent_38%,rgba(2,6,4,0.18)_100%)]" />
      <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:linear-gradient(90deg,black,transparent_78%)]" />
    </div>

    <main className="mx-auto flex min-h-screen max-w-[1600px] flex-col px-5 pb-6 pt-5 sm:px-8 sm:pb-8 sm:pt-7 lg:px-14">
      <header className="flex items-center justify-between border-b border-white/15 pb-4">
        <Link to="/" aria-label="Match to Match, inicio" className="group flex items-center gap-3">
          <span className="flex h-10 w-10 -skew-x-12 items-center justify-center bg-[#CCFF00] text-xl font-black italic text-black transition-transform group-hover:scale-105">
            <span className="skew-x-12">M</span>
          </span>
          <span className="text-sm font-black uppercase tracking-[0.16em] sm:text-base">
            Match to <span className="text-[#CCFF00]">Match</span>
          </span>
        </Link>
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/65 sm:text-xs">
          <MapPin size={14} className="text-[#CCFF00]" />
          Talca, Chile
        </div>
      </header>

      <section className="grid flex-1 items-center gap-12 py-14 md:py-20 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)] lg:gap-16 lg:py-16">
        <div className="max-w-4xl">
          <p className="mb-5 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.32em] text-[#CCFF00] sm:text-xs">
            <span className="h-px w-8 bg-[#CCFF00]" />
            La ciudad juega aquí
          </p>

          <h1 className="text-[clamp(3.7rem,11vw,8.5rem)] font-black italic uppercase leading-[0.76] tracking-[-0.075em]">
            Match
            <br />
            <span className="whitespace-nowrap text-[#CCFF00]">to Match</span>
          </h1>

          <div className="mt-8 max-w-2xl border-l-2 border-[#CCFF00] pl-4 sm:mt-10 sm:pl-6">
            <p className="text-lg font-semibold leading-snug text-white sm:text-2xl">
              La próxima pichanga no se organiza sola.
            </p>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">
              Encuentra partidos cerca, completa tu equipo o publica una cancha disponible en Talca.
            </p>
          </div>

          <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-[10px] font-black uppercase tracking-[0.12em] text-white/75 sm:mt-9 sm:gap-x-7 sm:text-xs">
            <span className="inline-flex items-center gap-2"><Target size={14} className="text-[#CCFF00]" /> Partidos</span>
            <span className="inline-flex items-center gap-2"><Target size={14} className="text-[#CCFF00]" /> Jugadores</span>
            <span className="inline-flex items-center gap-2"><Target size={14} className="text-[#CCFF00]" /> Canchas</span>
          </div>
        </div>

        <aside className="relative w-full max-w-md justify-self-start lg:justify-self-end">
          <div className="absolute -left-3 -top-3 h-12 w-12 border-l-2 border-t-2 border-[#CCFF00] sm:-left-4 sm:-top-4 sm:h-16 sm:w-16" />
          <div className="border border-white/20 bg-[#080d0a]/85 p-6 shadow-2xl backdrop-blur-md sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#CCFF00]">Acceso a la comunidad</p>
                <h2 className="mt-3 text-2xl font-black italic uppercase leading-none sm:text-3xl">
                  Entra a la cancha.
                </h2>
              </div>
              <ArrowDownRight aria-hidden="true" size={23} className="shrink-0 text-[#CCFF00]" />
            </div>
            <p className="mt-4 text-sm leading-relaxed text-white/60">
              Entra como jugador o recinto: encuentra partidos, completa tu equipo o publica una cancha disponible.
            </p>

            <div className="mt-7 flex min-h-12 items-center">
              {googleClientIdConfigured ? (
                isAuthenticating ? (
                  <p role="status" className="text-xs font-bold text-[#CCFF00]">
                    Verificando tu cuenta…
                  </p>
                ) : (
                  <GoogleLogin
                    onSuccess={onLoginSuccess}
                    onError={onGoogleError}
                    useOneTap
                    theme="outline"
                    shape="rectangular"
                    text="continue_with"
                  />
                )
              ) : (
                <p role="alert" className="max-w-sm border-l-2 border-amber-300 pl-3 text-xs leading-relaxed text-amber-200">
                  {import.meta.env.DEV
                    ? 'Configura VITE_GOOGLE_CLIENT_ID en frontend/.env y autoriza http://localhost:5173 en Google Cloud.'
                    : 'El inicio de sesión no está configurado para este entorno. Intenta más tarde.'}
                </p>
              )}
            </div>

            {authError && (
              <p role="alert" className="mt-4 border-l-2 border-red-400 pl-3 text-sm text-red-200">
                {authError}
              </p>
            )}
            <p className="mt-6 border-t border-white/10 pt-4 text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">
              Acceso seguro con Google
            </p>
          </div>
          <div className="absolute -bottom-3 -right-3 h-12 w-12 border-b-2 border-r-2 border-[#CCFF00] sm:-bottom-4 sm:-right-4 sm:h-16 sm:w-16" />
        </aside>
      </section>

      <footer className="grid grid-cols-3 border-t border-white/20 pt-4 sm:pt-5">
        {[
          { number: '01', label: 'Encuentra partido' },
          { number: '02', label: 'Completa tu equipo' },
          { number: '03', label: 'Activa tu cancha' },
        ].map((item) => (
          <div key={item.number} className="flex flex-col gap-1 border-r border-white/15 px-2 last:border-r-0 sm:flex-row sm:items-center sm:gap-3 sm:px-5">
            <span className="text-[9px] font-black tracking-widest text-[#CCFF00] sm:text-[10px]">{item.number}</span>
            <span className="text-[8px] font-black uppercase leading-tight tracking-[0.08em] text-white/65 sm:text-[10px] sm:tracking-[0.14em]">
              {item.label}
            </span>
            <ArrowUpRight aria-hidden="true" size={13} className="hidden text-white/40 sm:ml-auto sm:block" />
          </div>
        ))}
      </footer>
    </main>
  </div>
);

export default Landing;
