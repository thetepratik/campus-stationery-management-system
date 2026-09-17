import { NavLink } from 'react-router-dom';
import { FiHome, FiGrid, FiShoppingCart, FiList, FiUser } from 'react-icons/fi';

const ITEMS = [
  { to: '/', label: 'Home', icon: FiHome, end: true },
  { to: '/products', label: 'Shop', icon: FiGrid },
  { to: '/cart', label: 'Cart', icon: FiShoppingCart },
  { to: '/my-orders', label: 'Orders', icon: FiList },
  { to: '/profile', label: 'Profile', icon: FiUser },
];

const BottomNav = () => (
  <nav className="user-bottom-nav">
    {ITEMS.map(({ to, label, icon: Icon, end }) => (
      <NavLink key={to} to={to} end={end} className={({ isActive }) => `user-bottom-nav__link ${isActive ? 'active' : ''}`}>
        <Icon size={20} />
        <span>{label}</span>
      </NavLink>
    ))}
  </nav>
);

export default BottomNav;
