# 00 · Visão e stack

**Contas da Casa**: controle financeiro de uma família. Hoje é uma planilha (uma aba por mês: salários,
contas, parcelas, status Pago/Aguardando pagamento, quanto cada um paga e quanto sobra).

**Modelo é família.** A pessoa se cadastra, cria a família e vincula os outros membros. Pensado para
marido e mulher, mas aceita mais membros (filhos, parentes). Cada membro lança as próprias despesas e todos
veem os lançamentos unificados, organizados por pessoa.

## Stack (não trocar sem perguntar)

- Next.js 15 (App Router, Server Components, Server Actions) + TypeScript estrito
- PostgreSQL já existente no servidor: **um único banco** (`DATABASE_URL`), tudo no schema `public`,
  inclusive as tabelas de autenticação. Não criar outros bancos nem schemas.
- Drizzle ORM + drizzle-kit, migrations versionadas em `drizzle/`
- Better Auth (email e senha, sessão por cookie)
- Zod valida toda entrada · Tailwind CSS v4 · Recharts · Vitest (regras de cálculo) · pnpm
- Dockerfile multi-stage (só o app; Postgres é externo)

## Princípios

1. Dinheiro sempre inteiro em centavos; nunca float.
2. Todo registro de negócio tem `family_id` e **toda consulta filtra por ele**.
3. Família e membro vêm da sessão no servidor, nunca do cliente.
4. Interface em pt-BR seguindo `docs/interfaces` à risca.
5. Regras de cálculo são funções puras em `src/lib/calc`, cobertas por testes.
6. Não inventar requisitos: o que não está nas specs, pergunte.

## Fora do MVP

Recuperação de senha por email (adiada pelo Jefferson), várias famílias por usuário na UI
(o schema já suporta), gráficos de evolução multi-mês.
