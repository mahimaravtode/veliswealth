interface FinLeapLogoProps {
  className?: string;
}

export function FinLeapLogo({ className = "h-5 w-5" }: FinLeapLogoProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect x="1" y="1" width="30" height="30" rx="7" fill="currentColor" opacity="0.15" />
      <rect x="1" y="1" width="30" height="30" rx="7" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
      <path
        d="M9 10.5h10M9 14h8c2.5 0 4.5 1.5 4.5 4s-2 4-4.5 4H9M12 8l-3 4M12 8l3 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11 24c0 1.5 1.5 3 4 3s4-1.5 4-3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}
