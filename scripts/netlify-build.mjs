import { spawnSync } from "node:child_process";

const production = process.env.CONTEXT === "production";
const env = { ...process.env };

if (!production) {
  // Preview builds must not deploy a production backend with its shared key.
  env.VITE_CONVEX_URL ||= "https://impartial-ladybug-964.convex.cloud";
  delete env.CONVEX_DEPLOY_KEY;
}

function run(command, args, commandEnv) {
  const result = spawnSync(command, args, { env: commandEnv, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

// Convex 1.2.1 has no deploy --cmd option. Keep Netlify's configured backend URL
// for the frontend, then deploy the backend using this CLI's supported command.
const buildEnv = { ...env };
delete buildEnv.CONVEX_DEPLOY_KEY;
run("npm", ["run", "build"], buildEnv);
if (production) run("./node_modules/.bin/convex", ["deploy", "--yes"], env);
