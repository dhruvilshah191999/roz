type P = { size?: number; className?: string };

export function CoinIcon({ size = 18, className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" aria-hidden="true" className={className}>
      <circle cx="9" cy="9" r="8" fill="#F2B300" />
      <circle cx="9" cy="9" r="5" fill="none" stroke="#141414" strokeWidth="1.5" />
    </svg>
  );
}

export function FlameIcon({ size = 18, className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" aria-hidden="true" className={className}>
      <path d="M9 2c1 3 4 4 4 8a4 4 0 0 1-8 0c0-2 1-3 1-3 0 1 1 2 2 2 0-3-1-4 1-7z" fill="#E4572E" />
    </svg>
  );
}

export function CheckIcon({ size = 14, className, stroke = "#1D7A4A" }: P & { stroke?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" aria-hidden="true" className={className}>
      <path d="M2 7l3.5 3.5L12 4" fill="none" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronIcon({ size = 16, className, stroke = "#141414" }: P & { stroke?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" className={className}>
      <path d="M6 3l5 5-5 5" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BackIcon({ size = 20, className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" aria-hidden="true" className={className}>
      <path d="M13 4l-7 7 7 7" fill="none" stroke="#141414" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BulbIcon({ size = 20, className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true" className={className}>
      <path d="M10 2a6 6 0 0 0-3 11.2V15h6v-1.8A6 6 0 0 0 10 2zM8 17h4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LockIcon({ size = 20, className, stroke = "#9A6700" }: P & { stroke?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true" className={className}>
      <rect x="4" y="9" width="12" height="9" rx="2" fill="none" stroke={stroke} strokeWidth="1.8" />
      <path d="M7 9V6a3 3 0 0 1 6 0v3" fill="none" stroke={stroke} strokeWidth="1.8" />
    </svg>
  );
}

export function ShieldIcon({ size = 16, className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" className={className}>
      <path d="M8 1.5l5 2v4c0 3-2.2 5.3-5 6.5-2.8-1.2-5-3.5-5-6.5v-4l5-2z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}
