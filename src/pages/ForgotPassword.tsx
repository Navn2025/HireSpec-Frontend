import { useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForgotPassword, useVerifyOtp, useResetPassword } from "@/hooks/use-auth";
import { CyberButton } from "@/components/CyberButton";
import { CyberInput } from "@/components/CyberInput";
import { CyberCard } from "@/components/CyberCard";
import { ArrowLeft, Mail, KeyRound, ShieldCheck, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const STEPS = { EMAIL: 0, OTP: 1, NEW_PASSWORD: 2 };

const resetSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Please confirm your password"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export default function ForgotPassword() {
  const [step, setStep] = useState(STEPS.EMAIL);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  const { mutate: forgotPassword, isPending: isSending } = useForgotPassword();
  const { mutate: verifyOtp, isPending: isVerifying } = useVerifyOtp();
  const { mutate: resetPassword, isPending: isResetting } = useResetPassword();

  const form = useForm<z.infer<typeof resetSchema>>({
    resolver: zodResolver(resetSchema),
  });

  const handleSendOtp = () => {
    if (!email) return;
    forgotPassword(
      { email },
      { onSuccess: () => setStep(STEPS.OTP) }
    );
  };

  const handleVerifyOtp = () => {
    if (!otp) return;
    verifyOtp(
      { email, otp, purpose: "forgot_password" },
      {
        onSuccess: (data) => {
          if (data.verified) setStep(STEPS.NEW_PASSWORD);
        },
      }
    );
  };

  const handleResetPassword = (data: z.infer<typeof resetSchema>) => {
    resetPassword({
      email,
      password: data.password,
      confirmPassword: data.confirmPassword,
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg mb-2">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Password Recovery</h1>
          <p className="text-sm text-slate-500">Reset your account password</p>
        </div>

        <AnimatePresence mode="wait">
          {/* ── Step 0: Email ───────────────────────────────────── */}
          {step === STEPS.EMAIL && (
            <motion.div
              key="email"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <CyberCard className="shadow-2xl border-slate-200">
                <div className="flex flex-col items-center mb-6">
                  <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center mb-4">
                    <Mail className="w-6 h-6 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold">Enter your email</h2>
                  <p className="text-sm text-slate-500 text-center">
                    We'll send a verification code to your registered email address.
                  </p>
                </div>

                <div className="space-y-4">
                  <CyberInput
                    label="Email Address"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <CyberButton
                    onClick={handleSendOtp}
                    className="w-full h-11"
                    isLoading={isSending}
                    disabled={!email}
                  >
                    Send Reset Code
                  </CyberButton>
                </div>
              </CyberCard>
            </motion.div>
          )}

          {/* ── Step 1: OTP ─────────────────────────────────────── */}
          {step === STEPS.OTP && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <CyberCard className="shadow-2xl border-slate-200">
                <div className="flex flex-col items-center mb-6">
                  <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center mb-4">
                    <KeyRound className="w-6 h-6 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold">Verify Code</h2>
                  <p className="text-sm text-slate-500 text-center">
                    Enter the 6-digit code sent to{" "}
                    <span className="font-semibold text-slate-700">{email}</span>
                  </p>
                </div>

                <div className="space-y-4">
                  <CyberInput
                    label="Verification Code"
                    placeholder="000000"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  />
                  <CyberButton
                    onClick={handleVerifyOtp}
                    className="w-full h-11"
                    isLoading={isVerifying}
                    disabled={otp.length !== 6}
                  >
                    Verify Code
                  </CyberButton>
                </div>

                <button
                  onClick={() => {
                    setOtp("");
                    handleSendOtp();
                  }}
                  className="block w-full text-center mt-4 text-xs text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Resend code
                </button>
              </CyberCard>
            </motion.div>
          )}

          {/* ── Step 2: New Password ───────────────────────────── */}
          {step === STEPS.NEW_PASSWORD && (
            <motion.div
              key="newpw"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <CyberCard className="shadow-2xl border-slate-200">
                <div className="flex flex-col items-center mb-6">
                  <div className="w-12 h-12 rounded-full bg-green-50 border border-green-100 flex items-center justify-center mb-4">
                    <Lock className="w-6 h-6 text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold">Set New Password</h2>
                  <p className="text-sm text-slate-500 text-center">
                    Choose a strong password for your account.
                  </p>
                </div>

                <form onSubmit={form.handleSubmit(handleResetPassword)} className="space-y-4">
                  <CyberInput
                    label="New Password"
                    type="password"
                    placeholder="••••••••"
                    {...form.register("password")}
                  />
                  {form.formState.errors.password && (
                    <p className="text-xs text-red-500 -mt-2">{form.formState.errors.password.message}</p>
                  )}

                  <CyberInput
                    label="Confirm New Password"
                    type="password"
                    placeholder="••••••••"
                    {...form.register("confirmPassword")}
                  />
                  {form.formState.errors.confirmPassword && (
                    <p className="text-xs text-red-500 -mt-2">{form.formState.errors.confirmPassword.message}</p>
                  )}

                  <CyberButton type="submit" className="w-full h-11" isLoading={isResetting}>
                    Reset Password
                  </CyberButton>
                </form>
              </CyberCard>
            </motion.div>
          )}
        </AnimatePresence>

        <Link
          href="/login"
          className="mt-8 inline-flex items-center gap-2 text-slate-400 hover:text-slate-600 text-xs font-medium transition-colors w-full justify-center"
        >
          <ArrowLeft className="w-3 h-3" /> Back to login
        </Link>
      </div>
    </div>
  );
}
