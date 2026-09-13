import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthLayout from '../../components/common/AuthLayout';
import Input from '../../components/common/Input';
import PasswordInput from '../../components/common/PasswordInput';
import Button from '../../components/common/Button';
import { authApi } from '../../services/authApi';

const StudentRegister = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const password = watch('password');

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const payload = {
        name: data.name,
        email: data.email,
        password: data.password,
        rollNumber: data.rollNumber,
        department: data.department,
        mobile: data.mobile,
      };
      const res = await authApi.studentRegister(payload);
      toast.success(res.message);
      navigate('/verify-otp', { state: { email: res.data.email } });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout subtitle="Student Portal">
      <h2 className="auth-heading">Create your account</h2>
      <p className="auth-subheading">Register to start ordering from the campus store.</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input
          id="name"
          label="Full Name"
          placeholder="Rahul Sharma"
          error={errors.name?.message}
          register={register('name', { required: 'Name is required' })}
        />
        <Input
          id="email"
          label="Email"
          type="email"
          placeholder="you@college.edu"
          error={errors.email?.message}
          register={register('email', { required: 'Email is required' })}
        />
        <Input
          id="rollNumber"
          label="Roll Number"
          placeholder="23CS345"
          error={errors.rollNumber?.message}
          register={register('rollNumber', { required: 'Roll number is required' })}
        />
        <Input
          id="department"
          label="Department (optional)"
          placeholder="Computer Science"
          error={errors.department?.message}
          register={register('department')}
        />
        <Input
          id="mobile"
          label="Mobile Number (optional)"
          placeholder="9876543210"
          error={errors.mobile?.message}
          register={register('mobile', {
            pattern: { value: /^[0-9]{10}$/, message: 'Mobile number must be 10 digits' },
          })}
        />
        <PasswordInput
          id="password"
          label="Password"
          placeholder="At least 6 characters"
          error={errors.password?.message}
          register={register('password', {
            required: 'Password is required',
            minLength: { value: 6, message: 'Password must be at least 6 characters' },
          })}
        />
        <PasswordInput
          id="confirmPassword"
          label="Confirm Password"
          placeholder="Re-enter your password"
          error={errors.confirmPassword?.message}
          register={register('confirmPassword', {
            required: 'Please confirm your password',
            validate: (value) => value === password || 'Passwords do not match',
          })}
        />

        <Button type="submit" fullWidth loading={submitting}>
          Create Account
        </Button>
      </form>

      <p className="auth-footer-link">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </AuthLayout>
  );
};

export default StudentRegister;