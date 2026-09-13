import { Link } from 'react-router-dom';
import { FiMapPin, FiPhone, FiMail } from 'react-icons/fi';

const QUICK_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Browse Products', to: '/products' },
  { label: 'My Orders', to: '/my-orders' },
  { label: 'Wishlist', to: '/wishlist' },
];

const Footer = () => (
  <footer className="user-footer">
    <div className="container">
      <div className="user-footer__grid">
        <div>
          <div style={{ fontWeight: 700, fontSize: 'var(--font-size-base)', marginBottom: 'var(--space-3)' }}>
            Campus Stationery
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', maxWidth: 280 }}>
            Your one-stop campus shop for notebooks, pens, files, and everything you need for class —
            order online for pickup or visit us in person.
          </p>
        </div>

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

        <div>
          <div style={{ fontWeight: 600, marginBottom: 'var(--space-3)' }}>Contact</div>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            <li className="flex items-center gap-2">
              <FiMapPin size={14} /> Student Center, Ground Floor
            </li>
            <li className="flex items-center gap-2">
              <a href="tel:+911234567890" style={{ color: 'inherit' }} className="flex items-center gap-2">
                <FiPhone size={14} /> +91 12345 67890
              </a>
            </li>
            <li className="flex items-center gap-2">
              <a href="mailto:shop@campusstationery.edu" style={{ color: 'inherit' }} className="flex items-center gap-2">
                <FiMail size={14} /> shop@campusstationery.edu
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="user-footer__bottom">
        © {new Date().getFullYear()} Campus Stationery. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;