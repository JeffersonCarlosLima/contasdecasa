# MoneyInput

Campo de valor em reais com prefixo R$, rótulo, dica e estado de erro; a mesma moldura serve para campos de texto.

**Recebe:** rótulo, valor em centavos (o componente formata para `1.234,56` enquanto a pessoa digita), dica opcional, mensagem de erro opcional.

**Classes:** `cc-field` > `cc-field__label`, `cc-input` (+ `cc-input--error`) > `cc-input__prefix` + `input`, `cc-field__hint` (+ `--error`). Para texto, use `input.cc-input__text` sem prefixo.

- Use `inputmode="decimal"` para abrir o teclado numérico no celular.
- Guarde e envie centavos inteiros ao banco; nunca float.
- Rótulo sempre visível acima do campo, não como placeholder.
- Mensagem de erro diz o que fazer: "Informe um valor maior que zero."
