import React from "react";
import Threads from "@/app/components/wrapBackgrounds/Threads";
import LightPillar from "@/app/components/wrapBackgrounds/LightPillar";
import LiquidEther from "@/app/components/wrapBackgrounds/LiquidEther";
import FloatingLines from "@/app/components/wrapBackgrounds/FloatingLines";
import PrismaticBurst from "@/app/components/wrapBackgrounds/PrismaticBrust";

type SceneBackgroundProps = {
  sceneId: string;
  isPaused: boolean;
  finalState: boolean;
};

const FLOATING_LINES_WAVES: Array<"top" | "middle" | "bottom"> = ["top", "bottom"];
const FLOATING_LINES_GRADIENT = ["#FF00FF", "#8BFF00"];
const THREADS_COLOR_A: [number, number, number] = [1, 0, 1];
const THREADS_COLOR_B: [number, number, number] = [0.55, 1, 0];

export const SceneBackground = React.memo(function SceneBackground({
  sceneId,
  isPaused,
  finalState,
}: SceneBackgroundProps) {
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

  const veilSpeed = shouldAnimate ? 0.5 : 0;
  const liquidColors = ["#8BFF00", "#FF00FF", "#8BFF00"];
  const pillarTopColor = "#ff00ff";
  const pillarBottomColor = "#8bff00";
  const pillarIntensity = 1;
  const pillarGlow = 0.006;
  const pillarNoise = 0.5;
  const pillarRotationSpeed = shouldAnimate ? 10 : 0;
  const burstColors = ["#ff00ff", "#8bff00", "#ffffff"];
  const burstIntensity = 0.5;
  const burstSpeed = shouldAnimate ? 0.5 : 0;

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {sceneId === "intro" ? (
        <div className="absolute inset-0">
          <FloatingLines
            enabledWaves={FLOATING_LINES_WAVES}
            // Array - specify line count per wave; Number - same count for all waves
            lineCount={5}
            // Array - specify line distance per wave; Number - same distance for all waves
            lineDistance={8}
            bendRadius={5}
            bendStrength={-0.5}
            interactive={false}
            parallax={true}
            zoom={1.6}
            linesGradient={FLOATING_LINES_GRADIENT}
            animationSpeed={5}
            paused={!shouldAnimate}
          />
        </div>
      ) : sceneId === "total_time" ? (
        <div className="absolute inset-0">
            <Threads
              colorA={THREADS_COLOR_A}
              colorB={THREADS_COLOR_B}
              amplitude={4.8}
              distance={1.4}
              enableMouseInteraction={false}
              paused={!shouldAnimate}
              opacity={0.7}
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
      ) : (
        <div className="absolute inset-0">
          <LightPillar
            topColor={pillarTopColor}
            bottomColor={pillarBottomColor}
            intensity={pillarIntensity}
            rotationSpeed={pillarRotationSpeed}
            glowAmount={pillarGlow}
            pillarWidth={3}
            pillarHeight={0.4}
            zoom={2.5}
            noiseIntensity={pillarNoise}
            pillarRotation={25}
            interactive={false}
            mixBlendMode="color-dodge"
            quality="high"
          />
        </div>
      )}
      <div className="absolute inset-0 bg-[var(--wrap-overlay)]" />
    </div>
  );
});
