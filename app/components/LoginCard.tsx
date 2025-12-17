"use client";

import { FormEvent, useEffect, useState } from "react";

export default function LoginCard() {
  const [isApproved, setIsApproved] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setIsVisible(true), 1000);
    return () => clearTimeout(timeout);
  }, []);


  const handleApproval = () => {
    setIsApproved(true);
    setStatusMessage("");
  };

  const handleBack = () => {
    setIsApproved(false);
    setStatusMessage("");
  };

  const handleSteamLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusMessage("Stiamo aprendo la finestra sicura di Steam...");
  };

  return (
    <div
      className={`card-scene w-full max-w-md min-h-[620px] sm:min-h-[580px] xl:min-h-[540px] transform-gpu transition-all duration-2500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isApproved ? "card-flipped" : ""
      } ${isVisible ? "scale-100 opacity-100" : "scale-0 opacity-0"}`}
    >
      <div className="card-3d-inner h-full">
        <div className="card-face card-front text-[var(--foreground)] h-full">
          <div className="space-y-3 text-center">
            <span className="text-base xl:text-xl font-bold uppercase tracking-[0.35em] text-[rgba(var(--brand-green-rgb),0.85)]">
              LINK YOUR ACCOUNTS
            </span>
            <p className="mt-4 text-sm text-[rgba(var(--foreground-rgb),0.75)]">
              Connect your accounts. Watch your year in review. Generate your eternal card.
            </p>
          </div>
          <ul className="mt-10 xl:mt-4 flex-1 space-y-2 xl:space-y-8 text-sm text-[rgba(var(--foreground-rgb),0.75)]">
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
              className="w-full rounded-2xl bg-[var(--brand-green)] px-6 py-3 text-base font-semibold text-[var(--brand-black)] shadow-[0_20px_45px_rgba(var(--brand-green-rgb),0.25)] transition hover:-translate-y-0.5 hover:opacity-90"
            >
              Generate your Gaming Card
            </button>
          </div>
        </div>
        <div className="card-face card-back text-[var(--foreground)] h-full pt-4">
          <div className="space-y-3 text-center">
            <span className="text-base xl:text-xl font-bold uppercase tracking-[0.45em] text-[rgba(var(--brand-green-rgb),0.85)]">
              ACCEDI
            </span>
            <p className="mt-4 text-sm text-[rgba(var(--foreground-rgb),0.75)]">
              Completa il login con Steam Guard per generare il tuo recap personalizzato.
            </p>
          </div>
          <div className="mt-auto space-y-6 pt-4">
            <form onSubmit={handleSteamLogin} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="steamId" className="text-sm font-medium text-[var(--foreground)]">
                  Steam ID o Vanity URL
                </label>
                <input
                  id="steamId"
                  name="steamId"
                  required
                  placeholder="es. 7656119..."
                  className="w-full rounded-2xl border border-[rgba(var(--foreground-rgb),0.2)] bg-transparent px-4 py-3 text-base text-[var(--foreground)] placeholder:text-[rgba(var(--foreground-rgb),0.45)] focus:border-[var(--brand-purple)] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--brand-purple-rgb),0.35)]"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="steamGuard" className="text-sm font-medium text-[var(--foreground)]">
                  Codice Steam Guard (se richiesto)
                </label>
                <input
                  id="steamGuard"
                  name="steamGuard"
                  placeholder="ABCDE"
                  className="w-full rounded-2xl border border-[rgba(var(--foreground-rgb),0.2)] bg-transparent px-4 py-3 text-base text-[var(--foreground)] placeholder:text-[rgba(var(--foreground-rgb),0.45)] focus:border-[var(--brand-purple)] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--brand-purple-rgb),0.35)]"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-2xl bg-[var(--brand-purple)] px-6 py-3 text-base font-semibold text-[var(--brand-black)] transition hover:-translate-y-0.5 hover:opacity-90"
              >
                Continua su Steam
              </button>
              {statusMessage ? (
                <p className="text-center text-xs text-[var(--brand-green)]">{statusMessage}</p>
              ) : (
                <p className="text-center text-xs text-[rgba(var(--foreground-rgb),0.6)]">
                  Ti porteremo su steamcommunity.com per completare l&apos;accesso sicuro.
                </p>
              )}
            </form>
            <div className="pb-2">
              <button
                type="button"
                onClick={handleBack}
                className="w-full rounded-2xl border border-[rgba(var(--foreground-rgb),0.2)] px-6 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-[rgba(var(--foreground-rgb),0.7)] transition hover:border-[var(--foreground)] hover:text-[var(--foreground)]"
              >
                Torna indietro
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
