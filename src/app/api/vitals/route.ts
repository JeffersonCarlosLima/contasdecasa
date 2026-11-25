import { NextResponse } from "next/server";
import { z } from "zod";
import { logPerf } from "@/lib/perf-log";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.enum(["LCP", "INP", "CLS", "FCP", "TTFB"]),
  value: z.number().finite(),
  rating: z.enum(["good", "needs-improvement", "poor"]).optional(),
  path: z.string().max(200),
});

/** Recebe Web Vitals do navegador e grava uma linha no log. Sem login, sem dados pessoais. */
export async function POST(request: Request) {
  const text = await request.text();
  if (text.length > 1000) return new NextResponse(null, { status: 413 });
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) return new NextResponse(null, { status: 400 });
  // Só o caminho, sem query string.
  logPerf("web-vital", { ...parsed.data, path: parsed.data.path.split("?")[0] });
  return new NextResponse(null, { status: 204 });
}
