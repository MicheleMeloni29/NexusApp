"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FiMenu, FiMoon, FiSun } from "react-icons/fi";
import { VideoRecap } from "@/app/components/VideoRecap";
import FuzzyText from "@/components/FuzzyText";
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

export default function HomePage() {
  const searchParams = useSearchParams();
  const [isDark, setIsDark] = useState(true);
  const [isItalian, setIsItalian] = useState(true);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
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
  const accountMenuLabel = isItalian ? "Account" : "Account";
  const logoutLabel = isItalian ? "Esci" : "Log out";
  const emailLabel = "Email";
  const idLabel = "ID";
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const accountButtonRef = useRef<HTMLButtonElement | null>(null);
  const suggestionText =
    errorMessage ||
    statusMessage ||
    "Seleziona le piattaforme verificate e genera il tuo wrap.";
  const suggestionTone = errorMessage
    ? "text-[rgba(var(--brand-purple-rgb),0.9)]"
    : statusMessage
      ? "text-[var(--brand-green)]"
      : "text-[rgba(var(--foreground-rgb),0.6)]";

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", isDark);
    root.classList.toggle("light", !isDark);
  }, [isDark]);

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

  useEffect(() => {
    if (!isAccountMenuOpen) return;
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (accountMenuRef.current?.contains(target) || accountButtonRef.current?.contains(target)) {
        return;
      }
      setIsAccountMenuOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsAccountMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isAccountMenuOpen]);

  const handleLogout = async () => {
    try {
      setIsAccountMenuOpen(false);
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

  const topControls = (
    <div className="absolute top-4 right-4 z-20 flex gap-3">
      <button
        type="button"
        onClick={() => setIsDark((prev) => !prev)}
        aria-label={isDark ? "Passa al tema chiaro" : "Passa al tema scuro"}
        className="flex h-6 w-6 xl:h-12 xl:w-12 items-center justify-center rounded-full border-2 border-[rgba(var(--brand-green-rgb),0.25)] bg-[rgba(var(--brand-white-rgb),0.05)] text-[var(--foreground)] transition hover:scale-105 hover:border-[var(--brand-purple)] hover:text-[var(--brand-purple)]"
      >
        {isDark ? <FiSun size={14} /> : <FiMoon size={14} />}
      </button>
      <button
        type="button"
        onClick={() => setIsItalian((prev) => !prev)}
        aria-label={isItalian ? "Passa alla lingua inglese" : "Passa alla lingua italiana"}
        className="flex h-6 w-6 xl:h-12 xl:w-12 items-center justify-center rounded-full border-2 border-[rgba(var(--brand-green-rgb),0.25)] text-xs xl:text-sm font-semibold uppercase text-[var(--foreground)] transition hover:scale-105 hover:border-[var(--brand-purple)]"
      >
        {isItalian ? "IT" : "EN"}
      </button>
    </div>
  );
  const accountMenuButton = user ? (
    <div className="absolute top-4 left-4 z-20">
      <div className="relative">
        <button
          type="button"
          ref={accountButtonRef}
          onClick={() => setIsAccountMenuOpen((prev) => !prev)}
          aria-label={accountMenuLabel}
          aria-haspopup="dialog"
          aria-expanded={isAccountMenuOpen}
          className="flex h-6 w-6 xl:h-12 xl:w-12 items-center justify-center rounded-full border-2 border-[rgba(var(--brand-green-rgb),0.25)] bg-[rgba(var(--brand-white-rgb),0.05)] text-[var(--foreground)] transition hover:scale-105 hover:border-[var(--brand-purple)] hover:text-[var(--brand-purple)]"
        >
          <FiMenu size={16} />
        </button>
        {isAccountMenuOpen ? (
          <div
            ref={accountMenuRef}
            role="dialog"
            aria-label={accountMenuLabel}
            className="absolute left-0 mt-3 w-64 rounded-2xl border border-[rgba(var(--foreground-rgb),0.2)] bg-[rgba(var(--brand-black-rgb),0.92)] p-4 text-left shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[rgba(var(--foreground-rgb),0.6)]">
              {accountMenuLabel}
            </p>
            <div className="mt-3 space-y-2 text-sm text-[rgba(var(--foreground-rgb),0.75)]">
              <p>
                <span className="text-[rgba(var(--foreground-rgb),0.5)]">{emailLabel}:</span> {accountLabel}
              </p>
              <p>
                <span className="text-[rgba(var(--foreground-rgb),0.5)]">{idLabel}:</span> {user.user_id}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-4 w-full rounded-2xl border border-[rgba(var(--foreground-rgb),0.2)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-[rgba(var(--foreground-rgb),0.7)] transition hover:border-[var(--foreground)] hover:text-[var(--foreground)]"
            >
              {logoutLabel}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  ) : null;

  if (isLoading) {
    return (
      <main className="relative min-h-screen bg-[var(--background)] text-[var(--foreground)] flex items-center justify-center px-6 py-12">
        {topControls}
        {accountMenuButton}
        <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
          <FuzzyText fontSize="clamp(2.1rem,5vw,3rem)" color="#FF00FF" baseIntensity={0.2} hoverIntensity={0.35}>
            NexusApp
          </FuzzyText>
          <p className="text-sm text-[rgba(var(--foreground-rgb),0.7)]">Caricamento in corso...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="relative min-h-screen bg-[var(--background)] text-[var(--foreground)] flex items-center justify-center px-6 py-12">
        {topControls}
        {accountMenuButton}
        <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
          <FuzzyText fontSize="clamp(2.1rem,5vw,3rem)" color="#FF00FF" baseIntensity={0.2} hoverIntensity={0.35}>
            NexusApp
          </FuzzyText>
          <p className="text-sm text-[rgba(var(--foreground-rgb),0.7)]">
            Accesso richiesto. Torna alla home per accedere.
          </p>
          <Link
            href="/"
            className="rounded-2xl border border-[rgba(var(--foreground-rgb),0.2)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-[rgba(var(--foreground-rgb),0.7)] transition hover:border-[var(--foreground)] hover:text-[var(--foreground)]"
          >
            Torna alla home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-[var(--background)] text-[var(--foreground)] flex items-center justify-center px-6 py-12">
      {topControls}
      {accountMenuButton}
      <div className="w-full max-w-xl space-y-8 text-center">
        <div className="flex w-full justify-center">
          <div className="inline-block">
            <FuzzyText
              fontSize="clamp(2.4rem,5vw,3.2rem)"
              color="#FF00FF"
              baseIntensity={0.2}
              hoverIntensity={0.35}
            >
              NexusApp
            </FuzzyText>
          </div>
        </div>

        <div className="space-y-5">
          {PROVIDERS.map((provider) => {
            const label = PROVIDER_LABELS[provider];
            const isLinked = linkedProviders[provider];
            const providerAvailability = availability?.[provider];
            const isEnabled = providerAvailability?.enabled ?? true;
            return (
              <div
                key={provider}
                className="flex flex-col items-center gap-4 rounded-2xl border border-[rgba(var(--foreground-rgb),0.18)] bg-[rgba(var(--foreground-rgb),0.04)] p-5"
              >
                <div className="space-y-1">
                  <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[rgba(var(--foreground-rgb),0.7)]">
                    {label}
                  </p>
                  <p className="text-xs text-[rgba(var(--foreground-rgb),0.6)]">
                    {isLinked ? "Verificato" : "Non verificato"}
                  </p>
                </div>
                {isLinked ? (
                  <button
                    type="button"
                    onClick={() => toggleProvider(provider)}
                    className={`rounded-2xl px-5 py-2 text-xs font-semibold uppercase tracking-[0.35em] transition ${
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
                    className="rounded-2xl bg-[var(--brand-purple)] px-5 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-[var(--brand-black)] transition hover:-translate-y-0.5 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Collega
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <p className={`text-xs ${suggestionTone}`}>{suggestionText}</p>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isSyncing}
          className="w-full rounded-2xl bg-[var(--brand-green)] px-6 py-3 text-sm font-semibold text-[var(--brand-black)] shadow-[0_20px_45px_rgba(var(--brand-green-rgb),0.25)] transition hover:-translate-y-0.5 hover:opacity-90 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSyncing ? "Generazione in corso..." : "Genera il wrap"}
        </button>
      </div>

      {recapStats && <VideoRecap stats={recapStats} onComplete={() => setRecapStats(null)} />}
    </main>
  );
}
