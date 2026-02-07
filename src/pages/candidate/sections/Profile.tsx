import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  User,
  Mail,
  ScanFace,
  Briefcase,
  FileCheck2,
  TrendingUp,
  ArrowRight,
  Calendar,
  Star,
  Shield,
  Zap,
  Target,
  Upload,
  FileText,
  Download,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import PortalLayout from "@/components/PortalLayout";
import { useUser } from "@/hooks/use-auth";
import { CANDIDATE_NAV } from "../candidateNav";
import { apiUrl } from "@/lib/api";
import { Link } from "wouter";

type ApplicationsResponse = {
  applications: Array<{ id: number; status: string; job_title?: string | null }>;
};

type ResumeInfo = {
  filename: string;
  original_name: string;
  uploaded_at: string;
} | null;

export default function CandidateProfileSection() {
  const { data: user } = useUser();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Resume info query
  const { data: resumeData } = useQuery({
    queryKey: ["/api/candidate/resume"],
    queryFn: async () => {
      const res = await fetch(apiUrl("/api/candidate/resume"), { credentials: "include" });
      if (!res.ok) return { resume: null };
      return (await res.json()) as { resume: ResumeInfo };
    },
  });

  const resume = resumeData?.resume ?? null;

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("resume", file);
      const res = await fetch(apiUrl("/api/candidate/resume"), {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Upload failed");
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/candidate/resume"] });
      setUploadError(null);
    },
    onError: (err: Error) => {
      setUploadError(err.message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(apiUrl("/api/candidate/resume"), {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/candidate/resume"] });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "doc", "docx"].includes(ext || "")) {
      setUploadError("Only PDF, DOC, DOCX files are allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File size must be under 5 MB");
      return;
    }
    uploadMutation.mutate(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const { data: appsData } = useQuery({
    queryKey: ["/api/candidate/applications"],
    queryFn: async () => {
      const res = await fetch(apiUrl("/api/candidate/applications"), { credentials: "include" });
      if (!res.ok) return { applications: [] };
      return (await res.json()) as ApplicationsResponse;
    },
  });

  const apps = appsData?.applications ?? [];

  const completionItems = [
    { label: "Username", done: !!user?.username },
    { label: "Email", done: !!user?.email },
    { label: "Face ID", done: !!(user as any)?.faceEmbedding },
    { label: "Resume", done: !!resume },
  ];
  const completion = Math.round(
    (completionItems.filter((c) => c.done).length / completionItems.length) * 100
  );

  const stats = [
    {
      label: "Applications",
      value: apps.length,
      icon: <Briefcase className="w-4 h-4" />,
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
    },
    {
      label: "In Review",
      value: apps.filter((a) => a.status === "submitted" || a.status === "pending").length,
      icon: <FileCheck2 className="w-4 h-4" />,
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
    },
    {
      label: "Interviews",
      value: apps.filter((a) => a.status === "interview").length,
      icon: <Target className="w-4 h-4" />,
      color: "text-purple-400",
      bg: "bg-purple-500/10 border-purple-500/20",
    },
    {
      label: "Completion",
      value: `${completion}%`,
      icon: <TrendingUp className="w-4 h-4" />,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
    },
  ];

  const quickActions = [
    {
      title: "Browse Open Positions",
      desc: "Discover roles matching your skills and apply instantly",
      href: "/dashboard/candidate/jobs",
      icon: <Briefcase className="w-5 h-5" />,
      gradient: "from-blue-500/20 to-blue-600/5",
    },
    {
      title: "AI Mock Interview",
      desc: "Prepare with our AI-powered proctored interview simulator",
      href: "/dashboard/candidate/ai-interview",
      icon: <Zap className="w-5 h-5" />,
      gradient: "from-purple-500/20 to-purple-600/5",
    },
    {
      title: "Practice Coding",
      desc: "Sharpen your skills with curated practice questions",
      href: "/dashboard/candidate/practice",
      icon: <Star className="w-5 h-5" />,
      gradient: "from-amber-500/20 to-amber-600/5",
    },
    {
      title: "Track Applications",
      desc: "Monitor the status of your job applications in real-time",
      href: "/dashboard/candidate/track",
      icon: <Target className="w-5 h-5" />,
      gradient: "from-emerald-500/20 to-emerald-600/5",
    },
  ];

  return (
    <PortalLayout
      title="CANDIDATE PORTAL"
      subtitle="DASHBOARD // V2.0"
      roleLabel="CANDIDATE"
      nav={CANDIDATE_NAV}
    >
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-xl border border-white/5 bg-gradient-to-r from-primary/10 via-accent/5 to-transparent p-6">
          <div className="relative z-10">
            <p className="font-mono text-[10px] text-primary/60 tracking-widest mb-1">WELCOME BACK</p>
            <h2 className="font-display text-2xl text-foreground tracking-wide">
              {user?.username || "Candidate"}
            </h2>
            <p className="font-mono text-xs text-muted-foreground mt-1 max-w-md">
              Your career dashboard is ready. Complete your profile, browse jobs, and ace your next interview.
            </p>
          </div>
          <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-[0.03]">
            <User className="w-32 h-32" />
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className={`rounded-xl border ${s.bg} p-4 flex items-center gap-3`}
            >
              <div className={`w-9 h-9 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center ${s.color}`}>
                {s.icon}
              </div>
              <div>
                <p className="font-display text-xl leading-none text-foreground">{s.value}</p>
                <p className="font-mono text-[10px] text-muted-foreground tracking-wider mt-0.5">{s.label.toUpperCase()}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/30 to-accent/20 border border-primary/40 flex items-center justify-center">
                <span className="font-display text-xl text-primary">{user?.username?.[0]?.toUpperCase() || "?"}</span>
              </div>
              <div>
                <p className="font-display text-base text-foreground">{user?.username}</p>
                <p className="font-mono text-[11px] text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            <div className="space-y-3 mb-5">
              <div className="flex items-center gap-3 text-xs font-mono">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-muted-foreground flex-1">Username</span>
                <span className="text-foreground">{user?.username || "—"}</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-muted-foreground flex-1">Email</span>
                <span className="text-foreground truncate max-w-[140px]">{user?.email || "—"}</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <ScanFace className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-muted-foreground flex-1">Face ID</span>
                <span className={(user as any)?.faceEmbedding ? "text-emerald-400" : "text-amber-400"}>
                  {(user as any)?.faceEmbedding ? "Verified" : "Not Set"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <Shield className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-muted-foreground flex-1">Role</span>
                <span className="text-secondary">Candidate</span>
              </div>
            </div>

            {/* Resume */}
            <div className="border-t border-white/5 pt-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <p className="font-mono text-[10px] text-muted-foreground tracking-wider">RESUME</p>
                {resume && (
                  <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" /> Uploaded
                  </span>
                )}
              </div>

              {resume ? (
                <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs text-foreground truncate">{resume.original_name}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">
                        {resume.uploaded_at ? new Date(resume.uploaded_at).toLocaleDateString() : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <a
                      href={apiUrl("/api/candidate/resume/download")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/10 font-mono text-[10px] text-muted-foreground hover:text-foreground hover:border-white/20 transition-all"
                    >
                      <Download className="w-3 h-3" /> Download
                    </a>
                    <button
                      onClick={() => { fileInputRef.current?.click(); }}
                      disabled={uploadMutation.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/10 font-mono text-[10px] text-muted-foreground hover:text-foreground hover:border-white/20 transition-all disabled:opacity-50"
                    >
                      <Upload className="w-3 h-3" /> Replace
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate()}
                      disabled={deleteMutation.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/5 border border-red-500/20 font-mono text-[10px] text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
                    >
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadMutation.isPending}
                  className="w-full rounded-lg border border-dashed border-white/10 hover:border-primary/30 bg-white/[0.01] hover:bg-primary/[0.03] p-5 transition-all duration-200 group disabled:opacity-50"
                >
                  <div className="flex flex-col items-center gap-2">
                    {uploadMutation.isPending ? (
                      <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    ) : (
                      <Upload className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                    )}
                    <div className="text-center">
                      <p className="font-mono text-xs text-foreground group-hover:text-primary transition-colors">
                        {uploadMutation.isPending ? "Uploading..." : "Upload Resume"}
                      </p>
                      <p className="font-mono text-[10px] text-muted-foreground mt-0.5">PDF, DOC, DOCX · Max 5 MB</p>
                    </div>
                  </div>
                </button>
              )}

              {uploadError && (
                <div className="flex items-center gap-1.5 mt-2 text-[10px] font-mono text-red-400">
                  <AlertCircle className="w-3 h-3" /> {uploadError}
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Profile completion */}
            <div className="border-t border-white/5 pt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="font-mono text-[10px] text-muted-foreground tracking-wider">PROFILE COMPLETION</p>
                <p className="font-mono text-xs text-primary">{completion}%</p>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-700"
                  style={{ width: `${completion}%` }}
                />
              </div>
              <div className="mt-3 space-y-1.5">
                {completionItems.map((ci) => (
                  <div key={ci.label} className="flex items-center gap-2 text-[11px] font-mono">
                    <div
                      className={
                        "w-3.5 h-3.5 rounded-full border flex items-center justify-center " +
                        (ci.done ? "border-emerald-500/50 bg-emerald-500/20" : "border-white/10 bg-white/5")
                      }
                    >
                      {ci.done && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                    </div>
                    <span className={ci.done ? "text-muted-foreground line-through" : "text-foreground"}>{ci.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="lg:col-span-2 space-y-3">
            <p className="font-mono text-[10px] text-muted-foreground tracking-widest mb-1">QUICK ACTIONS</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {quickActions.map((action) => (
                <Link key={action.href} href={action.href}>
                  <a className={`group block rounded-xl border border-white/5 bg-gradient-to-br ${action.gradient} p-4 hover:border-white/10 transition-all duration-200`}>
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-foreground shrink-0 group-hover:border-white/10 transition-colors">
                        {action.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-sm text-foreground group-hover:text-primary transition-colors">{action.title}</p>
                        <p className="font-mono text-[11px] text-muted-foreground leading-relaxed mt-0.5">{action.desc}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all mt-1 -translate-x-1 group-hover:translate-x-0" />
                    </div>
                  </a>
                </Link>
              ))}
            </div>

            {/* Recent Activity */}
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5 mt-4">
              <div className="flex items-center justify-between mb-4">
                <p className="font-mono text-[10px] text-muted-foreground tracking-widest">RECENT ACTIVITY</p>
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              {apps.length === 0 ? (
                <div className="text-center py-6">
                  <p className="font-mono text-xs text-muted-foreground">No recent activity</p>
                  <p className="font-mono text-[10px] text-muted-foreground/60 mt-1">Apply to jobs to see your activity here</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {apps.slice(0, 5).map((a) => (
                    <div key={a.id} className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-white/[0.02] transition-colors">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                        <Briefcase className="w-3 h-3 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-xs text-foreground truncate">{a.job_title || `Application #${a.id}`}</p>
                        <p className="font-mono text-[10px] text-muted-foreground">
                          Status: <span className="text-secondary">{a.status}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
