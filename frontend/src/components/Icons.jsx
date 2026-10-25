function Svg({ children, size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export function IconLogo({ size = 18 }) {
  return (
    <Svg size={size}>
      <path d="M4 16V9" />
      <path d="M9 16V6" />
      <path d="M14 16v-4" />
      <path d="M19 16V8" />
    </Svg>
  )
}

export function IconGrid() {
  return (
    <Svg>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.6" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.6" />
    </Svg>
  )
}

export function IconList() {
  return (
    <Svg>
      <path d="M9 6h11" />
      <path d="M9 12h11" />
      <path d="M9 18h11" />
      <path d="M4 6h.01" />
      <path d="M4 12h.01" />
      <path d="M4 18h.01" />
    </Svg>
  )
}

export function IconUsers() {
  return (
    <Svg>
      <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="9.5" cy="7.5" r="3" />
      <path d="M21 21v-2a3.6 3.6 0 0 0-2.8-3.5" />
      <path d="M16.2 4.6a3 3 0 0 1 0 5.6" />
    </Svg>
  )
}

export function IconChart() {
  return (
    <Svg>
      <path d="M12 3.5a8.5 8.5 0 1 0 8.5 8.5H12V3.5z" />
      <path d="M14.5 3.8a8.5 8.5 0 0 1 5.7 5.7H14.5V3.8z" />
    </Svg>
  )
}

export function IconSettings() {
  return (
    <Svg>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2" />
      <path d="M12 18.5v2" />
      <path d="M3.5 12h2" />
      <path d="M18.5 12h2" />
      <path d="m5.4 5.4 1.4 1.4" />
      <path d="m17.2 17.2 1.4 1.4" />
      <path d="m18.6 5.4-1.4 1.4" />
      <path d="m6.8 17.2-1.4 1.4" />
    </Svg>
  )
}

export function IconArrowOut() {
  return (
    <Svg size={16}>
      <path d="M7 17 17 7" />
      <path d="M9 7h8v8" />
    </Svg>
  )
}

export function IconArrowIn() {
  return (
    <Svg size={16}>
      <path d="m17 7-10 10" />
      <path d="M15 17H7V9" />
    </Svg>
  )
}

export function IconPlus() {
  return (
    <Svg size={16}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </Svg>
  )
}

export function IconChevron() {
  return (
    <Svg size={14}>
      <path d="m6 9 6 6 6-6" />
    </Svg>
  )
}

export function IconTrend() {
  return (
    <Svg size={14}>
      <path d="M4 14 10 8l3 3 7-7" />
      <path d="M14 4h6v6" />
    </Svg>
  )
}

export function IconDots() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="6" cy="12" r="1.5" fill="currentColor" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <circle cx="18" cy="12" r="1.5" fill="currentColor" />
    </svg>
  )
}

export function IconEye({ off = false }) {
  return (
    <Svg size={18}>
      {off ? (
        <>
          <path d="M4 4l16 16" />
          <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
          <path d="M9.9 5.2A10 10 0 0 1 12 5c5.2 0 8.8 4.2 9.8 6.2a11 11 0 0 1-3.2 4.1" />
          <path d="M6.7 6.8C4.6 8.2 3 10.2 2.2 11.2A11 11 0 0 0 8.2 16.6" />
        </>
      ) : (
        <>
          <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z" />
          <circle cx="12" cy="12" r="2.5" />
        </>
      )}
    </Svg>
  )
}

export function IconCheck() {
  return (
    <Svg size={14}>
      <path d="m5 12 4.2 4.2L19 7" />
    </Svg>
  )
}

export function IconMenu() {
  return (
    <Svg size={20}>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </Svg>
  )
}
