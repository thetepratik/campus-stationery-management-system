import { Link } from 'react-router-dom';
import { FiMapPin, FiPhone, FiMail, FiShield, FiClock } from 'react-icons/fi';
import { FaGraduationCap } from 'react-icons/fa';
import { useShopSettings } from '../../../context/ShopSettingsContext';
import { getImageUrl } from '../../../utils/imageUrl';

const QUICK_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Shop Products', to: '/products' },
  { label: 'My Orders', to: '/my-orders' },
  { label: 'Wishlist', to: '/wishlist' },
];

const Footer = () => {
  const { settings } = useShopSettings();

  const shopName = settings?.shopName || 'CampusKart';
  const tagline = settings?.tagline || 'Your Stationery, Your Priority';
  const description = settings?.description || 'Your one-stop campus supply shop for notebooks, pens, calculators, and study essentials. Order online for quick pickup between classes.';
  const address = settings?.address || 'Student Center, Ground Floor';
  const phone = settings?.phone || '9822003344';
  const email = settings?.email || 'stationery@vit.edu';
  const hours = settings?.openingTime && settings?.closingTime ? `${settings.openingTime} - ${settings.closingTime}` : '08:30 - 18:30';
  const holiday = settings?.weeklyHoliday && settings?.weeklyHoliday !== 'None' ? `Closed on ${settings.weeklyHoliday}` : 'Open on all college days';

  return (
    <footer className="user-footer" id="contact-section">
      <div className="container">
        <div className="user-footer__grid">
          {/* Brand info */}
          <div>
            <div className="flex items-center gap-2" style={{ marginBottom: 'var(--space-2)' }}>
              {settings?.logo ? (
                <img
                  src={getImageUrl(settings.logo)}
                  alt={shopName}
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
                className="modern-navbar__logo-icon"
                style={{ width: 32, height: 32, display: settings?.logo ? 'none' : 'flex' }}
              >
                <FaGraduationCap size={16} />
              </div>
              <div style={{ fontWeight: 800, fontSize: 'var(--font-size-base)' }}>
                {shopName}
              </div>
            </div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-primary)', fontWeight: 600, marginBottom: 'var(--space-3)' }}>
              {tagline}
            </div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', maxWidth: 300, lineHeight: 1.6 }}>
              {description}
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
              <li>{settings?.collegeName ? `${settings.collegeName} Counter` : 'Campus Stationery Counter'}</li>
              <li className="flex items-center gap-1">
                <FiClock size={13} /> {hours}
              </li>
              <li style={{ color: 'var(--color-success)', fontWeight: 500 }}>● {holiday}</li>
            </ul>
          </div>

          {/* Contact info */}
          <div>
            <div style={{ fontWeight: 600, marginBottom: 'var(--space-3)' }}>Contact Us</div>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
              <li className="flex items-center gap-2">
                <FiMapPin size={14} style={{ flexShrink: 0 }} /> {address}
              </li>
              <li className="flex items-center gap-2">
                <a href={`tel:${phone}`} style={{ color: 'inherit' }} className="flex items-center gap-2">
                  <FiPhone size={14} style={{ flexShrink: 0 }} /> {phone}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <a href={`mailto:${email}`} style={{ color: 'inherit' }} className="flex items-center gap-2">
                  <FiMail size={14} style={{ flexShrink: 0 }} /> {email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="user-footer__bottom">
          © {new Date().getFullYear()} {shopName}. All rights reserved. | Built with care for campus students.
        </div>
      </div>
    </footer>
  );
};

export default Footer;