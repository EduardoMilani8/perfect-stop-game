# Parada Perfeita (`perfect-stop-game`)

Jogo feito para o trabalho avaliativo de **Cálculo Diferencial e Integral I** do curso de
Ciência da Computação do **IFSul Câmpus Passo Fundo**.

Um carro vem em velocidade na direção de um semáforo vermelho. Segure o **freio** para parar
com a frente do carro **exatamente em cima da faixa**.

Enquanto o carro anda, o jogo mostra a telemetria e os gráficos de **posição s(t)**,
**velocidade v(t) = s′(t)** e **aceleração a(t) = v′(t)**, com a **reta tangente** em cada
instante: a inclinação dela no gráfico da posição é a velocidade, e no gráfico da velocidade é
a aceleração.

## Como jogar

- **Largar** (botão ou tecla **Enter**): o carro sai em velocidade. No fim, Enter joga de novo.
- **Freio** (botão na tela ou tecla **espaço**): segure para frear. Quanto mais tempo segura,
  mais forte o freio fica.
- **Reiniciar** (botão ou tecla **R**): volta o carro para a largada.
- Pare na faixa: ★★★ até 25 cm, ★★ até 1 m, ★ até 2,5 m.
- Depois da freada, passe o mouse nos gráficos para ver qualquer instante.
- No fim aparece o **relatório da jogada** (freada, velocidade e aceleração). Marque **"Comparar a próxima jogada com esta"** para ver a jogada seguinte ao lado
  da anterior (carro fantasma, curva cinza nos gráficos e colunas de diferença).

## Rodando

Abra o `index.html` no navegador (funciona offline). Versão online: **https://eduardomilani8.github.io/perfect-stop-game/**

Testes da física: `node tests/fisica.test.js`

## A física em uma linha

Toda a matemática está em [`js/fisica.js`](js/fisica.js):

- aceleração: `a = − 8·μ·p − G·h′(s)` (freio + ladeira);
- derivada pela definição: `f′(x) ≈ [f(x + Δx) − f(x)] / Δx`, com Δx bem pequeno;
- a cada Δt, pela diferencial: `s ← s + v·Δt` e `v ← v + a·Δt`.

## Grupo

- Eduardo Milani
