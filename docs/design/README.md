Contas da Casa é o app de finanças do lar: um casal lança salários, define quanto vai investir no mês, registra as despesas de cada um e vê no dashboard quanto sobra. O visual é de casa, não de banco: fundo cor de papel, telha como cor de ação, folha verde para tudo que cresce.

## Princípios

1. **O número é o herói.** Cada tela responde uma pergunta com um valor: quanto sobra, quanto cada um paga, quanto falta pagar. Valores em `money-lg` ou `money`, sempre com a classe `cc-num`.
2. **Da família, organizado por pessoa.** A base é o casal, mas a família pode ter mais membros. Todos veem tudo; cada despesa tem um dono (avatar `person-a` … `person-d` com a inicial, nunca só a cor) ou é da família (`family`), dividida entre quem participa da divisão. Listas agrupam por pessoa com subtotal.
3. **Calma, mesmo no vermelho.** Saldo negativo usa `danger` no número e um aviso em `danger-soft`. Sem alertas piscando, sem modais de susto.
4. **Mês é a unidade.** Toda tela de dados tem um `MonthSwitcher` no topo; nada soma meses diferentes sem dizer isso.

## Voz e texto

- Português do Brasil, tratamento por **você**, frases curtas. Sem emoji na interface.
- Rótulos em caixa de frase: "Renda do mês", não "RENDA DO MÊS" nem "Renda Do Mês".
- Verbos diretos nos botões: **Lançar despesa**, **Salvar salário**, **Marcar como paga**, **Fechar mês**.
- Status têm nomes fixos: **Pago**, **Pendente**, **Atrasado**. A planilha antiga dizia "Aguardando pagamento"; no app é sempre **Pendente**.
- Estados vazios explicam o próximo passo: "Nenhuma despesa em novembro. Lance a primeira ou copie as recorrentes do mês passado."
- Erros dizem o que fazer: "Informe um valor maior que zero.", não "Valor inválido".

## Dinheiro e datas

- Moeda sempre com prefixo e espaço: `R$ 1.234,56`. Ponto no milhar, vírgula nos centavos, sempre dois decimais. Use `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`.
- Negativo com sinal de menos antes do prefixo: `−R$ 412,30`, em `danger`. Nunca entre parênteses.
- Sobra positiva e investimento em `invest`; despesas em `ink`. Não pinte despesa de vermelho só por ser gasto.
- Mês por extenso no título ("Novembro 2026"), abreviado em listas e gráficos ("nov"). Datas `10/11`; ano só quando não é o atual.
- Parcelas: "parcela 3 de 8" no metadado; "3/8" só em tabela estreita.

## Cor

- Fundo de página `surface`; cards e listas em `surface-raised` com borda `line` e `shadow-card`; trilhos e áreas agrupadas em `surface-sunken`.
- Texto principal `ink`, apoio `ink-muted`. Ambos passam 4,5:1 nas três superfícies nos dois temas.
- `brand` (telha) é para a ação principal de cada tela, o item ativo da navegação e a marca. Um botão `brand` por tela. Texto sobre ele em `on-brand`.
- `invest` (folha) significa investimento ou sobra positiva e nada mais.
- Status: `paid` (azul), `pending` (âmbar), `danger` (atrasado). Pago é azul de propósito: fica longe do verde do investimento e o par pago/atrasado se distingue sem depender de vermelho×verde. Todo status leva ícone e palavra.
- Gráficos por categoria usam `chart-1` a `chart-6` na ordem, e `chart-6` para "Outras" quando houver mais de seis categorias.
- Foco: anel sólido de 2px em `focus` com 2px de afastamento, em todo controle.

## Tipografia

- Duas famílias do Google Fonts: **Bricolage Grotesque** (`display`) para títulos e valores, **Instrument Sans** (`sans`) para todo o resto. `components/bundle.css` já importa as duas.
- `display` só no mês atual do dashboard e na tela de login. Páginas abrem com `heading`, cards com `title`.
- Valores: `money-lg` no KPI, `money` na linha de despesa, sempre `cc-num` para alinhar colunas.
- Texto em `body`; descrição da despesa em `body-strong`; rótulos e selos em `label`; vencimento, parcela e quem lançou em `caption`.

## Espaço, forma e layout

- Escala de 4 em 4 até 16, depois 24, 32, 48: `space-1` … `space-8`. Padding de card `space-5` no desktop e `space-4` no celular; seções do dashboard separadas por `space-6`.
- Raios: `radius-sm` em selos, `radius-md` em botões e campos, `radius-lg` em cards, `radius-full` em avatares, chips e barras.
- Celular primeiro: uma coluna até 640px, margens `space-4`. No desktop, grade de KPIs com `cc-kpis` e conteúdo até 1200px.
- Alvos de toque com pelo menos 40px de altura (`cc-btn`, `cc-input` 44px).
- Movimento só em transições de cor de 150ms. Nada de animar números contando.

## Iconografia

- Use **Lucide** (traço 1,75px, 20px nos botões, 14px nos selos), em `currentColor`. Ícone nunca substitui palavra em status ou ação destrutiva.
- Categorias são identificadas por um ponto colorido (`chart-*`) e pelo nome, não por ícones ilustrados.
- Sem logo por enquanto: o nome "Contas da Casa" em `display` faz o papel de marca.

## Dashboard: ordem fixa

1. `MonthSwitcher` e título do mês.
2. Linha de `KpiCard`: Renda, Investimento, Disponível, Gasto, Sobra.
3. `BudgetBar` mostrando renda dividida em investido, pago, pendente e livre.
4. `SplitCard`: quanto cada um paga.
5. Gastos por categoria (barras horizontais em `chart-*`) e próximos vencimentos (`ExpenseRow`).

## Componentes

Os componentes são classes CSS em `components/bundle.css`, prefixo `cc-`, prontas para usar com Tailwind ou CSS puro no Next.js. Cada pasta em `components/` tem um README com o que o componente recebe e quando usar.
