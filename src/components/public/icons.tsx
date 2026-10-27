// arrow for public text links
export function ArrowIcon({ className = "h-4 w-4" }: { className?: string }) {
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
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

// clinic logo: a lambda in a rounded square (lambda icon from Lucide, ISC license, lucide.dev)
export function LogoMark({ className = "h-10 w-10 bg-navy text-white" }: { className?: string }) {
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-lg ${className}`}>
      <svg
        viewBox="0 0 24 24"
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M11.38 10 5 20" />
        <path d="M19 18a2 2 0 01-2 2c-4.87-.003-5.052-16-10-16a2 2 0 00-2 2" />
      </svg>
    </span>
  );
}
