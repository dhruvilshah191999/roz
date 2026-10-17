import { PinForm } from "@/components/PinForm";
import { PlayBar } from "@/components/PlayBar";
import { summarise } from "@/lib/accounts";
import { getAccount } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function PinPage() {
  const account = await getAccount();
  const me = summarise(account);
  return (
    <main className="col">
      <PlayBar backHref="/me" backLabel="Me" title={me.isProtected ? "Change PIN" : "Protect coins"} />
      <PinForm code={me.code} isProtected={me.isProtected} />
    </main>
  );
}
