import React, { useState } from 'react';
import './CPProblemDescription.css';

const CPProblemDescription = ({ problem }) => {
    const [activeTab, setActiveTab] = useState('description');

    if (!problem) {
        return <div className="cp-pd-empty"><p>Select a problem to get started</p></div>;
    }

    const getDiffColor = (d) => ({ Easy: '#00b8a3', Medium: '#ffc01e', Hard: '#ff375f' }[d] || '#888');

    return (
        <div className="cp-problem-desc">
            <div className="cp-pd-tabs">
                <button className={activeTab === 'description' ? 'active' : ''} onClick={() => setActiveTab('description')}>Description</button>
                <button className={activeTab === 'hints' ? 'active' : ''} onClick={() => setActiveTab('hints')}>Hints</button>
            </div>
            {activeTab === 'description' && (
                <div className="cp-pd-content">
                    <h2 className="cp-pd-title">
                        {problem.title}
                        {problem.isAiGenerated && <span className="cp-pd-ai-badge">🤖 AI</span>}
                    </h2>
                    <span className="cp-pd-diff" style={{ color: getDiffColor(problem.difficulty) }}>{problem.difficulty}</span>
                    {problem.topics && <div className="cp-pd-topics">{problem.topics.map(t => <span key={t} className="cp-pd-topic">{t}</span>)}</div>}
                    {problem.companies && <div className="cp-pd-companies">{problem.companies.map(c => <span key={c} className="cp-pd-company">{c}</span>)}</div>}
                    <div className="cp-pd-desc-text">{problem.description}</div>
                    {problem.examples && problem.examples.length > 0 && (
                        <div className="cp-pd-examples">
                            {problem.examples.map((ex, i) => (
                                <div key={i} className="cp-pd-example">
                                    <strong>Example {i + 1}:</strong>
                                    <pre><strong>Input:</strong> {typeof ex.input === 'object' ? JSON.stringify(ex.input) : ex.input}{'\n'}<strong>Output:</strong> {typeof ex.output === 'object' ? JSON.stringify(ex.output) : String(ex.output)}{ex.explanation ? `\nExplanation: ${ex.explanation}` : ''}</pre>
                                </div>
                            ))}
                        </div>
                    )}
                    {problem.constraints && (
                        <div className="cp-pd-constraints">
                            <strong>Constraints:</strong>
                            <ul>{problem.constraints.map((c, i) => <li key={i}>{c}</li>)}</ul>
                        </div>
                    )}
                </div>
            )}
            {activeTab === 'hints' && (
                <div className="cp-pd-content">
                    {problem.hints && problem.hints.length > 0 ? (
                        problem.hints.map((h, i) => <div key={i} className="cp-pd-hint"><span className="cp-pd-hint-num">Hint {i + 1}</span><p>{h}</p></div>)
                    ) : (
                        <p className="cp-pd-no-hints">No hints available.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default CPProblemDescription;
