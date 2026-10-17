import Link from "next/link";
import { ChevronIcon, LockIcon } from "./Icons";

/** Amber link card asking an unprotected account to set a PIN. */
export function PinNudge({ className = "" }: { className?: string }) {
  return (
    <Link href="/me/pin" className={`px-3.5 py-3 rounded-xl bg-amber flex items-center gap-2.5 text-[13px] ${className}`}>
      <LockIcon />
      <span className="flex-1">
        <strong>Coins not protected.</strong> Set a PIN so you keep them on any phone.
      </span>
      <ChevronIcon />
    </Link>
  );
}
