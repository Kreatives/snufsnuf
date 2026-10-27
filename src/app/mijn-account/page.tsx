import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { AccountForm } from "@/components/account-form";

export default async function MijnAccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/inloggen");

  return (
    <main className="mx-auto max-w-[560px] px-6 py-14">
      <h1 className="text-h2 mb-1">Mijn account</h1>
      <p className="text-muted mb-7">
        Je contactgegevens vullen we automatisch in bij een boeking.
      </p>
      <AccountForm name={user.name ?? ""} email={user.email ?? ""} phone={user.phone ?? ""} />
    </main>
  );
}
