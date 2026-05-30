// Renders `quality` filled star SVGs, reusing the legacy .star-icon class
// (port of generateStarsHtml).
interface StarRatingProps {
  quality: number;
}

export function StarRating({ quality }: StarRatingProps) {
  return (
    <>
      {Array.from({ length: quality }, (_, i) => (
        <svg key={i} className="star-icon" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </>
  );
}
