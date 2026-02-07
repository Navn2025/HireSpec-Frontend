import { Link } from "wouter";
import { motion } from "framer-motion";
import { CyberButton } from "@/components/CyberButton";
import { ShieldCheck, ArrowRight } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.05)_0%,rgba(0,0,0,0)_100%)] pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center z-10 max-w-2xl w-full px-4"
      >
        <div className="mb-8 flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-white shadow-xl flex items-center justify-center border border-slate-100">
            <ShieldCheck className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6 tracking-tight">
          Professional <span className="text-blue-600">Identity</span>
        </h1>
        <p className="text-lg text-slate-600 mb-12 max-w-md mx-auto leading-relaxed">
          The next generation of biometric authentication for modern enterprise security.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
          <Link href="/login" className="w-full">
            <CyberButton className="w-full h-12 text-base">
              Get Started <ArrowRight className="ml-2 w-4 h-4" />
            </CyberButton>
          </Link>
          <Link href="/register" className="w-full">
            <CyberButton variant="outline" className="w-full h-12 text-base">
              Create Account
            </CyberButton>
          </Link>
        </div>

        <div className="mt-24 pt-8 border-t border-slate-200 flex items-center justify-center gap-8 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            System Secure
          </div>
          <div>AES-256 Bit Encryption</div>
        </div>
      </motion.div>
    </div>
  );
}
