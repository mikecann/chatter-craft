import { spawnSync } from "node:child_process";

const production = process.env.CONTEXT === "production";
const env = { ...process.env };

if (!production) {
  // Preview builds must not deploy a production backend with its shared key.
  env.VITE_CONVEX_URL ||= "https://impartial-ladybug-964.convex.cloud";
  delete env.CONVEX_DEPLOY_KEY;
}

const command = production ? "./node_modules/.bin/convex" : "npm";
const args = production
  ? ["deploy", "--yes", "--cmd", "npm run build"]
  : ["run", "build"];
const result = spawnSync(command, args, { env, stdio: "inherit" });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
