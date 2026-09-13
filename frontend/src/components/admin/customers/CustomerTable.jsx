import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiMoreVertical,
  FiEye,
  FiShoppingBag,
  FiClock,
  FiSlash,
  FiCheckCircle,
  FiUser,
} from 'react-icons/fi';
import { formatCurrency } from '../../../utils/formatCurrency';
import { formatDate } from '../../../utils/formatDate';
import Pagination from '../../common/Pagination';

const CustomerTable = ({
  customers = [],
  pagination = {},
  onPageChange,
  onOpenBlockModal,
}) => {
  const navigate = useNavigate();
  const [activeMenuId, setActiveMenuId] = useState(null);
  const menuRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!customers.length) {
    return (
      <div
        className="empty-state"
        style={{
          padding: 'var(--space-10) 0',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-2)' }}>👥</div>
        <h4 style={{ margin: 0, fontWeight: 600 }}>No customers found</h4>
        <p
          style={{
            color: 'var(--color-text-muted)',
            fontSize: 'var(--font-size-sm)',
            maxWidth: 400,
            margin: 'var(--space-2) auto 0',
          }}
        >
          Customers will appear here when students register or purchases are associated with them.
        </p>
      </div>
    );
  }

  // Safe phone masking: 98XXXXXX12 if 10 digits
  const maskPhone = (phone) => {
    if (!phone) return '—';
    const clean = String(phone).trim();
    if (clean.length >= 10) {
      return `${clean.slice(0, 2)}XXXXXX${clean.slice(-2)}`;
    }
    return clean;
  };

  const meta = {
    page: pagination.page || 1,
    limit: pagination.limit || 10,
    totalCount: pagination.total || 0,
    totalPages: pagination.totalPages || 1,
    hasPrevPage: (pagination.page || 1) > 1,
    hasNextPage: (pagination.page || 1) < (pagination.totalPages || 1),
  };

  return (
    <div>
      <div className="table-wrapper">
        <table className="table" id="customers-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Roll No</th>
              <th>Department</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Orders</th>
              <th>Total Spent</th>
              <th>Last Purchase</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => {
              const status = c.status || 'active';
              const isBlocked = status === 'blocked';
              const isInactive = status === 'inactive';

              const badgeClass = isBlocked
                ? 'badge--outofstock'
                : isInactive
                ? 'badge--pending'
                : 'badge--instock';

              const initials = (c.name || 'U')
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase();

              return (
                <tr key={c._id}>
                  {/* Customer Avatar & Name */}
                  <td>
                    <div
                      className="flex items-center gap-2"
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/admin/customers/${c._id}`)}
                    >
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: '50%',
                          background: isBlocked
                            ? 'var(--color-danger)'
                            : 'var(--color-primary)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          flexShrink: 0,
                        }}
                      >
                        {initials}
                      </div>
                      <div>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: 'var(--font-size-sm)',
                            color: 'var(--color-primary)',
                          }}
                        >
                          {c.name}
                        </div>
                        {c.isVerified && (
                          <div
                            style={{
                              fontSize: '0.7rem',
                              color: 'var(--color-text-muted)',
                            }}
                          >
                            Verified Account
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Roll Number */}
                  <td>
                    <code
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        background: 'var(--color-bg)',
                        padding: '2px 6px',
                        borderRadius: 4,
                      }}
                    >
                      {c.rollNumber || '—'}
                    </code>
                  </td>

                  {/* Department */}
                  <td>
                    <span style={{ fontSize: 'var(--font-size-xs)' }}>
                      {c.department || '—'}
                    </span>
                  </td>

                  {/* Email */}
                  <td>
                    <span
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      {c.email}
                    </span>
                  </td>

                  {/* Phone */}
                  <td>
                    <span
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        fontFamily: 'monospace',
                      }}
                    >
                      {maskPhone(c.mobile)}
                    </span>
                  </td>

                  {/* Orders */}
                  <td>
                    <div style={{ fontWeight: 600 }}>{c.totalOrders || 0}</div>
                    <div
                      style={{
                        fontSize: '0.7rem',
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      {c.onlineOrders || 0} online • {c.offlineOrders || 0} offline
                    </div>
                  </td>

                  {/* Total Spent */}
                  <td>
                    <div style={{ fontWeight: 600 }}>
                      {formatCurrency(c.totalSpent || 0)}
                    </div>
                  </td>

                  {/* Last Purchase */}
                  <td>
                    <span
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        color: c.lastPurchase
                          ? 'var(--color-text-primary)'
                          : 'var(--color-text-muted)',
                      }}
                    >
                      {c.lastPurchase ? formatDate(c.lastPurchase) : 'No purchases'}
                    </span>
                  </td>

                  {/* Status Badge */}
                  <td>
                    <span
                      className={`badge ${badgeClass}`}
                      style={{ textTransform: 'capitalize' }}
                    >
                      {status}
                    </span>
                  </td>

                  {/* Actions Dropdown */}
                  <td style={{ textAlign: 'right', position: 'relative' }}>
                    <button
                      type="button"
                      className="btn btn--ghost btn--icon btn--sm action-menu-trigger"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === c._id ? null : c._id);
                      }}
                      title="More actions"
                      aria-label="Actions"
                    >
                      <FiMoreVertical size={16} />
                    </button>

                    {activeMenuId === c._id && (
                      <div
                        ref={menuRef}
                        className="card"
                        style={{
                          position: 'absolute',
                          right: 0,
                          top: 'calc(100% + 4px)',
                          minWidth: 190,
                          padding: 'var(--space-1)',
                          zIndex: 50,
                          boxShadow: 'var(--shadow-lg)',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--color-surface)',
                          textAlign: 'left',
                        }}
                      >
                        <button
                          type="button"
                          className="btn btn--ghost btn--sm"
                          style={{
                            width: '100%',
                            justifyContent: 'flex-start',
                            gap: 8,
                            padding: '6px 12px',
                          }}
                          onClick={() => {
                            setActiveMenuId(null);
                            navigate(`/admin/customers/${c._id}`);
                          }}
                        >
                          <FiEye size={14} /> View Customer
                        </button>

                        <button
                          type="button"
                          className="btn btn--ghost btn--sm"
                          style={{
                            width: '100%',
                            justifyContent: 'flex-start',
                            gap: 8,
                            padding: '6px 12px',
                          }}
                          onClick={() => {
                            setActiveMenuId(null);
                            navigate(`/admin/customers/${c._id}?tab=orders`);
                          }}
                        >
                          <FiShoppingBag size={14} /> View Orders
                        </button>

                        <button
                          type="button"
                          className="btn btn--ghost btn--sm"
                          style={{
                            width: '100%',
                            justifyContent: 'flex-start',
                            gap: 8,
                            padding: '6px 12px',
                          }}
                          onClick={() => {
                            setActiveMenuId(null);
                            navigate(`/admin/customers/${c._id}?tab=history`);
                          }}
                        >
                          <FiClock size={14} /> Purchase History
                        </button>

                        <div
                          style={{
                            height: 1,
                            background: 'var(--color-border)',
                            margin: '4px 0',
                          }}
                        />

                        {isBlocked ? (
                          <button
                            type="button"
                            className="btn btn--ghost btn--sm"
                            style={{
                              width: '100%',
                              justifyContent: 'flex-start',
                              gap: 8,
                              padding: '6px 12px',
                              color: '#10B981',
                            }}
                            onClick={() => {
                              setActiveMenuId(null);
                              onOpenBlockModal(c, 'unblock');
                            }}
                          >
                            <FiCheckCircle size={14} /> Unblock Customer
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn--ghost btn--sm"
                            style={{
                              width: '100%',
                              justifyContent: 'flex-start',
                              gap: 8,
                              padding: '6px 12px',
                              color: 'var(--color-danger)',
                            }}
                            onClick={() => {
                              setActiveMenuId(null);
                              onOpenBlockModal(c, 'block');
                            }}
                          >
                            <FiSlash size={14} /> Block Customer
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Pagination meta={meta} onPageChange={onPageChange} />
    </div>
  );
};

export default CustomerTable;
