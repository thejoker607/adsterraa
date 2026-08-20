import type { CapacitorConfig } from "@capacitor/cli";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const serverUrl = process.env.CAPACITOR_SERVER_URL?.trim();

const config: CapacitorConfig = {
  appId: "com.adpromo.app",
  appName: "AdPromo",
  webDir: "public",
  android: {
    allowMixedContent: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: "#4f46e5",
      showSpinner: true,
      spinnerColor: "#ffffff",
    },
    StatusBar: {
      style: "LIGHT",
      backgroundColor: "#4f46e5",
    },
  },
};

if (serverUrl) {
  config.server = {
    url: serverUrl,
    cleartext: serverUrl.startsWith("http://"),
    androidScheme: serverUrl.startsWith("https://") ? "https" : "http",
  };
}

export default config;
