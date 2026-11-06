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
