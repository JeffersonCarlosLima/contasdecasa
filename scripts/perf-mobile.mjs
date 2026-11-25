// Mede LCP/CLS/carregamento de páginas num "celular" com rede Slow 4G e CPU 4x mais lenta.
// Uso: node scripts/perf-mobile.mjs https://seu-host /entrar /despesas
// Páginas logadas: informe o cookie da sessão em COOKIE="better-auth.session_token=..."
// Requer o pacote `playwright` instalado (não faz parte das dependências do app).
import { createRequire } from "node:module";
const { chromium, devices } = createRequire(import.meta.url)("playwright");

const [base, ...paths] = process.argv.slice(2);
if (!base) {
  console.error("Uso: node scripts/perf-mobile.mjs <url-base> [caminhos...]");
  process.exit(1);
}

const SLOW_4G = { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 };

const browser = await chromium.launch();
const context = await browser.newContext({ ...devices["Pixel 5"] });
if (process.env.COOKIE) {
  const [name, ...rest] = process.env.COOKIE.split("=");
  await context.addCookies([{ name, value: rest.join("="), url: base }]);
}

for (const path of paths.length ? paths : ["/entrar"]) {
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", SLOW_4G);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await page.addInitScript(() => {
    window.__m = { lcp: 0, cls: 0 };
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__m.lcp = e.startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__m.cls += e.value; }).observe({ type: "layout-shift", buffered: true });
  });
  const t0 = Date.now();
  await page.goto(new URL(path, base).href, { waitUntil: "load", timeout: 60_000 });
  const loadMs = Date.now() - t0;
  await page.waitForTimeout(1500);
  const m = await page.evaluate(() => window.__m);
  console.log(JSON.stringify({ path, loadMs, lcpMs: Math.round(m.lcp), cls: Math.round(m.cls * 1000) / 1000 }));
  await page.close();
}
await browser.close();
