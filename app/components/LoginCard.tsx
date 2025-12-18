"use client";

import { fetchRecap } from "@/lib/api";
import type { UserStats } from "@/app/types";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";

const PROVIDERS = ["steam", "riot"] as const;

type Provider = (typeof PROVIDERS)[number];

type ProviderCopy = {
  idLabel: string;
  idPlaceholder: string;
  codeLabel: string;
  codePlaceholder: string;
  submitLabel: string;
  helpText: string;
  statusText: string;
};

const PROVIDER_CONFIG: Record<Provider, ProviderCopy> = {
  steam: {
    idLabel: "Steam ID or Vanity URL",
    idPlaceholder: "es. 7656119...",
    codeLabel: "Steam Guard code",
    codePlaceholder: "ABCDE",
    submitLabel: "Continua on Steam",
    helpText: "We'll take you to steamcommunity.com to complete your secure login.",
    statusText: "We're opening the Steam secure window...",
  },
  riot: {
    idLabel: "Riot ID e Tagline",
    idPlaceholder: "es. Player#EUW",
    codeLabel: "SMS code/App Auth",
    codePlaceholder: "123456",
    submitLabel: "Continua on Riot",
    helpText: "We'll take you to auth.riotgames.com to complete your secure login.",
    statusText: "We're taking you to Riot's secure portal...",
  },
};

type ProviderCredentials = {
  accountId: string;
  securityCode: string;
};

type CredentialState = Record<Provider, ProviderCredentials>;

const createEmptyCredentials = (): CredentialState => ({
  steam: { accountId: "", securityCode: "" },
  riot: { accountId: "", securityCode: "" },
});

type LoginCardProps = {
  onRecapReady?: (stats: UserStats) => void;
};

