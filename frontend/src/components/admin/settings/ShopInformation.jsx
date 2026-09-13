import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import {
  FiShoppingBag,
  FiHome,
  FiMapPin,
  FiPhone,
  FiMail,
  FiClock,
  FiCalendar,
  FiCamera,
  FiTrash2,
  FiSave,
} from 'react-icons/fi';

import { settingsApi } from '../../../services/settingsApi';

const WEEKLY_HOLIDAY_OPTIONS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'None',
];

const ShopInformation = () => {
  const fileInputRef = useRef(null);

  // Shop data state
  const [shop, setShop] = useState({
    shopName: '',
    collegeName: '',
    address: '',
    phone: '',
    email: '',
    logo: '',
    openingTime: '09:00',
    closingTime: '18:00',
    weeklyHoliday: 'Sunday',
  });
  const [initialShop, setInitialShop] = useState(null);

  // Logo file upload state
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');

  // Loading & saving states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch shop information
  const fetchShopInfo = async () => {
    setLoading(true);
    try {
      const res = await settingsApi.getShopInformation();
      const s = res.data.settings || {};
      const loaded = {
        shopName: s.shopName || '',
        collegeName: s.collegeName || '',
        address: s.address || '',
        phone: s.phone || '',
        email: s.email || '',
        logo: s.logo || '',
        openingTime: s.openingTime || '09:00',
        closingTime: s.closingTime || '18:00',
        weeklyHoliday: s.weeklyHoliday || 'Sunday',
      };
      setShop(loaded);
      setInitialShop(loaded);
      setLogoPreview(loaded.logo);
      setLogoFile(null);
    } catch (err) {
      toast.error(err.message || 'Failed to load shop information.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShopInfo();
  }, []);

  // Handle Logo Selection
  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      toast.error('Only JPG, JPEG, PNG, and WEBP images are allowed.');
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logo file size must be under 5MB.');
      return;
    }

    setLogoFile(file);
    const previewUrl = URL.createObjectURL(file);
    setLogoPreview(previewUrl);
  };

  // Handle Logo Removal
  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview('');
    setShop((prev) => ({ ...prev, logo: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Save Shop Information
  const handleSave = async (e) => {
    e.preventDefault();

    const shopName = shop.shopName.trim();
    if (!shopName) {
      toast.error('Shop name is required.');
      return;
    }

    const email = shop.email.trim();
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      toast.error('Please enter a valid shop email address.');
      return;
    }

    const phone = shop.phone.trim();
    if (phone && !/^[0-9+\s\-]{7,15}$/.test(phone)) {
      toast.error('Please enter a valid phone number.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        shopName,
        collegeName: shop.collegeName.trim(),
        address: shop.address.trim(),
        phone,
        email,
        openingTime: shop.openingTime.trim(),
        closingTime: shop.closingTime.trim(),
        weeklyHoliday: shop.weeklyHoliday,
      };

      if (!logoFile && logoPreview === '') {
        payload.logo = '';
      }

      const res = await settingsApi.updateShopInformation(payload, logoFile);
      const updated = res.data.settings;

      toast.success('Shop information updated successfully.');

      setShop({
        shopName: updated.shopName || '',
        collegeName: updated.collegeName || '',
        address: updated.address || '',
        phone: updated.phone || '',
        email: updated.email || '',
        logo: updated.logo || '',
        openingTime: updated.openingTime || '09:00',
        closingTime: updated.closingTime || '18:00',
        weeklyHoliday: updated.weeklyHoliday || 'Sunday',
      });
      setInitialShop({
        shopName: updated.shopName || '',
        collegeName: updated.collegeName || '',
        address: updated.address || '',
        phone: updated.phone || '',
        email: updated.email || '',
        logo: updated.logo || '',
        openingTime: updated.openingTime || '09:00',
        closingTime: updated.closingTime || '18:00',
        weeklyHoliday: updated.weeklyHoliday || 'Sunday',
      });
      setLogoPreview(updated.logo || '');
      setLogoFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      toast.error(err.message || 'Failed to update shop information.');
    } finally {
      setSaving(false);
    }
  };

  // Cancel Changes
  const handleCancel = () => {
    if (initialShop) {
      setShop(initialShop);
      setLogoPreview(initialShop.logo);
      setLogoFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const hasChanges =
    initialShop &&
    (shop.shopName !== initialShop.shopName ||
      shop.collegeName !== initialShop.collegeName ||
      shop.address !== initialShop.address ||
      shop.phone !== initialShop.phone ||
      shop.email !== initialShop.email ||
      shop.openingTime !== initialShop.openingTime ||
      shop.closingTime !== initialShop.closingTime ||
      shop.weeklyHoliday !== initialShop.weeklyHoliday ||
      logoFile !== null ||
      logoPreview !== initialShop.logo);

  if (loading) {
    return (
      <div>
        <Skeleton height={200} style={{ borderRadius: 8, marginBottom: 16 }} />
        <Skeleton height={320} style={{ borderRadius: 8 }} />
      </div>
    );
  }

  return (
    <div className="card panel">
      <div className="panel__header">
        <div>
          <span className="panel__title">Shop Information</span>
          <p
            style={{
              margin: '2px 0 0',
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-muted)',
            }}
          >
            Configure your stationery shop profile, location, operating hours, and branding.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} noValidate>
        {/* Shop Logo Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-5)',
            padding: 'var(--space-4) 0 var(--space-5) 0',
            borderBottom: '1px solid var(--color-border)',
            marginBottom: 'var(--space-5)',
            flexWrap: 'wrap',
          }}
        >
          {/* Logo Display */}
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-bg)',
              border: '2px dashed var(--color-border-strong)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            {logoPreview ? (
              <img
                src={logoPreview}
                alt="Shop Logo"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            ) : (
              <FiShoppingBag size={28} style={{ color: 'var(--color-text-muted)' }} />
            )}
          </div>

          {/* Logo Actions */}
          <div>
            <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: 4 }}>
              Shop Logo
            </div>
            <div
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-muted)',
                marginBottom: 'var(--space-3)',
              }}
            >
              Displayed on invoices, order receipts, and shop banner. Max 5MB.
            </div>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                style={{ display: 'none' }}
                onChange={handleLogoChange}
                id="shop-logo-file-input"
              />
              <button
                type="button"
                id="upload-shop-logo-btn"
                className="btn btn--outline btn--sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                onClick={() => fileInputRef.current?.click()}
              >
                <FiCamera size={14} /> {logoPreview ? 'Change Logo' : 'Upload Logo'}
              </button>
              {logoPreview && (
                <button
                  type="button"
                  id="remove-shop-logo-btn"
                  className="btn btn--ghost btn--sm"
                  style={{
                    color: 'var(--color-danger)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                  onClick={handleRemoveLogo}
                >
                  <FiTrash2 size={14} /> Remove
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Form Fields Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'var(--space-4)',
            marginBottom: 'var(--space-4)',
          }}
        >
          {/* Shop Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="shop-name-input">
              Shop Name <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="shop-name-input"
                type="text"
                className="form-input"
                placeholder="e.g. College Stationery Shop"
                value={shop.shopName}
                onChange={(e) => setShop({ ...shop, shopName: e.target.value })}
                style={{ width: '100%', paddingLeft: 34 }}
                required
              />
              <FiShoppingBag
                size={15}
                style={{
                  position: 'absolute',
                  left: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-text-muted)',
                }}
              />
            </div>
          </div>

          {/* College Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="college-name-input">
              College Name
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="college-name-input"
                type="text"
                className="form-input"
                placeholder="e.g. Vishwakarma Institute of Technology"
                value={shop.collegeName}
                onChange={(e) => setShop({ ...shop, collegeName: e.target.value })}
                style={{ width: '100%', paddingLeft: 34 }}
              />
              <FiHome
                size={15}
                style={{
                  position: 'absolute',
                  left: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-text-muted)',
                }}
              />
            </div>
          </div>

          {/* Shop Phone */}
          <div className="form-group">
            <label className="form-label" htmlFor="shop-phone-input">
              Shop Contact Phone
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="shop-phone-input"
                type="tel"
                className="form-input"
                placeholder="98XXXXXXXX"
                value={shop.phone}
                onChange={(e) => setShop({ ...shop, phone: e.target.value })}
                style={{ width: '100%', paddingLeft: 34 }}
              />
              <FiPhone
                size={15}
                style={{
                  position: 'absolute',
                  left: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-text-muted)',
                }}
              />
            </div>
          </div>

          {/* Shop Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="shop-email-input">
              Shop Email
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="shop-email-input"
                type="email"
                className="form-input"
                placeholder="stationery@college.edu"
                value={shop.email}
                onChange={(e) => setShop({ ...shop, email: e.target.value })}
                style={{ width: '100%', paddingLeft: 34 }}
              />
              <FiMail
                size={15}
                style={{
                  position: 'absolute',
                  left: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-text-muted)',
                }}
              />
            </div>
          </div>
        </div>

        {/* Address Row */}
        <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
          <label className="form-label" htmlFor="shop-address-input">
            Shop Address
          </label>
          <div style={{ position: 'relative' }}>
            <textarea
              id="shop-address-input"
              className="form-input"
              rows={3}
              placeholder="e.g. Campus Gate 2, Vishwakarma Institute of Technology, Pune, Maharashtra"
              value={shop.address}
              onChange={(e) => setShop({ ...shop, address: e.target.value })}
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>
        </div>

        {/* Operating Hours & Holiday Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--space-4)',
            marginBottom: 'var(--space-5)',
            background: 'var(--color-bg)',
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          {/* Opening Time */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="opening-time-input">
              <FiClock size={13} style={{ marginRight: 4 }} /> Opening Time
            </label>
            <input
              id="opening-time-input"
              type="time"
              className="form-input"
              value={shop.openingTime}
              onChange={(e) => setShop({ ...shop, openingTime: e.target.value })}
              style={{ width: '100%' }}
            />
          </div>

          {/* Closing Time */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="closing-time-input">
              <FiClock size={13} style={{ marginRight: 4 }} /> Closing Time
            </label>
            <input
              id="closing-time-input"
              type="time"
              className="form-input"
              value={shop.closingTime}
              onChange={(e) => setShop({ ...shop, closingTime: e.target.value })}
              style={{ width: '100%' }}
            />
          </div>

          {/* Weekly Holiday */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="weekly-holiday-select">
              <FiCalendar size={13} style={{ marginRight: 4 }} /> Weekly Holiday
            </label>
            <select
              id="weekly-holiday-select"
              className="form-select"
              value={shop.weeklyHoliday}
              onChange={(e) => setShop({ ...shop, weeklyHoliday: e.target.value })}
              style={{ width: '100%' }}
            >
              {WEEKLY_HOLIDAY_OPTIONS.map((day) => (
                <option key={day} value={day}>
                  {day === 'None' ? 'No Weekly Holiday' : day}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div
          className="flex items-center justify-end gap-3"
          style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)' }}
        >
          <button
            type="button"
            className="btn btn--outline btn--sm"
            onClick={handleCancel}
            disabled={!hasChanges || saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            id="save-shop-settings-btn"
            className="btn btn--primary btn--sm"
            disabled={saving || !hasChanges}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <FiSave size={14} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ShopInformation;
