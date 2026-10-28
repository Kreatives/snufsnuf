import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";

import { AccountForm } from "@/components/account-form";

export default async function InstellingenPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/inloggen");
  if (user.role !== "aanbieder") redirect("/mijn-dieren");

  return (
    <div className="max-w-[560px] flex flex-col gap-6">
      <div>
        <h1 className="text-h2">Instellingen</h1>
        <p className="text-muted text-[0.9375rem] mt-1">Je persoonlijke accountgegevens.</p>
      </div>
      <AccountForm name={user.name ?? ""} email={user.email ?? ""} phone={user.phone ?? ""} />
    </div>
  );
}
