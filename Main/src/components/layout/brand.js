import Link from "next/link";
import { useId } from "react";
export function Brand() {
  const gradient = useId();
  return (
    <Link className="brand" href="/" aria-label="Comvexa home">
      <svg
        width="42"
        height="42"
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            id={gradient}
            x1="10"
            y1="45"
            x2="38"
            y2="3"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#23c9ee" />
            <stop offset=".32" stopColor="#6439ff" />
            <stop offset=".62" stopColor="#ec38cb" />
            <stop offset=".82" stopColor="#ff786a" />
            <stop offset="1" stopColor="#ffe56b" />
          </linearGradient>
        </defs>
        <path
          d="M36 10a18 18 0 1 0 0 28"
          stroke={`url(#${gradient})`}
          strokeWidth="11"
          strokeLinecap="round"
        />
        <path
          d="M13 10c6-6 14-5 20-2"
          stroke="#ffffff"
          strokeOpacity=".45"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <span>comvexa</span>
    </Link>
  );
}
