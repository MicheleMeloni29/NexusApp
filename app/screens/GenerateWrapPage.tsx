"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FiMenu, FiMoon, FiSlash, FiSun, FiX } from "react-icons/fi";
import { VideoRecap } from "@/app/components/VideoRecap";
import { WrapStack } from "@/app/screens/WrapStack";
import PlayerCard from "@/app/screens/PlayerCard";
import FuzzyText from "@/app/components/UI/FuzzyText";
import type { UserStats } from "@/app/types";
import {
  buildProviderLoginUrl,
  disconnectProvider,
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

type GenerateWrapPageProps = {
  onFlowComplete?: (stats: UserStats | null) => void;
  onRecapUpdate?: (stats: UserStats | null) => void;
};

export default function GenerateWrapPage({ onFlowComplete, onRecapUpdate }: GenerateWrapPageProps) {
  const { language, setLanguage, t } = useLanguage();
  const searchParams = useSearchParams();
  const [isDark, setIsDark] = useState(true);
  const isItalian = language === "it";
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isWrapStackOpen, setIsWrapStackOpen] = useState(false);
  const [isVideoRecapOpen, setIsVideoRecapOpen] = useState(false);
  const [isPlayerCardOpen, setIsPlayerCardOpen] = useState(false);
  const [openPlayerAfterWrap, setOpenPlayerAfterWrap] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [availability, setAvailability] = useState<ProvidersAvailability | null>(null);
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
  const hasLinkedProviders = useMemo(
    () => PROVIDERS.some((provider) => linkedProviders[provider]),
    [linkedProviders]
  );
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
  const wrapMenuLabel = t("wrap.myWrap");
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
    if (!user) return;
    let isMounted = true;
    const loadRecap = async () => {
      try {
        const recap = await fetchRecap(user.user_id);
        if (isMounted) {
          setRecapStats(recap);
        }
      } catch (error) {
        console.error("Failed to load recap", error);
        if (isMounted) {
          setRecapStats(null);
        }
      }
    };
    void loadRecap();
    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    if (!onRecapUpdate) return;
    onRecapUpdate(recapStats ?? null);
  }, [onRecapUpdate, recapStats]);

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
    const nextUrl = `${window.location.origin}/`;
    const redirectUrl = buildProviderLoginUrl(provider, nextUrl);
    window.location.href = redirectUrl;
  };

  const handleDisconnect = async (provider: Provider) => {
    setErrorNotice(null);
    try {
      await disconnectProvider(provider);
      const updatedUser = await fetchCurrentUser();
      setUser(updatedUser);
      setStatusNotice({
        kind: "key",
        key: "accessPage.statusDisconnected",
        params: { provider: providerLabels[provider] },
      });
    } catch (error) {
      console.error("Failed to disconnect provider", error);
      setErrorNotice({
        kind: "key",
        key: "accessPage.disconnectFailed",
        params: { provider: providerLabels[provider] },
      });
    }
  };

  const handleGenerate = async () => {
    if (!user) return;
    setErrorNotice(null);
    const providersToSync = PROVIDERS.filter((provider) => linkedProviders[provider]);
    if (providersToSync.length === 0) {
      setErrorNotice({ kind: "key", key: "accessPage.selectAtLeastOne" });
      return;
    }
    setIsSyncing(true);
    try {
      for (const provider of providersToSync) {
        await syncProvider(provider, user.user_id);
      }
      const recap = await fetchRecap(user.user_id);
      setRecapStats(recap);
      setIsWrapStackOpen(false);
      setOpenPlayerAfterWrap(true);
      setIsVideoRecapOpen(true);
    } catch (error) {
      console.error("Failed to generate recap", error);
      setErrorNotice({ kind: "key", key: "accessPage.generateFailed" });
    } finally {
      setIsSyncing(false);
    }
  };

  const openWrapStack = () => {
    setIsVideoRecapOpen(false);
    setOpenPlayerAfterWrap(false);
    setIsWrapStackOpen(true);
    setIsAccountMenuOpen(false);
  };

  const handleClosePlayerCard = () => {
    setIsPlayerCardOpen(false);
    onFlowComplete?.(recapStats ?? null);
  };

  const topControls = (
    <div className="absolute top-4 right-4 z-20 flex gap-3">
      <button
        type="button"
        onClick={() => setIsDark((prev) => !prev)}
        aria-label={isDark ? t("theme.toLight") : t("theme.toDark")}
        className="flex h-8 w-8 xl:h-16 xl:w-16 items-center justify-center rounded-full border-1 border-[var(--brand-green)] bg-[rgba(var(--brand-white-rgb),0.05)] text-[var(--foreground)] transition hover:scale-105 hover:border-[var(--brand-green)] hover:text-[var(--brand-purple)]"
      >
        {isDark ? <FiSun size={18} /> : <FiMoon size={18} />}
      </button>
      <button
        type="button"
        onClick={() => setLanguage(isItalian ? "en" : "it")}
        aria-label={isItalian ? t("language.toEnglish") : t("language.toItalian")}
        className="flex h-8 w-8 xl:h-16 xl:w-16 items-center justify-center rounded-full border-1 border-[var(--brand-green)] text-xs xl:text-sm font-semibold uppercase text-[var(--foreground)] transition hover:scale-105 hover:border-[var(--brand-green)]"
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
          className="flex h-8 w-8 xl:h-16 xl:w-16 items-center justify-center rounded-full border-1 border-[var(--brand-green)] bg-[rgba(var(--brand-white-rgb),0.05)] text-[var(--foreground)] transition hover:scale-105 hover:border-[var(--brand-green)] hover:text-[var(--brand-purple)]"
        >
          <FiMenu size={20} />
        </button>
        {isAccountMenuOpen ? (
          <div
            ref={accountMenuRef}
            role="dialog"
            aria-label={accountMenuLabel}
            className="absolute left-0 mt-3 w-64 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 text-left text-[var(--card-foreground)] shadow-[0_20px_60px_rgba(var(--brand-black-rgb),0.35)]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[rgba(var(--foreground-rgb),0.6)]">
              {accountMenuLabel}
            </p>
            <div className="mt-3 space-y-2 text-sm text-[rgba(var(--foreground-rgb),0.75)]">
              <p>
                <span className="text-[rgba(var(--foreground-rgb),0.5)]">{emailLabel}:</span> {accountLabel}
              </p>
              {recapStats ? (
                <button
                  type="button"
                  onClick={openWrapStack}
                  className="w-full rounded-xl border border-[rgba(var(--foreground-rgb),0.2)] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-[rgba(var(--foreground-rgb),0.75)] transition hover:border-[var(--foreground)] hover:text-[var(--foreground)]"
                >
                  {wrapMenuLabel}
                </button>
              ) : null}
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
            color="#FF00FF" baseIntensity={0.16}
            hoverIntensity={0.25}>
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
          <FuzzyText fontSize="clamp(2.3rem,5vw,3rem)" color="#FF00FF" baseIntensity={0.16} hoverIntensity={0.32}>
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
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="inline-block">
              <FuzzyText
                fontSize="clamp(2.4rem,5vw,3.2rem)"
                color="#FF00FF"
                baseIntensity={0.18}
                hoverIntensity={0.31}
              >
                {t("common.appName")}
              </FuzzyText>
            </div>
            <p className="mt-6 text-[var(--brand-purple)]">
              {t("accessPage.publicProfileNote")}
            </p>
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
                className={`relative flex flex-col items-center gap-4 rounded-2xl border p-5 ${isLinked ? "border-[var(--brand-green)]" : "border-[var(--brand-purple)]"
                  } bg-[rgba(var(--foreground-rgb),0.04)]`}
              >
                {isLinked ? (
                  <div className="absolute right-3 top-3">
                    <div className="group relative">
                      <button
                        type="button"
                        onClick={() => handleDisconnect(provider)}
                        aria-label={t("accessPage.disconnectAria", { provider: label })}
                        className="flex h-8 w-8 items-center justify-center text-[var(--brand-purple)] transition hover:scale-105 hover:border-[var(--brand-green)] hover:bg-[var(--brand-green)] hover:text-[var(--brand-black)]"
                      >
                        <FiSlash size={20} />
                      </button>
                      <span className="pointer-events-none absolute right-10 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[rgba(var(--foreground-rgb),0.85)] opacity-0 transition group-hover:opacity-100">
                        {t("accessPage.disconnectHint", { provider: label })}
                      </span>
                    </div>
                  </div>
                ) : null}
                <div className="space-y-1">
                  <p className="text-base font-semibold uppercase tracking-[0.35em] text-[rgba(var(--foreground-rgb),0.7)]">
                    {label}
                  </p>
                  <p className="text-xs text-[rgba(var(--foreground-rgb),0.6)]">
                    {isLinked ? t("accessPage.verified") : t("accessPage.notVerified")}
                  </p>
                </div>
                {isLinked ? (
                  <button
                    type="button"
                    className="rounded-2xl bg-[var(--brand-green)] px-5 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-[var(--brand-black)]"
                  >
                    {t("accessPage.connected")}
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

        {/* SCRITTA PRE PULSANTE INFERIORE */}
        <p className={`text-xs text-[var(--brand-purple)]`}>{suggestionText}</p>

        {/* BOTTONE INFERIORE, SE COLLEGATO CORRETTAMENTE ALMENO AD UNA PIATTAFORMA STEAM/RIOT, GENERA IL WRAP */}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isSyncing || !hasLinkedProviders}
          className="w-full rounded-2xl bg-[var(--brand-green)] px-6 py-3 text-base font-semibold text-[var(--brand-black)] shadow-[0_20px_45px_rgba(var(--brand-green-rgb),0.25)] transition hover:-translate-y-0.5 hover:opacity-90 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSyncing ? t("accessPage.generating") : t("accessPage.generate")}
        </button>
      </div>

      {recapStats && isVideoRecapOpen ? (
        <VideoRecap
          stats={recapStats}
          onComplete={() => {
            setIsVideoRecapOpen(false);
            setOpenPlayerAfterWrap(true);
            setIsWrapStackOpen(true);
          }}
        />
      ) : null}

      {recapStats && isWrapStackOpen ? (
        <WrapStack
          stats={recapStats}
          onClose={() => {
            setIsWrapStackOpen(false);
            if (openPlayerAfterWrap) {
              setIsPlayerCardOpen(true);
              setOpenPlayerAfterWrap(false);
            }
          }}
        />
      ) : null}

      {recapStats && isPlayerCardOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[rgba(0,0,0,0.7)] px-4 py-10">
          <div className="relative w-full max-w-6xl">
            <button
              type="button"
              onClick={handleClosePlayerCard}
              aria-label={t("playerCard.close")}
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(var(--foreground-rgb),0.2)] bg-[rgba(var(--brand-black-rgb),0.35)] text-[var(--foreground)] backdrop-blur transition hover:scale-105 hover:border-[var(--brand-green)] hover:text-[var(--brand-purple)]"
            >
              <FiX size={18} />
            </button>
            <PlayerCard stats={recapStats} />
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={handleClosePlayerCard}
                className="rounded-2xl border border-[rgba(var(--foreground-rgb),0.2)] px-6 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-[rgba(var(--foreground-rgb),0.75)] transition hover:border-[var(--foreground)] hover:text-[var(--foreground)]"
              >
                {t("playerCard.continue")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
