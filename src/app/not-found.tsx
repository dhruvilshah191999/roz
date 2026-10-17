import Link from "next/link";

export default function NotFound() {
  return (
    <main className="col flex flex-col items-center justify-center text-center px-5 gap-4">
      <h1 className="display text-[28px] m-0">Nothing here</h1>
      <p className="text-sm text-muted m-0">That page does not exist.</p>
      <Link href="/" className="btn btn-primary w-full max-w-60">
        Back to today
      </Link>
    </main>
  );
}
