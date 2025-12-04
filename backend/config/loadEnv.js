import dotenvFlow from "dotenv-flow";
import path from "path";
import { fileURLToPath } from "url";

export function loadEnv(moduleUrl) {
  const callerFile = fileURLToPath(moduleUrl);
  const serviceDir = path.dirname(callerFile);
  const backendDir = path.resolve(serviceDir, "../");
  const projectRoot = path.resolve(serviceDir, "../../");

  // 1) Load project root .env (optional)
  dotenvFlow.config({ path: projectRoot, silent: true });

  // 2) Load service-specific .env (primary, override root values)
  // Use silent:true to avoid noisy warnings when .env files are intentionally absent in some environments.
  dotenvFlow.config({ path: serviceDir, silent: true, override: true });
}
