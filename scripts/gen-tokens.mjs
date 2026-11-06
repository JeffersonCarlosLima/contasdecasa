// Gera src/styles/tokens.css a partir de docs/design/tokens.json (fonte da verdade do design system).
import { readFileSync, writeFileSync } from "node:fs";

const t = JSON.parse(readFileSync("docs/design/tokens.json", "utf8"));
const block = (theme) => {
  const lines = [];
  for (const c of t.color.tokens) lines.push(`  --${c.name}: ${c.value[theme] ?? c.value.light};`);
  for (const s of t.shadow.tokens) lines.push(`  --${s.name}: ${s.value[theme] ?? s.value.light};`);
  return lines.join("\n");
};
const static_ = [
  ...t.spacing.tokens.map((s) => `  --${s.name}: ${s.value};`),
  ...t.radius.tokens.map((r) => `  --${r.name}: ${r.value};`),
].join("\n");

const css = `/* GERADO por scripts/gen-tokens.mjs a partir de docs/design/tokens.json. Não edite à mão. */
/* --font-display e --font-sans vêm do next/font (src/app/layout.tsx). */
:root {
${block("light")}
${static_}
}

[data-theme="dark"] {
${block("dark")}
}
`;
writeFileSync("src/styles/tokens.css", css);
console.log("src/styles/tokens.css gerado");
