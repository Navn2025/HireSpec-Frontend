import {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {useAuth} from '../contexts/AuthContext';
import './ApplicantManagement.css';

const API_URL='http://localhost:8080';

function ApplicantManagement()
{
    const navigate=useNavigate();
    const {user}=useAuth();
    const [jobs, setJobs]=useState([]);
    const [selectedJob, setSelectedJob]=useState(null);
    const [applications, setApplications]=useState([]);
    const [loading, setLoading]=useState(true);
    const [loadingApps, setLoadingApps]=useState(false);
    const [selectedApplication, setSelectedApplication]=useState(null);
    const [filterStatus, setFilterStatus]=useState('all');
    const [sortBy, setSortBy]=useState('ats_score');
    const [searchTerm, setSearchTerm]=useState('');
    const [selectedApps, setSelectedApps]=useState([]);
    const [stats, setStats]=useState({
        total: 0,
        pending: 0,
        screening: 0,
        interviewed: 0,
        avgATS: 0
    });

    useEffect(() =>
    {
        fetchJobs();
    }, []);

    useEffect(() =>
    {
        if (selectedJob)
        {
            fetchApplications();
        }
    }, [selectedJob, filterStatus, sortBy]);

    const fetchJobs=async () =>
    {
        try
        {
            const response=await fetch(`${API_URL}/api/hiring/jobs?company_id=${user?.company_id||1}`);
            const data=await response.json();
            setJobs(data.jobs||[]);
            if (data.jobs?.length>0)
            {
                setSelectedJob(data.jobs[0]);
            }
        } catch (error)
        {
            console.error('Error fetching jobs:', error);
        } finally
        {
            setLoading(false);
        }
    };

    const fetchApplications=async () =>
    {
        if (!selectedJob) return;
        setLoadingApps(true);
        try
        {
            let url=`${API_URL}/api/hiring/jobs/${selectedJob.id}/applications?sort_by=${sortBy}`;
            if (filterStatus!=='all') url+=`&status=${filterStatus}`;

            const response=await fetch(url);
            const data=await response.json();

            setApplications(data.candidates||[]);
            calculateStats(data.candidates||[]);
        } catch (error)
        {
            console.error('Error fetching applications:', error);
        } finally
        {
            setLoadingApps(false);
        }
    };

    const calculateStats=(apps) =>
    {
        const total=apps.length;
        const pending=apps.filter(a => a.status==='applied').length;
        const screening=apps.filter(a => a.status==='screening').length;
        const interviewed=apps.filter(a => a.status==='interview_scheduled').length;
        const atsScores=apps.filter(a => a.ats_score).map(a => a.ats_score);
        const avgATS=atsScores.length>0? Math.round(atsScores.reduce((a, b) => a+b, 0)/atsScores.length):0;

        setStats({total, pending, screening, interviewed, avgATS});
    };

    const updateApplicationStatus=async (applicationId, newStatus) =>
    {
        try
        {
            const response=await fetch(`${API_URL}/api/hiring/applications/${applicationId}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({status: newStatus})
            });

            if (response.ok)
            {
                fetchApplications();
                setSelectedApplication(null);
            }
        } catch (error)
        {
            console.error('Error updating status:', error);
        }
    };

    const bulkUpdateStatus=async (newStatus) =>
    {
        if (selectedApps.length===0) return;
        try
        {
            const response=await fetch(`${API_URL}/api/hiring/applications/bulk-update`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({application_ids: selectedApps, status: newStatus})
            });

            if (response.ok)
            {
                setSelectedApps([]);
                fetchApplications();
            }
        } catch (error)
        {
            console.error('Error bulk updating:', error);
        }
    };

    const toggleSelectApp=(appId) =>
    {
        setSelectedApps(prev =>
            prev.includes(appId)
                ? prev.filter(id => id!==appId)
                :[...prev, appId]
        );
    };

    const selectAll=() =>
    {
        if (selectedApps.length===filteredApplications.length)
        {
            setSelectedApps([]);
        } else
        {
            setSelectedApps(filteredApplications.map(a => a.application_id));
        }
    };

    const getStatusColor=(status) =>
    {
        switch (status)
        {
            case 'applied': return '#3498db';
            case 'screening': return '#f39c12';
            case 'interview_scheduled': return '#9b59b6';
            case 'accepted': return '#27ae60';
            case 'rejected': return '#e74c3c';
            default: return '#95a5a6';
        }
    };

    const getATSColor=(score) =>
    {
        if (score>=80) return '#27ae60';
        if (score>=60) return '#f39c12';
        if (score>=40) return '#e67e22';
        return '#e74c3c';
    };

    const filteredApplications=applications.filter(app =>
        (app.username||app.email||'').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const viewApplicationDetail=async (app) =>
    {
        try
        {
            const response=await fetch(`${API_URL}/api/applications/${app.application_id}`);
            const data=await response.json();
            setSelectedApplication({...app, ...data.application, assessments: data.assessments});
        } catch (error)
        {
            console.error('Error fetching details:', error);
            setSelectedApplication(app);
        }
    };

    if (loading)
    {
        return (
            <div className="applicant-management">
                <div className="loading-state">
                    <div className="loader"></div>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="applicant-management">
            <div className="page-header">
                <div className="header-content">
                    <h1>📋 Applicant Management</h1>
                    <p>Review applications, ATS scores, and manage candidates</p>
                </div>
                <button className="back-btn" onClick={() => navigate('/recruiter-dashboard')}>
                    ← Back to Dashboard
                </button>
            </div>

            {/* Job Selector */}
            <div className="job-selector">
                <label>Select Job Posting:</label>
                <select
                    value={selectedJob?.id||''}
                    onChange={(e) => setSelectedJob(jobs.find(j => j.id===parseInt(e.target.value)))}
                >
                    {jobs.map(job => (
                        <option key={job.id} value={job.id}>
                            {job.title} ({job.application_count||0} applicants)
                        </option>
                    ))}
                </select>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">📊</div>
                    <div className="stat-value">{stats.total}</div>
                    <div className="stat-label">Total Applications</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">⏳</div>
                    <div className="stat-value">{stats.pending}</div>
                    <div className="stat-label">Pending Review</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">🔍</div>
                    <div className="stat-value">{stats.screening}</div>
                    <div className="stat-label">In Screening</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">🎯</div>
                    <div className="stat-value">{stats.avgATS}%</div>
                    <div className="stat-label">Avg ATS Score</div>
                </div>
            </div>

            {/* Filters */}
            <div className="filters-bar">
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="🔍 Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="filter-group">
                    <label>Status:</label>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                        <option value="all">All Status</option>
                        <option value="applied">Applied</option>
                        <option value="screening">Screening</option>
                        <option value="interview_scheduled">Interview Scheduled</option>
                        <option value="accepted">Accepted</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>

                <div className="filter-group">
                    <label>Sort By:</label>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                        <option value="ats_score">ATS Score (High-Low)</option>
                        <option value="applied_at">Application Date</option>
                        <option value="experience">Experience</option>
                    </select>
                </div>

                <button className="refresh-btn" onClick={fetchApplications}>
                    🔄 Refresh
                </button>
            </div>

            {/* Bulk Actions */}
            {selectedApps.length>0&&(
                <div className="bulk-actions">
                    <span>{selectedApps.length} selected</span>
                    <button onClick={() => bulkUpdateStatus('screening')}>Move to Screening</button>
                    <button onClick={() => bulkUpdateStatus('interview_scheduled')}>Schedule Interview</button>
                    <button onClick={() => bulkUpdateStatus('rejected')} className="reject-btn">Reject</button>
                    <button onClick={() => setSelectedApps([])} className="clear-btn">Clear Selection</button>
                </div>
            )}

            {/* Applications Table */}
            <div className="applications-table-container">
                {loadingApps? (
                    <div className="loading-state">
                        <div className="loader"></div>
                        <p>Loading applications...</p>
                    </div>
                ):filteredApplications.length===0? (
                    <div className="empty-state">
                        <div className="empty-icon">📭</div>
                        <h3>No applications found</h3>
                        <p>No applicants match your current filters</p>
                    </div>
                ):(
                    <table className="applications-table">
                        <thead>
                            <tr>
                                <th>
                                    <input
                                        type="checkbox"
                                        checked={selectedApps.length===filteredApplications.length&&filteredApplications.length>0}
                                        onChange={selectAll}
                                    />
                                </th>
                                <th>Candidate</th>
                                <th>ATS Score</th>
                                <th>Experience</th>
                                <th>Skills Match</th>
                                <th>Status</th>
                                <th>Applied</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredApplications.map((app) => (
                                <tr key={app.application_id} className={selectedApps.includes(app.application_id)? 'selected':''}>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={selectedApps.includes(app.application_id)}
                                            onChange={() => toggleSelectApp(app.application_id)}
                                        />
                                    </td>
                                    <td className="candidate-cell">
                                        <div className="candidate-info">
                                            <strong>{app.username||'Unknown'}</strong>
                                            <span className="email">{app.email}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div
                                            className="ats-score"
                                            style={{backgroundColor: getATSColor(app.ats_score||0)}}
                                        >
                                            {app.ats_score||0}%
                                        </div>
                                    </td>
                                    <td>{app.experience_years||0} yrs</td>
                                    <td>
                                        <div className="skills-match">
                                            {app.matched_skills?.slice(0, 3).map((skill, i) => (
                                                <span key={i} className="skill-tag matched">{skill}</span>
                                            ))}
                                            {(app.matched_skills?.length||0)>3&&(
                                                <span className="skill-more">+{app.matched_skills.length-3}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <span
                                            className="status-badge"
                                            style={{backgroundColor: getStatusColor(app.status)}}
                                        >
                                            {app.status?.replace('_', ' ')||'applied'}
                                        </span>
                                    </td>
                                    <td className="date-cell">
                                        {new Date(app.applied_at).toLocaleDateString()}
                                    </td>
                                    <td className="actions-cell">
                                        <button
                                            className="view-btn"
                                            onClick={() => viewApplicationDetail(app)}
                                        >
                                            👁️ View
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Application Detail Modal */}
            {selectedApplication&&(
                <div className="modal-overlay" onClick={() => setSelectedApplication(null)}>
                    <div className="application-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Application Details</h2>
                            <button className="close-btn" onClick={() => setSelectedApplication(null)}>×</button>
                        </div>

                        <div className="modal-body">
                            {/* Candidate Info */}
                            <div className="section">
                                <h3>👤 Candidate Information</h3>
                                <div className="info-grid">
                                    <div className="info-item">
                                        <label>Name</label>
                                        <span>{selectedApplication.username||'N/A'}</span>
                                    </div>
                                    <div className="info-item">
                                        <label>Email</label>
                                        <span>{selectedApplication.email||'N/A'}</span>
                                    </div>
                                    <div className="info-item">
                                        <label>Phone</label>
                                        <span>{selectedApplication.phone||'N/A'}</span>
                                    </div>
                                    <div className="info-item">
                                        <label>Experience</label>
                                        <span>{selectedApplication.experience_years||0} years</span>
                                    </div>
                                    {selectedApplication.linkedin_url&&(
                                        <div className="info-item">
                                            <label>LinkedIn</label>
                                            <a href={selectedApplication.linkedin_url} target="_blank" rel="noreferrer">
                                                View Profile
                                            </a>
                                        </div>
                                    )}
                                    {selectedApplication.github_url&&(
                                        <div className="info-item">
                                            <label>GitHub</label>
                                            <a href={selectedApplication.github_url} target="_blank" rel="noreferrer">
                                                View Profile
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ATS Score Section */}
                            <div className="section">
                                <h3>📊 ATS Analysis</h3>
                                <div className="ats-details">
                                    <div className="ats-overall">
                                        <div
                                            className="ats-circle"
                                            style={{borderColor: getATSColor(selectedApplication.ats_score||0)}}
                                        >
                                            <span className="score">{selectedApplication.ats_score||0}</span>
                                            <span className="label">ATS Score</span>
                                        </div>
                                    </div>

                                    {selectedApplication.ats_breakdown&&(
                                        <div className="ats-breakdown">
                                            <div className="breakdown-item">
                                                <label>Skills Match</label>
                                                <div className="progress-bar">
                                                    <div
                                                        className="progress"
                                                        style={{width: `${selectedApplication.ats_breakdown.skills||0}%`}}
                                                    ></div>
                                                </div>
                                                <span>{selectedApplication.ats_breakdown.skills||0}%</span>
                                            </div>
                                            <div className="breakdown-item">
                                                <label>Experience</label>
                                                <div className="progress-bar">
                                                    <div
                                                        className="progress"
                                                        style={{width: `${selectedApplication.ats_breakdown.experience||0}%`}}
                                                    ></div>
                                                </div>
                                                <span>{selectedApplication.ats_breakdown.experience||0}%</span>
                                            </div>
                                            <div className="breakdown-item">
                                                <label>Education</label>
                                                <div className="progress-bar">
                                                    <div
                                                        className="progress"
                                                        style={{width: `${selectedApplication.ats_breakdown.education||0}%`}}
                                                    ></div>
                                                </div>
                                                <span>{selectedApplication.ats_breakdown.education||0}%</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Skills */}
                                <div className="skills-section">
                                    <div className="matched-skills">
                                        <h4>✅ Matched Skills</h4>
                                        <div className="skills-list">
                                            {(selectedApplication.matched_skills||[]).map((skill, i) => (
                                                <span key={i} className="skill-tag matched">{skill}</span>
                                            ))}
                                            {(!selectedApplication.matched_skills||selectedApplication.matched_skills.length===0)&&(
                                                <span className="no-data">No matched skills data</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="missing-skills">
                                        <h4>⚠️ Missing Skills</h4>
                                        <div className="skills-list">
                                            {(selectedApplication.missing_skills||[]).map((skill, i) => (
                                                <span key={i} className="skill-tag missing">{skill}</span>
                                            ))}
                                            {(!selectedApplication.missing_skills||selectedApplication.missing_skills.length===0)&&(
                                                <span className="no-data">None</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Resume Summary */}
                            {selectedApplication.resume&&(
                                <div className="section">
                                    <h3>📄 Resume Summary</h3>
                                    <div className="resume-summary">
                                        {selectedApplication.resume.education&&(
                                            <div className="resume-item">
                                                <h4>🎓 Education</h4>
                                                {selectedApplication.resume.education.map((edu, i) => (
                                                    <div key={i} className="edu-item">
                                                        <strong>{edu.degree}</strong>
                                                        <span>{edu.institution}</span>
                                                        <span className="year">{edu.year}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {selectedApplication.resume.experience&&(
                                            <div className="resume-item">
                                                <h4>💼 Experience</h4>
                                                {selectedApplication.resume.experience.slice(0, 3).map((exp, i) => (
                                                    <div key={i} className="exp-item">
                                                        <strong>{exp.title}</strong>
                                                        <span>{exp.company}</span>
                                                        <span className="duration">{exp.duration}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Assessment Scores */}
                            {selectedApplication.assessments&&selectedApplication.assessments.length>0&&(
                                <div className="section">
                                    <h3>📝 Assessment Results</h3>
                                    <div className="assessments-list">
                                        {selectedApplication.assessments.map((assessment, i) => (
                                            <div key={i} className="assessment-item">
                                                <div className="assessment-type">{assessment.type}</div>
                                                <div className="assessment-score">
                                                    Score: <strong>{assessment.score||0}%</strong>
                                                </div>
                                                <div className="assessment-date">
                                                    {new Date(assessment.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Recommendations */}
                            {selectedApplication.recommendations&&selectedApplication.recommendations.length>0&&(
                                <div className="section">
                                    <h3>💡 Recommendations</h3>
                                    <ul className="recommendations-list">
                                        {selectedApplication.recommendations.map((rec, i) => (
                                            <li key={i}>{rec}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Status Update */}
                            <div className="section status-section">
                                <h3>🔄 Update Status</h3>
                                <div className="status-buttons">
                                    <button
                                        className={`status-btn screening ${selectedApplication.status==='screening'? 'active':''}`}
                                        onClick={() => updateApplicationStatus(selectedApplication.application_id, 'screening')}
                                    >
                                        Move to Screening
                                    </button>
                                    <button
                                        className={`status-btn interview ${selectedApplication.status==='interview_scheduled'? 'active':''}`}
                                        onClick={() => updateApplicationStatus(selectedApplication.application_id, 'interview_scheduled')}
                                    >
                                        Schedule Interview
                                    </button>
                                    <button
                                        className={`status-btn accept ${selectedApplication.status==='accepted'? 'active':''}`}
                                        onClick={() => updateApplicationStatus(selectedApplication.application_id, 'accepted')}
                                    >
                                        Accept
                                    </button>
                                    <button
                                        className={`status-btn reject ${selectedApplication.status==='rejected'? 'active':''}`}
                                        onClick={() => updateApplicationStatus(selectedApplication.application_id, 'rejected')}
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ApplicantManagement;
