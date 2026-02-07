import {useState, useEffect, useRef} from 'react';
import {VideoIcon, VideoOffIcon, AlertIcon, RefreshIcon} from './Icons';
import './DualCameraPanel.css';

function DualCameraPanel({
    primaryStream,
    secondaryStream,
    remoteStreams=new Map(),
    onPrimaryToggle,
    onSecondaryToggle,
    userName='You',
    role='candidate',
    showControls=true
})
{
    const primaryVideoRef=useRef();
    const secondaryVideoRef=useRef();
    const [primaryError, setPrimaryError]=useState(null);
    const [secondaryError, setSecondaryError]=useState(null);
    const [cameraDevices, setCameraDevices]=useState([]);

    useEffect(() =>
    {
        // Enumerate available cameras
        enumerateCameras();
    }, []);

    useEffect(() =>
    {
        if (primaryStream&&primaryVideoRef.current)
        {
            primaryVideoRef.current.srcObject=primaryStream;
        }
    }, [primaryStream]);

    useEffect(() =>
    {
        if (secondaryStream&&secondaryVideoRef.current)
        {
            secondaryVideoRef.current.srcObject=secondaryStream;
        }
    }, [secondaryStream]);

    const enumerateCameras=async () =>
    {
        try
        {
            const devices=await navigator.mediaDevices.enumerateDevices();
            const videoDevices=devices.filter(d => d.kind==='videoinput');
            setCameraDevices(videoDevices);
        } catch (error)
        {
            console.error('Failed to enumerate cameras:', error);
        }
    };

    const hasMultipleCameras=cameraDevices.length>1;

    return (
        <div className="dual-camera-panel">
            {/* Primary Camera */}
            <div className="camera-container primary">
                <div className="camera-header">
                    <span className="camera-label">
                        <VideoIcon size={14} />
                        Primary Camera
                    </span>
                    <span className="user-name">{userName}</span>
                </div>

                <div className="video-wrapper">
                    {primaryStream? (
                        <video
                            ref={primaryVideoRef}
                            autoPlay
                            playsInline
                            muted
                        />
                    ):(
                        <div className="camera-placeholder">
                            <VideoOffIcon size={32} />
                            <span>Camera Off</span>
                        </div>
                    )}

                    {primaryError&&(
                        <div className="camera-error">
                            <AlertIcon size={16} />
                            <span>{primaryError}</span>
                        </div>
                    )}
                </div>

                {showControls&&(
                    <div className="camera-controls">
                        <button
                            className={`camera-toggle ${primaryStream? 'active':''}`}
                            onClick={onPrimaryToggle}
                        >
                            {primaryStream? <VideoIcon size={16} />:<VideoOffIcon size={16} />}
                        </button>
                    </div>
                )}
            </div>

            {/* Secondary Camera */}
            <div className="camera-container secondary">
                <div className="camera-header">
                    <span className="camera-label">
                        <VideoIcon size={14} />
                        Secondary Camera
                    </span>
                    {!hasMultipleCameras&&(
                        <span className="camera-hint">
                            Connect another camera
                        </span>
                    )}
                </div>

                <div className="video-wrapper">
                    {secondaryStream? (
                        <video
                            ref={secondaryVideoRef}
                            autoPlay
                            playsInline
                            muted
                        />
                    ):(
                        <div className="camera-placeholder secondary">
                            {hasMultipleCameras? (
                                <>
                                    <VideoIcon size={32} />
                                    <span>Click to enable</span>
                                </>
                            ):(
                                <>
                                    <VideoOffIcon size={32} />
                                    <span>No second camera</span>
                                    <small>Connect a phone or USB camera</small>
                                </>
                            )}
                        </div>
                    )}

                    {secondaryError&&(
                        <div className="camera-error">
                            <AlertIcon size={16} />
                            <span>{secondaryError}</span>
                        </div>
                    )}
                </div>

                {showControls&&hasMultipleCameras&&(
                    <div className="camera-controls">
                        <button
                            className={`camera-toggle ${secondaryStream? 'active':''}`}
                            onClick={onSecondaryToggle}
                        >
                            {secondaryStream? <VideoIcon size={16} />:<VideoOffIcon size={16} />}
                        </button>
                    </div>
                )}
            </div>

            {/* Remote Cameras */}
            {remoteStreams&&remoteStreams.size>0&&(
                <div className="remote-cameras">
                    <h4>Remote Participant Cameras</h4>
                    {Array.from(remoteStreams.entries()).map(([socketId, streams]) => (
                        <div key={socketId} className="remote-camera-group">
                            {streams.primary&&(
                                <div className="camera-container remote">
                                    <div className="camera-header">
                                        <span className="camera-label">Remote Primary</span>
                                    </div>
                                    <div className="video-wrapper">
                                        <video
                                            autoPlay
                                            playsInline
                                            ref={el =>
                                            {
                                                if (el) el.srcObject=streams.primary;
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                            {streams.secondary&&(
                                <div className="camera-container remote secondary">
                                    <div className="camera-header">
                                        <span className="camera-label">Remote Secondary</span>
                                    </div>
                                    <div className="video-wrapper">
                                        <video
                                            autoPlay
                                            playsInline
                                            ref={el =>
                                            {
                                                if (el) el.srcObject=streams.secondary;
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Camera Status */}
            <div className="camera-status">
                <div className="status-item">
                    <span className={`status-dot ${primaryStream? 'active':'inactive'}`}></span>
                    <span>Primary: {primaryStream? 'Active':'Off'}</span>
                </div>
                <div className="status-item">
                    <span className={`status-dot ${secondaryStream? 'active':'inactive'}`}></span>
                    <span>Secondary: {secondaryStream? 'Active':'Off'}</span>
                </div>
            </div>
        </div>
    );
}

export default DualCameraPanel;
