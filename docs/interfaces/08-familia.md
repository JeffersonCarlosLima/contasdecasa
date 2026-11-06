# 08 · Família e membros — `/familia`

Protótipo: `docs/design/telas/Familia.dc.html`.

## Topo

Label `cc-muted` "Sua família" · `heading` **"{Nome da família}"** · apoio: "{n} membros e {m} convite
pendente. Todos veem os lançamentos de todos; cada um lança as próprias despesas." · botão secundário
**"Renomear família"** (dono/admin).

## Duas colunas (principal `flex 999 1 520px`, lateral `flex 1 1 320px`)

### Principal

- `title` **"Membros"** + `cc-list` de `MemberRow`: avatar (cor do membro), nome + selo de papel
  (`cc-role`: Dono com `--owner`, Admin, Membro, Dependente), meta ("Titular · jefferson@… · participa da
  divisão" / "Sem login · despesas lançadas pelos pais · fora da divisão"), botão ghost sm **"Editar"**.
  Convite pendente na mesma lista: avatar "?" (`person-d`), email no lugar do nome, selo
  **"Convite pendente"** (`--invited`), meta "Outro parente · membro · expira em 13/11", botão **"Reenviar"**.
- Card **"O que cada papel pode fazer"**: tabela (min 520px) — colunas *Papel · Lançar e editar as próprias ·
  Editar as dos outros · Membros, mês e cadastros*; linhas: Dono (Sim, Sim, "Sim, e pode excluir a
  família"), Admin (Sim, Sim, Sim), Membro (Sim, Não, Não), Dependente ("Sem login; dono e admin lançam
  por ele", colspan 3).

### Lateral

- Card **"Convidar membro"**: **Email** (`placeholder="nome@email.com"`), **Parentesco** (Cônjuge,
  Filho(a), Outro), **Papel** (Membro, Admin), checkbox **"Participa da divisão das despesas da família"**
  (marcado), botão primário **"Enviar convite"**, caption "O convite vale 7 dias. Sem email configurado, o
  app mostra um link para você mandar por WhatsApp."
- Card **"Dependente sem login"**: texto "Para filhos ou quem não vai usar o app. As despesas dele ficam
  separadas, e você escolhe se ele entra na divisão." + botão secundário **"Adicionar dependente"**.
- Celular: botão secundário **"Tipos de despesa"** (→ `/tipos`).

## Editar membro (modal/painel `shadow-pop`)

Nome de exibição, papel, parentesco, cor (`person-a…d`), participa da divisão, percentual personalizado
(visível se a regra for personalizada), **Remover membro** (`cc-btn--danger`, com confirmação dizendo que
as despesas ficam marcadas como de ex-membro). Convite: Reenviar, Cancelar convite, Copiar link.
