import type { GameId } from "@/lib/games";

const TINT: Record<GameId, string> = {
  zip: "bg-green-tint",
  pipes: "bg-blue-tint",
  flash: "bg-amber",
};

export function GameIcon({ id, size = 52 }: { id: GameId; size?: number }) {
  const inner = Math.round(size * 0.58);
  return (
    <div className={`${TINT[id]} shrink-0 rounded-xl flex items-center justify-center`} style={{ width: size, height: size }}>
      {id === "zip" && (
        <svg width={inner} height={inner} viewBox="0 0 30 30" aria-hidden="true">
          <path d="M5 5h8v8H5zM17 5h8v8h-8zM5 17h8v8H5zM17 17h8v8h-8z" fill="#FFFFFF" stroke="#1D7A4A" strokeWidth="1.5" />
          <path d="M9 9h12v12" fill="none" stroke="#1D7A4A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {id === "pipes" && (
        <svg width={inner} height={inner} viewBox="0 0 30 30" aria-hidden="true">
          <path d="M4 15h10a3 3 0 0 1 3 3v8" fill="none" stroke="#2563EB" strokeWidth="5" strokeLinecap="round" />
          <path d="M17 4v7" fill="none" stroke="#9AA3AE" strokeWidth="5" strokeLinecap="round" />
        </svg>
      )}
      {id === "flash" && (
        <svg width={inner} height={inner} viewBox="0 0 30 30" aria-hidden="true">
          <rect x="3" y="3" width="7" height="7" rx="2" fill="#F2B300" />
          <rect x="11.5" y="3" width="7" height="7" rx="2" fill="#D9D6CC" />
          <rect x="20" y="3" width="7" height="7" rx="2" fill="#D9D6CC" />
          <rect x="3" y="11.5" width="7" height="7" rx="2" fill="#D9D6CC" />
          <rect x="11.5" y="11.5" width="7" height="7" rx="2" fill="#F2B300" />
          <rect x="20" y="11.5" width="7" height="7" rx="2" fill="#D9D6CC" />
          <rect x="3" y="20" width="7" height="7" rx="2" fill="#D9D6CC" />
          <rect x="11.5" y="20" width="7" height="7" rx="2" fill="#D9D6CC" />
          <rect x="20" y="20" width="7" height="7" rx="2" fill="#F2B300" />
        </svg>
      )}
    </div>
  );
}
