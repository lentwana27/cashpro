import { Check } from 'lucide-react';
import clsx from 'clsx';

const STAGE_ORDER = ['AMENDMENT_REQUESTED', 'AMENDMENT_PENDING_HEAD_ACCOUNTANT', 'AMENDMENT_PENDING_DIRECTOR', 'AMENDMENT_APPROVED'];
const STAGE_LABELS = ['Auditor', 'Head Accountant', 'Director'];

export function isAmendmentStatus(status: string | undefined | null): boolean {
  return !!status && STAGE_ORDER.includes(status);
}

// Shows the 3-stage Auditor -> Head Accountant -> Director sequence as pills.
// Only renders when `status` is one of the amendment statuses.
export function AmendmentStagePills({ status, className }: { status: string, className?: string }) {
  const currentIndex = STAGE_ORDER.indexOf(status);
  if (currentIndex === -1) return null;

  return (
    <div className={clsx("flex items-center gap-1.5 flex-wrap", className)}>
      {STAGE_LABELS.map((label, i) => {
        const done = currentIndex > i;
        const current = currentIndex === i;
        return (
          <span
            key={label}
            className={clsx(
              "flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border",
              done && "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
              current && "bg-amber-500/15 border-amber-500/30 text-amber-400",
              !done && !current && "bg-slate-800/60 border-[#1e345e] text-slate-500"
            )}
          >
            {done && <Check className="w-3 h-3" />}
            {current && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
            {label}
          </span>
        );
      })}
    </div>
  );
}
