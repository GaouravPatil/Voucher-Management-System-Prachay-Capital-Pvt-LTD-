import type { ReactNode } from 'react';

export interface Column<T> {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  className?: string;
  sortable?: boolean;
  sortKey?: string;
}

interface Props<T> {
  columns: Column<T>[];
  rows: T[];
  keyOf: (row: T) => string;
  onRowClick?: (row: T) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (sortBy: string) => void;
}

/** Responsive table: hidden on <768px in favour of stacked cards rendered by callers. */
export function Table<T>({
  columns,
  rows,
  keyOf,
  onRowClick,
  sortBy,
  sortOrder,
  onSort,
}: Props<T>) {
  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="min-w-full divide-y divide-gray-100">
        <thead>
          <tr className="border-b border-gray-200">
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={`px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400 ${c.className ?? ''}`}
              >
                {c.sortable && onSort ? (
                  <button
                    type="button"
                    onClick={() => c.sortKey && onSort(c.sortKey)}
                    className="inline-flex items-center gap-1 uppercase tracking-[0.08em] hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
                    aria-label={`Sort by ${c.sortKey}`}
                  >
                    {c.header}
                    <span aria-hidden="true" className="text-gray-400">
                      {sortBy === c.sortKey
                        ? sortOrder === 'asc'
                          ? '▲'
                          : '▼'
                        : '⇅'}
                    </span>
                  </button>
                ) : (
                  c.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {rows.map((row) => (
            <tr
              key={keyOf(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={
                onRowClick
                  ? 'cursor-pointer transition-colors duration-150 hover:bg-gray-50 focus-within:bg-gray-50'
                  : undefined
              }
            >
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={`px-4 py-3 text-sm tabular-nums text-gray-800 ${c.className ?? ''}`}
                >
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
