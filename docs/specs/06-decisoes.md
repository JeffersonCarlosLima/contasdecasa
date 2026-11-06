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

Premissas marcadas "confirmar" valem até o Jefferson dizer o contrário.
