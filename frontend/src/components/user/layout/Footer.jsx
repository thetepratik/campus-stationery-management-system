import { Link } from 'react-router-dom';
import { FiMapPin, FiPhone, FiMail, FiShield } from 'react-icons/fi';
import { FaGraduationCap } from 'react-icons/fa';

const QUICK_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Shop Products', to: '/products' },
  { label: 'My Orders', to: '/my-orders' },
  { label: 'Wishlist', to: '/wishlist' },
];

const Footer = () => (
  <footer className="user-footer" id="contact-section">
    <div className="container">
      <div className="user-footer__grid">
        {/* Brand info */}
        <div>
          <div className="flex items-center gap-2" style={{ marginBottom: 'var(--space-2)' }}>
            <div className="modern-navbar__logo-icon" style={{ width: 32, height: 32 }}>
              <FaGraduationCap size={16} />
            </div>
            <div style={{ fontWeight: 800, fontSize: 'var(--font-size-base)' }}>
              CampusKart
            </div>
          </div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-primary)', fontWeight: 600, marginBottom: 'var(--space-3)' }}>
            Your Stationery, Your Priority
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', maxWidth: 300, lineHeight: 1.6 }}>
            Your one-stop campus supply shop for notebooks, pens, calculators, and study essentials.
            Order online for quick pickup between classes.
          </p>
          <div className="flex items-center gap-2" style={{ marginTop: 'var(--space-4)', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>
            <FiShield size={14} color="var(--color-primary)" />
            <span>Secure online payments powered by <strong>Razorpay</strong></span>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <div style={{ fontWeight: 600, marginBottom: 'var(--space-3)' }}>Quick Links</div>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--font-size-sm)' }}>
            {QUICK_LINKS.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  style={{ color: 'var(--color-text-secondary)', transition: 'color var(--transition-fast)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-primary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Support & Hours */}
        <div>
          <div style={{ fontWeight: 600, marginBottom: 'var(--space-3)' }}>Support & Shop</div>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            <li>Campus Stationery Counter</li>
            <li>Mon - Sat: 8:30 AM - 6:00 PM</li>
            <li style={{ color: 'var(--color-success)', fontWeight: 500 }}>● Open on College Days</li>
          </ul>
        </div>

        {/* Contact info */}
        <div>
          <div style={{ fontWeight: 600, marginBottom: 'var(--space-3)' }}>Contact Us</div>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            <li className="flex items-center gap-2">
              <FiMapPin size={14} style={{ flexShrink: 0 }} /> Student Center, Ground Floor
            </li>
            <li className="flex items-center gap-2">
              <a href="tel:+911234567890" style={{ color: 'inherit' }} className="flex items-center gap-2">
                <FiPhone size={14} style={{ flexShrink: 0 }} /> +91 12345 67890
              </a>
            </li>
            <li className="flex items-center gap-2">
              <a href="mailto:shop@campusstationery.edu" style={{ color: 'inherit' }} className="flex items-center gap-2">
                <FiMail size={14} style={{ flexShrink: 0 }} /> shop@campusstationery.edu
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="user-footer__bottom">
        © {new Date().getFullYear()} CampusKart. All rights reserved. | Built with care for campus students.
      </div>
    </div>
  </footer>
);

export default Footer;