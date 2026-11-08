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
| Avatar para conta | O avatar do cabeçalho mobile e o bloco avatar/nome do rodapé do menu lateral viram Link para `/conta` com `aria-label="Minha conta"`, foco visível e alvo ≥ 40px. | Jefferson (revisão mobile) |
| Alvos no celular | Todos os alvos interativos no celular devem ter no mínimo 40px (`.cc-seg button`, `.cc-btn--sm`, `.cc-month__btn`, `.cc-chip`, checkboxes com hit area expandida). | Jefferson (revisão mobile) |
| Celular deitado | Celular em orientação paisagem com altura baixa e toque (`(max-height: 500px) and (orientation: landscape) and (pointer: coarse)`) adota o layout de celular (cabeçalho mobile, barra inferior e sem menu lateral), evitando que desktops/notebooks com janela baixa ativem o modo mobile. | Jefferson (revisão mobile) |
| Páginas de erro/404 | Páginas próprias e consistentes com o design system para 404 (`not-found`), erros (`error`, `global-error`) e carregamento (`loading`). | Jefferson (revisão mobile) |
| Convite de membros | Criação de convite de membros com campo de e-mail conforme especificado no contrato. | Jefferson (revisão mobile) |
| Redirecionamento pós-importação | Após confirmar importação, abrir `/despesas?mes=YYYY-MM&lote=<id>` no mês com mais despesas criadas, com aviso de quantas despesas, outros meses e receitas enviadas para a renda em `/mes`. | Jefferson (revisão de importação) |
| Barra fixa na revisão mobile | Na revisão da importação no celular (`/importar/[id]`), o botão "Continuar para confirmação" fica numa barra fixa no rodapé (sai do topo no celular), com contador e motivo visível quando desabilitado. | Jefferson (revisão de importação) |
| Mês de receita importada | Bug corrigido: receita importada gravava mês com dia diferente de 1; o mês de referência de receita (`monthly_periods.month`) deve ser estritamente o primeiro dia do mês (`YYYY-MM-01`). | Jefferson (correção de importação) |

Premissas marcadas "confirmar" valem até o Jefferson dizer o contrário.
