"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { VideoRecap } from "@/app/components/VideoRecap";
import type { UserStats } from "@/app/types";
import {
  buildProviderLoginUrl,
  fetchCurrentUser,
  fetchProvidersAvailability,
  fetchRecap,
  logoutAccount,
  syncProvider,
  type AuthUser,
  type ProvidersAvailability,
} from "@/lib/api";

type Provider = "steam" | "riot";

const PROVIDERS: Provider[] = ["steam", "riot"];
const PROVIDER_LABELS: Record<Provider, string> = {
  steam: "Steam",
  riot: "Riot",
};

export default function AccessoPage() {
  const searchParams = useSearchParams();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [availability, setAvailability] = useState<ProvidersAvailability | null>(null);
  const [selectedProviders, setSelectedProviders] = useState<Record<Provider, boolean>>({
    steam: false,
    riot: false,
  });
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [recapStats, setRecapStats] = useState<UserStats | null>(null);

  const linkedProviders = useMemo(() => {
    return {
      steam: Boolean(user?.steam_connected),
      riot: Boolean(user?.riot_connected),
    };
  }, [user]);
  const accountLabel = user?.email ?? "Account demo";

  useEffect(() => {
    const provider = searchParams?.get("provider");
    if (provider === "steam" || provider === "riot") {
      setStatusMessage(`${PROVIDER_LABELS[provider]} collegato correttamente.`);
    }
  }, [searchParams]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const [currentUser, providers] = await Promise.all([
          fetchCurrentUser(),
          fetchProvidersAvailability(),
        ]);
        if (!isMounted) return;
        setUser(currentUser);
        setAvailability(providers);
      } catch (error) {
        console.error("Failed to load account data", error);
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    void load();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logoutAccount();
    } finally {
      window.location.href = "/";
    }
  };

  const handleLinkProvider = (provider: Provider) => {
    const providerAvailability = availability?.[provider];
    if (providerAvailability && !providerAvailability.enabled) {
      setErrorMessage(providerAvailability.reason ?? "Provider non disponibile.");
      return;
    }
    const nextUrl = `${window.location.origin}/accesso`;
    const redirectUrl = buildProviderLoginUrl(provider, nextUrl);
    window.location.href = redirectUrl;
  };

  const toggleProvider = (provider: Provider) => {
    if (!linkedProviders[provider]) {
      return;
    }
    setSelectedProviders((prev) => ({ ...prev, [provider]: !prev[provider] }));
  };

  const handleGenerate = async () => {
    if (!user) return;
    setErrorMessage("");
    const providersToSync = PROVIDERS.filter((provider) => selectedProviders[provider]);
    if (providersToSync.length === 0) {
      setErrorMessage("Seleziona almeno una piattaforma verificata.");
      return;
    }
    for (const provider of providersToSync) {
      if (!linkedProviders[provider]) {
        setErrorMessage(`Completa il login ${PROVIDER_LABELS[provider]} prima di continuare.`);
        return;
      }
    }
    setIsSyncing(true);
    try {
      for (const provider of providersToSync) {
        await syncProvider(provider, user.user_id);
      }
      const recap = await fetchRecap(user.user_id);
      setRecapStats(recap);
    } catch (error) {
      console.error("Failed to generate recap", error);
      setErrorMessage("Impossibile creare il wrap. Riprova.");
    } finally {
      setIsSyncing(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex items-center justify-center px-6 py-12">
        <p className="text-sm text-[rgba(var(--foreground-rgb),0.7)]">Caricamento in corso...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-xl rounded-[32px] border border-[rgba(var(--brand-white-rgb),0.2)] bg-[rgba(var(--brand-black-rgb),0.7)] p-8 text-center shadow-[0_40px_140px_rgba(0,0,0,0.35)]">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[rgba(var(--foreground-rgb),0.6)]">
            Accesso richiesto
          </p>
          <h1 className="mt-4 text-2xl xl:text-3xl font-semibold">Effettua l'accesso al tuo account</h1>
          <p className="mt-4 text-sm text-[rgba(var(--foreground-rgb),0.75)]">
            Non risulti autenticato. Torna alla home per accedere o creare un account.
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

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl rounded-[32px] border border-[rgba(var(--brand-white-rgb),0.2)] bg-[rgba(var(--brand-black-rgb),0.7)] p-8 shadow-[0_40px_140px_rgba(0,0,0,0.35)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[rgba(var(--foreground-rgb),0.6)]">
              Accesso confermato
            </p>
            <h1 className="mt-2 text-2xl xl:text-3xl font-semibold">Collega le piattaforme</h1>
            <p className="mt-2 text-sm text-[rgba(var(--foreground-rgb),0.75)]">Account: {accountLabel}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-2xl border border-[rgba(var(--foreground-rgb),0.2)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-[rgba(var(--foreground-rgb),0.7)] transition hover:border-[var(--foreground)] hover:text-[var(--foreground)]"
          >
            Esci
          </button>
        </div>

        {statusMessage ? (
          <p className="mt-4 text-sm text-[var(--brand-green)]">{statusMessage}</p>
        ) : null}
        {errorMessage ? (
          <p className="mt-2 text-sm text-[rgba(var(--brand-purple-rgb),0.9)]">{errorMessage}</p>
        ) : null}

        <div className="mt-6 space-y-4">
          {PROVIDERS.map((provider) => {
            const label = PROVIDER_LABELS[provider];
            const isLinked = linkedProviders[provider];
            const providerAvailability = availability?.[provider];
            const isEnabled = providerAvailability?.enabled ?? true;
            return (
              <div
                key={provider}
                className="flex flex-col gap-4 rounded-2xl border border-[rgba(var(--foreground-rgb),0.15)] bg-[rgba(var(--foreground-rgb),0.04)] p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[rgba(var(--foreground-rgb),0.7)]">
                    {label}
                  </p>
                  <p className="mt-1 text-sm text-[rgba(var(--foreground-rgb),0.75)]">
                    {isLinked ? "Verificato" : "Non verificato"}
                  </p>
                  {!isEnabled && providerAvailability?.reason ? (
                    <p className="mt-1 text-xs text-[rgba(var(--foreground-rgb),0.5)]">{providerAvailability.reason}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-3">
                  {isLinked ? (
                    <button
                      type="button"
                      onClick={() => toggleProvider(provider)}
                      className={`rounded-2xl px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] transition ${
                        selectedProviders[provider]
                          ? "bg-[var(--brand-green)] text-[var(--brand-black)]"
                          : "border border-[rgba(var(--foreground-rgb),0.2)] text-[rgba(var(--foreground-rgb),0.75)] hover:border-[var(--foreground)]"
                      }`}
                    >
                      {selectedProviders[provider] ? "Selezionato" : "Seleziona"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleLinkProvider(provider)}
                      disabled={!isEnabled}
                      className="rounded-2xl bg-[var(--brand-purple)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-[var(--brand-black)] transition hover:-translate-y-0.5 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Collega
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[rgba(var(--foreground-rgb),0.6)]">
            Seleziona le piattaforme verificate e genera il tuo wrap.
          </p>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isSyncing}
            className="rounded-2xl bg-[var(--brand-green)] px-6 py-3 text-sm font-semibold text-[var(--brand-black)] shadow-[0_20px_45px_rgba(var(--brand-green-rgb),0.25)] transition hover:-translate-y-0.5 hover:opacity-90 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSyncing ? "Generazione in corso..." : "Genera il wrap"}
          </button>
        </div>
      </div>

      {recapStats && <VideoRecap stats={recapStats} onComplete={() => setRecapStats(null)} />}
    </main>
  );
}
