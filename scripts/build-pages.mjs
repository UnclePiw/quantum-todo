import { spawn } from "node:child_process";
import { rename } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const routePath = resolve(projectRoot, "app/desktop-bridge/route.ts");
const skippedRoutePath = resolve(projectRoot, "app/desktop-bridge/route.pages-disabled.ts");
let routeMoved = false;

try {
  // The desktop companion uses a local POST route, which cannot be part of a static export.
  await rename(routePath, skippedRoutePath);
  routeMoved = true;

  const build = spawn(
    process.execPath,
    [resolve(projectRoot, "node_modules/next/dist/bin/next"), "build"],
    {
      cwd: projectRoot,
      stdio: "inherit",
      env: {
        ...process.env,
        NEXT_PUBLIC_GITHUB_PAGES: "true",
        NEXT_TELEMETRY_DISABLED: "1",
      },
    },
  );

  const exitCode = await new Promise((resolveExit, reject) => {
    build.once("error", reject);
    build.once("exit", (code, signal) => {
      if (signal) reject(new Error(`Next.js build stopped by ${signal}`));
      else resolveExit(code ?? 1);
    });
  });

  if (exitCode !== 0) process.exitCode = exitCode;
} finally {
  if (routeMoved) await rename(skippedRoutePath, routePath);
}
