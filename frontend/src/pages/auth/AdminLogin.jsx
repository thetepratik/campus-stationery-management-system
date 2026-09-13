import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthLayout from '../../components/common/AuthLayout';
import Input from '../../components/common/Input';
import PasswordInput from '../../components/common/PasswordInput';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { adminLogin } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await adminLogin(data.email, data.password);
      toast.success('Welcome back!');
      navigate('/admin/dashboard');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout subtitle="Admin Panel">
      <h2 className="auth-heading">Admin Login</h2>
      <p className="auth-subheading">Sign in to manage your campus stationery shop.</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input
          id="email"
          label="Email"
          type="email"
          placeholder="admin@campusstationery.com"
          error={errors.email?.message}
          register={register('email', { required: 'Email is required' })}
        />
        <PasswordInput
          id="password"
          label="Password"
          placeholder="Enter your password"
          error={errors.password?.message}
          register={register('password', { required: 'Password is required' })}
        />

        <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-5)' }}>
          <label className="flex items-center gap-2" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            <input type="checkbox" {...register('rememberMe')} /> Remember me
          </label>
          <Link to="/admin/forgot-password" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-primary)', fontWeight: 600 }}>
            Forgot password?
          </Link>
        </div>

        <Button type="submit" fullWidth loading={submitting}>
          Login
        </Button>
      </form>

      <p className="auth-footer-link">
        Student? <Link to="/login">Go to student portal</Link>
      </p>
    </AuthLayout>
  );
};

export default AdminLogin;
