# Plano de Execução & Status das Tarefas

Acompanhamento do status real de implementação do **Contas da Casa**, cobrindo o que está concluído e entregue até o commit `c414a2e` na branch `feat/formas-pagamento`, bem como as pendências mapeadas para o projeto.

---

## Status Consolidado por Etapa

| # | Etapa | Documento | Status Real no Commit `c414a2e` |
| --- | --- | --- | --- |
| **00** | Fundação do projeto | [`00-fundacao.md`](00-fundacao.md) | **Concluído** (Next.js 15, React 19, TypeScript estrito, Tailwind v4, Drizzle, pnpm, Vitest) |
| **01** | Schema e migrations | [`01-schema.md`](01-schema.md) | **Concluído** (Migrations 0000 a 0004, todas aplicadas em produção; a 0004 garante `reference_month` no dia 1) |
| **02** | Autenticação | [`02-auth.md`](02-auth.md) | **Concluído** (Better Auth com cookies HTTP-only, rotas `/entrar`, `/cadastro`, proteção por middleware) |
| **03** | Família e convites | [`03-familia-convites.md`](03-familia-convites.md) | **Concluído** (Rotas `/familia` e `/convite/[token]`, papéis dono/admin/membro, links compartilháveis) |
| **04** | Cadastros: tipos e formas | [`04-cadastros.md`](04-cadastros.md) | **Concluído** (Categorias com cores e limites; formas com final de cartão, fechamento, vencimento, regra `cardInvoice` e arquivamento) |
| **05** | Fechamento do mês | [`05-fechamento.md`](05-fechamento.md) | **Concluído** (Rota `/mes`, salários, extras, investimentos, regras de rateio proporcional/50-50/custom, trava de mês fechado) |
| **06** | Despesas | [`06-despesas.md`](06-despesas.md) | **Concluído** (Rotas `/despesas`, `/despesas/nova`, `/[id]`, parcelamento, recorrência, filtros, marcar como paga, banner pós-importação) |
| **07** | Dashboard | [`07-dashboard.md`](07-dashboard.md) | **Concluído** (Rota `/`, KPIs mensais, barra de orçamento, gráficos por pessoa e categoria, `SplitCard`, próximos vencimentos) |
| **08** | Docker, deploy e acabamento | [`08-docker-qualidade.md`](08-docker-qualidade.md) | **Concluído** (Dockerfile multi-stage, `compose.yaml`, telas 404/erro/loading, `/api/health`, alvos móveis ≥ 40px, safe-area) |
| **09** | Seed de desenvolvimento | [`09-seed.md`](09-seed.md) | **Concluído** (`pnpm db:seed` com Família Lima, donos, administradores e dependentes) |
| **10** | Importador de extratos | [`../interfaces/09-telas-sem-prototipo.md`](../interfaces/09-telas-sem-prototipo.md) | **Concluído** (Upload, mapeamento, revisão desktop/mobile, deduplicação de despesas e receitas, histórico e desfazimento) |

---

## O que está Pronto e Testado (Commit `c414a2e`)

No commit `c414a2e` da branch `feat/formas-pagamento`, foram validados e consolidados:

1. **Conciliação e Deduplicação Robusta:**
   - **Pagamentos de Fatura:** Detectados e classificados como `ignorar`; exibidos desmarcados e desabilitados para seleção, evitando duplicação com os extratos de cartão de crédito.
   - **Prevenção de Duplicidade em Despesas:** Despesas com fingerprint existente no banco são puladas sem gerar erro de violação de unicidade (`expenses_family_fingerprint_uq`).
   - **Prevenção de Duplicidade em Receitas:** Receitas já confirmadas em lotes anteriores são marcadas como `Duplicada` e desmarcadas por padrão; mesmo se forçadas na revisão, a ação de confirmação não soma o valor novamente na renda (`memberIncomes.extraCents`).
   - **Desfazimento Atômico no Histórico:** Ação de desfazer lote em `/importar/historico` restaura com precisão o saldo anterior de renda e reverte as despesas para estado pendente/excluído. Na reimportação subsequente, os lançamentos voltam a ser classificados como novos.
   - **Sanitização de Erros:** Erros de banco de dados ou restrições não são expostos em texto bruto para o usuário final, sendo tratados com mensagens amigáveis em português.

