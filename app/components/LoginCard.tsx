"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { buildProviderLoginUrl, fetchProvidersAvailability } from "@/lib/api";
import type { UserStats } from "@/app/types";
import type { ProvidersAvailability } from "@/lib/api";

const PROVIDERS = ["steam", "riot"] as const;

type Provider = (typeof PROVIDERS)[number];

type ProviderCopy = {
  submitLabel: string;
  helpText: string;
  statusText: string;
};

const PROVIDER_CONFIG: Record<Provider, ProviderCopy> = {
  steam: {
    submitLabel: "Continua con Steam",
    helpText: "Verrai reindirizzato a steamcommunity.com per completare l'accesso.",
    statusText: "Stiamo aprendo il login di Steam...",
  },
  riot: {
    submitLabel: "Continua con Riot",
    helpText: "Verrai reindirizzato a auth.riotgames.com per completare l'accesso.",
    statusText: "Stiamo aprendo il portale Riot...",
  },
};

type LoginCardProps = {
  onRecapReady?: (stats: UserStats) => void;
};

export default function LoginCard(_props: LoginCardProps) {
  const [isApproved, setIsApproved] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [provider, setProvider] = useState<Provider>("steam");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [providersAvailability, setProvidersAvailability] = useState<ProvidersAvailability | null>(null);
  const [riotClientId, setRiotClientId] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    setStatusMessage("");
    setIsSubmitting(false);
  }, [provider]);

  useEffect(() => {
    let isMounted = true;
    fetchProvidersAvailability()
      .then((data) => {
        if (isMounted) {
          setProvidersAvailability(data);
        }
      })
      .catch((error) => {
        if (isMounted) {
          console.error("Failed to load provider availability", error);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedClientId = window.localStorage.getItem("riot_client_id");
    if (storedClientId) {
      setRiotClientId(storedClientId);
    }
  }, []);

  const handleApproval = () => {
    setIsApproved(true);
    setStatusMessage("");
  };

  const handleBack = () => {
    setIsApproved(false);
    setStatusMessage("");
    setProvider("steam");
  };

  const copy = PROVIDER_CONFIG[provider];
  const providerAvailability = providersAvailability?.[provider];
  const hasManualRiotClientId = Boolean(riotClientId.trim());
  const isProviderEnabled =
    provider === "riot"
      ? (providerAvailability?.enabled ?? true) || hasManualRiotClientId
      : providerAvailability?.enabled ?? true;
  const providerHelpText = isProviderEnabled
    ? copy.helpText
    : provider === "riot"
      ? "Inserisci il Riot Client ID qui sotto o imposta RIOT_CLIENT_ID nel backend/.env."
      : providerAvailability?.reason ?? "Accesso non disponibile finche' il provider non e' configurato.";

  const handleRiotClientIdChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setRiotClientId(value);
    if (typeof window === "undefined") return;
    const trimmed = value.trim();
    if (trimmed) {
      window.localStorage.setItem("riot_client_id", trimmed);
    } else {
      window.localStorage.removeItem("riot_client_id");
    }
  };

  const handleProviderLogin = () => {
    if (isSubmitting || !isProviderEnabled) {
      if (!isProviderEnabled) {
        setStatusMessage(providerAvailability?.reason ?? "Inserisci il Riot Client ID per continuare.");
      }
      return;
    }
    setIsSubmitting(true);
    setStatusMessage(copy.statusText);

    try {
      const nextUrl = `${window.location.origin}/accesso`;
      const options =
        provider === "riot" && riotClientId.trim() ? { clientId: riotClientId.trim() } : undefined;
      const redirectUrl = buildProviderLoginUrl(provider, nextUrl, options);
      window.location.href = redirectUrl;
    } catch (error) {
      console.error("Failed to start provider login", error);
      setStatusMessage("Impossibile avviare il login. Riprova.");
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
            <p className="mt-6 text-md text-[rgba(var(--foreground-rgb),0.75)]">
              Connect your accounts. Watch your year in review. Generate your eternal card.
            </p>
          </div>
          <ul className="mt-8 xl:mt-4 flex-1 space-y-6 xl:space-y-12 text-sm text-[rgba(var(--foreground-rgb),0.75)]">
            <li className="flex gap-3 xl:gap-5">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--brand-green)]" />
              Steam sync: library, playtime history and most played titles.
            </li>
            <li className="flex gap-3 xl:gap-5">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--brand-green)]" />
              Riot sync: competitive rank, agents and recent match insights.
            </li>
            <li className="flex gap-3 xl:gap-5">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--brand-green)]" />
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
            <div className="space-y-4">
              <p className="text-center text-sm text-[rgba(var(--foreground-rgb),0.75)]">{providerHelpText}</p>
              {provider === "riot" && (
                <div className="space-y-2">
                  <label htmlFor="riotClientId" className="text-sm font-medium text-[var(--foreground)]">
                    Riot Client ID
                  </label>
                  <input
                    id="riotClientId"
                    name="riotClientId"
                    value={riotClientId}
                    onChange={handleRiotClientIdChange}
                    placeholder="Inserisci il Riot Client ID"
                    className="w-full rounded-2xl border border-[rgba(var(--foreground-rgb),0.2)] bg-transparent px-4 py-3 text-base text-[var(--foreground)] placeholder:text-[rgba(var(--foreground-rgb),0.45)] focus:border-[var(--brand-purple)] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--brand-purple-rgb),0.35)]"
                  />
                  <p className="text-xs text-[rgba(var(--foreground-rgb),0.6)]">
                    Il valore viene salvato localmente nel browser.
                  </p>
                </div>
              )}
              <button
                type="button"
                onClick={handleProviderLogin}
                disabled={isSubmitting || !isProviderEnabled}
                className="w-full rounded-2xl bg-[var(--brand-purple)] px-6 py-3 text-base font-semibold text-[var(--brand-black)] transition hover:-translate-y-0.5 hover:opacity-90 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isSubmitting ? "Reindirizzamento in corso..." : copy.submitLabel}
              </button>
              {statusMessage ? (
                <p className="text-center text-xs text-[var(--brand-green)]">{statusMessage}</p>
              ) : isProviderEnabled ? (
                <p className="text-center text-xs text-[rgba(var(--foreground-rgb),0.6)]">
                  Dopo l'accesso verrai riportato qui per completare la connessione.
                </p>
              ) : null}
            </div>
            <div className="">
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
