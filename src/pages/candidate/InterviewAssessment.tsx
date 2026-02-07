import { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "wouter";
import Webcam from "react-webcam";
import { CyberCard } from "@/components/CyberCard";
import { CyberButton } from "@/components/CyberButton";
import { useProctoring } from "@/hooks/use-proctoring";

type Params = { id: string };

export default function InterviewAssessment() {
  const params = useParams<Params>();
  const assessmentId = Number(params.id);
  const [, setLocation] = useLocation();

  const pageRef = useRef<HTMLDivElement | null>(null);
  const webcamRef = useRef<Webcam>(null);
  const [prompt, setPrompt] = useState("Tell me about a time you solved a difficult problem.");
  const [answer, setAnswer] = useState("");

  const { warnings, isFullscreen, requestFullscreen, blockers, logSnapshot } = useProctoring({
    assessmentId,
  });

  useEffect(() => {
    void requestFullscreen(pageRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const image = webcamRef.current?.getScreenshot();
      if (image) void logSnapshot(image);
    }, 30_000);
    return () => window.clearInterval(interval);
  }, [logSnapshot]);

  return (
    <div ref={pageRef} className="min-h-screen bg-black p-6">
      {!isFullscreen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <CyberCard className="max-w-lg w-full">
            <h2 className="font-display text-xl text-primary mb-2">FULLSCREEN REQUIRED</h2>
            <p className="text-sm text-muted-foreground mb-4">Return to fullscreen to continue.</p>
            <CyberButton onClick={() => requestFullscreen(pageRef.current)}>RETURN TO FULLSCREEN</CyberButton>
          </CyberCard>
        </div>
      )}

      <header className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
        <div>
          <h1 className="font-display text-2xl text-primary tracking-widest">AI INTERVIEW (BASIC)</h1>
          <p className="font-mono text-xs text-muted-foreground">Warnings: {warnings}/3</p>
        </div>
        <div className="flex gap-2">
          <CyberButton variant="outline" onClick={() => setLocation("/dashboard/candidate")}>EXIT</CyberButton>
        </div>
      </header>

      <main className="grid lg:grid-cols-2 gap-6">
        <CyberCard>
          <p className="font-display text-lg mb-2">VIDEO</p>
          <div className="relative aspect-video rounded overflow-hidden border border-white/10">
            <Webcam ref={webcamRef} audio={true} screenshotFormat="image/jpeg" className="w-full h-full object-cover" />
          </div>
          <p className="text-xs font-mono text-muted-foreground mt-2">Snapshot every 30s.</p>
        </CyberCard>

        <CyberCard>
          <p className="font-display text-lg mb-2">PROMPT</p>
          <div className="border border-white/10 rounded p-3 select-none">
            <p className="text-sm">{prompt}</p>
          </div>

          <div
            className="mt-4"
            onContextMenu={blockers.onContextMenu as any}
            onCopy={blockers.onCopy as any}
            onCut={blockers.onCut as any}
            onPaste={blockers.onPaste as any}
          >
            <p className="font-mono text-xs text-muted-foreground mb-2">YOUR ANSWER</p>
            <textarea
              className="w-full min-h-[220px] bg-black border border-white/10 rounded p-3 outline-none"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Speak your answer and optionally type notes here..."
            />
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <CyberButton variant="outline" onClick={() => setPrompt("What is your strongest technical skill and why?")}>NEXT QUESTION</CyberButton>
          </div>
        </CyberCard>
      </main>
    </div>
  );
}
