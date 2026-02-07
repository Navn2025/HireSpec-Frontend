import {useEffect, useRef, useCallback, useState} from 'react';

const useAntiCheatMonitor=({enabled=false, onViolation, strictMode=false}) =>
{
    const [violations, setViolations]=useState({
        tabSwitches: 0, focusLosses: 0, pasteAttempts: 0,
        devToolsAttempts: 0, rightClickAttempts: 0, fullscreenExits: 0, copyAttempts: 0
    });

    const metricsRef=useRef({startTime: Date.now(), lastActivity: Date.now(), inactivePeriods: [], typingSpeed: [], totalKeystrokes: 0});
    const isFullscreenRef=useRef(false);

    const reportViolation=useCallback((type, details) =>
    {
        setViolations(prev =>
        {
            const updated={...prev, [type]: (prev[type]||0)+1};
            const violation={type, count: updated[type], timestamp: Date.now(), details, allViolations: {...updated}};
            console.warn('[Anti-Cheat]', violation);
            if (onViolation) onViolation(violation);
            return updated;
        });
    }, [onViolation]);

    useEffect(() =>
    {
        if (!enabled||!strictMode) return;
        if (violations.tabSwitches>3) alert('Too many tab switches detected.');
        if (violations.pasteAttempts>5) alert('Excessive paste attempts detected.');
    }, [violations, enabled, strictMode]);

    useEffect(() =>
    {
        if (!enabled) return;
        const handleVisibilityChange=() => {if (document.hidden) reportViolation('tabSwitches', {action: 'tab_hidden', timestamp: Date.now()});};
        const handleBlur=() =>
        {
            setTimeout(() =>
            {
                if (!document.hasFocus())
                {
                    reportViolation('focusLosses', {action: 'window_blur', timestamp: Date.now()});
                    metricsRef.current.inactivePeriods.push({start: Date.now()});
                }
            }, 100);
        };
        const handleFocus=() =>
        {
            const periods=metricsRef.current.inactivePeriods;
            if (periods.length>0)
            {
                const last=periods[periods.length-1];
                if (!last.end) {last.end=Date.now(); last.duration=last.end-last.start;}
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);
        window.addEventListener('focus', handleFocus);
        return () => {document.removeEventListener('visibilitychange', handleVisibilityChange); window.removeEventListener('blur', handleBlur); window.removeEventListener('focus', handleFocus);};
    }, [enabled, reportViolation]);

    useEffect(() =>
    {
        if (!enabled) return;
        const handleFullscreenChange=() =>
        {
            const isNow=document.fullscreenElement!==null;
            isFullscreenRef.current=isNow;
            if (!isNow&&strictMode) {reportViolation('fullscreenExits', {action: 'fullscreen_exited'}); alert('Please return to fullscreen mode.');}
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, [enabled, strictMode, reportViolation]);

    useEffect(() =>
    {
        if (!enabled) return;
        const handleKeyDown=(e) =>
        {
            metricsRef.current.lastActivity=Date.now();
            metricsRef.current.totalKeystrokes++;
            const now=Date.now();
            metricsRef.current.typingSpeed.push(now);
            metricsRef.current.typingSpeed=metricsRef.current.typingSpeed.filter(t => now-t<10000);
            if (e.ctrlKey||e.metaKey)
            {
                if ((e.key==='c'||e.key==='C')&&strictMode) {e.preventDefault(); reportViolation('copyAttempts', {key: 'Ctrl+C'});}
                if ((e.key==='v'||e.key==='V')&&strictMode) {e.preventDefault(); reportViolation('pasteAttempts', {key: 'Ctrl+V'});}
                if (e.key==='t'||e.key==='T') {e.preventDefault(); reportViolation('tabSwitches', {key: 'Ctrl+T'});}
                if (e.key==='n'||e.key==='N') {e.preventDefault(); reportViolation('tabSwitches', {key: 'Ctrl+N'});}
                if (e.shiftKey&&'iIjJcC'.includes(e.key)) {e.preventDefault(); reportViolation('devToolsAttempts', {key: `Ctrl+Shift+${e.key}`});}
            }
            if (e.key==='F12') {e.preventDefault(); reportViolation('devToolsAttempts', {key: 'F12'});}
            if ((e.ctrlKey||e.metaKey)&&e.key==='u') {e.preventDefault(); reportViolation('devToolsAttempts', {key: 'Ctrl+U'});}
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [enabled, strictMode, reportViolation]);

    useEffect(() =>
    {
        if (!enabled) return;
        const handlePaste=(e) => {reportViolation('pasteAttempts', {length: e.clipboardData?.getData('text')?.length||0});};
        const handleCopy=() => {if (strictMode) reportViolation('copyAttempts', {prevented: true});};
        document.addEventListener('paste', handlePaste);
        document.addEventListener('copy', handleCopy);
        return () => {document.removeEventListener('paste', handlePaste); document.removeEventListener('copy', handleCopy);};
    }, [enabled, strictMode, reportViolation]);

    useEffect(() =>
    {
        if (!enabled) return;
        const handleContextMenu=(e) => {if (strictMode) {e.preventDefault(); reportViolation('rightClickAttempts', {x: e.clientX, y: e.clientY});} };
        const handleMouseMove=() => {metricsRef.current.lastActivity=Date.now();};
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('mousemove', handleMouseMove);
        return () => {document.removeEventListener('contextmenu', handleContextMenu); document.removeEventListener('mousemove', handleMouseMove);};
    }, [enabled, strictMode, reportViolation]);

    useEffect(() =>
    {
        if (!enabled) return;
        let devtoolsOpen=false;
        const detectDevTools=() =>
        {
            const w=window.outerWidth-window.innerWidth>160;
            const h=window.outerHeight-window.innerHeight>160;
            if ((w||h)&&!devtoolsOpen) {devtoolsOpen=true; reportViolation('devToolsAttempts', {action: 'devtools_opened'}); if (strictMode) alert('Developer tools detected!');}
            else if (!w&&!h&&devtoolsOpen) devtoolsOpen=false;
        };
        const interval=setInterval(detectDevTools, 1000);
        return () => clearInterval(interval);
    }, [enabled, strictMode, reportViolation]);

    const getMetrics=useCallback(() =>
    {
        const now=Date.now();
        return {
            sessionDuration: now-metricsRef.current.startTime,
            totalKeystrokes: metricsRef.current.totalKeystrokes,
            inactiveTime: metricsRef.current.inactivePeriods.reduce((s, p) => s+(p.duration||0), 0),
            inactivePeriods: metricsRef.current.inactivePeriods.length,
            currentTypingSpeed: metricsRef.current.typingSpeed.length,
            lastActivity: metricsRef.current.lastActivity
        };
    }, []);

    const getTotalViolations=useCallback(() => Object.values(violations).reduce((s, c) => s+c, 0), [violations]);
    const enterFullscreen=useCallback(() => {document.documentElement.requestFullscreen?.().catch(console.error);}, []);
    const exitFullscreen=useCallback(() => {document.exitFullscreen?.();}, []);

    return {violations, getMetrics, getTotalViolations, enterFullscreen, exitFullscreen, isFullscreen: isFullscreenRef.current};
};

export default useAntiCheatMonitor;
