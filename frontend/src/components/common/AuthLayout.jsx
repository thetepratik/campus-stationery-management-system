import { FiBookOpen } from 'react-icons/fi';

const AuthLayout = ({ children, subtitle = 'Inventory & Sales Management' }) => {
  return (
    <div className="auth-page">
      <div className="auth-card card card--glass">
        <div className="auth-brand">
          <div className="auth-brand__icon">
            <FiBookOpen />
          </div>
          <div>
            <div className="auth-brand__title">Campus Stationery</div>
            <div className="auth-brand__subtitle">{subtitle}</div>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
