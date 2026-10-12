import { forwardRef, type TextareaHTMLAttributes } from 'react';

interface Props extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  showCount?: boolean;
  maxLength?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, Props>(
  (
    {
      label,
      error,
      hint,
      showCount,
      maxLength,
      id,
      required,
      value,
      className = '',
      ...rest
    },
    ref,
  ) => {
    const areaId = id ?? `ta-${rest.name ?? Math.random().toString(36).slice(2)}`;
    const describedBy = error
      ? `${areaId}-error`
      : hint || showCount
        ? `${areaId}-hint`
        : undefined;
    const len = typeof value === 'string' ? value.length : 0;
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={areaId} className="text-sm font-medium text-gray-700">
            {label}
            {required && (
              <span className="ml-0.5 text-red-600" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}
        <textarea
          ref={ref}
          id={areaId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          maxLength={maxLength}
          value={value}
          className={`rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            error ? 'border-red-500' : 'border-gray-300'
          } ${className}`}
          {...rest}
        />
        {error && (
          <p id={`${areaId}-error`} role="alert" className="text-xs text-red-600">
            {error}
          </p>
        )}
        {(hint || (showCount && maxLength)) && !error && (
          <p id={`${areaId}-hint`} className="text-xs text-gray-500">
            {hint}
            {showCount && maxLength ? ` (${len}/${maxLength})` : ''}
          </p>
        )}
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';
