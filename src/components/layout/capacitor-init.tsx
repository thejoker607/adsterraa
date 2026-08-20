"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";

export function CapacitorInit() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    async function initNativeShell() {
      try {
        await StatusBar.setOverlaysWebView({ overlay: false });
        await StatusBar.setStyle({ style: Style.Light });
        await StatusBar.setBackgroundColor({ color: "#ffffff" });
      } catch {
        // Status bar plugin unavailable — CSS safe-area still applies
      }

      document.documentElement.classList.add("native-app");
    }

    void initNativeShell();
  }, []);

  return null;
}
