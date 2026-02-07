import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Leaderboard.css';

function Leaderboard() {
    const { user } = useAuth();
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeframe, setTimeframe] = useState('all');
    const [category, setCategory] = useState('global');
    const [userRank, setUserRank] = useState(null);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

    useEffect(() => {
        fetchLeaderboard();
    }, [timeframe, category, pagination.page]);

    useEffect(() => {
        if (user?.id) {
            fetchUserRank();
        }
    }, [user]);

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            let url;
            if (category === 'global') {
                url = `${API_URL}/api/scores/leaderboard/global?timeframe=${timeframe}&page=${pagination.page}&limit=50`;
            } else {
                url = `${API_URL}/api/scores/leaderboard/${category}?page=${pagination.page}&limit=50`;
            }

            const response = await fetch(url);
            const data = await response.json();

            if (data.success) {
                setLeaderboard(data.leaderboard || []);
                setPagination(prev => ({
                    ...prev,
                    totalPages: data.pagination?.totalPages || 1
                }));
            }
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserRank = async () => {
        try {
            const response = await fetch(`${API_URL}/api/scores/${user.id}/rank`);
            const data = await response.json();
            if (data.success) {
                setUserRank(data.rank);
            }
        } catch (error) {
            console.error('Error fetching user rank:', error);
        }
    };

    const getRankBadge = (rank) => {
        if (rank === 1) return { emoji: '', class: 'gold' };
        if (rank === 2) return { emoji: '', class: 'silver' };
        if (rank === 3) return { emoji: '', class: 'bronze' };
        return { emoji: '', class: '' };
    };

    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num?.toFixed(0) || '0';
    };

    return (
        <div className="leaderboard-page">
            <div className="leaderboard-header">
                <div className="header-content">
                    <h1> Leaderboard</h1>
                    <p>See how you rank against other candidates on the platform</p>
                </div>
            </div>

            {/* User's Current Rank */}
            {user && userRank && (
                <div className="user-rank-section">
                    <div className="rank-card your-rank">
                        <div className="rank-icon"></div>
                        <div className="rank-info">
                            <span className="rank-label">Your Global Rank</span>
                            <span className="rank-value">#{userRank.global || '-'}</span>
                        </div>
                    </div>
                    <div className="rank-card">
                        <div className="rank-icon"></div>
                        <div className="rank-info">
                            <span className="rank-label">Coding Rank</span>
                            <span className="rank-value">#{userRank.coding || '-'}</span>
                        </div>
                    </div>
                    <div className="rank-card">
                        <div className="rank-icon"></div>
                        <div className="rank-info">
                            <span className="rank-label">Interview Rank</span>
                            <span className="rank-value">#{userRank.interview || '-'}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="leaderboard-filters">
                <div className="category-tabs">
                    <button 
                        className={category === 'global' ? 'active' : ''}
                        onClick={() => { setCategory('global'); setPagination(p => ({...p, page: 1})); }}
                    >
                         Global
                    </button>
                    <button 
                        className={category === 'coding' ? 'active' : ''}
                        onClick={() => { setCategory('coding'); setPagination(p => ({...p, page: 1})); }}
                    >
                         Coding
                    </button>
                    <button 
                        className={category === 'interview' ? 'active' : ''}
                        onClick={() => { setCategory('interview'); setPagination(p => ({...p, page: 1})); }}
                    >
                         Interview
                    </button>
                    <button 
                        className={category === 'contest' ? 'active' : ''}
                        onClick={() => { setCategory('contest'); setPagination(p => ({...p, page: 1})); }}
                    >
                         Contest
                    </button>
                </div>

                {category === 'global' && (
                    <div className="timeframe-tabs">
                        <button 
                            className={timeframe === 'all' ? 'active' : ''}
                            onClick={() => setTimeframe('all')}
                        >
                            All Time
                        </button>
                        <button 
                            className={timeframe === 'monthly' ? 'active' : ''}
                            onClick={() => setTimeframe('monthly')}
                        >
                            This Month
                        </button>
                        <button 
                            className={timeframe === 'weekly' ? 'active' : ''}
                            onClick={() => setTimeframe('weekly')}
                        >
                            This Week
                        </button>
                    </div>
                )}
            </div>

            {/* Leaderboard Table */}
            {loading ? (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading leaderboard...</p>
                </div>
            ) : leaderboard.length === 0 ? (
                <div className="no-data">
                    <h3>No rankings yet</h3>
                    <p>Complete activities to appear on the leaderboard!</p>
                </div>
            ) : (
                <div className="leaderboard-table-container">
                    <table className="leaderboard-table">
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>User</th>
                                <th>Score</th>
                                <th>Activities</th>
                                <th>Avg %</th>
                                {category === 'global' && <th>Streak</th>}
                                <th>Badges</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaderboard.map((entry, index) => {
                                const badge = getRankBadge(entry.rank);
                                const isCurrentUser = user?.id === entry.user_id;
                                
                                return (
                                    <tr 
                                        key={entry.user_id} 
                                        className={`${badge.class} ${isCurrentUser ? 'current-user' : ''}`}
                                    >
                                        <td className="rank-cell">
                                            {badge.emoji && <span className="rank-emoji">{badge.emoji}</span>}
                                            <span className="rank-number">#{entry.rank}</span>
                                        </td>
                                        <td className="user-cell">
                                            <div className="user-avatar">
                                                {entry.profile_image ? (
                                                    <img src={entry.profile_image} alt={entry.username} />
                                                ) : (
                                                    <div className="avatar-placeholder">
                                                        {entry.username?.charAt(0).toUpperCase() || '?'}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="user-details">
                                                <span className="username">
                                                    {entry.full_name || entry.username}
                                                    {isCurrentUser && <span className="you-badge">You</span>}
                                                </span>
                                                {entry.full_name && (
                                                    <span className="user-handle">@{entry.username}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="score-cell">
                                            <span className="score-value">
                                                {formatNumber(entry.period_score || entry.category_score || 0)}
                                            </span>
                                        </td>
                                        <td className="activities-cell">
                                            {entry.activities_count || entry.category_count || 0}
                                        </td>
                                        <td className="avg-cell">
                                            <div className="avg-bar-container">
                                                <div 
                                                    className="avg-bar" 
                                                    style={{ width: `${Math.min(100, entry.avg_percentage || 0)}%` }}
                                                ></div>
                                            </div>
                                            <span>{Math.round(entry.avg_percentage || 0)}%</span>
                                        </td>
                                        {category === 'global' && (
                                            <td className="streak-cell">
                                                {entry.current_streak_days > 0 && (
                                                    <span className="streak-badge">
                                                         {entry.current_streak_days}
                                                    </span>
                                                )}
                                            </td>
                                        )}
                                        <td className="badges-cell">
                                            <div className="badges-list">
                                                {entry.badges?.slice(0, 3).map((badge, i) => (
                                                    <span key={i} className="badge-icon" title={badge}>
                                                        {getBadgeEmoji(badge)}
                                                    </span>
                                                ))}
                                                {entry.coding_problems_solved >= 50 && (
                                                    <span className="badge-icon" title="50+ Problems Solved"></span>
                                                )}
                                                {entry.interview_count >= 10 && (
                                                    <span className="badge-icon" title="10+ Interviews"></span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="pagination">
                    <button
                        disabled={pagination.page === 1}
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    >
                         Previous
                    </button>
                    <span>Page {pagination.page} of {pagination.totalPages}</span>
                    <button
                        disabled={pagination.page === pagination.totalPages}
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    >
                        Next 
                    </button>
                </div>
            )}

            {/* How Rankings Work */}
            <div className="ranking-info">
                <h3>How Rankings Work</h3>
                <div className="info-grid">
                    <div className="info-card">
                        <div className="info-icon"></div>
                        <h4>Score Calculation</h4>
                        <p>Your total score is based on all activities - coding practice, interviews, and contests.</p>
                    </div>
                    <div className="info-card">
                        <div className="info-icon"></div>
                        <h4>Streaks</h4>
                        <p>Maintain daily activity to build your streak and earn bonus points.</p>
                    </div>
                    <div className="info-card">
                        <div className="info-icon"></div>
                        <h4>Badges</h4>
                        <p>Earn badges by completing milestones like solving problems or acing interviews.</p>
                    </div>
                    <div className="info-card">
                        <div className="info-icon"></div>
                        <h4>Weekly Reset</h4>
                        <p>Weekly rankings reset every Monday. Compete for the top spot!</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function getBadgeEmoji(badge) {
    const badgeMap = {
        'first_submission': '',
        'problem_solver': '',
        'interview_ace': '',
        'streak_7': '',
        'streak_30': '',
        'top_10': '',
        'speed_demon': '',
        'perfectionist': ''
    };
    return badgeMap[badge] || '';
}

export default Leaderboard;
