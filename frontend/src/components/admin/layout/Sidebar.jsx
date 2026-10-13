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
import { useShopSettings } from '../../../context/ShopSettingsContext';
import { getImageUrl } from '../../../utils/imageUrl';

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
  const { settings: shopSettings } = useShopSettings();

  return (
    <>
      {mobileOpen && <div className="sidebar-backdrop" onClick={onCloseMobile} />}
      <aside className={`admin-sidebar ${collapsed ? 'admin-sidebar--collapsed' : ''} ${mobileOpen ? 'admin-sidebar--mobile-open' : ''}`}>
        <div className="admin-sidebar__brand">
          {shopSettings?.logo ? (
            <img
              src={getImageUrl(shopSettings.logo)}
              alt={shopSettings.shopName || 'Shop Logo'}
              style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', objectFit: 'contain' }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.nextElementSibling) {
                  e.currentTarget.nextElementSibling.style.display = 'flex';
                }
              }}
            />
          ) : null}
          <div
            className="admin-sidebar__brand-icon"
            style={{ display: shopSettings?.logo ? 'none' : 'flex' }}
          >
            <FiBookOpen />
          </div>
          {!collapsed && (
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <div
                className="admin-sidebar__brand-title"
                style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                title={shopSettings?.shopName || 'Campus Stationery'}
              >
                {shopSettings?.shopName || 'Campus Stationery'}
              </div>
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
