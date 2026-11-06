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
