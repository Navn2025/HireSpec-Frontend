/**
 * Register Page - Biometric Enrollment with OTP Verification
 * Black & White Theme
 * Flow: Info -> Email -> OTP -> Face Capture (3 angles) -> Final Form
 */

import {useState, useRef, useCallback, useEffect} from 'react';
import {useNavigate, Link} from 'react-router-dom';
import {useAuth} from '../contexts/AuthContext';
import ScannerOverlay from '../components/ScannerOverlay';
import
{
    UserIcon,
    LockIcon,
    MailIcon,
    CameraIcon,
    CheckIcon,
    ChevronDownIcon,
    ShieldIcon,
    KeyIcon,
    ArrowLeftIcon
} from '../components/Icons';
import './Auth.css';

// Registration steps
const STEPS={
    INFO: 0,
    EMAIL: 1,
    OTP: 2,
    FACE_FRONT: 3,
    FACE_LEFT: 4,
    FACE_RIGHT: 5,
    FORM: 6
};

// Role options
const ROLE_OPTIONS=[
    {value: 'candidate', label: 'Candidate', description: 'Job seeker looking for opportunities'},
    {value: 'company_hr', label: 'Company HR', description: 'Manage hiring on behalf of company'},
    {value: 'company_admin', label: 'Company Admin', description: 'Full company access and control'}
];

