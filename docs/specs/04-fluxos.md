# 04 · Fluxos

1. **Cadastro e login.** Email + senha. Após cadastro: se há convite pendente para o email → entra direto na
   família; senão → `/criar-familia` (nome + próprio parentesco). Quem cria vira `dono`.
2. **Membros** (dono/admin): convidar por email, adicionar dependente sem login, mudar papel/cor/parentesco/
   participação/percentual, reenviar ou cancelar convite, remover membro.
3. **Fechamento do mês.** Renda de cada membro, investimento, regra de divisão. Ao abrir um mês novo, oferece
   copiar as recorrentes e gera as parcelas que caem nele. Mês fechado = leitura; dono/admin reabrem.
4. **Lançar despesa.** Qualquer membro com login; escolhe o dono (ele, outro membro ou "Família"). Parcelado
   gera as futuras no mesmo grupo; editar/excluir pergunta "só esta" ou "esta e as próximas".
5. **Despesas.** Visão unificada do mês, agrupada por pessoa (seção por membro + "Família", com subtotal,
   pago e pendente) ou por data; filtros por membro, categoria e status; marcar como paga registra quem pagou.
6. **Cadastros.** CRUD de tipos de despesa e formas de pagamento por família; categorias padrão criadas com a
   família: Moradia, Alimentação, Transporte, Cartões, Contas da casa, Saúde e academia.
7. **Importação de extratos bancários.**
   - **Upload e Análise (`/importar`)**:
     - Suporta extratos em CSV com layouts nativos (Nubank Conta/Cartão, Inter e Bradesco) ou modelos configurados pelo usuário (`import_mappings`, ex.: Itaú).
     - Cada linha gera um `fingerprint` SHA-256 determinístico baseado em `(family_id, payment_method_id, date, amount_cents, description_normalized, external_id)`.
     - **Classificação automática de tipo**:
       - Valores positivos (`amount_cents > 0`) viram `receita` (ou `salario` se a descrição normalizada contiver termos de salário: "TED C SAL", "SALARIO", "REMUNERACAO", "PROVENTOS", "FOLHA DE PAGAMENTO", "PAGTO SALARIO").
       - Valores negativos (`amount_cents < 0`) viram `despesa`.
       - Padrões de pagamento de fatura (ex.: "PAGAMENTO FATURA", "PAGTO FATURA CARTAO") são automaticamente classificados como `ignorar` (motivo: "Pagamento de fatura de cartão de crédito...") para não duplicar com os lançamentos do extrato do cartão.
       - Linhas com valor zero são classificadas como `ignorar`.
       - Transferências identificadas entre contas próprias da mesma família no mesmo lote são classificadas como `ignorar`.
       - Regras da família (`import_rules`): aplicam categoria, responsável ou forma de pagamento prioritariamente.
     - **Situação das linhas**:
       - `Nova`: lançamento inédito na família.
       - `Duplicada`: despesa cujo fingerprint já existe em despesa ativa da família, ou despesa manual já existente com mesma data, valor e forma; OU receita/salário cujo fingerprint já existe em lote confirmado (não desfeito) da família, ou repetida no mesmo lote.
       - `Possível Vínculo`: despesa com mesmo valor e vencimento/competência de despesa pendente existente (até 7 dias).
     - **Seleção padrão**:
       - Linhas `Nova` e `Possível Vínculo` vêm marcadas (`selected = true`).
       - Linhas `Duplicada` e `Ignorada` vêm desmarcadas (`selected = false`).
   - **Revisão e Confirmação (`confirmBatch`)**:
     - **Linhas ignoradas nunca gravam**: itens com tipo `ignorar` jamais viram despesa ou receita, mesmo se o usuário marcar a seleção manualmente.
     - **Validação de meses fechados**: a confirmação é bloqueada se qualquer lançamento selecionado cair em competência fechada.
     - **Prevenção de duplicatas de despesas**: linhas com fingerprint já existente em despesas ativas da família são puladas (sem inserir), evitando estourar o índice único `expenses_family_fingerprint_uq`. São marcadas como `duplicada` e associadas à despesa existente. Se houver duas despesas iguais no mesmo lote, a 1ª cria o registro e a 2ª vira duplicada apontando para ela (`matched_expense_id`).
     - **Prevenção de duplicatas de receitas**: receitas cujo fingerprint já existe em lote confirmado da família (ou já processado no mesmo lote) são puladas e NÃO somam novamente na renda do membro (`member_incomes.extra_cents` / `salary_cents`), sendo marcadas como duplicadas e desmarcadas.
     - **Lotes desfeitos não contam**: lotes com status `desfeito` são desconsiderados na checagem de duplicidade de receitas e despesas.
     - **Regra de fatura do cartão**: se a forma de pagamento for cartão de crédito com fechamento e vencimento cadastrados, cada despesa tem `reference_month` e `due_date` calculados via `cardInvoice` (mês do vencimento da fatura).
     - **Redirecionamento pós-confirmação**:
       - Redireciona para `/despesas?mes=YYYY-MM&lote=UUID`.
       - O mês de destino (`targetMonth`) é calculado automaticamente: (1) mês com mais despesas criadas (empate: o mais antigo); (2) sem despesas, o mês da primeira receita; (3) fallback: mês corrente.
       - A tela exibe banner informativo com a contagem de lançamentos gravados, receitas direcionadas para `/mes` e eventuais lançamentos que caíram em outros meses.
   - **Desfazer lote (`undoBatch`)**:
     - Exclusão lógica (`deleted_at`) restrita às despesas criadas pelo lote (despesas pré-existentes vinculadas retornam para status `pendente` com pagamento limpo).
     - Reversão estrita de receitas: subtrai de `member_incomes.extra_cents` exatamente o valor que o lote havia aplicado (`applied_extra_cents`) e restaura o salário anterior (`previous_salary_cents`), preservando receitas manuais ou de outros lotes.
     - O lote passa para status `desfeito`. Ao reimportar o extrato, todas as linhas voltam a ser reconhecidas como `Nova`.
   - **Limitação conhecida**:
     - Lançamentos estritamente idênticos (mesma data, valor e descrição) no mesmo extrato que não possuem identificador externo único (`externalId` ou FITID bancário) geram o mesmo hash determinístico. O sistema grava o primeiro e trata o segundo como duplicado.
   - **Erros amigáveis**:
     - Falhas inesperadas ou consultas quebradas do banco de dados são capturadas pelo servidor, logadas com `console.error` (com contexto e causas técnicas) e retornam mensagens amigáveis em português ("Não foi possível confirmar a importação. Nada foi gravado. Tente de novo."), sem expor código SQL, nomes de constraints ou stack traces para o usuário.

