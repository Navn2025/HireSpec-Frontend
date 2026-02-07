import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {createInterview} from '../services/api';
import {useAuth} from '../contexts/AuthContext';
import
{
    BriefcaseIcon,
    RobotIcon,
    CheckIcon,
    VideoIcon,
    ShieldIcon,
    RocketIcon,
    BrainIcon,
    ZapIcon,
    StarIcon,
    DumbbellIcon,
    CodeIcon,
    TargetIcon
} from '../components/Icons';
import './Home.css';

function Home()
{
    const navigate=useNavigate();
    const {user, isAuthenticated}=useAuth();

    // Check if user is a recruiter/admin
    const isRecruiter=user?.role==='admin'||user?.role==='company_admin'||user?.role==='company_hr';

    const [mode, setMode]=useState(isRecruiter? 'recruiter':'practice');
    const [candidateName, setCandidateName]=useState('');
    const [recruiterName, setRecruiterName]=useState('');
    const [loading, setLoading]=useState(false);

    const handleStartInterview=async () =>
    {
        if (!candidateName||(mode==='recruiter'&&!recruiterName))
        {
            alert('Please fill in all fields');
            return;
        }

        setLoading(true);
        try
        {
            const response=await createInterview({
                mode,
                candidateName,
                recruiterName: mode==='recruiter'? recruiterName:'AI Interviewer',
            });

            const interviewId=response.data.id;
            navigate(`/interview/${interviewId}?mode=${mode}&name=${candidateName}&role=candidate`);
        } catch (error)
        {
            console.error('Error creating interview:', error);
            alert('Failed to create interview');
        } finally
        {
            setLoading(false);
        }
    };

    const handlePracticeMode=() =>
    {
        navigate('/practice-setup');
    };

    return (
        <div className="home">
            {/* Hero Section */}
            <div className="hero">
                <div className="hero-glow"></div>
                <div className="container">
                    <div className="hero-badge">
                        <ZapIcon size={14} />
                        <span>AI-Powered Platform</span>
                    </div>
                    <h1 className="hero-title">
                        Next-Gen Interview
                        <br />
                        <span className="hero-title-accent">Platform</span>
                    </h1>
                    <p className="hero-subtitle">
                        Conduct professional interviews with advanced AI proctoring,
                        real-time code collaboration, and comprehensive analytics.
                    </p>

                    {/* Mode Cards */}
                    <div className="mode-cards">
                        {/* Recruiter Mode - Only visible to recruiters */}
                        {isRecruiter&&(
                            <div className={`mode-card ${mode==='recruiter'? 'active':''}`}
                                onClick={() => setMode('recruiter')}>
                                <div className="mode-card-header">
                                    <div className="mode-icon">
                                        <BriefcaseIcon size={28} />
                                    </div>
                                    <div className="mode-badge">Live</div>
                                </div>
                                <h3>Quick Interview</h3>
                                <p>Start a quick interview session now</p>
                                <ul className="feature-list">
                                    <li><CheckIcon size={16} /><span>Real-time video calling</span></li>
                                    <li><CheckIcon size={16} /><span>Collaborative code editor</span></li>
                                    <li><CheckIcon size={16} /><span>AI-powered proctoring</span></li>
                                    <li><CheckIcon size={16} /><span>Automated reports</span></li>
                                </ul>
                            </div>
                        )}

                        {/* Schedule Live Interview - Only visible to recruiters */}
                        {isRecruiter&&(
                            <div className="mode-card live-card"
                                onClick={() => navigate('/create-live-interview')}>
                                <div className="mode-card-header">
                                    <div className="mode-icon">
                                        <VideoIcon size={28} />
                                    </div>
                                    <div className="mode-badge new">New</div>
                                </div>
                                <h3>Schedule Live Interview</h3>
                                <p>Create interview session with dual camera support</p>
                                <ul className="feature-list">
                                    <li><CheckIcon size={16} /><span>Dual camera detection</span></li>
                                    <li><CheckIcon size={16} /><span>Screen sharing</span></li>
                                    <li><CheckIcon size={16} /><span>Live coding environment</span></li>
                                    <li><CheckIcon size={16} /><span>Built-in chat & timer</span></li>
                                </ul>
                            </div>
                        )}

                        {/* Practice Mode */}
                        <div className={`mode-card ${mode==='practice'? 'active':''}`}
                            onClick={() => setMode('practice')}>
                            <div className="mode-card-header">
                                <div className="mode-icon">
                                    <DumbbellIcon size={28} />
                                </div>
                                <div className="mode-badge">Practice</div>
                            </div>
                            <h3>Practice Interview</h3>
                            <p>Practice with AI interviewer and instant feedback</p>
                            <ul className="feature-list">
                                <li><CheckIcon size={16} /><span>AI interviewer</span></li>
                                <li><CheckIcon size={16} /><span>Instant feedback</span></li>
                                <li><CheckIcon size={16} /><span>Progress tracking</span></li>
                                <li><CheckIcon size={16} /><span>Unlimited attempts</span></li>
                            </ul>
                        </div>

                        {/* Coding Practice Mode */}
                        <div className="mode-card coding-card"
                            onClick={() => navigate('/coding-practice')}>
                            <div className="mode-card-header">
                                <div className="mode-icon">
                                    <CodeIcon size={28} />
                                </div>
                                <div className="mode-badge accent">DSA</div>
                            </div>
                            <h3>Coding Practice</h3>
                            <p>LeetCode-style problems with AI-powered hints</p>
                            <ul className="feature-list">
                                <li><CheckIcon size={16} /><span>11+ curated problems</span></li>
                                <li><CheckIcon size={16} /><span>Multiple languages</span></li>
                                <li><CheckIcon size={16} /><span>AI-generated problems</span></li>
                                <li><CheckIcon size={16} /><span>Smart hints</span></li>
                            </ul>
                        </div>

                        {/* AI Interview Mode */}
                        <div className="mode-card ai-card"
                            onClick={() => navigate('/ai-interview-setup')}>
                            <div className="mode-card-header">
                                <div className="mode-icon">
                                    <RobotIcon size={28} />
                                </div>
                                <div className="mode-badge accent">AI</div>
                            </div>
                            <h3>AI Interviewer</h3>
                            <p>Get interviewed by AI with comprehensive evaluation</p>
                            <ul className="feature-list">
                                <li><CheckIcon size={16} /><span>Role-based questions</span></li>
                                <li><CheckIcon size={16} /><span>Voice or text answers</span></li>
                                <li><CheckIcon size={16} /><span>Multi-metric scoring</span></li>
                                <li><CheckIcon size={16} /><span>Hiring recommendations</span></li>
                            </ul>
                        </div>
                    </div>

                    {/* Interview Setup Form */}
                    <div className="setup-form">
                        <div className="setup-form-header">
                            <h2>{mode==='recruiter'&&isRecruiter? 'Start Live Interview':'Start Practice Session'}</h2>
                            <p>Enter your details to begin</p>
                        </div>

                        <div className="form-group">
                            <label className="label">{isRecruiter&&mode==='recruiter'? 'Candidate Name':'Your Name'}</label>
                            <input
                                type="text"
                                className="input"
                                placeholder="Enter your name"
                                value={candidateName}
                                onChange={(e) => setCandidateName(e.target.value)}
                            />
                        </div>

                        {mode==='recruiter'&&isRecruiter&&(
                            <div className="form-group">
                                <label className="label">Recruiter Name</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="Enter recruiter name"
                                    value={recruiterName}
                                    onChange={(e) => setRecruiterName(e.target.value)}
                                />
                            </div>
                        )}

                        <button
                            className="btn btn-primary btn-large"
                            onClick={mode==='recruiter'&&isRecruiter? handleStartInterview:handlePracticeMode}
                            disabled={loading}
                        >
                            <RocketIcon size={20} />
                            {loading? 'Creating...':mode==='recruiter'&&isRecruiter? 'Start Interview':'Start Practice'}
                        </button>
                    </div>

                    {/* Features Section */}
                    <div className="features-section">
                        <div className="section-header">
                            <h2>Platform Features</h2>
                            <p>Everything you need for successful interviews</p>
                        </div>
                        <div className="features-grid">
                            <div className="feature-card">
                                <div className="feature-icon">
                                    <VideoIcon size={32} />
                                </div>
                                <h3>Video Conferencing</h3>
                                <p>HD video and audio with WebRTC technology for seamless communication</p>
                            </div>

                            <div className="feature-card">
                                <div className="feature-icon">
                                    <CodeIcon size={32} />
                                </div>
                                <h3>Live Code Editor</h3>
                                <p>Collaborative coding with syntax highlighting and real-time sync</p>
                            </div>

                            <div className="feature-card">
                                <div className="feature-icon">
                                    <ShieldIcon size={32} />
                                </div>
                                <h3>AI Proctoring</h3>
                                <p>Advanced cheating detection with face tracking and tab monitoring</p>
                            </div>

                            <div className="feature-card">
                                <div className="feature-icon">
                                    <BrainIcon size={32} />
                                </div>
                                <h3>AI Assistant</h3>
                                <p>Automated feedback, code evaluation, and performance insights</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="footer">
                <div className="container">
                    <div className="footer-content">
                        <div className="footer-brand">
                            <TargetIcon size={24} />
                            <span>InterviewAI</span>
                        </div>
                        <p className="footer-text">AI-powered interview platform for modern hiring</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default Home;
