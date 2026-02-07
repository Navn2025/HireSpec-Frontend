/**
 * Auth Service - Handles all authentication-related API calls
 * Connects to Flask backend for authentication
 */

const AUTH_API_URL=import.meta.env.VITE_AUTH_API_URL||'http://localhost:5000';

/**
 * Login with username and password
 */
export const login=async (username, password) =>
{
    const response=await fetch(`${AUTH_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({username, password}),
    });

    if (!response.ok)
    {
        const error=await response.json();
        throw new Error(error.message||'Login failed');
    }

    return await response.json();
};

/**
 * Face login - authenticate using facial recognition
 */
export const faceLogin=async (imageBase64) =>
{
    const response=await fetch(`${AUTH_API_URL}/api/auth/face-login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({image: imageBase64}),
    });

    if (!response.ok)
    {
        const error=await response.json();
        throw new Error(error.message||'Face recognition failed');
    }

    return await response.json();
};

/**
 * Register a new user with optional face images
 */
export const register=async (userData) =>
{
    const response=await fetch(`${AUTH_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(userData),
    });

    if (!response.ok)
    {
        const error=await response.json();
        throw new Error(error.message||'Registration failed');
    }

    return await response.json();
};

/**
 * Send OTP to email for verification
 */
export const sendOtp=async (email, purpose='register') =>
{
    const response=await fetch(`${AUTH_API_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({email, purpose}),
    });

    if (!response.ok)
    {
        const error=await response.json();
        throw new Error(error.message||'Failed to send OTP');
    }

    return await response.json();
};

/**
 * Verify OTP
 */
export const verifyOtp=async (email, otp, purpose='register') =>
{
    const response=await fetch(`${AUTH_API_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({email, otp, purpose}),
    });

    if (!response.ok)
    {
        const error=await response.json();
        throw new Error(error.message||'OTP verification failed');
    }

    return await response.json();
};

/**
 * Forgot password - request password reset
 */
export const forgotPassword=async (email) =>
{
    const response=await fetch(`${AUTH_API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({email}),
    });

    if (!response.ok)
    {
        const error=await response.json();
        throw new Error(error.message||'Failed to send reset code');
    }

    return await response.json();
};

/**
 * Reset password
 */
export const resetPassword=async (email, password, confirmPassword) =>
{
    const response=await fetch(`${AUTH_API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({email, password, confirmPassword}),
    });

    if (!response.ok)
    {
        const error=await response.json();
        throw new Error(error.message||'Password reset failed');
    }

    return await response.json();
};

/**
 * Logout
 */
export const logout=async () =>
{
    const response=await fetch(`${AUTH_API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
    });

    // Clear local storage regardless of response
    localStorage.removeItem('user');
    localStorage.removeItem('token');

    if (!response.ok)
    {
        console.error('Logout error');
    }

    return {success: true};
};

/**
 * Get current user
 */
export const getCurrentUser=async () =>
{
    const response=await fetch(`${AUTH_API_URL}/api/user/me`, {
        method: 'GET',
        credentials: 'include',
    });

    if (!response.ok)
    {
        return null;
    }

    return await response.json();
};

export default {
    login,
    faceLogin,
    register,
    sendOtp,
    verifyOtp,
    forgotPassword,
    resetPassword,
    logout,
    getCurrentUser,
};
