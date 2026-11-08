# 02 · Regras de cálculo

Funções puras em `src/lib/calc` (sem I/O, só inteiros em centavos), com testes em Vitest.

- **Renda da família** = Σ (salário + extra) dos membros no mês.
- **Investimento** = valor fixo, ou percentual × renda.
- **Disponível** = renda − investimento. **Gasto** = Σ despesas do mês (sem `deleted_at`).
  **Sobra** = disponível − gasto (pode ser negativa).
- **Responsabilidade de cada membro** = despesas em que ele é dono + a parte dele nas despesas da Família.
  A parte é dividida **só entre quem participa da divisão**:
  - `igual`: por igual;
  - `proporcional`: pelo **salário** (sem extras);
  - `personalizada`: pelos percentuais (somam 100%).
- **Já pagou** = Σ despesas pagas por ele (`paid_by`). **Saldo** = já pagou − responsabilidade. Mostrar
  "{Fulano} deve R$ X a {Beltrano}" quando houver acerto.
- **Arredondamento**: a sobra de centavos vai para o membro de maior parte, para a soma bater exatamente.
- Casos sem renda (proporcional sem salários) caem em partes iguais entre os participantes.
- Sem participantes na divisão: despesas da Família ficam sem responsável (alerta na UI).

## Testes obrigatórios

2 membros iguais · proporcional · personalizado · dependente fora da divisão · mês sem renda · sobra
negativa · parcelas atravessando o ano (dez → jan).

## Parcelas

O valor informado é o de **cada parcela**. Parcela N de T gera as parcelas N+1…T nos meses seguintes
(mesmo grupo, mesmo valor, vencimento no mesmo dia, ajustado ao último dia do mês quando necessário).

## Fatura de cartão de crédito

Função pura `cardInvoice({ purchaseDate, closingDay, dueDay })` em `src/lib/card-invoice.ts`:
- **Fechamento da fatura**:
  - Compra com dia ≤ dia de fechamento (`purchaseDate.day <= closingDay`): entra na fatura que fecha no **mesmo mês** da compra.
  - Compra com dia > dia de fechamento (`purchaseDate.day > closingDay`): entra na fatura que fecha no **mês seguinte** ao da compra.
- **Vencimento da fatura**:
  - Se `dueDay > closingDay`: o vencimento ocorre no **mesmo mês** do fechamento da fatura.
  - Se `dueDay <= closingDay`: o vencimento ocorre no **mês seguinte** ao fechamento da fatura.
- **Dias inexistentes**:
  - Se o dia do vencimento não existir no mês correspondente (ex.: 31 em abril/junho/setembro/novembro, ou 29/30/31 em fevereiro), o dia é ajustado automaticamente para o **último dia do mês** (`Math.min(dueDay, daysInMonth)`).
- **Mês de referência e data de vencimento**:
  - `reference_month` = dia 1 do mês do **vencimento** (`YYYY-MM-01`).
  - `due_date` = data calculada do vencimento (`YYYY-MM-DD`).
- **Aplicação no sistema**:
  - Na confirmação da importação de extrato (`confirmBatch`), se a forma de pagamento for cartão de crédito com `closing_day` e `due_day` configurados.
  - Como sugestão dinâmica no formulário de criação/edição manual de despesas quando o usuário seleciona um cartão configurado.
  - Cartões sem dias configurados ou outras formas (conta, pix, dinheiro) mantêm o vencimento igual à data da despesa e o `reference_month` no dia 1 do mês da compra/transação.

## Mês de referência sempre no dia 1 (`reference_month`)

- Todas as despesas (`expenses.reference_month`) e períodos mensais (`monthly_periods.month`) utilizam estritamente o formato `YYYY-MM-01` (primeiro dia do mês).
- Normalização padronizada pela função `toMonthDate(month)` em `src/lib/period.ts`: qualquer entrada em formato `AAAA-MM` ou `AAAA-MM-DD` é convertida para `AAAA-MM-01`.
- Validação no banco via check constraints:
  - `expenses_reference_month_day1`: `extract(day from reference_month) = 1`
  - `monthly_periods_month_day1`: `extract(day from month) = 1`
- Em consultas e filtros da UI (`/despesas?mes=YYYY-MM`, `/mes`), as datas são agrupadas e comparadas pela chave `toMonthKey` (`YYYY-MM`), garantindo que nenhuma despesa importada ou lançada manualmente fique invisível no filtro mensal.


