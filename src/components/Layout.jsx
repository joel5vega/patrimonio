import { Outlet, NavLink } from 'react-router-dom';
import {
  Home,
  PieChart,
  Repeat,
  TrendingUp,
  PiggyBank,
  Wallet,
  BarChart2,
} from 'lucide-react';
import './Layout.css';

const navItems = [
  { to: '/', icon: <Home size={20} />, label: 'Dashboard' },
  { to: '/portfolio', icon: <PieChart size={20} />, label: 'Portafolio' },
  { to: '/history', icon: <TrendingUp size={20} />, label: 'Historial' },
  { to: '/manual', icon: <PiggyBank size={20} />, label: 'Manual' },
  { to: '/transactions', icon: <Repeat size={20} />, label: 'Movimientos' },
  { to: '/analytics', icon: <BarChart2 size={20} />, label: 'Analytics' },
  { to: '/budget', icon: <Wallet size={20} />, label: 'Presupuesto' },
];

const Layout = () => {
  return (
    <div className="app-shell">
      <aside className="app-sidebar desktop-only">
        <div className="app-sidebar__brand">
          <p className="app-sidebar__eyebrow">Membresía</p>
          <h1 className="app-sidebar__title">Panel financiero</h1>
        </div>

        <nav className="app-sidebar__nav" aria-label="Navegación principal">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `app-navlink ${isActive ? 'is-active' : ''}`}
            >
              <span className="app-navlink__icon">{item.icon}</span>
              <span className="app-navlink__label">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="app-main-wrap">
        <header className="app-topbar desktop-only">
          <div>
            <p className="app-topbar__eyebrow">Resumen</p>
            <p className="app-topbar__title">Tu espacio de control</p>
          </div>
        </header>

        <main className="app-main">
          <div className="app-content">
            <Outlet />
          </div>
        </main>
      </div>

      <nav className="app-bottomnav mobile-only" aria-label="Navegación móvil">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `app-bottomnav__link ${isActive ? 'is-active' : ''}`}
          >
            <span className="app-bottomnav__icon">{item.icon}</span>
            <span className="app-bottomnav__label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Layout;