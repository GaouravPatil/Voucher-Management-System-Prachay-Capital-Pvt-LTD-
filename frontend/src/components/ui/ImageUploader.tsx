import { useEffect, useRef, useState } from 'react';
import { ImagePlus, RefreshCw, X } from 'lucide-react';
import {
  ALLOWED_SIGNATURE_EXTS,
  ALLOWED_SIGNATURE_MIMES,
  MAX_SIGNATURE_BYTES,
  MAX_SIGNATURE_MB,
} from '../../lib/constants';

interface Props {
  label: string;
  value: File | null;
  onChange: (file: File | null) => void;
  existingPreviewUrl?: string | null;
  error?: string;
  useSavedOption?: { available: boolean; checked: boolean; onToggle: (v: boolean) => void };
}

function clientValidate(file: File): string | null {
  if (
    !(ALLOWED_SIGNATURE_MIMES as readonly string[]).includes(file.type)
  ) {
    return `Only ${ALLOWED_SIGNATURE_EXTS.join(', ')} images are allowed.`;
  }
  if (file.size > MAX_SIGNATURE_BYTES) {
    return `Image must be ${MAX_SIGNATURE_MB} MB or smaller.`;
  }
  return null;
}

/** Image uploader with drag/drop, preview, replace + client type/size check. */
export function ImageUploader({
  label,
  value,
  onChange,
  existingPreviewUrl,
  error,
  useSavedOption,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const inputId = `uploader-${label.replace(/\W+/g, '-').toLowerCase()}`;

  useEffect(() => {
    if (!value) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(value);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  const pick = (file: File | undefined) => {
    if (!file) return;
    const err = clientValidate(file);
    if (err) {
      setLocalError(err);
      return;
    }
    setLocalError(null);
    onChange(file);
  };

  const shownError = error ?? localError;
  const shownPreview = preview ?? existingPreviewUrl ?? null;

  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium text-gray-700" id={`${inputId}-label`}>
        {label}
      </span>
      {useSavedOption?.available && (
        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={useSavedOption.checked}
            onChange={(e) => useSavedOption.onToggle(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Use my saved signature
        </label>
      )}
      <div
        role="button"
        tabIndex={0}
        aria-labelledby={`${inputId}-label`}
        aria-describedby={shownError ? `${inputId}-error` : `${inputId}-hint`}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          pick(e.dataTransfer.files?.[0]);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed px-4 py-6 text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
          dragOver
            ? 'border-blue-500 bg-blue-50'
            : shownError
              ? 'border-red-400 bg-red-50'
              : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
        }`}
      >
        {shownPreview ? (
          <div className="flex flex-col items-center gap-2">
            <img
              src={shownPreview}
              alt={`${label} preview`}
              className="max-h-32 max-w-full rounded border border-gray-200 bg-white object-contain"
            />
            <span className="inline-flex items-center gap-1 text-xs text-blue-700">
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              Click or drop to replace
            </span>
          </div>
        ) : (
          <>
            <ImagePlus className="h-8 w-8 text-gray-400" aria-hidden="true" />
            <span className="text-sm text-gray-600">
              Drag &amp; drop or <span className="text-blue-700 underline">browse</span>
            </span>
          </>
        )}
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={ALLOWED_SIGNATURE_EXTS.join(',')}
          className="sr-only"
          aria-label={label}
          onChange={(e) => {
            pick(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </div>
      <p id={`${inputId}-hint`} className="text-xs text-gray-500">
        PNG, JPG or WEBP up to {MAX_SIGNATURE_MB} MB.
      </p>
      {(value || existingPreviewUrl) && (
        <button
          type="button"
          onClick={() => {
            onChange(null);
            setLocalError(null);
          }}
          className="inline-flex w-fit items-center gap-1 text-xs text-red-600 hover:text-red-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
          Remove selected image
        </button>
      )}
      {shownError && (
        <p id={`${inputId}-error`} role="alert" className="text-xs text-red-600">
          {shownError}
        </p>
      )}
    </div>
  );
}
