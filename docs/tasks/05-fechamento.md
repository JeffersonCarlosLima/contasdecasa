# 05 · Fechamento do mês

Tela: `docs/interfaces/06-fechamento.md` · Regras: `docs/specs/02-regras-calculo.md`

- [x] `monthly_periods` criado sob demanda; salário/extra por membro; investimento (valor ou %); regra do mês
- [x] Resumo e "Acerto entre vocês" usando `lib/calc`
- [x] Ao abrir mês novo: oferecer copiar recorrentes e gerar parcelas que caem nele (idempotente)
- [ ] Fechar mês (somente leitura) e reabrir (dono/admin); bloquear edição em todas as actions
- [x] Validar percentuais personalizados somando 100%