export default function LoginCard({ onRecapReady }: LoginCardProps) {
  const [isApproved, setIsApproved] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [provider, setProvider] = useState<Provider>("steam");
  const [credentials, setCredentials] = useState<CredentialState>(() => createEmptyCredentials());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    setStatusMessage("");
  }, [provider]);

  const handleApproval = () => {
    setIsApproved(true);
    setStatusMessage("");
  };

  const handleBack = () => {
    setIsApproved(false);
    setStatusMessage("");
    setProvider("steam");
    setCredentials(createEmptyCredentials());
  };

  const handleFieldChange =
    (field: keyof ProviderCredentials) => (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setCredentials((prev) => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          [field]: value,
        },
      }));
      setStatusMessage("");
    };

  const copy = PROVIDER_CONFIG[provider];
  const isProviderComplete = (current: Provider) => {
    const fields = credentials[current];
    return Boolean(fields.accountId.trim()) && Boolean(fields.securityCode.trim());
  };
  const completedProviders = PROVIDERS.filter((item) => isProviderComplete(item));
  const hasBothCompleted = completedProviders.length === PROVIDERS.length;
  const isCurrentComplete = isProviderComplete(provider);
  const submitLabel = hasBothCompleted ? "Continua su Riot e Steam" : copy.submitLabel;

  const handleProviderLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isCurrentComplete || isSubmitting) return;
    setIsSubmitting(true);
    setStatusMessage("Stiamo recuperando il tuo recap personalizzato...");
    try {
      const stats = await fetchRecap();
      onRecapReady?.(stats);
      setStatusMessage("Recap generato! Preparati al video...");
    } catch (error) {
      console.error("Failed to fetch recap", error);
      setStatusMessage("Impossibile recuperare il recap. Riprova tra poco.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`card-scene w-full max-w-md min-h-[520px] sm:min-h-[520px] xl:min-h-[540px] transform-gpu transition-all duration-2500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isApproved ? "card-flipped" : ""
      } ${isVisible ? "scale-100 opacity-100" : "scale-0 opacity-0"}`}
    >
      <div className="card-3d-inner h-full">
        <div className="card-face card-front text-[var(--foreground)] h-full">
          <div className="space-y-3 text-center">
            <span className="text-base xl:text-xl font-bold uppercase tracking-[0.35em] text-[rgba(var(--brand-green-rgb),0.85)]">
              LINK YOUR ACCOUNTS
            </span>
            <p className="mt-6 text-sm text-[rgba(var(--foreground-rgb),0.75)]">
              Connect your accounts. Watch your year in review. Generate your eternal card.
            </p>
          </div>
          <ul className="mt-8 xl:mt-4 flex-1 space-y-6 xl:space-y-12 text-sm text-[rgba(var(--foreground-rgb),0.75)]">
            <li className="flex gap-3 xl:gap-5">
              <span className="mt-2 h-2 w-2 rounded-full bg-[var(--brand-green)]" />
              Steam sync: library, playtime history and most played titles.
            </li>
            <li className="flex gap-3 xl:gap-5">
              <span className="mt-2 h-2 w-2 rounded-full bg-[var(--brand-green)]" />
              Riot sync: competitive rank, agents and recent match insights.
            </li>
            <li className="flex gap-3 xl:gap-5">
              <span className="mt-2 h-2 w-2 rounded-full bg-[var(--brand-green)]" />
              You can unlink any account at any time from your security panel.
            </li>
          </ul>
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleApproval}
              className="w-full rounded-2xl bg-[var(--brand-green)] px-4 py-3 text-base font-semibold text-[var(--brand-black)] shadow-[0_20px_45px_rgba(var(--brand-green-rgb),0.25)] transition hover:-translate-y-0.5 hover:opacity-90"
            >
              Generate your Gaming Card
            </button>
          </div>
        </div>
        <div className="card-face card-back text-[var(--foreground)] h-full pt-4 pb-6">
          <div className="space-y-1 text-center">
            <span className="text-base xl:text-xl font-bold uppercase tracking-[0.45em] text-[rgba(var(--brand-white-rgb),0.85)]">
              LOG IN
            </span>
          </div>
          <div className="mt-2 space-y-6">
            <div className="space-y-3">
              <p className="text-xs text-center font-semibold uppercase tracking-[0.35em] text-[rgba(var(--foreground-rgb),0.6)]">
                Select platform
              </p>
              <div className="flex rounded-2xl bg-[rgba(var(--foreground-rgb),0.08)] p-1">
                {PROVIDERS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setProvider(option)}
                    className={`flex-1 rounded-2xl px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] transition ${
                      provider === option
                        ? "bg-[var(--brand-green)] text-[var(--brand-black)]"
                        : "text-[rgba(var(--foreground-rgb),0.65)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    {option === "steam" ? "Steam" : "Riot"}
                  </button>
                ))}
              </div>
            </div>
            <form onSubmit={handleProviderLogin} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="accountId" className="text-sm font-medium text-[var(--foreground)]">
                  {copy.idLabel}
                </label>
                <input
                  id="accountId"
                  name="accountId"
                  required
                  value={credentials[provider].accountId}
                  onChange={handleFieldChange("accountId")}
                  placeholder={copy.idPlaceholder}
                  className="w-full rounded-2xl border border-[rgba(var(--foreground-rgb),0.2)] bg-transparent px-4 py-3 text-base text-[var(--foreground)] placeholder:text-[rgba(var(--foreground-rgb),0.45)] focus:border-[var(--brand-purple)] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--brand-purple-rgb),0.35)]"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="securityCode" className="text-sm font-medium text-[var(--foreground)]">
                  {copy.codeLabel}
                </label>
                <input
                  id="securityCode"
                  name="securityCode"
                  placeholder={copy.codePlaceholder}
                  required
                  value={credentials[provider].securityCode}
                  onChange={handleFieldChange("securityCode")}
                  className="w-full rounded-2xl border border-[rgba(var(--foreground-rgb),0.2)] bg-transparent px-4 py-3 text-base text-[var(--foreground)] placeholder:text-[rgba(var(--foreground-rgb),0.45)] focus:border-[var(--brand-purple)] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--brand-purple-rgb),0.35)]"
                />
              </div>
              <button
                type="submit"
                disabled={!isCurrentComplete || isSubmitting}
                className="w-full rounded-2xl bg-[var(--brand-purple)] px-6 py-3 text-base font-semibold text-[var(--brand-black)] transition hover:-translate-y-0.5 hover:opacity-90 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isSubmitting ? "Generazione in corso..." : submitLabel}
              </button>
              {statusMessage ? (
                <p className="text-center text-xs text-[var(--brand-green)]">{statusMessage}</p>
              ) : (
                <p className="text-center text-xs text-[rgba(var(--foreground-rgb),0.6)]">
                  {copy.helpText}
                </p>
              )}
            </form>
            <div className="pt-1 pb-0">
              <button
                type="button"
                onClick={handleBack}
                className="w-full rounded-2xl border border-[rgba(var(--foreground-rgb),0.2)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-[rgba(var(--foreground-rgb),0.7)] transition hover:border-[var(--foreground)] hover:text-[var(--foreground)]"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
