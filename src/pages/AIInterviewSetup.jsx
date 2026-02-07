import {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {RobotIcon, TargetIcon, SpeechIcon, ThinkingIcon, ChartIcon, BriefcaseIcon, BrainIcon, ChatIcon, StrengthIcon, CheckCircleIcon} from '../components/Icons';
import './AIInterviewSetup.css';

function AIInterviewSetup()
{
    const navigate=useNavigate();
    const [roles, setRoles]=useState([]);
    const [selectedRole, setSelectedRole]=useState('');
    const [candidateName, setCandidateName]=useState('');
    const [questionCount, setQuestionCount]=useState(5);
    const [loading, setLoading]=useState(false);
    const [error, setError]=useState('');

    useEffect(() =>
    {
        fetchRoles();
    }, []);

    const fetchRoles=async () =>
    {
        try
        {
            const response=await fetch('http://localhost:8080/api/ai-interview/roles');
            const data=await response.json();
            setRoles(data.roles);
            if (data.roles.length>0)
            {
                setSelectedRole(data.roles[0]);
            }
        } catch (error)
        {
            console.error('Error fetching roles:', error);
            setError('Failed to load roles');
        }
    };

    const handleStartInterview=async () =>
    {
        if (!candidateName.trim())
        {
            setError('Please enter your name');
            return;
        }

        if (!selectedRole)
        {
            setError('Please select a role');
            return;
        }

        setLoading(true);
        setError('');

        try
        {
            const response=await fetch('http://localhost:8080/api/ai-interview/start', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    candidateName: candidateName.trim(),
                    role: selectedRole,
                    questionCount
                })
            });

            if (!response.ok)
            {
                throw new Error('Failed to start interview');
            }

            const data=await response.json();

            // Navigate to AI interview room with session data
            navigate(`/ai-interview/${data.sessionId}`, {
                state: {
                    sessionId: data.sessionId,
                    greeting: data.greeting,
                    firstQuestion: data.firstQuestion,
                    questionMetadata: data.questionMetadata,
                    candidateName,
                    role: selectedRole,
                    totalQuestions: data.totalQuestions
                }
            });
        } catch (error)
        {
            console.error('Error starting interview:', error);
            setError('Failed to start interview. Please try again.');
        } finally
        {
            setLoading(false);
        }
    };

    return (
        <div className="ai-interview-setup">
            <div className="setup-container">
                <div className="setup-header">
                    <h1><RobotIcon size={28} /> AI Interview</h1>
                    <p>Get interviewed by an AI that evaluates your skills</p>
                </div>

                <div className="setup-form">
                    <div className="form-group">
                        <label htmlFor="candidateName">Your Name *</label>
                        <input
                            type="text"
                            id="candidateName"
                            value={candidateName}
                            onChange={(e) => setCandidateName(e.target.value)}
                            placeholder="Enter your full name"
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="role">Job Role *</label>
                        <select
                            id="role"
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            disabled={loading}
                        >
                            {roles.map(role => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="questionCount">Number of Questions</label>
                        <select
                            id="questionCount"
                            value={questionCount}
                            onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                            disabled={loading}
                        >
                            <option value="3">3 Questions (~10 min)</option>
                            <option value="5">5 Questions (~15 min)</option>
                            <option value="8">8 Questions (~25 min)</option>
                        </select>
                    </div>

                    {error&&(
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    <button
                        className="start-button"
                        onClick={handleStartInterview}
                        disabled={loading||!candidateName.trim()||!selectedRole}
                    >
                        {loading? 'Starting Interview...':'Start AI Interview'}
                    </button>
                </div>

                <div className="interview-info">
                    <h3>What to Expect</h3>
                    <ul>
                        <li><TargetIcon size={16} /> Role-specific questions tailored to {selectedRole||'your chosen role'}</li>
                        <li><SpeechIcon size={16} /> Answer via voice or text</li>
                        <li><ThinkingIcon size={16} /> AI follow-up questions based on your answers</li>
                        <li><ChartIcon size={16} /> Comprehensive evaluation and score</li>
                        <li><BriefcaseIcon size={16} /> Hiring recommendation for recruiters</li>
                    </ul>
                </div>

                <div className="evaluation-metrics">
                    <h3>You'll be evaluated on:</h3>
                    <div className="metrics-grid">
                        <div className="metric-card">
                            <div className="metric-icon"><BrainIcon size={24} /></div>
                            <div className="metric-name">Technical Knowledge</div>
                        </div>
                        <div className="metric-card">
                            <div className="metric-icon"><ChatIcon size={24} /></div>
                            <div className="metric-name">Communication</div>
                        </div>
                        <div className="metric-card">
                            <div className="metric-icon"><TargetIcon size={24} /></div>
                            <div className="metric-name">Problem Solving</div>
                        </div>
                        <div className="metric-card">
                            <div className="metric-icon"><StrengthIcon size={24} /></div>
                            <div className="metric-name">Confidence</div>
                        </div>
                        <div className="metric-card">
                            <div className="metric-icon"><CheckCircleIcon size={24} /></div>
                            <div className="metric-name">Consistency</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AIInterviewSetup;
