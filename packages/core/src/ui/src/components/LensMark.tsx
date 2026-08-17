import { useId } from "react";

/**
 * LensJS brand mark — a gradient camera aperture around a dark lens opening
 * that frames a `>_` terminal glyph (observability + developer tooling). It is
 * self-contained (its own tile + gradient), so it renders correctly on any
 * surface; the gradient id is unique per instance to avoid <defs> collisions.
 */
export function LensMark({
  size = 28,
  className,
}: {
  size?: number;
  className?: string;
}) {
  const gid = useId();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 256 256"
      fill="none"
      className={className}
      role="img"
      aria-label="LensJS"
    >
      <defs>
        <linearGradient
          id={gid}
          x1="28"
          y1="28"
          x2="226"
          y2="226"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#C04BFF" />
          <stop offset=".42" stopColor="#7C4DFF" />
          <stop offset="1" stopColor="#2563EB" />
        </linearGradient>
      </defs>
      <rect width="256" height="256" rx="52" fill="#0B0D13" />
      <g fill={`url(#${gid})`}>
        <path d="M78 30 110 46 86 86 50 70a92 92 0 0 1 28-40Z" />
        <path d="m116 28 34 6-10 46-44-10 20-42Z" />
        <path d="m160 38 38 18 10 22-40 20-26-39 18-21Z" />
        <path d="m203 95 21 34-6 37-44-9 4-48 25-14Z" />
        <path d="m190 178-27 31-39 15 1-46 46-22 19 22Z" />
        <path d="m104 222-35-9-24-28 36-25 36 32-13 30Z" />
        <path d="m44 174-18-33 6-36 43 11-4 47-27 11Z" />
      </g>
      <circle cx="128" cy="128" r="62" fill="#07080D" />
      <g
        stroke="#F8FAFC"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m104 112 22 16-22 16" />
        <path d="M143 148h22" />
      </g>
    </svg>
  );
}

export default LensMark;
