# Contas da Casa — Documentação do Projeto

Guia completo da arquitetura, especificações funcionais, contratos de interface, regras de negócio e procedimentos de deploy do **Contas da Casa**.

---

## Índice da Documentação

| Pasta / Arquivo | Descrição |
| --- | --- |
| [`specs/`](specs/) | **Especificações Técnicas:** visão geral, modelo de dados, regras de cálculo, permissões por papel, fluxos de uso, rotas e registro histórico de decisões de produto (`06-decisoes.md`). |
| [`interfaces/`](interfaces/) | **Contratos de Interface:** especificações estritas de layout, textos, hierarquia, comportamento mobile e acessibilidade para cada tela da aplicação. |
| [`design/`](design/) | **Design System:** catálogo de tokens semânticos (`tokens.json`), componentes reutilizáveis e protótipos estáticos de referência (`telas/`). |
| [`tasks/`](tasks/) | **Plano de Trabalho:** checklists de entrega por etapa, status consolidado de cada funcionalidade e pendências mapeadas. |
| [`deploy.md`](deploy.md) | **Guia de Deploy & Operação:** instruções de publicação em produção, backups transacionais do PostgreSQL, rollback e gestão segura de credenciais. |

> **Ordem recomendada de leitura para desenvolvimento:**
> 1. [`specs/00-visao.md`](specs/00-visao.md)
> 2. [`specs/01-dados.md`](specs/01-dados.md)
> 3. [`specs/02-regras-calculo.md`](specs/02-regras-calculo.md)
> 4. [`specs/06-decisoes.md`](specs/06-decisoes.md)
> 5. [`interfaces/README.md`](interfaces/README.md)
> 6. [`tasks/README.md`](tasks/README.md)

---

## Telas e Fluxos Implementados

A aplicação contempla os seguintes fluxos e telas em produção:

### 1. Tipos e Formas de Pagamento (`/tipos`)
- **Categorias:** CRUD de tipos de despesa com atribuição de cor semântica (`chart-1` a `chart-6`), natureza de gasto (essencial vs. estilo de vida), limite mensal de orçamento e arquivamento lógico.
- **Formas de Pagamento:** Cadastro de contas correntes, cartões de crédito, dinheiro físico e chaves Pix.
  - Para cartões de crédito: suporte a final de cartão (4 dígitos) e configuração de dia de fechamento e dia de vencimento.
  - Arquivamento e reativação: formas não utilizadas podem ser arquivadas para manter o histórico íntegro sem poluir selects de novos lançamentos.

### 2. Importação e Conciliação de Extratos (`/importar`)
- **Envio do Arquivo (`/importar`):** Upload de extratos CSV com suporte automático a layouts conhecidos (Banco Inter, Bradesco, Nubank) e mecanismo de mapeamento customizado de colunas caso o formato não seja pré-reconhecido.
- **Validação Preventiva:** Bloqueio seguro com orientação clara caso a família ainda não possua contas ou cartões ativos cadastrados.
- **Revisão Inteligente (`/importar/[id]`):**
  - Identificação automática de linhas de pagamento de fatura, marcando-as como `ignorar` (desmarcadas e não selecionáveis) para evitar duplicidade com as despesas do cartão.
  - Classificação preditiva de tipo (despesa vs. receita) e sugestão de categorias/membros a partir de regras pré-configuradas.
  - **Deduplicação Bidirecional:** Identificação de despesas já existentes (via fingerprint) e receitas já consolidadas em lotes confirmados, marcando-as como `Duplicada` e desmarcadas por padrão.
  - **Experiência Mobile:** Cards otimizados e barra de ação fixa no rodapé (`.cc-review-bar`) com contador e motivo em tempo real caso haja pendências impeditivas.
- **Confirmação do Lote (`/importar/[id]/confirmar`):**
  - Agrupamento inteligente das compras de cartão de crédito no mês de competência da fatura (`cardInvoice`), considerando dias de fechamento e vencimento.
  - Redirecionamento após confirmação para `/despesas?mes=YYYY-MM&lote=<id>` na competência com maior volume de despesas, apresentando banner informativo e link para receitas consolidadas em `/mes`.
