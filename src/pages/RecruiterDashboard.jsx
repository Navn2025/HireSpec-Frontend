import {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import './RecruiterDashboard.css';

function RecruiterDashboard()
{
    const navigate=useNavigate();
    const [sessions, setSessions]=useState([]);
    const [loading, setLoading]=useState(true);
    const [filterStatus, setFilterStatus]=useState('all');
    const [filterRole, setFilterRole]=useState('all');
    const [searchTerm, setSearchTerm]=useState('');
    const [stats, setStats]=useState({
        total: 0,
        active: 0,
        completed: 0,
        avgScore: 0
    });

    useEffect(() =>
    {
        fetchSessions();
    }, [filterStatus, filterRole]);

    const fetchSessions=async () =>
    {
        setLoading(true);
        try
        {
            let url='http://localhost:5000/api/ai-interview/sessions';
            const params=new URLSearchParams();

            if (filterStatus!=='all') params.append('status', filterStatus);
            if (filterRole!=='all') params.append('role', filterRole);

            if (params.toString()) url+=`?${params.toString()}`;

            const response=await fetch(url);
            const data=await response.json();

            setSessions(data.sessions);
            calculateStats(data.sessions);
        } catch (error)
        {
            console.error('Error fetching sessions:', error);
        } finally
        {
            setLoading(false);
        }
    };

    const calculateStats=(sessionsList) =>
    {
        const total=sessionsList.length;
        const active=sessionsList.filter(s => s.status==='active').length;
        const completed=sessionsList.filter(s => s.status==='completed').length;
        const scoresSum=sessionsList
            .filter(s => s.overallScore!==null)
            .reduce((sum, s) => sum+s.overallScore, 0);
        const avgScore=completed>0? Math.round(scoresSum/completed):0;

        setStats({total, active, completed, avgScore});
    };

    const viewReport=(sessionId) =>
    {
        navigate(`/ai-interview-report/${sessionId}`);
    };

    const getStatusBadgeClass=(status) =>
    {
        switch (status)
        {
            case 'active': return 'status-active';
            case 'completed': return 'status-completed';
            case 'ended': return 'status-ended';
            default: return '';
        }
    };

    const getRecommendationBadgeClass=(recommendation) =>
    {
        if (!recommendation) return 'rec-none';
        if (recommendation.includes('Strongly')) return 'rec-strongly';
        if (recommendation.includes('Not')) return 'rec-not';
        if (recommendation==='Recommend') return 'rec-yes';
        return 'rec-maybe';
    };

    const getScoreColor=(score) =>
    {
        if (score>=80) return '#4caf50';
        if (score>=60) return '#ff9800';
        return '#f44336';
    };

    const filteredSessions=sessions.filter(session =>
        session.candidateName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const roles=['all', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Data Scientist', 'DevOps Engineer'];

    return (
        <div className="recruiter-dashboard">
            <div className="dashboard-header">
                <div className="header-content">
                    <h1>👔 Recruiter Dashboard</h1>
                    <p>Monitor and manage interview sessions</p>
                </div>
                <div className="header-actions">
                    <button
                        className="applicant-btn"
                        onClick={() => navigate('/applicant-management')}
                    >
                        📋 Manage Applicants
                    </button>
                    <button
                        className="create-interview-btn"
                        onClick={() => navigate('/create-live-interview')}
                    >
                        📹 Schedule Live Interview
                    </button>
                    <button
                        className="proctor-btn"
                        onClick={() => navigate('/proctor-dashboard')}
                    >
                        🛡️ Proctor Dashboard
                    </button>
                </div>
            </div>

            <div className="stats-section">
                <div className="stat-card">
                    <div className="stat-icon">📊</div>
                    <div className="stat-value">{stats.total}</div>
                    <div className="stat-label">Total Interviews</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">🟢</div>
                    <div className="stat-value">{stats.active}</div>
                    <div className="stat-label">Active Sessions</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-value">{stats.completed}</div>
                    <div className="stat-label">Completed</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">🎯</div>
                    <div className="stat-value">{stats.avgScore}</div>
                    <div className="stat-label">Average Score</div>
                </div>
            </div>

            <div className="filters-section">
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="🔍 Search by candidate name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="filter-group">
                    <label>Status:</label>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                        <option value="all">All</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="ended">Ended</option>
                    </select>
                </div>

                <div className="filter-group">
                    <label>Role:</label>
                    <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
                        {roles.map(role => (
                            <option key={role} value={role}>
                                {role==='all'? 'All Roles':role}
                            </option>
                        ))}
                    </select>
                </div>

                <button className="refresh-button" onClick={fetchSessions}>
                    🔄 Refresh
                </button>
            </div>

            <div className="sessions-section">
                {loading? (
                    <div className="loading-state">
                        <div className="loader"></div>
                        <p>Loading sessions...</p>
                    </div>
                ):filteredSessions.length===0? (
                    <div className="empty-state">
                        <div className="empty-icon">📭</div>
                        <h3>No interviews found</h3>
                        <p>No interview sessions match your current filters</p>
                    </div>
                ):(
                    <div className="sessions-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Candidate</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                    <th>Questions</th>
                                    <th>Score</th>
                                    <th>Recommendation</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSessions.map((session) => (
                                    <tr key={session.sessionId}>
                                        <td className="candidate-cell">
                                            <strong>{session.candidateName}</strong>
                                        </td>
                                        <td>{session.role}</td>
                                        <td>
                                            <span className={`status-badge ${getStatusBadgeClass(session.status)}`}>
                                                {session.status}
                                            </span>
                                        </td>
                                        <td className="date-cell">
                                            {new Date(session.startTime).toLocaleDateString()}
                                            <br />
                                            <small>{new Date(session.startTime).toLocaleTimeString()}</small>
                                        </td>
                                        <td className="questions-cell">
                                            {session.questionsAnswered} / {session.totalQuestions}
                                        </td>
                                        <td>
                                            {session.overallScore!==null? (
                                                <div className="score-display" style={{color: getScoreColor(session.overallScore)}}>
                                                    <strong>{session.overallScore}</strong>/100
                                                </div>
                                            ):(
                                                <span className="no-score">-</span>
                                            )}
                                        </td>
                                        <td>
                                            {session.recommendation? (
                                                <span className={`recommendation-badge ${getRecommendationBadgeClass(session.recommendation)}`}>
                                                    {session.recommendation}
                                                </span>
                                            ):(
                                                <span className="no-recommendation">-</span>
                                            )}
                                        </td>
                                        <td className="actions-cell">
                                            {session.status==='completed'&&session.overallScore!==null? (
                                                <button
                                                    className="action-btn view-btn"
                                                    onClick={() => viewReport(session.sessionId)}
                                                >
                                                    📄 View Report
                                                </button>
                                            ):session.status==='active'? (
                                                <span className="in-progress">⏳ In Progress</span>
                                            ):(
                                                <span className="no-action">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default RecruiterDashboard;
