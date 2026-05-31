import { useId } from 'react';
import type { Locale } from '../i18n/config';

// Inline SVG flags — crisp at any size and identical across OSes (emoji flags
// don't render on Windows). One <svg> per locale; ids are made unique with
// useId so multiple instances on the page never collide.

function UnionJack({ titleId }: { titleId: string }) {
  const clip = useId();
  const diag = useId();
  return (
    <svg viewBox="0 0 60 30" aria-hidden="true" focusable="false">
      <clipPath id={clip}>
        <path d="M0,0 v30 h60 v-30 z" />
      </clipPath>
      <clipPath id={diag}>
        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
      </clipPath>
      <g clipPath={`url(#${clip})`}>
        <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
        <path
          d="M0,0 L60,30 M60,0 L0,30"
          clipPath={`url(#${diag})`}
          stroke="#C8102E"
          strokeWidth="4"
        />
        <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
        <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
      </g>
      <title id={titleId}>English</title>
    </svg>
  );
}

function Ukraine({ titleId }: { titleId: string }) {
  return (
    <svg viewBox="0 0 60 30" aria-hidden="true" focusable="false">
      <rect width="60" height="30" fill="#FFD500" />
      <rect width="60" height="15" fill="#005BBB" />
      <title id={titleId}>Українська</title>
    </svg>
  );
}

export function Flag({ locale }: { locale: Locale }) {
  const titleId = useId();
  const flag = locale === 'uk' ? <Ukraine titleId={titleId} /> : <UnionJack titleId={titleId} />;
  return <span className="lang-flag">{flag}</span>;
}
