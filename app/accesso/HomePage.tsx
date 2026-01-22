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
import { useLanguage } from "@/app/components/LanguageProvider";

type Provider = "steam" | "riot";

const PROVIDERS: Provider[] = ["steam", "riot"];

type Notice =
  | { kind: "key"; key: string; params?: Record<string, string | number> }
  | { kind: "message"; message: string };

export default function HomePage() {
  const { language, setLanguage, t } = useLanguage();
  const searchParams = useSearchParams();
  const [isDark, setIsDark] = useState(true);
  const isItalian = language === "it";
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [availability, setAvailability] = useState<ProvidersAvailability | null>(null);
  const [selectedProviders, setSelectedProviders] = useState<Record<Provider, boolean>>({
    steam: false,
    riot: false,
  });
  const [statusNotice, setStatusNotice] = useState<Notice | null>(null);
  const [errorNotice, setErrorNotice] = useState<Notice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [recapStats, setRecapStats] = useState<UserStats | null>(null);

  const linkedProviders = useMemo(() => {
    return {
      steam: Boolean(user?.steam_connected),
      riot: Boolean(user?.riot_connected),
    };
  }, [user]);
  const providerLabels = useMemo(
    () => ({
      steam: t("providers.steam"),
      riot: t("providers.riot"),
    }),
    [t]
  );
  const accountLabel = user?.email ?? t("common.accountDemo");
  const accountMenuLabel = t("common.account");
  const logoutLabel = t("common.logout");
  const emailLabel = t("common.email");
  const idLabel = t("common.id");
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const accountButtonRef = useRef<HTMLButtonElement | null>(null);
  const statusMessage = statusNotice
    ? statusNotice.kind === "message"
      ? statusNotice.message
      : t(statusNotice.key, statusNotice.params)
    : "";
  const errorMessage = errorNotice
    ? errorNotice.kind === "message"
      ? errorNotice.message
      : t(errorNotice.key, errorNotice.params)
    : "";
  const suggestionText =
    errorMessage || statusMessage || t("accessPage.suggestionDefault");
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
      setStatusNotice({
        kind: "key",
        key: "accessPage.statusConnected",
        params: { provider: providerLabels[provider] },
      });
    }
  }, [searchParams, providerLabels]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setIsLoading(true);
      setErrorNotice(null);
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
      if (providerAvailability.reason) {
        setErrorNotice({ kind: "message", message: providerAvailability.reason });
      } else {
        setErrorNotice({ kind: "key", key: "accessPage.providerUnavailable" });
      }
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
    setErrorNotice(null);
    const providersToSync = PROVIDERS.filter((provider) => selectedProviders[provider]);
    if (providersToSync.length === 0) {
      setErrorNotice({ kind: "key", key: "accessPage.selectAtLeastOne" });
      return;
    }
    for (const provider of providersToSync) {
      if (!linkedProviders[provider]) {
        setErrorNotice({
          kind: "key",
          key: "accessPage.completeLogin",
          params: { provider: providerLabels[provider] },
        });
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
      setErrorNotice({ kind: "key", key: "accessPage.generateFailed" });
    } finally {
      setIsSyncing(false);
    }
  };

  const topControls = (
    <div className="absolute top-4 right-4 z-20 flex gap-3">
      <button
        type="button"
        onClick={() => setIsDark((prev) => !prev)}
        aria-label={isDark ? t("theme.toLight") : t("theme.toDark")}
        className="flex h-8 w-8 xl:h-16 xl:w-16 items-center justify-center rounded-full border-2 border-[rgba(var(--brand-green-rgb),0.25)] bg-[rgba(var(--brand-white-rgb),0.05)] text-[var(--foreground)] transition hover:scale-105 hover:border-[var(--brand-purple)] hover:text-[var(--brand-purple)]"
      >
        {isDark ? <FiSun size={18} /> : <FiMoon size={18} />}
      </button>
      <button
        type="button"
        onClick={() => setLanguage(isItalian ? "en" : "it")}
        aria-label={isItalian ? t("language.toEnglish") : t("language.toItalian")}
        className="flex h-8 w-8 xl:h-16 xl:w-16 items-center justify-center rounded-full border-2 border-[rgba(var(--brand-green-rgb),0.25)] text-xs xl:text-sm font-semibold uppercase text-[var(--foreground)] transition hover:scale-105 hover:border-[var(--brand-purple)]"
      >
        {isItalian ? t("language.codeIt") : t("language.codeEn")}
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
          className="flex h-8 w-8 xl:h-16 xl:w-16 items-center justify-center rounded-full border-2 border-[rgba(var(--brand-green-rgb),0.25)] bg-[rgba(var(--brand-white-rgb),0.05)] text-[var(--foreground)] transition hover:scale-105 hover:border-[var(--brand-purple)] hover:text-[var(--brand-purple)]"
        >
          <FiMenu size={20} />
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
          <FuzzyText
            fontSize="clamp(2.1rem,5vw,3rem)"
            color="#FF00FF" baseIntensity={0.2}
            hoverIntensity={0.35}>
            {t("common.appName")}
          </FuzzyText>
          <p className="text-sm text-[rgba(var(--foreground-rgb),0.7)]">{t("common.loading")}</p>
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
            {t("common.appName")}
          </FuzzyText>
          <p className="text-sm text-[rgba(var(--foreground-rgb),0.7)]">
            {t("common.accessRequired")}
          </p>
          <Link
            href="/"
            className="rounded-2xl border border-[rgba(var(--foreground-rgb),0.2)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-[rgba(var(--foreground-rgb),0.7)] transition hover:border-[var(--foreground)] hover:text-[var(--foreground)]"
          >
            {t("common.backToHome")}
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
              {t("common.appName")}
            </FuzzyText>
          </div>
        </div>

        <div className="space-y-5">
          {PROVIDERS.map((provider) => {
            const label = providerLabels[provider];
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
                    {isLinked ? t("accessPage.verified") : t("accessPage.notVerified")}
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
                    {selectedProviders[provider]
                      ? t("accessPage.selected")
                      : t("accessPage.select")}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleLinkProvider(provider)}
                    disabled={!isEnabled}
                    className="rounded-2xl bg-[var(--brand-purple)] px-5 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-[var(--brand-black)] transition hover:-translate-y-0.5 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {t("accessPage.connect")}
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
          {isSyncing ? t("accessPage.generating") : t("accessPage.generate")}
        </button>
      </div>

      {recapStats && <VideoRecap stats={recapStats} onComplete={() => setRecapStats(null)} />}
    </main>
  );
}
