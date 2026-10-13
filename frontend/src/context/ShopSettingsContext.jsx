import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { settingsApi } from '../services/settingsApi';

const DEFAULT_SHOP_SETTINGS = {
  shopName: 'Campus Stationery Hub',
  tagline: 'Your Stationery, Your Priority',
  description: 'Your one-stop campus supply shop for notebooks, pens, calculators, and study essentials.',
  collegeName: 'Vishwakarma Institute of Technology',
  address: 'Survey No. 666, Upper Indira Nagar, Bibwewadi, Pune, Maharashtra 411037',
  phone: '9822003344',
  email: 'stationery@vit.edu',
  logo: '',
  openingTime: '08:30',
  closingTime: '18:30',
  weeklyHoliday: 'Sunday',
};

const ShopSettingsContext = createContext({
  settings: DEFAULT_SHOP_SETTINGS,
  loading: false,
  error: null,
  updateSettings: () => {},
  refreshSettings: () => {},
});

export const ShopSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULT_SHOP_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await settingsApi.getShopInformation();
      if (res && res.data && res.data.settings) {
        setSettings((prev) => ({
          ...prev,
          ...res.data.settings,
        }));
      }
      setError(null);
    } catch (err) {
      console.warn('[ShopSettingsContext] Could not fetch shop settings:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = useCallback((newSettings) => {
    if (!newSettings) return;
    setSettings((prev) => ({
      ...prev,
      ...newSettings,
    }));
  }, []);

  return (
    <ShopSettingsContext.Provider
      value={{
        settings,
        loading,
        error,
        updateSettings,
        refreshSettings: fetchSettings,
      }}
    >
      {children}
    </ShopSettingsContext.Provider>
  );
};

export const useShopSettings = () => {
  const context = useContext(ShopSettingsContext);
  if (!context) {
    throw new Error('useShopSettings must be used within a ShopSettingsProvider');
  }
  return context;
};

export default ShopSettingsContext;
