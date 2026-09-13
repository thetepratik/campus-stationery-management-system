import { useState } from 'react';
import { FiUser, FiShoppingBag } from 'react-icons/fi';

import AdminProfile from '../../components/admin/settings/AdminProfile';
import ShopInformation from '../../components/admin/settings/ShopInformation';

const SETTINGS_TABS = [
  {
    id: 'profile',
    label: 'Admin Profile',
    icon: FiUser,
    description: 'Personal account details & password',
  },
  {
    id: 'shop',
    label: 'Shop Information',
    icon: FiShoppingBag,
    description: 'Shop profile, operating hours & logo',
  },
];

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1
          style={{
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            margin: '0 0 4px 0',
          }}
        >
          Settings
        </h1>
        <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: 'var(--font-size-sm)' }}>
          Manage your account and stationery shop information.
        </p>
      </div>

      {/* Two-Column Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '260px 1fr',
          gap: 'var(--space-6)',
          alignItems: 'start',
        }}
        className="settings-layout-grid"
      >
        {/* Left Navigation Card */}
        <div className="card panel" style={{ padding: 'var(--space-3)' }}>
          <div
            style={{
              fontSize: 'var(--font-size-xs)',
              fontWeight: 600,
              textTransform: 'uppercase',
              color: 'var(--color-text-muted)',
              padding: 'var(--space-2) var(--space-3)',
              marginBottom: 4,
            }}
          >
            Preferences
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {SETTINGS_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  id={`settings-tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    padding: '0.65rem var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    background: isActive ? 'var(--color-primary-light)' : 'transparent',
                    color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: 'var(--font-size-sm)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                    width: '100%',
                  }}
                  className="settings-nav-btn"
                >
                  <Icon size={18} style={{ flexShrink: 0 }} />
                  <div>
                    <div>{tab.label}</div>
                    <div
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 400,
                        color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        marginTop: 1,
                      }}
                    >
                      {tab.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Content Panel */}
        <div>
          {activeTab === 'profile' && <AdminProfile />}
          {activeTab === 'shop' && <ShopInformation />}
        </div>
      </div>
    </div>
  );
};

export default Settings;
