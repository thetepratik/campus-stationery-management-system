import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import {
  FiUser,
  FiMail,
  FiPhone,
  FiCamera,
  FiTrash2,
  FiLock,
  FiEye,
  FiEyeOff,
  FiSave,
  FiCheckCircle,
} from 'react-icons/fi';

import { settingsApi } from '../../../services/settingsApi';
import { useAuth } from '../../../context/AuthContext';

const AdminProfile = () => {
  const { updateAdminProfile } = useAuth();
  const fileInputRef = useRef(null);

  // Profile data
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    avatar: '',
  });
  const [initialProfile, setInitialProfile] = useState(null);

  // Image upload state
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  // Password state
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Loading & submission states
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Fetch admin profile
  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await settingsApi.getAdminProfile();
      const p = res.data.profile || {};
      const loaded = {
        name: p.name || '',
        email: p.email || '',
        phone: p.phone || p.mobile || '',
        avatar: p.avatar || p.profileImage || '',
      };
      setProfile(loaded);
      setInitialProfile(loaded);
      setImagePreview(loaded.avatar);
      setImageFile(null);
    } catch (err) {
      toast.error(err.message || 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Handle Image Selection
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      toast.error('Only JPG, JPEG, PNG, and WEBP image files are allowed.');
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be under 5MB.');
      return;
    }

    setImageFile(file);
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  };

  // Handle Image Removal
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    setProfile((prev) => ({ ...prev, avatar: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Save Profile Changes
  const handleSaveProfile = async (e) => {
    e.preventDefault();

    // Validation
    const name = profile.name.trim();
    if (!name) {
      toast.error('Admin name is required.');
      return;
    }

    const email = profile.email.trim();
    if (!email) {
      toast.error('Email address is required.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast.error('Please enter a valid email address.');
      return;
    }

    const phone = profile.phone.trim();
    if (phone && !/^[0-9+\s\-]{7,15}$/.test(phone)) {
      toast.error('Please enter a valid phone number.');
      return;
    }

    setSavingProfile(true);
    try {
      const payload = {
        name,
        email,
        phone,
        mobile: phone,
      };

      if (!imageFile && imagePreview === '') {
        payload.avatar = '';
      }

      const res = await settingsApi.updateAdminProfile(payload, imageFile);
      const updated = res.data.profile;

      toast.success('Profile updated successfully.');
      updateAdminProfile(updated);

      setProfile({
        name: updated.name || '',
        email: updated.email || '',
        phone: updated.phone || updated.mobile || '',
        avatar: updated.avatar || updated.profileImage || '',
      });
      setInitialProfile({
        name: updated.name || '',
        email: updated.email || '',
        phone: updated.phone || updated.mobile || '',
        avatar: updated.avatar || updated.profileImage || '',
      });
      setImagePreview(updated.avatar || updated.profileImage || '');
      setImageFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      toast.error(err.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Reset Profile
  const handleCancelProfile = () => {
    if (initialProfile) {
      setProfile(initialProfile);
      setImagePreview(initialProfile.avatar);
      setImageFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Save Password Change
  const handleChangePassword = async (e) => {
    e.preventDefault();

    const { currentPassword, newPassword, confirmPassword } = passwords;
    if (!currentPassword) {
      toast.error('Please enter your current password.');
      return;
    }
    if (!newPassword) {
      toast.error('Please enter a new password.');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setChangingPassword(true);
    try {
      await settingsApi.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      toast.success('Password changed successfully.');
      setPasswords({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      toast.error(err.message || 'Failed to change password.');
    } finally {
      setChangingPassword(false);
    }
  };

  const hasProfileChanges =
    initialProfile &&
    (profile.name !== initialProfile.name ||
      profile.email !== initialProfile.email ||
      profile.phone !== initialProfile.phone ||
      imageFile !== null ||
      imagePreview !== initialProfile.avatar);

  if (loading) {
    return (
      <div>
        <Skeleton height={180} style={{ borderRadius: 8, marginBottom: 16 }} />
        <Skeleton height={260} style={{ borderRadius: 8 }} />
      </div>
    );
  }

  const initials = (profile.name || 'A')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* ---------------- Profile Information Card ---------------- */}
      <div className="card panel">
        <div className="panel__header">
          <div>
            <span className="panel__title">Admin Profile</span>
            <p
              style={{
                margin: '2px 0 0',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-muted)',
              }}
            >
              Update your personal administrator account details and avatar.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} noValidate>
          {/* Profile Image Row */}
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
            {/* Image / Avatar Display */}
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'var(--color-primary)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.75rem',
                fontWeight: 700,
                overflow: 'hidden',
                flexShrink: 0,
                boxShadow: 'var(--shadow-sm)',
                border: '3px solid var(--color-surface)',
                position: 'relative',
              }}
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt={profile.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                initials
              )}
            </div>

            {/* Actions */}
            <div>
              <div
                style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                Profile Photo
              </div>
              <div
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-muted)',
                  marginBottom: 'var(--space-3)',
                }}
              >
                JPG, PNG, or WEBP up to 5MB.
              </div>
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  style={{ display: 'none' }}
                  onChange={handleImageChange}
                  id="admin-profile-file-input"
                />
                <button
                  type="button"
                  id="change-admin-avatar-btn"
                  className="btn btn--outline btn--sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FiCamera size={14} /> Change Image
                </button>
                {imagePreview && (
                  <button
                    type="button"
                    id="remove-admin-avatar-btn"
                    className="btn btn--ghost btn--sm"
                    style={{
                      color: 'var(--color-danger)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                    onClick={handleRemoveImage}
                  >
                    <FiTrash2 size={14} /> Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 'var(--space-4)',
              marginBottom: 'var(--space-5)',
            }}
          >
            {/* Name */}
            <div className="form-group">
              <label className="form-label" htmlFor="admin-name-input">
                Full Name <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="admin-name-input"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Pratik"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  style={{ width: '100%', paddingLeft: 34 }}
                  required
                />
                <FiUser
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

            {/* Email */}
            <div className="form-group">
              <label className="form-label" htmlFor="admin-email-input">
                Email Address <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="admin-email-input"
                  type="email"
                  className="form-input"
                  placeholder="admin@college.com"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  style={{ width: '100%', paddingLeft: 34 }}
                  required
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

            {/* Phone */}
            <div className="form-group">
              <label className="form-label" htmlFor="admin-phone-input">
                Phone Number
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="admin-phone-input"
                  type="tel"
                  className="form-input"
                  placeholder="98XXXXXXXX"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
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
          </div>

          {/* Form Actions */}
          <div
            className="flex items-center justify-end gap-3"
            style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)' }}
          >
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={handleCancelProfile}
              disabled={!hasProfileChanges || savingProfile}
            >
              Cancel
            </button>
            <button
              type="submit"
              id="save-admin-profile-btn"
              className="btn btn--primary btn--sm"
              disabled={savingProfile || !hasProfileChanges}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <FiSave size={14} />
              {savingProfile ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* ---------------- Security & Change Password Card ---------------- */}
      <div className="card panel">
        <div className="panel__header">
          <div>
            <span className="panel__title">Security</span>
            <p
              style={{
                margin: '2px 0 0',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-muted)',
              }}
            >
              Manage your password and protect your administrator account.
            </p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} noValidate>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 'var(--space-4)',
              marginBottom: 'var(--space-5)',
            }}
          >
            {/* Current Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="current-password-input">
                Current Password <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="current-password-input"
                  type={showCurrentPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="••••••••"
                  value={passwords.currentPassword}
                  onChange={(e) =>
                    setPasswords({ ...passwords, currentPassword: e.target.value })
                  }
                  style={{ width: '100%', paddingRight: 36 }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword((v) => !v)}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                  }}
                  aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                >
                  {showCurrentPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="new-password-input">
                New Password <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="new-password-input"
                  type={showNewPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="••••••••"
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                  style={{ width: '100%', paddingRight: 36 }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((v) => !v)}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                  }}
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                >
                  {showNewPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="confirm-password-input">
                Confirm New Password <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="confirm-password-input"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="••••••••"
                  value={passwords.confirmPassword}
                  onChange={(e) =>
                    setPasswords({ ...passwords, confirmPassword: e.target.value })
                  }
                  style={{ width: '100%', paddingRight: 36 }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                  }}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>
          </div>

          {/* Change Password Actions */}
          <div
            className="flex items-center justify-end"
            style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)' }}
          >
            <button
              type="submit"
              id="change-admin-password-btn"
              className="btn btn--primary btn--sm"
              disabled={
                changingPassword ||
                !passwords.currentPassword ||
                !passwords.newPassword ||
                !passwords.confirmPassword
              }
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <FiLock size={14} />
              {changingPassword ? 'Changing Password...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminProfile;
