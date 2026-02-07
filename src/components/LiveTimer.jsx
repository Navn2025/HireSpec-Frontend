import {useState, useEffect} from 'react';
import {ClockIcon, PlayIcon, PauseIcon, RefreshIcon} from './Icons';
import './LiveTimer.css';

function LiveTimer({duration=0, isRunning=false, onControl=null})
{
    const [time, setTime]=useState(duration);
    const [localRunning, setLocalRunning]=useState(isRunning);

    useEffect(() =>
    {
        setLocalRunning(isRunning);
    }, [isRunning]);

    useEffect(() =>
    {
        setTime(duration);
    }, [duration]);

    // Timer countdown
    useEffect(() =>
    {
        let interval;

        if (localRunning)
        {
            interval=setInterval(() =>
            {
                setTime(prev => prev+1);
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [localRunning]);

    const formatTime=(seconds) =>
    {
        const hrs=Math.floor(seconds/3600);
        const mins=Math.floor((seconds%3600)/60);
        const secs=seconds%60;

        if (hrs>0)
        {
            return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleStart=() =>
    {
        setLocalRunning(true);
        if (onControl)
        {
            onControl('start', time);
        }
    };

    const handlePause=() =>
    {
        setLocalRunning(false);
        if (onControl)
        {
            onControl('pause', time);
        }
    };

    const handleReset=() =>
    {
        setTime(0);
        setLocalRunning(false);
        if (onControl)
        {
            onControl('reset', 0);
        }
    };

    // Calculate color based on time (green -> yellow -> red)
    const getTimeColor=() =>
    {
        if (time<1800) return '#4CAF50'; // Green for < 30 min
        if (time<3600) return '#FFC107'; // Yellow for < 1 hour
        return '#F44336'; // Red for > 1 hour
    };

    return (
        <div className="live-timer">
            <div className="timer-display" style={{color: getTimeColor()}}>
                <ClockIcon size={18} />
                <span className="timer-value">{formatTime(time)}</span>
            </div>

            {onControl&&(
                <div className="timer-controls">
                    {localRunning? (
                        <button
                            className="timer-btn pause"
                            onClick={handlePause}
                            title="Pause Timer"
                        >
                            <PauseIcon size={14} />
                        </button>
                    ):(
                        <button
                            className="timer-btn start"
                            onClick={handleStart}
                            title="Start Timer"
                        >
                            <PlayIcon size={14} />
                        </button>
                    )}
                    <button
                        className="timer-btn reset"
                        onClick={handleReset}
                        title="Reset Timer"
                    >
                        <RefreshIcon size={14} />
                    </button>
                </div>
            )}

            <div className={`timer-status ${localRunning? 'running':'paused'}`}>
                {localRunning? 'Running':'Paused'}
            </div>
        </div>
    );
}

export default LiveTimer;
