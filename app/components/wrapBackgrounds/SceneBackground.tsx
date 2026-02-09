import React, { useEffect, useState } from "react";
import DarkVeil from "@/app/components/wrapBackgrounds/DarkVeil";
import LightPillar from "@/app/components/wrapBackgrounds/LightPillar";
import LiquidEther from "@/app/components/wrapBackgrounds/LiquidEther";
import Prism from "@/app/components/wrapBackgrounds/Prism";
import PrismaticBurst from "@/app/components/wrapBackgrounds/PrismaticBrust";

type SceneBackgroundProps = {
  sceneId: string;
  isPaused: boolean;
  finalState: boolean;
};

const useThemeMode = () => {
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const update = () => setIsLight(root.classList.contains("light"));
    update();
    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return isLight;
};

export const SceneBackground: React.FC<SceneBackgroundProps> = ({
  sceneId,
  isPaused,
  finalState,
}) => {
  const isLight = useThemeMode();
  const shouldAnimate = !finalState && !isPaused;

  if (
    sceneId !== "intro" &&
    sceneId !== "total_time" &&
    sceneId !== "top_genres" &&
    sceneId !== "top_games" &&
    sceneId !== "steam_trophies"
  ) {
    return <div className="absolute inset-0 bg-[var(--background)]" />;
  }

  const timeScale = shouldAnimate ? (isLight ? 0.4 : 0.5) : 0;
  const veilSpeed = shouldAnimate ? (isLight ? 0.4 : 0.5) : 0;
  const introTint = isLight
    ? "radial-gradient(600px 480px at 20% 20%, rgba(var(--brand-purple-rgb),0.22), transparent 65%)," +
      "radial-gradient(540px 420px at 80% 80%, rgba(var(--brand-green-rgb),0.18), transparent 60%)"
    : "radial-gradient(700px 520px at 20% 20%, rgba(var(--brand-purple-rgb),0.35), transparent 65%)," +
      "radial-gradient(620px 520px at 80% 80%, rgba(var(--brand-green-rgb),0.28), transparent 60%)";
  const liquidColors = isLight
    ? ["#6f57ff", "#ffb8f6", "#d2c4ff"]
    : ["#5227FF", "#FF9FFC", "#B19EEF"];
  const pillarTopColor = isLight ? "#7b5cff" : "#5227FF";
  const pillarBottomColor = isLight ? "#ffc7f5" : "#FF9FFC";
  const pillarIntensity = isLight ? 0.85 : 1;
  const pillarGlow = isLight ? 0.0015 : 0.002;
  const pillarNoise = isLight ? 0.35 : 0.5;
  const pillarRotationSpeed = shouldAnimate ? 0.3 : 0;
  const burstColors = isLight
    ? ["#ff5fc6", "#7b6bff", "#ffffff"]
    : ["#ff007a", "#4d3dff", "#ffffff"];
  const burstIntensity = isLight ? 1.6 : 2;
  const burstSpeed = shouldAnimate ? 0.5 : 0;

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {sceneId === "intro" ? (
        <div className="absolute inset-0">
          <Prism
            animationType="rotate"
            timeScale={timeScale}
            height={3.5}
            baseWidth={5.5}
            scale={3.6}
            hueShift={isLight ? 0.12 : 0.06}
            colorFrequency={1}
            noise={isLight ? 0.02 : 0}
            glow={isLight ? 0.7 : 1}
            bloom={isLight ? 0.7 : 1}
            suspendWhenOffscreen
          />
          <div className="absolute inset-0" style={{ background: introTint }} />
        </div>
      ) : sceneId === "total_time" ? (
        <div className="absolute inset-0">
          <DarkVeil
            hueShift={isLight ? 18 : 0}
            noiseIntensity={isLight ? 0.015 : 0}
            scanlineIntensity={isLight ? 0.02 : 0}
            speed={veilSpeed}
            scanlineFrequency={isLight ? 0.6 : 0}
            warpAmount={isLight ? 0.08 : 0}
          />
        </div>
      ) : sceneId === "top_genres" ? (
        <div className="absolute inset-0">
          <LiquidEther
            colors={liquidColors}
            mouseForce={20}
            cursorSize={100}
            isViscous
            viscous={30}
            iterationsViscous={32}
            iterationsPoisson={32}
            resolution={0.5}
            isBounce={false}
            autoDemo={shouldAnimate}
            autoSpeed={0.5}
            autoIntensity={2.2}
            takeoverDuration={0.25}
            autoResumeDelay={3000}
            autoRampDuration={0.6}
            paused={!shouldAnimate}
            alwaysAuto
          />
        </div>
      ) : sceneId === "top_games" ? (
        <div className="absolute inset-0">
          <LightPillar
            topColor={pillarTopColor}
            bottomColor={pillarBottomColor}
            intensity={pillarIntensity}
            rotationSpeed={pillarRotationSpeed}
            glowAmount={pillarGlow}
            pillarWidth={3}
            pillarHeight={0.4}
            noiseIntensity={pillarNoise}
            pillarRotation={25}
            interactive={false}
            mixBlendMode="screen"
            quality="high"
          />
        </div>
      ) : (
        <div className="absolute inset-0">
          <PrismaticBurst
            animationType="rotate3d"
            intensity={burstIntensity}
            speed={burstSpeed}
            distort={0}
            paused={!shouldAnimate}
            offset={{ x: 0, y: 0 }}
            hoverDampness={0.25}
            rayCount={0}
            mixBlendMode="lighten"
            colors={burstColors}
          />
        </div>
      )}
      <div className="absolute inset-0 bg-[var(--wrap-overlay)]" />
    </div>
  );
};
