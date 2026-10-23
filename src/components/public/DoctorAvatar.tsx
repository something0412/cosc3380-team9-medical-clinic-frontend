// initials in place of a photo, since we have no verified doctor portraits
export function DoctorAvatar({ firstName, lastName, className = "h-12 w-12 text-base" }: { firstName: string; lastName: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full bg-slate-100 font-semibold tracking-wide text-navy ring-1 ring-slate-200 ${className}`}
    >
      {`${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()}
    </span>
  );
}
