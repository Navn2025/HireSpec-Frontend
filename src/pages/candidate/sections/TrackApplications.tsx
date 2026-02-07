import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ClipboardCheck,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Eye,
  Building2,
  Search,
  Filter,
  ArrowUpDown,
  Calendar,
  Loader2,
  Inbox,
  TrendingUp,
  Timer,
  FileCheck2,
} from "lucide-react";
import PortalLayout from "@/components/PortalLayout";
import { apiUrl } from "@/lib/api";
import { CANDIDATE_NAV } from "../candidateNav";

type ApplicationsResponse = {
  applications: Array<{
    id: number;
    status: string;
    created_at: string;
    job_id: number | null;
    job_title: string | null;
    company_name: string | null;
  }>;
};

type StatusKey = "submitted" | "pending" | "screening" | "interview" | "offer" | "rejected" | "accepted";

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode; step: number }> = {
  submitted: { label: "Submitted", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30", icon: <FileCheck2 className="w-3 h-3" />, step: 1 },
  pending: { label: "Pending", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30", icon: <Clock className="w-3 h-3" />, step: 1 },
  screening: { label: "Screening", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/30", icon: <Eye className="w-3 h-3" />, step: 2 },
  interview: { label: "Interview", color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/30", icon: <MessageSquare className="w-3 h-3" />, step: 3 },
  offer: { label: "Offer", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", icon: <CheckCircle2 className="w-3 h-3" />, step: 4 },
  accepted: { label: "Accepted", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", icon: <CheckCircle2 className="w-3 h-3" />, step: 5 },
  rejected: { label: "Rejected", color: "text-red-400", bg: "bg-red-500/10 border-red-500/30", icon: <XCircle className="w-3 h-3" />, step: -1 },
};

const pipelineSteps = ["Applied", "Screening", "Interview", "Offer", "Accepted"];

export default function CandidateTrackSection() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const { data, isLoading } = useQuery({
    queryKey: ["/api/candidate/applications"],
    queryFn: async () => {
      const res = await fetch(apiUrl("/api/candidate/applications"), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load applications");
      return (await res.json()) as ApplicationsResponse;
    },
  });

  const apps = data?.applications ?? [];

  const filteredApps = useMemo(() => {
    let result = apps;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (a) =>
          (a.job_title || "").toLowerCase().includes(q) ||
          (a.company_name || "").toLowerCase().includes(q)
      );
    }
    if (statusFilter) {
      result = result.filter((a) => a.status === statusFilter);
    }
    result = [...result].sort((a, b) => {
      const da = new Date(a.created_at).getTime();
      const db = new Date(b.created_at).getTime();
      return sortOrder === "newest" ? db - da : da - db;
    });
    return result;
  }, [apps, search, statusFilter, sortOrder]);

  // Stats
  const totalApps = apps.length;
  const activeApps = apps.filter((a) => !["rejected", "accepted"].includes(a.status)).length;
  const interviewApps = apps.filter((a) => a.status === "interview").length;

  const uniqueStatuses = useMemo(() => {
    const set = new Set<string>();
    apps.forEach((a) => set.add(a.status));
    return Array.from(set).sort();
  }, [apps]);

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
  };

  return (
    <PortalLayout
      title="CANDIDATE PORTAL"
      subtitle="TRACK APPLICATIONS // STATUS"
      roleLabel="CANDIDATE"
      nav={CANDIDATE_NAV}
    >
      <div className="space-y-5">
        {/* Header */}
        <div className="relative overflow-hidden rounded-xl border border-emerald-500/10 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent p-6">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <ClipboardCheck className="w-5 h-5 text-emerald-400" />
              <p className="font-mono text-[10px] text-emerald-400/80 tracking-widest">APPLICATION TRACKER</p>
            </div>
            <h2 className="font-display text-xl text-foreground">Track Your Applications</h2>
            <p className="font-mono text-xs text-muted-foreground mt-1">
              Monitor the progress of every job application in real-time
            </p>
          </div>
          <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-[0.03]">
            <TrendingUp className="w-28 h-28" />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/[0.05] p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <FileCheck2 className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="font-display text-xl leading-none text-foreground">{totalApps}</p>
              <p className="font-mono text-[10px] text-muted-foreground tracking-wider mt-0.5">TOTAL</p>
            </div>
          </div>
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Timer className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="font-display text-xl leading-none text-foreground">{activeApps}</p>
              <p className="font-mono text-[10px] text-muted-foreground tracking-wider mt-0.5">ACTIVE</p>
            </div>
          </div>
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/[0.05] p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <p className="font-display text-xl leading-none text-foreground">{interviewApps}</p>
              <p className="font-mono text-[10px] text-muted-foreground tracking-wider mt-0.5">INTERVIEWS</p>
            </div>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              className="w-full bg-white/[0.03] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
              placeholder="Search by job or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <button
              onClick={() => setStatusFilter(null)}
              className={
                "px-2.5 py-1 rounded-full font-mono text-[10px] border transition-all " +
                (!statusFilter ? "border-primary/40 bg-primary/10 text-primary" : "border-white/10 text-muted-foreground hover:border-white/20")
              }
            >
              All
            </button>
            {uniqueStatuses.map((s) => {
              const cfg = statusConfig[s] || statusConfig.pending;
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(statusFilter === s ? null : s)}
                  className={
                    "px-2.5 py-1 rounded-full font-mono text-[10px] border transition-all " +
                    (statusFilter === s ? `${cfg.bg} ${cfg.color}` : "border-white/10 text-muted-foreground hover:border-white/20")
                  }
                >
                  {cfg.label}
                </button>
              );
            })}
            <div className="w-px h-4 bg-white/10 mx-1" />
            <button
              onClick={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full font-mono text-[10px] border border-white/10 text-muted-foreground hover:border-white/20 hover:text-foreground transition-all"
            >
              <ArrowUpDown className="w-3 h-3" /> {sortOrder === "newest" ? "Newest" : "Oldest"}
            </button>
          </div>
        </div>

        {/* Application Cards */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-12 text-center">
            <Inbox className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-display text-sm text-foreground">
              {apps.length === 0 ? "No applications yet" : "No matching applications"}
            </p>
            <p className="font-mono text-[11px] text-muted-foreground mt-1">
              {apps.length === 0 ? "Apply to jobs to start tracking your progress" : "Try adjusting your search or filters"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredApps.map((a) => {
              const cfg = statusConfig[a.status] || statusConfig.pending;
              const step = cfg.step;
              return (
                <div
                  key={a.id}
                  className="rounded-xl border border-white/5 bg-white/[0.02] p-5 hover:border-white/10 transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    {/* Left */}
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="font-display text-sm text-foreground">{a.job_title || `Application #${a.id}`}</h3>
                        <p className="font-mono text-[11px] text-muted-foreground mt-0.5">{a.company_name || "Unknown Company"}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-mono ${cfg.color} ${cfg.bg}`}>
                            {cfg.icon} {cfg.label}
                          </span>
                          <span className="font-mono text-[10px] text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {timeAgo(a.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pipeline Progress */}
                  {step > 0 && (
                    <div className="mt-4 ml-[52px]">
                      <div className="flex items-center gap-1">
                        {pipelineSteps.map((label, i) => {
                          const isActive = i < step;
                          const isCurrent = i === step - 1;
                          return (
                            <div key={label} className="flex items-center gap-1 flex-1">
                              <div className="flex flex-col items-center flex-1">
                                <div
                                  className={
                                    "w-full h-1 rounded-full transition-all " +
                                    (isActive
                                      ? "bg-gradient-to-r from-primary to-accent"
                                      : "bg-white/5")
                                  }
                                />
                                <p
                                  className={
                                    "font-mono text-[9px] mt-1.5 " +
                                    (isCurrent ? "text-primary" : isActive ? "text-muted-foreground" : "text-muted-foreground/40")
                                  }
                                >
                                  {label}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {step === -1 && (
                    <div className="mt-3 ml-[52px]">
                      <div className="h-1 w-full bg-red-500/20 rounded-full">
                        <div className="h-full w-full bg-red-500/40 rounded-full" />
                      </div>
                      <p className="font-mono text-[9px] text-red-400/60 mt-1">Application closed</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
