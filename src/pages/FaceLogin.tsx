import { useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import { Link } from "wouter";
import { useFaceLogin } from "@/hooks/use-auth";
import { CyberButton } from "@/components/CyberButton";
import { ScannerOverlay } from "@/components/ScannerOverlay";
import { ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function FaceLogin() {
  const webcamRef = useRef<Webcam>(null);
  const { mutate: faceLogin, isPending, isError } = useFaceLogin();
  const [scanning, setScanning] = useState(false);

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
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative">
      <div className="w-full max-w-2xl relative z-10">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/login" className="flex items-center gap-2 text-muted-foreground hover:text-primary font-mono text-sm">
            <ArrowLeft className="w-4 h-4" /> MANUAL OVERRIDE
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="font-mono text-xs text-red-500">LIVE FEED</span>
          </div>
        </div>

        <div className="relative aspect-video bg-black border-2 border-primary/20 rounded-lg overflow-hidden shadow-[0_0_50px_-10px_hsl(var(--primary)/0.2)]">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            className="w-full h-full object-cover opacity-80"
            videoConstraints={{ facingMode: "user" }}
          />
          
          <ScannerOverlay 
            scanning={scanning || isPending} 
            status={isError ? "error" : scanning || isPending ? "scanning" : "idle"}
            message={isError ? "MATCH FAILED" : scanning || isPending ? "ANALYZING BIOMETRICS..." : "READY FOR SCAN"}
          />
        </div>

        <div className="mt-8 flex justify-center">
          <CyberButton 
            onClick={captureAndLogin} 
            disabled={scanning || isPending}
            className="w-full max-w-xs h-16 text-lg"
          >
            {isPending ? "PROCESSING..." : "INITIATE SCAN"}
          </CyberButton>
        </div>

        <div className="mt-4 text-center font-mono text-xs text-muted-foreground">
          <p>ENSURE FACE IS CENTERED AND WELL-LIT</p>
        </div>
      </div>

      {/* Background Grid */}
      <div className="fixed inset-0 pointer-events-none opacity-20" 
           style={{ backgroundImage: 'linear-gradient(rgba(0, 240, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 240, 255, 0.1) 1px, transparent 1px)', backgroundSize: '50px 50px' }} 
      />
    </div>
  );
}