export default function Register()
{
    const navigate=useNavigate();
    const {register, sendOtp, verifyOtp, bypassMode}=useAuth();

    // Step management
    const [step, setStep]=useState(STEPS.INFO);

    // Form data
    const [email, setEmail]=useState('');
    const [otp, setOtp]=useState('');
    const [emailVerified, setEmailVerified]=useState(false);
    const [role, setRole]=useState('candidate');
    const [isRoleOpen, setIsRoleOpen]=useState(false);
    const [username, setUsername]=useState('');
    const [password, setPassword]=useState('');
    const [confirmPassword, setConfirmPassword]=useState('');

    // Face capture
    const [images, setImages]=useState([]);
    const videoRef=useRef(null);
    const canvasRef=useRef(null);
    const streamRef=useRef(null);

    // UI state
    const [loading, setLoading]=useState(false);
    const [error, setError]=useState('');

    // Reattach stream to video element when step changes (for camera steps)
    useEffect(() =>
    {
        if (step>=STEPS.FACE_FRONT&&step<=STEPS.FACE_RIGHT&&streamRef.current&&videoRef.current)
        {
            videoRef.current.srcObject=streamRef.current;
        }
    }, [step]);

    // Start camera
    const startCamera=async () =>
    {
        try
        {
            const stream=await navigator.mediaDevices.getUserMedia({
                video: {facingMode: 'user', width: 640, height: 480}
            });
            if (videoRef.current)
            {
                videoRef.current.srcObject=stream;
                streamRef.current=stream;
            }
        } catch (err)
        {
            setError('Could not access camera. Please allow camera permissions.');
        }
    };

    // Stop camera
    const stopCamera=() =>
    {
        if (streamRef.current)
        {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current=null;
        }
    };

    // Capture face image
    const captureImage=useCallback(() =>
    {
        if (!videoRef.current||!canvasRef.current) return;

        const canvas=canvasRef.current;
        const video=videoRef.current;
        canvas.width=video.videoWidth;
        canvas.height=video.videoHeight;
        const ctx=canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);

        const imageBase64=canvas.toDataURL('image/jpeg');
        setImages(prev => [...prev, imageBase64]);

        // Move to next step
        if (step===STEPS.FACE_RIGHT)
        {
            stopCamera();
            setStep(STEPS.FORM);
        } else
        {
            setStep(prev => prev+1);
        }
    }, [step]);

    // Handle send OTP
    const handleSendOtp=async () =>
    {
        if (!email) return;
        setLoading(true);
        setError('');

        try
        {
            await sendOtp(email, 'register');
            setStep(STEPS.OTP);
        } catch (err)
        {
            setError(err.message||'Failed to send OTP');
        } finally
        {
            setLoading(false);
        }
    };

    // Handle verify OTP
    const handleVerifyOtp=async () =>
    {
        if (otp.length!==6) return;
        setLoading(true);
        setError('');

        try
        {
            const result=await verifyOtp(email, otp, 'register');
            if (result.verified)
            {
                setEmailVerified(true);
                setStep(STEPS.FACE_FRONT);
                setTimeout(startCamera, 100);
            } else
            {
                setError('Invalid OTP. Please try again.');
            }
        } catch (err)
        {
            setError(err.message||'OTP verification failed');
        } finally
        {
            setLoading(false);
        }
    };

    // Handle final registration
    const handleRegister=async (e) =>
    {
        e.preventDefault();

        if (!bypassMode&&images.length<3)
        {
            setError('Please capture all 3 face angles');
            return;
        }

        if (password!==confirmPassword)
        {
            setError('Passwords do not match');
            return;
        }

        if (password.length<6)
        {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        setError('');

        try
        {
            await register({
                username,
                email,
                password,
                confirmPassword,
                role,
                images: bypassMode? []:images
            });
            navigate('/login');
        } catch (err)
        {
            setError(err.message||'Registration failed');
        } finally
        {
            setLoading(false);
        }
    };

    // Retake photos
    const retakePhotos=() =>
    {
        setImages([]);
        setStep(STEPS.FACE_FRONT);
        setTimeout(startCamera, 100);
    };

    // Go back
    const goBack=() =>
    {
        if (step>STEPS.INFO)
        {
            if (step>=STEPS.FACE_FRONT&&step<=STEPS.FACE_RIGHT)
            {
                stopCamera();
            }
            setStep(prev => prev-1);
            setError('');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-glow"></div>

            {/* Back button for camera steps */}
            {step>STEPS.INFO&&step!==STEPS.FORM&&(
                <button className="back-button" onClick={goBack}>
                    <ArrowLeftIcon size={16} />
                    <span>Back</span>
                </button>
            )}

            {/* Step 0: Info */}
            {step===STEPS.INFO&&(
                <div className="auth-card">
                    <div className="auth-logo">
                        <ShieldIcon size={28} />
                    </div>
                    <div className="auth-header">
                        <h1>Biometric Enrollment</h1>
                        <p>Create your secure identity profile</p>
                    </div>

                    {/* Role Selection */}
                    <div className="form-group">
                        <label>Register as</label>
                        <div className="role-dropdown">
                            <button
                                type="button"
                                className="role-trigger"
                                onClick={() => setIsRoleOpen(!isRoleOpen)}
                            >
                                <div className="role-selected">
                                    <span className="role-label">
                                        {ROLE_OPTIONS.find(r => r.value===role)?.label}
                                    </span>
                                    <span className="role-desc">
                                        {ROLE_OPTIONS.find(r => r.value===role)?.description}
                                    </span>
                                </div>
                                <ChevronDownIcon
                                    size={18}
                                    className={isRoleOpen? 'rotated':''}
                                />
                            </button>

                            {isRoleOpen&&(
                                <div className="role-options">
                                    {ROLE_OPTIONS.map(option => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            className={`role-option ${role===option.value? 'selected':''}`}
                                            onClick={() =>
                                            {
                                                setRole(option.value);
                                                setIsRoleOpen(false);
                                            }}
                                        >
                                            <div>
                                                <span className="role-label">{option.label}</span>
                                                <span className="role-desc">{option.description}</span>
                                            </div>
                                            {role===option.value&&<CheckIcon size={16} />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Process steps - only show in normal mode */}
                    {!bypassMode&&(
                        <div className="process-steps">
                            {[
                                'Email verification via OTP',
                                'Front facing scan',
                                'Left profile capture',
                                'Right profile capture'
                            ].map((text, i) => (
                                <div key={i} className="process-step">
                                    <div className="step-number">{i+1}</div>
                                    <span>{text}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {bypassMode&&(
                        <div style={{
                            background: '#fef3c7',
                            color: '#92400e',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            marginBottom: '16px'
                        }}>
                            Demo Mode: Face capture and OTP verification are skipped.
                        </div>
                    )}

                    <button
                        type="button"
                        className="btn-primary"
                        onClick={() => setStep(bypassMode? STEPS.FORM:STEPS.EMAIL)}
                    >
                        Start Process
                    </button>

                    <div className="auth-footer">
                        <Link to="/login">Already have an account? Sign in</Link>
                    </div>
                </div>
            )}

            {/* Step 1: Email */}
            {step===STEPS.EMAIL&&(
                <div className="auth-card">
                    <div className="auth-icon">
                        <MailIcon size={24} />
                    </div>
                    <div className="auth-header">
                        <h2>Email Verification</h2>
                        <p>We'll send a verification code to your email</p>
                    </div>

                    {error&&<div className="error-message">{error}</div>}

                    <div className="form-group">
                        <label>Email Address</label>
                        <div className="input-wrapper">
                            <MailIcon size={18} />
                            <input
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <button
                        type="button"
                        className="btn-primary"
                        onClick={handleSendOtp}
                        disabled={!email||loading}
                    >
                        {loading? 'Sending...':'Send Verification Code'}
                    </button>

                    <button
                        type="button"
                        className="btn-text"
                        onClick={() => setStep(STEPS.INFO)}
                    >
                        Go back
                    </button>
                </div>
            )}

            {/* Step 2: OTP */}
            {step===STEPS.OTP&&(
                <div className="auth-card">
                    <div className="auth-icon">
                        <KeyIcon size={24} />
                    </div>
                    <div className="auth-header">
                        <h2>Enter Code</h2>
                        <p>6-digit code sent to <strong>{email}</strong></p>
                    </div>

                    {error&&<div className="error-message">{error}</div>}

                    <div className="form-group">
                        <label>Verification Code</label>
                        <div className="input-wrapper">
                            <KeyIcon size={18} />
                            <input
                                type="text"
                                placeholder="000000"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                maxLength={6}
                                disabled={loading}
                                className="otp-input"
                            />
                        </div>
                    </div>

                    <button
                        type="button"
                        className="btn-primary"
                        onClick={handleVerifyOtp}
                        disabled={otp.length!==6||loading}
                    >
                        {loading? 'Verifying...':'Verify Code'}
                    </button>

                    <button
                        type="button"
                        className="btn-text"
                        onClick={handleSendOtp}
                        disabled={loading}
                    >
                        Resend code
                    </button>
                </div>
            )}

            {/* Step 3: Front Face Capture */}
            {step===STEPS.FACE_FRONT&&(
                <div className="auth-card camera-card">
                    <div className="camera-header">
                        <div>
                            <h2>Front Profile</h2>
                            <p>Look directly at the camera</p>
                        </div>
                        <div className="capture-progress">
                            <div className={`progress-dot active current`} />
                            <div className={`progress-dot`} />
                            <div className={`progress-dot`} />
                        </div>
                    </div>

                    <div className="camera-viewport">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="camera-video"
                        />
                        <canvas ref={canvasRef} style={{display: 'none'}} />
                        <ScannerOverlay
                            scanning={true}
                            status="scanning"
                            message="LOOK STRAIGHT"
                        />
                    </div>

                    <div className="camera-actions">
                        <button
                            type="button"
                            className="btn-capture"
                            onClick={captureImage}
                        >
                            <CameraIcon size={20} />
                            <span>Capture Front</span>
                        </button>
                    </div>

                    <div className="camera-hint">
                        Ensure your face is well-lit and centered
                    </div>
                </div>
            )}

            {/* Step 4: Left Face Capture */}
            {step===STEPS.FACE_LEFT&&(
                <div className="auth-card camera-card">
                    <div className="camera-header">
                        <div>
                            <h2>Left Profile</h2>
                            <p>Turn your head slightly to the left</p>
                        </div>
                        <div className="capture-progress">
                            <div className={`progress-dot active`} />
                            <div className={`progress-dot active current`} />
                            <div className={`progress-dot`} />
                        </div>
                    </div>

                    <div className="camera-viewport">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="camera-video"
                        />
                        <canvas ref={canvasRef} style={{display: 'none'}} />
                        <ScannerOverlay
                            scanning={true}
                            status="scanning"
                            message="TURN LEFT"
                        />
                    </div>

                    <div className="camera-actions">
                        <button
                            type="button"
                            className="btn-capture"
                            onClick={captureImage}
                        >
                            <CameraIcon size={20} />
                            <span>Capture Left</span>
                        </button>
                    </div>

                    <div className="camera-hint">
                        Turn your head about 30 degrees to the left
                    </div>
                </div>
            )}

            {/* Step 5: Right Face Capture */}
            {step===STEPS.FACE_RIGHT&&(
                <div className="auth-card camera-card">
                    <div className="camera-header">
                        <div>
                            <h2>Right Profile</h2>
                            <p>Turn your head slightly to the right</p>
                        </div>
                        <div className="capture-progress">
                            <div className={`progress-dot active`} />
                            <div className={`progress-dot active`} />
                            <div className={`progress-dot active current`} />
                        </div>
                    </div>

                    <div className="camera-viewport">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="camera-video"
                        />
                        <canvas ref={canvasRef} style={{display: 'none'}} />
                        <ScannerOverlay
                            scanning={true}
                            status="scanning"
                            message="TURN RIGHT"
                        />
                    </div>

                    <div className="camera-actions">
                        <button
                            type="button"
                            className="btn-capture"
                            onClick={captureImage}
                        >
                            <CameraIcon size={20} />
                            <span>Capture Right</span>
                        </button>
                    </div>

                    <div className="camera-hint">
                        Turn your head about 30 degrees to the right
                    </div>
                </div>
            )}

            {/* Step 6: Final Form */}
            {step===STEPS.FORM&&(
                <div className="auth-card">
                    <div className="auth-icon success">
                        <CheckIcon size={24} />
                    </div>
                    <div className="auth-header">
                        <h2>Complete Registration</h2>
                        <p>Face captured successfully. Finalize your account.</p>
                    </div>

                    {/* Captured images preview */}
                    {images.length>0&&(
                        <div className="captured-images">
                            {images.map((img, i) => (
                                <div key={i} className="captured-image">
                                    <img src={img} alt={`Capture ${i+1}`} />
                                </div>
                            ))}
                        </div>
                    )}

                    <button
                        type="button"
                        className="btn-text"
                        onClick={retakePhotos}
                        style={{marginBottom: '16px'}}
                    >
                        Retake photos
                    </button>

                    {/* Email verified badge */}
                    <div className="verified-badge">
                        <CheckIcon size={14} />
                        <span>{email}</span>
                        <span className="verified-text">Verified</span>
                    </div>

                    {error&&<div className="error-message">{error}</div>}

                    <form onSubmit={handleRegister}>
                        <div className="form-group">
                            <label>Username</label>
                            <div className="input-wrapper">
                                <UserIcon size={18} />
                                <input
                                    type="text"
                                    placeholder="Choose a username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    minLength={3}
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Password</label>
                            <div className="input-wrapper">
                                <LockIcon size={18} />
                                <input
                                    type="password"
                                    placeholder="Create a password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Confirm Password</label>
                            <div className="input-wrapper">
                                <LockIcon size={18} />
                                <input
                                    type="password"
                                    placeholder="Confirm your password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={loading}
                        >
                            {loading? 'Creating Account...':'Complete Registration'}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
