import {useEffect, useState} from 'react';
import {useParams, useLocation, useNavigate} from 'react-router-dom';
import {TargetIcon, ChartIcon, BrainIcon, ChatIcon, StrengthIcon, CheckCircleIcon, TrendUpIcon, DocumentIcon, PrintIcon, RefreshIcon, HomeIcon} from '../components/Icons';
import './AIInterviewReport.css';

function AIInterviewReport()
{
    const {sessionId}=useParams();
    const location=useLocation();
    const navigate=useNavigate();
    const [report, setReport]=useState(location.state?.report||null);
    const [loading, setLoading]=useState(!report);

    useEffect(() =>
    {
        if (!report)
        {
            fetchReport();
        }
    }, [sessionId]);

    const fetchReport=async () =>
    {
        try
        {
            const response=await fetch(`http://localhost:8080/api/ai-interview/report/${sessionId}`);
            if (!response.ok)
            {
                throw new Error('Failed to fetch report');
            }
            const data=await response.json();
            setReport(data);
        } catch (error)
        {
            console.error('Error fetching report:', error);
        } finally
        {
            setLoading(false);
        }
    };

    const getScoreColor=(score) =>
    {
        if (score>=80) return '#4caf50';
        if (score>=60) return '#ff9800';
        return '#f44336';
    };

    const getRecommendationColor=(recommendation) =>
    {
        if (recommendation.includes('Strongly')) return '#4caf50';
        if (recommendation.includes('Not')) return '#f44336';
        if (recommendation==='Recommend') return '#2196f3';
        return '#ff9800';
    };

    if (loading)
    {
        return (
            <div className="report-loading">
                <div className="loader"></div>
                <p>Loading report...</p>
            </div>
        );
    }

    if (!report)
    {
        return (
            <div className="report-error">
                <h2>Report not found</h2>
                <button onClick={() => navigate('/')}>Go Home</button>
            </div>
        );
    }

    return (
        <div className="ai-interview-report">
            <div className="report-container">
                <div className="report-header">
                    <h1><TargetIcon size={28} /> Interview Report</h1>
                    <div className="candidate-info">
                        <h2>{report.candidateName}</h2>
                        <p className="role-title">{report.role}</p>
                        <p className="interview-date">
                            {new Date(report.interviewDate).toLocaleDateString()} • {report.duration} minutes
                        </p>
                    </div>
                </div>

                <div className="overall-score-section">
                    <div className="score-circle" style={{borderColor: getScoreColor(report.scores.overall)}}>
                        <div className="score-value" style={{color: getScoreColor(report.scores.overall)}}>
                            {report.scores.overall}
                        </div>
                        <div className="score-label">Overall Score</div>
                    </div>
                    <div className="recommendation-box" style={{borderColor: getRecommendationColor(report.recommendation.recommendation)}}>
                        <div className="recommendation-title">Hiring Recommendation</div>
                        <div className="recommendation-value" style={{color: getRecommendationColor(report.recommendation.recommendation)}}>
                            {report.recommendation.recommendation}
                        </div>
                        <div className="recommendation-reasoning">
                            {report.recommendation.reasoning}
                        </div>
                        <div className="fit-score">
                            Fit Score: {report.recommendation.fitScore}/100
                        </div>
                        <div className="next-steps">
                            <strong>Next Steps:</strong> {report.recommendation.nextSteps}
                        </div>
                    </div>
                </div>

                <div className="metrics-section">
                    <h3><ChartIcon size={20} /> Performance Metrics</h3>
                    <div className="metrics-grid">
                        <div className="metric-card">
                            <div className="metric-name"><BrainIcon size={16} /> Technical Knowledge</div>
                            <div className="metric-bar">
                                <div
                                    className="metric-fill"
                                    style={{
                                        width: `${report.scores.technicalKnowledge}%`,
                                        backgroundColor: getScoreColor(report.scores.technicalKnowledge)
                                    }}
                                ></div>
                            </div>
                            <div className="metric-score">{report.scores.technicalKnowledge}/100</div>
                        </div>

                        <div className="metric-card">
                            <div className="metric-name"><ChatIcon size={16} /> Communication</div>
                            <div className="metric-bar">
                                <div
                                    className="metric-fill"
                                    style={{
                                        width: `${report.scores.communication}%`,
                                        backgroundColor: getScoreColor(report.scores.communication)
                                    }}
                                ></div>
                            </div>
                            <div className="metric-score">{report.scores.communication}/100</div>
                        </div>

                        <div className="metric-card">
                            <div className="metric-name"><TargetIcon size={16} /> Problem Solving</div>
                            <div className="metric-bar">
                                <div
                                    className="metric-fill"
                                    style={{
                                        width: `${report.scores.problemSolving}%`,
                                        backgroundColor: getScoreColor(report.scores.problemSolving)
                                    }}
                                ></div>
                            </div>
                            <div className="metric-score">{report.scores.problemSolving}/100</div>
                        </div>

                        <div className="metric-card">
                            <div className="metric-name"><StrengthIcon size={16} /> Confidence</div>
                            <div className="metric-bar">
                                <div
                                    className="metric-fill"
                                    style={{
                                        width: `${report.scores.confidence}%`,
                                        backgroundColor: getScoreColor(report.scores.confidence)
                                    }}
                                ></div>
                            </div>
                            <div className="metric-score">{report.scores.confidence}/100</div>
                        </div>

                        <div className="metric-card">
                            <div className="metric-name"><CheckCircleIcon size={16} /> Consistency</div>
                            <div className="metric-bar">
                                <div
                                    className="metric-fill"
                                    style={{
                                        width: `${report.scores.consistency}%`,
                                        backgroundColor: getScoreColor(report.scores.consistency)
                                    }}
                                ></div>
                            </div>
                            <div className="metric-score">{report.scores.consistency}/100</div>
                        </div>
                    </div>
                </div>

                <div className="strengths-weaknesses-section">
                    <div className="strengths-box">
                        <h3><StrengthIcon size={18} /> Strengths</h3>
                        <ul>
                            {report.strengths.map((strength, index) => (
                                <li key={index}>{strength}</li>
                            ))}
                        </ul>
                    </div>
                    <div className="weaknesses-box">
                        <h3><TrendUpIcon size={18} /> Areas for Improvement</h3>
                        <ul>
                            {report.weaknesses.map((weakness, index) => (
                                <li key={index}>{weakness}</li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="questions-section">
                    <h3><DocumentIcon size={20} /> Question-by-Question Analysis</h3>
                    {report.questionDetails.map((detail, index) => (
                        <div key={index} className="question-detail-card">
                            <div className="question-header">
                                <span className="question-number">Q{index+1}</span>
                                <span className="question-score" style={{color: getScoreColor(detail.evaluation.overallScore)}}>
                                    {detail.evaluation.overallScore}/100
                                </span>
                            </div>
                            <div className="question-text">{detail.question}</div>
                            <div className="answer-text">
                                <strong>Answer:</strong>
                                <p>{detail.answer}</p>
                            </div>
                            {detail.followUps&&detail.followUps.length>0&&(
                                <div className="followups">
                                    {detail.followUps.map((followUp, i) => (
                                        <div key={i} className="followup-item">
                                            <div className="followup-question">
                                                <strong>Follow-up:</strong> {followUp.question}
                                            </div>
                                            {followUp.answer&&(
                                                <div className="followup-answer">
                                                    <strong>Response:</strong> {followUp.answer}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="evaluation-details">
                                <p><strong>Feedback:</strong> {detail.evaluation.detailedFeedback}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="report-actions">
                    <button className="action-button primary" onClick={() => window.print()}>
                        <PrintIcon size={16} /> Print Report
                    </button>
                    <button className="action-button" onClick={() => navigate('/ai-interview-setup')}>
                        <RefreshIcon size={16} /> Take Another Interview
                    </button>
                    <button className="action-button" onClick={() => navigate('/')}>
                        <HomeIcon size={16} /> Go Home
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AIInterviewReport;