- **Histórico de Lotes (`/importar/historico`):**
  - Rastreamento completo dos lotes (rascunho, confirmado, desfeito).
  - Ação de **Desfazer Importação** com reversão transacional no banco: desativação lógica de despesas e dedução exata das receitas aplicadas na renda mensal.

### 3. Fechamento do Mês (`/mes`)
- Registro mensal de salários líquidos dos membros e rendas extras consolidadas.
- Definição do aporte de investimentos (em valor nominal ou percentual da renda) com especificação do destino.
- Seleção e cálculo da regra de divisão das contas comuns:
  - **Proporcional:** Rateio baseado na renda líquida de cada integrante.
  - **50 / 50:** Divisão igualitária entre os membros pagantes.
  - **Personalizada:** Percentuais customizados definidos pela família.
- Travamento de segurança para meses fechados: impede edições acidentais em períodos encerrados.
- Interface responsiva com feedback de confirmação próximo ao botão de salvar no celular.

### 4. Gestão de Despesas (`/despesas`, `/despesas/nova`, `/despesas/[id]`)
- Lançamento rápido de despesas com definição de responsável individual ou encargo da "Família toda".
- Sugestão automática de competência e vencimento ao selecionar cartões com fatura configurada.
- Suporte a parcelamentos (com criação de lançamentos futuros no mesmo agrupamento) e despesas fixas recorrentes.
- Visualização flexível: agrupamento por responsável com subtotais ou listagem cronológica por data de vencimento.
- Filtros dinâmicos por membro, categoria e status (todas, pagas ou pendentes).
- Ações rápidas de conferência: marcar despesa como paga, desfazer pagamento e exclusão lógica.

### 5. Dashboard da Família (`/`)
- Visão holística da saúde financeira do mês selecionado.
- Indicadores principais (KPIs): Renda Familiar, Investimento Planejado, Orçamento Disponível, Gastos Consolidados e Saldo Restante.
- Barra de acompanhamento visual do orçamento (`BudgetBar`).
- Distribuição de gastos por integrante e por categoria com códigos de cor semânticos.
- **SplitCard:** Resumo claro e objetivo da divisão: quem gastou quanto e quem deve transferir para quem para quitar a fatura do mês.
- Alertas de contas com vencimento próximo ou em atraso.

### 6. Família, Membros e Convites (`/familia`, `/convite/[token]`)
- Controle de acesso granular por papéis: Dono, Administrador e Membro Comum.
- Cadastro de dependentes familiares (fora da divisão financeira de pagadores).
- Emissão de convites via e-mail e geração de links de convite copiáveis e compartilháveis via WhatsApp.
- Fluxo de entrada de novos participantes com vinculação imediata à família.

### 7. Configurações da Conta (`/conta`)
- Atualização cadastral de perfil (nome e e-mail).
- Alteração segura de senha de acesso.
- Seletor de preferência de tema (Claro, Escuro ou Automático do Sistema) com carregamento sem tremulação visual (*flash*).
- Zona de gerenciamento de risco para o Dono (transferência de titularidade da família ou exclusão).
- Acesso facilitado: clique direto no avatar do cabeçalho mobile ou no rodapé da navegação desktop.

### 8. Telas de Sistema e Resiliência
- **Página 404 (`/not-found`):** Interface consistente com orientações para retornar com segurança às rotas ativas.
- **Tratamento de Erros (`/error`):** Telas amigáveis com botão de reintento, sem exposição de erros internos de banco de dados ou stack traces para o usuário.
- **Indicador de Carregamento (`/loading`):** Transições suaves entre páginas mantendo a casca do app estável.
- **Monitoramento Operacional:** Endpoint `/api/health` para sondagem de saúde (*health check*) do serviço em produção.
