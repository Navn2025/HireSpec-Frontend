import React, {useState, useEffect} from 'react';
import './CPProblemList.css';
import axios from 'axios';

const API='http://localhost:8080/api/cp';

const CPProblemList=({onSelectProblem, currentProblemId, solvedProblems=[]}) =>
{
    const [problems, setProblems]=useState([]);
    const [filters, setFilters]=useState({difficulty: '', company: '', topic: ''});
    const [filterOptions, setFilterOptions]=useState({difficulties: [], companies: [], topics: []});
    const [loading, setLoading]=useState(true);
    const [showAiModal, setShowAiModal]=useState(false);
    const [aiTopic, setAiTopic]=useState('');
    const [aiDifficulty, setAiDifficulty]=useState('Medium');
    const [aiLoading, setAiLoading]=useState(false);

    const topicChips=['Arrays', 'Strings', 'Hash Table', 'Dynamic Programming', 'Trees', 'Graphs', 'Sorting', 'Binary Search', 'Stack', 'Linked List', 'Math', 'Recursion'];

    useEffect(() =>
    {
        axios.get(`${API}/questions/filters`).then(r => setFilterOptions(r.data.filters || r.data)).catch(console.error);
    }, []);

    useEffect(() =>
    {
        setLoading(true);
        const params={};
        if (filters.difficulty) params.difficulty=filters.difficulty;
        if (filters.company) params.company=filters.company;
        if (filters.topic) params.topic=filters.topic;
        axios.get(`${API}/questions`, {params}).then(r => {setProblems(r.data.questions||r.data); setLoading(false);}).catch(() => setLoading(false));
    }, [filters]);

    const handleRandomProblem=() =>
    {
        axios.get(`${API}/questions/random`, {params: filters}).then(r => onSelectProblem(r.data)).catch(console.error);
    };

    const handleGenerateAI=async () =>
    {
        if (!aiTopic.trim()) return;
        setAiLoading(true);
        try
        {
            const r=await axios.post(`${API}/ai-questions/generate`, {topics: [aiTopic], difficulty: aiDifficulty});
            const q = r.data?.question || r.data;
            if (q) {onSelectProblem({...q, isAiGenerated: true}); setShowAiModal(false); setAiTopic('');}
        } catch (err) {console.error(err); alert('Failed to generate AI question');}
        setAiLoading(false);
    };

    const getDiffColor=(d) => ({Easy: '#00b8a3', Medium: '#ffc01e', Hard: '#ff375f'}[d]||'#888');

    return (
        <div className="cp-problem-list">
            <div className="cp-pl-header">
                <h3>Problems</h3>
                <div className="cp-pl-actions">
                    <button className="cp-btn-random" onClick={handleRandomProblem} title="Random Problem">🎲</button>
                    <button className="cp-btn-ai" onClick={() => setShowAiModal(true)} title="AI Generate">🤖</button>
                </div>
            </div>
            <div className="cp-pl-filters">
                <select value={filters.difficulty} onChange={e => setFilters(f => ({...f, difficulty: e.target.value}))}>
                    <option value="">All Difficulties</option>
                    {filterOptions.difficulties.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select value={filters.company} onChange={e => setFilters(f => ({...f, company: e.target.value}))}>
                    <option value="">All Companies</option>
                    {filterOptions.companies.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={filters.topic} onChange={e => setFilters(f => ({...f, topic: e.target.value}))}>
                    <option value="">All Topics</option>
                    {filterOptions.topics.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>
            <div className="cp-pl-items">
                {loading? <div className="cp-pl-loading">Loading...</div>:
                    problems.map(p => (
                        <div key={p.id} className={`cp-pl-item ${currentProblemId===p.id? 'active':''} ${solvedProblems.includes(p.id)? 'solved':''}`} onClick={() => onSelectProblem(p)}>
                            <span className="cp-pl-status">{solvedProblems.includes(p.id)? '✅':'⬜'}</span>
                            <span className="cp-pl-title">{p.title}</span>
                            <span className="cp-pl-diff" style={{color: getDiffColor(p.difficulty)}}>{p.difficulty}</span>
                        </div>
                    ))
                }
                {!loading&&problems.length===0&&<div className="cp-pl-empty">No problems found</div>}
            </div>

            {showAiModal&&(
                <div className="cp-ai-modal-overlay" onClick={() => setShowAiModal(false)}>
                    <div className="cp-ai-modal" onClick={e => e.stopPropagation()}>
                        <h3>🤖 Generate AI Problem</h3>
                        <div className="cp-ai-topics">
                            {topicChips.map(t => (
                                <button key={t} className={`cp-topic-chip ${aiTopic===t? 'selected':''}`} onClick={() => setAiTopic(t)}>{t}</button>
                            ))}
                        </div>
                        <input type="text" value={aiTopic} onChange={e => setAiTopic(e.target.value)} placeholder="Or type custom topic..." className="cp-ai-input" />
                        <select value={aiDifficulty} onChange={e => setAiDifficulty(e.target.value)} className="cp-ai-select">
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                        </select>
                        <div className="cp-ai-modal-actions">
                            <button onClick={() => setShowAiModal(false)} className="cp-btn-cancel">Cancel</button>
                            <button onClick={handleGenerateAI} disabled={aiLoading||!aiTopic.trim()} className="cp-btn-generate">
                                {aiLoading? 'Generating...':'Generate'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CPProblemList;
