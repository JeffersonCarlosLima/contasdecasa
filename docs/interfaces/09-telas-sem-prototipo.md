# 09 · Telas sem protótipo

Não existe layout aprovado para estas telas. **Não implemente sem confirmar o layout com o Jefferson.**
Proposta (para aprovação), usando só componentes e tokens existentes:

## `/convite/[token]`
Mesma coluna de formulário de `01-entrar.md` (sem painel telha no celular). Título "Você foi convidado
para a {Família}", apoio "{Fulano} convidou {email}.". Se não logado: botões **Criar conta** (email fixo
do convite) e **Já tenho conta**. Logado com o email do convite: botão primário **"Entrar na família"**.
Token inválido/expirado: "Este convite expirou ou já foi usado. Peça um novo link para quem convidou você."

## `/conta`
Casca do app, `heading` "Minha conta", cards: **Dados** (nome, email), **Senha** (trocar senha),
**Aparência** (tema Claro/Escuro/Sistema), **Sair** (botão `cc-btn--secondary`). Dono: card
"Zona de perigo" com **Transferir posse** e **Excluir família** (`cc-btn--danger`, confirmação).

## Importação de extratos — `/importar`, `/importar/[id]`, `/importar/[id]/confirmar`, `/importar/historico`

Fluxo para importação de extratos bancários e faturas de cartão (arquivos OFX e CSV):

### `/importar` (Upload e Mapeamento)
- Dropzone de arquivo (suporte a `.ofx` e `.csv`) e seleção de forma de pagamento ativa.
- Família sem formas: admin/dono vê *"Cadastre uma conta ou cartão em [Formas de pagamento](/tipos#formas) antes de importar."*; membro comum vê *"Peça a um admin da família para cadastrar uma conta ou cartão antes de importar."*. Botão de envio desabilitado.
- Link "Gerenciar formas de pagamento" visível apenas para admin/dono.
- Para arquivos CSV: passo intermediário de mapeamento de colunas (data, descrição, valor) com prévia das primeiras linhas.

### `/importar/[id]` (Revisão do Lote)
- Lista e classificação dos lançamentos importados com sugestões automáticas por regras ou histórico (tipo, categoria, responsável, ignorar).
- Desktop: tabela de revisão (`ReviewTable`) com ações em lote (`BulkActionsBar`) e botão primário **"Continuar para confirmação ({n})"** nas ações do topo (`.cc-top .cc-actions`).
- **Celular:** cards de revisão (`ReviewMobileCards`). **O botão "Continuar para confirmação" fica numa barra fixa no rodapé (sai do topo no celular)**, com contador de lançamentos selecionados e motivo visível quando desabilitado (ex.: "Selecione ao menos um lançamento", "X despesas selecionadas sem categoria", "X receitas selecionadas sem responsável").

### `/importar/[id]/confirmar` (Confirmação)
- Resumo agrupado das despesas por mês de competência/fatura, receitas destinadas à renda em `/mes`, e lançamentos ignorados.
- Botão primário **"Confirmar importação"**.
- **Redirecionamento pós-confirmação:** abre `/despesas?mes=YYYY-MM&lote=<id>` no mês com o maior número de despesas criadas pelo lote, exibindo o aviso com o resumo da importação (quantidade de despesas no mês, menção a outros meses afetados com link direto e receitas enviadas para a renda em `/mes`).

### `/importar/historico` (Histórico de Lotes)
- Lista de lotes confirmados com data de importação, nome do arquivo, forma de pagamento vinculada, quantidade de lançamentos e ação de **Desfazer importação** (com modal de confirmação).
