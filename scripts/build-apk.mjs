import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { existsSync, writeFileSync } from "node:fs";

import "./prepare-capacitor-env.mjs";

const root = process.cwd();
const isWin = process.platform === "win32";

const javaCandidates = [
  process.env.JAVA_HOME,
  "C:\\Program Files\\Android\\Android Studio\\jbr",
  "C:\\Program Files\\Java\\jdk-21",
  "C:\\Program Files\\Java\\jdk-17",
].filter(Boolean);

for (const candidate of javaCandidates) {
  const javaBin = resolve(candidate, "bin", isWin ? "java.exe" : "java");
  if (existsSync(javaBin)) {
    process.env.JAVA_HOME = candidate;
    break;
  }
}

if (!process.env.JAVA_HOME) {
  console.warn("JAVA_HOME not set. Install JDK 17+ or Android Studio.");
} else {
  console.log(`Using JAVA_HOME=${process.env.JAVA_HOME}`);
}

const sdkCandidates = [
  process.env.ANDROID_HOME,
  process.env.ANDROID_SDK_ROOT,
  resolve(process.env.LOCALAPPDATA || "", "Android", "Sdk"),
  resolve(process.env.USERPROFILE || "", "AppData", "Local", "Android", "Sdk"),
].filter(Boolean);

let androidSdk = sdkCandidates.find((candidate) =>
  existsSync(resolve(candidate, "platforms"))
);

if (androidSdk) {
  const localPropsPath = resolve(root, "android", "local.properties");
  const sdkDir = androidSdk.replace(/\\/g, "\\\\");
  writeFileSync(localPropsPath, `sdk.dir=${sdkDir}\n`, "utf8");
  console.log(`Using Android SDK: ${androidSdk}`);
} else {
  console.warn("Android SDK not found. Install Android Studio SDK or set ANDROID_HOME.");
}

function run(command, args, cwd = root) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: isWin,
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run("npx", ["cap", "sync", "android"]);

const gradle = isWin ? "gradlew.bat" : "./gradlew";
const androidDir = resolve(root, "android");

if (!existsSync(resolve(androidDir, gradle))) {
  console.error("Android project not found. Run: npx cap add android");
  process.exit(1);
}

const variant = process.argv.includes("--release") ? "assembleRelease" : "assembleDebug";
run(gradle, [variant], androidDir);

const apkName = variant === "assembleRelease" ? "app-release-unsigned.apk" : "app-debug.apk";
const apkPath = resolve(androidDir, "app", "build", "outputs", "apk", variant === "assembleRelease" ? "release" : "debug", apkName);

console.log("\nAPK build complete.");
console.log(`Output: ${apkPath}`);
