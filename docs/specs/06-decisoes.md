# 06 · Decisões e premissas

| Tema | Decisão | Origem |
| --- | --- | --- |
| Parcelas | O valor informado é o de **cada parcela** | Protótipo de "Lançar despesa" ("Valor de cada parcela.") |
| Recuperação de senha | Fora do MVP; link "Esqueci a senha" mostra "Em breve" | Jefferson: "podemos deixar para depois" |
| Tailwind | v4, tokens no `@theme` apontando para variáveis CSS | Premissa (confirmar) |
| Divisão personalizada | Percentuais ficam em `family_members.custom_percent`; o mês só escolhe a regra | Premissa (confirmar) |
| Fuso | `America/Araguaina` para "hoje" e vencimentos; `paid_at` em UTC, exibido no fuso | Especificação |
| Ids do Better Auth | `text` (padrão da lib); tabelas de negócio usam `uuid` | Premissa técnica |
| Telas sem protótipo | `/convite/[token]` e `/conta`: propostas em `interfaces/09`, aprovar antes | Pedido de fidelidade |
| Dados dos protótipos | Valores/nomes são exemplos; formato e hierarquia são requisito | Pedido de fidelidade |
| Fatura de cartão | Compra ≤ fechamento fecha no mês; > fechamento no mês seguinte. Vencimento no mesmo mês se vencimento > fechamento, senão no seguinte. Dia inexistente ajustado ao fim do mês. `reference_month` é o dia 1 do mês de vencimento. Usado na importação e como sugestão no form. | Decisão técnica (Plano formas de pagamento) |
| Formas de pagamento | Cartões podem ter final (4 dígitos), fechamento e vencimento (ambos ou nenhum). Formas são arquivadas (`archived`), nunca excluídas. | Decisão técnica (Plano formas de pagamento) |

Premissas marcadas "confirmar" valem até o Jefferson dizer o contrário.