2. **Refinamento Mobile e Acessibilidade:**
   - Alvos de clique e toque com altura mínima de 40px no celular (`min-height: 40px`).
   - Barra de ação fixa no rodapé da revisão mobile (`.cc-review-bar`) com contador e motivo explícito quando desabilitada.
   - Suporte a celular em orientação horizontal (paisagem baixa: `max-height: 500px`) adotando casca mobile sem quebras de layout.
   - Navegação direta para `/conta` através do avatar no cabeçalho mobile e rodapé desktop.
   - Ausência de clarão (*flash*) visual na alternância de tema escuro/claro.

3. **Qualidade de Código:**
   - 479 testes automatizados aprovados no Vitest (`pnpm test`).
   - Zero erros no linter (`pnpm lint`) e na checagem estrita de tipos (`pnpm typecheck`).
   - Build de produção Next.js standalone compilado com sucesso.

---

## Pendências do Projeto

As seguintes atividades estão mapeadas como pendências a serem tratadas:

### 1. Merge do PR #1 no GitHub
- A branch `feat/formas-pagamento` está com o commit `c414a2e` enviado à origem (`origin/feat/formas-pagamento`).
- Pendente a aprovação e merge do Pull Request #1 para a branch principal (`main`).

### 2. Seis Decisões em Aberto do Importador
Itens de negócio e refinamento arquitetural a deliberar com o Jefferson:
1. **Mapeamentos Personalizados:** Confirmar se modelos de mapeamento de colunas de arquivos CSV devem ser reutilizáveis entre todas as famílias do sistema ou mantidos estritamente privados por família (`import_mappings`).
2. **Janela de Tolerância de Transferências Próprias:** Atualmente o algoritmo reconhece transferências próprias com até 1 dia de diferença e mesmo valor; confirmar se deve ser estendida para até 3 dias úteis para cobrir compensações de fins de semana e feriados.
3. **Regras de Classificação Preditivas:** Definir a política de criação automática de regras de categorização a partir de edições feitas pelo usuário na tela de revisão (nível de sensibilidade e precedência de prioridade).
4. **Formato OFX:** Confirmar se há necessidade real de parser de arquivos `.ofx` no curto prazo ou se a cobertura nativa de CSV de bancos brasileiros (Inter, Bradesco, Nubank) é suficiente.
5. **Estornos e Lançamentos Negativos em Entradas:** Padronização de lançamentos com valor negativo em extratos de conta corrente quando classificados como receita (abater de renda extra vs. lançar como ajuste de despesa).
6. **Política de Expiração de Rascunhos:** Confirmar a janela de retenção de lotes abandonados em status de `rascunho` antes da limpeza periódica automática (atualmente fixada em 30 dias).

### 3. Extratos Reais Anonimizados para Testes de Regressão
- Atualmente o diretório `tests/fixtures/import/` conta com extratos sintéticos padronizados (`bradesco-conta.csv`, `inter-conta.csv`, `nubank-cartao.csv`, `nubank-conta.csv`) e com um extrato real anonimizado da conta Bradesco (`bradesco-conta-2026.csv`: linha "Extrato de: Ag | Conta" antes do cabeçalho, BOM, célula vazia como espaço e rodapés).
- **Pendente:** Coletar e commitar extratos reais anonimizados de contas e faturas de cartão do Banco Inter e do Banco Bradesco para garantir cobertura contra variações reais de formatação, pontuação, acentuação e metadados nos cabeçalhos desses bancos.
