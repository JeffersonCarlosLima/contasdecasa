"use client";

import { useReportWebVitals } from "next/web-vitals";

const TRACKED = new Set(["LCP", "INP", "CLS", "FCP", "TTFB"]);

/** Envia Web Vitals reais para `/api/vitals` (vai só para o log do próprio servidor). */
export function WebVitals() {
  useReportWebVitals((metric) => {
    if (!TRACKED.has(metric.name)) return;
    const body = JSON.stringify({
      name: metric.name,
      value: Math.round(metric.value * 1000) / 1000,
      rating: metric.rating,
      path: window.location.pathname,
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/vitals", new Blob([body], { type: "application/json" }));
    } else {
      void fetch("/api/vitals", { method: "POST", body, keepalive: true }).catch(() => undefined);
    }
  });
  return null;
}
