import { Suspense } from "react";
import AccessoClient from "./AccessoClient";

export default function AccessoPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex items-center justify-center px-6 py-12">
          <p className="text-sm text-[rgba(var(--foreground-rgb),0.7)]">Caricamento in corso...</p>
        </main>
      }
    >
      <AccessoClient />
    </Suspense>
  );
}
