# 03 — Interface

Manter o visual do protótipo (`prototipo/index.html`). Resumo do que existe na tela:

## Topo
- Nome "Parada Perfeita" com um semáforo, e uma frase: "Freie o carro e pare exatamente na faixa."
- Três botões de fase com velocidade inicial e distância da faixa.

## Pista (o maior elemento da tela)
- Pista vista de lado, com marcas a cada 10 m, a faixa e o semáforo vermelho.
- Carro azul com farol; a **luz de freio acende** quando o pedal está apertado.
- Velocidade em km/h acima do carro.
- Ao parar: o erro em metros abaixo da pista e o resultado (estrelas) acima.
- Na fase 3, a pista acompanha a função h(s) e o carro inclina junto.

## Comandos
- **Largar** (vira "De novo" no fim), **Freio** (botão grande que enche de vermelho conforme o
  pedal), **Reiniciar**.

## Painel de telemetria (ao lado da pista)
- Velocidade grande em km/h.
- "Faixa a X m".
- t, s(t), v = s′(t), a = v′(t), freio em %. Barra do pedal.
- "ao vivo" ou "inspecionando t = …".

## Gráficos (embaixo, pequenos — pedido do professor)
- Três gráficos lado a lado: posição, velocidade e aceleração no tempo.
- Linha tracejada vermelha na posição da faixa (gráfico de posição).
- **Reta tangente vermelha** no instante atual nos gráficos de posição e de velocidade.
- Depois da freada, passar o mouse/dedo sobre os gráficos mostra qualquer instante.

## Não colocar na tela
- As equações (vão nos slides).
- Textos explicativos longos.
