"use client";

import { Suspense } from "react";
import HomePage from "./HomePage";
import { useLanguage } from "@/app/components/LanguageProvider";

export default function AccessoPage() {
  const { t } = useLanguage();
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex items-center justify-center px-6 py-12">
          <p className="text-sm text-[rgba(var(--foreground-rgb),0.7)]">{t("common.loading")}</p>
        </main>
      }
    >
      <HomePage />
    </Suspense>
  );
}
