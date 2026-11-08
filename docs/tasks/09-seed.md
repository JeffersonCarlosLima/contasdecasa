# 09 · Seed

`pnpm db:seed` cria uma família de exemplo: 2 membros (Jefferson e Lorrane) e um mês de despesas.

- [ ] Criar usuários pela API do Better Auth (senha de desenvolvimento documentada no README)
- [ ] Família, categorias padrão e formas de pagamento:
  - Cartão Nubank do Jefferson: tipo `cartao`, dono Jefferson, final do cartão `1234`, dia de fechamento 5, dia de vencimento 15
  - Conta Bradesco da Lorrane: tipo `conta`, dona Lorrane
- [ ] `monthly_periods` + rendas da família
- [ ] Despesas do protótipo (`docs/design/telas/Despesas.dc.html`): Aluguel, Internet, Água, Energia, Inter, Fatura Bradesco, Manutenção, Gasolina, Parcela do carro 7/8
- [ ] Idempotente (não duplica ao rodar duas vezes)
