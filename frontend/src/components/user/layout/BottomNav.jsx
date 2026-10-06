import { NavLink } from 'react-router-dom';
import { FiHome, FiGrid, FiShoppingCart, FiList, FiUser } from 'react-icons/fi';
import { useCart } from '../../../context/CartContext';

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: FiHome, end: true },
  { to: '/products', label: 'Shop', icon: FiGrid },
  { to: '/cart', label: 'Cart', icon: FiShoppingCart, hasBadge: true },
  { to: '/my-orders', label: 'Orders', icon: FiList },
  { to: '/profile', label: 'Profile', icon: FiUser },
];

const BottomNav = () => {
  const { count: cartCount } = useCart();

  return (
    <nav className="user-bottom-nav" aria-label="Mobile navigation">
      {NAV_ITEMS.map(({ to, label, icon: Icon, end, hasBadge }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `user-bottom-nav__link ${isActive ? 'active' : ''}`
          }
        >
          <div className="user-bottom-nav__icon-wrap">
            <Icon size={20} className="user-bottom-nav__icon" />
            {hasBadge && cartCount > 0 && (
              <span className="user-bottom-nav__badge" aria-label={`${cartCount} items in cart`}>
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </div>
          <span className="user-bottom-nav__label">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNav;
