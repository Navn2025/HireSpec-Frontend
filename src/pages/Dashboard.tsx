import { useUser, useLogout } from "@/hooks/use-auth";
import { CyberCard } from "@/components/CyberCard";
import { CyberButton } from "@/components/CyberButton";
import { CyberInput } from "@/components/CyberInput";
import { Loader2, Shield, Activity, Database, LogOut, Camera, AlertTriangle } from "lucide-react";
import { useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import { useToast } from "@/hooks/use-toast";
import { api } from "@shared/routes";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiUrl } from "@/lib/api";

export default function Dashboard() {
  const { data: user, isLoading } = useUser();
  const logout = useLogout();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [password, setPassword] = useState("");
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [step, setStep] = useState<"password" | "capture">("password");
  const webcamRef = useRef<Webcam>(null);

  const resetFaceMutation = useMutation({
    mutationFn: async (data: { password: string; images: string[] }) => {
      const response = await fetch(apiUrl(api.resetFace), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to reset face data");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Face data has been reset successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/me"] });
      setShowResetDialog(false);
      setPassword("");
      setCapturedImages([]);
      setStep("password");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const captureImage = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc && capturedImages.length < 3) {
      setCapturedImages((prev) => [...prev, imageSrc]);
      if (capturedImages.length === 2) {
        // Auto submit after 3 images
        setTimeout(() => {
          resetFaceMutation.mutate({
            password,
            images: [...capturedImages, imageSrc],
          });
        }, 500);
      }
    }
  }, [capturedImages, password, resetFaceMutation]);

  const handlePasswordSubmit = () => {
    if (!password) {
      toast({
        title: "Error",
        description: "Please enter your password",
        variant: "destructive",
      });
      return;
    }
    setStep("capture");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-primary">
        <Loader2 className="w-12 h-12 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <CyberCard className="text-center">
          <h1 className="text-xl text-red-500 font-display mb-4">ACCESS DENIED</h1>
          <p className="text-muted-foreground mb-4">Session expired or invalid.</p>
          <CyberButton onClick={logout}>RETURN TO LOGIN</CyberButton>
        </CyberCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-6">
      <header className="flex justify-between items-center mb-12 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-display text-primary tracking-widest">MAINFRAME</h1>
          <p className="font-mono text-xs text-muted-foreground">SECURE TERMINAL // V.2.0.4</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
             <p className="font-mono text-sm text-primary">{user.username}</p>
             <p className="font-mono text-xs text-muted-foreground">LEVEL 5 CLEARANCE</p>
          </div>
          <div className="w-10 h-10 rounded bg-primary/20 border border-primary flex items-center justify-center font-display font-bold text-primary">
            {user.username[0].toUpperCase()}
          </div>
        </div>
      </header>

      <main className="grid md:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {/* Status Card */}
        <CyberCard glow="accent" className="md:col-span-1">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-lg">SYSTEM STATUS</h2>
            <Activity className="text-accent" />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between font-mono text-sm">
              <span className="text-muted-foreground">SERVER</span>
              <span className="text-green-500">ONLINE</span>
            </div>
            <div className="flex justify-between font-mono text-sm">
              <span className="text-muted-foreground">LATENCY</span>
              <span className="text-accent">12ms</span>
            </div>
            <div className="flex justify-between font-mono text-sm">
              <span className="text-muted-foreground">ENCRYPTION</span>
              <span className="text-primary">AES-256</span>
            </div>
            
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-xs font-mono text-muted-foreground mb-2">CPU LOAD</p>
              <div className="h-2 w-full bg-white/10 rounded overflow-hidden">
                <div className="h-full bg-accent w-[34%] relative">
                    <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-white shadow-[0_0_5px_white]" />
                </div>
              </div>
            </div>
          </div>
        </CyberCard>

        {/* Secure Data Mockup */}
        <CyberCard glow="primary" className="md:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-lg">SECURE DATA STREAM</h2>
            <Database className="text-primary" />
          </div>
          <div className="space-y-2 font-mono text-xs md:text-sm">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-4 p-2 hover:bg-white/5 transition-colors border-l-2 border-transparent hover:border-primary">
                <span className="text-muted-foreground">0{i}:24:12</span>
                <span className="text-primary">[INFO]</span>
                <span className="text-foreground/80">Biometric scan initiated for Sector 7...</span>
              </div>
            ))}
             <div className="flex gap-4 p-2 bg-primary/10 border-l-2 border-primary animate-pulse">
                <span className="text-muted-foreground">00:00:01</span>
                <span className="text-accent">[ALERT]</span>
                <span className="text-foreground">New login detected from device: TERMINAL_01</span>
              </div>
          </div>
        </CyberCard>

        {/* Identity Card */}
        <CyberCard className="md:col-span-3">
          <div className="flex items-center gap-4 mb-6">
            <Shield className="w-8 h-8 text-secondary" />
            <div>
              <h2 className="font-display text-xl">IDENTITY VERIFIED</h2>
              <p className="text-xs font-mono text-muted-foreground">SESSION ID: {Math.random().toString(36).substring(7).toUpperCase()}</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
                <p className="text-sm text-muted-foreground mb-4">
                    Your biometric data has been successfully authenticated against the central database. 
                    Access to classified materials is granted for this session.
                </p>
                <div className="flex gap-2 flex-wrap">
                    <span className="px-2 py-1 bg-primary/20 border border-primary/50 text-primary text-xs font-mono rounded">FACE_MATCH_99%</span>
                    <span className="px-2 py-1 bg-secondary/20 border border-secondary/50 text-secondary text-xs font-mono rounded">LIVENESS_CONFIRMED</span>
                </div>
            </div>
            <div className="flex justify-end items-end gap-2">
                <CyberButton 
                  variant="outline" 
                  onClick={() => setShowResetDialog(true)} 
                  className="gap-2"
                >
                    <Camera className="w-4 h-4" /> RESET BIOMETRICS
                </CyberButton>
                <CyberButton variant="secondary" onClick={logout} className="gap-2">
                    <LogOut className="w-4 h-4" /> TERMINATE SESSION
                </CyberButton>
            </div>
          </div>
        </CyberCard>
      </main>

      {/* Reset Face Data Dialog */}
      {showResetDialog && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <CyberCard className="max-w-lg w-full">
            <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-500" />
              <div>
                <h2 className="font-display text-xl">RESET BIOMETRIC DATA</h2>
                <p className="text-xs font-mono text-muted-foreground">RE-AUTHENTICATION REQUIRED</p>
              </div>
            </div>

            {step === "password" ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Please verify your identity by entering your password before resetting your face data.
                </p>
                <CyberInput
                  type="password"
                  label="Password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handlePasswordSubmit()}
                />
                <div className="flex gap-2">
                  <CyberButton
                    variant="outline"
                    onClick={() => {
                      setShowResetDialog(false);
                      setPassword("");
                    }}
                    className="flex-1"
                  >
                    CANCEL
                  </CyberButton>
                  <CyberButton onClick={handlePasswordSubmit} className="flex-1">
                    VERIFY & CONTINUE
                  </CyberButton>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    className="w-full h-full object-cover"
                    videoConstraints={{ facingMode: "user" }}
                  />
                </div>
                
                <div className="flex gap-2 justify-center">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className={`w-16 h-16 rounded border-2 ${
                        i < capturedImages.length
                          ? "border-primary bg-primary/20"
                          : "border-white/20 bg-white/5"
                      } flex items-center justify-center font-mono text-xs`}
                    >
                      {i < capturedImages.length ? "✓" : i + 1}
                    </div>
                  ))}
                </div>

                <p className="text-xs text-center text-muted-foreground">
                  Capture 3 images from different angles ({capturedImages.length}/3)
                </p>

                <div className="flex gap-2">
                  <CyberButton
                    variant="outline"
                    onClick={() => {
                      setStep("password");
                      setCapturedImages([]);
                    }}
                    className="flex-1"
                    disabled={resetFaceMutation.isPending}
                  >
                    BACK
                  </CyberButton>
                  <CyberButton
                    onClick={captureImage}
                    className="flex-1"
                    disabled={capturedImages.length >= 3 || resetFaceMutation.isPending}
                    isLoading={resetFaceMutation.isPending}
                  >
                    {resetFaceMutation.isPending ? "PROCESSING..." : "CAPTURE"}
                  </CyberButton>
                </div>
              </div>
            )}
          </CyberCard>
        </div>
      )}
    </div>
  );
}
