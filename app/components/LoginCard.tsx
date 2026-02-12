"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ApiError, loginAccount, registerAccount } from "@/lib/api";
import { useLanguage } from "@/app/components/LanguageProvider";

type Notice =
  | { kind: "key"; key: string }
  | { kind: "message"; message: string };

export default function LoginCard() {
  const { t } = useLanguage();
  const [isFlipped, setIsFlipped] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [statusNotice, setStatusNotice] = useState<Notice | null>(null);
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
    setStatusNotice(null);
  }, [isRegister]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (isSubmitting || isRedirecting) return;
    const activeEmail = isRegister ? registerEmail : loginEmail;
    const trimmedEmail = activeEmail.trim();
    if (!trimmedEmail || (isRegister ? !registerPassword : !loginPassword)) {
      setStatusNotice({ kind: "key", key: "loginCard.status.missingFields" });
      return;
    }
    if (isRegister && registerPassword !== confirmPassword) {
      setStatusNotice({ kind: "key", key: "loginCard.status.passwordMismatch" });
      return;
    }
    setIsSubmitting(true);
    setStatusNotice(null);
    try {
      if (isRegister) {
        await registerAccount(trimmedEmail, registerPassword);
        setStatusNotice({ kind: "key", key: "loginCard.status.registerSuccess" });
        setIsRedirecting(true);
        setRegisterPassword("");
        setConfirmPassword("");
        setTimeout(() => {
          window.location.href = "/";
        }, 1400);
        return;
      }
      await loginAccount(trimmedEmail, loginPassword);
      window.location.href = "/";
    } catch (error) {
      const isExpectedAuthError =
        error instanceof ApiError && [400, 401, 403, 409, 422].includes(error.status);
      if (!isExpectedAuthError) {
        console.error("Account auth failed", error);
      }
      const fallbackKey = isRegister
        ? "loginCard.errors.registerFailed"
        : "loginCard.errors.invalidCredentials";
      const message = error instanceof Error && error.message ? error.message : "";
      setStatusNotice(
        message
          ? { kind: "message", message }
          : { kind: "key", key: fallbackKey }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFlip = () => {
    setIsFlipped(true);
    setIsRegister(false);
    setStatusNotice(null);
  };

  const handleBack = () => {
    setIsFlipped(false);
    setIsRegister(false);
    setStatusNotice(null);
  };

  const statusText = statusNotice
    ? statusNotice.kind === "message"
      ? statusNotice.message
      : t(statusNotice.key)
    : "";

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
              {t("loginCard.frontTitle")}
            </span>
            <p className="mt-6 text-md text-[rgba(var(--foreground-rgb),0.75)]">
              {t("loginCard.frontDescription")}
            </p>
          </div>
          <ul className="mt-8 xl:mt-4 flex-1 space-y-6 xl:space-y-12 text-sm text-[rgba(var(--foreground-rgb),0.75)]">
            <li className="flex gap-3 xl:gap-5">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--brand-green)]" />
              {t("loginCard.frontBulletSteam")}
            </li>
            <li className="flex gap-3 xl:gap-5">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--brand-green)]" />
              {t("loginCard.frontBulletRiot")}
            </li>
            <li className="flex gap-3 xl:gap-5">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--brand-green)]" />
              {t("loginCard.frontBulletUnlink")}
            </li>
          </ul>
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleFlip}
              className="w-full rounded-2xl bg-[var(--brand-green)] px-4 py-3 text-base font-semibold text-[var(--brand-black)] shadow-[0_20px_45px_rgba(var(--brand-green-rgb),0.25)] transition hover:-translate-y-0.5 hover:opacity-90"
            >
              {t("loginCard.frontCta")}
            </button>
          </div>
        </div>
        <div className="card-face card-back text-[var(--foreground)] h-full pt-4 pb-6">
          <div className="mt-2 flex h-full flex-col gap-6">
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
                  {t("loginCard.tabs.logIn")}
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
                  {t("loginCard.tabs.signIn")}
                </button>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="flex h-full flex-col">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-[var(--foreground)]">
                    {t("loginCard.labels.email")}
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
                    placeholder={t("loginCard.placeholders.email")}
                    className="w-full rounded-2xl border border-[rgba(var(--foreground-rgb),0.2)] bg-transparent px-4 py-3 text-base text-[var(--foreground)] placeholder:text-[rgba(var(--foreground-rgb),0.45)] focus:border-[var(--brand-purple)] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--brand-purple-rgb),0.35)]"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-[var(--foreground)]">
                    {t("loginCard.labels.password")}
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
                      placeholder={
                        isRegister
                          ? t("loginCard.placeholders.passwordCreate")
                          : t("loginCard.placeholders.passwordLogin")
                      }
                      className="w-full rounded-2xl border border-[rgba(var(--foreground-rgb),0.2)] bg-transparent px-4 py-3 pr-12 text-base text-[var(--foreground)] placeholder:text-[rgba(var(--foreground-rgb),0.45)] focus:border-[var(--brand-purple)] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--brand-purple-rgb),0.35)]"
                    />
                    <button
                      type="button"
                      onClick={() => setIsPasswordVisible((prev) => !prev)}
                      aria-label={
                        isPasswordVisible
                          ? t("loginCard.aria.hidePassword")
                          : t("loginCard.aria.showPassword")
                      }
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
                      {t("loginCard.labels.confirmPassword")}
                    </label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={isConfirmPasswordVisible ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        placeholder={t("loginCard.placeholders.passwordRepeat")}
                        className="w-full rounded-2xl border border-[rgba(var(--foreground-rgb),0.2)] bg-transparent px-4 py-3 pr-12 text-base text-[var(--foreground)] placeholder:text-[rgba(var(--foreground-rgb),0.45)] focus:border-[var(--brand-purple)] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--brand-purple-rgb),0.35)]"
                      />
                      <button
                        type="button"
                        onClick={() => setIsConfirmPasswordVisible((prev) => !prev)}
                        aria-label={
                          isConfirmPasswordVisible
                            ? t("loginCard.aria.hidePassword")
                            : t("loginCard.aria.showPassword")
                        }
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
                {statusText ? (
                  <p className="text-center text-xs text-[var(--brand-green)]">{statusText}</p>
                ) : !isRegister ? (
                  <p className="text-center text-xs text-[rgba(var(--foreground-rgb),0.6)]">
                    {t("loginCard.status.loginInfo")}
                  </p>
                ) : null}
              </div>
              <div className="mt-auto space-y-3">
                <button
                  type="submit"
                  disabled={isSubmitting || isRedirecting}
                  className="w-full rounded-2xl bg-[var(--brand-purple)] px-6 py-3 text-base font-semibold text-[var(--brand-black)] transition hover:-translate-y-0.5 hover:opacity-90 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isSubmitting
                    ? isRegister
                      ? t("loginCard.submit.creating")
                      : t("loginCard.submit.loggingIn")
                    : isRedirecting
                      ? t("loginCard.submit.loggingIn")
                    : isRegister
                      ? t("loginCard.submit.signIn")
                      : t("loginCard.submit.logIn")}
                </button>
                <button
                  type="button"
                  onClick={handleBack}
                  className="w-full rounded-2xl border border-[rgba(var(--foreground-rgb),0.2)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-[rgba(var(--foreground-rgb),0.7)] transition hover:border-[var(--foreground)] hover:text-[var(--foreground)]"
                >
                  {t("loginCard.back")}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
