# Contas da Casa

App web de gestão financeira familiar colaborativa (substitui a planilha "Contas do mês"):
salários e rendas extras consolidados por competência, investimentos planejados, despesas com responsável/categoria/vencimento/parcelamento/recorrência, importação e conciliação de extratos bancários com detecção de fatura de cartão de crédito, e fechamento mensal com divisão proporcional à renda ou regras customizadas.

---

## Stack Tecnológica

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router, React 19 Server Components e Server Actions)
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/) (modo estrito)
- **Banco de Dados:** [PostgreSQL](https://www.postgresql.org/) (schema `public`, sem migrations manuais)
- **ORM & Migrations:** [Drizzle ORM](https://orm.drizzle.team/) & `drizzle-kit`
- **Autenticação:** [Better Auth](https://www.better-auth.com/) (sessões seguras por cookie HTTP-only)
- **Estilização & Design System:** [Tailwind CSS v4](https://tailwindcss.com/) com tokens semânticos em variáveis CSS (`var(--...)`) e ícones [Lucide React](https://lucide.dev/)
- **Visualização de Dados:** [Recharts](https://recharts.org/)
- **Validação de Schemas:** [Zod](https://zod.dev/)
- **Testes & Qualidade:** [Vitest](https://vitest.dev/) e ESLint
- **Gerenciador de Pacotes:** [pnpm](https://pnpm.io/) (v10 via Corepack)

---

## Como Rodar Localmente

### 1. Pré-requisitos

- Node.js 22+ (`node -v`)
- pnpm 10 habilitado (`corepack enable`)
- Instância PostgreSQL ativa com banco criado (ex.: `financas`)

### 2. Configurar Variáveis de Ambiente

Copie o modelo de ambiente:

```bash
cp .env.example .env
```

Edite o arquivo `.env` preenchendo as configurações locais:

```env
DATABASE_URL=postgres://usuario:senha@localhost:5432/financas
BETTER_AUTH_SECRET=gere_uma_chave_aleatoria_com_openssl_rand_base64_32
BETTER_AUTH_URL=http://localhost:3000
APP_URL=http://localhost:3000
APP_PORT=3000
# SMTP é opcional: se vazio, links de convite são gerados para cópia manual na tela.
```

> [!CAUTION]
> **Segurança & Segredos:**
> Nunca comite credenciais, senhas, tokens ou o arquivo `.env` no repositório Git (já protegido via `.gitignore`).
> Informações sensíveis de infraestrutura (como IP do servidor de produção e caminho de chaves SSH) nunca devem constar no versionamento; utilize variáveis lidas exclusivamente do seu ambiente local (`DEPLOY_HOST` e `DEPLOY_SSH_KEY`).

### 3. Instalar Dependências e Banco de Dados

```bash
# Instala pacotes
pnpm install

# Aplica as migrations versionadas ao PostgreSQL
pnpm db:migrate

# Popula o banco com a família de exemplo e lançamentos de demonstração
pnpm db:seed
```

### 4. Executar o Servidor de Desenvolvimento

```bash
pnpm dev
```

Acesse a aplicação em [http://localhost:3000](http://localhost:3000).

---

## Usuários de Teste (Seed de Desenvolvimento)

Ao rodar `pnpm db:seed`, o ambiente é inicializado com a **Família Lima** e os seguintes acessos (senha padrão para todos em dev: `senha-dev-contas`):

| E-mail / Usuário | Papel | Perfil |
| --- | --- | --- |
| `jefferson@exemplo.com` | Dono | Acesso total à administração, pagamentos e zona de perigo |
| `lorrane@exemplo.com` | Admin | Gestão de membros, tipos, formas de pagamento e fechamento |
| Filho(a) *(sem login)* | Dependente | Cadastro familiar sem usuário de acesso (fora do rateio) |

---

## Comandos de Qualidade e Manutenção

| Comando | Descrição |
| --- | --- |
| `pnpm test` | Executa a suíte de testes automatizados com Vitest |
| `pnpm test:watch` | Executa testes em modo assistido (watch) |
| `pnpm lint` | Validação estática de código com ESLint |
| `pnpm typecheck` | Checagem estrita de tipos com `tsc --noEmit` |
| `pnpm build` | Cria o build de produção Next.js standalone |
| `pnpm start` | Inicia o servidor com o build de produção |
| `pnpm db:generate` | Gera arquivo SQL de migration em `drizzle/` a partir do schema |
| `pnpm db:migrate` | Executa migrations pendentes no banco configurado |
| `pnpm db:seed` | Executa o script de carga inicial de desenvolvimento |
| `pnpm db:studio` | Interface visual do Drizzle para exploração do banco |
| `pnpm tokens` | Atualiza variáveis CSS a partir de `docs/design/tokens.json` |

---

## Estrutura de Pastas Principal

```
contasdecasa/
├── src/
│   ├── app/                    # Rotas do Next.js (App Router)
│   │   ├── (auth)/             # Rotas públicas: entrar (/entrar), cadastro (/cadastro)
│   │   ├── (app)/              # Rotas autenticadas da casca principal
│   │   │   ├── page.tsx        # Dashboard principal (KPIs, gráficos, saldo, pendências)
│   │   │   ├── despesas/       # Listagem, filtros e lançamento (/despesas, /nova, /[id])
│   │   │   ├── mes/            # Fechamento mensal, salários e divisão de contas (/mes)
│   │   │   ├── tipos/          # Gestão de categorias e formas de pagamento (/tipos)
│   │   │   ├── importar/       # Upload, revisão, confirmação e histórico de extratos
│   │   │   ├── familia/        # Membros, dependentes e convites (/familia)
│   │   │   ├── conta/          # Perfil, alteração de senha e tema (/conta)
│   │   │   ├── error.tsx       # Tratamento visual amigável de erros da casca
│   │   │   ├── not-found.tsx   # Página 404 personalizada do app
│   │   │   └── loading.tsx     # Estado de carregamento integrado
│   │   ├── convite/[token]/    # Aceite de convites com link
│   │   ├── criar-familia/      # Onboarding de nova família
│   │   └── api/                # Endpoints internos (auth e healthcheck em /api/health)
│   ├── components/             # Componentes de interface (MobileHeader, Sidebar, UI)
│   ├── db/                     # Conexão Drizzle, schema relacional, migrate e seed
│   ├── lib/                    # Regras de negócio puras
│   │   ├── calc/               # Funções de cálculo de divisão, saldo e rateio
│   │   ├── import/             # Parsers de extrato (Inter, Bradesco, Nubank) e deduplicação
│   │   ├── card-invoice.ts     # Regra de cálculo de competência e vencimento de fatura
│   │   ├── dates.ts / period.ts# Manipulação de competências e timezone
│   │   └── session.ts          # Controle de sessão e permissões por papel
│   └── styles/                 # Folhas de estilo compartilhadas (tokens, layout, componentes)
├── drizzle/                    # Migrations SQL versionadas do banco de dados
├── docs/                       # Documentação técnica e operacional
│   ├── README.md               # Índice detalhado da documentação
│   ├── deploy.md               # Procedimento de deploy, backup e infraestrutura
│   ├── specs/                  # Especificação funcional, regras de dados e decisões
│   ├── interfaces/             # Contratos visuais e regras estritas de cada tela
│   ├── design/                 # Tokens, componentes e protótipos de referência
│   └── tasks/                  # Plano de execução detalhado e status das tarefas
└── tests/                      # Fixtures e cenários de teste automatizados
```

---

## Documentação Detalhada & Deploy

- **Índice da Documentação Técnica:** [`docs/README.md`](docs/README.md)
- **Guia de Publicação e Infraestrutura:** [`docs/deploy.md`](docs/deploy.md)
- **Contratos de Interface & Telas:** [`docs/interfaces/README.md`](docs/interfaces/README.md)
- **Status do Plano de Trabalho:** [`docs/tasks/README.md`](docs/tasks/README.md)
