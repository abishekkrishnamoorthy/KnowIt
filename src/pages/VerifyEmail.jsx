import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Mail, RefreshCcw, ShieldCheck } from 'lucide-react';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const emailFromQuery = searchParams.get('email') || '';
  const navigate = useNavigate();
  const { verifyEmailOtp, resendVerificationCode } = useAuth();

  const [otpValues, setOtpValues] = useState(Array(OTP_LENGTH).fill(''));
  const [isVerifying, setIsVerifying] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusVariant, setStatusVariant] = useState('info');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [email] = useState(emailFromQuery);

  // Show initial success message when page loads
  useEffect(() => {
    if (email) {
      setStatusMessage('A verification code has been sent to your email. Please check your inbox.');
      setStatusVariant('success');
    }
  }, [email]);

  const canSubmit = useMemo(() => otpValues.every((value) => value.trim().length === 1), [otpValues]);

  useEffect(() => {
    if (!email) {
      setStatusMessage('Missing email address. Please start the signup process again.');
      setStatusVariant('error');
    }
  }, [email]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleOtpChange = (index, value) => {
    if (!/^[0-9]?$/.test(value)) return;

    const nextValues = [...otpValues];
    nextValues[index] = value;
    setOtpValues(nextValues);

    if (value && index < OTP_LENGTH - 1) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !otpValues[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email || !canSubmit) return;

    setIsVerifying(true);
    setStatusMessage('');

    try {
      const otp = otpValues.join('');
      const result = await verifyEmailOtp(email, otp);

      switch (result.status) {
        case 'success':
          setStatusVariant('success');
          setStatusMessage('Email verified! Redirecting to dashboard...');
          setTimeout(() => navigate('/dashboard'), 1500);
          break;
        case 'expired':
          setStatusVariant('error');
          setStatusMessage('This code has expired. Please request a new one.');
          break;
        case 'invalid':
          setStatusVariant('error');
          setStatusMessage('Incorrect code. Please try again.');
          break;
        case 'locked':
          setStatusVariant('error');
          setStatusMessage('Too many attempts. Please try again later.');
          break;
        case 'not_found':
          setStatusVariant('error');
          setStatusMessage('No verification request found. Please sign up again.');
          break;
        default:
          setStatusVariant('error');
          setStatusMessage('Unable to verify code. Please try again.');
      }
    } catch (error) {
      setStatusVariant('error');
      setStatusMessage(error.message || 'Failed to verify code.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setStatusMessage('');
    try {
      await resendVerificationCode(email);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setStatusVariant('success');
      setStatusMessage('A new code has been sent to your email.');
    } catch (error) {
      setStatusVariant('error');
      setStatusMessage(error.message || 'Unable to resend code right now.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        <button
          onClick={() => navigate('/signup')}
          className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Signup
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl mb-4">
              <Mail className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Verify your email</h1>
            <p className="text-gray-600">
              Enter the 6-digit code sent to{' '}
              <span className="font-semibold text-gray-900">{email || 'your email'}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-between gap-2 mb-4">
              {otpValues.map((value, index) => (
                <input
                  key={index}
                  id={`otp-input-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  className="w-12 h-14 text-center text-2xl font-semibold border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  value={value}
                  onChange={(event) => handleOtpChange(index, event.target.value)}
                  onKeyDown={(event) => handleOtpKeyDown(index, event)}
                />
              ))}
            </div>

            {statusMessage && (
              <div
                className={`rounded-xl p-4 text-sm flex items-center space-x-2 ${
                  statusVariant === 'success'
                    ? 'bg-green-50 text-green-700'
                    : statusVariant === 'error'
                    ? 'bg-red-50 text-red-700'
                    : 'bg-blue-50 text-blue-700'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{statusMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit || isVerifying}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifying ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between text-sm text-gray-600">
            <span>Didn’t receive a code?</span>
            <button
              onClick={handleResend}
              disabled={resendCooldown > 0}
              className="inline-flex items-center text-blue-600 font-semibold hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCcw className="w-4 h-4 mr-1" />
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

