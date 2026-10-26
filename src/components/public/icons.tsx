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

// clinic logo: a cross in a rounded square
export function LogoMark({ className = "h-10 w-10 bg-navy text-white" }: { className?: string }) {
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-lg ${className}`}>
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
        <path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6z" />
      </svg>
    </span>
  );
}
