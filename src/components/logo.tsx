interface LogoProps {
  size?: number;
  className?: string;
  variant?: "mark" | "wordmark";
}

/**
 * Golf Data Viz brand mark — "The Contour Mark"
 *
 * Topographic contour lines forming an abstract "G" shape,
 * connecting golf course terrain mapping to data visualization.
 * A filled circle at center represents a pin position.
 */
export function Logo({ size = 32, className, variant = "mark" }: LogoProps) {
  const mark = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={variant === "mark" ? className : undefined}
      aria-hidden="true"
    >
      {/* Outer contour — bold, reads at small sizes */}
      <path
        d="M16 2C8.268 2 2 8.268 2 16s6.268 14 14 14c5.1 0 9.6-2.73 12.07-6.81"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Middle contour — offset for topographic depth */}
      <path
        d="M16 7C11.029 7 7 11.029 7 16s4.029 9 9 9c3.28 0 6.17-1.76 7.75-4.38"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.7"
      />
      {/* Inner contour — tightest ring */}
      <path
        d="M16 12c-2.209 0-4 1.791-4 4s1.791 4 4 4c1.46 0 2.74-.783 3.44-1.95"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.45"
      />
      {/* Pin position — center dot */}
      <circle cx="16" cy="16" r="1.8" fill="currentColor" />
    </svg>
  );

  if (variant === "mark") return mark;

  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      {mark}
      <span className="font-display text-lg tracking-tight text-neutral-950">
        Golf Data Viz
      </span>
    </span>
  );
}
