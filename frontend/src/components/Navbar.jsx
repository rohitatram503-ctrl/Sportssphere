import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import NotificationDropdown from './NotificationDropdown';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const NavLink = ({ to, children, icon }) => (
    <Link
      to={to}
      className={`px-4 py-2.5 rounded-xl transition-all duration-300 font-bold text-sm flex items-center gap-2 uppercase tracking-wide
        ${isActive(to)
          ? 'bg-[#0ea5e9] text-white shadow-[0_4px_14px_0_rgba(14,165,233,0.39)]'
          : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
    >
      {icon}
      {children}
    </Link>
  );

  return (
    <nav className="sticky top-0 z-50 bg-[#0f172a] border-b border-slate-800 shadow-xl">
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-center h-20">
          <Link to="/dashboard" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-lg bg-[#f97316] flex items-center justify-center shadow-[0_4px_14px_0_rgba(249,115,22,0.39)] group-hover:-translate-y-1 transition-transform duration-300">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-white text-2xl font-black tracking-tighter uppercase italic">
              Sports<span className="text-[#0ea5e9]">Sphere</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-1">
            {token ? (
              <>
                <NavLink to="/dashboard" icon={<span>📊</span>}>Dashboard</NavLink>
                <NavLink to="/events" icon={<span>🏆</span>}>Events</NavLink>
                {role === 'Athlete' && (
                  <>
                    <NavLink to="/profile" icon={<span>👤</span>}>Profile</NavLink>
                    <NavLink to="/teams" icon={<span>🛡️</span>}>Teams</NavLink>
                  </>
                )}
                {role === 'Admin' && (
                  <NavLink to="/admin" icon={<span>⚙️</span>}>Admin Panel</NavLink>
                )}
                {role === 'Organizer' && (
                  <NavLink to="/performance" icon={<span>📈</span>}>Update Performance</NavLink>
                )}

                <div className="flex items-center space-x-2 pl-4 ml-4 border-l border-slate-700">
                  <NotificationDropdown />
                  <button
                    onClick={handleLogout}
                    className="ml-2 bg-slate-800 hover:bg-[#f43f5e] text-white px-5 py-2.5 rounded-xl font-bold text-sm uppercase tracking-wide transition-all duration-300 hover:shadow-[0_4px_14px_0_rgba(244,63,94,0.39)]"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/login" className="text-slate-300 hover:text-white font-bold uppercase text-sm tracking-wide transition-all">Sign In</Link>
                <Link to="/register" className="bg-[#f97316] text-white hover:bg-[#ea580c] px-6 py-2.5 rounded-xl font-black uppercase text-sm tracking-wide shadow-[0_4px_14px_0_rgba(249,115,22,0.39)] hover:-translate-y-0.5 transition-all">
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
