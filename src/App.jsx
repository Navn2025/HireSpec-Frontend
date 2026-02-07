import {BrowserRouter as Router, Routes, Route} from 'react-router-dom'
import {AuthProvider} from './contexts/AuthContext'
import Navbar from './components/Navbar'
import RecruiterRoute from './components/RecruiterRoute'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import InterviewRoom from './pages/InterviewRoom'
import LiveInterviewRoom from './pages/LiveInterviewRoom'
import CreateLiveInterview from './pages/CreateLiveInterview'
import LiveInterviewJoin from './pages/LiveInterviewJoin'
import PracticeMode from './pages/PracticeMode'
import SecondaryCameraView from './pages/SecondaryCameraView'
import ProctorDashboard from './pages/ProctorDashboard'
import PracticeSessionSetup from './pages/PracticeSessionSetup'
import PracticeInterviewRoom from './pages/PracticeInterviewRoom'
import PracticeFeedback from './pages/PracticeFeedback'
import AxiomChat from './pages/AxiomChat'
import AIInterviewSetup from './pages/AIInterviewSetup'
import AIInterviewRoom from './pages/AIInterviewRoom'
import AIInterviewReport from './pages/AIInterviewReport'
import RecruiterDashboard from './pages/RecruiterDashboard'
import ApplicantManagement from './pages/ApplicantManagement'
import CodingPractice from './pages/CodingPractice'
import CandidateDashboard from './pages/CandidateDashboard'
import Contests from './pages/Contests'
import Leaderboard from './pages/Leaderboard'
import './App.css'

function App()
{
    return (
        <Router>
            <AuthProvider>
                <div className="App">
                    <Navbar />
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/interview/:interviewId" element={<InterviewRoom />} />
                        <Route path="/live-interview/:sessionId" element={<LiveInterviewRoom />} />
                        <Route path="/create-live-interview" element={<RecruiterRoute><CreateLiveInterview /></RecruiterRoute>} />
                        <Route path="/join-interview/:sessionId" element={<LiveInterviewJoin />} />
                        <Route path="/practice" element={<PracticeMode />} />
                        <Route path="/practice-setup" element={<PracticeSessionSetup />} />
                        <Route path="/practice-interview/:sessionId" element={<PracticeInterviewRoom />} />
                        <Route path="/practice-feedback/:sessionId" element={<PracticeFeedback />} />
                        <Route path="/secondary-camera" element={<SecondaryCameraView />} />
                        <Route path="/proctor-dashboard" element={<RecruiterRoute><ProctorDashboard /></RecruiterRoute>} />
                        <Route path="/axiom-chat" element={<AxiomChat />} />
                        <Route path="/ai-interview-setup" element={<AIInterviewSetup />} />
                        <Route path="/ai-interview/:sessionId" element={<AIInterviewRoom />} />
                        <Route path="/ai-interview-report/:sessionId" element={<AIInterviewReport />} />
                        <Route path="/recruiter-dashboard" element={<RecruiterRoute><RecruiterDashboard /></RecruiterRoute>} />
                        <Route path="/applicant-management" element={<RecruiterRoute><ApplicantManagement /></RecruiterRoute>} />
                        <Route path="/coding-practice" element={<CodingPractice />} />
                        <Route path="/candidate-dashboard" element={<CandidateDashboard />} />
                        <Route path="/contests" element={<ProtectedRoute><Contests /></ProtectedRoute>} />
                        <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
                    </Routes>
                </div>
            </AuthProvider>
        </Router>
    )
}

export default App
