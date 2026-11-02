import { ROLE_LABEL, type Role } from "@/lib/game";
import { ROLE_ICON } from "./icons";

export const ROLE_STYLE: Record<Role, string> = {
  civilian: "bg-sky-500/20 text-sky-300 ring-sky-400/40",
  undercover: "bg-amber-500/20 text-amber-300 ring-amber-400/40",
  mrwhite: "bg-white/90 text-slate-900 ring-white",
};

export function RoleBadge({ role, size = "sm" }: { role: Role; size?: "sm" | "lg" }) {
  const sizing = size === "lg" ? "px-5 py-2 text-lg" : "px-3 py-1 text-xs";
  const Icon = ROLE_ICON[role];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold ring-1 ${sizing} ${ROLE_STYLE[role]}`}>
      <Icon aria-hidden className={size === "lg" ? "h-5 w-5" : "h-3.5 w-3.5"} />
      {ROLE_LABEL[role]}
    </span>
  );
}
