import { type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export function CollapsibleSection({
  title,
  subtitle,
  defaultOpen = true,
  children,
}: {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details
      className="group rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl"
      open={defaultOpen}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5">
        <div className="min-w-0">
          <div className="truncate text-[13px] font-semibold tracking-wide text-white/90">
            {title}
          </div>
          {subtitle ? (
            <div className="truncate text-xs text-white/50">{subtitle}</div>
          ) : null}
        </div>
        <ChevronDown className="h-4 w-4 shrink-0 text-white/60 transition-transform group-open:rotate-180" />
      </summary>

      <div className="px-3 pb-3">{children}</div>
    </details>
  );
}
