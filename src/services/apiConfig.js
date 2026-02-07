import axios from 'axios';

// API Base URLs
const NODEJS_API_URL=import.meta.env.VITE_NODEJS_API_URL||'http://localhost:8080';
const PYTHON_API_URL=import.meta.env.VITE_PYTHON_API_URL||'http://localhost:5001';

// Create axios instances for each backend
export const nodejsApi=axios.create({
    baseURL: NODEJS_API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const pythonApi=axios.create({
    baseURL: PYTHON_API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptors
nodejsApi.interceptors.request.use(
    (config) =>
    {
        const token=localStorage.getItem('token');
        if (token)
        {
            config.headers.Authorization=`Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

pythonApi.interceptors.request.use(
    (config) =>
    {
        const token=localStorage.getItem('token');
        if (token)
        {
            config.headers.Authorization=`Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptors
const handleResponse=(response) => response;
const handleError=(error) =>
{
    if (error.response?.status===401)
    {
        // Unauthorized - redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href='/login';
    }
    return Promise.reject(error);
};

nodejsApi.interceptors.response.use(handleResponse, handleError);
pythonApi.interceptors.response.use(handleResponse, handleError);

// ===========================================
// API Services - Organized by Backend
// ===========================================

// Authentication (Python Backend)
export const authService={
    async register(userData)
    {
        return pythonApi.post('/api/register', userData);
    },

    async login(credentials)
    {
        return pythonApi.post('/api/login', credentials);
    },

    async logout()
    {
        return pythonApi.post('/api/logout');
    },

    async verifyEmail(email, otp)
    {
        return pythonApi.post('/api/verify-email', {email, otp});
    },

    async sendOTP(email, purpose='register')
    {
        return pythonApi.post('/api/send-otp', {email, purpose});
    },

    async resetPassword(email, otp, newPassword)
    {
        return pythonApi.post('/api/reset-password', {email, otp, newPassword});
    },
};

// Face Recognition (Python Backend)
export const faceService={
    async uploadFace(formData)
    {
        return pythonApi.post('/api/face/upload', formData, {
            headers: {'Content-Type': 'multipart/form-data'},
        });
    },

    async verifyFace(formData)
    {
        return pythonApi.post('/api/face/verify', formData, {
            headers: {'Content-Type': 'multipart/form-data'},
        });
    },
};

// Hiring & Jobs (Python Backend)
export const jobService={
    async getJobs(filters)
    {
        return pythonApi.get('/api/jobs', {params: filters});
    },

    async getJobById(id)
    {
        return pythonApi.get(`/api/jobs/${id}`);
    },

    async createJob(jobData)
    {
        return pythonApi.post('/api/jobs', jobData);
    },

    async applyToJob(jobId, applicationData)
    {
        return pythonApi.post(`/api/jobs/${jobId}/apply`, applicationData);
    },

    async getMyApplications()
    {
        return pythonApi.get('/api/applications');
    },
};

// Interviews (Node.js Backend)
export const interviewService={
    async createInterview(data)
    {
        return nodejsApi.post('/api/interview/create', data);
    },

    async joinInterview(roomId)
    {
        return nodejsApi.post('/api/interview/join', {roomId});
    },

    async endInterview(roomId)
    {
        return nodejsApi.post('/api/interview/end', {roomId});
    },

    async getInterviewFeedback(roomId)
    {
        return nodejsApi.get(`/api/interview/${roomId}/feedback`);
    },
};

// AI Interviews (Node.js Backend)
export const aiInterviewService={
    async startAIInterview(config)
    {
        return nodejsApi.post('/api/ai-interview/start', config);
    },

    async submitAnswer(sessionId, answer)
    {
        return nodejsApi.post('/api/ai-interview/answer', {sessionId, answer});
    },

    async getReport(sessionId)
    {
        return nodejsApi.get(`/api/ai-interview/report/${sessionId}`);
    },
};

// Coding Practice (Node.js Backend)
export const codingService={
    async getProblems(filters)
    {
        return nodejsApi.get('/api/cp/questions', {params: filters});
    },

    async getProblemById(id)
    {
        return nodejsApi.get(`/api/cp/questions/${id}`);
    },

    async submitCode(data)
    {
        return nodejsApi.post('/api/cp/code/submit', data);
    },

    async runCode(data)
    {
        return nodejsApi.post('/api/cp/code/run', data);
    },

    async getSubmissions(problemId)
    {
        return nodejsApi.get(`/api/cp/code/submissions/${problemId}`);
    },

    async generateAIProblem(config)
    {
        return nodejsApi.post('/api/cp/ai-questions/generate', config);
    },

    async startSession(config)
    {
        return nodejsApi.post('/api/cp/session/start', config);
    },

    async endSession(sessionId)
    {
        return nodejsApi.post('/api/cp/session/end', {sessionId});
    },

    async getReport(sessionId)
    {
        return nodejsApi.get(`/api/cp/reports/${sessionId}`);
    },
};

// Proctoring (Node.js Backend)
export const proctoringService={
    async startProctoring(sessionId)
    {
        return nodejsApi.post('/api/proctoring/start', {sessionId});
    },

    async logEvent(eventData)
    {
        return nodejsApi.post('/api/proctoring/log', eventData);
    },

    async getViolations(sessionId)
    {
        return nodejsApi.get(`/api/proctoring/violations/${sessionId}`);
    },
};

// Axiom AI Chat (Node.js Backend)
export const axiomService={
    async getChats(userId)
    {
        return nodejsApi.get('/api/axiom/chats', {params: {userId}});
    },

    async createChat(data)
    {
        return nodejsApi.post('/api/axiom/chats', data);
    },

    async getMessages(chatId)
    {
        return nodejsApi.get(`/api/axiom/chats/${chatId}/messages`);
    },

    async deleteChat(chatId)
    {
        return nodejsApi.delete(`/api/axiom/chats/${chatId}`);
    },
};

// Questions Bank (Node.js Backend)
export const questionService={
    async getQuestions(filters)
    {
        return nodejsApi.get('/api/questions', {params: filters});
    },

    async getQuestionById(id)
    {
        return nodejsApi.get(`/api/questions/${id}`);
    },

    async createQuestion(data)
    {
        return nodejsApi.post('/api/questions', data);
    },
};

// Practice Mode (Node.js Backend)
export const practiceService={
    async startPractice(config)
    {
        return nodejsApi.post('/api/practice/start', config);
    },

    async submitPracticeAnswer(data)
    {
        return nodejsApi.post('/api/practice/submit', data);
    },

    async getPracticeFeedback(sessionId)
    {
        return nodejsApi.get(`/api/practice/feedback/${sessionId}`);
    },
};

// Code Execution (Node.js Backend)
export const codeExecutionService={
    async executeCode(data)
    {
        return nodejsApi.post('/api/code-execution/run', data);
    },

    async getExecutionStatus(submissionId)
    {
        return nodejsApi.get(`/api/code-execution/status/${submissionId}`);
    },
};

// AI Services (Node.js Backend)
export const aiService={
    async analyzeCode(code, language)
    {
        return nodejsApi.post('/api/ai/analyze-code', {code, language});
    },

    async generateHint(problemId, userCode)
    {
        return nodejsApi.post('/api/ai/hint', {problemId, userCode});
    },

    async detectAIContent(text)
    {
        return nodejsApi.post('/api/ai/detect', {text});
    },
};

// Health Checks
export const healthService={
    async checkNodejs()
    {
        return nodejsApi.get('/api/health');
    },

    async checkPython()
    {
        return pythonApi.get('/api/health');
    },

    async checkAll()
    {
        return Promise.all([
            this.checkNodejs(),
            this.checkPython(),
        ]);
    },
};

// Export everything
export default {
    nodejsApi,
    pythonApi,
    authService,
    faceService,
    jobService,
    interviewService,
    aiInterviewService,
    codingService,
    proctoringService,
    axiomService,
    questionService,
    practiceService,
    codeExecutionService,
    aiService,
    healthService,
};
