import {useState, useEffect, useRef} from 'react';
import {useParams, useLocation, useNavigate} from 'react-router-dom';
import {RobotIcon, ChatIcon, MicIcon, RecordIcon, ConfettiIcon} from '../components/Icons';
import './AIInterviewRoom.css';

function AIInterviewRoom()
{
    const {sessionId}=useParams();
    const location=useLocation();
    const navigate=useNavigate();

    const [greeting, setGreeting]=useState(location.state?.greeting||'');
    const [currentQuestion, setCurrentQuestion]=useState(location.state?.firstQuestion||'');
    const [questionMetadata, setQuestionMetadata]=useState(location.state?.questionMetadata||{});
    const [answer, setAnswer]=useState('');
    const [isListening, setIsListening]=useState(false);
    const [loading, setLoading]=useState(false);
    const [aiMessage, setAiMessage]=useState('');
    const [evaluation, setEvaluation]=useState(null);
    const [isFollowUp, setIsFollowUp]=useState(false);
    const [interviewComplete, setInterviewComplete]=useState(false);
    const [showGreeting, setShowGreeting]=useState(true);
    const [inputMode, setInputMode]=useState('text'); // 'text' or 'voice'

    const recognitionRef=useRef(null);
    const speechSynthRef=useRef(null);

    useEffect(() =>
    {
        // Initialize speech recognition
        if ('webkitSpeechRecognition' in window||'SpeechRecognition' in window)
        {
            const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
            recognitionRef.current=new SpeechRecognition();
            recognitionRef.current.continuous=false;
            recognitionRef.current.interimResults=true;

            recognitionRef.current.onresult=(event) =>
            {
                const transcript=Array.from(event.results)
                    .map(result => result[0].transcript)
                    .join('');
                setAnswer(transcript);
            };

            recognitionRef.current.onend=() =>
            {
                setIsListening(false);
            };
        }

        // Initialize speech synthesis
        speechSynthRef.current=window.speechSynthesis;

        // Speak greeting on load
        if (greeting&&showGreeting)
        {
            speakText(greeting);
        }
    }, []);

    const speakText=(text) =>
    {
        if (speechSynthRef.current&&text)
        {
            speechSynthRef.current.cancel(); // Cancel any ongoing speech
            const utterance=new SpeechSynthesisUtterance(text);
            utterance.rate=0.9;
            utterance.pitch=1;
            utterance.volume=1;
            speechSynthRef.current.speak(utterance);
        }
    };

    const toggleVoiceInput=() =>
    {
        if (!recognitionRef.current)
        {
            alert('Speech recognition is not supported in your browser.');
            return;
        }

        if (isListening)
        {
            recognitionRef.current.stop();
            setIsListening(false);
        } else
        {
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const handleStartInterview=() =>
    {
        setShowGreeting(false);
        speakText(currentQuestion);
    };

    const handleSubmitAnswer=async () =>
    {
        if (!answer.trim())
        {
            alert('Please provide an answer');
            return;
        }

        setLoading(true);
        setEvaluation(null);

        try
        {
            const endpoint=isFollowUp
                ? 'http://localhost:8080/api/ai-interview/follow-up-answer'
                :'http://localhost:8080/api/ai-interview/answer';

            const response=await fetch(endpoint, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    sessionId,
                    answer: answer.trim()
                })
            });

            if (!response.ok)
            {
                throw new Error('Failed to submit answer');
            }

            const data=await response.json();

            setAiMessage(data.message||'');

            if (data.evaluation)
            {
                setEvaluation(data.evaluation);
            }

            if (data.hasFollowUp)
            {
                setIsFollowUp(true);
                setCurrentQuestion(data.followUpQuestion);
                speakText(data.message+' '+data.followUpQuestion);
            } else if (data.nextQuestion)
            {
                setIsFollowUp(false);
                setCurrentQuestion(data.nextQuestion);
                setQuestionMetadata(data.questionMetadata);
                speakText(data.message+' '+data.nextQuestion);
            } else if (data.interviewComplete)
            {
                setInterviewComplete(true);
                speakText(data.message);
                // Generate report
                await generateReport();
            }

            setAnswer('');

        } catch (error)
        {
            console.error('Error submitting answer:', error);
            alert('Failed to submit answer. Please try again.');
        } finally
        {
            setLoading(false);
        }
    };

    const generateReport=async () =>
    {
        try
        {
            const response=await fetch('http://localhost:8080/api/ai-interview/report', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({sessionId})
            });

            if (!response.ok)
            {
                throw new Error('Failed to generate report');
            }

            const report=await response.json();

            // Navigate to report page
            navigate(`/ai-interview-report/${sessionId}`, {
                state: {report}
            });
        } catch (error)
        {
            console.error('Error generating report:', error);
            alert('Failed to generate report');
        }
    };

    if (showGreeting)
    {
        return (
            <div className="ai-interview-room greeting-view">
                <div className="greeting-container">
                    <div className="ai-avatar"><RobotIcon size={48} /></div>
                    <div className="greeting-text">
                        {greeting.split('\n').map((line, i) => (
                            <p key={i}>{line}</p>
                        ))}
                    </div>
                    <button className="ready-button" onClick={handleStartInterview}>
                        I'm Ready! Let's Begin
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="ai-interview-room">
            <div className="interview-header">
                <div className="header-left">
                    <h2><RobotIcon size={24} /> AI Interview</h2>
                    <div className="role-badge">{location.state?.role}</div>
                </div>
                <div className="header-right">
                    <div className="progress-indicator">
                        Question {questionMetadata.number||1} of {questionMetadata.total||5}
                    </div>
                </div>
            </div>

            <div className="interview-content">
                <div className="question-section">
                    <div className="question-meta">
                        {questionMetadata.topic&&(
                            <span className="topic-badge">{questionMetadata.topic}</span>
                        )}
                        {questionMetadata.difficulty&&(
                            <span className={`difficulty-badge ${questionMetadata.difficulty.toLowerCase()}`}>
                                {questionMetadata.difficulty}
                            </span>
                        )}
                        {isFollowUp&&(
                            <span className="followup-badge">Follow-up</span>
                        )}
                    </div>

                    <div className="ai-question">
                        <div className="ai-icon"><RobotIcon size={20} /></div>
                        <div className="question-text">
                            {currentQuestion}
                        </div>
                    </div>

                    {aiMessage&&(
                        <div className="ai-message">
                            {aiMessage}
                        </div>
                    )}

                    {evaluation&&(
                        <div className="quick-evaluation">
                            <div className="eval-score">
                                Score: {evaluation.overallScore}/100
                            </div>
                            <div className="eval-feedback">
                                {evaluation.feedback}
                            </div>
                        </div>
                    )}
                </div>

                <div className="answer-section">
                    <div className="input-mode-toggle">
                        <button
                            className={inputMode==='text'? 'active':''}
                            onClick={() => setInputMode('text')}
                        >
                            <ChatIcon size={16} /> Text
                        </button>
                        <button
                            className={inputMode==='voice'? 'active':''}
                            onClick={() => setInputMode('voice')}
                        >
                            <MicIcon size={16} /> Voice
                        </button>
                    </div>

                    {inputMode==='text'? (
                        <textarea
                            className="answer-input"
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            placeholder="Type your answer here..."
                            disabled={loading||interviewComplete}
                            rows={6}
                        />
                    ):(
                        <div className="voice-input-container">
                            <button
                                className={`voice-button ${isListening? 'listening':''}`}
                                onClick={toggleVoiceInput}
                                disabled={loading||interviewComplete}
                            >
                                {isListening? <><RecordIcon size={16} color="#737373" /> Stop Recording</>:<><MicIcon size={16} /> Start Recording</>}
                            </button>
                            {answer&&(
                                <div className="voice-transcript">
                                    <strong>Transcript:</strong>
                                    <p>{answer}</p>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="answer-actions">
                        <button
                            className="submit-button"
                            onClick={handleSubmitAnswer}
                            disabled={loading||!answer.trim()||interviewComplete}
                        >
                            {loading? 'Submitting...':'Submit Answer'}
                        </button>
                    </div>
                </div>
            </div>

            {interviewComplete&&(
                <div className="completion-overlay">
                    <div className="completion-message">
                        <h2><ConfettiIcon size={28} /> Interview Complete!</h2>
                        <p>Generating your comprehensive report...</p>
                        <div className="loader"></div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AIInterviewRoom;
