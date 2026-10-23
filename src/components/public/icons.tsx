// simple outline icons for the public site
const PATHS = {
  calendar: "M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM4 10h16M8 3v4M16 3v4M8 14h3",
  doctor: "M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0M12 15v4M10 17h4",
  pin: "M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12zM12 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  stethoscope: "M6 3v5a5 5 0 0 0 10 0V3M11 13v2a5 5 0 0 0 10 0v-2M21 13a2 2 0 1 0-4 0",
  heart: "M12 20s-7.5-4.6-9.2-9.4A5 5 0 0 1 12 6.6a5 5 0 0 1 9.2 4C19.5 15.4 12 20 12 20z",
  pulse: "M3 12h4l3-7 4 14 3-7h4",
  drop: "M12 3s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11z",
  arrow: "M5 12h14M13 6l6 6-6 6",
  check: "M5 12.5l4.5 4.5L19 7.5",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM5 20a7 7 0 0 1 14 0",
  people: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14a6.5 6.5 0 0 1 3.5 6",
  link: "M9 15l6-6M10.5 6.5l1.8-1.8a4 4 0 0 1 5.7 5.7l-1.8 1.8M13.5 17.5l-1.8 1.8a4 4 0 0 1-5.7-5.7l1.8-1.8",
};

export type IconName = keyof typeof PATHS;

export function Icon({ name, className = "h-6 w-6" }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}

// clinic logo: a cross in a rounded square
export function LogoMark({ className = "h-10 w-10 bg-navy text-white" }: { className?: string }) {
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-xl ${className}`}>
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
        <path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6z" />
      </svg>
    </span>
  );
}
