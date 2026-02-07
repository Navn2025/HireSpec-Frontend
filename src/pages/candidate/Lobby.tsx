import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { CyberCard } from "@/components/CyberCard";
import { CyberButton } from "@/components/CyberButton";
import { Camera, Mic, Wifi } from "lucide-react";

type CheckState = "checking" | "ok" | "fail";

export default function Lobby() {
  const [, setLocation] = useLocation();

  const [camera, setCamera] = useState<CheckState>("checking");
  const [mic, setMic] = useState<CheckState>("checking");
  const [network, setNetwork] = useState<CheckState>(navigator.onLine ? "ok" : "fail");

  useEffect(() => {
    let cancelled = false;

    async function checkDevices() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        stream.getTracks().forEach((t) => t.stop());
        if (!cancelled) {
          setCamera("ok");
          setMic("ok");
        }
      } catch {
        if (!cancelled) {
          // If combined request fails, try splitting to provide a better signal.
          try {
            const v = await navigator.mediaDevices.getUserMedia({ video: true });
            v.getTracks().forEach((t) => t.stop());
            setCamera("ok");
          } catch {
            setCamera("fail");
          }

          try {
            const a = await navigator.mediaDevices.getUserMedia({ audio: true });
            a.getTracks().forEach((t) => t.stop());
            setMic("ok");
          } catch {
            setMic("fail");
          }
        }
      }
    }

    checkDevices();

    const onOnline = () => setNetwork("ok");
    const onOffline = () => setNetwork("fail");
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      cancelled = true;
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const allOk = camera === "ok" && mic === "ok" && network === "ok";

  return (
    <div className="min-h-screen bg-black p-6 flex items-center justify-center">
      <CyberCard className="w-full max-w-2xl">
        <h1 className="font-display text-2xl text-primary tracking-widest mb-2">LOBBY / SYSTEM CHECK</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Confirm your device readiness (Camera, Mic, Network) before starting.
        </p>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="border border-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Camera className="w-4 h-4 text-primary" />
              <span className="font-mono text-xs text-muted-foreground">CAMERA</span>
            </div>
            <p className="font-mono text-sm">
              {camera === "checking" ? "Checking..." : camera === "ok" ? "OK" : "Blocked"}
            </p>
          </div>
          <div className="border border-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Mic className="w-4 h-4 text-primary" />
              <span className="font-mono text-xs text-muted-foreground">MIC</span>
            </div>
            <p className="font-mono text-sm">
              {mic === "checking" ? "Checking..." : mic === "ok" ? "OK" : "Blocked"}
            </p>
          </div>
          <div className="border border-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wifi className="w-4 h-4 text-primary" />
              <span className="font-mono text-xs text-muted-foreground">NETWORK</span>
            </div>
            <p className="font-mono text-sm">{network === "ok" ? "Online" : "Offline"}</p>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <CyberButton variant="outline" onClick={() => setLocation("/dashboard/candidate")}>BACK</CyberButton>
          <CyberButton disabled={!allOk} onClick={() => setLocation("/candidate/assessment/1/coding")}>START</CyberButton>
        </div>

        {!allOk && (
          <p className="text-xs font-mono text-yellow-500 mt-4">
            Camera/Mic must be allowed and network must be online.
          </p>
        )}
      </CyberCard>
    </div>
  );
}
