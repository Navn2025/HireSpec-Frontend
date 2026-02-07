import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import liveInterviewService from '../services/liveInterview';
import { VideoIcon, CalendarIcon, UserIcon, ClockIcon, LinkIcon, CopyIcon, CheckIcon } from '../components/Icons';
import './CreateLiveInterview.css';

function CreateLiveInterview() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        candidateName: '',
        candidateEmail: '',
        jobTitle: '',
        companyName: '',
        scheduledTime: '',
        duration: 60,
        requirements: ''
    });
    const [createdSession, setCreatedSession] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [copied, setCopied] = useState({ recruiter: false, candidate: false });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const result = await liveInterviewService.createSession({
                ...formData,
                recruiterName: 'Recruiter', // Would come from auth context
                requirements: formData.requirements.split(',').map(r => r.trim()).filter(Boolean)
            });

            if (result.success) {
                setCreatedSession(result.session);
            } else {
                alert('Failed to create interview session');
            }
        } catch (error) {
            console.error('Error creating session:', error);
            alert('Error creating session: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = async (text, type) => {
        try {
            await navigator.clipboard.writeText(window.location.origin + text);
            setCopied(prev => ({ ...prev, [type]: true }));
            setTimeout(() => setCopied(prev => ({ ...prev, [type]: false })), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const joinAsRecruiter = () => {
        if (createdSession) {
            navigate(createdSession.recruiterJoinUrl + `&name=Recruiter`);
        }
    };

    if (createdSession) {
        return (
            <div className="create-live-interview">
                <div className="session-created">
                    <div className="success-icon">
                        <CheckIcon size={48} />
                    </div>
                    <h2>Interview Session Created!</h2>
                    <p>Share the links below with participants</p>

                    <div className="session-details">
                        <div className="detail-row">
                            <span className="label">Session ID:</span>
                            <span className="value">{createdSession.id}</span>
                        </div>
                        <div className="detail-row">
                            <span className="label">Access Code:</span>
                            <span className="value code">{createdSession.accessCode}</span>
                        </div>
                    </div>

                    <div className="invite-links">
                        <div className="link-section">
                            <h3>Recruiter Link</h3>
                            <div className="link-box">
                                <input 
                                    type="text" 
                                    readOnly 
                                    value={window.location.origin + createdSession.recruiterJoinUrl}
                                />
                                <button 
                                    className="copy-btn"
                                    onClick={() => copyToClipboard(createdSession.recruiterJoinUrl, 'recruiter')}
                                >
                                    {copied.recruiter ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
                                </button>
                            </div>
                        </div>

                        <div className="link-section">
                            <h3>Candidate Link</h3>
                            <div className="link-box">
                                <input 
                                    type="text" 
                                    readOnly 
                                    value={window.location.origin + createdSession.candidateJoinUrl}
                                />
                                <button 
                                    className="copy-btn"
                                    onClick={() => copyToClipboard(createdSession.candidateJoinUrl, 'candidate')}
                                >
                                    {copied.candidate ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="actions">
                        <button className="join-btn primary" onClick={joinAsRecruiter}>
                            <VideoIcon size={18} />
                            Join as Recruiter
                        </button>
                        <button 
                            className="join-btn secondary" 
                            onClick={() => setCreatedSession(null)}
                        >
                            Create Another
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="create-live-interview">
            <div className="create-form-container">
                <div className="form-header">
                    <VideoIcon size={32} />
                    <h1>Schedule Live Interview</h1>
                    <p>Create a live interview session with video, dual camera, and collaborative coding</p>
                </div>

                <form onSubmit={handleSubmit} className="interview-form">
                    <div className="form-section">
                        <h3><UserIcon size={18} /> Candidate Information</h3>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Candidate Name</label>
                                <input
                                    type="text"
                                    name="candidateName"
                                    value={formData.candidateName}
                                    onChange={handleInputChange}
                                    placeholder="John Doe"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Candidate Email</label>
                                <input
                                    type="email"
                                    name="candidateEmail"
                                    value={formData.candidateEmail}
                                    onChange={handleInputChange}
                                    placeholder="john@example.com"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h3>Position Details</h3>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Job Title</label>
                                <input
                                    type="text"
                                    name="jobTitle"
                                    value={formData.jobTitle}
                                    onChange={handleInputChange}
                                    placeholder="Software Engineer"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Company Name</label>
                                <input
                                    type="text"
                                    name="companyName"
                                    value={formData.companyName}
                                    onChange={handleInputChange}
                                    placeholder="Tech Corp"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h3><ClockIcon size={18} /> Schedule</h3>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Date & Time</label>
                                <input
                                    type="datetime-local"
                                    name="scheduledTime"
                                    value={formData.scheduledTime}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="form-group">
                                <label>Duration (minutes)</label>
                                <select
                                    name="duration"
                                    value={formData.duration}
                                    onChange={handleInputChange}
                                >
                                    <option value={30}>30 minutes</option>
                                    <option value={45}>45 minutes</option>
                                    <option value={60}>60 minutes</option>
                                    <option value={90}>90 minutes</option>
                                    <option value={120}>120 minutes</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h3>Requirements (Optional)</h3>
                        <div className="form-group">
                            <label>Skills to assess (comma separated)</label>
                            <input
                                type="text"
                                name="requirements"
                                value={formData.requirements}
                                onChange={handleInputChange}
                                placeholder="JavaScript, React, Node.js, Problem Solving"
                            />
                        </div>
                    </div>

                    <div className="features-preview">
                        <h4>Interview Features:</h4>
                        <ul>
                            <li>✓ Real-time video/audio connection</li>
                            <li>✓ Dual camera support (primary + secondary)</li>
                            <li>✓ Live collaborative code editor</li>
                            <li>✓ Screen sharing</li>
                            <li>✓ Built-in chat</li>
                            <li>✓ Timer/stopwatch</li>
                            <li>✓ Proctoring and integrity monitoring</li>
                        </ul>
                    </div>

                    <button 
                        type="submit" 
                        className="create-btn"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Creating...' : 'Create Interview Session'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default CreateLiveInterview;
