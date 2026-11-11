import React, { useEffect, useState } from 'react';
import { LogOut, Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = ({ user, onLogout }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const linkClass = (path) => (
    `block min-h-11 rounded-xl px-4 py-3 text-sm font-black italic uppercase tracking-[0.12em] transition-colors ${
      location.pathname === path
        ? 'bg-[#CCFF00]/10 text-[#CCFF00]'
        : 'text-slate-200 hover:bg-white/5 hover:text-white'
    }`
  );

  return (
    <nav aria-label="Navegación principal" className="fixed top-0 left-0 z-[999] w-full border-b border-white/10 bg-[#020617]/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-5 md:h-20 md:px-6">
        
        {/* LOGO */}
        <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="group flex items-center gap-2.5">
          <div className="flex h-11 w-11 skew-x-[-12deg] items-center justify-center bg-[#CCFF00] shadow-[0_0_20px_rgba(204,255,0,0.3)] transition-transform group-hover:scale-110 md:h-10 md:w-10">
            <span className="text-black font-black italic skew-x-[12deg] text-xl">M</span>
          </div>
          <span className="hidden text-xl font-black italic uppercase tracking-tighter text-white md:block">
            Match to <span className="text-[#CCFF00]">Match</span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <Link 
            to="/dashboard" 
            className={`font-black italic text-xs uppercase tracking-[0.2em] transition-colors ${
              location.pathname === '/dashboard' ? 'text-[#CCFF00]' : 'text-slate-400 hover:text-white'
            }`}
          >
            Pichangas
          </Link>
          <Link 
            to="/mis-equipos" 
            className={`font-black italic text-xs uppercase tracking-[0.2em] transition-colors ${
              location.pathname === '/mis-equipos' ? 'text-[#CCFF00]' : 'text-slate-400 hover:text-white'
            }`}
          >
            Mis Equipos
          </Link>
          <Link 
            to="/historial" 
            className={`font-black italic text-xs uppercase tracking-[0.2em] transition-colors ${
              location.pathname === '/historial' ? 'text-[#CCFF00]' : 'text-slate-400 hover:text-white'
            }`}
          >
            Historial
          </Link>
        </div>

        {/* ACCIONES */}
        <div className="flex items-center gap-2 sm:gap-4">
          {user ? (
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-[#0b1224] p-1.5 sm:gap-3 sm:pr-4">
              {user.picture ? (
                <img
                  src={user.picture}
                  alt=""
                  className="h-8 w-8 rounded-full border border-[#CCFF00] object-cover"
                />
              ) : (
                <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-full border border-[#CCFF00] bg-[#CCFF00]/10 text-xs font-black text-[#CCFF00]">
                  {(user.name || user.email || 'J').slice(0, 1).toUpperCase()}
                </span>
              )}
              <div className="hidden lg:block leading-none">
                <p className="text-white text-[10px] font-bold uppercase italic">{user.name || user.email}</p>
                <p className="text-[#CCFF00] text-[8px] font-black tracking-widest mt-0.5">PRO PLAYER</p>
              </div>
              
              <div className="w-[1px] h-4 bg-white/10 mx-1"></div>

              <button 
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout();
                }}
                className="relative z-[110] min-h-11 min-w-11 rounded-lg p-2 text-slate-300 transition-colors hover:bg-red-500/10 hover:text-red-400"
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <div className="text-[#CCFF00] font-black italic text-sm tracking-widest">OFFLINE</div>
          )}
          
          <button
            type="button"
            className="min-h-11 min-w-11 rounded-xl border border-white/10 bg-[#0b1224] p-2.5 text-white transition-colors hover:border-[#CCFF00]/40 hover:text-[#CCFF00] md:hidden"
            aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-primary-navigation"
            onClick={() => setMobileMenuOpen((isOpen) => !isOpen)}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {mobileMenuOpen && (
        <div id="mobile-primary-navigation" className="border-t border-white/10 bg-[#020617] px-3 pb-4 pt-3 shadow-2xl md:hidden">
          <div className="mx-auto grid max-w-7xl gap-1">
            <Link to="/dashboard" className={linkClass('/dashboard')}>Pichangas</Link>
            <Link to="/mis-equipos" className={linkClass('/mis-equipos')}>Mis equipos</Link>
            <Link to="/historial" className={linkClass('/historial')}>Historial</Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;