import { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  FiSearch,
  FiHeart,
  FiShoppingCart,
  FiUser,
  FiSun,
  FiMoon,
  FiBookOpen,
  FiChevronDown,
  FiMenu,
  FiX,
  FiPackage,
  FiLogOut
} from 'react-icons/fi';
import { FaGraduationCap } from 'react-icons/fa';

import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { useWishlist } from '../../../context/WishlistContext';
import { useCart } from '../../../context/CartContext';
import NotificationBell from '../../notifications/NotificationBell';

const Navbar = () => {
  const { student, studentLogout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { count: wishlistCount } = useWishlist();
  const { count: cartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [navSearch, setNavSearch] = useState('');
  const menuRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close drawer on route change
  useEffect(() => {
    setMobileDrawerOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (navSearch.trim()) {
      navigate(`/products?search=${encodeURIComponent(navSearch.trim())}`);
      setSearchOpen(false);
      setNavSearch('');
    }
  };

  const handleAboutClick = (e) => {
    if (location.pathname === '/') {
      const el = document.getElementById('about-section');
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleContactClick = (e) => {
    if (location.pathname === '/') {
      const el = document.getElementById('contact-section');
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const studentFirstName = student?.name ? student.name.split(' ')[0] : 'Student';

  return (
    <header className="user-navbar modern-navbar">
      <div className="container flex items-center justify-between" style={{ height: '100%' }}>
        {/* Left: Brand Logo & Tagline */}
        <Link to="/" className="modern-navbar__brand flex items-center gap-2">
          <div className="modern-navbar__logo-icon">
            <FaGraduationCap size={20} />
          </div>
          <div className="modern-navbar__brand-text">
            <span className="modern-navbar__brand-title">CampusKart</span>
            <span className="modern-navbar__brand-tagline">Your Stationery, Your Priority</span>
          </div>
        </Link>

        {/* Center: Desktop Navigation Links */}
        <nav className="modern-navbar__nav-links">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `modern-navbar__nav-item ${isActive ? 'modern-navbar__nav-item--active' : ''}`
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/products"
            className={({ isActive }) =>
              `modern-navbar__nav-item ${isActive ? 'modern-navbar__nav-item--active' : ''}`
            }
          >
            Shop
          </NavLink>
          <NavLink
            to="/my-orders"
            className={({ isActive }) =>
              `modern-navbar__nav-item ${isActive ? 'modern-navbar__nav-item--active' : ''}`
            }
          >
            My Orders
          </NavLink>
          <NavLink
            to="/wishlist"
            className={({ isActive }) =>
              `modern-navbar__nav-item ${isActive ? 'modern-navbar__nav-item--active' : ''}`
            }
          >
            Wishlist
          </NavLink>
          <a
            href="/#about-section"
            onClick={handleAboutClick}
            className="modern-navbar__nav-item"
          >
            About
          </a>
          <a
            href="/#contact-section"
            onClick={handleContactClick}
            className="modern-navbar__nav-item"
          >
            Contact
          </a>
        </nav>

        {/* Right Actions */}
        <div className="modern-navbar__actions flex items-center gap-2">
          {/* Quick Search Toggle */}
          <div className="modern-navbar__search-wrapper">
            {searchOpen ? (
              <form onSubmit={handleSearchSubmit} className="modern-navbar__quick-search-form">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search products..."
                  value={navSearch}
                  onChange={(e) => setNavSearch(e.target.value)}
                  autoFocus
                  className="modern-navbar__quick-search-input"
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="modern-navbar__quick-search-close"
                  aria-label="Close search"
                >
                  <FiX size={15} />
                </button>
              </form>
            ) : (
              <button
                className="admin-topbar__icon-btn"
                onClick={() => setSearchOpen(true)}
                aria-label="Search"
                title="Search"
              >
                <FiSearch size={18} />
              </button>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            className="admin-topbar__icon-btn"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            {theme === 'light' ? <FiMoon size={18} /> : <FiSun size={18} />}
          </button>

          {/* Notifications */}
          <NotificationBell role="student" />

          {/* Wishlist */}
          <Link
            to="/wishlist"
            className="admin-topbar__icon-btn modern-navbar__wishlist-btn"
            style={{ position: 'relative' }}
            aria-label="Wishlist"
            title="Wishlist"
          >
            <FiHeart size={18} />
            {wishlistCount > 0 && (
              <span className="admin-topbar__bell-badge">{wishlistCount > 9 ? '9+' : wishlistCount}</span>
            )}
          </Link>

          {/* Cart with Badge */}
          <Link
            to="/cart"
            className="admin-topbar__icon-btn modern-navbar__cart-btn"
            style={{ position: 'relative' }}
            aria-label="Open shopping cart"
            title="Cart"
          >
            <FiShoppingCart size={18} />
            {cartCount > 0 && (
              <span className="admin-topbar__bell-badge">{cartCount > 9 ? '9+' : cartCount}</span>
            )}
          </Link>

          {/* Student Profile Pill */}
          <div className="admin-topbar__profile" ref={menuRef}>
            <button
              className="modern-navbar__profile-btn"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Student profile menu"
            >
              <div className="modern-navbar__avatar">
                {student?.name?.charAt(0)?.toUpperCase() || <FiUser size={14} />}
              </div>
              <span className="modern-navbar__greeting">Hello, {studentFirstName}</span>
              <FiChevronDown size={14} />
            </button>

            {menuOpen && (
              <div className="admin-topbar__dropdown modern-navbar__dropdown">
                <div className="admin-topbar__dropdown-item admin-topbar__dropdown-item--label">
                  Signed in as <strong>{student?.name}</strong>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{student?.email}</div>
                </div>
                <Link className="admin-topbar__dropdown-item" to="/profile" onClick={() => setMenuOpen(false)}>
                  <FiUser size={14} style={{ marginRight: 8 }} /> My Profile
                </Link>
                <Link className="admin-topbar__dropdown-item" to="/my-orders" onClick={() => setMenuOpen(false)}>
                  <FiPackage size={14} style={{ marginRight: 8 }} /> My Orders
                </Link>
                <Link className="admin-topbar__dropdown-item" to="/wishlist" onClick={() => setMenuOpen(false)}>
                  <FiHeart size={14} style={{ marginRight: 8 }} /> Wishlist
                </Link>
                <Link className="admin-topbar__dropdown-item" to="/notifications" onClick={() => setMenuOpen(false)}>
                  Notifications
                </Link>
                <button className="admin-topbar__dropdown-item" onClick={studentLogout} style={{ color: 'var(--color-danger)' }}>
                  <FiLogOut size={14} style={{ marginRight: 8 }} /> Logout
                </button>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            className="admin-topbar__icon-btn modern-navbar__hamburger"
            onClick={() => setMobileDrawerOpen((v) => !v)}
            aria-label="Toggle navigation menu"
          >
            {mobileDrawerOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileDrawerOpen && (
        <div className="modern-navbar__mobile-backdrop" onClick={() => setMobileDrawerOpen(false)}>
          <div className="modern-navbar__mobile-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="modern-navbar__mobile-drawer-header">
              <div className="flex items-center gap-2">
                <div className="modern-navbar__logo-icon">
                  <FaGraduationCap size={18} />
                </div>
                <span style={{ fontWeight: 800, fontSize: 'var(--font-size-base)' }}>CampusKart</span>
              </div>
              <button
                className="btn btn--icon"
                onClick={() => setMobileDrawerOpen(false)}
                aria-label="Close menu"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="modern-navbar__mobile-user-card">
              <div className="modern-navbar__avatar" style={{ width: 36, height: 36, fontSize: 16 }}>
                {student?.name?.charAt(0)?.toUpperCase() || <FiUser size={16} />}
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>{student?.name || 'Student'}</div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                  {student?.email || 'Logged in'}
                </div>
              </div>
            </div>

            <nav className="modern-navbar__mobile-nav">
              <NavLink to="/" end className={({ isActive }) => `modern-navbar__mobile-link ${isActive ? 'active' : ''}`}>
                Home
              </NavLink>
              <NavLink to="/products" className={({ isActive }) => `modern-navbar__mobile-link ${isActive ? 'active' : ''}`}>
                Shop
              </NavLink>
              <NavLink to="/my-orders" className={({ isActive }) => `modern-navbar__mobile-link ${isActive ? 'active' : ''}`}>
                My Orders
              </NavLink>
              <NavLink to="/wishlist" className={({ isActive }) => `modern-navbar__mobile-link ${isActive ? 'active' : ''}`}>
                Wishlist {wishlistCount > 0 && `(${wishlistCount})`}
              </NavLink>
              <NavLink to="/cart" className={({ isActive }) => `modern-navbar__mobile-link ${isActive ? 'active' : ''}`}>
                Cart {cartCount > 0 && `(${cartCount})`}
              </NavLink>
              <a href="/#about-section" onClick={handleAboutClick} className="modern-navbar__mobile-link">
                About
              </a>
              <a href="/#contact-section" onClick={handleContactClick} className="modern-navbar__mobile-link">
                Contact
              </a>
              <NavLink to="/profile" className={({ isActive }) => `modern-navbar__mobile-link ${isActive ? 'active' : ''}`}>
                My Profile
              </NavLink>
            </nav>

            <div style={{ marginTop: 'auto', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-border)' }}>
              <button
                className="btn btn--secondary btn--full flex items-center justify-center gap-2"
                onClick={studentLogout}
                style={{ color: 'var(--color-danger)' }}
              >
                <FiLogOut size={16} /> Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
