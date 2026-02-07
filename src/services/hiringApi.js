/**
 * Hiring API Service
 * Frontend API client for hiring, resume, and company management
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const api = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ====================
// Resume APIs
// ====================

/**
 * Upload and parse resume
 */
export const uploadResume = async (file, userId, jobId = null) => {
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('user_id', userId);
    if (jobId) formData.append('job_id', jobId);

    return api.post('/resume/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};

/**
 * Get resume info for a user
 */
export const getResume = (userId) => api.get(`/resume/${userId}`);

/**
 * Download resume file
 */
export const downloadResume = (userId) => {
    return `${API_BASE_URL}/api/resume/${userId}/download`;
};

/**
 * Calculate ATS score for resume against job
 */
export const calculateATSScore = (userId, jobId) => 
    api.post('/resume/ats-score', { user_id: userId, job_id: jobId });

/**
 * Get detailed AI analysis of resume
 */
export const analyzeResume = (userId, jobId) => 
    api.post('/resume/analyze', { user_id: userId, job_id: jobId });

/**
 * Delete resume
 */
export const deleteResume = (userId) => api.delete(`/resume/${userId}`);

// ====================
// Job APIs
// ====================

/**
 * Create a new job posting
 */
export const createJob = (data) => api.post('/hiring/jobs', data);

/**
 * Get all jobs (with filters)
 */
export const getJobs = (params) => api.get('/hiring/jobs', { params });

/**
 * Update job posting
 */
export const updateJob = (jobId, data) => api.put(`/hiring/jobs/${jobId}`, data);

/**
 * Get applications for a job
 */
export const getJobApplications = (jobId, params) => 
    api.get(`/hiring/jobs/${jobId}/applications`, { params });

/**
 * Get top candidates for a job
 */
export const getTopCandidates = (jobId, limit = 10) => 
    api.get(`/hiring/jobs/${jobId}/top-candidates`, { params: { limit } });

/**
 * Get candidates grouped by ATS score tiers
 */
export const getCandidateTiers = (jobId) => 
    api.get(`/hiring/jobs/${jobId}/candidate-tiers`);

// ====================
// Application APIs
// ====================

/**
 * Apply for a job
 */
export const applyForJob = (candidateUserId, jobId, coverLetter = null) => 
    api.post('/applications', { 
        candidate_user_id: candidateUserId, 
        job_id: jobId, 
        cover_letter: coverLetter 
    });

/**
 * Get user's applications
 */
export const getUserApplications = (userId, params) => 
    api.get(`/applications/user/${userId}`, { params });

/**
 * Get application details
 */
export const getApplication = (applicationId) => 
    api.get(`/applications/${applicationId}`);

/**
 * Withdraw application
 */
export const withdrawApplication = (applicationId) => 
    api.put(`/applications/${applicationId}/withdraw`);

/**
 * Get available jobs for candidates
 */
export const getAvailableJobs = (params) => 
    api.get('/applications/jobs/available', { params });

/**
 * Get recommended jobs for user
 */
export const getRecommendedJobs = (userId, limit = 10) => 
    api.get(`/applications/jobs/recommended/${userId}`, { params: { limit } });

/**
 * Update application status (HR only)
 */
export const updateApplicationStatus = (applicationId, status, notes = null) => 
    api.put(`/hiring/applications/${applicationId}`, { status, notes });

/**
 * Bulk update application statuses
 */
export const bulkUpdateApplications = (applicationIds, status) => 
    api.post('/hiring/applications/bulk-update', { application_ids: applicationIds, status });

// ====================
// Candidate Filtering APIs
// ====================

/**
 * Filter candidates with advanced criteria
 */
export const filterCandidates = (filters) => 
    api.post('/hiring/candidates/filter', filters);

/**
 * Compare multiple candidates
 */
export const compareCandidates = (candidateIds, jobId) => 
    api.post('/hiring/candidates/compare', { candidate_ids: candidateIds, job_id: jobId });

/**
 * Search candidates globally
 */
export const searchCandidates = (query, limit = 20) => 
    api.get('/hiring/candidates/search', { params: { q: query, limit } });

// ====================
// Assessment APIs
// ====================

/**
 * Schedule assessments for candidates
 */
export const scheduleAssessments = (data) => 
    api.post('/hiring/assessments/schedule', data);

/**
 * Schedule interview
 */
export const scheduleInterview = (data) => 
    api.post('/hiring/interviews/schedule', data);

// ====================
// Results APIs
// ====================

/**
 * Get all results for a candidate
 */
export const getCandidateResults = (userId) => 
    api.get(`/hiring/candidates/${userId}/results`);

/**
 * Get results for a specific application
 */
export const getApplicationResults = (applicationId) => 
    api.get(`/hiring/applications/${applicationId}/results`);

/**
 * Store assessment result
 */
export const storeAssessmentResult = (data) => 
    api.post('/hiring/results/assessment', data);

/**
 * Generate candidate report
 */
export const generateCandidateReport = (data) => 
    api.post('/hiring/reports/generate', data);

// ====================
// Company APIs
// ====================

/**
 * Create a company
 */
export const createCompany = (data) => api.post('/companies', data);

/**
 * Get company by ID
 */
export const getCompany = (companyId) => api.get(`/companies/${companyId}`);

/**
 * Update company
 */
export const updateCompany = (companyId, data) => 
    api.put(`/companies/${companyId}`, data);

/**
 * Get all companies
 */
export const getCompanies = (params) => api.get('/companies', { params });

/**
 * Add member to company
 */
export const addCompanyMember = (companyId, userId, role = 'interviewer') => 
    api.post(`/companies/${companyId}/members`, { user_id: userId, role });

/**
 * Remove member from company
 */
export const removeCompanyMember = (companyId, userId) => 
    api.delete(`/companies/${companyId}/members/${userId}`);

/**
 * Get company dashboard
 */
export const getCompanyDashboard = (companyId) => 
    api.get(`/companies/${companyId}/dashboard`);

/**
 * Get companies for a user
 */
export const getUserCompanies = (userId) => 
    api.get(`/companies/user/${userId}`);

// ====================
// Analytics APIs
// ====================

/**
 * Get hiring analytics
 */
export const getHiringAnalytics = (params) => 
    api.get('/hiring/analytics', { params });

// ====================
// Auth APIs
// ====================

/**
 * Register user (database-backed)
 */
export const registerUser = (data) => api.post('/portal-auth/register', data);

/**
 * Login (database-backed)
 */
export const loginUser = (username, password) => 
    api.post('/portal-auth/login', { username, password });

/**
 * Get current user profile
 */
export const getCurrentUser = () => api.get('/portal-auth/me');

/**
 * Update user profile
 */
export const updateProfile = (data) => api.put('/portal-auth/profile', data);

/**
 * Logout
 */
export const logoutUser = () => api.post('/portal-auth/logout');

/**
 * Send OTP
 */
export const sendOTP = (email, purpose = 'register') => 
    api.post('/portal-auth/send-otp', { email, purpose });

/**
 * Verify OTP
 */
export const verifyOTP = (email, otp, purpose = 'register') => 
    api.post('/portal-auth/verify-otp', { email, otp, purpose });

/**
 * Forgot password
 */
export const forgotPassword = (email) => 
    api.post('/portal-auth/forgot-password', { email });

/**
 * Reset password
 */
export const resetPassword = (email, password, confirmPassword, otp) => 
    api.post('/portal-auth/reset-password', { email, password, confirmPassword, otp });

/**
 * Change password
 */
export const changePassword = (currentPassword, newPassword, confirmPassword) => 
    api.post('/portal-auth/change-password', { currentPassword, newPassword, confirmPassword });

/**
 * Get user notifications
 */
export const getNotifications = () => api.get('/portal-auth/notifications');

/**
 * Mark notification as read
 */
export const markNotificationRead = (notificationId) => 
    api.put(`/portal-auth/notifications/${notificationId}/read`);

export default {
    // Resume
    uploadResume,
    getResume,
    downloadResume,
    calculateATSScore,
    analyzeResume,
    deleteResume,
    
    // Jobs
    createJob,
    getJobs,
    updateJob,
    getJobApplications,
    getTopCandidates,
    getCandidateTiers,
    
    // Applications
    applyForJob,
    getUserApplications,
    getApplication,
    withdrawApplication,
    getAvailableJobs,
    getRecommendedJobs,
    updateApplicationStatus,
    bulkUpdateApplications,
    
    // Candidates
    filterCandidates,
    compareCandidates,
    searchCandidates,
    
    // Assessments
    scheduleAssessments,
    scheduleInterview,
    
    // Results
    getCandidateResults,
    getApplicationResults,
    storeAssessmentResult,
    generateCandidateReport,
    
    // Companies
    createCompany,
    getCompany,
    updateCompany,
    getCompanies,
    addCompanyMember,
    removeCompanyMember,
    getCompanyDashboard,
    getUserCompanies,
    
    // Analytics
    getHiringAnalytics,
    
    // Auth
    registerUser,
    loginUser,
    getCurrentUser,
    updateProfile,
    logoutUser,
    sendOTP,
    verifyOTP,
    forgotPassword,
    resetPassword,
    changePassword,
    getNotifications,
    markNotificationRead
};
