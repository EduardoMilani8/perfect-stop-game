# 03 — Interface

Visual baseado no protótipo (`prototipo/index.html`), com um polimento depois da Etapa 2:
menos informação na tela, cena mais caprichada, um cenário para cada fase e acabamento dos
botões. **Só modo claro.** Resumo do que existe:

## Topo
- Nome "Parada Perfeita" com um semáforo, e uma frase: "Freie o carro e pare exatamente na faixa."
- Três botões de fase com velocidade inicial e distância da faixa, cada um com um ponto na cor
  do seu cenário.

## Pista (o maior elemento da tela)
- Missão em destaque ("Pare na faixa a X m") com a dica da fase em letra menor.
- Pista vista de lado, de borda a borda, com meio-fio. O carro cabe inteiro na largada.
- Cada fase tem seu cenário (tabela `CENARIOS` em `js/desenho.js`):
  - **1 · Asfalto seco**: dia de sol na cidade;
  - **2 · Pista molhada**: chuva animada, céu fechado, asfalto escuro com poças;
  - **3 · Ladeira**: fim de tarde no interior, com morros altos e árvores.
- Marcas discretas a cada 10 m (rótulo a cada 20 m em telas estreitas), faixa de parada
  zebrada e semáforo vermelho com brilho, que **fica verde** quando o carro para com estrelas.
- Carro azul com farol e sombra; as **rodas giram** o ângulo θ = s/r.
- Ao frear: a **luz de freio acende**, a carroceria **abaixa o nariz** (proporcional à
  desaceleração) e ficam **marcas de pneu** onde o freio passou de 80%.
- Velocidade em km/h numa etiqueta acima do carro.
- Ao parar: o erro como uma cota com setas entre a frente do carro e a faixa, com o valor
  numa etiqueta, e o resultado (estrelas) acima da pista, com uma animação curta.
- Na fase 3, a pista acompanha a função h(s) e o carro inclina junto.

## Comandos
- **Largar** (vira "De novo" no fim), **Freio** (botão grande que enche de vermelho conforme o
  pedal), **Reiniciar**. Cada botão mostra a sua tecla: **enter**, **espaço** e **R**.

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
- No fim da jogada, destaques nos gráficos: linha roxa no instante em que o freio começou,
  pontos de **velocidade máxima** e **média** (com a linha da média) e o ponto onde a
  aceleração passa por **zero**.

## Relatório da jogada (embaixo dos gráficos, aparece quando o carro para)
Três grupos de números, cada um com uma frase curta (sem fórmulas):
- **Freada:** quando começou a frear (e quanto faltava), velocidade ao frear, duração,
  distância de frenagem, desaceleração média e maior desaceleração.
- **Velocidade e aceleração:** velocidade máxima (ponto crítico de v(t) ou extremo do
  intervalo), velocidade média e maior aceleração (só quando há descida).
- **Conceitos de Cálculo:** instante do Teorema do Valor Médio, área sob v(t) comparada com a
  distância, concavidade de s(t) por trechos e a precisão da derivada numérica.

Caixa **"Comparar a próxima jogada com esta"**: na jogada seguinte da mesma fase aparece um
carro fantasma, a curva anterior em cinza tracejado nos gráficos e, no relatório, as colunas
Esta / Anterior / Diferença. Trocar de fase ou reiniciar desliga a comparação.

## Não colocar na tela
- As equações (vão nos slides).
- Textos explicativos longos.
- Informação repetida (cada valor aparece em um lugar só).
