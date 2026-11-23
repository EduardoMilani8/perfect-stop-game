# CLAUDE.md — Instruções para o Claude Code

Você vai construir o jogo **"Parada Perfeita"** para o trabalho de **Cálculo Diferencial e
Integral I** (BCC — IFSul Câmpus Passo Fundo). A ideia já foi **aprovada pelo professor**.

Leia antes de começar, nesta ordem:
1. `docs/01-visao-geral.md` — o trabalho, o jogo e o que o professor pediu
2. `docs/02-regras-e-fisica.md` — regras, fases e fórmulas (a parte mais importante)
3. `docs/03-interface.md` — o que aparece na tela
4. `docs/04-arquitetura.md` — arquivos e o que cada um faz
5. `docs/05-plano.md` — etapas e prazos

O jogo está pronto (`index.html` + `js/`). O protótipo inicial foi removido: a versão final é a referência.
Qualquer mudança deve manter o comportamento e o visual atuais (exceto o que os docs pedirem).

## Regras que não podem ser quebradas

1. **Nenhum motor de física pronto** e nenhuma biblioteca JavaScript. Tudo com fórmulas próprias.
2. **Toda a matemática fica em `js/fisica.js`**, sem código de desenho ou de tela.
   Esse arquivo será **aberto e explicado no seminário** (o professor pediu para "abrir o script
   e mostrar como foi realizada a programação das equações").
3. Cada função de `js/fisica.js` tem um comentário com a fórmula em notação matemática, ex.:
   `// v(t + Δt) = v(t) + a(t)·Δt`. Funções curtas, nomes em português, sem "esperteza".
4. **Roda offline**: abrir o `index.html` com duplo clique, sem servidor e sem internet.
   Use `<script src="...">` comuns (sem `type="module"`). As fontes do Google podem falhar
   offline: mantenha fontes de reserva no CSS.
5. **Sem equações escritas na tela do jogo** (o professor pediu: elas vão nos slides).
   A telemetria e os gráficos ficam.
6. Código, comentários, interface e commits **em português**. Só o nome do repositório é em inglês.
7. **Simples.** Não adicione funcionalidades que não estão nos docs.

## Repositório no GitHub

- Nome: **`perfect-stop-game`** — público
- Descrição: `Jogo de Cálculo I: freie o carro e pare na faixa. Velocidade e aceleração como derivadas da posição.`

1. `gh auth status` (se não estiver autenticado, peça ao usuário para rodar `gh auth login`).
2. `git init`, primeiro commit com `README.md`, `CLAUDE.md`, `docs/` e o protótipo (removido depois).
3. `gh repo create perfect-stop-game --public --source=. --remote=origin --push --description "..."`
4. Um commit por etapa do `docs/05-plano.md`, mensagem em português.
5. No fim, ative o GitHub Pages (branch `main`, raiz) e coloque o link no `README.md`.

## Como conferir

- `node tests/fisica.test.js` precisa passar sempre que `js/fisica.js` mudar.
- Ao final, jogue as 3 fases no navegador e confira que o comportamento é igual ao descrito nos docs.
