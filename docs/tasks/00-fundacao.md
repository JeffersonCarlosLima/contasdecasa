# 00 · Fundação — feito

- [x] Next.js 15 + TS estrito, Tailwind v4, ESLint, Vitest, pnpm (`node-linker=hoisted`)
- [x] Design system: `docs/design/*`, `src/styles/{tokens,theme,components,layout}.css` (`pnpm tokens`)
- [x] Fontes via `next/font/google` (Bricolage Grotesque + Instrument Sans) em `src/app/layout.tsx`
- [x] Componentes `src/components/ui`: Button, MoneyInput, StatusBadge, CategoryChip, KpiCard, ExpenseRow,
      BudgetBar, SplitCard, MonthSwitcher, MemberAvatar
- [ ] Componentes que faltam (ver `docs/design/componentes/MemberRow.md` e cc-theme): MemberRow, PersonGroup,
      SegmentedControl, Field/Select, AppShell (menu lateral + barra inferior + FAB), Modal
- [x] `lib/money`, `lib/dates`, `lib/calc` com testes
