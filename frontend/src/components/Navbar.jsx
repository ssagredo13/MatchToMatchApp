import React from 'react';
import { LogOut, Menu } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom'; // Importamos hooks de navegación

const Navbar = ({ user, onLogout }) => {
  const location = useLocation(); // Para saber en qué página estamos y resaltar el botón

  return (
    <nav className="fixed top-0 left-0 w-full z-[999] bg-[#020617]/95 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        
        {/* LOGO */}
        <Link to="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-[#CCFF00] skew-x-[-12deg] flex items-center justify-center shadow-[0_0_20px_rgba(204,255,0,0.3)] group-hover:scale-110 transition-transform">
            <span className="text-black font-black italic skew-x-[12deg] text-xl">M</span>
          </div>
          <span className="text-white font-black italic text-2xl tracking-tighter hidden md:block uppercase">
            Match to <span className="text-[#CCFF00]">Match</span>
          </span>
        </Link>

        {/* --- PUNTO 3: NAVEGACIÓN CENTRAL --- */}
        <div className="hidden md:flex items-center gap-8">
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
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3 bg-white/5 p-1.5 pr-4 rounded-full border border-white/10">
              <img 
                src={user.picture} 
                alt="Avatar" 
                className="w-8 h-8 rounded-full border border-[#CCFF00] object-cover"
              />
              <div className="hidden lg:block leading-none">
                <p className="text-white text-[10px] font-bold uppercase italic">{user.name}</p>
                <p className="text-[#CCFF00] text-[8px] font-black tracking-widest mt-0.5">PRO PLAYER</p>
              </div>
              
              <div className="w-[1px] h-4 bg-white/10 mx-1"></div>

              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onLogout();
                }}
                className="relative z-[110] p-2 text-slate-400 hover:text-red-500 transition-colors cursor-pointer pointer-events-auto"
                title="Cerrar sesión"
              >
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <div className="text-[#CCFF00] font-black italic text-sm tracking-widest">OFFLINE</div>
          )}
          
          <button className="md:hidden text-white hover:text-[#CCFF00] p-2">
            <Menu size={24} />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;