/**
 * Lens.js brand mark — the "focal frame".
 *
 * An abstract geometric glyph: a rounded square (a bounded system / the frame
 * of observability) with a diamond aperture cut through the center via negative
 * space (focus, precision, insight). Drawn as a single path in `currentColor`
 * so it renders identically in emerald, white, black, or any monochrome context
 * and stays legible from 16px to 512px.
 */
export const LENS_MARK_PATH =
  "M7.5 2.5 H16.5 A5 5 0 0 1 21.5 7.5 V16.5 A5 5 0 0 1 16.5 21.5 H7.5 A5 5 0 0 1 2.5 16.5 V7.5 A5 5 0 0 1 7.5 2.5 Z M12 7.4 L16.6 12 L12 16.6 L7.4 12 Z";

export function LensLogo({
  size = 20,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      role="img"
      aria-label="Lens.js"
    >
      <path
        d={LENS_MARK_PATH}
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default LensLogo;
