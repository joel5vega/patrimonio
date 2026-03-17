import { Outlet, NavLink } from 'react-router-dom';
import { Home, PieChart, Repeat, TrendingUp, Wallet ,BarChart2 } from 'lucide-react';

const Layout = () => {
  const navItems = [
    { to: '/',          icon: <Home size={20} />,      label: 'Dashboard'  },
    { to: '/portfolio', icon: <PieChart size={20} />,  label: 'Portafolio' },
    { to: '/history',   icon: <TrendingUp size={20} />, label: 'Historial' },
    { to: '/manual',    icon: <Wallet size={20} />,    label: 'Manual'     },
    { to: '/transactions', icon: <Repeat size={20} />, label: 'Movimientos'},
    { to: '/analytics', icon: <BarChart2 size={20} />, label: 'Analytics'},
  ];

  return (
    <div className="min-h-screen bg-brand-dark pb-24 text-white max-w-lg mx-auto">
      <main className="p-4">
        <Outlet />
      </main>
      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-brand-card border-t border-white/5 flex justify-around px-2 py-3 backdrop-blur-lg z-50">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-2 ${isActive ? 'text-brand-teal' : 'text-white/40'}`
            }
          >
            {item.icon}
            <span className="text-[9px] font-semibold">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Layout;
