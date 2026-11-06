# 01 · Modelo de dados

Implementação: `src/db/schema/*.ts`. Chaves `uuid`, `created_at`/`updated_at` em tudo. Dinheiro em
`bigint` (centavos, modo `number`). Percentuais em pontos-base (inteiro; 5000 = 50,00%).

- **Better Auth** (`user`, `session`, `account`, `verification`) no mesmo banco/schema.
- **families**: nome, `default_split_rule` (`igual|proporcional|personalizada`), `created_by`.
- **family_members**: família, `user_id` (opcional — dependente sem login), nome de exibição, papel
  (`dono|admin|membro`), parentesco (`titular|conjuge|filho|outro`), cor (`person-a…d`), `participates_in_split`,
  `custom_percent` (opcional), status (`ativo|convidado|removido`). Único por (família, usuário).
  No MVP um usuário pertence a uma família; schema pronto para várias.
- **family_invites**: família, email, papel, parentesco, `token_hash`, convidado por, `expires_at` (7 dias),
  `accepted_at`.
- **categories** (tipos de despesa): família, nome, cor (`chart-1…6`), natureza (`fixa|variavel`),
  `monthly_limit_cents` opcional, `archived`.
- **payment_methods**: família, nome (Nubank, Bradesco, Pix…), tipo (`cartao|conta|pix|dinheiro`),
  membro dono opcional.
- **monthly_periods**: família, `month` (sempre dia 1), modo do investimento (`valor|percentual`), valor ou
  percentual, destino do investimento, regra de divisão do mês (null = padrão da família), `closed_at`/`closed_by`.
  Único (família, mês).
- **member_incomes**: período, membro, salário, extra. Único (período, membro).
- **expenses**: família, mês de referência, descrição, valor, categoria, **dono** (membro; null = despesa da
  Família, compartilhada), **lançado por**, forma de pagamento, vencimento, status (`pendente|pago`),
  `paid_at`, pago por, grupo de parcelamento, parcela atual, total de parcelas, recorrente de origem,
  observação, `deleted_at` (exclusão lógica).
- **recurring_expenses**: modelo (descrição, valor, categoria, dono, forma de pagamento, dia de vencimento, ativo).

"Atrasado" **não é coluna**: é `pendente` com vencimento antes de hoje no fuso `America/Araguaina`.

Remover membro = `status='removido'`; as despesas ficam e a UI as marca como de ex-membro.
