import {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {useAuth} from '../contexts/AuthContext';
import './Profile.css';

function Profile()
{
    const navigate=useNavigate();
    const {user}=useAuth();
    const [loading, setLoading]=useState(true);
    const [refreshing, setRefreshing]=useState(false);
    const [stats, setStats]=useState(null);
    const [aiAnalysis, setAiAnalysis]=useState(null);
    const [skills, setSkills]=useState([]);
    const [applications, setApplications]=useState([]);
    const [recentScores, setRecentScores]=useState([]);
    const [activeTab, setActiveTab]=useState('overview');

    const API_URL=import.meta.env.VITE_API_URL||'http://localhost:8080';

    useEffect(() =>
    {
        if (user?.id)
        {
            fetchProfileData();
        }
    }, [user]);

    const fetchProfileData=async () =>
    {
        setLoading(true);
        try
        {
            await Promise.all([
                fetchStats(),
                fetchAiAnalysis(),
                fetchSkills(),
                fetchApplications(),
                fetchRecentScores()
            ]);
        } catch (error)
        {
            console.error('Error fetching profile data:', error);
        } finally
        {
            setLoading(false);
        }
    };

    const fetchStats=async () =>
    {
        const response=await fetch(`${API_URL}/api/scores/${user.id}/summary`);
        const data=await response.json();
        if (data.success)
        {
            setStats(data.stats);
        }
    };

    const fetchAiAnalysis=async (refresh=false) =>
    {
        const response=await fetch(`${API_URL}/api/ai-analysis/${user.id}?refresh=${refresh}`);
        const data=await response.json();
        if (data.success)
        {
            setAiAnalysis(data.analysis);
        }
    };

    const fetchSkills=async () =>
    {
        const response=await fetch(`${API_URL}/api/scores/${user.id}/skills`);
        const data=await response.json();
        if (data.success)
        {
            setSkills(data.skills||[]);
        }
    };

    const fetchApplications=async () =>
    {
        const response=await fetch(`${API_URL}/api/jobs/applications/${user.id}?limit=5`);
        const data=await response.json();
        if (data.success)
        {
            setApplications(data.applications||[]);
        }
    };

    const fetchRecentScores=async () =>
    {
        const response=await fetch(`${API_URL}/api/scores/${user.id}?limit=10`);
        const data=await response.json();
        if (data.success)
        {
            setRecentScores(data.scores||[]);
        }
    };

    const handleRefreshAnalysis=async () =>
    {
        setRefreshing(true);
        try
        {
            await fetchAiAnalysis(true);
        } finally
        {
            setRefreshing(false);
        }
    };

    const getScoreColor=(score) =>
    {
        if (score>=80) return '#d4d4d4';
        if (score>=60) return '#a3a3a3';
        if (score>=40) return '#737373';
        return '#525252';
    };

    const getProficiencyColor=(level) =>
    {
        const colors={
            'expert': '#ffffff',
            'advanced': '#d4d4d4',
            'intermediate': '#a3a3a3',
            'beginner': '#737373'
        };
        return colors[level]||'#888';
    };

    if (!user)
    {
        return (
            <div className="profile-page">
                <div className="auth-required">
                    <h2>Please Log In</h2>
                    <p>You need to be logged in to view your profile.</p>
                    <button onClick={() => navigate('/login')}>Log In</button>
                </div>
            </div>
        );
    }

    if (loading)
    {
        return (
            <div className="profile-page">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading your profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-page">
            {/* Profile Header */}
            <div className="profile-header">
                <div className="profile-avatar">
                    {user.profile_image? (
                        <img src={user.profile_image} alt={user.username} />
                    ):(
                        <div className="avatar-placeholder">
                            {user.username?.charAt(0).toUpperCase()||'?'}
                        </div>
                    )}
                </div>
                <div className="profile-info">
                    <h1>{user.full_name||user.username}</h1>
                    <p className="username">@{user.username}</p>
                    <p className="bio">{user.bio||'No bio yet'}</p>
                    <div className="profile-links">
                        {user.linkedin_url&&(
                            <a href={user.linkedin_url} target="_blank" rel="noopener noreferrer">LinkedIn</a>
                        )}
                        {user.github_url&&(
                            <a href={user.github_url} target="_blank" rel="noopener noreferrer">GitHub</a>
                        )}
                    </div>
                </div>
                <div className="profile-stats-quick">
                    <div className="stat-item">
                        <span className="stat-value">{stats?.total_activities||0}</span>
                        <span className="stat-label">Activities</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">{Math.round(stats?.average_score||0)}%</span>
                        <span className="stat-label">Avg Score</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">{stats?.coding_problems_solved||0}</span>
                        <span className="stat-label">Problems</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">{stats?.current_streak_days||0}🔥</span>
                        <span className="stat-label">Streak</span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="profile-tabs">
                <button
                    className={activeTab==='overview'? 'active':''}
                    onClick={() => setActiveTab('overview')}
                >
                    📊 Overview
                </button>
                <button
                    className={activeTab==='analysis'? 'active':''}
                    onClick={() => setActiveTab('analysis')}
                >
                    🧠 AI Analysis
                </button>
                <button
                    className={activeTab==='skills'? 'active':''}
                    onClick={() => setActiveTab('skills')}
                >
                    💡 Skills
                </button>
                <button
                    className={activeTab==='applications'? 'active':''}
                    onClick={() => setActiveTab('applications')}
                >
                    📝 Applications
                </button>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
                {activeTab==='overview'&&(
                    <div className="overview-tab">
                        {/* Performance Cards */}
                        <div className="performance-grid">
                            <div className="performance-card">
                                <h3>💻 Coding</h3>
                                <div className="perf-value">{Math.round(stats?.coding_score||0)}</div>
                                <div className="perf-label">{stats?.coding_problems_solved||0} problems solved</div>
                            </div>
                            <div className="performance-card">
                                <h3>🎤 Interviews</h3>
                                <div className="perf-value">{Math.round(stats?.interview_score||0)}</div>
                                <div className="perf-label">{stats?.interview_count||0} completed</div>
                            </div>
                            <div className="performance-card">
                                <h3>🏅 Contests</h3>
                                <div className="perf-value">{Math.round(stats?.contest_score||0)}</div>
                                <div className="perf-label">{stats?.contest_count||0} participated</div>
                            </div>
                            <div className="performance-card">
                                <h3>⚡ Challenges</h3>
                                <div className="perf-value">{Math.round(stats?.challenge_score||0)}</div>
                                <div className="perf-label">{stats?.challenge_count||0} completed</div>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="recent-activity">
                            <h3>Recent Activity</h3>
                            {recentScores.length===0? (
                                <p className="no-activity">No recent activity. Start practicing!</p>
                            ):(
                                <div className="activity-list">
                                    {recentScores.map((score, index) => (
                                        <div key={index} className="activity-item">
                                            <div className="activity-icon">
                                                {getActivityIcon(score.activity_type)}
                                            </div>
                                            <div className="activity-details">
                                                <span className="activity-title">{score.activity_title||score.activity_type}</span>
                                                <span className="activity-date">
                                                    {new Date(score.completed_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div
                                                className="activity-score"
                                                style={{color: getScoreColor(score.percentage)}}
                                            >
                                                {Math.round(score.percentage)}%
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab==='analysis'&&(
                    <div className="analysis-tab">
                        <div className="analysis-header">
                            <h2>🧠 AI Performance Analysis</h2>
                            <button
                                className="refresh-btn"
                                onClick={handleRefreshAnalysis}
                                disabled={refreshing}
                            >
                                {refreshing? 'Analyzing...':'🔄 Refresh Analysis'}
                            </button>
                        </div>

                        {!aiAnalysis? (
                            <div className="no-analysis">
                                <p>No analysis available yet. Complete some activities to get personalized insights!</p>
                                <button onClick={() => navigate('/coding-practice')}>Start Practicing</button>
                            </div>
                        ):(
                            <>
                                {/* Overall Assessment */}
                                <div className="assessment-card">
                                    <h3>Overall Assessment</h3>
                                    <p>{aiAnalysis.overall_assessment}</p>
                                </div>

                                {/* Skill Radar */}
                                {aiAnalysis.skill_radar&&(
                                    <div className="skill-radar-section">
                                        <h3>Skill Radar</h3>
                                        <div className="radar-container">
                                            {Object.entries(aiAnalysis.skill_radar).map(([skill, value]) => (
                                                <div key={skill} className="radar-item">
                                                    <span className="radar-label">{formatSkillName(skill)}</span>
                                                    <div className="radar-bar">
                                                        <div
                                                            className="radar-fill"
                                                            style={{
                                                                width: `${value}%`,
                                                                backgroundColor: getScoreColor(value)
                                                            }}
                                                        ></div>
                                                    </div>
                                                    <span className="radar-value">{value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Strengths & Weaknesses */}
                                <div className="sw-grid">
                                    <div className="strengths-card">
                                        <h3>💪 Strengths</h3>
                                        {aiAnalysis.strengths?.length>0? (
                                            <ul>
                                                {aiAnalysis.strengths.map((s, i) => (
                                                    <li key={i}>
                                                        <span className="sw-skill">{s.skill}</span>
                                                        <span className="sw-confidence">
                                                            {Math.round((s.confidence||0.5)*100)}% confident
                                                        </span>
                                                        <p className="sw-evidence">{s.evidence}</p>
                                                    </li>
                                                ))}
                                            </ul>
                                        ):(
                                            <p>Complete more activities to identify your strengths.</p>
                                        )}
                                    </div>

                                    <div className="weaknesses-card">
                                        <h3>🎯 Areas to Improve</h3>
                                        {aiAnalysis.weaknesses?.length>0? (
                                            <ul>
                                                {aiAnalysis.weaknesses.map((w, i) => (
                                                    <li key={i}>
                                                        <span className="sw-skill">{w.skill}</span>
                                                        <div className="suggestions">
                                                            {w.suggestions?.map((sug, j) => (
                                                                <span key={j} className="suggestion-tag">{sug}</span>
                                                            ))}
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        ):(
                                            <p>Great job! Keep practicing to identify areas for growth.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Detailed Analysis */}
                                <div className="detailed-analysis">
                                    {aiAnalysis.coding_analysis&&(
                                        <div className="analysis-section">
                                            <h4>💻 Coding Analysis</h4>
                                            <p>{aiAnalysis.coding_analysis}</p>
                                        </div>
                                    )}
                                    {aiAnalysis.interview_analysis&&(
                                        <div className="analysis-section">
                                            <h4>🎤 Interview Analysis</h4>
                                            <p>{aiAnalysis.interview_analysis}</p>
                                        </div>
                                    )}
                                    {aiAnalysis.communication_analysis&&(
                                        <div className="analysis-section">
                                            <h4>💬 Communication Analysis</h4>
                                            <p>{aiAnalysis.communication_analysis}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Recommendations */}
                                <div className="recommendations">
                                    <h3>📚 Recommended Topics to Study</h3>
                                    <div className="topic-tags">
                                        {aiAnalysis.recommended_topics?.map((topic, i) => (
                                            <span key={i} className="topic-tag">{topic}</span>
                                        ))}
                                    </div>

                                    {aiAnalysis.recommended_jobs?.length>0&&(
                                        <>
                                            <h3>💼 Matching Job Types</h3>
                                            <div className="job-tags">
                                                {aiAnalysis.recommended_jobs.map((job, i) => (
                                                    <span key={i} className="job-tag">{job}</span>
                                                ))}
                                            </div>
                                        </>
                                    )}

                                    {aiAnalysis.improvement_plan&&(
                                        <>
                                            <h3>📋 Improvement Plan</h3>
                                            <div className="improvement-plan">
                                                {aiAnalysis.improvement_plan.split('\n').map((line, i) => (
                                                    <p key={i}>{line}</p>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {activeTab==='skills'&&(
                    <div className="skills-tab">
                        <h2>💡 Your Skills</h2>
                        {skills.length===0? (
                            <div className="no-skills">
                                <p>No skills recorded yet. Complete assessments to verify your skills!</p>
                            </div>
                        ):(
                            <div className="skills-grid">
                                {skills.map((skill, index) => (
                                    <div key={index} className="skill-card">
                                        <div className="skill-header">
                                            <span className="skill-name">{skill.skill_name}</span>
                                            {skill.verified&&(
                                                <span className="verified-badge" title={`Verified via ${skill.verified_through}`}>✓</span>
                                            )}
                                        </div>
                                        <div
                                            className="proficiency-badge"
                                            style={{backgroundColor: getProficiencyColor(skill.proficiency_level)}}
                                        >
                                            {skill.proficiency_level}
                                        </div>
                                        {skill.score>0&&(
                                            <div className="skill-score">
                                                Score: {Math.round(skill.score)}%
                                            </div>
                                        )}
                                        <div className="skill-category">{skill.skill_category}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab==='applications'&&(
                    <div className="applications-tab">
                        <div className="applications-header">
                            <h2>📝 Job Applications</h2>
                            <button onClick={() => navigate('/jobs')}>Browse Jobs</button>
                        </div>
                        {applications.length===0? (
                            <div className="no-applications">
                                <p>No applications yet. Start applying to jobs!</p>
                                <button onClick={() => navigate('/jobs')}>Find Jobs</button>
                            </div>
                        ):(
                            <div className="applications-list">
                                {applications.map((app, index) => (
                                    <div key={index} className="application-card">
                                        <div className="app-company">
                                            {app.company_logo? (
                                                <img src={app.company_logo} alt={app.company_name} />
                                            ):(
                                                <div className="logo-placeholder">
                                                    {app.company_name?.charAt(0)||'C'}
                                                </div>
                                            )}
                                            <div>
                                                <h4>{app.job_title}</h4>
                                                <span>{app.company_name}</span>
                                            </div>
                                        </div>
                                        <div className="app-meta">
                                            <span className={`status-badge status-${app.status}`}>
                                                {app.status}
                                            </span>
                                            <span className="app-date">
                                                Applied {new Date(app.applied_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        {app.overall_match_score&&(
                                            <div className="match-score">
                                                Match: {Math.round(app.overall_match_score)}%
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function getActivityIcon(type)
{
    const icons={
        'coding_practice': '💻',
        'ai_interview': '🤖',
        'live_interview': '🎤',
        'contest': '🏅',
        'challenge': '⚡',
        'assessment': '📝'
    };
    return icons[type]||'📊';
}

function formatSkillName(name)
{
    return name.split('_').map(w => w.charAt(0).toUpperCase()+w.slice(1)).join(' ');
}

export default Profile;
