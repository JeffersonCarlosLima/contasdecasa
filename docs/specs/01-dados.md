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
  `monthly_limit_cents` opcional, `archived`. Único por (família, nome).
- **payment_methods**: família, nome (Nubank, Bradesco, Pix…), tipo (`cartao|conta|pix|dinheiro`),
  membro dono opcional, `archived` (boolean, default false — formas nunca são excluídas fisicamente para preservar histórico),
  `card_last4` (texto de 4 dígitos, opcional, só tipo `cartao`; check `payment_methods_card_last4_chk`: nulo ou `^[0-9]{4}$`),
  `closing_day` (smallint 1..31, opcional, só tipo `cartao`; check `payment_methods_closing_day_chk`),
  `due_day` (smallint 1..31, opcional, só tipo `cartao`; check `payment_methods_due_day_chk`).
  Check de integridade `payment_methods_both_days_chk`: ambos (`closing_day` e `due_day`) preenchidos ou ambos nulos.
- **monthly_periods**: família, `month` (sempre dia 1; check `monthly_periods_month_day1`: `extract(day from month) = 1`),
  modo do investimento (`valor|percentual`), valor ou percentual, destino do investimento,
  regra de divisão do mês (null = padrão da família), `closed_at`/`closed_by`. Único (família, mês).
- **member_incomes**: período, membro, salário, extra. Único (período, membro).
- **expenses**: família, `reference_month` (sempre dia 1; check `expenses_reference_month_day1`: `extract(day from reference_month) = 1`),
  descrição, valor (`amount_cents`), categoria, **dono** (membro; null = despesa da Família, compartilhada),
  **lançado por** (`created_by_member_id`), forma de pagamento, vencimento (`due_date`), status (`pendente|pago`),
  `paid_at`, pago por (`paid_by_member_id`), grupo de parcelamento (`installment_group_id`), parcela atual, total de parcelas,
  recorrente de origem, `import_batch_id` (vínculo ao lote de extrato), `fingerprint` (hash determinístico SHA-256 para deduplicação),
  observação, `deleted_at` (exclusão lógica).
  - Índice único parcial: `uniqueIndex("expenses_family_fingerprint_uq").on(familyId, fingerprint).where(fingerprint is not null and deleted_at is null)`:
    impede despesas ativas duplicadas com o mesmo fingerprint na mesma família, permitindo reimportação após exclusão lógica ou desfazimento do lote.
- **recurring_expenses**: modelo (descrição, valor, categoria, dono, forma de pagamento, dia de vencimento, ativo).

## Módulo de Importação de Extratos

- **import_batches**: lote de importação de extrato bancário.
  - Colunas: `family_id`, `payment_method_id`, `owner_member_id` (opcional), `layout` (identificador do layout ou modelo),
    `filename`, `file_size`, `row_count`, `status` (`rascunho|confirmado|desfeito`), `imported_by`,
    `confirmed_at`/`confirmed_by`, `undone_at`/`undone_by`, timestamps.
  - Índices: `(family_id)`, `(family_id, created_at)`, `(status)`.
- **import_rows**: linhas individuais extraídas do arquivo do extrato.
  - Colunas: `batch_id` (cascata na exclusão do lote), `family_id`, `line_no`, `date` (data da transação no extrato),
    `description_original`, `description_normalized` (sem acentos, maiúsculas, sem datas/parcelas/números longos),
    `amount_cents` (com sinal: negativo = saída/despesa, positivo = entrada/receita), `type` (`despesa|receita|salario|ignorar`),
    `ignore_reason`, `category_id`, `owner_member_id`, `payment_method_id`, `selected` (boolean, default true),
    `fingerprint` (hash determinístico SHA-256), `situation` (`nova|duplicada|possivel_vinculo`),
    `matched_expense_id` (aponta para despesa duplicada pré-existente ou criada pelo mesmo lote),
    `linked_expense_id` (aponta para despesa pendente existente vinculada à linha),
    `linked_row_id` (parceiro de transferência entre contas próprias no mesmo lote),
    `created_expense_id` (despesa criada na confirmação),
    `target_member_income_id` (renda do membro atualizada com receita/salário na confirmação),
    `applied_extra_cents` (valor exato de receita extra somado na renda para permitir reversão exata),
    `previous_salary_cents` (salário anterior para permitir restauração no desfazimento do lote).
  - Índices: `(batch_id)`, `(family_id)`, `(family_id, fingerprint)`.
- **import_rules**: regras de autoclassificação configuradas pela família.
  - Colunas: `family_id`, `match_type` (`contem|comeca`), `pattern`, `priority`, `category_id`, `owner_member_id` (opcional), `payment_method_id` (opcional).
- **import_mappings**: modelos de configuração para arquivos CSV customizados.
  - Colunas: `family_id`, `name`, `config` (jsonb com delimitador, colunas de data/descrição/valor/id externo, formato de data e separador decimal).

---

"Atrasado" **não é coluna**: é `pendente` com vencimento antes de hoje no fuso `America/Araguaina`.

Remover membro = `status='removido'`; as despesas ficam e a UI as marca como de ex-membro.

## Segurança e Infraestrutura

- **Segredos e Credenciais**: Nenhuma credencial sensível (senhas, chaves privadas SSH, tokens de API, strings reais de conexão de banco de produção) deve ser registrada ou commitada no repositório.
- **Deploy**: O endereço do servidor e o caminho da chave de autenticação SSH não são expostos no código versionado; são carregados a partir do ambiente local pelas variáveis `DEPLOY_HOST` e `DEPLOY_SSH_KEY`.

