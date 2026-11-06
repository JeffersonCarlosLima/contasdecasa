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
