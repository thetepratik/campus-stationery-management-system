import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthLayout from '../../components/common/AuthLayout';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { authApi } from '../../services/authApi';

/**
 * Usage: <ForgotPassword role="admin" /> or <ForgotPassword role="student" />
 */
const ForgotPassword = ({ role = 'student' }) => {
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const res =
        role === 'admin'
          ? await authApi.adminForgotPassword(data.email)
          : await authApi.studentForgotPassword(data.email);
      toast.success(res.message);
      setSent(true);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const loginPath = role === 'admin' ? '/admin/login' : '/login';

  return (
    <AuthLayout subtitle={role === 'admin' ? 'Admin Panel' : 'Student Portal'}>
      <h2 className="auth-heading">Forgot Password</h2>
      <p className="auth-subheading">
        {sent
          ? 'Check your inbox for a password reset link.'
          : "Enter your email and we'll send you a reset link."}
      </p>

      {!sent && (
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Input
            id="email"
            label="Email"
            type="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            register={register('email', { required: 'Email is required' })}
          />
          <Button type="submit" fullWidth loading={submitting}>
            Send Reset Link
          </Button>
        </form>
      )}

      <p className="auth-footer-link">
        <Link to={loginPath}>Back to login</Link>
      </p>
    </AuthLayout>
  );
};

export default ForgotPassword;
