/**
 * Login Page - Password & Biometric Face Authentication
 * Black & White Theme
 */

import { useState, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ScannerOverlay from '../components/ScannerOverlay';
import { 
    UserIcon, 
    LockIcon, 
    ArrowRightIcon, 
    ShieldIcon, 
    CameraIcon, 
    KeyIcon,
    ArrowLeftIcon 
} from '../components/Icons';
import './Auth.css';

export default function Login() {
    const [method, setMethod] = useState('password');
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [scanning, setScanning] = useState(false);
    const navigate = useNavigate();
    const { login, faceLogin, getDashboardRoute } = useAuth();
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await login(formData.username, formData.password);
            navigate(getDashboardRoute());
        } catch (err) {
            setError(err.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Start webcam for face login
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: 640, height: 480 }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
            }
        } catch (err) {
            setError('Could not access camera. Please allow camera permissions.');
        }
    };

    // Stop webcam
    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    // Switch to face method
    const switchToFace = () => {
        setMethod('face');
        setError('');
        setTimeout(startCamera, 100);
    };

    // Switch to password method
    const switchToPassword = () => {
        setMethod('password');
        setError('');
        stopCamera();
    };

    // Capture face and attempt login
    const captureAndLogin = useCallback(async () => {
        if (!videoRef.current || !canvasRef.current) return;

        setScanning(true);
        setError('');

        try {
            // Simulate scan delay for effect
            await new Promise(resolve => setTimeout(resolve, 1500));

            const canvas = canvasRef.current;
            const video = videoRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0);

            const imageBase64 = canvas.toDataURL('image/jpeg');

            await faceLogin(imageBase64);
            stopCamera();
            navigate(getDashboardRoute());
        } catch (err) {
            setError(err.message || 'Face recognition failed. Please try again.');
        } finally {
            setScanning(false);
        }
    }, [faceLogin, navigate, getDashboardRoute]);

    return (
        <div className="auth-container">
            <div className="auth-glow"></div>

            <div className="auth-card">
                <div className="auth-logo">
                    <ShieldIcon size={28} />
                </div>
                <div className="auth-header">
                    <h1>Identity Hub</h1>
                    <p>Secure biometric authentication</p>
                </div>

                {/* Auth Method Toggle */}
                <div className="method-toggle">
                    <button
                        type="button"
                        className={`method-btn ${method === 'password' ? 'active' : ''}`}
                        onClick={switchToPassword}
                    >
                        <KeyIcon size={14} />
                        <span>Password</span>
                    </button>
                    <button
                        type="button"
                        className={`method-btn ${method === 'face' ? 'active' : ''}`}
                        onClick={switchToFace}
                    >
                        <CameraIcon size={14} />
                        <span>Biometric</span>
                    </button>
                </div>

                {error && <div className="error-message">{error}</div>}

                {/* Password Login Form */}
                {method === 'password' && (
                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label>Username</label>
                            <div className="input-wrapper">
                                <UserIcon size={18} />
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    placeholder="Enter your username"
                                    required
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
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Enter your password"
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="form-actions">
                            <Link to="/forgot-password" className="forgot-link">
                                Forgot password?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={loading}
                        >
                            {loading ? 'Signing in...' : (
                                <>
                                    <span>Sign In</span>
                                    <ArrowRightIcon size={18} />
                                </>
                            )}
                        </button>
                    </form>
                )}

                {/* Face Login */}
                {method === 'face' && (
                    <div className="face-login-section">
                        <div className="camera-viewport">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="camera-video"
                            />
                            <canvas ref={canvasRef} style={{ display: 'none' }} />
                            <ScannerOverlay 
                                scanning={scanning} 
                                status={error ? 'error' : scanning ? 'scanning' : 'idle'}
                                message={error ? 'MATCH FAILED' : scanning ? 'ANALYZING...' : 'READY'}
                            />
                        </div>

                        <button
                            type="button"
                            className="btn-primary btn-scan"
                            onClick={captureAndLogin}
                            disabled={scanning}
                        >
                            {scanning ? 'Scanning...' : (
                                <>
                                    <CameraIcon size={18} />
                                    <span>Scan Face</span>
                                </>
                            )}
                        </button>

                        <p className="camera-hint">
                            Ensure your face is centered and well-lit
                        </p>
                    </div>
                )}

                <div className="auth-footer">
                    <p>
                        Don't have an account?{' '}
                        <Link to="/register">Create account</Link>
                    </p>
                </div>
            </div>

            <Link to="/" className="back-link">
                <ArrowLeftIcon size={14} />
                <span>Back to home</span>
            </Link>
        </div>
    );
}
