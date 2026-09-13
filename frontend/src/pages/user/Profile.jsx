// import { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { toast } from 'react-toastify';
// import {
//   FiUser,
//   FiMail,
//   FiHash,
//   FiBookOpen,
//   FiPhone,
//   FiCheckCircle,
//   FiLock,
//   FiLogOut,
//   FiShoppingBag,
//   FiHeart,
// } from 'react-icons/fi';

// import { useAuth } from '../../context/AuthContext';
// import { useCart } from '../../context/CartContext';
// import { useWishlist } from '../../context/WishlistContext';
// import { authApi } from '../../services/authApi';
// import Button from '../../components/common/Button';
// import ConfirmDialog from '../../components/common/ConfirmDialog';

// const Profile = () => {
//   const { student, studentLogout } = useAuth();
//   const { count: cartCount } = useCart();
//   const { count: wishlistCount } = useWishlist();
//   const navigate = useNavigate();

//   const [sendingReset, setSendingReset] = useState(false);
//   const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
//   const [loggingOut, setLoggingOut] = useState(false);

//   const initials = student?.name
//     ?.split(' ')
//     .map((w) => w[0])
//     .slice(0, 2)
//     .join('')
//     .toUpperCase();

//   const handleSendPasswordReset = async () => {
//     setSendingReset(true);
//     try {
//       const res = await authApi.studentForgotPassword(student.email);
//       toast.success(res.message || 'Password reset link sent to your email');
//     } catch (err) {
//       toast.error(err.message);
//     } finally {
//       setSendingReset(false);
//     }
//   };

//   const handleLogout = async () => {
//     setLoggingOut(true);
//     try {
//       await studentLogout();
//       toast.success('Logged out successfully');
//       navigate('/login');
//     } catch (err) {
//       toast.error(err.message);
//       setLoggingOut(false);
//     }
//   };

//   const infoRows = [
//     { icon: FiUser, label: 'Full Name', value: student?.name },
//     { icon: FiMail, label: 'Email', value: student?.email },
//     { icon: FiHash, label: 'Roll Number', value: student?.rollNumber },
//     { icon: FiBookOpen, label: 'Department', value: student?.department || 'Not set' },
//     { icon: FiPhone, label: 'Mobile', value: student?.mobile || 'Not set' },
//   ];

//   return (
//     <div className="container" style={{ paddingTop: 'var(--space-6)', maxWidth: 720 }}>
//       {/* ---------- Hero header ---------- */}
//       <div
//         className="card"
//         style={{
//           padding: 'var(--space-8)',
//           marginBottom: 'var(--space-6)',
//           background: 'linear-gradient(135deg, var(--color-primary) 0%, #6366F1 100%)',
//           color: '#fff',
//           border: 'none',
//         }}
//       >
//         <div className="flex items-center gap-4">
//           <div
//             style={{
//               width: 76,
//               height: 76,
//               borderRadius: '50%',
//               background: 'rgba(255,255,255,0.2)',
//               border: '2px solid rgba(255,255,255,0.5)',
//               display: 'flex',
//               alignItems: 'center',
//               justifyContent: 'center',
//               fontSize: 'var(--font-size-xl)',
//               fontWeight: 700,
//               flexShrink: 0,
//             }}
//           >
//             {initials || <FiUser size={28} />}
//           </div>
//           <div>
//             <div className="flex items-center gap-2">
//               <h1 style={{ fontSize: 'var(--font-size-xl)', margin: 0 }}>{student?.name}</h1>
//               {student?.isVerified && (
//                 <span
//                   className="flex items-center gap-1"
//                   style={{
//                     fontSize: 'var(--font-size-xs)',
//                     background: 'rgba(255,255,255,0.2)',
//                     padding: '2px 10px',
//                     borderRadius: 'var(--radius-full)',
//                     fontWeight: 600,
//                   }}
//                 >
//                   <FiCheckCircle size={12} /> Verified
//                 </span>
//               )}
//             </div>
//             <p style={{ opacity: 0.9, fontSize: 'var(--font-size-sm)', marginTop: 4 }}>
//               {student?.rollNumber} {student?.department ? `· ${student.department}` : ''}
//             </p>
//           </div>
//         </div>

