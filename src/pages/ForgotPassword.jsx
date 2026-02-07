import {useState} from 'react';
import {useNavigate, Link} from 'react-router-dom';
import './ForgotPassword.css';

export default function ForgotPassword()
{
    const [step, setStep]=useState('email'); // 'email', 'otp', 'reset'
    const [formData, setFormData]=useState({
        email: '',
        otp: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError]=useState('');
    const [loading, setLoading]=useState(false);
    const navigate=useNavigate();

    const handleChange=(e) =>
    {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSendOtp=async (e) =>
    {
        e.preventDefault();
        setLoading(true);
        setError('');

        try
        {
            const response=await fetch('http://localhost:5001/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({email: formData.email}),
            });

            const data=await response.json();

            if (!response.ok)
            {
                throw new Error(data.message||'Failed to send verification code');
            }

            setStep('otp');
        } catch (err)
        {
            setError(err.message||'Failed to send code. Please try again.');
        } finally
        {
            setLoading(false);
        }
    };

    const handleVerifyOtp=async (e) =>
    {
        e.preventDefault();
        setLoading(true);
        setError('');

        try
        {
            const response=await fetch('http://localhost:5001/api/auth/verify-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: formData.email,
                    otp: formData.otp,
                    purpose: 'forgot_password'
                }),
            });

            const data=await response.json();

            if (!response.ok)
            {
                throw new Error(data.message||'Invalid verification code');
            }

            if (data.verified)
            {
                setStep('reset');
            }
        } catch (err)
        {
            setError(err.message||'Verification failed. Please try again.');
        } finally
        {
            setLoading(false);
        }
    };

    const handleResetPassword=async (e) =>
    {
        e.preventDefault();

        if (formData.password.length<6)
        {
            setError('Password must be at least 6 characters');
            return;
        }

        if (formData.password!==formData.confirmPassword)
        {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        setError('');

        try
        {
            const response=await fetch('http://localhost:5001/api/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    confirmPassword: formData.confirmPassword
                }),
            });

            const data=await response.json();

            if (!response.ok)
            {
                throw new Error(data.message||'Password reset failed');
            }

            // Redirect to login page
            navigate('/login');
        } catch (err)
        {
            setError(err.message||'Failed to reset password. Please try again.');
        } finally
        {
            setLoading(false);
        }
    };

    return (
        <div className="forgot-password-container">
            <div className="forgot-password-card">
                <div className="forgot-password-header">
                    <h1>Password Recovery</h1>
                    <p>Reset your account password</p>
                </div>

                {error&&(
                    <div className="error-message">
                        {error}
                    </div>
                )}

                {/* Step 1: Email */}
                {step==='email'&&(
                    <form onSubmit={handleSendOtp} className="forgot-password-form">
                        <div className="step-indicator">Step 1 of 3</div>

                        <div className="form-group">
                            <label htmlFor="email">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="your.email@example.com"
                                required
                                disabled={loading}
                            />
                            <small>We'll send a verification code to your email</small>
                        </div>

                        <button
                            type="submit"
                            className="submit-button"
                            disabled={loading}
                        >
                            {loading? 'Sending...':'Send Reset Code'}
                        </button>

                        <Link to="/login" className="back-link">
                            Back to login
                        </Link>
                    </form>
                )}

                {/* Step 2: OTP */}
                {step==='otp'&&(
                    <form onSubmit={handleVerifyOtp} className="forgot-password-form">
                        <div className="step-indicator">Step 2 of 3</div>

                        <div className="form-group">
                            <label htmlFor="otp">Verification Code</label>
                            <input
                                type="text"
                                id="otp"
                                name="otp"
                                value={formData.otp}
                                onChange={handleChange}
                                placeholder="000000"
                                maxLength={6}
                                required
                                disabled={loading}
                            />
                            <small>Enter the 6-digit code sent to {formData.email}</small>
                        </div>

                        <button
                            type="submit"
                            className="submit-button"
                            disabled={loading||formData.otp.length!==6}
                        >
                            {loading? 'Verifying...':'Verify Code'}
                        </button>

                        <button
                            type="button"
                            className="back-link"
                            onClick={() => setStep('email')}
                        >
                            Change email
                        </button>
                    </form>
                )}

                {/* Step 3: Reset Password */}
                {step==='reset'&&(
                    <form onSubmit={handleResetPassword} className="forgot-password-form">
                        <div className="step-indicator">Step 3 of 3</div>

                        <div className="form-group">
                            <label htmlFor="password">New Password</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Create a strong password"
                                required
                                disabled={loading}
                                minLength={6}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword">Confirm New Password</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Re-enter your password"
                                required
                                disabled={loading}
                                minLength={6}
                            />
                        </div>

                        <button
                            type="submit"
                            className="submit-button"
                            disabled={loading}
                        >
                            {loading? 'Resetting...':'Reset Password'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
