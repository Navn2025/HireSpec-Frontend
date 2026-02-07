import React from 'react';
import './LiveViolationCounter.css';

const LiveViolationCounter=({violations, trustLevel}) =>
{
    const total=Object.values(violations).reduce((s, c) => s+c, 0);
    const getTrustColor=() =>
    {
        if (trustLevel>=80) return '#4caf50';
        if (trustLevel>=60) return '#ff9800';
        if (trustLevel>=40) return '#ff5722';
        return '#f44336';
    };
    const getTrustLabel=() =>
    {
        if (trustLevel>=80) return 'HIGH';
        if (trustLevel>=60) return 'MEDIUM';
        if (trustLevel>=40) return 'LOW';
        return 'CRITICAL';
    };

    return (
        <div className="cp-violation-counter">
            <div className="cp-vc-header">
                <span className="cp-vc-icon">🛡️</span>
                <span className="cp-vc-title">Monitoring</span>
                <span className="cp-vc-trust-badge" style={{backgroundColor: getTrustColor()}}>
                    {getTrustLabel()} ({trustLevel}%)
                </span>
            </div>
            {total>0&&(
                <div className="cp-vc-details">
                    {violations.tabSwitches>0&&<span className="cp-vc-item warn">🔄 Tab: {violations.tabSwitches}</span>}
                    {violations.focusLosses>0&&<span className="cp-vc-item warn">👁 Focus: {violations.focusLosses}</span>}
                    {violations.pasteAttempts>0&&<span className="cp-vc-item danger">📋 Paste: {violations.pasteAttempts}</span>}
                    {violations.copyAttempts>0&&<span className="cp-vc-item danger">📄 Copy: {violations.copyAttempts}</span>}
                    {violations.devToolsAttempts>0&&<span className="cp-vc-item danger">🔧 DevTools: {violations.devToolsAttempts}</span>}
                    {violations.rightClickAttempts>0&&<span className="cp-vc-item">🖱 RClick: {violations.rightClickAttempts}</span>}
                    {violations.fullscreenExits>0&&<span className="cp-vc-item warn">⛶ FS Exit: {violations.fullscreenExits}</span>}
                </div>
            )}
            {total===0&&<div className="cp-vc-clean">✅ No violations</div>}
        </div>
    );
};

export default LiveViolationCounter;
