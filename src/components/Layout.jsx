import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import {
  Home, PieChart, Repeat, TrendingUp,
  PiggyBank, Wallet, BarChart2, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';
import './Layout.css';

const navItems = [
  { to: '/',             icon: <Home size={20} />,     label: 'Dashboard'   },
  { to: '/portfolio',    icon: <PieChart size={20} />, label: 'Portafolio'  },
  { to: '/history',      icon: <TrendingUp size={20} />,label: 'Historial'  },
  { to: '/manual',       icon: <PiggyBank size={20} />, label: 'Manual'     },
  { to: '/transactions', icon: <Repeat size={20} />,   label: 'Movimientos' },
  { to: '/analytics',    icon: <BarChart2 size={20} />, label: 'Analytics'  },
  { to: '/budget',       icon: <Wallet size={20} />,   label: 'Presupuesto' },
];

const Layout = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`app-shell${collapsed ? ' sidebar-collapsed' : ''}`}>
      <aside className="app-sidebar desktop-only">
        <div className="app-sidebar__brand">
          {!collapsed && (
            <>
              <p className="app-sidebar__eyebrow">Membresía</p>
            </>
          )}
          <button
            className="app-sidebar__toggle"
            onClick={() => setCollapsed(c => !c)}
            aria-label={collapsed ? 'Expandir panel' : 'Colapsar panel'}
            title={collapsed ? 'Expandir panel' : 'Colapsar panel'}
          >
            {collapsed
              ? <PanelLeftOpen  size={18} />
              : <PanelLeftClose size={18} />}
          </button>
        </div>

        <nav className="app-sidebar__nav" aria-label="Navegación principal">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `app-navlink ${isActive ? 'is-active' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <span className="app-navlink__icon">{item.icon}</span>
              {!collapsed && (
                <span className="app-navlink__label">{item.label}</span>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="app-main-wrap">
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
            className={({ isActive }) =>
              `app-bottomnav__link ${isActive ? 'is-active' : ''}`
            }
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
