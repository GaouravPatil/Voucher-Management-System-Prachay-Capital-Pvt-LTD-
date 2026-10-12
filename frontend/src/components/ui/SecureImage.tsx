import { useEffect, useState } from 'react';
import { ImageOff, Loader2 } from 'lucide-react';
import { getBlob } from '../../api/client';

interface Props {
  url: string | null | undefined;
  alt: string;
  className?: string;
}

/**
 * Authenticated image: <img src> can't send the Bearer header, so we fetch
 * the blob via Axios and render an object URL. Revoked on unmount/change.
 */
export function SecureImage({ url, alt, className = '' }: Props) {
  const [src, setSrc] = useState<string | null>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle');

  useEffect(() => {
    if (!url) {
      setSrc(null);
      setState('idle');
      return;
    }
    let alive = true;
    let objectUrl: string | null = null;
    setState('loading');
    getBlob(url)
      .then((blob) => {
        if (!alive) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
        setState('idle');
      })
      .catch(() => {
        if (alive) setState('error');
      });
    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  if (!url) {
    return (
      <span className={`inline-flex items-center gap-1 text-xs text-gray-400 ${className}`}>
        <ImageOff className="h-4 w-4" aria-hidden="true" />
        No signature
      </span>
    );
  }
  if (state === 'loading') {
    return (
      <span
        className={`inline-flex items-center gap-2 text-xs text-gray-500 ${className}`}
        role="status"
        aria-label={`Loading ${alt}`}
      >
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        Loading…
      </span>
    );
  }
  if (state === 'error' || !src) {
    return (
      <span className={`inline-flex items-center gap-1 text-xs text-red-500 ${className}`} role="alert">
        <ImageOff className="h-4 w-4" aria-hidden="true" />
        Failed to load image
      </span>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className={`max-h-24 rounded border border-gray-200 bg-white object-contain ${className}`}
    />
  );
}
