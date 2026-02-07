import { createContext, useContext, useState, useEffect } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext(null);

// BYPASS MODE - Set to true to skip Python backend authentication
const BYPASS_AUTH = true;

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check if user is logged in on mount
    useEffect(() => {
        const initAuth = async () => {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    setUser(parsedUser);
                    // Skip server verification in bypass mode
                    if (!BYPASS_AUTH) {
                        try {
                            const serverUser = await authService.getCurrentUser();
                            if (serverUser) {
                                setUser(serverUser);
                                localStorage.setItem('user', JSON.stringify(serverUser));
                            }
                        } catch (error) {
                            console.warn('Could not verify user with server');
                        }
                    }
                } catch (error) {
                    console.error('Failed to parse stored user:', error);
                    localStorage.removeItem('user');
                }
            }
            setLoading(false);
        };
        initAuth();
    }, []);

    // Login with username and password
    const login = async (username, password) => {
        if (BYPASS_AUTH) {
            // Bypass mode - create mock user based on username
            const role = username.toLowerCase().includes('admin') ? 'company_admin' 
                       : username.toLowerCase().includes('hr') ? 'company_hr' 
                       : 'candidate';
            const mockUser = {
                id: Date.now(),
                username: username,
                email: `${username}@demo.com`,
                role: role,
                token: 'bypass-token-' + Date.now(),
                createdAt: new Date().toISOString()
            };
            setUser(mockUser);
            localStorage.setItem('user', JSON.stringify(mockUser));
            localStorage.setItem('token', mockUser.token);
            return mockUser;
        }
        const userData = await authService.login(username, password);
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', userData.token || '');
        return userData;
    };

    // Face login
    const faceLogin = async (imageBase64) => {
        if (BYPASS_AUTH) {
            // Bypass mode - just create a guest user
            const mockUser = {
                id: Date.now(),
                username: 'face_user_' + Date.now(),
                email: 'face@demo.com',
                role: 'candidate',
                token: 'bypass-token-' + Date.now(),
                createdAt: new Date().toISOString()
            };
            setUser(mockUser);
            localStorage.setItem('user', JSON.stringify(mockUser));
            localStorage.setItem('token', mockUser.token);
            return mockUser;
        }
        const userData = await authService.faceLogin(imageBase64);
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', userData.token || '');
        return userData;
    };

    // Logout function
    const logout = async () => {
        try {
            await authService.logout();
        } catch (error) {
            console.error('Logout error:', error);
        }
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    };

    // Register function
    const register = async (userData) => {
        if (BYPASS_AUTH) {
            // Bypass: simulate successful registration
            return { success: true, message: 'Registration successful (bypass mode)' };
        }
        const result = await authService.register(userData);
        return result;
    };

    // Send OTP
    const sendOtp = async (email, purpose = 'register') => {
        if (BYPASS_AUTH) {
            // Bypass: simulate OTP sent
            return { success: true, message: 'OTP sent (bypass mode)' };
        }
        return await authService.sendOtp(email, purpose);
    };

    // Verify OTP
    const verifyOtp = async (email, otp, purpose = 'register') => {
        if (BYPASS_AUTH) {
            // Bypass: always verify successfully
            return { success: true, message: 'OTP verified (bypass mode)' };
        }
        return await authService.verifyOtp(email, otp, purpose);
    };

    // Forgot password
    const forgotPassword = async (email) => {
        if (BYPASS_AUTH) {
            return { success: true, message: 'Password reset link sent (bypass mode)' };
        }
        return await authService.forgotPassword(email);
    };

    // Reset password
    const resetPassword = async (email, password, confirmPassword) => {
        if (BYPASS_AUTH) {
            return { success: true, message: 'Password reset successful (bypass mode)' };
        }
        return await authService.resetPassword(email, password, confirmPassword);
    };

    // Get dashboard route based on user role
    const getDashboardRoute = () => {
        if (!user) return '/';
        switch (user.role) {
            case 'admin':
                return '/recruiter-dashboard';
            case 'company_admin':
                return '/recruiter-dashboard';
            case 'company_hr':
                return '/recruiter-dashboard';
            case 'candidate':
                return '/candidate-dashboard';
            default:
                return '/candidate-dashboard';
        }
    };

    const value = {
        user,
        loading,
        login,
        faceLogin,
        logout,
        register,
        sendOtp,
        verifyOtp,
        forgotPassword,
        resetPassword,
        getDashboardRoute,
        isAuthenticated: !!user,
        bypassMode: BYPASS_AUTH,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook to use auth context
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
