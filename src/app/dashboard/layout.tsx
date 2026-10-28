import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getOwnedProviders, getOwnedProvider } from "@/lib/data";
import { DashboardSidebar } from "@/components/dashboard-sidebar";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const user = await getCurrentUser();
  if (!user) redirect("/inloggen");
  if (user.role !== "aanbieder") redirect("/mijn-dieren");

  const [salons, active] = await Promise.all([getOwnedProviders(), getOwnedProvider()]);

  // Zonder salon (onboarding) geen sidebar.
  if (!active) {
    return <>{children}</>;
  }

  return (
    <div className="flex">
      <DashboardSidebar
        salons={salons.map((s) => ({ id: s.id, name: s.name }))}
        activeId={active.id}
        activeName={active.name}
        userEmail={user.email ?? ""}
      />
      <div className="flex-1 min-w-0 px-6 sm:px-8 py-8 max-w-[1200px]">{children}</div>
    </div>
  );
}
