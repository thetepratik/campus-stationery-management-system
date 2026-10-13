import { FiBookOpen } from 'react-icons/fi';
import { useShopSettings } from '../../context/ShopSettingsContext';
import { getImageUrl } from '../../utils/imageUrl';

const AuthLayout = ({ children, subtitle = null }) => {
  const { settings } = useShopSettings();
  const shopName = settings?.shopName || 'Campus Stationery';
  const tagline = subtitle || settings?.tagline || 'Inventory & Sales Management';

  return (
    <div className="auth-page">
      <div className="auth-card card card--glass">
        <div className="auth-brand">
          {settings?.logo ? (
            <img
              src={getImageUrl(settings.logo)}
              alt={shopName}
              style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', objectFit: 'contain' }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.nextElementSibling) {
                  e.currentTarget.nextElementSibling.style.display = 'flex';
                }
              }}
            />
          ) : null}
          <div
            className="auth-brand__icon"
            style={{ display: settings?.logo ? 'none' : 'flex' }}
          >
            <FiBookOpen />
          </div>
          <div>
            <div className="auth-brand__title">{shopName}</div>
            <div className="auth-brand__subtitle">{tagline}</div>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
