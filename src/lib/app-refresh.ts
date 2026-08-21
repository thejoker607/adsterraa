"use client";

import { useEffect } from "react";

export const APP_REFRESH_EVENT = "adpromo:refresh";

export function dispatchAppRefresh() {
  window.dispatchEvent(new Event(APP_REFRESH_EVENT));
}

/** Re-run client fetches when the user pull-to-refreshes. */
export function useOnAppRefresh(callback: () => void | Promise<void>) {
  useEffect(() => {
    const handler = () => {
      void callback();
    };
    window.addEventListener(APP_REFRESH_EVENT, handler);
    return () => window.removeEventListener(APP_REFRESH_EVENT, handler);
  }, [callback]);
}
