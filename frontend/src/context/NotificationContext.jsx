import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import { notificationApi } from '../services/notificationApi';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { admin, student, isAdminAuthenticated, isStudentAuthenticated } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [categoryCounts, setCategoryCounts] = useState({ all: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  const socketRef = useRef(null);
  const activeRole = isAdminAuthenticated ? 'admin' : isStudentAuthenticated ? 'student' : null;

  // ---------------------------------------------------------
  // FETCH UNREAD COUNT
  // ---------------------------------------------------------
  const fetchUnreadCount = useCallback(async () => {
    if (!activeRole) {
      setUnreadCount(0);
      return;
    }
    try {
      const res = await notificationApi.getUnreadCount();
      const count = res?.data?.unreadCount ?? 0;
      setUnreadCount(count);
    } catch (err) {
      console.warn('[NotificationContext] Failed to fetch unread count:', err?.message);
    }
  }, [activeRole]);

  // ---------------------------------------------------------
  // FETCH NOTIFICATIONS LIST
  // ---------------------------------------------------------
  const fetchNotifications = useCallback(
    async ({ category = 'all', page = 1, limit = 20, search = '' } = {}) => {
      if (!activeRole) return;
      setLoading(true);
      setError(null);
      try {
        const res = await notificationApi.getNotifications({
          category,
          page,
          limit,
          search,
        });

        const data = res?.data || {};
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount ?? 0);
        if (data.categoryCounts) {
          setCategoryCounts(data.categoryCounts);
        }
        if (data.pagination) {
          setPagination(data.pagination);
        }
      } catch (err) {
        console.error('[NotificationContext] Failed to load notifications:', err);
        setError(err.message || 'Unable to load notifications.');
      } finally {
        setLoading(false);
      }
    },
    [activeRole]
  );

  // ---------------------------------------------------------
  // MARK AS READ
  // ---------------------------------------------------------
  const markAsRead = useCallback(async (id) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((item) =>
          item._id === id ? { ...item, isRead: true, readAt: new Date() } : item
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('[NotificationContext] Failed to mark notification as read:', err);
    }
  }, []);

  // ---------------------------------------------------------
  // MARK ALL AS READ
  // ---------------------------------------------------------
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) =>
        prev.map((item) => ({ ...item, isRead: true, readAt: new Date() }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('[NotificationContext] Failed to mark all as read:', err);
    }
  }, []);

  // ---------------------------------------------------------
  // DELETE NOTIFICATION
  // ---------------------------------------------------------
  const deleteNotification = useCallback(async (id) => {
    try {
      await notificationApi.deleteNotification(id);
      setNotifications((prev) => {
        const target = prev.find((n) => n._id === id);
        if (target && !target.isRead) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
        return prev.filter((item) => item._id !== id);
      });
      setPagination((p) => ({
        ...p,
        total: Math.max(0, p.total - 1),
      }));
    } catch (err) {
      console.error('[NotificationContext] Failed to delete notification:', err);
    }
  }, []);

  // ---------------------------------------------------------
  // CLEAR ALL
  // ---------------------------------------------------------
  const clearAll = useCallback(async (all = false) => {
    try {
      await notificationApi.clearAll(all);
      if (all) {
        setNotifications([]);
        setUnreadCount(0);
      } else {
        setNotifications((prev) => prev.filter((n) => !n.isRead));
      }
    } catch (err) {
      console.error('[NotificationContext] Failed to clear notifications:', err);
    }
  }, []);

  // ---------------------------------------------------------
  // INITIAL UNREAD COUNT ON AUTH CHANGE
  // ---------------------------------------------------------
  useEffect(() => {
    if (activeRole) {
      fetchUnreadCount();
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setCategoryCounts({ all: 0 });
    }
  }, [activeRole, fetchUnreadCount]);

  // ---------------------------------------------------------
  // SOCKET.IO REAL-TIME NOTIFICATIONS
  // ---------------------------------------------------------
  useEffect(() => {
    if (!activeRole) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const socketUrl =
      import.meta.env.VITE_SOCKET_URL ||
      (import.meta.env.VITE_API_URL
        ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
        : 'http://localhost:5000');

    const socket = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      if (isAdminAuthenticated) {
        socket.emit('join:admin');
      } else if (isStudentAuthenticated && student?._id) {
        socket.emit('join:student', student._id);
      }
    });

    socket.on('notification:new', (newNotif) => {
      // 1. Increment unread count
      setUnreadCount((prev) => prev + 1);

      // 2. Prepend to current notification list
      setNotifications((prev) => [newNotif, ...prev]);

      // 3. Update category counts
      if (newNotif.category) {
        setCategoryCounts((prev) => ({
          ...prev,
          all: (prev.all || 0) + 1,
          [newNotif.category]: (prev[newNotif.category] || 0) + 1,
        }));
      }

      // 4. Show non-intrusive toast notification
      const toastContent = (
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 2 }}>
            {newNotif.title}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary, #666)' }}>
            {newNotif.message}
          </div>
        </div>
      );

      if (newNotif.priority === 'critical') {
        toast.error(toastContent);
      } else if (newNotif.priority === 'high') {
        toast.warning(toastContent);
      } else {
        toast.info(toastContent);
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [activeRole, isAdminAuthenticated, isStudentAuthenticated, student?._id]);

  const value = {
    notifications,
    unreadCount,
    categoryCounts,
    loading,
    error,
    pagination,
    activeRole,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
