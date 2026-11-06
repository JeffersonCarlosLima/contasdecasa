# Button

Botão de ação com quatro variantes: primário (telha), secundário, fantasma e perigo.

**Recebe:** texto do botão (verbo + objeto), ícone Lucide opcional à esquerda, `disabled`, tamanho padrão (40px) ou `cc-btn--sm` (32px).

**Classes:** `cc-btn` + `cc-btn--primary | --secondary | --ghost | --danger`, opcional `cc-btn--sm`.

- Um `--primary` por tela: Lançar despesa, Salvar salário, Fechar mês.
- `--secondary` para ações que acompanham a principal (Cancelar, Copiar recorrentes).
- `--ghost` para ações de linha e links de ação (Ver todas).
- `--danger` só para excluir; sempre pede confirmação e diz o que será apagado.
- Não use só ícone em ações destrutivas. Não pinte botões de `invest`.
