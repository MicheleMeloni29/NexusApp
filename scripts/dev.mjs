import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const backendDir = join(rootDir, "backend");

const pythonCandidates = process.platform === "win32"
  ? [join(backendDir, ".venv", "Scripts", "python.exe")]
  : [join(backendDir, ".venv", "bin", "python")];

const pythonBin = pythonCandidates.find(existsSync) ?? "python";
const nextBin = join(rootDir, "node_modules", "next", "dist", "bin", "next");

const children = [];
let isShuttingDown = false;

const shutdown = () => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  for (const child of children) {
    if (!child.killed) {
      child.kill();
    }
  }
};

const spawnProcess = (name, command, args, options) => {
  const child = spawn(command, args, { stdio: "inherit", ...options });
  child.on("error", (error) => {
    if (isShuttingDown) return;
    console.error(`[dev] Failed to start ${name}: ${error.message}`);
    shutdown();
    process.exit(1);
  });
  child.on("exit", (code, signal) => {
    if (isShuttingDown) return;
    const exitLabel = signal ?? code ?? 1;
    console.error(`[dev] ${name} exited (${exitLabel}).`);
    shutdown();
    process.exit(code ?? 1);
  });
  children.push(child);
  return child;
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

spawnProcess("backend", pythonBin, ["-m", "uvicorn", "app.main:app", "--reload", "--port", "8000"], {
  cwd: backendDir,
  env: process.env,
});

spawnProcess("next", process.execPath, [nextBin, "dev"], {
  cwd: rootDir,
  env: process.env,
});
