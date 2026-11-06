# 01 · Entrar / Criar conta — `/entrar` e `/cadastro`

Protótipo: `docs/design/telas/Login.dc.html`. Sem menu lateral nem barra inferior.

## Layout

- **Desktop:** duas colunas. Esquerda (`flex 1 1 480px`, some no celular): fundo `--brand`, texto
  `--on-brand`, padding 48px, logo "Contas da Casa" no topo, frase em `display` 44/48:
  **"As contas da família, cada um no seu lugar."**, ilustração decorativa de telhas
  (`--brand-soft`) no rodapé (SVG, `aria-hidden`). Direita (`flex 1 1 420px`): formulário centralizado,
  largura máx. 400px, gap 24px.
- **Celular:** só a coluna do formulário; no topo, logo em `--brand-ink` e a frase em `body cc-muted`.

## Coluna do formulário (ordem)

1. Controle segmentado **Entrar | Criar conta** (alterna `/entrar` ↔ `/cadastro`).
2. Título `heading`: **"Bem-vindo de volta"**; apoio: "Entre com o email e a senha que você cadastrou."
   (em Criar conta: título "Crie sua conta" e apoio correspondente, mesmo tamanho).
3. Campos: **Email** (`placeholder="voce@email.com"`, `autocomplete=email`) e **Senha**
   (`placeholder="Sua senha"`, `autocomplete=current-password`; no cadastro `new-password`, mais **Seu nome**).
4. Linha: checkbox **"Manter conectado"** (marcado) · link **"Esqueci a senha"** *(link visível, mas a
   recuperação de senha está fora do MVP — ver `docs/specs/06-decisoes.md`; leva a aviso "Em breve")*.
5. Botão primário largura total, altura 46px: **"Entrar"** (cadastro: "Criar conta").
6. Card `surface-sunken` (sem borda/sombra, padding 16): label **"Recebeu um convite?"** + caption
   "Crie sua conta com o mesmo email do convite e você entra direto na família que te convidou."
7. Rodapé: "Primeira vez aqui? **Crie sua conta e sua família**" (link para cadastro).

## Estados

- Erro de credencial: hint de erro sob o campo/topo em `--danger`: "Email ou senha incorretos. Confira e tente de novo."
- Carregando: botão desabilitado com rótulo "Entrando…".
- Rate limit: "Muitas tentativas. Aguarde um minuto e tente de novo."
