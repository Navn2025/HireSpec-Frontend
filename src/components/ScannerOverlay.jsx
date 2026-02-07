/**
 * ScannerOverlay - Biometric face scanning overlay component
 * Black and white themed with scanning animation
 */

import './ScannerOverlay.css';

export default function ScannerOverlay({scanning, status='idle', message})
{
    const statusColors={
        idle: 'var(--text-secondary)',
        scanning: 'var(--text-primary)',
        success: '#d4d4d4',
        error: '#737373'
    };

    return (
        <div className="scanner-overlay">
            {/* Corner brackets */}
            <div className="scanner-frame">
                <div className="corner corner-tl"></div>
                <div className="corner corner-tr"></div>
                <div className="corner corner-bl"></div>
                <div className="corner corner-br"></div>
            </div>

            {/* Center guide */}
            <div
                className={`scanner-guide ${scanning? 'scanning':''}`}
                style={{borderColor: statusColors[status]}}
            >
                <div className="guide-crosshair">
                    <div className="crosshair-h"></div>
                    <div className="crosshair-v"></div>
                </div>
            </div>

            {/* Scanning line animation */}
            {scanning&&(
                <div className="scan-line"></div>
            )}

            {/* Grid overlay */}
            <div className="scanner-grid"></div>

            {/* Status message */}
            {message&&(
                <div
                    className="scanner-message"
                    style={{color: statusColors[status]}}
                >
                    <span className="message-dot" style={{background: statusColors[status]}}></span>
                    {message}
                </div>
            )}

            {/* Technical readout */}
            <div className="scanner-readout">
                <div className="readout-line">SYS:BIOMETRIC</div>
                <div className="readout-line">MODE:{status.toUpperCase()}</div>
            </div>
        </div>
    );
}
