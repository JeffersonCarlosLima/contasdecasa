# 04 · Cadastros: tipos e formas

Tela: `docs/interfaces/07-tipos-de-despesa.md`

- [x] CRUD de tipos de despesa (nome, cor chart-1…6, natureza, limite mensal, arquivar)
- [x] CRUD básico de formas de pagamento (nome, tipo, dono opcional)
- [x] Só admin/dono escrevem; todos leem; sempre filtrando por `family_id`
- [x] Arquivar e reativar formas de pagamento (substitui exclusão física por `archived boolean not null default false`; listagem em `/tipos` mostra ativas e arquivadas com ação Reativar; reuso de nome de arquivada permitido)
- [x] Campos de cartão em formas de pagamento (somente tipo `cartao`): final do cartão (4 dígitos), dia de fechamento (1–31) e dia de vencimento (1–31); ambos os dias preenchidos ou ambos nulos
- [x] Regra de fatura (`cardInvoice`): função pura para calcular mês de referência (`reference_month`) e data de vencimento (`due_date`) a partir da data da compra e dias de fechamento/vencimento; aplicada na confirmação da importação de cartão e como sugestão no formulário de lançamento de despesas
- [x] Link e aviso na importação: mensagem com link direto para `/tipos#formas` (para admin/dono) ou orientação para pedir a um admin (para membro comum) quando não houver formas ativas compatíveis
