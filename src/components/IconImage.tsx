import { useState, type ReactNode } from 'react';

// Shows the real game icon from the CDN; on load error, swaps in a fallback
// (the React equivalent of the legacy gameIconHtml onerror trick). Uses the
// legacy .factory-img class for sizing.
interface IconImageProps {
  src: string;
  fallback?: ReactNode;
  className?: string;
}

export function IconImage({ src, fallback = null, className = 'factory-img' }: IconImageProps) {
  const [errored, setErrored] = useState(false);
  if (errored) return <>{fallback}</>;
  return <img src={src} className={className} loading="lazy" alt="" onError={() => setErrored(true)} />;
}