//         {/* Quick stats */}
//         <div className="flex gap-4" style={{ marginTop: 'var(--space-6)', flexWrap: 'wrap' }}>
//           <div
//             className="flex items-center gap-2"
//             style={{ background: 'rgba(255,255,255,0.15)', padding: '10px 16px', borderRadius: 'var(--radius-md)' }}
//           >
//             <FiShoppingBag size={16} />
//             <span style={{ fontSize: 'var(--font-size-sm)' }}>
//               <strong>{cartCount}</strong> in cart
//             </span>
//           </div>
//           <div
//             className="flex items-center gap-2"
//             style={{ background: 'rgba(255,255,255,0.15)', padding: '10px 16px', borderRadius: 'var(--radius-md)' }}
//           >
//             <FiHeart size={16} />
//             <span style={{ fontSize: 'var(--font-size-sm)' }}>
//               <strong>{wishlistCount}</strong> wishlisted
//             </span>
//           </div>
//         </div>
//       </div>

//       {/* ---------- Account details ---------- */}
//       <div className="card panel" style={{ marginBottom: 'var(--space-5)' }}>
//         <div className="panel__header">
//           <span className="panel__title">Account Details</span>
//         </div>
//         <div style={{ display: 'flex', flexDirection: 'column' }}>
//           {infoRows.map(({ icon: Icon, label, value }, i) => (
//             <div
//               key={label}
//               className="flex items-center gap-3"
//               style={{
//                 padding: 'var(--space-3) 0',
//                 borderBottom: i < infoRows.length - 1 ? '1px solid var(--color-border)' : 'none',
//               }}
//             >
//               <div
//                 style={{
//                   width: 36,
//                   height: 36,
//                   borderRadius: 'var(--radius-md)',
//                   background: 'var(--color-primary-light)',
//                   color: 'var(--color-primary)',
//                   display: 'flex',
//                   alignItems: 'center',
//                   justifyContent: 'center',
//                   flexShrink: 0,
//                 }}
//               >
//                 <Icon size={16} />
//               </div>
//               <div>
//                 <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{label}</div>
//                 <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>{value}</div>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* ---------- Security ---------- */}
//       <div className="card panel" style={{ marginBottom: 'var(--space-5)' }}>
//         <div className="panel__header">
//           <span className="panel__title">Security</span>
//         </div>
//         <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: 'var(--space-3)' }}>
//           <div className="flex items-center gap-3">
//             <div
//               style={{
//                 width: 36,
//                 height: 36,
//                 borderRadius: 'var(--radius-md)',
//                 background: 'var(--color-warning-light)',
//                 color: 'var(--color-warning)',
//                 display: 'flex',
//                 alignItems: 'center',
//                 justifyContent: 'center',
//                 flexShrink: 0,
//               }}
//             >
//               <FiLock size={16} />
//             </div>
//             <div>
//               <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>Password</div>
//               <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
//                 We'll email you a secure link to reset it
//               </div>
//             </div>
//           </div>
//           <Button variant="outline" onClick={handleSendPasswordReset} loading={sendingReset}>
//             Send Reset Link
//           </Button>
//         </div>
//       </div>

//       {/* ---------- Logout ---------- */}
//       <div className="card panel" style={{ marginBottom: 'var(--space-8)' }}>
//         <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: 'var(--space-3)' }}>
//           <div>
//             <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>Log out of your account</div>
//             <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
//               You'll need to sign in again to place orders
//             </div>
//           </div>
//           <Button variant="danger" onClick={() => setConfirmLogoutOpen(true)}>
//             <FiLogOut size={14} /> Logout
//           </Button>
//         </div>
//       </div>

//       <ConfirmDialog
//         open={confirmLogoutOpen}
//         onClose={() => setConfirmLogoutOpen(false)}
//         onConfirm={handleLogout}
//         title="Log out?"
//         message="You'll need to sign in again to view your cart, wishlist, or place new orders."
//         confirmLabel="Yes, Logout"
//         variant="danger"
//         loading={loggingOut}
//       />
//     </div>
//   );
// };

// export default Profile;

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import {
  FiUser,
  FiMail,
  FiHash,
  FiBookOpen,
  FiPhone,
  FiCheckCircle,
  FiLock,
  FiLogOut,
  FiShoppingBag,
  FiHeart,
  FiEdit2,
  FiMapPin,
  FiHome,
  FiSave,
  FiX,
  FiCalendar,
} from 'react-icons/fi';

