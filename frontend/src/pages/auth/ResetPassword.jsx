import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthLayout from '../../components/common/AuthLayout';
import PasswordInput from '../../components/common/PasswordInput';
import Button from '../../components/common/Button';
import { authApi } from '../../services/authApi';

/**
 * Usage: <ResetPassword role="admin" /> or <ResetPassword role="student" />
 * Route: /admin/reset-password/:token or /reset-password/:token
 */
const ResetPassword = ({ role = 'student' }) => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const password = watch('password');
  const loginPath = role === 'admin' ? '/admin/login' : '/login';

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const res =
        role === 'admin'
          ? await authApi.adminResetPassword(token, data.password)
          : await authApi.studentResetPassword(token, data.password);
      toast.success(res.message);
      navigate(loginPath);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout subtitle={role === 'admin' ? 'Admin Panel' : 'Student Portal'}>
      <h2 className="auth-heading">Reset Password</h2>
      <p className="auth-subheading">Enter a new password for your account.</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <PasswordInput
          id="password"
          label="New Password"
          placeholder="At least 6 characters"
          error={errors.password?.message}
          register={register('password', {
            required: 'Password is required',
            minLength: { value: 6, message: 'Password must be at least 6 characters' },
          })}
        />
        <PasswordInput
          id="confirmPassword"
          label="Confirm New Password"
          placeholder="Re-enter new password"
          error={errors.confirmPassword?.message}
          register={register('confirmPassword', {
            required: 'Please confirm your password',
            validate: (value) => value === password || 'Passwords do not match',
          })}
        />
        <Button type="submit" fullWidth loading={submitting}>
          Reset Password
        </Button>
      </form>

      <p className="auth-footer-link">
        <Link to={loginPath}>Back to login</Link>
      </p>
    </AuthLayout>
  );
};

export default ResetPassword;
