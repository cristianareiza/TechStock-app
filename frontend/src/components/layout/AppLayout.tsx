import { useState, type ReactNode } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Icon, type IconName } from '../ui/Icon';

interface NavItem {
  to: string;
  label: string;
  icon: IconName;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Panel', icon: 'grid' },
  { to: '/productos', label: 'Productos', icon: 'box' },
  { to: '/usuarios', label: 'Usuarios', icon: 'users', adminOnly: true },
];

export function Logo() {
  return (
    <div className="logo">
      <span className="logo__mark" aria-hidden="true">
        <Icon name="box" size={18} />
      </span>
      <span className="logo__text">
        Tech<strong>Stock</strong>
      </span>
    </div>
  );
}

export function AppLayout() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // cerrar el menú al cambiar de página
  const [prevPath, setPrevPath] = useState(location.pathname);
  if (prevPath !== location.pathname) {
    setPrevPath(location.pathname);
    setMenuOpen(false);
  }

  if (!user) return null;
  const items = NAV_ITEMS.filter((item) => !item.adminOnly || user.isAdmin);

  return (
    <div className="shell">
      <aside className={`sidebar ${menuOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar__top">
          <Logo />
          <button
            className="icon-btn sidebar__toggle"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuOpen}
          >
            <Icon name={menuOpen ? 'x' : 'menu'} />
          </button>
        </div>

        <nav className="sidebar__nav" aria-label="Navegación principal">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'nav-link--active' : ''}`}
            >
              <Icon name={item.icon} size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__user">
          <span className="avatar" aria-hidden="true">
            {user.initials}
          </span>
          <div className="sidebar__user-info">
            <strong>{user.name}</strong>
            <span>{user.roleLabel}</span>
          </div>
          <button className="icon-btn" onClick={logout} aria-label="Cerrar sesión" title="Cerrar sesión">
            <Icon name="logout" size={18} />
          </button>
        </div>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </header>
  );
}
