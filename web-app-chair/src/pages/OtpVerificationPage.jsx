import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../CSS/OtpVerification.css';
import { FaShieldAlt, FaArrowLeft, FaEnvelope } from 'react-icons/fa';
import Loader from '../component/Loader';

const OtpVerificationPage = ({ onLogin }) => {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
    const [canResend, setCanResend] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const inputRefs = useRef([]);

    const { email, tempUserId } = location.state || {};

    useEffect(() => {
        if (!email || !tempUserId) {
            navigate('/login');
            return;
        }

        // Timer countdown
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    setCanResend(true);
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [email, tempUserId, navigate]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleOtpChange = (index, value) => {
        if (value.length > 1) return;
        
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        setError('');

        // Auto focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto submit when all fields are filled
        if (newOtp.every(digit => digit !== '') && newOtp.join('').length === 6) {
            handleVerifyOtp(newOtp.join(''));
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');
        if (pastedData.length === 6) {
            const newOtp = pastedData.split('');
            setOtp(newOtp);
            handleVerifyOtp(pastedData);
        }
    };

    const handleVerifyOtp = async (otpCode = null) => {
        const code = otpCode || otp.join('');
        if (code.length !== 6) {
            setError('Please enter all 6 digits');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password: location.state.password,
                    otpCode: code
                }),
            });

            const data = await response.json();

            if (response.ok) {
                // Store the same keys as LoginPage to keep app state consistent
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('userProfile', JSON.stringify(data.user));
                if (data.user?.photoURL) {
                    localStorage.setItem('userPhotoURL', data.user.photoURL);
                }

                // Pass a single object with token merged into user (matches LoginPage pattern)
                onLogin({ ...data.user, token: data.token });

                // Navigate to the main dashboard route (root path)
                navigate('/');
            } else {
                setError(data.msg || 'Invalid OTP code');
                setOtp(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();
            }
        } catch (error) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (!canResend) return;

        setLoading(true);
        setError('');

        try {
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password: location.state.password
                }),
            });

            const data = await response.json();

            if (response.ok && data.requiresOtp) {
                setTimeLeft(600);
                setCanResend(false);
                setOtp(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();
                setError('');
            } else {
                setError('Failed to resend OTP. Please try again.');
            }
        } catch (error) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleBackToLogin = () => {
        navigate('/login');
    };

    return (
        <div className="otp-container">
            <div className="otp-card">
                <button className="back-button" onClick={handleBackToLogin}>
                    <FaArrowLeft />
                </button>

                <div className="otp-header">
                    <div className="otp-icon">
                        <FaShieldAlt />
                    </div>
                    <h2>Two-Factor Authentication</h2>
                    <p>We've sent a 6-digit verification code to</p>
                    <div className="email-display">
                        <FaEnvelope />
                        <span>{email}</span>
                    </div>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); handleVerifyOtp(); }} className="otp-form">
                    {error && <div className="error-message">{error}</div>}
                    
                    <div className="otp-inputs">
                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                ref={el => inputRefs.current[index] = el}
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]"
                                maxLength="1"
                                value={digit}
                                onChange={(e) => handleOtpChange(index, e.target.value.replace(/\D/g, ''))}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                onPaste={handlePaste}
                                className={`otp-input ${error ? 'error' : ''}`}
                                disabled={loading}
                                autoFocus={index === 0}
                            />
                        ))}
                    </div>

                    <div className="otp-timer">
                        {timeLeft > 0 ? (
                            <span>Code expires in {formatTime(timeLeft)}</span>
                        ) : (
                            <span className="expired">Code has expired</span>
                        )}
                    </div>

                    <button 
                        type="submit" 
                        className="verify-button"
                        disabled={loading || otp.some(digit => !digit)}
                    >
                        {loading ? 'Verifying...' : 'Verify Code'}
                    </button>

                    <div className="resend-section">
                        <p>Didn't receive the code?</p>
                        <button
                            type="button"
                            className={`resend-button ${canResend ? 'active' : 'disabled'}`}
                            onClick={handleResendOtp}
                            disabled={!canResend || loading}
                        >
                            {canResend ? 'Resend Code' : `Resend in ${formatTime(timeLeft)}`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default OtpVerificationPage;
