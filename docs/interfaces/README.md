# Interfaces — contrato de fidelidade

> **REGRA OBRIGATÓRIA: as interfaces deste diretório devem ser seguidas à risca.**
> Layout, hierarquia, textos, ordem dos blocos, estados e responsividade descritos aqui são
> requisitos, não sugestões. Qualquer desvio precisa de aprovação explícita do Jefferson antes
> de ser implementado. Em dúvida, pergunte; não "melhore" o design por conta própria.

## Fontes da verdade (em ordem de precedência)

1. Estes documentos (`docs/interfaces/*.md`) — textos e estrutura exatos.
2. Os protótipos HTML em `docs/design/telas/*.dc.html` (um por tela; o celular é a mesma tela a 390px).
3. O design system: `docs/design/README.md`, `docs/design/tokens.json`, `docs/design/bundle.css`,
   `docs/design/cc-theme.css` e `docs/design/componentes/*.md`.
4. Originais online (somente leitura):
   - Design system: https://claude.ai/artifact/UCqq53zbYaygpGw6vpQJyc
   - Telas: https://claude.ai/artifact/DSQySFdJgHrGa7AdyetUBv

Em conflito, vale a ordem acima. Os valores em R$, nomes ("Jefferson", "Lorrane", "Filho(a)") e
datas dos protótipos são **dados de exemplo**: a tela real mostra os dados reais, mas com o mesmo
formato, tamanho e hierarquia.

## Regras gerais (valem para todas as telas)

- Idioma: português do Brasil, tratamento por "você", rótulos em caixa de frase, sem emoji.
- Moeda: `R$ 1.234,56` via `Intl.NumberFormat('pt-BR', {style:'currency', currency:'BRL'})`;
  negativo `−R$ 412,30` (sinal de menos U+2212 antes do prefixo) em `--danger`; sempre `cc-num`.
- Status com nomes fixos: **Pago**, **Pendente**, **Atrasado** (nunca "Aguardando pagamento").
  Todo status leva ícone + palavra. Atrasado é calculado (pendente com vencimento antes de hoje).
- Cores só pelos tokens (`var(--…)`), nunca hex solto. Tema claro e `[data-theme="dark"]`.
- Fontes: Bricolage Grotesque (títulos e valores) e Instrument Sans (texto).
- Ícones: Lucide, traço 1,75, 20px (14px em selos), `currentColor`.
- Um botão `cc-btn--primary` por tela. Alvos de toque ≥ 40px (campos 44px).
- Foco visível: anel de 2px `--focus` com 2px de afastamento em todo controle.
- Pessoa = avatar com inicial + cor `person-a…d`; "Família" = avatar `family` com ícone de casa.
  Cor nunca sozinha: sempre com nome ou inicial.
- Mês ativo na URL (`?mes=2026-11`); `MonthSwitcher` no topo de toda tela de dados.
- Layout responsivo único com breakpoint **760px** (como em `cc-theme.css`):
  - `> 760px`: menu lateral de 248px + conteúdo (`cc-wrap`, máx. 1120px).
  - `≤ 760px`: sem menu lateral; cabeçalho `cc-mtop`, barra inferior `cc-bottom` (68px) com
    Início · Despesas · **botão central "Lançar despesa"** (`cc-fab`, 52px, elevado) · Mês · Família;
    margens de 16px; KPIs em 2 colunas (o primeiro ocupa a linha inteira); tabelas viram listas.
- Classes utilitárias `cc-hide-sm` (some no celular) e `cc-only-sm` (só no celular) são do design.
- Estados vazios explicam o próximo passo; erros dizem o que fazer (ver `docs/design/README.md`).

## Casca do app (todas as telas autenticadas)

**Menu lateral (desktop):** logo "Contas da Casa" (display 22px) · nav: Dashboard, Despesas,
Fechamento do mês, Tipos e formas, Família (item ativo com `brand-soft`/`brand-ink`) ·
botão primário "Lançar despesa" · rodapé: avatar da pessoa, nome, "{Família} · {n} membros" como Link para `/conta` (`aria-label="Minha conta"`, alvo ≥ 40px, foco visível).
Na tela "Lançar despesa" o botão primário do menu não aparece.

**Celular:** cabeçalho com o título da tela (ou logo) e avatar à direita como Link para `/conta` (`aria-label="Minha conta"`, alvo ≥ 40px, foco visível); barra inferior como acima.
Na tela "Lançar despesa" não há barra inferior; o cabeçalho tem botão "Voltar" e título.

## Mapa tela → rota → arquivo

| Tela | Rota | Doc | Protótipo |
| --- | --- | --- | --- |
| Entrar / Criar conta | `/entrar`, `/cadastro` | [01-entrar.md](01-entrar.md) | `Login.dc.html` |
| Criar família | `/criar-familia` | [02-criar-familia.md](02-criar-familia.md) | `Onboarding.dc.html` |
| Dashboard | `/` | [03-dashboard.md](03-dashboard.md) | `Main.dc.html` |
| Despesas | `/despesas` | [04-despesas.md](04-despesas.md) | `Despesas.dc.html` |
| Lançar despesa | `/despesas/nova`, `/despesas/[id]` | [05-lancar-despesa.md](05-lancar-despesa.md) | `NovaDespesa.dc.html` |
| Fechamento do mês | `/mes` | [06-fechamento.md](06-fechamento.md) | `Fechamento.dc.html` |
| Tipos e formas | `/tipos` | [07-tipos-de-despesa.md](07-tipos-de-despesa.md) | `Categorias.dc.html` |
| Família e membros | `/familia` | [08-familia.md](08-familia.md) | `Familia.dc.html` |
| Importação de extratos | `/importar`, `/importar/[id]`, `/importar/[id]/confirmar`, `/importar/historico` | [09-telas-sem-prototipo.md](09-telas-sem-prototipo.md) | Sem protótipo |

Telas sem protótipo (`/convite/[token]`, `/conta`, `/importar` e sub-rotas): seguir a mesma casca, componentes e textos descritos em [09-telas-sem-prototipo.md](09-telas-sem-prototipo.md).

## Componentes a portar (React, em `src/components/ui`)

Button · MoneyInput · StatusBadge · CategoryChip · KpiCard · ExpenseRow · BudgetBar · SplitCard ·
MonthSwitcher · MemberAvatar (+ MemberRow, PersonGroup, SegmentedControl, Field). Cada um mantém
as classes `cc-` de `bundle.css`/`cc-theme.css` (copiadas para `src/styles/`). Contratos em
`docs/design/componentes/*.md`.
