import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Users, PenTool as Tool, LogOut, UserCog, Monitor, FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/logo-groupe-le-parc.png';

const Navbar = () => {
  const { signOut } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    { path: '/devices', icon: Monitor, label: 'Appareils' },
    { path: '/clients', icon: Users, label: 'Clients' },
    { path: '/interventions', icon: Tool, label: 'Interventions' },
    { path: '/operators', icon: UserCog, label: 'Opérateurs' },
    { path: '/quotes-invoices', icon: FileText, label: 'Devis & Factures' },
  ];

  return (
    <nav className="sidebar fixed h-full w-64 flex flex-col py-6">
      <div className="px-6 mb-8">
        <Link to="/" className="flex items-center justify-center">
          <img 
            src={logo} 
            alt="GROUPE LE PARC" 
            className="w-48 h-auto object-contain"
          />
        </Link>
      </div>
      
      <div className="flex-1 px-4">
        <div className="space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive(item.path)
                  ? 'bg-green-600 text-white'
                  : 'text-gray-300 hover:bg-green-600/20 hover:text-white'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="px-4 mt-auto">
        <button
          onClick={signOut}
          className="flex items-center space-x-3 px-4 py-3 w-full rounded-lg text-red-400 hover:bg-red-500/20 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span>Déconnexion</span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;