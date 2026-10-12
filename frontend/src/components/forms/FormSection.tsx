import type { ReactNode } from 'react';

/** Two-column responsive form grid + section wrapper used by voucher forms. */
export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section aria-label={title} className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6">
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-gray-500">{description}</p>}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function FullRow({ children }: { children: ReactNode }) {
  return <div className="sm:col-span-2">{children}</div>;
}
