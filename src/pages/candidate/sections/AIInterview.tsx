import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Bot,
  Video,
  MonitorCheck,
  Play,
  ShieldCheck,
  Camera,
  AlertTriangle,
  Wifi,
  Clock,
  CheckCircle2,
  XCircle,
  Timer,
  Loader2,
  Expand,
  Ban,
  Copy,
} from "lucide-react";
import PortalLayout from "@/components/PortalLayout";
import { apiUrl } from "@/lib/api";
import { CANDIDATE_NAV } from "../candidateNav";

type CandidateAssessmentsResponse = {
  assessments: Array<{ id: number; status: string; created_at: string; job_title: string | null }>;
};

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pending: { label: "Pending", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30", icon: <Clock className="w-3 h-3" /> },
  in_progress: { label: "In Progress", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30", icon: <Timer className="w-3 h-3" /> },
  completed: { label: "Completed", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", icon: <CheckCircle2 className="w-3 h-3" /> },
  failed: { label: "Failed", color: "text-red-400", bg: "bg-red-500/10 border-red-500/30", icon: <XCircle className="w-3 h-3" /> },
};

const guidelines = [
  { icon: <Expand className="w-4 h-4" />, title: "Full-Screen Mode", desc: "Enter full-screen when prompted. Exiting may be flagged." },
  { icon: <Camera className="w-4 h-4" />, title: "Camera Required", desc: "Keep your webcam active throughout the entire session." },
  { icon: <Ban className="w-4 h-4" />, title: "No Tab Switching", desc: "Stay on the assessment tab. Switching will be logged." },
  { icon: <Copy className="w-4 h-4" />, title: "No Copy / Paste", desc: "Clipboard access is disabled during the assessment." },
  { icon: <Wifi className="w-4 h-4" />, title: "Stable Connection", desc: "Use a reliable internet connection to avoid disruptions." },
  { icon: <ShieldCheck className="w-4 h-4" />, title: "AI Proctored", desc: "Your session is monitored by AI for integrity verification." },
];

export default function CandidateAIInterviewSection() {
  const { data, isLoading } = useQuery({
    queryKey: ["/api/candidate/assessments"],
    queryFn: async () => {
      const res = await fetch(apiUrl("/api/candidate/assessments"), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load assessments");
      return (await res.json()) as CandidateAssessmentsResponse;
    },
  });

  const assessments = data?.assessments ?? [];

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    return `${Math.floor(days / 7)}w ago`;
  };

  return (
    <PortalLayout
      title="CANDIDATE PORTAL"
      subtitle="AI INTERVIEW // PROCTORED"
      roleLabel="CANDIDATE"
      nav={CANDIDATE_NAV}
    >
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="relative overflow-hidden rounded-xl border border-purple-500/10 bg-gradient-to-r from-purple-500/10 via-blue-500/5 to-transparent p-6">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Video className="w-5 h-5 text-purple-400" />
              <p className="font-mono text-[10px] text-purple-400/80 tracking-widest">AI-POWERED ASSESSMENT</p>
            </div>
            <h2 className="font-display text-xl text-foreground">Interview Center</h2>
            <p className="font-mono text-xs text-muted-foreground mt-1 max-w-lg">
              Complete proctored assessments assigned by hiring teams. Each session is monitored for fairness and integrity.
            </p>
          </div>
          <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-[0.03]">
            <Bot className="w-28 h-28" />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Assessments List */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[10px] text-muted-foreground tracking-widest">
                ASSIGNED ASSESSMENTS ({assessments.length})
              </p>
              <Link href="/candidate/lobby">
                <a className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/10 font-mono text-[10px] text-muted-foreground hover:text-foreground hover:border-white/20 transition-all">
                  <MonitorCheck className="w-3 h-3" /> System Check
                </a>
              </Link>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : assessments.length === 0 ? (
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-12 text-center">
                <Video className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="font-display text-sm text-foreground">No assessments assigned</p>
                <p className="font-mono text-[11px] text-muted-foreground mt-1">When a hiring team invites you, assessments will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {assessments.map((a) => {
                  const cfg = statusConfig[a.status] || statusConfig.pending;
                  const canStart = a.status === "pending" || a.status === "in_progress";
                  return (
                    <div
                      key={a.id}
                      className="rounded-xl border border-white/5 bg-white/[0.02] p-5 hover:border-white/10 transition-all"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                            <Bot className="w-4 h-4 text-purple-400" />
                          </div>
                          <div>
                            <h3 className="font-display text-sm text-foreground">
                              {a.job_title || `Assessment #${a.id}`}
                            </h3>
                            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-mono ${cfg.color} ${cfg.bg}`}>
                                {cfg.icon} {cfg.label}
                              </span>
                              <span className="font-mono text-[10px] text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {timeAgo(a.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {canStart && (
                          <div className="flex items-center gap-2 shrink-0">
                            <Link href={`/candidate/assessment/${a.id}/coding`}>
                              <a className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 font-mono text-xs text-muted-foreground hover:text-foreground hover:border-white/20 transition-all">
                                Coding
                              </a>
                            </Link>
                            <Link href={`/candidate/assessment/${a.id}/interview`}>
                              <a className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary font-mono text-xs hover:bg-primary/20 transition-all">
                                <Play className="w-3.5 h-3.5" /> Start Interview
                              </a>
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Guidelines Sidebar */}
          <div className="space-y-3">
            <p className="font-mono text-[10px] text-muted-foreground tracking-widest">ASSESSMENT GUIDELINES</p>
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-3">
              {guidelines.map((g, i) => (
                <div key={i} className="flex items-start gap-3 group">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-center text-muted-foreground group-hover:text-foreground group-hover:border-white/10 transition-colors shrink-0">
                    {g.icon}
                  </div>
                  <div>
                    <p className="font-mono text-xs text-foreground">{g.title}</p>
                    <p className="font-mono text-[10px] text-muted-foreground leading-relaxed">{g.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Readiness Check */}
            <div className="rounded-xl border border-amber-500/10 bg-amber-500/[0.03] p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <p className="font-mono text-xs text-amber-400">Before You Start</p>
              </div>
              <p className="font-mono text-[10px] text-muted-foreground leading-relaxed">
                Run the System Check to verify your camera, microphone, and browser compatibility before starting any assessment.
              </p>
              <Link href="/candidate/lobby">
                <a className="mt-3 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 font-mono text-[10px] text-amber-400 hover:bg-amber-500/20 transition-all w-fit">
                  <MonitorCheck className="w-3 h-3" /> Run System Check
                </a>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
