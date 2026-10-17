import { PlayBar } from "@/components/PlayBar";
import { RestoreForm } from "@/components/RestoreForm";
import { summarise } from "@/lib/accounts";
import { getAccount } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function RestorePage() {
  const account = await getAccount();
  const me = summarise(account);
  return (
    <main className="col">
      <PlayBar backHref="/" backLabel="Today" title="Restore" />
      <RestoreForm localCoins={me.balance} localProtected={me.isProtected} />
    </main>
  );
}
