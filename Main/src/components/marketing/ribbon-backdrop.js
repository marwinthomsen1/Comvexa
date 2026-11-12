export function RibbonBackdrop() {
  return (
    <svg
      className="ribbon-backdrop"
      viewBox="0 0 1600 1450"
      fill="none"
      preserveAspectRatio="xMidYMin slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="ribbon-spectrum"
          x1="0"
          y1="0"
          x2="400"
          y2="360"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#fff07b" />
          <stop offset=".24" stopColor="#ff85b8" />
          <stop offset=".5" stopColor="#c238ff" />
          <stop offset=".76" stopColor="#3d79ff" />
          <stop offset="1" stopColor="#29eff3" />
        </linearGradient>
        <linearGradient
          id="ribbon-cool"
          x1="1400"
          y1="0"
          x2="1640"
          y2="400"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#00e9f4" />
          <stop offset=".4" stopColor="#3a80ff" />
          <stop offset="1" stopColor="#da30f4" />
        </linearGradient>
        <linearGradient
          id="ribbon-warm"
          x1="1200"
          y1="850"
          x2="1660"
          y2="1200"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#713eff" />
          <stop offset=".5" stopColor="#ff37c5" />
          <stop offset="1" stopColor="#ffc743" />
        </linearGradient>
      </defs>
      <g className="ribbon ribbon-left">
        <path
          d="M160-100C-160 90-100 160 20 230S70 330 38 370"
          stroke="url(#ribbon-spectrum)"
          strokeWidth="92"
        />
        <path
          d="M155-100C-115 90-72 153 36 220"
          stroke="white"
          strokeOpacity=".22"
          strokeWidth="3"
        />
      </g>
      <g className="ribbon ribbon-right">
        <path
          d="M1720-80C1470 40 1680 190 1502 265S1490 420 1690 400"
          stroke="url(#ribbon-cool)"
          strokeWidth="100"
        />
        <path
          d="M1710-70C1480 48 1690 190 1510 270"
          stroke="white"
          strokeOpacity=".3"
          strokeWidth="3"
        />
      </g>
      <g className="ribbon ribbon-lower">
        <path
          d="M-140 760C100 520 60 1090 290 1090"
          stroke="url(#ribbon-spectrum)"
          strokeWidth="110"
        />
        <path
          d="M1680 690C1400 620 1660 1020 1390 1070S1530 1260 1710 1120"
          stroke="url(#ribbon-warm)"
          strokeWidth="108"
        />
      </g>
    </svg>
  );
}
