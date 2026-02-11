"use client";

import { useEffect, useMemo, useState } from "react";
import Loginpage from "./screens/Loginpage";
import GenerateWrapPage from "./screens/GenerateWrapPage";
import HomePage from "./screens/HomePage";
import type { UserStats } from "@/app/types";
import { fetchCurrentUser, fetchRecap, type AuthUser } from "@/lib/api";
import { useLanguage } from "@/app/components/LanguageProvider";

type Screen = "generate" | "home";

const getOnboardingKey = (userId: number) => `nexus-onboarded:${userId}`;

export default function RootPage() {
  const { t } = useLanguage();
  const [isBooting, setIsBooting] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [screen, setScreen] = useState<Screen>("home");
  const [lastRecap, setLastRecap] = useState<UserStats | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setIsBooting(true);
      try {
        const currentUser = await fetchCurrentUser();
        if (!isMounted) return;
        setUser(currentUser);
      } catch (error) {
        console.error("Failed to load current user", error);
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsBooting(false);
        }
      }
    };
    void load();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }
    const key = getOnboardingKey(user.user_id);
    const stored = localStorage.getItem(key);
    const onboarded = stored === "true";
    setScreen(onboarded ? "home" : "generate");
  }, [user]);

  useEffect(() => {
    if (!user) {
      setLastRecap(null);
      return;
    }
    let isMounted = true;
    const loadRecap = async () => {
      try {
        const recap = await fetchRecap(user.user_id);
        if (isMounted) {
          setLastRecap(recap);
        }
      } catch (error) {
        console.error("Failed to load recap", error);
        if (isMounted) {
          setLastRecap(null);
        }
      }
    };
    void loadRecap();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleFlowComplete = (stats: UserStats | null) => {
    if (user) {
      localStorage.setItem(getOnboardingKey(user.user_id), "true");
    }
    setLastRecap(stats ?? lastRecap);
    setScreen("home");
  };

  const handleRecapUpdate = (stats: UserStats | null) => {
    setLastRecap(stats);
  };

  const handleGenerate = () => {
    setScreen("generate");
  };

  const showLoading = useMemo(
    () => (
      <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex items-center justify-center px-6 py-12">
        <p className="text-sm text-[rgba(var(--foreground-rgb),0.7)]">{t("common.loading")}</p>
      </main>
    ),
    [t]
  );

  if (isBooting) {
    return showLoading;
  }

  if (!user) {
    return <Loginpage />;
  }

  if (screen === "generate") {
    return (
      <GenerateWrapPage
        onFlowComplete={handleFlowComplete}
        onRecapUpdate={handleRecapUpdate}
      />
    );
  }

  return <HomePage stats={lastRecap} onGenerate={handleGenerate} />;
}
