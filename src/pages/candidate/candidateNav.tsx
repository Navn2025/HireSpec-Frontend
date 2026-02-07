import { ReactNode } from "react";
import {
  User,
  Briefcase,
  Bot,
  BookOpen,
  ClipboardCheck,
} from "lucide-react";

export type PortalNavItem = {
  label: string;
  href: string;
  icon: ReactNode;
};

export const CANDIDATE_NAV: PortalNavItem[] = [
  { label: "PROFILE", href: "/dashboard/candidate/profile", icon: <User className="w-4 h-4" /> },
  { label: "JOB POSTS", href: "/dashboard/candidate/jobs", icon: <Briefcase className="w-4 h-4" /> },
  { label: "AI INTERVIEW", href: "/dashboard/candidate/ai-interview", icon: <Bot className="w-4 h-4" /> },
  { label: "PRACTICE", href: "/dashboard/candidate/practice", icon: <BookOpen className="w-4 h-4" /> },
  { label: "TRACK", href: "/dashboard/candidate/track", icon: <ClipboardCheck className="w-4 h-4" /> },
];
