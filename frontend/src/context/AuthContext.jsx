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
  // RESTORE EXISTING LOGIN SESSION
  // =========================================================

  useEffect(() => {
    let mounted = true;

    const restoreSession = async () => {
      try {
        const [
          adminResult,
          studentResult,
        ] = await Promise.allSettled([
          authApi.adminMe(),
          authApi.studentMe(),
        ]);

        if (!mounted) return;

        // Restore admin session
        if (adminResult.status === 'fulfilled') {
          setAdmin(
            adminResult.value?.data?.admin || null
          );
        }

        // Restore student session
        if (studentResult.status === 'fulfilled') {
          setStudent(
            studentResult.value?.data?.student || null
          );
        }
      } catch (err) {
        console.error(
          'Session restore failed:',
          err
        );
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
      await authApi.adminLogin({
        email,
        password,
      });

      // Fetch latest admin details
      const me = await authApi.adminMe();

      const adminData =
        me?.data?.admin || null;

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
      await authApi.studentLogin({
        email,
        password,
      });

      // Fetch latest student details
      const me = await authApi.studentMe();

      const studentData =
        me?.data?.student || null;

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