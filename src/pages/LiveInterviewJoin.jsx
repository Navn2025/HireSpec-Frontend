import {useState, useEffect} from 'react';
import {useParams, useSearchParams, useNavigate} from 'react-router-dom';
import liveInterviewService from '../services/liveInterview';
import {VideoIcon, UserIcon, ClockIcon, AlertIcon, CheckIcon} from '../components/Icons';
import './LiveInterviewJoin.css';

function LiveInterviewJoin()
{
    const {sessionId}=useParams();
    const [searchParams]=useSearchParams();
    const navigate=useNavigate();

    const role=searchParams.get('role')||'candidate';
    const accessCode=searchParams.get('code');

    const [session, setSession]=useState(null);
    const [loading, setLoading]=useState(true);
    const [error, setError]=useState(null);
    const [name, setName]=useState('');
    const [isJoining, setIsJoining]=useState(false);

    // Pre-join checks
    const [cameraPermission, setCameraPermission]=useState(null);
    const [micPermission, setMicPermission]=useState(null);
    const [checkingPermissions, setCheckingPermissions]=useState(true);

    useEffect(() =>
    {
        loadSession();
        checkPermissions();
    }, [sessionId, accessCode]);

    const loadSession=async () =>
    {
        try
        {
            const result=await liveInterviewService.getSession(sessionId, accessCode);
            if (result.success)
            {
                setSession(result.session);
            } else
            {
                setError(result.error||'Session not found');
            }
        } catch (err)
        {
            setError('Failed to load session: '+err.message);
        } finally
        {
            setLoading(false);
        }
    };

    const checkPermissions=async () =>
    {
        setCheckingPermissions(true);

        try
        {
            // Check camera permission
            const stream=await navigator.mediaDevices.getUserMedia({video: true, audio: true});
            setCameraPermission(true);
            setMicPermission(true);
            stream.getTracks().forEach(track => track.stop());
        } catch (err)
        {
            if (err.name==='NotAllowedError')
            {
                setCameraPermission(false);
                setMicPermission(false);
            } else
            {
                setCameraPermission(null);
                setMicPermission(null);
            }
        }

        setCheckingPermissions(false);
    };

    const handleJoin=() =>
    {
        if (!name.trim())
        {
            alert('Please enter your name');
            return;
        }

        setIsJoining(true);

        // Navigate to the live interview room
        navigate(`/live-interview/${sessionId}?role=${role}&code=${accessCode}&name=${encodeURIComponent(name)}`);
    };

    const requestPermissions=async () =>
    {
        try
        {
            const stream=await navigator.mediaDevices.getUserMedia({video: true, audio: true});
            setCameraPermission(true);
            setMicPermission(true);
            stream.getTracks().forEach(track => track.stop());
        } catch (err)
        {
            alert('Please allow camera and microphone access to join the interview.');
        }
    };

    if (loading)
    {
        return (
            <div className="live-interview-join">
                <div className="join-container loading">
                    <div className="loading-spinner"></div>
                    <p>Loading session...</p>
                </div>
            </div>
        );
    }

    if (error)
    {
        return (
            <div className="live-interview-join">
                <div className="join-container error">
                    <AlertIcon size={48} />
                    <h2>Unable to Join</h2>
                    <p>{error}</p>
                    <button onClick={() => navigate('/')}>Go Home</button>
                </div>
            </div>
        );
    }

    return (
        <div className="live-interview-join">
            <div className="join-container">
                <div className="join-header">
                    <VideoIcon size={40} />
                    <h1>Join Live Interview</h1>
                </div>

                {session&&(
                    <div className="session-info-card">
                        <div className="info-row">
                            <span className="label">Company:</span>
                            <span className="value">{session.companyName}</span>
                        </div>
                        <div className="info-row">
                            <span className="label">Position:</span>
                            <span className="value">{session.jobTitle}</span>
                        </div>
                        <div className="info-row">
                            <span className="label">With:</span>
                            <span className="value">
                                {role==='candidate'? session.recruiterName:session.candidateName}
                            </span>
                        </div>
                        {session.scheduledTime&&(
                            <div className="info-row">
                                <span className="label">Scheduled:</span>
                                <span className="value">
                                    {new Date(session.scheduledTime).toLocaleString()}
                                </span>
                            </div>
                        )}
                        <div className="info-row">
                            <span className="label">Duration:</span>
                            <span className="value">{session.duration} minutes</span>
                        </div>
                    </div>
                )}

                <div className="pre-join-checks">
                    <h3>Pre-Join Checks</h3>
                    <div className="check-item">
                        <span className={`status ${cameraPermission? 'ok':cameraPermission===false? 'error':'pending'}`}>
                            {cameraPermission? <CheckIcon size={16} />:cameraPermission===false? <AlertIcon size={16} />:'...'}
                        </span>
                        <span>Camera Access</span>
                        {cameraPermission===false&&(
                            <button onClick={requestPermissions} className="fix-btn">Allow</button>
                        )}
                    </div>
                    <div className="check-item">
                        <span className={`status ${micPermission? 'ok':micPermission===false? 'error':'pending'}`}>
                            {micPermission? <CheckIcon size={16} />:micPermission===false? <AlertIcon size={16} />:'...'}
                        </span>
                        <span>Microphone Access</span>
                    </div>
                </div>

                <div className="join-form">
                    <div className="form-group">
                        <label>Your Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={role==='recruiter'? 'Recruiter Name':'Your Full Name'}
                            onKeyDown={(e) => e.key==='Enter'&&handleJoin()}
                        />
                    </div>

                    <button
                        className="join-btn"
                        onClick={handleJoin}
                        disabled={isJoining||!cameraPermission||!micPermission}
                    >
                        {isJoining? 'Joining...':'Join Interview'}
                    </button>
                </div>

                <div className="join-footer">
                    <p>You're joining as: <strong>{role==='recruiter'? 'Interviewer':'Candidate'}</strong></p>
                    <ul className="tips">
                        <li>Make sure you're in a quiet, well-lit room</li>
                        <li>Test your camera and microphone before joining</li>
                        <li>Have a stable internet connection</li>
                        <li>Close unnecessary browser tabs</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default LiveInterviewJoin;
