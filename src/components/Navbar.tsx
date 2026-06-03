import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Sparkles, Compass, Mail, LogIn, ChevronRight } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavClick = (e: React.MouseEvent, target: string) => {
    e.preventDefault();
    setIsOpen(false);
    navigate(target);
  };

  const menuItems = [
    { label: 'Inicio', target: '/' },
    { label: 'Explorar Negocios', target: '/explorar' },
    { label: 'Crear mi Negocio', target: '/login?register=true' },
    { label: 'Contacto', target: '/contacto' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-[#090D16]/90 backdrop-blur-md border-b border-[#151E2E] px-4 py-3.5 transition-all">
      <div className="w-full flex items-center justify-between px-1 md:px-4">
        {/* Brand Logo */}
        <Link 
          to="/" 
          className="flex items-center gap-2 group"
          onClick={(e) => handleNavClick(e, '/')}
        >
          <div className="h-8 w-8 bg-orange-500/10 border border-orange-500/30 rounded-lg flex items-center justify-center text-orange-500 group-hover:bg-orange-500/20 transition">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
          <span className="font-black text-white text-lg tracking-wider uppercase">
            ReserveFlow<span className="text-orange-500">.</span>
          </span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">
          {menuItems.map((item) => (
            <a
              key={item.label}
              href={item.target}
              onClick={(e) => handleNavClick(e, item.target)}
              className="text-xs font-black uppercase tracking-wider text-gray-400 hover:text-white transition"
            >
              {item.label}
            </a>
          ))}
          <div className="h-4 w-px bg-[#151E2E]"></div>
          <Link
            to="/login"
            className="flex items-center gap-1.5 px-4 py-2 bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500 hover:text-white rounded-xl text-xs font-black uppercase transition shadow-md shadow-orange-500/5"
          >
            <LogIn className="h-3.5 w-3.5" />
            Acceder
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-1.5 bg-[#0F172A] border border-[#1E293B] rounded-lg text-gray-400 hover:text-white transition focus:outline-none"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="md:hidden border-t border-[#151E2E] mt-3.5 pt-4 pb-2 space-y-3 animate-opacity">
          {menuItems.map((item) => (
            <a
              key={item.label}
              href={item.target}
              onClick={(e) => handleNavClick(e, item.target)}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#0F172A] text-xs font-black uppercase tracking-wider text-gray-400 hover:text-white transition"
            >
              <span>{item.label}</span>
              <ChevronRight className="h-4 w-4 text-gray-600" />
            </a>
          ))}
          <div className="border-t border-[#151E2E] pt-3 px-3">
            <Link
              to="/login"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center justify-center gap-1.5 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-xs font-black uppercase transition shadow-md shadow-orange-500/15"
            >
              <LogIn className="h-4 w-4" />
              Acceder al Panel
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
