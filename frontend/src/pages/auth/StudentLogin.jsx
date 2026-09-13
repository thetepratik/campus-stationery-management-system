import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthLayout from '../../components/common/AuthLayout';
import Input from '../../components/common/Input';
import PasswordInput from '../../components/common/PasswordInput';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';

const StudentLogin = () => {
  const navigate = useNavigate();
  const { studentLogin } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await studentLogin(data.email, data.password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      if (err.statusCode === 403) {
        toast.info('Please verify your account first.');
        navigate('/verify-otp', { state: { email: data.email } });
      } else {
        toast.error(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout subtitle="Student Portal">
      <h2 className="auth-heading">Welcome back</h2>
      <p className="auth-subheading">Sign in to browse and order stationery.</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input
          id="email"
          label="Email"
          type="email"
          placeholder="you@college.edu"
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
          <span />
          <Link to="/forgot-password" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-primary)', fontWeight: 600 }}>
            Forgot password?
          </Link>
        </div>

        <Button type="submit" fullWidth loading={submitting}>
          Login
        </Button>
      </form>

      <p className="auth-footer-link">
        New here? <Link to="/register">Create an account</Link>
      </p>
      <p className="auth-footer-link">
        Shopkeeper? <Link to="/admin/login">Go to admin panel</Link>
      </p>
    </AuthLayout>
  );
};

export default StudentLogin;
