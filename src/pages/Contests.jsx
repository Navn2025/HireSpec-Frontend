import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Contests.css';

// Contest Card Component
function ContestCard({ contest, onRegister, isRegistered, isLoading }) {
    const now = new Date();
    const startTime = new Date(contest.start_time);
    const endTime = new Date(contest.end_time);
    
    let status = 'upcoming';
    let statusLabel = 'Upcoming';
    let statusColor = '#0088ff';
    
    if (now >= startTime && now <= endTime) {
        status = 'ongoing';
        statusLabel = 'Live Now';
        statusColor = '#00ff88';
    } else if (now > endTime) {
        status = 'ended';
        statusLabel = 'Ended';
        statusColor = '#888';
    }
    
    const timeUntilStart = startTime - now;
    const daysUntil = Math.floor(timeUntilStart / (1000 * 60 * 60 * 24));
    const hoursUntil = Math.floor((timeUntilStart % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    return (
        <div className={`contest-card ${status}`}>
            <div className="contest-header">
                <span className="contest-status" style={{ backgroundColor: statusColor + '20', color: statusColor, borderColor: statusColor }}>
                    {status === 'ongoing' && '🔴 '}{statusLabel}
                </span>
                <span className="contest-type">{contest.contest_type || 'coding'}</span>
            </div>
            
            <h3 className="contest-title">{contest.title}</h3>
            <p className="contest-description">{contest.description}</p>
            
            <div className="contest-meta">
                <div className="meta-item">
                    <span className="meta-icon">📅</span>
                    <span className="meta-value">{startTime.toLocaleDateString()}</span>
                </div>
                <div className="meta-item">
                    <span className="meta-icon">⏱️</span>
                    <span className="meta-value">{contest.duration_minutes || 120} min</span>
                </div>
                <div className="meta-item">
                    <span className="meta-icon">📊</span>
                    <span className="meta-value">{contest.difficulty || 'Mixed'}</span>
                </div>
                {contest.participant_count !== undefined && (
                    <div className="meta-item">
                        <span className="meta-icon">👥</span>
                        <span className="meta-value">{contest.participant_count} registered</span>
                    </div>
                )}
            </div>
            
            {status === 'upcoming' && (
                <div className="countdown">
                    <span className="countdown-label">Starts in:</span>
                    <span className="countdown-value">
                        {daysUntil > 0 ? `${daysUntil}d ` : ''}{hoursUntil}h
                    </span>
                </div>
            )}
            
            <div className="contest-actions">
                {status === 'upcoming' && !isRegistered && (
                    <button 
                        className="register-btn"
                        onClick={() => onRegister(contest.id)}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Registering...' : '📝 Register'}
                    </button>
                )}
                {status === 'upcoming' && isRegistered && (
                    <span className="registered-badge">✅ Registered</span>
                )}
                {status === 'ongoing' && isRegistered && (
                    <Link to={`/contest/${contest.id}`} className="enter-btn">
                        🚀 Enter Contest
                    </Link>
                )}
                {status === 'ongoing' && !isRegistered && (
                    <span className="missed-label">Registration closed</span>
                )}
                {status === 'ended' && (
                    <Link to={`/contest/${contest.id}/results`} className="results-btn">
                        📊 View Results
                    </Link>
                )}
            </div>
        </div>
    );
}

// Contest Filter Tabs
function ContestFilters({ activeFilter, onFilterChange }) {
    const filters = [
        { id: 'all', label: 'All Contests' },
        { id: 'upcoming', label: 'Upcoming' },
        { id: 'ongoing', label: 'Live Now' },
        { id: 'ended', label: 'Past' },
        { id: 'registered', label: 'My Contests' }
    ];
    
    return (
        <div className="contest-filters">
            {filters.map(filter => (
                <button
                    key={filter.id}
                    className={`filter-btn ${activeFilter === filter.id ? 'active' : ''}`}
                    onClick={() => onFilterChange(filter.id)}
                >
                    {filter.label}
                </button>
            ))}
        </div>
    );
}

// Main Contests Component
function Contests() {
    const { user } = useAuth();
    const [contests, setContests] = useState([]);
    const [registeredContests, setRegisteredContests] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeFilter, setActiveFilter] = useState('all');
    const [registeringId, setRegisteringId] = useState(null);
    
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    
    // Fetch contests
    useEffect(() => {
        async function fetchContests() {
            setLoading(true);
            setError(null);
            
            try {
                const response = await fetch(`${API_BASE}/api/contests`, {
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' }
                });
                
                if (!response.ok) throw new Error('Failed to fetch contests');
                
                const data = await response.json();
                setContests(data.contests || []);
                
                // If user is logged in, fetch their registrations
                if (user?.id) {
                    const regResponse = await fetch(`${API_BASE}/api/contests/user/${user.id}/registrations`, {
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' }
                    });
                    
                    if (regResponse.ok) {
                        const regData = await regResponse.json();
                        setRegisteredContests(new Set(regData.registrations?.map(r => r.contest_id) || []));
                    }
                }
            } catch (err) {
                console.error('Contests fetch error:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        
        fetchContests();
    }, [API_BASE, user]);
    
    // Register for a contest
    async function handleRegister(contestId) {
        if (!user) {
            alert('Please log in to register for contests');
            return;
        }
        
        setRegisteringId(contestId);
        
        try {
            const response = await fetch(`${API_BASE}/api/contests/${contestId}/register`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.id })
            });
            
            if (!response.ok) throw new Error('Registration failed');
            
            setRegisteredContests(prev => new Set([...prev, contestId]));
        } catch (err) {
            console.error('Registration error:', err);
            alert('Failed to register: ' + err.message);
        } finally {
            setRegisteringId(null);
        }
    }
    
    // Filter contests based on active filter
    const filteredContests = contests.filter(contest => {
        const now = new Date();
        const startTime = new Date(contest.start_time);
        const endTime = new Date(contest.end_time);
        
        switch (activeFilter) {
            case 'upcoming':
                return now < startTime;
            case 'ongoing':
                return now >= startTime && now <= endTime;
            case 'ended':
                return now > endTime;
            case 'registered':
                return registeredContests.has(contest.id);
            default:
                return true;
        }
    });
    
    return (
        <div className="contests-page">
            <div className="contests-container">
                {/* Header */}
                <header className="contests-header">
                    <div className="header-content">
                        <h1>🏆 Coding Contests</h1>
                        <p className="subtitle">Compete in timed challenges. Win prizes. Climb the ranks.</p>
                    </div>
                    <div className="header-stats">
                        <div className="stat">
                            <span className="stat-number">{contests.filter(c => new Date() < new Date(c.start_time)).length}</span>
                            <span className="stat-label">Upcoming</span>
                        </div>
                        <div className="stat">
                            <span className="stat-number">{registeredContests.size}</span>
                            <span className="stat-label">Registered</span>
                        </div>
                    </div>
                </header>
                
                {/* Filters */}
                <ContestFilters 
                    activeFilter={activeFilter}
                    onFilterChange={setActiveFilter}
                />
                
                {/* Contests Grid */}
                <div className="contests-content">
                    {loading ? (
                        <div className="loading-state">
                            <div className="loader"></div>
                            <p>Loading contests...</p>
                        </div>
                    ) : error ? (
                        <div className="error-state">
                            <p>❌ {error}</p>
                            <button onClick={() => window.location.reload()}>Try Again</button>
                        </div>
                    ) : filteredContests.length === 0 ? (
                        <div className="empty-state">
                            <span className="empty-icon">🏆</span>
                            <h3>No contests found</h3>
                            <p>
                                {activeFilter === 'registered' 
                                    ? "You haven't registered for any contests yet."
                                    : "No contests match your filter. Check back soon!"}
                            </p>
                            {activeFilter !== 'all' && (
                                <button onClick={() => setActiveFilter('all')}>View All Contests</button>
                            )}
                        </div>
                    ) : (
                        <div className="contests-grid">
                            {filteredContests.map(contest => (
                                <ContestCard
                                    key={contest.id}
                                    contest={contest}
                                    onRegister={handleRegister}
                                    isRegistered={registeredContests.has(contest.id)}
                                    isLoading={registeringId === contest.id}
                                />
                            ))}
                        </div>
                    )}
                </div>
                
                {/* Prizes & Rules Section */}
                <div className="info-section">
                    <div className="info-card">
                        <h3>🎁 Prizes & Rewards</h3>
                        <ul>
                            <li>🥇 1st Place: 1000 points + Gold Badge</li>
                            <li>🥈 2nd Place: 750 points + Silver Badge</li>
                            <li>🥉 3rd Place: 500 points + Bronze Badge</li>
                            <li>🏅 All Participants: Participation Points</li>
                        </ul>
                    </div>
                    
                    <div className="info-card">
                        <h3>📋 Contest Rules</h3>
                        <ul>
                            <li>Complete problems within the time limit</li>
                            <li>Each problem has different point values</li>
                            <li>Partial credit for some problems</li>
                            <li>No external help or plagiarism allowed</li>
                        </ul>
                    </div>
                    
                    <div className="info-card">
                        <h3>⏰ How It Works</h3>
                        <ul>
                            <li>Register before the contest starts</li>
                            <li>Enter when the contest goes live</li>
                            <li>Solve as many problems as you can</li>
                            <li>Results announced after contest ends</li>
                        </ul>
                    </div>
                </div>
                
                {/* Quick Links */}
                <div className="quick-links">
                    <Link to="/leaderboard" className="quick-link">
                        🏆 View Leaderboard
                    </Link>
                    <Link to="/coding-practice" className="quick-link">
                        💻 Practice Coding
                    </Link>
                    <Link to="/ai-interview-setup" className="quick-link">
                        🎤 AI Interview
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default Contests;
