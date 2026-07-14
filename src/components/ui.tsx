import { type ReactNode } from "react";

/** Gold star SVG (exact path from Prototype A). */
export function Star({
  size = 24,
  filled = true,
  className = "",
}: {
  size?: number;
  filled?: boolean;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "#f2b441" : "#e4dfd3"}
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

/** Read-only star row for displaying a rating. */
export function StarRow({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5" role="img" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} filled={n <= Math.round(rating)} />
      ))}
    </span>
  );
}

/** The HighNote wordmark. */
export function Logo({ className = "", star = "#f2b441" }: { className?: string; star?: string }) {
  return (
    <span className={`font-display ${className}`}>
      HighNote <span style={{ color: star }}>★</span>
    </span>
  );
}

/** Torn-paper receipt/ticket card (landing hero + guest header). */
export function Ticket({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <div className="receipt-edge-top" />
      <div className="bg-cream text-ink font-mono text-center px-6 py-8">{children}</div>
      <div className="receipt-edge-bottom" />
    </div>
  );
}

export function DashedRule({ className = "" }: { className?: string }) {
  return <div className={`dashed-rule ${className}`} />;
}

/** Small uppercase gold eyebrow label. */
export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`text-xs tracking-[0.28em] text-gold uppercase ${className}`}>{children}</div>
  );
}
