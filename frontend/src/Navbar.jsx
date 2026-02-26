import React from 'react';
import { LogOut, User, Menu } from 'lucide-react';

const Navbar = ({ user, onLogout }) => {
  return (
    <nav className="fixed top-0 w-full z-50 bg-[#020617]/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* LOGO */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary skew-x-[-15deg] flex items-center justify-center">
            <span className="text-black font-black italic skew-x-[15deg]">M</span>
          </div>
          <span className="text-white font-display italic text-xl tracking-tighter hidden md:block">
            MATCH TO <span className="text-primary">MATCH</span>
          </span>
        </div>

        {/* ACCIONES / USUARIO */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3 bg-slate-900/50 p-1 pr-4 rounded-full border border-slate-800">
              <img 
                src={user.picture} 
                alt="Avatar" 
                className="w-8 h-8 rounded-full border border-primary shadow-[0_0_10px_rgba(204,255,0,0.3)]"
              />
              <span className="text-slate-300 text-sm font-medium hidden sm:block">{user.name}</span>
              <button 
                onClick={onLogout}
                className="p-1 hover:text-primary transition-colors"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <div className="text-primary font-black italic text-sm">SIN CONEXIÓN</div>
          )}
          <button className="md:hidden text-white">
            <Menu size={24} />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;