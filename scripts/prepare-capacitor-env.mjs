import { networkInterfaces } from "node:os";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

function getLanIp() {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] ?? []) {
      if (net.family === "IPv4" && !net.internal) return net.address;
    }
  }
  return null;
}

const envPath = resolve(process.cwd(), ".env.local");
let serverUrl = process.env.CAPACITOR_SERVER_URL?.trim();

if (!serverUrl && existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const match = line.match(/^CAPACITOR_SERVER_URL=(.+)$/);
    if (match) serverUrl = match[1].trim();
  }
}

if (!serverUrl) {
  const ip = getLanIp();
  const port = process.env.PORT || "3000";
  serverUrl = ip ? `http://${ip}:${port}` : "http://10.0.2.2:3000";
  console.log(`CAPACITOR_SERVER_URL not set. Using ${serverUrl}`);
}

if (existsSync(envPath)) {
  let env = readFileSync(envPath, "utf8");
  if (/^CAPACITOR_SERVER_URL=/m.test(env)) {
    env = env.replace(/^CAPACITOR_SERVER_URL=.*$/m, `CAPACITOR_SERVER_URL=${serverUrl}`);
  } else {
    env += `\nCAPACITOR_SERVER_URL=${serverUrl}\n`;
  }
  writeFileSync(envPath, env);
} else {
  writeFileSync(envPath, `CAPACITOR_SERVER_URL=${serverUrl}\n`, { flag: "a" });
}

console.log(`APK will load: ${serverUrl}`);
console.log("Keep the web server running: npm run dev:mobile");
