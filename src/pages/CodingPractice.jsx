import React, {useState, useEffect, useCallback, useRef} from 'react';
import {useNavigate} from 'react-router-dom';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import CPProblemList from '../components/cp/CPProblemList.jsx';
import CPProblemDescription from '../components/cp/CPProblemDescription.jsx';
import CPTestResults from '../components/cp/CPTestResults.jsx';
import LiveViolationCounter from '../components/cp/LiveViolationCounter.jsx';
import useAntiCheatMonitor from '../components/cp/useAntiCheatMonitor.jsx';
import {PlayIcon, BeakerIcon, SendIcon, SearchIcon, XIcon, LightbulbIcon, RocketIcon, CheckCircleIcon, ChartIcon, DownloadIcon, LoadingIcon} from '../components/Icons';
import './CodingPractice.css';

const API='http://localhost:8080/api/cp';

const LANGUAGE_MAP={
    javascript: {label: 'JavaScript', monaco: 'javascript', ext: 'js'},
    python: {label: 'Python', monaco: 'python', ext: 'py'},
    java: {label: 'Java', monaco: 'java', ext: 'java'},
    cpp: {label: 'C++', monaco: 'cpp', ext: 'cpp'},
    c: {label: 'C', monaco: 'c', ext: 'c'},
};

const DEFAULT_CODE={
    javascript: '// Start coding here\nfunction solution(input) {\n    // Your code here\n    \n}\n',
    python: '# Start coding here\ndef solution(input):\n    # Your code here\n    pass\n',
    java: 'class Solution {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}\n',
    cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Your code here\n    return 0;\n}\n',
    c: '#include <stdio.h>\n\nint main() {\n    // Your code here\n    return 0;\n}\n',
};

