"use client";

import { useEffect, useState, type FormEvent } from "react";
import { loginAccount, registerAccount } from "@/lib/api";

export default function LoginCard() {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    setStatusMessage("");
  }, [isRegister]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (isSubmitting || isRedirecting) return;
    const activeEmail = isRegister ? registerEmail : loginEmail;
    const trimmedEmail = activeEmail.trim();
    if (!trimmedEmail || (isRegister ? !registerPassword : !loginPassword)) {
      setStatusMessage("Inserisci email e password.");
      return;
    }
    if (isRegister && registerPassword !== confirmPassword) {
      setStatusMessage("Le password non coincidono.");
      return;
    }
    setIsSubmitting(true);
    setStatusMessage("");
    try {
      if (isRegister) {
        await registerAccount(trimmedEmail, registerPassword);
        setStatusMessage("Registrazione completata. Accesso in corso...");
        setIsRedirecting(true);
        setRegisterPassword("");
        setConfirmPassword("");
        setTimeout(() => {
          window.location.href = "/accesso";
        }, 1400);
        return;
      }
      await loginAccount(trimmedEmail, loginPassword);
      window.location.href = "/accesso";
    } catch (error) {
      console.error("Account auth failed", error);
      const message =
        error instanceof Error && error.message
          ? error.message
          : isRegister
            ? "Unable to create account. Please try again."
            : "Invalid credentials";
      setStatusMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFlip = () => {
    setIsFlipped(true);
    setIsRegister(false);
    setStatusMessage("");
  };

  const handleBack = () => {
    setIsFlipped(false);
    setIsRegister(false);
    setStatusMessage("");
  };

  return (
    <div
      className={`card-scene w-full max-w-md min-h-[520px] sm:min-h-[520px] xl:min-h-[540px] transform-gpu transition-all duration-2500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isFlipped ? "card-flipped" : ""
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
              onClick={handleFlip}
              className="w-full rounded-2xl bg-[var(--brand-green)] px-4 py-3 text-base font-semibold text-[var(--brand-black)] shadow-[0_20px_45px_rgba(var(--brand-green-rgb),0.25)] transition hover:-translate-y-0.5 hover:opacity-90"
            >
              Generate your Gaming Card
            </button>
          </div>
        </div>
        <div className="card-face card-back text-[var(--foreground)] h-full pt-4 pb-6">
          <div className="mt-2 space-y-6">
            <div className="space-y-3">
              <div className="flex rounded-2xl bg-[rgba(var(--foreground-rgb),0.08)] p-1">
                <button
                  type="button"
                  onClick={() => setIsRegister(false)}
                  className={`flex-1 rounded-2xl px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] transition ${
                    !isRegister
                      ? "bg-[var(--brand-green)] text-[var(--brand-black)]"
                      : "text-[rgba(var(--foreground-rgb),0.65)] hover:text-[var(--foreground)]"
                  }`}
                >
                  LOG IN
                </button>
                <button
                  type="button"
                  onClick={() => setIsRegister(true)}
                  className={`flex-1 rounded-2xl px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] transition ${
                    isRegister
                      ? "bg-[var(--brand-green)] text-[var(--brand-black)]"
                      : "text-[rgba(var(--foreground-rgb),0.65)] hover:text-[var(--foreground)]"
                  }`}
                >
                  SIGN IN
                </button>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-[var(--foreground)]">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={isRegister ? registerEmail : loginEmail}
                  onChange={(event) =>
                    isRegister
                      ? setRegisterEmail(event.target.value)
                      : setLoginEmail(event.target.value)
                  }
                  placeholder="name@email.com"
                  className="w-full rounded-2xl border border-[rgba(var(--foreground-rgb),0.2)] bg-transparent px-4 py-3 text-base text-[var(--foreground)] placeholder:text-[rgba(var(--foreground-rgb),0.45)] focus:border-[var(--brand-purple)] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--brand-purple-rgb),0.35)]"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-[var(--foreground)]">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={isPasswordVisible ? "text" : "password"}
                    value={isRegister ? registerPassword : loginPassword}
                    onChange={(event) =>
                      isRegister
                        ? setRegisterPassword(event.target.value)
                        : setLoginPassword(event.target.value)
                    }
                    placeholder={isRegister ? "Create password" : "Enter password"}
                    className="w-full rounded-2xl border border-[rgba(var(--foreground-rgb),0.2)] bg-transparent px-4 py-3 pr-12 text-base text-[var(--foreground)] placeholder:text-[rgba(var(--foreground-rgb),0.45)] focus:border-[var(--brand-purple)] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--brand-purple-rgb),0.35)]"
                  />
                  <button
                    type="button"
                    onClick={() => setIsPasswordVisible((prev) => !prev)}
                    aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-3 flex items-center text-[rgba(var(--foreground-rgb),0.6)] transition hover:text-[var(--foreground)]"
                  >
                    {isPasswordVisible ? (
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 3l18 18" />
                        <path d="M10.5 10.5a2 2 0 0 0 3 3" />
                        <path d="M7.5 7.5C5 9.5 3.7 12 3.7 12s3.2 6 8.3 6c1.6 0 3-.4 4.2-1.1" />
                        <path d="M9.9 5.1A9.8 9.8 0 0 1 12 4.7c5.1 0 8.3 6 8.3 6a12.2 12.2 0 0 1-2.3 3.1" />
                      </svg>
                    ) : (
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M2 12s3.2-6 10-6 10 6 10 6-3.2 6-10 6-10-6-10-6Z" />
                        <circle cx="12" cy="12" r="3.2" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              {isRegister && (
                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium text-[var(--foreground)]">
                    Confirm password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={isConfirmPasswordVisible ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="Repeat password"
                      className="w-full rounded-2xl border border-[rgba(var(--foreground-rgb),0.2)] bg-transparent px-4 py-3 pr-12 text-base text-[var(--foreground)] placeholder:text-[rgba(var(--foreground-rgb),0.45)] focus:border-[var(--brand-purple)] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--brand-purple-rgb),0.35)]"
                    />
                    <button
                      type="button"
                      onClick={() => setIsConfirmPasswordVisible((prev) => !prev)}
                      aria-label={isConfirmPasswordVisible ? "Hide password" : "Show password"}
                      className="absolute inset-y-0 right-3 flex items-center text-[rgba(var(--foreground-rgb),0.6)] transition hover:text-[var(--foreground)]"
                    >
                      {isConfirmPasswordVisible ? (
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 24 24"
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 3l18 18" />
                          <path d="M10.5 10.5a2 2 0 0 0 3 3" />
                          <path d="M7.5 7.5C5 9.5 3.7 12 3.7 12s3.2 6 8.3 6c1.6 0 3-.4 4.2-1.1" />
                          <path d="M9.9 5.1A9.8 9.8 0 0 1 12 4.7c5.1 0 8.3 6 8.3 6a12.2 12.2 0 0 1-2.3 3.1" />
                        </svg>
                      ) : (
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 24 24"
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M2 12s3.2-6 10-6 10 6 10 6-3.2 6-10 6-10-6-10-6Z" />
                          <circle cx="12" cy="12" r="3.2" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              )}
              {statusMessage ? (
                <p className="text-center text-xs text-[var(--brand-green)]">{statusMessage}</p>
              ) : !isRegister ? (
                <p className="text-center text-xs text-[rgba(var(--foreground-rgb),0.6)]">
                    After logging in, you can connect your platforms.
                </p>
              ) : null}
              <button
                type="submit"
                disabled={isSubmitting || isRedirecting}
                className="w-full rounded-2xl bg-[var(--brand-purple)] px-6 py-3 text-base font-semibold text-[var(--brand-black)] transition hover:-translate-y-0.5 hover:opacity-90 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isSubmitting
                  ? isRegister
                    ? "Creazione in corso..."
                    : "Accesso in corso..."
                  : isRedirecting
                    ? "Accesso in corso..."
                  : isRegister
                    ? "SIGN IN"
                    : "LOG IN"}
              </button>
            </form>
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
