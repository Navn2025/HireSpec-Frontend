import React from 'react';
import {CheckCircleIcon, XIcon, AlertIcon} from '../Icons';
import './CPTestResults.css';

const CPTestResults=({results, loading}) =>
{
    if (loading) return <div className="cp-tr-loading"><div className="cp-tr-spinner"></div>Running tests...</div>;
    if (!results) return <div className="cp-tr-empty">Run code or submit to see results</div>;

    const {passed, total, results: cases, error, executionTime}=results;
    const allPassed=passed===total&&total>0;

    // Helper to format values for display
    const formatValue=(value) =>
    {
        if (value===null||value===undefined) return 'null';
        if (typeof value==='object') return JSON.stringify(value);
        return String(value);
    };

    return (
        <div className="cp-test-results">
            <div className={`cp-tr-summary ${allPassed? 'success':error? 'error':'partial'}`}>
                <span className="cp-tr-icon">{allPassed? <CheckCircleIcon size={18} />:error? <XIcon size={18} />:<AlertIcon size={18} />}</span>
                <span className="cp-tr-text">
                    {error? 'Error':allPassed? 'All Passed!':`${passed}/${total} Passed`}
                </span>
                {executionTime&&<span className="cp-tr-time">{executionTime}ms</span>}
            </div>
            {error&&<div className="cp-tr-error"><pre>{error}</pre></div>}
            {cases&&cases.length>0&&(
                <div className="cp-tr-cases">
                    {cases.map((c, i) => (
                        <div key={i} className={`cp-tr-case ${c.passed? 'pass':'fail'}`}>
                            <div className="cp-tr-case-header">
                                <span>{c.passed? <CheckCircleIcon size={14} />:<XIcon size={14} />} Test {i+1}</span>
                                {c.executionTime&&<span className="cp-tr-case-time">{c.executionTime}ms</span>}
                            </div>
                            <div className="cp-tr-case-body">
                                <div className="cp-tr-row"><span className="cp-tr-label">Input:</span><code>{formatValue(c.input)}</code></div>
                                <div className="cp-tr-row"><span className="cp-tr-label">Expected:</span><code>{formatValue(c.expected)}</code></div>
                                <div className="cp-tr-row"><span className="cp-tr-label">Got:</span><code className={c.passed? '':'wrong'}>{formatValue(c.actual||c.output)}</code></div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CPTestResults;
