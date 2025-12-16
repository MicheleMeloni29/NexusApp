"use client";

import { FormEvent, useState } from "react";

export default function LoginCard() {
  const [isApproved, setIsApproved] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

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
    <div className="mx-auto flex w-full max-w-md flex-col rounded-3xl border border-[var(--border)] bg-[var(--card)]/90 px-6 py-7 shadow-[0_30px_120px_rgba(0,0,0,0.35)] backdrop-blur-2xl min-h-[520px]">
      <div className="space-y-3 text-center">
        <span className="text-base xl:text-xl font-bold uppercase tracking-[0.45em] text-[rgba(var(--brand-green-rgb),0.85)]">
          NEXUSAPP
        </span>
        {!isApproved && (
          <p className="mt-4 text-sm text-[rgba(var(--foreground-rgb),0.75)]">
            Collegati con Steam usando un profilo pubblico per generare insight
            sulla tua libreria, le ore giocate e i titoli preferiti.
          </p>
        )}
      </div>

      {!isApproved && (
        <ul className="mt-10 flex-1 space-y-2 text-sm text-[rgba(var(--foreground-rgb),0.75)]">
          <li className="flex gap-3">
            <span className="mt-2 h-2 w-4 rounded-full bg-[var(--brand-green)]" />
            Visualizzi solo i dati dopo averci dato il consenso esplicito.
          </li>
          <li className="flex gap-3">
            <span className="mt-2 h-2 w-4 rounded-full bg-[var(--brand-green)]" />
            Il profilo deve essere pubblico per poter leggere ore e libreria.
          </li>
          <li className="flex gap-3">
            <span className="mt-2 h-2 w-4 rounded-full bg-[var(--brand-green)]" />
            Puoi revocare l&apos;accesso in qualsiasi momento dal tuo account Steam.
          </li>
        </ul>
      )}

      {!isApproved ? (
        <div className="mt-auto space-y-3 pt-6">
          <button
            type="button"
            onClick={handleApproval}
            className="w-full rounded-2xl bg-[var(--brand-green)] px-6 py-3 text-base font-semibold text-[var(--brand-black)] shadow-[0_20px_45px_rgba(var(--brand-green-rgb),0.25)] transition hover:-translate-y-0.5 hover:opacity-90"
          >
            Autorizza accesso tramite Steam
          </button>
          <p className="text-center text-xs text-[rgba(var(--foreground-rgb),0.6)]">
            Usiamo l&apos;autenticazione ufficiale di steamcommunity.com
          </p>
        </div>
      ) : (
        <div className="mt-auto space-y-12 pt-6">
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
                className="w-full rounded-2xl border border-[rgba(var(--foreground-rgb),0.2)] bg-transparent px-4 py-3 text-base text-[var(--foreground)] placeholder:text-[rgba(var(--foreground-rgb),0.45)] focus:border-[var(--brand-green)] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--brand-green-rgb),0.3)]"
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
                className="w-full rounded-2xl border border-[rgba(var(--foreground-rgb),0.2)] bg-transparent px-4 py-3 text-base text-[var(--foreground)] placeholder:text-[rgba(var(--foreground-rgb),0.45)] focus:border-[var(--brand-green)] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--brand-green-rgb),0.3)]"
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
          <button
            type="button"
            onClick={handleBack}
            className="w-full rounded-2xl border border-[rgba(var(--foreground-rgb),0.2)] px-6 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-[rgba(var(--foreground-rgb),0.7)] transition hover:border-[var(--foreground)] hover:text-[var(--foreground)]"
          >
            Torna indietro
          </button>
        </div>
      )}
    </div>
  );
}
