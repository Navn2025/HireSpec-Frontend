import {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {useAuth} from '../contexts/AuthContext';
import './Jobs.css';

function Jobs()
{
    const navigate=useNavigate();
    const {user}=useAuth();
    const [jobs, setJobs]=useState([]);
    const [loading, setLoading]=useState(true);
    const [filters, setFilters]=useState({
        search: '',
        job_type: '',
        location: '',
        experience: '',
        sort: 'newest'
    });
    const [showMatchedOnly, setShowMatchedOnly]=useState(false);
    const [userStats, setUserStats]=useState(null);
    const [pagination, setPagination]=useState({page: 1, totalPages: 1});
    const [applying, setApplying]=useState(null);

    const API_URL=import.meta.env.VITE_API_URL||'http://localhost:8080';

    useEffect(() =>
    {
        fetchJobs();
    }, [filters, showMatchedOnly, pagination.page]);

    useEffect(() =>
    {
        if (user?.id)
        {
            fetchUserStats();
        }
    }, [user]);

    const fetchJobs=async () =>
    {
        setLoading(true);
        try
        {
            let url;
            if (showMatchedOnly&&user?.id)
            {
                url=`${API_URL}/api/jobs/match/${user.id}?page=${pagination.page}&limit=12`;
            } else
            {
                const params=new URLSearchParams({
                    page: pagination.page,
                    limit: 12,
                    ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
                });
                url=`${API_URL}/api/jobs?${params}`;
            }

            const response=await fetch(url);
            const data=await response.json();

            if (data.success)
            {
                setJobs(data.jobs||[]);
                setPagination(prev => ({
                    ...prev,
                    totalPages: data.pagination?.totalPages||1
                }));
                if (data.user_stats)
                {
                    setUserStats(data.user_stats);
                }
            }
        } catch (error)
        {
            console.error('Error fetching jobs:', error);
        } finally
        {
            setLoading(false);
        }
    };

    const fetchUserStats=async () =>
    {
        try
        {
            const response=await fetch(`${API_URL}/api/scores/${user.id}/summary`);
            const data=await response.json();
            if (data.success)
            {
                setUserStats(data.stats);
            }
        } catch (error)
        {
            console.error('Error fetching user stats:', error);
        }
    };

    const handleApply=async (jobId) =>
    {
        if (!user)
        {
            navigate('/login');
            return;
        }

        setApplying(jobId);
        try
        {
            const response=await fetch(`${API_URL}/api/jobs/${jobId}/apply`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({userId: user.id})
            });

            const data=await response.json();
            if (data.success)
            {
                alert('Application submitted successfully!');
                // Update job in list to show applied status
                setJobs(jobs.map(job =>
                    job.id===jobId? {...job, applied: true}:job
                ));
            } else
            {
                alert(data.message||'Failed to apply');
            }
        } catch (error)
        {
            console.error('Error applying:', error);
            alert('Failed to submit application');
        } finally
        {
            setApplying(null);
        }
    };

    const handleFilterChange=(key, value) =>
    {
        setFilters(prev => ({...prev, [key]: value}));
        setPagination(prev => ({...prev, page: 1}));
    };

    const formatSalary=(min, max, currency='USD') =>
    {
        if (!min&&!max) return 'Not disclosed';
        const formatter=new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
            maximumFractionDigits: 0
        });
        if (min&&max) return `${formatter.format(min)} - ${formatter.format(max)}`;
        if (min) return `From ${formatter.format(min)}`;
        return `Up to ${formatter.format(max)}`;
    };

    const getMatchColor=(score) =>
    {
        if (score>=80) return '#d4d4d4';
        if (score>=60) return '#a3a3a3';
        if (score>=40) return '#737373';
        return '#525252';
    };

    return (
        <div className="jobs-page">
            <div className="jobs-header">
                <div className="header-content">
                    <h1>Find Your Next Opportunity</h1>
                    <p>Discover jobs matched to your skills and platform performance</p>
                </div>
                {userStats&&(
                    <div className="user-score-badge">
                        <span className="score-label">Your Platform Score</span>
                        <span className="score-value">{Math.round(userStats.average_score||0)}</span>
                    </div>
                )}
            </div>

            {/* Filters */}
            <div className="filters-section">
                <div className="search-bar">
                    <input
                        type="text"
                        placeholder="Search jobs by title, company, or skills..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                    <button className="search-btn">🔍</button>
                </div>

                <div className="filter-row">
                    <select
                        value={filters.job_type}
                        onChange={(e) => handleFilterChange('job_type', e.target.value)}
                    >
                        <option value="">All Job Types</option>
                        <option value="full-time">Full Time</option>
                        <option value="part-time">Part Time</option>
                        <option value="contract">Contract</option>
                        <option value="internship">Internship</option>
                        <option value="freelance">Freelance</option>
                    </select>

                    <input
                        type="text"
                        placeholder="Location"
                        value={filters.location}
                        onChange={(e) => handleFilterChange('location', e.target.value)}
                    />

                    <select
                        value={filters.experience}
                        onChange={(e) => handleFilterChange('experience', e.target.value)}
                    >
                        <option value="">Experience Level</option>
                        <option value="0">Entry Level (0-2 yrs)</option>
                        <option value="2">Mid Level (2-5 yrs)</option>
                        <option value="5">Senior (5+ yrs)</option>
                    </select>

                    <select
                        value={filters.sort}
                        onChange={(e) => handleFilterChange('sort', e.target.value)}
                    >
                        <option value="newest">Newest First</option>
                        <option value="salary_high">Highest Salary</option>
                        <option value="oldest">Oldest First</option>
                    </select>

                    {user&&(
                        <label className="match-toggle">
                            <input
                                type="checkbox"
                                checked={showMatchedOnly}
                                onChange={(e) => setShowMatchedOnly(e.target.checked)}
                            />
                            <span>Show Matched Jobs</span>
                        </label>
                    )}
                </div>
            </div>

            {/* Jobs Grid */}
            {loading? (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading jobs...</p>
                </div>
            ):jobs.length===0? (
                <div className="no-jobs">
                    <h3>No jobs found</h3>
                    <p>Try adjusting your filters or check back later</p>
                </div>
            ):(
                <div className="jobs-grid">
                    {jobs.map(job => (
                        <div key={job.id} className="job-card">
                            {job.match_score!==undefined&&(
                                <div
                                    className="match-badge"
                                    style={{backgroundColor: getMatchColor(job.match_score)}}
                                >
                                    {Math.round(job.match_score)}% Match
                                </div>
                            )}

                            <div className="job-card-header">
                                <div className="company-logo">
                                    {job.company_logo? (
                                        <img src={job.company_logo} alt={job.company_name} />
                                    ):(
                                        <div className="logo-placeholder">
                                            {job.company_name?.charAt(0)||'C'}
                                        </div>
                                    )}
                                </div>
                                <div className="company-info">
                                    <h4>{job.company_name||'Company'}</h4>
                                    <span className="industry">{job.industry}</span>
                                </div>
                            </div>

                            <h3 className="job-title">{job.title}</h3>

                            <div className="job-meta">
                                <span className="meta-item">📍 {job.location||'Remote'}</span>
                                <span className="meta-item">💼 {job.job_type||'Full-time'}</span>
                                <span className="meta-item">💰 {formatSalary(job.salary_min, job.salary_max)}</span>
                            </div>

                            {job.skills_required?.length>0&&(
                                <div className="skills-list">
                                    {job.skills_required.slice(0, 4).map((skill, index) => (
                                        <span key={index} className="skill-tag">{skill}</span>
                                    ))}
                                    {job.skills_required.length>4&&(
                                        <span className="skill-tag more">+{job.skills_required.length-4}</span>
                                    )}
                                </div>
                            )}

                            {job.match_score!==undefined&&(
                                <div className="match-details">
                                    <div className="match-item">
                                        <span>Skills</span>
                                        <div className="match-bar">
                                            <div
                                                className="match-fill"
                                                style={{width: `${job.skill_match}%`, backgroundColor: getMatchColor(job.skill_match)}}
                                            ></div>
                                        </div>
                                        <span>{Math.round(job.skill_match)}%</span>
                                    </div>
                                    <div className="match-item">
                                        <span>Platform</span>
                                        <div className="match-bar">
                                            <div
                                                className="match-fill"
                                                style={{width: `${job.platform_score}%`, backgroundColor: getMatchColor(job.platform_score)}}
                                            ></div>
                                        </div>
                                        <span>{Math.round(job.platform_score)}%</span>
                                    </div>
                                </div>
                            )}

                            <div className="job-actions">
                                <button
                                    className="view-btn"
                                    onClick={() => navigate(`/jobs/${job.id}`)}
                                >
                                    View Details
                                </button>
                                <button
                                    className={`apply-btn ${job.applied? 'applied':''}`}
                                    onClick={() => !job.applied&&handleApply(job.id)}
                                    disabled={applying===job.id||job.applied}
                                >
                                    {job.applied? 'Applied ✓':applying===job.id? 'Applying...':'Quick Apply'}
                                </button>
                            </div>

                            <div className="applicant-count">
                                {job.applicant_count||0} applicants
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {pagination.totalPages>1&&(
                <div className="pagination">
                    <button
                        disabled={pagination.page===1}
                        onClick={() => setPagination(prev => ({...prev, page: prev.page-1}))}
                    >
                        Previous
                    </button>
                    <span>Page {pagination.page} of {pagination.totalPages}</span>
                    <button
                        disabled={pagination.page===pagination.totalPages}
                        onClick={() => setPagination(prev => ({...prev, page: prev.page+1}))}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}

export default Jobs;