import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { authApi } from '../../services/authApi';

import Button from '../../components/common/Button';
import ConfirmDialog from '../../components/common/ConfirmDialog';


/* =========================================================
   PROFILE PAGE
========================================================= */

const Profile = () => {
  const {
    student,
    updateStudentProfile,
    studentLogout,
  } = useAuth();

  const { count: cartCount } = useCart();
  const { count: wishlistCount } = useWishlist();

  const navigate = useNavigate();


  /* =======================================================
     STATE
  ======================================================= */

  const [editing, setEditing] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [sendingReset, setSendingReset] =
    useState(false);

  const [confirmLogoutOpen, setConfirmLogoutOpen] =
    useState(false);

  const [loggingOut, setLoggingOut] =
    useState(false);


  /* =======================================================
     EDIT FORM STATE
  ======================================================= */

  const getDefaultForm = () => {
    const address =
      student?.addresses?.find(
        (item) => item.isDefault
      ) ||
      student?.addresses?.[0] ||
      {};

    return {
      name: student?.name || '',

      mobile: student?.mobile || '',

      department:
        student?.department || '',

      avatar:
        student?.avatar || '',

      label:
        address.label || 'Hostel',

      line1:
        address.line1 || '',

      hostel:
        address.hostel || '',

      room:
        address.room || '',
    };
  };


  const [form, setForm] =
    useState(getDefaultForm);


  /* =======================================================
     INITIALS
  ======================================================= */

  const initials = useMemo(() => {
    if (!student?.name) {
      return 'U';
    }

    return student.name
      .trim()
      .split(/\s+/)
      .map((word) => word[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }, [student?.name]);


  /* =======================================================
     DATE FORMATTER
  ======================================================= */

  const formattedJoinDate =
    student?.createdAt
      ? new Date(
          student.createdAt
        ).toLocaleDateString(
          'en-IN',
          {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }
        )
      : 'Not available';


  /* =======================================================
     FORM INPUT HANDLER
  ======================================================= */

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };


  /* =======================================================
     START EDITING
  ======================================================= */

  const handleStartEdit = () => {
    setForm(
      getDefaultForm()
    );

    setEditing(true);
  };


  /* =======================================================
     CANCEL EDITING
  ======================================================= */

  const handleCancelEdit = () => {
    setForm(
      getDefaultForm()
    );

    setEditing(false);
  };


  /* =======================================================
     SAVE PROFILE
  ======================================================= */

  const handleSaveProfile =
    async (event) => {
      event.preventDefault();

      if (!form.name.trim()) {
        toast.error(
          'Name is required'
        );

        return;
      }

      setSaving(true);

      try {
        /*
         * Preserve existing addresses.
         * We update the first/default address.
         */

        const existingAddresses =
          Array.isArray(
            student?.addresses
          )
            ? [...student.addresses]
            : [];


        const addressData = {
          label:
            form.label.trim() ||
            'Hostel',

          line1:
            form.line1.trim(),

          hostel:
            form.hostel.trim(),

          room:
            form.room.trim(),

          isDefault: true,
        };


        if (
          existingAddresses.length === 0
        ) {
          existingAddresses.push(
            addressData
          );
        } else {
          /*
           * Find default address first.
           */
          const defaultIndex =
            existingAddresses.findIndex(
              (address) =>
                address.isDefault
            );

          const targetIndex =
            defaultIndex >= 0
              ? defaultIndex
              : 0;


          existingAddresses[
            targetIndex
          ] = {
            ...existingAddresses[
              targetIndex
            ],

            ...addressData,
          };


          /*
           * Make sure only one address
           * is marked as default.
           */
          existingAddresses.forEach(
            (address, index) => {
              address.isDefault =
                index === targetIndex;
            }
          );
        }


        const profileData = {
          name:
            form.name.trim(),

          mobile:
            form.mobile.trim(),

          department:
            form.department.trim(),

          avatar:
            form.avatar.trim(),

          addresses:
            existingAddresses,
        };


        await updateStudentProfile(
          profileData
        );


        toast.success(
          'Profile updated successfully'
        );

        setEditing(false);
      } catch (error) {
        toast.error(
          error?.message ||
            'Unable to update profile'
        );
      } finally {
        setSaving(false);
      }
    };


  /* =======================================================
     PASSWORD RESET
  ======================================================= */

  const handleSendPasswordReset =
    async () => {
      if (!student?.email) {
        toast.error(
          'Student email not available'
        );

        return;
      }

      setSendingReset(true);

      try {
        const response =
          await authApi.studentForgotPassword(
            student.email
          );

        toast.success(
          response?.message ||
            'Password reset link sent to your email'
        );
      } catch (error) {
        toast.error(
          error?.message ||
            'Unable to send reset link'
        );
      } finally {
        setSendingReset(false);
      }
    };


  /* =======================================================
     LOGOUT
  ======================================================= */

  const handleLogout =
    async () => {
      setLoggingOut(true);

      try {
        await studentLogout();

        toast.success(
          'Logged out successfully'
        );

        navigate('/login');
      } catch (error) {
        toast.error(
          error?.message ||
            'Logout failed'
        );

        setLoggingOut(false);
      }
    };


  /* =======================================================
     CURRENT DEFAULT ADDRESS
  ======================================================= */

  const currentAddress =
    student?.addresses?.find(
      (address) =>
        address.isDefault
    ) ||
    student?.addresses?.[0] ||
    null;


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div
      className="container"
      style={{
        paddingTop:
          'var(--space-6)',

        paddingBottom:
          'var(--space-8)',

        maxWidth: 820,
      }}
    >

      {/* =================================================
          PROFILE HERO
      ================================================= */}

      <div
        className="card"
        style={{
          padding:
            'var(--space-8)',

          marginBottom:
            'var(--space-6)',

          background:
            'linear-gradient(135deg, var(--color-primary) 0%, #6366F1 100%)',

          color: '#fff',

          border: 'none',

          position: 'relative',
        }}
      >

        {/* Edit Button */}

        {!editing && (
          <button
            type="button"
            onClick={handleStartEdit}
            title="Edit Profile"
            style={{
              position:
                'absolute',

              top: 20,

              right: 20,

              width: 42,

              height: 42,

              borderRadius:
                '50%',

              border:
                '1px solid rgba(255,255,255,0.35)',

              background:
                'rgba(255,255,255,0.15)',

              color: '#fff',

              display: 'flex',

              alignItems:
                'center',

              justifyContent:
                'center',

              cursor: 'pointer',
            }}
          >
            <FiEdit2
              size={17}
            />
          </button>
        )}


        <div
          style={{
            display: 'flex',

            alignItems:
              'center',

            gap:
              'var(--space-4)',

            flexWrap:
              'wrap',
          }}
        >

          {/* Avatar */}

          <div
            style={{
              width: 76,

              height: 76,

              borderRadius:
                '50%',

              background:
                'rgba(255,255,255,0.2)',

              border:
                '2px solid rgba(255,255,255,0.5)',

              display: 'flex',

              alignItems:
                'center',

              justifyContent:
                'center',

              overflow: 'hidden',

              fontSize:
                'var(--font-size-xl)',

              fontWeight: 700,

              flexShrink: 0,
            }}
          >

            {student?.avatar ? (
              <img
                src={
                  student.avatar
                }
                alt={
                  student.name ||
                  'Student'
                }
                style={{
                  width: '100%',

                  height: '100%',

                  objectFit:
                    'cover',
                }}
                onError={(
                  event
                ) => {
                  event.currentTarget.style.display =
                    'none';
                }}
              />
            ) : (
              initials
            )}

          </div>


          {/* Student Name */}

          <div
            style={{
              minWidth: 0,
              flex: 1,
            }}
          >

            <div
              style={{
                display: 'flex',

                alignItems:
                  'center',

                gap: 8,

                flexWrap:
                  'wrap',
              }}
            >

              <h1
                style={{
                  fontSize:
                    'var(--font-size-xl)',

                  margin: 0,
                }}
              >
                {student?.name ||
                  'Student'}
              </h1>


              {student?.isVerified && (
                <span
                  className="flex items-center gap-1"
                  style={{
                    fontSize:
                      'var(--font-size-xs)',

                    background:
                      'rgba(255,255,255,0.2)',

                    padding:
                      '4px 10px',

                    borderRadius:
                      'var(--radius-full)',

                    fontWeight: 600,
                  }}
                >
                  <FiCheckCircle
                    size={12}
                  />

                  Verified
                </span>
              )}

            </div>


            <p
              style={{
                opacity: 0.9,

                fontSize:
                  'var(--font-size-sm)',

                marginTop: 4,

                marginBottom: 0,
              }}
            >
              {student?.rollNumber ||
                'Roll number not available'}

              {student?.department
                ? ` · ${student.department}`
                : ''}
            </p>

          </div>

        </div>


        {/* Quick Stats */}

        <div
          className="flex gap-4"
          style={{
            marginTop:
              'var(--space-6)',

            flexWrap:
              'wrap',
          }}
        >

          <div
            className="flex items-center gap-2"
            style={{
              background:
                'rgba(255,255,255,0.15)',

              padding:
                '10px 16px',

              borderRadius:
                'var(--radius-md)',
            }}
          >
            <FiShoppingBag
              size={16}
            />

            <span
              style={{
                fontSize:
                  'var(--font-size-sm)',
              }}
            >
              <strong>
                {cartCount}
              </strong>{' '}
              in cart
            </span>
          </div>


          <div
            className="flex items-center gap-2"
            style={{
              background:
                'rgba(255,255,255,0.15)',

              padding:
                '10px 16px',

              borderRadius:
                'var(--radius-md)',
            }}
          >
            <FiHeart
              size={16}
            />

            <span
              style={{
                fontSize:
                  'var(--font-size-sm)',
              }}
            >
              <strong>
                {wishlistCount}
              </strong>{' '}
              wishlisted
            </span>
          </div>


          <div
            className="flex items-center gap-2"
            style={{
              background:
                'rgba(255,255,255,0.15)',

              padding:
                '10px 16px',

              borderRadius:
                'var(--radius-md)',
            }}
          >
            <FiCalendar
              size={16}
            />

            <span
              style={{
                fontSize:
                  'var(--font-size-sm)',
              }}
            >
              Joined{' '}
              <strong>
                {formattedJoinDate}
              </strong>
            </span>
          </div>

        </div>

      </div>


      {/* =================================================
          EDIT PROFILE
      ================================================= */}

      {editing && (
        <form
          onSubmit={
            handleSaveProfile
          }
          className="card panel"
          style={{
            marginBottom:
              'var(--space-5)',
          }}
        >

          <div
            className="panel__header"
            style={{
              display: 'flex',

              alignItems:
                'center',

              justifyContent:
                'space-between',

              gap: 12,
            }}
          >

            <span className="panel__title">
              Edit Profile
            </span>

            <button
              type="button"
              onClick={
                handleCancelEdit
              }
              style={{
                border: 'none',

                background:
                  'transparent',

                cursor:
                  'pointer',

                color:
                  'var(--color-text-muted)',

                display: 'flex',

                alignItems:
                  'center',

                justifyContent:
                  'center',
              }}
            >
              <FiX size={20} />
            </button>

          </div>


          {/* Profile Image URL */}

          <div
            className="form-group"
          >
            <label
              className="form-label"
              htmlFor="avatar"
            >
              Profile Image URL
            </label>

            <input
              id="avatar"
              name="avatar"
              type="url"
              value={
                form.avatar
              }
              onChange={
                handleChange
              }
              placeholder="https://example.com/profile.jpg"
              className="form-input"
            />

            <div
              style={{
                marginTop: 5,

                fontSize:
                  'var(--font-size-xs)',

                color:
                  'var(--color-text-muted)',
              }}
            >
              Optional. Enter a publicly accessible image URL.
            </div>
          </div>


          {/* Name + Mobile */}

          <div
            className="grid"
            style={{
              gridTemplateColumns:
                '1fr 1fr',

              gap:
                '0 var(--space-4)',
            }}
          >

            <div
              className="form-group"
            >
              <label
                className="form-label"
                htmlFor="name"
              >
                Full Name
              </label>

              <input
                id="name"
                name="name"
                type="text"
                value={
                  form.name
                }
                onChange={
                  handleChange
                }
                placeholder="Enter your full name"
                className="form-input"
                required
              />
            </div>


            <div
              className="form-group"
            >
              <label
                className="form-label"
                htmlFor="mobile"
              >
                Mobile Number
              </label>

              <input
                id="mobile"
                name="mobile"
                type="tel"
                value={
                  form.mobile
                }
                onChange={
                  handleChange
                }
                placeholder="Enter mobile number"
                className="form-input"
              />
            </div>

          </div>


          {/* Department */}

          <div
            className="form-group"
          >
            <label
              className="form-label"
              htmlFor="department"
            >
              Department
            </label>

            <input
              id="department"
              name="department"
              type="text"
              value={
                form.department
              }
              onChange={
                handleChange
              }
              placeholder="e.g. Artificial Intelligence and Data Science"
              className="form-input"
            />
          </div>


          {/* Read-only information */}

          <div
            className="grid"
            style={{
              gridTemplateColumns:
                '1fr 1fr',

              gap:
                '0 var(--space-4)',
            }}
          >

            <div
              className="form-group"
            >
              <label
                className="form-label"
              >
                Email
              </label>

              <input
                type="email"
                value={
                  student?.email ||
                  ''
                }
                disabled
                className="form-input"
              />

              <div
                style={{
                  fontSize:
                    'var(--font-size-xs)',

                  color:
                    'var(--color-text-muted)',

                  marginTop: 4,
                }}
              >
                Email cannot be changed.
              </div>
            </div>


            <div
              className="form-group"
            >
              <label
                className="form-label"
              >
                Roll Number
              </label>

              <input
                type="text"
                value={
                  student?.rollNumber ||
                  ''
                }
                disabled
                className="form-input"
              />

              <div
                style={{
                  fontSize:
                    'var(--font-size-xs)',

                  color:
                    'var(--color-text-muted)',

                  marginTop: 4,
                }}
              >
                Roll number cannot be changed.
              </div>
            </div>

          </div>


          {/* =================================================
              ADDRESS
          ================================================= */}

          <div
            style={{
              marginTop:
                'var(--space-4)',

              marginBottom:
                'var(--space-3)',

              fontSize:
                'var(--font-size-md)',

              fontWeight: 600,
            }}
          >
            Address Information
          </div>


          <div
            className="grid"
            style={{
              gridTemplateColumns:
                '1fr 1fr',

              gap:
                '0 var(--space-4)',
            }}
          >

            {/* Label */}

            <div
              className="form-group"
            >
              <label
                className="form-label"
                htmlFor="label"
              >
                Address Label
              </label>

              <input
                id="label"
                name="label"
                type="text"
                value={
                  form.label
                }
                onChange={
                  handleChange
                }
                placeholder="Hostel"
                className="form-input"
              />
            </div>


            {/* Hostel */}

            <div
              className="form-group"
            >
              <label
                className="form-label"
                htmlFor="hostel"
              >
                Hostel
              </label>

              <input
                id="hostel"
                name="hostel"
                type="text"
                value={
                  form.hostel
                }
                onChange={
                  handleChange
                }
                placeholder="Hostel name"
                className="form-input"
              />
            </div>


            {/* Room */}

            <div
              className="form-group"
            >
              <label
                className="form-label"
                htmlFor="room"
              >
                Room Number
              </label>

              <input
                id="room"
                name="room"
                type="text"
                value={
                  form.room
                }
                onChange={
                  handleChange
                }
                placeholder="Room number"
                className="form-input"
              />
            </div>


            {/* Address */}

            <div
              className="form-group"
            >
              <label
                className="form-label"
                htmlFor="line1"
              >
                Address
              </label>

              <input
                id="line1"
                name="line1"
                type="text"
                value={
                  form.line1
                }
                onChange={
                  handleChange
                }
                placeholder="Building / street / area"
                className="form-input"
              />
            </div>

          </div>


          {/* Buttons */}

          <div
            className="flex gap-3 justify-end"
            style={{
              marginTop:
                'var(--space-5)',

              flexWrap:
                'wrap',
            }}
          >

            <Button
              type="button"
              variant="outline"
              onClick={
                handleCancelEdit
              }
              disabled={saving}
            >
              <FiX size={15} />

              Cancel
            </Button>


            <Button
              type="submit"
              loading={saving}
            >
              <FiSave size={15} />

              Save Changes
            </Button>

          </div>

        </form>
      )}


      {/* =================================================
          ACCOUNT DETAILS
      ================================================= */}

      {!editing && (
        <>
          <div
            className="card panel"
            style={{
              marginBottom:
                'var(--space-5)',
            }}
          >

            <div className="panel__header">
              <span className="panel__title">
                Account Details
              </span>
            </div>


            <div
              style={{
                display: 'flex',

                flexDirection:
                  'column',
              }}
            >

              {[
                {
                  icon: FiUser,
                  label: 'Full Name',
                  value:
                    student?.name ||
                    'Not set',
                },

                {
                  icon: FiMail,
                  label: 'Email',
                  value:
                    student?.email ||
                    'Not set',
                },

                {
                  icon: FiHash,
                  label: 'Roll Number',
                  value:
                    student?.rollNumber ||
                    'Not set',
                },

                {
                  icon: FiBookOpen,
                  label: 'Department',
                  value:
                    student?.department ||
                    'Not set',
                },

                {
                  icon: FiPhone,
                  label: 'Mobile',
                  value:
                    student?.mobile ||
                    'Not set',
                },
              ].map(
                (
                  {
                    icon: Icon,
                    label,
                    value,
                  },
                  index,
                  rows
                ) => (
                  <div
                    key={label}
                    className="flex items-center gap-3"
                    style={{
                      padding:
                        'var(--space-3) 0',

                      borderBottom:
                        index <
                        rows.length - 1
                          ? '1px solid var(--color-border)'
                          : 'none',
                    }}
                  >

                    <div
                      style={{
                        width: 36,

                        height: 36,

                        borderRadius:
                          'var(--radius-md)',

                        background:
                          'var(--color-primary-light)',

                        color:
                          'var(--color-primary)',

                        display:
                          'flex',

                        alignItems:
                          'center',

                        justifyContent:
                          'center',

                        flexShrink: 0,
                      }}
                    >
                      <Icon size={16} />
                    </div>


                    <div>
                      <div
                        style={{
                          fontSize:
                            'var(--font-size-xs)',

                          color:
                            'var(--color-text-muted)',
                        }}
                      >
                        {label}
                      </div>

                      <div
                        style={{
                          fontSize:
                            'var(--font-size-sm)',

                          fontWeight: 500,

                          wordBreak:
                            'break-word',
                        }}
                      >
                        {value}
                      </div>
                    </div>

                  </div>
                )
              )}

            </div>

          </div>


          {/* =================================================
              ADDRESS DETAILS
          ================================================= */}

          <div
            className="card panel"
            style={{
              marginBottom:
                'var(--space-5)',
            }}
          >

            <div
              className="panel__header"
            >
              <span className="panel__title">
                Address
              </span>
            </div>


            {currentAddress ? (
              <div
                className="flex gap-3"
              >

                <div
                  style={{
                    width: 42,

                    height: 42,

                    borderRadius:
                      'var(--radius-md)',

                    background:
                      'var(--color-primary-light)',

                    color:
                      'var(--color-primary)',

                    display: 'flex',

                    alignItems:
                      'center',

                    justifyContent:
                      'center',

                    flexShrink: 0,
                  }}
                >
                  <FiMapPin
                    size={18}
                  />
                </div>


                <div
                  style={{
                    minWidth: 0,
                  }}
                >

                  <div
                    style={{
                      fontSize:
                        'var(--font-size-sm)',

                      fontWeight: 600,

                      marginBottom: 4,
                    }}
                  >
                    {currentAddress.label ||
                      'Address'}

                    {currentAddress.isDefault && (
                      <span
                        style={{
                          marginLeft: 8,

                          fontSize:
                            'var(--font-size-xs)',

                          padding:
                            '3px 8px',

                          borderRadius:
                            'var(--radius-full)',

                          background:
                            'var(--color-success-light)',

                          color:
                            'var(--color-success)',
                        }}
                      >
                        Default
                      </span>
                    )}
                  </div>


                  {currentAddress.hostel && (
                    <div
                      style={{
                        fontSize:
                          'var(--font-size-sm)',

                        marginBottom: 2,
                      }}
                    >
                      <FiHome
                        size={13}
                        style={{
                          marginRight: 5,
                          verticalAlign:
                            'middle',
                        }}
                      />

                      {currentAddress.hostel}
                    </div>
                  )}


                  {currentAddress.room && (
                    <div
                      style={{
                        fontSize:
                          'var(--font-size-sm)',

                        marginBottom: 2,
                      }}
                    >
                      Room{' '}
                      {currentAddress.room}
                    </div>
                  )}


                  {currentAddress.line1 && (
                    <div
                      style={{
                        fontSize:
                          'var(--font-size-sm)',

                        color:
                          'var(--color-text-muted)',
                      }}
                    >
                      {currentAddress.line1}
                    </div>
                  )}

                </div>

              </div>
            ) : (
              <div
                style={{
                  textAlign:
                    'center',

                  padding:
                    'var(--space-4)',

                  color:
                    'var(--color-text-muted)',
                }}
              >
                <FiMapPin
                  size={24}
                  style={{
                    marginBottom: 8,
                  }}
                />

                <div>
                  No address added yet.
                </div>

                <div
                  style={{
                    fontSize:
                      'var(--font-size-xs)',

                    marginTop: 4,
                  }}
                >
                  Click Edit Profile to add your hostel and room.
                </div>
              </div>
            )}

          </div>


          {/* =================================================
              SECURITY
          ================================================= */}

          <div
            className="card panel"
            style={{
              marginBottom:
                'var(--space-5)',
            }}
          >

            <div className="panel__header">
              <span className="panel__title">
                Security
              </span>
            </div>


            <div
              className="flex items-center justify-between"
              style={{
                flexWrap:
                  'wrap',

                gap:
                  'var(--space-3)',
              }}
            >

              <div
                className="flex items-center gap-3"
              >

                <div
                  style={{
                    width: 36,

                    height: 36,

                    borderRadius:
                      'var(--radius-md)',

                    background:
                      'var(--color-warning-light)',

                    color:
                      'var(--color-warning)',

                    display:
                      'flex',

                    alignItems:
                      'center',

                    justifyContent:
                      'center',

                    flexShrink: 0,
                  }}
                >
                  <FiLock
                    size={16}
                  />
                </div>


                <div>

                  <div
                    style={{
                      fontSize:
                        'var(--font-size-sm)',

                      fontWeight: 500,
                    }}
                  >
                    Password
                  </div>

                  <div
                    style={{
                      fontSize:
                        'var(--font-size-xs)',

                      color:
                        'var(--color-text-muted)',
                    }}
                  >
                    We'll email you a secure link to reset it
                  </div>

                </div>

              </div>


              <Button
                variant="outline"
                onClick={
                  handleSendPasswordReset
                }
                loading={
                  sendingReset
                }
              >
                <FiLock
                  size={14}
                />

                Send Reset Link
              </Button>

            </div>

          </div>


          {/* =================================================
              LOGOUT
          ================================================= */}

          <div
            className="card panel"
            style={{
              marginBottom:
                'var(--space-8)',
            }}
          >

            <div
              className="flex items-center justify-between"
              style={{
                flexWrap:
                  'wrap',

                gap:
                  'var(--space-3)',
              }}
            >

              <div>

                <div
                  style={{
                    fontSize:
                      'var(--font-size-sm)',

                    fontWeight: 500,
                  }}
                >
                  Log out of your account
                </div>

                <div
                  style={{
                    fontSize:
                      'var(--font-size-xs)',

                    color:
                      'var(--color-text-muted)',
                  }}
                >
                  You'll need to sign in again to place orders
                </div>

              </div>


              <Button
                variant="danger"
                onClick={() =>
                  setConfirmLogoutOpen(
                    true
                  )
                }
              >
                <FiLogOut
                  size={14}
                />

                Logout
              </Button>

            </div>

          </div>

        </>
      )}


      {/* =================================================
          LOGOUT CONFIRMATION
      ================================================= */}

      <ConfirmDialog
        open={
          confirmLogoutOpen
        }

        onClose={() =>
          setConfirmLogoutOpen(
            false
          )
        }

        onConfirm={
          handleLogout
        }

        title="Log out?"

        message="You'll need to sign in again to view your cart, wishlist, or place new orders."

        confirmLabel="Yes, Logout"

        variant="danger"

        loading={
          loggingOut
        }
      />

    </div>
  );
};


export default Profile;