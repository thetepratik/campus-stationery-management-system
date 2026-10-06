import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';

import { authApi } from '../services/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);


  // =========================================================
  // RESTORE EXISTING LOGIN SESSION (ROLE-AWARE)
  // =========================================================

  useEffect(() => {
    let mounted = true;

    const restoreSession = async () => {
      const savedRole = localStorage.getItem('cs_auth_role');

      // If no session exists in localStorage, do NOT call protected endpoints.
      // This prevents unnecessary 401 errors for unauthenticated visitors.
      if (!savedRole) {
        if (mounted) {
          setAdmin(null);
          setStudent(null);
          setLoading(false);
        }
        return;
      }

      try {
        if (savedRole === 'admin') {
          // Restore admin session only
          try {
            const adminRes = await authApi.adminMe();
            if (mounted) {
              setAdmin(adminRes?.data?.admin || null);
            }
          } catch (err) {
            // Token expired or invalid session
            if (mounted) {
              setAdmin(null);
              localStorage.removeItem('cs_auth_role');
            }
          }
        } else if (savedRole === 'student') {
          // Restore student session only
          try {
            const studentRes = await authApi.studentMe();
            if (mounted) {
              setStudent(studentRes?.data?.student || null);
            }
          } catch (err) {
            // Token expired or invalid session
            if (mounted) {
              setStudent(null);
              localStorage.removeItem('cs_auth_role');
            }
          }
        }
      } catch (err) {
        console.error('Session restore failed:', err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      mounted = false;
    };
  }, []);


  // =========================================================
  // ADMIN LOGIN
  // =========================================================

  const adminLogin = useCallback(
    async (email, password) => {
      const res = await authApi.adminLogin({
        email,
        password,
      });

      // Mark admin session in localStorage
      localStorage.setItem('cs_auth_role', 'admin');

      // Use returned admin or fetch latest details
      let adminData = res?.data?.admin || null;
      if (!adminData) {
        const me = await authApi.adminMe();
        adminData = me?.data?.admin || null;
      }

      setAdmin(adminData);
      return adminData;
    },
    []
  );


  // =========================================================
  // ADMIN LOGOUT
  // =========================================================

  const adminLogout = useCallback(
    async () => {
      try {
        await authApi.adminLogout();
      } finally {
        localStorage.removeItem('cs_auth_role');
        setAdmin(null);
      }
    },
    []
  );


  // =========================================================
  // STUDENT LOGIN
  // =========================================================

  const studentLogin = useCallback(
    async (email, password) => {
      const res = await authApi.studentLogin({
        email,
        password,
      });

      // Mark student session in localStorage
      localStorage.setItem('cs_auth_role', 'student');

      // Use returned student or fetch latest details
      let studentData = res?.data?.student || null;
      if (!studentData) {
        const me = await authApi.studentMe();
        studentData = me?.data?.student || null;
      }

      setStudent(studentData);
      return studentData;
    },
    []
  );


  // =========================================================
  // STUDENT LOGOUT
  // =========================================================

  const studentLogout = useCallback(
    async () => {
      try {
        await authApi.studentLogout();
      } finally {
        localStorage.removeItem('cs_auth_role');
        setStudent(null);
      }
    },
    []
  );


  // =========================================================
  // STUDENT PROFILE UPDATE
  // =========================================================

  const updateStudentProfile = useCallback(
    async (profileData) => {
      const response =
        await authApi.studentUpdateProfile(
          profileData
        );

      const updatedStudent =
        response?.data?.student || null;

      if (updatedStudent) {
        setStudent(updatedStudent);
      }

      return updatedStudent;
    },
    []
  );


  // =========================================================
  // OTP VERIFICATION
  // =========================================================

  const completeStudentVerification =
    useCallback((studentData) => {
      localStorage.setItem('cs_auth_role', 'student');
      setStudent(studentData);
    }, []);


  // =========================================================
  // CONTEXT VALUE
  // =========================================================

  const value = {
    // User data
    admin,
    student,

    // Loading
    loading,

    // Authentication status
    isAdminAuthenticated: !!admin,
    isStudentAuthenticated: !!student,

    // Admin
    adminLogin,
    adminLogout,
    updateAdminProfile: (adminData) => setAdmin((prev) => (prev ? { ...prev, ...adminData } : adminData)),

    // Student
    studentLogin,
    studentLogout,

    // Student profile
    updateStudentProfile,

    // OTP
    completeStudentVerification,
  };


  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};


// =========================================================
// CUSTOM HOOK
// =========================================================

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used within AuthProvider'
    );
  }

  return context;
};