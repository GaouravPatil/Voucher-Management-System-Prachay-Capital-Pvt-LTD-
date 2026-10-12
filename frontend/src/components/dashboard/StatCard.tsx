import type { LucideIcon } from 'lucide-react';

interface Props {
  title: string;
  value: string;
  icon: LucideIcon;
  accent?: string;
  tooltip?: string;
  action?: React.ReactNode;
  index?: number;
}

export function StatCard({ title, value, icon: Icon, tooltip, action, index = 0 }: Props) {
  return (
    <div className="animate-fade-up rounded-xl border border-gray-200 bg-white p-5 transition-colors duration-150 hover:border-gray-300" style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400">
          {title}
        </p>
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gray-100 text-gray-500" aria-hidden="true">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-2 text-[26px] font-semibold tabular-nums tracking-tight text-gray-900" title={value}>
        {value}
      </p>
      {tooltip && <span className="sr-only">{tooltip}</span>}
      {action}
    </div>
  );
}
