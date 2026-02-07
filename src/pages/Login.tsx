import { useState, useRef, useCallback } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Webcam from "react-webcam";
import { useLogin, useFaceLogin } from "@/hooks/use-auth";
import { CyberInput } from "@/components/CyberInput";
import { CyberButton } from "@/components/CyberButton";
import { CyberCard } from "@/components/CyberCard";
import { ScannerOverlay } from "@/components/ScannerOverlay";
import { ArrowLeft, KeyRound, ScanFace, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const loginSchema = z.object({
  username: z.string().min(1, "Username required"),
  password: z.string().min(1, "Password required"),
});

export default function Login() {
  const { mutate: login, isPending: isPasswordPending } = useLogin();
  const { mutate: faceLogin, isPending: isFacePending, isError: isFaceError } = useFaceLogin();
  const [method, setMethod] = useState<"password" | "face">("password");
  const [scanning, setScanning] = useState(false);
  const webcamRef = useRef<Webcam>(null);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: z.infer<typeof loginSchema>) => {
    login(data);
  };

  // Auto-scan face when switching to face method
  const captureAndLogin = useCallback(() => {
    setScanning(true);
    // Simulate scan delay for effect
    setTimeout(() => {
      const imageSrc = webcamRef.current?.getScreenshot();
      if (imageSrc) {
        faceLogin({ image: imageSrc });
      }
      setScanning(false);
    }, 1500);
  }, [faceLogin]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg mb-2">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Identity Hub</h1>
          <p className="text-sm text-slate-500">Secure biometric authentication</p>
        </div>

        <CyberCard className="shadow-2xl border-slate-200">
          <div className="flex p-1 bg-slate-100 rounded-lg mb-8">
            <button
              onClick={() => setMethod("password")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-all ${
                method === "password" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" /> PASSWORD
            </button>
            <button
              onClick={() => setMethod("face")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-all ${
                method === "face" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <ScanFace className="w-3.5 h-3.5" /> BIOMETRIC
            </button>
          </div>

          <AnimatePresence mode="wait">
            {method === "password" ? (
              <motion.div
                key="password"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <CyberInput
                    label="Username"
                    placeholder="Enter your username"
                    {...form.register("username")}
                  />
                  <CyberInput
                    label="Password"
                    type="password"
                    placeholder="••••••••"
                    {...form.register("password")}
                  />

                  <CyberButton 
                    type="submit" 
                    className="w-full mt-2" 
                    isLoading={isPasswordPending}
                  >
                    Continue
                  </CyberButton>

                  <div className="text-center mt-3">
                    <Link href="/forgot-password" className="text-xs text-blue-600 font-semibold hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="face"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden shadow-lg">
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    className="w-full h-full object-cover"
                    videoConstraints={{ facingMode: "user" }}
                  />
                  
                  <ScannerOverlay 
                    scanning={scanning || isFacePending} 
                    status={isFaceError ? "error" : scanning || isFacePending ? "scanning" : "idle"}
                    message={isFaceError ? "MATCH FAILED" : scanning || isFacePending ? "ANALYZING..." : "READY"}
                  />
                </div>

                <CyberButton 
                  onClick={captureAndLogin} 
                  disabled={scanning || isFacePending}
                  className="w-full"
                  isLoading={scanning || isFacePending}
                >
                  {scanning || isFacePending ? "SCANNING..." : "SCAN FACE"}
                </CyberButton>

                <p className="text-xs text-center text-slate-500">
                  Ensure your face is centered and well-lit
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">
              New here? <Link href="/register" className="text-blue-600 font-semibold hover:underline">Request access</Link>
            </p>
          </div>
        </CyberCard>
        
        <Link href="/" className="mt-8 inline-flex items-center gap-2 text-slate-400 hover:text-slate-600 text-xs font-medium transition-colors w-full justify-center">
          <ArrowLeft className="w-3 h-3" /> Back to start
        </Link>
      </div>
    </div>
  );
}
