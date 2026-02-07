import {useState, useEffect, useRef} from 'react';
import {useParams, useSearchParams, useNavigate} from 'react-router-dom';
import liveInterviewService from '../services/liveInterview';
import socketService from '../services/socket';
import {executeCode, submitCode, getQuestions} from '../services/api';
import CodeEditor from '../components/CodeEditor';
import ChatPanel from '../components/ChatPanel';
import DualCameraPanel from '../components/DualCameraPanel';
import LiveTimer from '../components/LiveTimer';
import
    {
        VideoIcon, VideoOffIcon, MicIcon, MicOffIcon, PhoneOffIcon,
        ScreenShareIcon, ChatIcon, CodeIcon, UserIcon, ClockIcon,
        PlayIcon, CheckIcon, AlertIcon, CameraIcon, SettingsIcon
    } from '../components/Icons';
import './LiveInterviewRoom.css';

function LiveInterviewRoom()
{
    const {sessionId}=useParams();
    const [searchParams]=useSearchParams();
    const navigate=useNavigate();

    const role=searchParams.get('role');
    const accessCode=searchParams.get('code');
    const userName=searchParams.get('name')||(role==='recruiter'? 'Recruiter':'Candidate');

    // State
    const [session, setSession]=useState(null);
    const [isJoined, setIsJoined]=useState(false);
    const [participants, setParticipants]=useState([]);
    const [localStream, setLocalStream]=useState(null);
    const [secondaryStream, setSecondaryStream]=useState(null);
    const [screenStream, setScreenStream]=useState(null);
    const [remoteStreams, setRemoteStreams]=useState(new Map());

    // Media controls
    const [isVideoEnabled, setIsVideoEnabled]=useState(true);
    const [isAudioEnabled, setIsAudioEnabled]=useState(true);
    const [isScreenSharing, setIsScreenSharing]=useState(false);
    const [isSecondaryCamera, setIsSecondaryCamera]=useState(false);

    // UI state
    const [activeTab, setActiveTab]=useState('code'); // 'code', 'whiteboard', 'questions'
    const [showChat, setShowChat]=useState(true);
    const [showParticipants, setShowParticipants]=useState(false);

    // Code editor state
    const [code, setCode]=useState('// Start coding here...\n\nfunction solution(input) {\n    // Your code here\n    return input;\n}\n');
    const [language, setLanguage]=useState('javascript');
    const [output, setOutput]=useState('');
    const [isRunning, setIsRunning]=useState(false);

    // Questions
    const [questions, setQuestions]=useState([]);
    const [currentQuestion, setCurrentQuestion]=useState(null);

    // Timer
    const [timerDuration, setTimerDuration]=useState(0);
    const [isTimerRunning, setIsTimerRunning]=useState(false);

    // Proctoring events
    const [proctoringAlerts, setProctoringAlerts]=useState([]);

    // Refs
    const localVideoRef=useRef();
    const secondaryVideoRef=useRef();
    const screenVideoRef=useRef();

    // Initialize session
    useEffect(() =>
    {
        initializeSession();

        return () =>
        {
            liveInterviewService.cleanup();
        };
    }, [sessionId]);

    const initializeSession=async () =>
    {
        try
        {
            // Get session details
            const sessionData=await liveInterviewService.getSession(sessionId, accessCode);
            if (!sessionData.success)
            {
                alert('Invalid session or access code');
                navigate('/');
                return;
            }
            setSession(sessionData.session);

            // Setup event callbacks
            setupCallbacks();

            // Initialize cameras
            const stream=await liveInterviewService.initPrimaryCamera();
            setLocalStream(stream);
            if (localVideoRef.current)
            {
                localVideoRef.current.srcObject=stream;
            }

            // Join the session
            await liveInterviewService.joinSession(sessionId, userName, role, accessCode);
            setIsJoined(true);

            // Load questions if recruiter
            if (role==='recruiter')
            {
                loadQuestions();
            }
        } catch (error)
        {
            console.error('Failed to initialize session:', error);
            alert('Failed to join interview: '+error.message);
        }
    };

    const setupCallbacks=() =>
    {
        liveInterviewService.on('onParticipantJoined', (data) =>
        {
            setParticipants(prev => [...prev, data]);
        });

        liveInterviewService.on('onParticipantLeft', (data) =>
        {
            setParticipants(prev => prev.filter(p => p.socketId!==data.socketId));
            setRemoteStreams(prev =>
            {
                const newMap=new Map(prev);
                newMap.delete(data.socketId);
                return newMap;
            });
        });

        liveInterviewService.on('onRoomState', (data) =>
        {
            setParticipants(data.participants||[]);
            if (data.codeState)
            {
                setCode(data.codeState.code||code);
                setLanguage(data.codeState.language||language);
            }
        });

        liveInterviewService.on('onRemoteStream', (socketId, streamType, stream) =>
        {
            setRemoteStreams(prev =>
            {
                const newMap=new Map(prev);
                if (!newMap.has(socketId))
                {
                    newMap.set(socketId, {});
                }
                newMap.get(socketId)[streamType]=stream;
                return new Map(newMap);
            });
        });

        liveInterviewService.on('onCodeUpdate', (data) =>
        {
            setCode(data.code);
            setLanguage(data.language);
        });

        liveInterviewService.on('onQuestionSelected', (data) =>
        {
            setCurrentQuestion(data.question);
            if (data.question.starterCode)
            {
                setCode(data.question.starterCode[language]||'');
            }
        });

        liveInterviewService.on('onTimerUpdate', (data) =>
        {
            if (data.action==='start')
            {
                setIsTimerRunning(true);
                if (data.duration) setTimerDuration(data.duration);
            } else if (data.action==='pause')
            {
                setIsTimerRunning(false);
            } else if (data.action==='reset')
            {
                setTimerDuration(0);
                setIsTimerRunning(false);
            }
        });

        liveInterviewService.on('onScreenShareStarted', (data) =>
        {
            // Remote user started screen share
        });

        liveInterviewService.on('onScreenShareStopped', (data) =>
        {
            // Remote user stopped screen share
        });

        liveInterviewService.on('onInterviewEnded', (data) =>
        {
            alert('Interview has ended');
            navigate('/');
        });
    };

    const loadQuestions=async () =>
    {
        try
        {
            const response=await getQuestions();
            setQuestions(response.data||[]);
        } catch (error)
        {
            console.error('Failed to load questions:', error);
        }
    };

    // Media controls
    const toggleVideo=() =>
    {
        const newState=!isVideoEnabled;
        setIsVideoEnabled(newState);
        liveInterviewService.toggleVideo(newState);
    };

    const toggleAudio=() =>
    {
        const newState=!isAudioEnabled;
        setIsAudioEnabled(newState);
        liveInterviewService.toggleAudio(newState);
    };

    const toggleScreenShare=async () =>
    {
        if (isScreenSharing)
        {
            liveInterviewService.stopScreenShare();
            setScreenStream(null);
            setIsScreenSharing(false);
        } else
        {
            try
            {
                const stream=await liveInterviewService.startScreenShare();
                setScreenStream(stream);
                setIsScreenSharing(true);
                if (screenVideoRef.current)
                {
                    screenVideoRef.current.srcObject=stream;
                }
            } catch (error)
            {
                console.error('Screen share failed:', error);
            }
        }
    };

    const toggleSecondaryCamera=async () =>
    {
        if (isSecondaryCamera)
        {
            if (secondaryStream)
            {
                secondaryStream.getTracks().forEach(track => track.stop());
            }
            setSecondaryStream(null);
            setIsSecondaryCamera(false);
        } else
        {
            try
            {
                const stream=await liveInterviewService.initSecondaryCamera();
                setSecondaryStream(stream);
                setIsSecondaryCamera(true);
                if (secondaryVideoRef.current)
                {
                    secondaryVideoRef.current.srcObject=stream;
                }
            } catch (error)
            {
                console.error('Secondary camera failed:', error);
                alert('Could not access secondary camera. Make sure you have multiple cameras connected.');
            }
        }
    };

    // Code editor
    const handleCodeChange=(newCode) =>
    {
        setCode(newCode);
        liveInterviewService.sendCodeUpdate(newCode, language, null, null);
    };

    const handleLanguageChange=(newLanguage) =>
    {
        setLanguage(newLanguage);
        if (currentQuestion?.starterCode)
        {
            setCode(currentQuestion.starterCode[newLanguage]||'');
        }
        liveInterviewService.sendCodeUpdate(code, newLanguage, null, null);
    };

    const handleRunCode=async () =>
    {
        setIsRunning(true);
        setOutput('Running...');
        try
        {
            const response=await executeCode({code, language});
            setOutput(response.data.output||'No output');
        } catch (error)
        {
            setOutput('Error: '+(error.message||'Execution failed'));
        } finally
        {
            setIsRunning(false);
        }
    };

    const handleSubmitCode=async () =>
    {
        if (!currentQuestion)
        {
            setOutput('No question selected');
            return;
        }

        setIsRunning(true);
        try
        {
            const response=await submitCode({
                code,
                language,
                questionId: currentQuestion.id
            });

            const results=response.data;
            const summary=`Test Results: ${results.passed}/${results.total} passed\n\n`+
                results.results.map((r, i) =>
                    `Test ${i+1}: ${r.passed? '✓':'✗'} ${r.passed? 'Passed':'Failed'}\n`+
                    `Expected: ${r.expected}\nActual: ${r.actual}`
                ).join('\n\n');

            setOutput(summary);
        } catch (error)
        {
            setOutput('Error: '+(error.message||'Submission failed'));
        } finally
        {
            setIsRunning(false);
        }
    };

    // Question selection (recruiter only)
    const handleSelectQuestion=(question) =>
    {
        setCurrentQuestion(question);
        if (question.starterCode)
        {
            setCode(question.starterCode[language]||'');
        }
        liveInterviewService.selectQuestion(question);
    };

    // Timer controls (recruiter only)
    const handleTimerControl=(action, duration) =>
    {
        liveInterviewService.controlTimer(action, duration);
    };

    // End interview
    const handleEndInterview=() =>
    {
        if (window.confirm('Are you sure you want to end this interview?'))
        {
            liveInterviewService.endInterview('completed');
            navigate('/');
        }
    };

    // Get remote participant's primary stream
    const getRemotePrimaryStream=() =>
    {
        for (const [socketId, streams] of remoteStreams)
        {
            if (streams.primary)
            {
                return streams.primary;
            }
        }
        return null;
    };

    // Render waiting screen
    if (!isJoined)
    {
        return (
            <div className="live-interview-loading">
                <div className="loading-spinner"></div>
                <h2>Joining Interview...</h2>
                <p>Please wait while we connect you</p>
            </div>
        );
    }

    return (
        <div className="live-interview-room">
            {/* Header */}
            <header className="live-header">
                <div className="header-left">
                    <h1>Live Interview</h1>
                    {session&&(
                        <span className="session-info">
                            {session.companyName} - {session.jobTitle}
                        </span>
                    )}
                </div>
                <div className="header-center">
                    <LiveTimer
                        duration={timerDuration}
                        isRunning={isTimerRunning}
                        onControl={role==='recruiter'? handleTimerControl:null}
                    />
                </div>
                <div className="header-right">
                    <div className="participant-count">
                        <UserIcon size={16} />
                        <span>{participants.length+1} participant(s)</span>
                    </div>
                    <button
                        className="end-call-btn"
                        onClick={handleEndInterview}
                    >
                        <PhoneOffIcon size={18} />
                        End
                    </button>
                </div>
            </header>

            {/* Main content */}
            <div className="live-main">
                {/* Video Panel */}
                <div className="video-section">
                    {/* Remote Video (Large) */}
                    <div className="remote-video-container">
                        {getRemotePrimaryStream()? (
                            <video
                                autoPlay
                                playsInline
                                ref={el =>
                                {
                                    if (el) el.srcObject=getRemotePrimaryStream();
                                }}
                            />
                        ):(
                            <div className="video-placeholder">
                                <UserIcon size={64} />
                                <p>Waiting for {role==='recruiter'? 'candidate':'interviewer'}...</p>
                            </div>
                        )}
                        <div className="video-label">
                            {role==='recruiter'? 'Candidate':'Interviewer'}
                        </div>
                    </div>

                    {/* Local Videos */}
                    <div className="local-videos">
                        {/* Primary Camera */}
                        <div className="local-video-container primary">
                            <video
                                ref={localVideoRef}
                                autoPlay
                                playsInline
                                muted
                            />
                            <div className="video-label">You (Primary)</div>
                            {!isVideoEnabled&&(
                                <div className="video-off-overlay">
                                    <VideoOffIcon size={24} />
                                </div>
                            )}
                        </div>

                        {/* Secondary Camera */}
                        {isSecondaryCamera&&(
                            <div className="local-video-container secondary">
                                <video
                                    ref={secondaryVideoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                />
                                <div className="video-label">Secondary</div>
                            </div>
                        )}

                        {/* Screen Share Preview */}
                        {isScreenSharing&&screenStream&&(
                            <div className="local-video-container screen">
                                <video
                                    ref={screenVideoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                />
                                <div className="video-label">Screen</div>
                            </div>
                        )}
                    </div>

                    {/* Remote Secondary Camera View */}
                    {Array.from(remoteStreams.values()).map((streams, idx) => (
                        streams.secondary&&(
                            <div key={`secondary-${idx}`} className="remote-secondary-camera">
                                <video
                                    autoPlay
                                    playsInline
                                    ref={el =>
                                    {
                                        if (el) el.srcObject=streams.secondary;
                                    }}
                                />
                                <div className="video-label">Secondary Camera</div>
                            </div>
                        )
                    ))}

                    {/* Media Controls */}
                    <div className="media-controls">
                        <button
                            className={`control-btn ${!isAudioEnabled? 'disabled':''}`}
                            onClick={toggleAudio}
                            title={isAudioEnabled? 'Mute':'Unmute'}
                        >
                            {isAudioEnabled? <MicIcon size={20} />:<MicOffIcon size={20} />}
                        </button>
                        <button
                            className={`control-btn ${!isVideoEnabled? 'disabled':''}`}
                            onClick={toggleVideo}
                            title={isVideoEnabled? 'Turn off camera':'Turn on camera'}
                        >
                            {isVideoEnabled? <VideoIcon size={20} />:<VideoOffIcon size={20} />}
                        </button>
                        <button
                            className={`control-btn ${isSecondaryCamera? 'active':''}`}
                            onClick={toggleSecondaryCamera}
                            title="Toggle Secondary Camera"
                        >
                            <CameraIcon size={20} />
                            <span className="btn-label">2nd Cam</span>
                        </button>
                        <button
                            className={`control-btn ${isScreenSharing? 'active':''}`}
                            onClick={toggleScreenShare}
                            title={isScreenSharing? 'Stop sharing':'Share screen'}
                        >
                            <ScreenShareIcon size={20} />
                        </button>
                    </div>
                </div>

                {/* Code/Content Section */}
                <div className="content-section">
                    {/* Tab Navigation */}
                    <div className="content-tabs">
                        <button
                            className={`tab-btn ${activeTab==='code'? 'active':''}`}
                            onClick={() => setActiveTab('code')}
                        >
                            <CodeIcon size={16} />
                            Code
                        </button>
                        {role==='recruiter'&&(
                            <button
                                className={`tab-btn ${activeTab==='questions'? 'active':''}`}
                                onClick={() => setActiveTab('questions')}
                            >
                                Questions
                            </button>
                        )}
                    </div>

                    {/* Code Editor Tab */}
                    {activeTab==='code'&&(
                        <div className="code-section">
                            {/* Question Display */}
                            {currentQuestion&&(
                                <div className="question-display">
                                    <h3>{currentQuestion.title}</h3>
                                    <p>{currentQuestion.description}</p>
                                    {currentQuestion.examples&&(
                                        <div className="examples">
                                            <strong>Examples:</strong>
                                            <pre>{JSON.stringify(currentQuestion.examples, null, 2)}</pre>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Editor Controls */}
                            <div className="editor-controls">
                                <select
                                    value={language}
                                    onChange={(e) => handleLanguageChange(e.target.value)}
                                    className="language-select"
                                >
                                    <option value="javascript">JavaScript</option>
                                    <option value="python">Python</option>
                                    <option value="java">Java</option>
                                    <option value="cpp">C++</option>
                                    <option value="csharp">C#</option>
                                </select>
                                <div className="editor-actions">
                                    <button
                                        className="run-btn"
                                        onClick={handleRunCode}
                                        disabled={isRunning}
                                    >
                                        <PlayIcon size={16} />
                                        Run
                                    </button>
                                    {currentQuestion&&(
                                        <button
                                            className="submit-btn"
                                            onClick={handleSubmitCode}
                                            disabled={isRunning}
                                        >
                                            <CheckIcon size={16} />
                                            Submit
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Code Editor */}
                            <div className="code-editor-container">
                                <CodeEditor
                                    code={code}
                                    language={language}
                                    onChange={handleCodeChange}
                                    readOnly={false}
                                />
                            </div>

                            {/* Output Panel */}
                            <div className="output-panel">
                                <div className="output-header">
                                    <span>Output</span>
                                    {isRunning&&<span className="running-indicator">Running...</span>}
                                </div>
                                <pre className="output-content">{output||'Run your code to see output'}</pre>
                            </div>
                        </div>
                    )}

                    {/* Questions Tab (Recruiter) */}
                    {activeTab==='questions'&&role==='recruiter'&&(
                        <div className="questions-section">
                            <h3>Select a Question</h3>
                            <div className="questions-list">
                                {questions.map((q) => (
                                    <div
                                        key={q.id}
                                        className={`question-item ${currentQuestion?.id===q.id? 'selected':''}`}
                                        onClick={() => handleSelectQuestion(q)}
                                    >
                                        <h4>{q.title}</h4>
                                        <span className={`difficulty ${q.difficulty}`}>
                                            {q.difficulty}
                                        </span>
                                        <p>{q.description?.substring(0, 100)}...</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Chat Panel */}
                {showChat&&(
                    <div className="chat-section">
                        <ChatPanel
                            interviewId={sessionId}
                            userName={userName}
                            minimized={false}
                        />
                    </div>
                )}
            </div>

            {/* Proctoring Alerts */}
            {proctoringAlerts.length>0&&role==='recruiter'&&(
                <div className="proctoring-alerts">
                    {proctoringAlerts.slice(-3).map((alert, idx) => (
                        <div key={idx} className={`alert-item ${alert.severity}`}>
                            <AlertIcon size={16} />
                            <span>{alert.message||alert.type}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Toggle Chat Button */}
            <button
                className={`toggle-chat-btn ${showChat? 'active':''}`}
                onClick={() => setShowChat(!showChat)}
            >
                <ChatIcon size={20} />
            </button>
        </div>
    );
}

export default LiveInterviewRoom;
