# 06 · Fechamento do mês — `/mes`

Protótipo: `docs/design/telas/Fechamento.dc.html`.

## Topo

`heading` **"Fechamento de {mês}"** (ex.: "Fechamento de novembro"); apoio: "Informe a renda e quanto vão
investir. O resto do app calcula a partir daqui." À direita `MonthSwitcher`.

## Duas colunas (`flex-wrap`; coluna principal `flex 999 1 520px`, resumo `flex 1 1 300px`)

### Coluna principal (gap 24px)

1. **Card "Renda do mês"** — por membro com login/renda: avatar + nome, grade com **Salário** e
   **Extra (freelas, vendas)** (`MoneyInput`); divisor 1px `--line` entre membros. Dependente sem renda:
   linha "{nome} dependente · sem renda" + botão ghost sm **"Informar renda"**.
2. **Card "Investimento do mês"** (`cc-kpi--invest`, sem borda) — segmentado **Valor fixo | % da renda**
   (selecionado em `invest-soft`); campos **"Quanto vão investir"** (R$ ou %; hint "{x}% da renda de {mês}.")
   e **"Onde"** (texto, ex.: "Reserva de emergência").
3. **Card "Divisão das despesas da família"** — caption "Vale só para despesas marcadas como "Família".
   Cada um continua responsável pelas próprias."; segmentado **Partes iguais | Proporcional ao salário |
   Personalizada**; lista `cc-list` com `cc-member` por membro: avatar, nome, meta ("Participa · salário
   R$ 3.200,00" / "Não participa da divisão"), percentual à direita (`49,2%`, "—" se fora). Caption:
   "Quem participa é definido em **Família**. Extras não entram no cálculo proporcional." (link → `/familia`).

### Coluna "Resumo" (`cc-card`, gap 12px)

`title` "Resumo" · Renda total · − Investimento (valor em `--invest`) · divisor · **Disponível para
despesas** (negrito) · − Despesas lançadas · divisor · **Sobra** (`title` + valor 24/30 em `--invest`, ou
`--danger` se negativa) · divisor · label muted **"Acerto entre vocês"** · uma linha por membro
(avatar + nome + total que lhe cabe) · caption: "Até agora: Jefferson pagou R$ … e Lorrane R$ … das
despesas da família. Pelo que já foi pago, {Fulano} deve R$ X a {Beltrano}." · card `surface-sunken`
**"Recorrentes de {mês anterior}"**: "Aluguel, internet, água, energia e gasolina já foram copiados para
{mês}." (ou botão **Copiar recorrentes** se ainda não copiou) · botão primário **"Salvar fechamento"** ·
botão secundário **"Fechar mês e bloquear edição"** (confirmação; dono/admin; mês fechado mostra
**"Reabrir mês"**).

## Celular

Uma coluna: Renda → Investimento → Divisão → Resumo; botões em largura cheia.
