import { useMemo, useState } from "react";
import {
  Briefcase,
  Search,
  CheckCircle2,
  MapPin,
  Clock,
  Building2,
  Filter,
  Bookmark,
  Tag,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import PortalLayout from "@/components/PortalLayout";
import { apiUrl } from "@/lib/api";
import { CANDIDATE_NAV } from "../candidateNav";

type JobsResponse = {
  jobs: Array<{
    id: number;
    title: string;
    description: string | null;
    skills: string[];
    company_name: string | null;
    created_at: string;
  }>;
};

type ApplicationsResponse = {
  applications: Array<{ id: number; job_id: number | null; status: string }>;
};

export default function CandidateJobPostsSection() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);

  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ["/api/candidate/jobs"],
    queryFn: async () => {
      const res = await fetch(apiUrl("/api/candidate/jobs"), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load jobs");
      return (await res.json()) as JobsResponse;
    },
  });

  const { data: appsData } = useQuery({
    queryKey: ["/api/candidate/applications"],
    queryFn: async () => {
      const res = await fetch(apiUrl("/api/candidate/applications"), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load applications");
      return (await res.json()) as ApplicationsResponse;
    },
  });

  const appliedIds = useMemo(() => {
    const set = new Set<number>();
    for (const a of appsData?.applications ?? []) {
      if (typeof a.job_id === "number") set.add(a.job_id);
    }
    return set;
  }, [appsData?.applications]);

  const applyMutation = useMutation({
    mutationFn: async (jobId: number) => {
      const res = await fetch(apiUrl("/api/candidate/apply"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ job_id: jobId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Failed to apply");
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/candidate/applications"] });
    },
  });

  const jobs = jobsData?.jobs ?? [];

  // Collect all unique skills for filter
  const allSkills = useMemo(() => {
    const set = new Set<string>();
    for (const j of jobs) (j.skills || []).forEach((s) => set.add(s));
    return Array.from(set).sort();
  }, [jobs]);

  const filtered = useMemo(() => {
    let result = jobs;
    const query = q.trim().toLowerCase();
    if (query) {
      result = result.filter((j) => {
        const skills = (j.skills || []).join(" ").toLowerCase();
        return (
          j.title.toLowerCase().includes(query) ||
          (j.company_name || "").toLowerCase().includes(query) ||
          skills.includes(query)
        );
      });
    }
    if (selectedSkill) {
      result = result.filter((j) => (j.skills || []).includes(selectedSkill));
    }
    return result;
  }, [jobs, q, selectedSkill]);

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
      subtitle="JOB POSTS // BROWSE + APPLY"
      roleLabel="CANDIDATE"
      nav={CANDIDATE_NAV}
    >
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-xl text-foreground tracking-wide">Job Positions</h2>
            <p className="font-mono text-[11px] text-muted-foreground mt-0.5">
              {jobs.length} open position{jobs.length !== 1 ? "s" : ""} · {appliedIds.size} applied
            </p>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              className="w-full bg-white/[0.03] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
              placeholder="Search by title, company, or skill..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>

        {/* Skill Filter Chips */}
        {allSkills.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <button
              onClick={() => setSelectedSkill(null)}
              className={
                "px-2.5 py-1 rounded-full font-mono text-[10px] border transition-all shrink-0 " +
                (!selectedSkill
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-white/10 text-muted-foreground hover:border-white/20")
              }
            >
              All
            </button>
            {allSkills.slice(0, 12).map((skill) => (
              <button
                key={skill}
                onClick={() => setSelectedSkill(selectedSkill === skill ? null : skill)}
                className={
                  "px-2.5 py-1 rounded-full font-mono text-[10px] border transition-all shrink-0 " +
                  (selectedSkill === skill
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-white/10 text-muted-foreground hover:border-white/20")
                }
              >
                {skill}
              </button>
            ))}
          </div>
        )}

        {/* Job Cards */}
        {jobsLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-12 text-center">
            <Briefcase className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-display text-sm text-foreground">No positions found</p>
            <p className="font-mono text-[11px] text-muted-foreground mt-1">{q || selectedSkill ? "Try adjusting your search or filters" : "Check back soon for new openings"}</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((j) => {
              const applied = appliedIds.has(j.id);
              return (
                <div
                  key={j.id}
                  className={
                    "group rounded-xl border p-5 transition-all duration-200 " +
                    (applied
                      ? "border-emerald-500/20 bg-emerald-500/[0.02]"
                      : "border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.03]")
                  }
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      {/* Job header */}
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                          <Building2 className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-display text-sm text-foreground group-hover:text-primary transition-colors">{j.title}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="font-mono text-[11px] text-muted-foreground flex items-center gap-1">
                              <Building2 className="w-3 h-3" /> {j.company_name || "Unknown"}
                            </span>
                            <span className="font-mono text-[11px] text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {timeAgo(j.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      {j.description && (
                        <p className="font-mono text-xs text-muted-foreground mt-3 line-clamp-2 leading-relaxed ml-[52px]">
                          {j.description}
                        </p>
                      )}

                      {/* Skills */}
                      <div className="flex gap-1.5 flex-wrap mt-3 ml-[52px]">
                        {(j.skills || []).slice(0, 6).map((s) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 bg-white/[0.04] border border-white/10 text-muted-foreground text-[10px] font-mono rounded-md flex items-center gap-1"
                          >
                            <Tag className="w-2.5 h-2.5" /> {s}
                          </span>
                        ))}
                        {(j.skills || []).length > 6 && (
                          <span className="px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                            +{j.skills.length - 6} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 ml-[52px] md:ml-0">
                      {applied ? (
                        <div className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="font-mono text-xs text-emerald-400">Applied</span>
                        </div>
                      ) : (
                        <button
                          disabled={applyMutation.isPending}
                          onClick={() => applyMutation.mutate(j.id)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary font-mono text-xs hover:bg-primary/20 transition-all disabled:opacity-50"
                        >
                          {applyMutation.isPending ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <ExternalLink className="w-3.5 h-3.5" />
                          )}
                          Apply Now
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
