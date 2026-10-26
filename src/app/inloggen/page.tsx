import { LoginForm } from "@/components/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ info?: string }>;
}) {
  const { info } = await searchParams;
  return (
    <main className="mx-auto max-w-[460px] px-6 py-16">
      <h1 className="text-h2 mb-1">Inloggen</h1>
      <p className="text-muted mb-7">Welkom terug bij Snufsnuf.</p>
      <LoginForm info={info === "bevestig"} />
    </main>
  );
}
