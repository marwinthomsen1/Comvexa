import Link from "next/link";

export function Brand() {
  return (
    <Link className="brand" href="/" aria-label="Comvexa home">
      <svg
        width="34"
        height="34"
        viewBox="0 0 34 34"
        fill="none"
        aria-hidden="true"
      >
        <rect width="34" height="34" rx="11" fill="currentColor" />
        <path
          d="M23 11a8 8 0 1 0 0 12M13 17h12"
          stroke="var(--brand-mark-ink)"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
      </svg>
      <span>
        comvexa<span className="brand-dot">.</span>
      </span>
    </Link>
  );
}
