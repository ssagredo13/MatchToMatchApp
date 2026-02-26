import React from 'react';
import { LogOut, Menu } from 'lucide-react';

const Navbar = ({ user, onLogout }) => {
  return (
    <nav className="fixed top-0 w-full z-[100] bg-[#020617]/90 backdrop-blur-md border-b border-white/5">
      {/* max-w-7xl y px-6 para alinear con el contenido del Dashboard */}
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        
        {/* LOGO */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#CCFF00] skew-x-[-12deg] flex items-center justify-center shadow-[0_0_20px_rgba(204,255,0,0.4)]">
            <span className="text-black font-black italic skew-x-[12deg] text-xl">M</span>
          </div>
          <span className="text-white font-black italic text-2xl tracking-tighter hidden lg:block">
            MATCH TO <span className="text-[#CCFF00]">MATCH</span>
          </span>
        </div>

        {/* NAVEGACIÓN CENTRAL (Agregada para coherencia visual) */}
        <div className="hidden md:flex items-center gap-8">
          <button className="text-[11px] font-black uppercase italic tracking-widest text-[#CCFF00] border-b-2 border-[#CCFF00] pb-1">Inicio</button>
          <button className="text-[11px] font-black uppercase italic tracking-widest text-slate-400 hover:text-white transition-colors">Mis Partidas</button>
          <button className="text-[11px] font-black uppercase italic tracking-widest text-slate-400 hover:text-white transition-colors">Mis Equipos</button>
        </div>

        {/* ACCIONES / USUARIO */}
        <div className="flex items-center gap-4">
          {user && (
            <div className="flex items-center gap-3 bg-white/5 p-1.5 pr-4 rounded-full border border-white/10 hover:border-white/20 transition-all">
              <img 
                src={user.picture} 
                alt="Perfil" 
                className="w-8 h-8 rounded-full border border-[#CCFF00] object-cover"
              />
              <div className="hidden sm:block">
                <p className="text-white text-[10px] font-black uppercase leading-none italic">{user.name}</p>
                <p className="text-[#CCFF00] text-[9px] font-bold tracking-[0.2em] mt-0.5">PRO PLAYER</p>
              </div>
              <div className="w-[1px] h-4 bg-white/10 ml-2 mr-1 hidden sm:block"></div>
              <button 
                onClick={onLogout}
                className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                title="Cerrar sesión"
              >
                <LogOut size={16} />
              </button>
            </div>
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