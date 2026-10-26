import { RegisterForm } from "@/components/register-form";

export default function RegisterPage() {
  return (
    <main className="mx-auto max-w-[460px] px-6 py-16">
      <h1 className="text-h2 mb-1">Account aanmaken</h1>
      <p className="text-muted mb-7">
        Eén account voor baasjes die zorg zoeken, of voor bedrijven die zorg aanbieden.
      </p>
      <RegisterForm />
    </main>
  );
}
