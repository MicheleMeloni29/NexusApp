import Link from "next/link";

type AccessoPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

const TRUTHY_VALUES = new Set(["1", "true", "ok", "success", "si", "yes"]);

const normalizeValues = (value: string | string[] | undefined) => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

const isTruthy = (value: string) => TRUTHY_VALUES.has(value.trim().toLowerCase());

export default function AccessoPage({ searchParams }: AccessoPageProps) {
  const platformSet = new Set<string>();
  const providerValues = normalizeValues(searchParams?.provider).map((value) => value.toLowerCase());

  if (normalizeValues(searchParams?.steam).some(isTruthy) || providerValues.includes("steam")) {
    platformSet.add("Steam");
  }
  if (normalizeValues(searchParams?.riot).some(isTruthy) || providerValues.includes("riot")) {
    platformSet.add("Riot");
  }
  if (providerValues.includes("both") || providerValues.includes("all")) {
    platformSet.add("Steam");
    platformSet.add("Riot");
  }

  const platforms = ["Steam", "Riot"].filter((name) => platformSet.has(name));
  const hasAccess = platforms.length > 0;

  let message = "Nessun accesso valido rilevato. Completa l'accesso a Steam o Riot per vedere la conferma.";
  if (platforms.length === 1) {
    message = `Accesso completato correttamente su ${platforms[0]}.`;
  } else if (platforms.length === 2) {
    message = "Accesso completato correttamente su Steam e Riot.";
  }

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-xl rounded-[32px] border border-[rgba(var(--brand-white-rgb),0.2)] bg-[rgba(var(--brand-black-rgb),0.7)] p-8 text-center shadow-[0_40px_140px_rgba(0,0,0,0.35)]">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[rgba(var(--foreground-rgb),0.6)]">
          Pagina di prova
        </p>
        <h1 className="mt-4 text-2xl xl:text-3xl font-semibold">
          {hasAccess ? "Accesso confermato" : "Accesso non verificato"}
        </h1>
        <p className="mt-4 text-sm text-[rgba(var(--foreground-rgb),0.75)]">{message}</p>
        <p className="mt-6 text-xs text-[rgba(var(--foreground-rgb),0.5)]">
          Parametri di test: /accesso?steam=1&amp;riot=1
        </p>
        <div className="mt-8 flex justify-center">
          <Link
            href="/"
            className="rounded-2xl border border-[rgba(var(--foreground-rgb),0.2)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-[rgba(var(--foreground-rgb),0.7)] transition hover:border-[var(--foreground)] hover:text-[var(--foreground)]"
          >
            Torna alla home
          </Link>
        </div>
      </div>
    </main>
  );
}
