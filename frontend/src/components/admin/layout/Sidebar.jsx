import { NavLink } from 'react-router-dom';
import {
  FiGrid,
  FiBox,
  FiLayers,
  FiShoppingBag,
  FiGlobe,
  FiClock,
  FiFileText,
  FiUsers,
  FiBell,
  FiSettings,
  FiLogOut,
  FiBookOpen,
} from 'react-icons/fi';
import { useAuth } from '../../../context/AuthContext';

const NAV_ITEMS = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: FiGrid, end: true },
  { to: '/admin/products', label: 'Products', icon: FiBox },
  { to: '/admin/inventory', label: 'Inventory', icon: FiLayers },
  { to: '/admin/offline-sales', label: 'Offline Sales', icon: FiShoppingBag },
  { to: '/admin/online-orders', label: 'Online Orders', icon: FiGlobe },
  { to: '/admin/sales-history', label: 'Sales History', icon: FiClock },
  { to: '/admin/reports', label: 'Reports', icon: FiFileText },
  { to: '/admin/customers', label: 'Customers', icon: FiUsers },
  { to: '/admin/notifications', label: 'Notifications', icon: FiBell },
  { to: '/admin/settings', label: 'Settings', icon: FiSettings },
];

const Sidebar = ({ collapsed, mobileOpen, onCloseMobile }) => {
  const { adminLogout } = useAuth();

  return (
    <>
      {mobileOpen && <div className="sidebar-backdrop" onClick={onCloseMobile} />}
      <aside className={`admin-sidebar ${collapsed ? 'admin-sidebar--collapsed' : ''} ${mobileOpen ? 'admin-sidebar--mobile-open' : ''}`}>
        <div className="admin-sidebar__brand">
          <div className="admin-sidebar__brand-icon">
            <FiBookOpen />
          </div>
          {!collapsed && (
            <div>
              <div className="admin-sidebar__brand-title">Campus Stationery</div>
              <div className="admin-sidebar__brand-subtitle">Admin Panel</div>
            </div>
          )}
        </div>

        <nav className="admin-sidebar__nav">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onCloseMobile}
              className={({ isActive }) => `admin-sidebar__link ${isActive ? 'active' : ''}`}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        <button className="admin-sidebar__logout" onClick={adminLogout} title="Logout">
          <FiLogOut size={18} />
          {!collapsed && <span>Logout</span>}
        </button>
      </aside>
    </>
  );
};

export default Sidebar;
