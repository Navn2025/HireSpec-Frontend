import {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {useAuth} from '../contexts/AuthContext';
import './CandidateDashboard.css';

function CandidateDashboard()
{
    const navigate=useNavigate();
    const {user}=useAuth();
    const [applications, setApplications]=useState([]);
    const [assessments, setAssessments]=useState([]);
    const [loading, setLoading]=useState(true);
    const [stats, setStats]=useState({
        totalApplications: 0,
        pendingAssessments: 0,
        completedAssessments: 0,
        interviewsScheduled: 0
    });

    const AUTH_API_URL=import.meta.env.VITE_AUTH_API_URL||'http://localhost:5000';

    useEffect(() =>
    {
        if (user)
        {
            fetchDashboardData();
        }
    }, [user]);

    const fetchDashboardData=async () =>
    {
        setLoading(true);
        try
        {
            // Fetch applications
            const applicationsRes=await fetch(`${AUTH_API_URL}/api/candidate/applications`, {
                credentials: 'include'
            });
            if (applicationsRes.ok)
            {
                const applicationsData=await applicationsRes.json();
                setApplications(applicationsData.applications||[]);
            }

            // Fetch assessments
            const assessmentsRes=await fetch(`${AUTH_API_URL}/api/candidate/assessments`, {
                credentials: 'include'
            });
            if (assessmentsRes.ok)
            {
                const assessmentsData=await assessmentsRes.json();
                setAssessments(assessmentsData.assessments||[]);
                calculateStats(applicationsData?.applications||[], assessmentsData.assessments||[]);
            }
        } catch (error)
        {
            console.error('Error fetching dashboard data:', error);
        } finally
        {
            setLoading(false);
        }
    };

    const calculateStats=(apps, assesss) =>
    {
        const totalApplications=apps.length;
        const pendingAssessments=assesss.filter(a => a.status==='Pending').length;
        const completedAssessments=assesss.filter(a => a.status==='Completed').length;
        const interviewsScheduled=assesss.filter(a => a.status==='Scheduled').length;

        setStats({
            totalApplications,
            pendingAssessments,
            completedAssessments,
            interviewsScheduled
        });
    };

    const getStatusBadgeClass=(status) =>
    {
        switch (status?.toLowerCase())
        {
            case 'applied': return 'status-applied';
            case 'pending': return 'status-pending';
            case 'scheduled': return 'status-scheduled';
            case 'completed': return 'status-completed';
            case 'rejected': return 'status-rejected';
            default: return '';
        }
    };

    if (loading)
    {
        return (
            <div className="candidate-dashboard">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="candidate-dashboard">
            <div className="dashboard-header">
                <h1>Welcome, {user?.username||'Candidate'}!</h1>
                <p>Your personalized dashboard for job applications and assessments</p>
            </div>

            {/* Stats Section */}
            <div className="stats-section">
                <div className="stat-card">
                    <div className="stat-icon">📝</div>
                    <div className="stat-value">{stats.totalApplications}</div>
                    <div className="stat-label">Applications</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">⏳</div>
                    <div className="stat-value">{stats.pendingAssessments}</div>
                    <div className="stat-label">Pending Assessments</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-value">{stats.completedAssessments}</div>
                    <div className="stat-label">Completed</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">📅</div>
                    <div className="stat-value">{stats.interviewsScheduled}</div>
                    <div className="stat-label">Interviews</div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
                <h2>Quick Actions</h2>
                <div className="actions-grid">
                    <button className="action-card" onClick={() => navigate('/coding-practice')}>
                        <div className="action-icon">💻</div>
                        <h3>Coding Practice</h3>
                        <p>Practice DSA problems to improve your skills</p>
                    </button>
                    <button className="action-card" onClick={() => navigate('/ai-interview-setup')}>
                        <div className="action-icon">🤖</div>
                        <h3>AI Interview</h3>
                        <p>Practice with our AI interviewer</p>
                    </button>
                    <button className="action-card" onClick={() => navigate('/practice-setup')}>
                        <div className="action-icon">🎯</div>
                        <h3>Mock Interview</h3>
                        <p>Prepare with practice interviews</p>
                    </button>
                    <button className="action-card" onClick={() => navigate('/axiom-chat')}>
                        <div className="action-icon">💬</div>
                        <h3>Axiom Chat</h3>
                        <p>Get AI-powered career advice</p>
                    </button>
                </div>
            </div>

            {/* Recent Applications */}
            <div className="section">
                <h2>Recent Applications</h2>
                {applications.length===0? (
                    <div className="empty-state">
                        <p>No applications yet. Browse job openings to apply!</p>
                    </div>
                ):(
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Job Title</th>
                                    <th>Company</th>
                                    <th>Applied Date</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {applications.slice(0, 5).map((app) => (
                                    <tr key={app.id}>
                                        <td>{app.job_title||'N/A'}</td>
                                        <td>{app.company_name||'N/A'}</td>
                                        <td>{new Date(app.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <span className={`status-badge ${getStatusBadgeClass(app.status)}`}>
                                                {app.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Upcoming Assessments */}
            <div className="section">
                <h2>Upcoming Assessments</h2>
                {assessments.filter(a => a.status==='Pending'||a.status==='Scheduled').length===0? (
                    <div className="empty-state">
                        <p>No pending assessments. Keep applying to job openings!</p>
                    </div>
                ):(
                    <div className="assessments-grid">
                        {assessments
                            .filter(a => a.status==='Pending'||a.status==='Scheduled')
                            .slice(0, 4)
                            .map((assessment) => (
                                <div key={assessment.id} className="assessment-card">
                                    <h3>{assessment.job_title||'Assessment'}</h3>
                                    <p className="assessment-company">{assessment.company_name||''}</p>
                                    <span className={`status-badge ${getStatusBadgeClass(assessment.status)}`}>
                                        {assessment.status}
                                    </span>
                                    <button
                                        className="start-btn"
                                        onClick={() => navigate(`/assessment/${assessment.id}`)}
                                    >
                                        Start Assessment
                                    </button>
                                </div>
                            ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default CandidateDashboard;
