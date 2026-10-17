import { CheckIcon } from "../Icons";

/** Green check, "Solved", the big number, and one line of context. */
export function SolvedHero({ title, big, line }: { title: string; big: string; line: string }) {
  return (
    <div className="pt-8 flex flex-col items-center text-center">
      <div className="pop w-[72px] h-[72px] rounded-full bg-green flex items-center justify-center">
        <CheckIcon size={36} stroke="#FFFFFF" />
      </div>
      <h1 className="display text-[30px] mt-4">{title}</h1>
      <div className="display tnum text-[44px] mt-1 leading-none">{big}</div>
      <div className="text-sm text-muted mt-2">{line}</div>
    </div>
  );
}
