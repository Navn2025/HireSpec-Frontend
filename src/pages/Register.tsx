import { useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRegister, useSendOtp, useVerifyOtp } from "@/hooks/use-auth";
import { CyberButton } from "@/components/CyberButton";
import { CyberInput } from "@/components/CyberInput";
import { CyberCard } from "@/components/CyberCard";
import { ScannerOverlay } from "@/components/ScannerOverlay";
import { Check, Camera, ShieldCheck, Mail, KeyRound, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type UserRole = "candidate" | "company_admin" | "company_hr";

const ROLE_OPTIONS: { value: UserRole; label: string; description: string }[] = [
  { value: "candidate", label: "Candidate", description: "Job seeker looking for opportunities" },
  { value: "company_admin", label: "Company Admin", description: "Manage company and HR access" },
  { value: "company_hr", label: "Company HR", description: "Manage hiring on behalf of company" },
];

const STEPS = {
  INFO: 0,
  EMAIL: 1,
  OTP: 2,
  CENTER: 3,
  LEFT: 4,
  RIGHT: 5,
  FORM: 6,
};

const registerSchema = z
  .object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Please confirm your password"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export default function Register() {
  const [step, setStep] = useState(STEPS.INFO);
  const [images, setImages] = useState<string[]>([]);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [role, setRole] = useState<UserRole>("candidate");
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const webcamRef = useRef<Webcam>(null);

  const { mutate: register, isPending } = useRegister();
  const { mutate: sendOtp, isPending: isSendingOtp } = useSendOtp();
  const { mutate: verifyOtp, isPending: isVerifyingOtp } = useVerifyOtp();

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
  });

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setImages((prev) => [...prev, imageSrc]);
      setStep((prev) => prev + 1);
    }
  }, []);

  const handleSendOtp = () => {
    if (!email) return;
    sendOtp(
      { email, purpose: "register" },
      { onSuccess: () => setStep(STEPS.OTP) }
    );
  };

  const handleVerifyOtp = () => {
    if (!otp) return;
    verifyOtp(
      { email, otp, purpose: "register" },
      {
        onSuccess: (data) => {
          if (data.verified) {
            setEmailVerified(true);
            setStep(STEPS.CENTER);
          }
        },
      }
    );
  };

  const onFinalSubmit = (data: z.infer<typeof registerSchema>) => {
    if (images.length < 3 || !emailVerified) return;
    register({
      username: data.username,
      email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      images,
      role,
    });
  };

  const renderCameraStep = (title: string, instruction: string) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-xl mx-auto"
    >
      <CyberCard className="p-0 overflow-hidden border-slate-200 shadow-2xl">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{title}</h2>
            <p className="text-sm text-slate-500">{instruction}</p>
          </div>
          <div className="flex gap-1.5">
            {[STEPS.CENTER, STEPS.LEFT, STEPS.RIGHT].map((s) => (
              <div
                key={s}
                className={`w-2 h-2 rounded-full ${step >= s ? "bg-blue-600" : "bg-slate-200"}`}
              />
            ))}
          </div>
        </div>

        <div className="relative aspect-video bg-slate-900">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            className="w-full h-full object-cover"
            videoConstraints={{ facingMode: "user" }}
          />
          <ScannerOverlay scanning={true} message="POSITIONS DETECTED" />
        </div>

        <div className="p-6 bg-slate-50">
          <CyberButton onClick={capture} className="w-full h-12 shadow-md">
            <Camera className="mr-2 w-4 h-4" /> Capture Profile
          </CyberButton>
        </div>
      </CyberCard>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-4">
      <div className="flex-1 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {/* ── Step 0: Info ─────────────────────────────────────── */}
          {step === STEPS.INFO && (
            <motion.div
              key="info"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-md mx-auto w-full"
            >
              <div className="text-center mb-8">
                <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg mx-auto mb-4">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900">Onboarding</h1>
                <p className="text-sm text-slate-500">Create your biometric identity</p>
              </div>

              <CyberCard className="border-slate-200 shadow-xl">
                <h3 className="text-lg font-bold mb-4">Biometric Enrollment</h3>
                <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                  We need to verify your email and map your facial vectors from three angles
                  to ensure the highest level of security.
                </p>

                {/* Role Selection Dropdown */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Register as</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                      className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 hover:border-blue-300 transition-colors text-left"
                    >
                      <div>
                        <span className="text-sm font-medium text-slate-900">
                          {ROLE_OPTIONS.find(r => r.value === role)?.label}
                        </span>
                        <span className="block text-xs text-slate-500">
                          {ROLE_OPTIONS.find(r => r.value === role)?.description}
                        </span>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isRoleDropdownOpen ? "rotate-180" : ""}`} />
                    </button>
                    
                    {isRoleDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
                        {ROLE_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              setRole(option.value);
                              setIsRoleDropdownOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 p-3 text-left hover:bg-slate-50 transition-colors ${
                              role === option.value ? "bg-blue-50 border-l-2 border-blue-600" : ""
                            }`}
                          >
                            <div>
                              <span className="text-sm font-medium text-slate-900">{option.label}</span>
                              <span className="block text-xs text-slate-500">{option.description}</span>
                            </div>
                            {role === option.value && (
                              <Check className="w-4 h-4 text-blue-600 ml-auto" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3 mb-8">
                  {[
                    "Email verification via OTP",
                    "Standard facing scan",
                    "Left profile capture",
                    "Right profile capture",
                  ].map((text, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100"
                    >
                      <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center text-blue-600 text-xs font-bold border border-blue-100">
                        {i + 1}
                      </div>
                      <span className="text-sm font-medium text-slate-600">{text}</span>
                    </div>
                  ))}
                </div>

                <CyberButton onClick={() => setStep(STEPS.EMAIL)} className="w-full h-11">
                  Start Process
                </CyberButton>
                <Link
                  href="/"
                  className="block text-center mt-4 text-xs text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Cancel registration
                </Link>
              </CyberCard>
            </motion.div>
          )}

          {/* ── Step 1: Email ────────────────────────────────────── */}
          {step === STEPS.EMAIL && (
            <motion.div
              key="email"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-md mx-auto w-full"
            >
              <CyberCard className="border-slate-200 shadow-2xl">
                <div className="flex flex-col items-center mb-6">
                  <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center mb-4">
                    <Mail className="w-6 h-6 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold">Email Verification</h2>
                  <p className="text-sm text-slate-500">We'll send a one-time code to verify your email</p>
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
                    isLoading={isSendingOtp}
                    disabled={!email}
                  >
                    Send Verification Code
                  </CyberButton>
                </div>

                <button
                  onClick={() => setStep(STEPS.INFO)}
                  className="block w-full text-center mt-4 text-xs text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Go back
                </button>
              </CyberCard>
            </motion.div>
          )}

          {/* ── Step 2: OTP ──────────────────────────────────────── */}
          {step === STEPS.OTP && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-md mx-auto w-full"
            >
              <CyberCard className="border-slate-200 shadow-2xl">
                <div className="flex flex-col items-center mb-6">
                  <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center mb-4">
                    <KeyRound className="w-6 h-6 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold">Enter OTP</h2>
                  <p className="text-sm text-slate-500">
                    A 6-digit code was sent to <span className="font-semibold text-slate-700">{email}</span>
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
                    isLoading={isVerifyingOtp}
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

          {/* ── Steps 3-5: Camera ────────────────────────────────── */}
          {step === STEPS.CENTER && renderCameraStep("Primary Angle", "Look directly into the camera")}
          {step === STEPS.LEFT && renderCameraStep("Depth Mapping", "Turn your head slightly to the left")}
          {step === STEPS.RIGHT && renderCameraStep("Depth Mapping", "Turn your head slightly to the right")}

          {/* ── Step 6: Final Form ───────────────────────────────── */}
          {step === STEPS.FORM && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-md mx-auto w-full"
            >
              <CyberCard className="border-slate-200 shadow-2xl">
                <div className="flex flex-col items-center mb-8">
                  <div className="w-12 h-12 rounded-full bg-green-50 border border-green-100 flex items-center justify-center mb-4">
                    <Check className="w-6 h-6 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold">Face Captured</h2>
                  <p className="text-sm text-slate-500">Finalize your account details</p>
                </div>

                <div className="flex gap-2 mb-4 justify-center">
                  {images.map((img, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={img}
                        className="w-16 h-16 object-cover rounded-lg border-2 border-slate-100"
                        alt="scan"
                      />
                      <div className="absolute inset-0 bg-blue-600/10 rounded-lg" />
                    </div>
                  ))}
                </div>

                {/* Verified email badge */}
                <div className="flex items-center gap-2 mb-6 p-3 rounded-lg bg-green-50 border border-green-100">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-700 font-medium">{email}</span>
                  <span className="text-xs text-green-500 ml-auto">Verified</span>
                </div>

                <form onSubmit={form.handleSubmit(onFinalSubmit)} className="space-y-4">
                  <CyberInput
                    label="Username"
                    placeholder="e.g. jdoe"
                    {...form.register("username")}
                  />
                  {form.formState.errors.username && (
                    <p className="text-xs text-red-500 -mt-2">{form.formState.errors.username.message}</p>
                  )}

                  <CyberInput
                    label="Password"
                    type="password"
                    placeholder="••••••••"
                    {...form.register("password")}
                  />
                  {form.formState.errors.password && (
                    <p className="text-xs text-red-500 -mt-2">{form.formState.errors.password.message}</p>
                  )}

                  <CyberInput
                    label="Confirm Password"
                    type="password"
                    placeholder="••••••••"
                    {...form.register("confirmPassword")}
                  />
                  {form.formState.errors.confirmPassword && (
                    <p className="text-xs text-red-500 -mt-2">{form.formState.errors.confirmPassword.message}</p>
                  )}

                  <CyberButton type="submit" className="w-full mt-2 h-11" isLoading={isPending}>
                    Complete Identity
                  </CyberButton>
                </form>
              </CyberCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
