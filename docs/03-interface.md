# 03 — Interface

Visual baseado no protótipo (`prototipo/index.html`), com um polimento depois da Etapa 2:
menos informação na tela, cena mais caprichada e acabamento dos botões. Resumo do que existe:

## Topo
- Nome "Parada Perfeita" com um semáforo, e uma frase: "Freie o carro e pare exatamente na faixa."
- Três botões de fase com velocidade inicial e distância da faixa.

## Pista (o maior elemento da tela)
- Missão em destaque ("Pare na faixa a X m") com a dica da fase em letra menor.
- Pista vista de lado, com céu em degradê, prédios e morros ao fundo.
- Marcas discretas a cada 10 m, faixa de parada zebrada e semáforo vermelho com brilho,
  que **fica verde** quando o carro para com estrelas.
- Carro azul com farol e sombra; as **rodas giram** o ângulo θ = s/r.
- Ao frear: a **luz de freio acende**, a carroceria **abaixa o nariz** (proporcional à
  desaceleração) e ficam **marcas de pneu** onde o freio passou de 80%.
- Velocidade em km/h acima do carro.
- Ao parar: o erro em metros abaixo da pista e o resultado (estrelas) acima, com uma
  animação curta.
- Na fase 3, a pista acompanha a função h(s) e o carro inclina junto.

## Comandos
- **Largar** (vira "De novo" no fim), **Freio** (botão grande que enche de vermelho conforme o
  pedal), **Reiniciar**.

## Painel de telemetria (ao lado da pista)
- Velocidade grande em km/h.
- "Faixa a X m".
- t, s(t), v = s′(t), a = v′(t). Barra do pedal.
- Etiqueta "inspecionando t = …" só enquanto o mouse está sobre os gráficos.

## Gráficos (embaixo, pequenos — pedido do professor)
- Três gráficos lado a lado: posição, velocidade e aceleração no tempo.
- Linha tracejada vermelha na posição da faixa (gráfico de posição).
- **Reta tangente vermelha** no instante atual nos gráficos de posição e de velocidade.
- Depois da freada, passar o mouse/dedo sobre os gráficos mostra qualquer instante
  (os valores aparecem no painel de telemetria; não há texto embaixo dos gráficos).

## Não colocar na tela
- As equações (vão nos slides).
- Textos explicativos longos.
- Informação repetida (cada valor aparece em um lugar só).
