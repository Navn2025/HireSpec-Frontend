import { useMemo, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  PencilLine,
  Lightbulb,
  BarChart3,
  Code2,
  Database,
  Globe2,
  Brain,
  ChevronRight,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import PortalLayout from "@/components/PortalLayout";
import { CANDIDATE_NAV } from "../candidateNav";

type Difficulty = "easy" | "medium" | "hard";
type Category = "javascript" | "react" | "database" | "system-design" | "algorithms" | "general";

type PracticeQuestion = {
  id: string;
  title: string;
  prompt: string;
  difficulty: Difficulty;
  category: Category;
  hint?: string;
  timeEstimate: string;
};

const difficultyConfig: Record<Difficulty, { label: string; color: string; bg: string }> = {
  easy: { label: "Easy", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30" },
  medium: { label: "Medium", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30" },
  hard: { label: "Hard", color: "text-red-400", bg: "bg-red-500/10 border-red-500/30" },
};

const categoryConfig: Record<Category, { label: string; icon: React.ReactNode }> = {
  javascript: { label: "JavaScript", icon: <Code2 className="w-3.5 h-3.5" /> },
  react: { label: "React", icon: <Globe2 className="w-3.5 h-3.5" /> },
  database: { label: "Database", icon: <Database className="w-3.5 h-3.5" /> },
  "system-design": { label: "System Design", icon: <BarChart3 className="w-3.5 h-3.5" /> },
  algorithms: { label: "Algorithms", icon: <Brain className="w-3.5 h-3.5" /> },
  general: { label: "General", icon: <BookOpen className="w-3.5 h-3.5" /> },
};

const QUESTIONS: PracticeQuestion[] = [
  {
    id: "js-closures",
    title: "JavaScript Closures",
    prompt: "Explain what a closure is in JavaScript. Provide a small example demonstrating lexical scoping and one practical use-case such as data privacy or currying.",
    difficulty: "easy",
    category: "javascript",
    hint: "Think about how inner functions access variables from outer function scopes even after the outer function has returned.",
    timeEstimate: "5 min",
  },
  {
    id: "react-rerender",
    title: "React Re-render Optimization",
    prompt: "What are common causes of unnecessary re-renders in React? Describe at least three techniques to prevent them and explain when each is appropriate.",
    difficulty: "medium",
    category: "react",
    hint: "Consider React.memo, useMemo, useCallback, and proper state placement.",
    timeEstimate: "8 min",
  },
  {
    id: "sql-index",
    title: "SQL Indexing Strategy",
    prompt: "When would you add an index to a database table? Discuss the trade-offs between read performance and write overhead. Give an example of a composite index.",
    difficulty: "medium",
    category: "database",
    hint: "Think about B-trees, query patterns, cardinality, and the cost of maintaining indexes on INSERT/UPDATE.",
    timeEstimate: "7 min",
  },
  {
    id: "event-loop",
    title: "Event Loop & Async",
    prompt: "Explain the JavaScript event loop. How do setTimeout, Promises, and async/await interact with the microtask and macrotask queues? Provide an example showing execution order.",
    difficulty: "hard",
    category: "javascript",
    hint: "Microtasks (Promises) run before macrotasks (setTimeout). Consider the call stack, callback queue, and microtask queue.",
    timeEstimate: "10 min",
  },
  {
    id: "react-hooks",
    title: "Custom React Hooks",
    prompt: "Design a custom hook called `useDebounce(value, delay)` that returns a debounced version of the input value. Explain how it works and when you'd use it.",
    difficulty: "easy",
    category: "react",
    hint: "Use useState for the debounced value and useEffect with a setTimeout that cleans up on unmount or value change.",
    timeEstimate: "5 min",
  },
  {
    id: "sys-design-cache",
    title: "Caching Strategies",
    prompt: "Compare in-memory caching (e.g., Redis) with CDN caching. When would you use each? Discuss cache invalidation strategies like TTL, write-through, and cache-aside.",
    difficulty: "hard",
    category: "system-design",
    hint: "Consider data freshness requirements, read vs write ratios, and what happens on cache miss.",
    timeEstimate: "12 min",
  },
  {
    id: "two-sum",
    title: "Two Sum Problem",
    prompt: "Given an array of integers and a target sum, return indices of the two numbers that add up to the target. Describe both brute force and hash map approaches with their time complexity.",
    difficulty: "easy",
    category: "algorithms",
    hint: "Brute force is O(n²). A hash map reduces it to O(n) by storing complements.",
    timeEstimate: "5 min",
  },
  {
    id: "rest-api",
    title: "RESTful API Best Practices",
    prompt: "Describe at least five best practices for designing a RESTful API. How would you handle versioning, pagination, error responses, and authentication?",
    difficulty: "medium",
    category: "general",
    hint: "Think about HTTP verbs, status codes, resource naming conventions, HATEOAS, and rate-limiting.",
    timeEstimate: "8 min",
  },
];

export default function CandidatePracticeSection() {
  const [selectedId, setSelectedId] = useState(QUESTIONS[0].id);
  const [answer, setAnswer] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [filterCategory, setFilterCategory] = useState<Category | null>(null);
  const [filterDifficulty, setFilterDifficulty] = useState<Difficulty | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  const selected = useMemo(() => QUESTIONS.find((q) => q.id === selectedId)!, [selectedId]);

  const filteredQuestions = useMemo(() => {
    let result = QUESTIONS;
    if (filterCategory) result = result.filter((q) => q.category === filterCategory);
    if (filterDifficulty) result = result.filter((q) => q.difficulty === filterDifficulty);
    return result;
  }, [filterCategory, filterDifficulty]);

  const handleSubmit = () => {
    if (answer.trim().length > 20) {
      setCompletedIds((prev) => new Set(prev).add(selectedId));
    }
  };

  const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;

  return (
    <PortalLayout
      title="CANDIDATE PORTAL"
      subtitle="PRACTICE // SKILL BUILDING"
      roleLabel="CANDIDATE"
      nav={CANDIDATE_NAV}
    >
      <div className="space-y-5">
        {/* Header */}
        <div className="relative overflow-hidden rounded-xl border border-amber-500/10 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent p-6">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-5 h-5 text-amber-400" />
              <p className="font-mono text-[10px] text-amber-400/80 tracking-widest">PRACTICE MODE</p>
            </div>
            <h2 className="font-display text-xl text-foreground">Practice Questions</h2>
            <p className="font-mono text-xs text-muted-foreground mt-1">
              {QUESTIONS.length} questions · {completedIds.size} completed · Sharpen your skills before real assessments
            </p>
          </div>
          <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-[0.03]">
            <Sparkles className="w-28 h-28" />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] text-muted-foreground tracking-wider mr-1">FILTER:</span>
          {/* Category Filters */}
          {(Object.keys(categoryConfig) as Category[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(filterCategory === cat ? null : cat)}
              className={
                "flex items-center gap-1 px-2.5 py-1 rounded-full font-mono text-[10px] border transition-all " +
                (filterCategory === cat
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-white/10 text-muted-foreground hover:border-white/20")
              }
            >
              {categoryConfig[cat].icon}
              {categoryConfig[cat].label}
            </button>
          ))}
          <div className="w-px h-4 bg-white/10 mx-1" />
          {(Object.keys(difficultyConfig) as Difficulty[]).map((d) => (
            <button
              key={d}
              onClick={() => setFilterDifficulty(filterDifficulty === d ? null : d)}
              className={
                "px-2.5 py-1 rounded-full font-mono text-[10px] border transition-all " +
                (filterDifficulty === d
                  ? `${difficultyConfig[d].bg} ${difficultyConfig[d].color}`
                  : "border-white/10 text-muted-foreground hover:border-white/20")
              }
            >
              {difficultyConfig[d].label}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          {/* Question List */}
          <div className="space-y-2">
            <p className="font-mono text-[10px] text-muted-foreground tracking-widest">
              QUESTIONS ({filteredQuestions.length})
            </p>
            <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
              {filteredQuestions.map((q) => {
                const active = q.id === selectedId;
                const completed = completedIds.has(q.id);
                const dCfg = difficultyConfig[q.difficulty];
                const cCfg = categoryConfig[q.category];
                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setSelectedId(q.id);
                      setAnswer("");
                      setShowHint(false);
                    }}
                    className={
                      "w-full text-left rounded-xl border p-3 transition-all duration-200 " +
                      (active
                        ? "border-primary/30 bg-primary/[0.06]"
                        : "border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.03]")
                    }
                  >
                    <div className="flex items-start gap-2">
                      <div className={
                        "w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 " +
                        (completed ? "border-emerald-500/50 bg-emerald-500/20" : "border-white/10 bg-white/5")
                      }>
                        {completed && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                      </div>
                      <div className="min-w-0">
                        <p className={
                          "font-mono text-xs " +
                          (active ? "text-primary" : completed ? "text-muted-foreground line-through" : "text-foreground")
                        }>{q.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[9px] font-mono ${dCfg.color}`}>{dCfg.label}</span>
                          <span className="text-[9px] font-mono text-muted-foreground flex items-center gap-0.5">{cCfg.icon} {cCfg.label}</span>
                        </div>
                      </div>
                      {active && <ChevronRight className="w-3 h-3 text-primary shrink-0 mt-1" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Answer Area */}
          <div className="lg:col-span-2 space-y-4">
            {/* Question Card */}
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                    {categoryConfig[selected.category].icon}
                  </div>
                  <div>
                    <h3 className="font-display text-sm text-foreground">{selected.title}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${difficultyConfig[selected.difficulty].bg} ${difficultyConfig[selected.difficulty].color}`}>
                        {difficultyConfig[selected.difficulty].label}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground flex items-center gap-1">
                        <BookOpen className="w-3 h-3" /> {selected.timeEstimate}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-white/[0.02] border border-white/5 p-4 mt-3">
                <p className="font-mono text-xs text-foreground leading-relaxed">{selected.prompt}</p>
              </div>

              {/* Hint */}
              {selected.hint && (
                <div className="mt-3">
                  {showHint ? (
                    <div className="rounded-lg bg-amber-500/[0.05] border border-amber-500/20 p-3">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Lightbulb className="w-3 h-3 text-amber-400" />
                        <span className="font-mono text-[10px] text-amber-400 tracking-wider">HINT</span>
                      </div>
                      <p className="font-mono text-[11px] text-muted-foreground leading-relaxed">{selected.hint}</p>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowHint(true)}
                      className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground hover:text-amber-400 transition-colors"
                    >
                      <Lightbulb className="w-3 h-3" /> Show Hint
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Text Area */}
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="font-mono text-[10px] text-muted-foreground tracking-widest">YOUR ANSWER</p>
                <p className="font-mono text-[10px] text-muted-foreground">{wordCount} words</p>
              </div>
              <textarea
                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 min-h-[200px] font-mono text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/10 resize-none transition-all"
                placeholder="Write your answer here..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
              />
              <div className="flex items-center justify-between mt-3">
                <button
                  onClick={() => { setAnswer(""); setShowHint(false); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 font-mono text-[10px] text-muted-foreground hover:text-foreground hover:border-white/20 transition-all"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={wordCount < 5}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary font-mono text-xs hover:bg-primary/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Mark Complete
                </button>
              </div>
            </div>

            {/* Progress */}
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="font-mono text-[10px] text-muted-foreground tracking-wider">PRACTICE PROGRESS</p>
                <p className="font-mono text-xs text-primary">{completedIds.size}/{QUESTIONS.length}</p>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                  style={{ width: `${(completedIds.size / QUESTIONS.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
