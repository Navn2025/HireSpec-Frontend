import { createContext, useContext, useState, useEffect } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext(null);

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
                    // Optionally verify with server
                    try {
                        const serverUser = await authService.getCurrentUser();
                        if (serverUser) {
                            setUser(serverUser);
                            localStorage.setItem('user', JSON.stringify(serverUser));
                        }
                    } catch (error) {
                        // If server check fails, keep local data
                        console.warn('Could not verify user with server');
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
        const userData = await authService.login(username, password);
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', userData.token || '');
        return userData;
    };

    // Face login
    const faceLogin = async (imageBase64) => {
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
        const result = await authService.register(userData);
        return result;
    };

    // Send OTP
    const sendOtp = async (email, purpose = 'register') => {
        return await authService.sendOtp(email, purpose);
    };

    // Verify OTP
    const verifyOtp = async (email, otp, purpose = 'register') => {
        return await authService.verifyOtp(email, otp, purpose);
    };

    // Forgot password
    const forgotPassword = async (email) => {
        return await authService.forgotPassword(email);
    };

    // Reset password
    const resetPassword = async (email, password, confirmPassword) => {
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
