import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiSearch, FiHeart, FiShoppingCart, FiUser, FiSun, FiMoon, FiBookOpen, FiChevronDown } from 'react-icons/fi';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { useWishlist } from '../../../context/WishlistContext';
import { useCart } from '../../../context/CartContext';
import NotificationBell from '../../notifications/NotificationBell';

const Navbar = () => {
  const { student, studentLogout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { count } = useWishlist();
  const { count: cartCount } = useCart();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    navigate(`/products?search=${encodeURIComponent(search)}`);
  };

  return (
    <header className="user-navbar">
      <div className="container flex items-center justify-between" style={{ height: '100%' }}>
        <Link to="/" className="flex items-center gap-2">
          <div className="auth-brand__icon" style={{ width: 34, height: 34 }}>
            <FiBookOpen size={16} />
          </div>
          <span style={{ fontWeight: 700, fontSize: 'var(--font-size-base)' }}>Campus Stationery</span>
        </Link>

        <form onSubmit={handleSearchSubmit} className="user-navbar__search">
          <FiSearch size={16} />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        <div className="flex items-center gap-2">
          <button className="admin-topbar__icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'light' ? <FiMoon size={18} /> : <FiSun size={18} />}
          </button>
          <NotificationBell role="student" />
          <Link to="/wishlist" className="admin-topbar__icon-btn" style={{ position: 'relative' }}>
            <FiHeart size={18} />
            {count > 0 && <span className="admin-topbar__bell-badge">{count > 9 ? '9+' : count}</span>}
          </Link>
          <Link to="/cart" className="admin-topbar__icon-btn" style={{ position: 'relative' }}>
            <FiShoppingCart size={18} />
            {cartCount > 0 && <span className="admin-topbar__bell-badge">{cartCount > 9 ? '9+' : cartCount}</span>}
          </Link>

          <div className="admin-topbar__profile" ref={menuRef}>
            <button className="admin-topbar__profile-btn" onClick={() => setMenuOpen((v) => !v)}>
              <div className="admin-topbar__avatar">{student?.name?.charAt(0)?.toUpperCase() || <FiUser size={14} />}</div>
              <FiChevronDown size={14} />
            </button>
            {menuOpen && (
              <div className="admin-topbar__dropdown">
                <div className="admin-topbar__dropdown-item admin-topbar__dropdown-item--label">
                  Signed in as <strong>{student?.name}</strong>
                </div>
                <Link className="admin-topbar__dropdown-item" to="/profile" onClick={() => setMenuOpen(false)}>
                  My Profile
                </Link>
                <Link className="admin-topbar__dropdown-item" to="/my-orders" onClick={() => setMenuOpen(false)}>
                  My Orders
                </Link>
                <Link className="admin-topbar__dropdown-item" to="/notifications" onClick={() => setMenuOpen(false)}>
                  Notifications
                </Link>
                <button className="admin-topbar__dropdown-item" onClick={studentLogout}>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};


export default Navbar;
