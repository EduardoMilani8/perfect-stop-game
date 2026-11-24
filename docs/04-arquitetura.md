# 04 — Arquitetura

HTML + CSS + JavaScript puro, sem bibliotecas, sem build. Desenho com `<canvas>`.

```
perfect-stop-game/
├── index.html
├── estilo.css
├── js/
│   ├── fisica.js      ★ toda a matemática (aberto no seminário)
│   ├── fases.js       dados das 3 fases e avaliação do resultado (estrelas)
│   ├── desenho.js     desenha a pista, o carro, os gráficos e a telemetria
│   ├── relatorio.js   relatório do fim da jogada e comparação com a anterior
│   └── principal.js   estado do jogo, botões, teclado e laço de animação
├── tests/
│   └── fisica.test.js
└── docs/
```

Os arquivos compartilham funções como variáveis globais simples, carregados nesta ordem:
`fisica.js`, `fases.js`, `desenho.js`, `relatorio.js`, `principal.js`. `js/fisica.js` termina com
`if (typeof module !== "undefined") module.exports = { ... };` para os testes no Node.

## `js/fisica.js`

Somente funções puras e constantes, cada uma com a fórmula comentada:

```js
taxaDeVariacaoMedia(y1, y2, x1, x2)    // Δy/Δx = [f(x₂) − f(x₁)] / (x₂ − x₁)
derivada(f, x)                         // f′(x) ≈ [f(x + Δx) − f(x)] / Δx, Δx = DX
inclinacaoDaPista(h, s)                // h′(s)
aceleracao(s, p, fase)                 // −FREIO_MAX · μ · p − G · h′(s)
atualizarPedal(p, segurando, dt)       // p ± velocidade · Δt, entre 0 e 1
passo(estado, segurando, fase, dt)     // pedal → a → s → v → t (ordem do doc 02)
```

## `js/principal.js` — laço de animação

A cada quadro (`requestAnimationFrame`): 2 chamadas de `passo` com `DT = 1/120`; depois mede
`v ≈ Δs/Δt` e `a ≈ Δv/Δt` com `taxaDeVariacaoMedia` e guarda no histórico `{t, s, v, a, p, vD, aD}`;
confere fim de fase; desenha.

## `js/relatorio.js`

`montarRelatorio(hist, fase, resultado)` calcula os números da jogada a partir do histórico
(usando `taxaDeVariacaoMedia` para a velocidade média e a desaceleração média) e
`mostrarRelatorio(relatorio, anterior)` escreve o cartão; com `anterior` mostra a comparação.

## Testes (`node tests/fisica.test.js`)

| Teste | Esperado |
|---|---|
| `taxaDeVariacaoMedia(0, 50, 0, 5)` | 10 |
| `derivada(x => x*x, 3)` | ≈ 6 |
| `derivada` da ladeira da fase 3 | ≈ −4·(π/60)·sen(π·s/60) (regra da cadeia) |
| `aceleracao` no plano: sem freio / freio no fundo | 0 / −8 (seco) e −4 (molhado) |
| `aceleracao` na ladeira sem freio | −G·h′(s): positiva na descida, negativa na subida |
| `atualizarPedal` | sobe 2,5/s, desce 5/s, entre 0 e 1 |
| `passo` | s + v·Δt, v + a·Δt; para quando v chega a 0 |
| simulação da fase 1 freando a partir de t = 3,22 s até parar | para a menos de 0,25 m da faixa |
| simulação de cada fase sem frear | passa da faixa |