function CodingPractice()
{
    const navigate=useNavigate();

    // Problem state
    const [currentProblem, setCurrentProblem]=useState(null);
    const [solvedProblems, setSolvedProblems]=useState([]);

    // Editor state
    const [code, setCode]=useState(DEFAULT_CODE.javascript);
    const [language, setLanguage]=useState('javascript');
    const editorRef=useRef(null);

    // Output state
    const [outputTab, setOutputTab]=useState('testcase');
    const [testResults, setTestResults]=useState(null);
    const [runOutput, setRunOutput]=useState(null);
    const [aiAnalysis, setAiAnalysis]=useState(null);
    const [aiDetection, setAiDetection]=useState(null);
    const [report, setReport]=useState(null);

    // Loading states
    const [runLoading, setRunLoading]=useState(false);
    const [submitLoading, setSubmitLoading]=useState(false);
    const [analysisLoading, setAnalysisLoading]=useState(false);
    const [detectionLoading, setDetectionLoading]=useState(false);
    const [reportLoading, setReportLoading]=useState(false);

    // Session state
    const [sessionId, setSessionId]=useState(null);
    const [sessionActive, setSessionActive]=useState(false);
    const [isFullscreen, setIsFullscreen]=useState(false);
    const [trustLevel, setTrustLevel]=useState(100);

    // Timer
    const [timer, setTimer]=useState(0);
    const timerRef=useRef(null);

    // Mobile view toggle: 'question' or 'code'
    const [mobileView, setMobileView]=useState('question');
    
    // Mobile section: 'problems', 'workspace', 'output'
    const [mobileSection, setMobileSection]=useState('workspace');

    // Anti-cheat
    const handleViolation=useCallback(async (violation) =>
    {
        if (!sessionId) return;
        try
        {
            await axios.post(`${API}/session/violation`, {
                sessionId,
                type: violation.type,
                details: violation.details,
            });
            const r=await axios.get(`${API}/session/${sessionId}`);
            if (r.data?.trustScore!==undefined) setTrustLevel(Math.round(r.data.trustScore));
        } catch (err)
        {
            console.error('Failed to report violation:', err);
        }
    }, [sessionId]);

    const {violations, getMetrics, getTotalViolations, enterFullscreen, exitFullscreen}=useAntiCheatMonitor({
        enabled: sessionActive,
        onViolation: handleViolation,
        strictMode: false,
    });

    // Timer effect
    useEffect(() =>
    {
        if (sessionActive)
        {
            timerRef.current=setInterval(() => setTimer(t => t+1), 1000);
        } else
        {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [sessionActive]);

    // Format timer
    const formatTime=(s) =>
    {
        const m=Math.floor(s/60);
        const sec=s%60;
        return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    };

    // Start session
    const startSession=async () =>
    {
        try
        {
            const r=await axios.post(`${API}/session/create`, {
                userId: 'user-'+Date.now(),
                problemId: currentProblem?.id||'general',
                settings: {antiCheat: true, timeLimit: 3600},
            });
            setSessionId(r.data.sessionId);
            setSessionActive(true);
            setTrustLevel(100);
            setTimer(0);
        } catch (err)
        {
            console.error('Session start failed:', err);
            // Start locally even if server fails
            setSessionActive(true);
            setTimer(0);
        }
    };

    const endSession=async () =>
    {
        if (sessionId)
        {
            try
            {
                await axios.post(`${API}/session/complete`, {sessionId});
            } catch (err) {console.error(err);}
        }
        setSessionActive(false);
        setSessionId(null);
        if (isFullscreen) {exitFullscreen(); setIsFullscreen(false);}
    };

    const toggleFullscreen=() =>
    {
        if (isFullscreen) {exitFullscreen(); setIsFullscreen(false);}
        else {enterFullscreen(); setIsFullscreen(true);}
    };

    // Select problem
    const handleSelectProblem=async (problem) =>
    {
        // For AI-generated questions, full data is already present
        // For regular questions, fetch full details from API
        let fullProblem=problem;
        if (!problem.isAiGenerated&&!problem.description&&problem.id)
        {
            try
            {
                const r=await axios.get(`${API}/questions/${problem.id}`);
                fullProblem=r.data.question||r.data;
            } catch (err)
            {
                console.error('Failed to fetch problem details:', err);
            }
        }
        setCurrentProblem(fullProblem);
        if (fullProblem.starterCode?.[language])
        {
            setCode(fullProblem.starterCode[language]);
        } else if (fullProblem.starterCode)
        {
            const first=Object.keys(fullProblem.starterCode)[0];
            if (first) {setLanguage(first); setCode(fullProblem.starterCode[first]);}
        } else
        {
            setCode(DEFAULT_CODE[language]);
        }
        setTestResults(null);
        setRunOutput(null);
        setAiAnalysis(null);
        setAiDetection(null);
        setReport(null);
        setOutputTab('testcase');
    };

    // Language change
    const handleLanguageChange=(lang) =>
    {
        setLanguage(lang);
        if (currentProblem?.starterCode?.[lang])
        {
            setCode(currentProblem.starterCode[lang]);
        } else
        {
            setCode(DEFAULT_CODE[lang]);
        }
    };

    // Run code
    const handleRun=async () =>
    {
        setRunLoading(true);
        setOutputTab('testcase');
        try
        {
            const r=await axios.post(`${API}/code/execute`, {code, language});
            setRunOutput(r.data);
            setTestResults(null);
        } catch (err)
        {
            setRunOutput({error: err.response?.data?.error||'Execution failed'});
        }
        setRunLoading(false);
    };

    // Run tests
    const handleRunTests=async () =>
    {
        if (!currentProblem) return;
        setRunLoading(true);
        setOutputTab('testcase');
        try
        {
            const endpoint=currentProblem.isAiGenerated? `${API}/ai-questions/run-tests`:`${API}/questions/run-tests`;
            const payload=currentProblem.isAiGenerated
                ? {code, language, testCases: currentProblem.testCases, functionName: currentProblem.functionName}
                :{code, language, questionId: currentProblem.id};
            const r=await axios.post(endpoint, payload);
            // Format response to match CPTestResults expected structure
            const visibleTests=r.data.results?.visibleTests||[];
            const formattedResults={
                passed: r.data.results?.passedTests||0,
                total: r.data.results?.totalTests||0,
                results: visibleTests.map(test => ({
                    passed: test.passed,
                    input: test.input,
                    expected: test.expectedOutput,
                    actual: test.actualOutput,
                    executionTime: test.executionTime
                })),
                error: r.data.results?.error,
                executionTime: r.data.results?.executionTime
            };
            setTestResults(formattedResults);
            setRunOutput(null);
        } catch (err)
        {
            setTestResults({error: err.response?.data?.error||'Test run failed', passed: 0, total: 0});
        }
        setRunLoading(false);
    };

    // Submit
    const handleSubmit=async () =>
    {
        if (!currentProblem) return;
        setSubmitLoading(true);
        setOutputTab('testcase');
        try
        {
            const endpoint=currentProblem.isAiGenerated? `${API}/ai-questions/run-tests`:`${API}/questions/submit`;
            const userId=sessionId||'user-'+Date.now();
            const payload=currentProblem.isAiGenerated
                ? {code, language, testCases: currentProblem.testCases, functionName: currentProblem.functionName}
                :{code, language, questionId: currentProblem.id, userId};
            const r=await axios.post(endpoint, payload);
            // Format response to match CPTestResults expected structure
            const visibleTests=r.data.results?.visibleTests||[];
            const formattedResults={
                passed: r.data.results?.passedTests||0,
                total: r.data.results?.totalTests||0,
                results: visibleTests.map(test => ({
                    passed: test.passed,
                    input: test.input,
                    expected: test.expectedOutput,
                    actual: test.actualOutput,
                    executionTime: test.executionTime
                })),
                error: r.data.results?.error,
                executionTime: r.data.results?.executionTime
            };
            setTestResults(formattedResults);
            setRunOutput(null);
            if (formattedResults.passed===formattedResults.total&&formattedResults.total>0)
            {
                setSolvedProblems(prev => [...new Set([...prev, currentProblem.id])]);
                if (sessionId)
                {
                    try
                    {
                        await axios.post(`${API}/session/complete`, {sessionId});
                    } catch (e) { /* ignore */}
                }
            }
        } catch (err)
        {
            setTestResults({error: err.response?.data?.error||'Submission failed', passed: 0, total: 0});
        }
        setSubmitLoading(false);
    };

    // AI Analysis
    const handleAnalyze=async () =>
    {
        setAnalysisLoading(true);
        setOutputTab('analysis');
        try
        {
            const r=await axios.post(`${API}/analysis/analyze`, {
                code,
                language,
                questionId: currentProblem?.id,
                problemTitle: currentProblem?.title,
            });
            // Extract nested analysis data from response
            setAiAnalysis(r.data.analysis||r.data);
        } catch (err)
        {
            setAiAnalysis({error: err.response?.data?.error||err.response?.data?.message||'Analysis failed'});
        }
        setAnalysisLoading(false);
    };

    // AI Detection
    const handleDetectAI=async () =>
    {
        setDetectionLoading(true);
        setOutputTab('detection');
        try
        {
            const r=await axios.post(`${API}/analysis/detect-ai`, {
                code,
                language,
                sessionId,
                behaviorMetrics: getMetrics(),
            });
            // Extract nested detection data from response
            setAiDetection(r.data.detection||r.data);
        } catch (err)
        {
            setAiDetection({error: err.response?.data?.error||err.response?.data?.message||'Detection failed'});
        }
        setDetectionLoading(false);
    };

    // Report
    const handleGenerateReport=async () =>
    {
        setReportLoading(true);
        setOutputTab('report');
        try
        {
            const r=await axios.post(`${API}/reports/generate`, {
                sessionId,
                code,
                language,
                questionId: currentProblem?.id,
                problemTitle: currentProblem?.title,
                testResults,
                violations,
            });
            // Map markdown to report for frontend compatibility
            setReport({report: r.data.markdown, filename: r.data.filename, ...r.data});
        } catch (err)
        {
            setReport({error: err.response?.data?.error||err.response?.data?.message||'Report generation failed'});
        }
        setReportLoading(false);
    };

    const handleDownloadReport=() =>
    {
        if (!report?.report) return;
        const blob=new Blob([report.report], {type: 'text/markdown'});
        const url=URL.createObjectURL(blob);
        const a=document.createElement('a');
        a.href=url;
        a.download=`report-${currentProblem?.title||'code'}-${Date.now()}.md`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Editor mount
    const handleEditorMount=(editor) =>
    {
        editorRef.current=editor;
    };

    return (
        <div className="cp-leetcode-layout">
            {/* Header */}
            <header className="cp-header">
                <div className="cp-header-left">
                    <button className="cp-back-btn" onClick={() => navigate('/')}>← Back</button>
                    <h1 className="cp-logo">Coding Practice</h1>
                </div>
                <div className="cp-header-center">
                    {currentProblem&&(
                        <span className="cp-current-problem">{currentProblem.title}</span>
                    )}
                    {sessionActive&&<span className="cp-timer">⏱ {formatTime(timer)}</span>}
                </div>
                <div className="cp-header-right">
                    <LiveViolationCounter violations={violations} trustLevel={trustLevel} />
                    {!sessionActive? (
                        <button className="cp-btn-session start" onClick={startSession}>▶ Start Session</button>
                    ):(
                        <button className="cp-btn-session end" onClick={endSession}>⏹ End Session</button>
                    )}
                    <button className="cp-btn-fs" onClick={toggleFullscreen} title="Toggle Fullscreen">
                        {isFullscreen? '⛶':'⛶'}
                    </button>
                </div>
            </header>

            {/* Main 3-panel layout */}
            <div className="cp-main-container">
                {/* Mobile navigation tabs */}
                <nav className="cp-mobile-nav">
                    <button 
                        className={mobileSection === 'problems' ? 'active' : ''} 
                        onClick={() => setMobileSection('problems')}
                    >
                        📋 <span>Problems</span>
                    </button>
                    <button 
                        className={mobileSection === 'workspace' ? 'active' : ''} 
                        onClick={() => setMobileSection('workspace')}
                    >
                        💻 <span>Workspace</span>
                    </button>
                    <button 
                        className={mobileSection === 'output' ? 'active' : ''} 
                        onClick={() => setMobileSection('output')}
                    >
                        📊 <span>Output</span>
                    </button>
                </nav>

                {/* Left sidebar: Problem list */}
                <div className={`cp-problem-list-sidebar ${mobileSection === 'problems' ? 'mobile-active' : ''}`}>
                    <CPProblemList
                        onSelectProblem={(problem) => {
                            handleSelectProblem(problem);
                            setMobileSection('workspace');
                        }}
                        currentProblemId={currentProblem?.id}
                        solvedProblems={solvedProblems}
                    />
                </div>

                {/* Center: Problem description + Editor */}
                <div className={`cp-problem-workspace ${mobileSection === 'workspace' ? 'mobile-active' : ''}`}>
                    {/* Mobile view toggle */}
                    <div className="cp-mobile-toggle">
                        <button 
                            className={mobileView === 'question' ? 'active' : ''} 
                            onClick={() => setMobileView('question')}
                        >
                            📋 Question
                        </button>
                        <button 
                            className={mobileView === 'code' ? 'active' : ''} 
                            onClick={() => setMobileView('code')}
                        >
                            💻 Code
                        </button>
                    </div>
                    
                    {/* Top: Problem description (resizable) */}
                    <div className={`cp-desc-panel ${mobileView === 'code' ? 'mobile-hidden' : ''}`}>
                        <CPProblemDescription problem={currentProblem} />
                    </div>

                    {/* Bottom: Code editor */}
                    <div className={`cp-editor-panel ${mobileView === 'question' ? 'mobile-hidden' : ''}`}>
                        <div className="cp-editor-toolbar">
                            <select
                                className="cp-lang-select"
                                value={language}
                                onChange={e => handleLanguageChange(e.target.value)}
                            >
                                {Object.entries(LANGUAGE_MAP).map(([k, v]) => (
                                    <option key={k} value={k}>{v.label}</option>
                                ))}
                            </select>
                            <div className="cp-editor-actions">
                                <button className="cp-btn run" onClick={handleRun} disabled={runLoading}>
                                    {runLoading? <LoadingIcon size={14} />:<PlayIcon size={14} />} Run
                                </button>
                                <button className="cp-btn test" onClick={handleRunTests} disabled={runLoading||!currentProblem}>
                                    <BeakerIcon size={14} /> Test
                                </button>
                                <button className="cp-btn submit" onClick={handleSubmit} disabled={submitLoading||!currentProblem}>
                                    {submitLoading? <LoadingIcon size={14} />:<SendIcon size={14} />} Submit
                                </button>
                            </div>
                        </div>
                        <Editor
                            height="100%"
                            language={LANGUAGE_MAP[language]?.monaco||'javascript'}
                            value={code}
                            onChange={(v) => setCode(v||'')}
                            onMount={handleEditorMount}
                            theme="vs-dark"
                            options={{
                                fontSize: 14,
                                minimap: {enabled: false},
                                lineNumbers: 'on',
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                tabSize: 4,
                                wordWrap: 'on',
                                padding: {top: 10},
                            }}
                        />
                    </div>
                </div>

                {/* Right sidebar: Output */}
                <div className={`cp-output-sidebar ${mobileSection === 'output' ? 'mobile-active' : ''}`}>
                    <div className="cp-output-tabs">
                        <button className={outputTab==='testcase'? 'active':''} onClick={() => setOutputTab('testcase')}>Testcase</button>
                        <button className={outputTab==='analysis'? 'active':''} onClick={() => setOutputTab('analysis')}>AI Analysis</button>
                        <button className={outputTab==='detection'? 'active':''} onClick={() => setOutputTab('detection')}>AI Detection</button>
                        <button className={outputTab==='report'? 'active':''} onClick={() => setOutputTab('report')}>Report</button>
                    </div>

                    <div className="cp-output-content">
                        {/* Testcase tab */}
                        {outputTab==='testcase'&&(
                            <div className="cp-output-testcase">
                                {runOutput&&!testResults&&(
                                    <div className="cp-run-output">
                                        <h4>Output</h4>
                                        <pre className={runOutput.error? 'error':''}>{runOutput.error||runOutput.output||'No output'}</pre>
                                        {runOutput.executionTime&&<span className="cp-exec-time">⏱ {runOutput.executionTime}ms</span>}
                                    </div>
                                )}
                                <CPTestResults results={testResults} loading={runLoading||submitLoading} />
                            </div>
                        )}

                        {/* AI Analysis tab */}
                        {outputTab==='analysis'&&(
                            <div className="cp-output-analysis">
                                <button className="cp-btn analyze" onClick={handleAnalyze} disabled={analysisLoading||!code.trim()}>
                                    {analysisLoading? <><LoadingIcon size={14} /> Analyzing...</>:<><SearchIcon size={14} /> Analyze Code</>}
                                </button>
                                {aiAnalysis&&!aiAnalysis.error&&(
                                    <div className="cp-analysis-results">
                                        {aiAnalysis.qualityScore!==undefined&&(
                                            <div className="cp-quality-score">
                                                <div className="cp-qs-circle" style={{
                                                    background: `conic-gradient(${aiAnalysis.qualityScore>=70? '#ffffff':aiAnalysis.qualityScore>=40? '#b0b0b0':'#666666'} ${aiAnalysis.qualityScore*3.6}deg, rgba(255,255,255,0.05) 0deg)`
                                                }}>
                                                    <span>{aiAnalysis.qualityScore}</span>
                                                </div>
                                                <span className="cp-qs-label">Quality Score</span>
                                            </div>
                                        )}
                                        {aiAnalysis.complexity&&(
                                            <div className="cp-complexity">
                                                <span>Time: <code>{aiAnalysis.complexity.time||'N/A'}</code></span>
                                                <span>Space: <code>{aiAnalysis.complexity.space||'N/A'}</code></span>
                                            </div>
                                        )}
                                        {aiAnalysis.mistakes?.length>0&&(
                                            <div className="cp-section">
                                                <h4><XIcon size={16} /> Mistakes</h4>
                                                {aiAnalysis.mistakes.map((m, i) => <div key={i} className="cp-item mistake">{typeof m==='string'? m:m.description||JSON.stringify(m)}</div>)}
                                            </div>
                                        )}
                                        {aiAnalysis.suggestions?.length>0&&(
                                            <div className="cp-section">
                                                <h4><LightbulbIcon size={16} /> Suggestions</h4>
                                                {aiAnalysis.suggestions.map((s, i) => <div key={i} className="cp-item suggestion">{typeof s==='string'? s:s.description||JSON.stringify(s)}</div>)}
                                            </div>
                                        )}
                                        {aiAnalysis.improvements?.length>0&&(
                                            <div className="cp-section">
                                                <h4><RocketIcon size={16} /> Improvements</h4>
                                                {aiAnalysis.improvements.map((im, i) => <div key={i} className="cp-item improvement">{typeof im==='string'? im:im.description||JSON.stringify(im)}</div>)}
                                            </div>
                                        )}
                                        {aiAnalysis.bestPractices?.length>0&&(
                                            <div className="cp-section">
                                                <h4><CheckCircleIcon size={16} /> Best Practices</h4>
                                                {aiAnalysis.bestPractices.map((bp, i) => <div key={i} className="cp-item best-practice">{typeof bp==='string'? bp:bp.description||JSON.stringify(bp)}</div>)}
                                            </div>
                                        )}
                                    </div>
                                )}
                                {aiAnalysis?.error&&<div className="cp-error-msg">{aiAnalysis.error}</div>}
                            </div>
                        )}

                        {/* AI Detection tab */}
                        {outputTab==='detection'&&(
                            <div className="cp-output-detection">
                                <button className="cp-btn detect" onClick={handleDetectAI} disabled={detectionLoading||!code.trim()}>
                                    {detectionLoading? <><LoadingIcon size={14} /> Detecting...</>:<><SearchIcon size={14} /> Detect AI Code</>}
                                </button>
                                {aiDetection&&!aiDetection.error&&(
                                    <div className="cp-detection-results">
                                        <div className={`cp-detect-verdict ${aiDetection.verdict?.toLowerCase().replace(/\s/g, '-')||''}`}>
                                            <div className="cp-detect-score-ring" style={{
                                                background: `conic-gradient(${(aiDetection.finalScore||0)>60? '#666666':(aiDetection.finalScore||0)>30? '#b0b0b0':'#ffffff'} ${(aiDetection.finalScore||0)*3.6}deg, rgba(255,255,255,0.05) 0deg)`
                                            }}>
                                                <span>{Math.round(aiDetection.finalScore||0)}%</span>
                                            </div>
                                            <span className="cp-detect-label">{aiDetection.verdict||'Unknown'}</span>
                                        </div>
                                        {aiDetection.breakdown&&(
                                            <div className="cp-detect-breakdown">
                                                <h4>Breakdown</h4>
                                                {Object.entries(aiDetection.breakdown).map(([k, v]) => (
                                                    <div key={k} className="cp-detect-bar">
                                                        <span>{k}</span>
                                                        <div className="cp-bar-bg"><div className="cp-bar-fill" style={{width: `${v}%`}}></div></div>
                                                        <span>{Math.round(v)}%</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {aiDetection.signals?.length>0&&(
                                            <div className="cp-section">
                                                <h4><SearchIcon size={16} /> Signals</h4>
                                                {aiDetection.signals.map((s, i) => <div key={i} className="cp-item signal">{typeof s==='string'? s:s.description||JSON.stringify(s)}</div>)}
                                            </div>
                                        )}
                                    </div>
                                )}
                                {aiDetection?.error&&<div className="cp-error-msg">{aiDetection.error}</div>}
                            </div>
                        )}

                        {/* Report tab */}
                        {outputTab==='report'&&(
                            <div className="cp-output-report">
                                <div className="cp-report-actions">
                                    <button className="cp-btn report" onClick={handleGenerateReport} disabled={reportLoading}>
                                        {reportLoading? <><LoadingIcon size={14} /> Generating...</>:<><ChartIcon size={14} /> Generate Report</>}
                                    </button>
                                    {report?.report&&(
                                        <button className="cp-btn download" onClick={handleDownloadReport}><DownloadIcon size={14} /> Download</button>
                                    )}
                                </div>
                                {report?.report&&(
                                    <div className="cp-report-content">
                                        <pre>{report.report}</pre>
                                    </div>
                                )}
                                {report?.error&&<div className="cp-error-msg">{report.error}</div>}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CodingPractice;
