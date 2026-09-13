import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import AuthLayout from '../../components/common/AuthLayout';
import Button from '../../components/common/Button';

import { authApi } from '../../services/authApi';
import { useAuth } from '../../context/AuthContext';

const OTP_LENGTH = 6;

const StudentVerifyOtp = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { completeStudentVerification } = useAuth();

  const email = location.state?.email;

  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''));
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) {
      navigate('/register');
    }
  }, [email, navigate]);

  const handleChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;

    const copy = [...digits];
    copy[index] = value;
    setDigits(copy);

    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();

    const pasted = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, OTP_LENGTH);

    if (!pasted) return;

    const copy = [...digits];

    pasted.split('').forEach((d, i) => {
      copy[i] = d;
    });

    setDigits(copy);

    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    const otp = digits.join('');

    if (otp.length !== OTP_LENGTH) {
      toast.error('Enter complete OTP');
      return;
    }

    try {
      setSubmitting(true);

      // Verify OTP
      await authApi.studentVerifyOtp(email, otp);

      // Fetch logged in student
      const me = await authApi.studentMe();

      completeStudentVerification(me.data.student);

      toast.success('Account verified successfully');

      navigate('/');

    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const onResend = async () => {
    try {
      setResending(true);

      const res = await authApi.studentResendOtp(email);

      toast.success(res.message);

    } catch (err) {
      toast.error(err.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout subtitle="Student Portal">
      <h2 className="auth-heading">Verify your account</h2>

      <p className="auth-subheading">
        Enter the 6 digit OTP sent to <strong>{email}</strong>
      </p>

      <form onSubmit={onSubmit}>

        <div className="otp-input-group" onPaste={handlePaste}>

          {digits.map((digit, index) => (

            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              maxLength={1}
              inputMode="numeric"
            />

          ))}

        </div>

        <Button
          type="submit"
          fullWidth
          loading={submitting}
        >
          Verify Account
        </Button>

      </form>

      <p className="auth-footer-link">

        Didn't receive OTP?

        <button
          type="button"
          onClick={onResend}
          disabled={resending}
          className="link-button"
        >
          {resending ? 'Sending...' : 'Resend OTP'}
        </button>

      </p>

    </AuthLayout>
  );
};

export default StudentVerifyOtp;