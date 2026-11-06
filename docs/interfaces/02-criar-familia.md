# 02 · Criar família — `/criar-familia`

Protótipo: `docs/design/telas/Onboarding.dc.html`. Página centralizada, largura máx. 560px, gap 24px,
sem menu.

## Ordem dos blocos

1. Logo "Contas da Casa" em `--brand-ink`.
2. Passos (lista `ol`, selos): **1. Sua conta** (concluído, estilo `paid`) · **2. Sua família**
   (atual, `brand-soft`/`brand-ink`, `aria-current="step"`) · **3. Convidar** (`surface-sunken`/`ink-muted`).
3. Título `heading` **"Crie a sua família"**; apoio: "É onde ficam as contas de todos. Você será o dono e
   pode convidar os outros membros em seguida."
4. Card de formulário:
   - **Nome da família** (texto; hint "Aparece no menu e nos convites.").
   - **Você é** — segmentado: **Titular | Cônjuge | Outro** (padrão: Titular).
   - **Como dividir as despesas da família** — segmentado: **Partes iguais | Proporcional ao salário |
     Personalizada**; hint "Dá para mudar depois, inclusive mês a mês."
   - Rodapé do card, à direita: botão primário **"Criar família e continuar"**.
5. Card `surface-sunken` (sem borda): título `title` **"Próximo: convidar quem divide as contas com você"**,
   campo de email (`placeholder="email do cônjuge"`), caption "Você também pode adicionar filhos como
   dependentes, sem login. Pular esta etapa não perde nada."
6. Card: label **"Recebeu um convite?"** + caption "Não crie outra família: abra o link do convite e você
   entra direto na família que te convidou."

## Comportamento

- Criar família: cria `families`, o `family_members` do usuário como `dono` (parentesco escolhido) e as
  categorias padrão (Moradia, Alimentação, Transporte, Cartões, Contas da casa, Saúde e academia).
- Se o email do passo 5 for preenchido, cria o convite (papel `membro`, parentesco `cônjuge`).
- Quem já tem família é redirecionado para `/`.
