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
derivada(f, x)                         // f′(x) ≈ [f(x + ε) − f(x − ε)] / 2ε
derivadaNoTempo(atual, anterior, dt)   // (atual − anterior) / Δt
inclinacaoDaPista(h, s)                // h′(s)
componenteDaGravidade(h, s)            // −G · h′(s) / √(1 + h′(s)²)
aceleracao(s, v, p, fase)              // soma de freio, ar, rolagem e gravidade
atualizarPedal(p, segurando, dt)       // p ± velocidade · Δt, entre 0 e 1
passo(estado, segurando, fase, dt)     // pedal → a → v → s → t (ordem do doc 02)
taxaDeVariacaoMedia(f0, f1, t0, t1)    // [f(t1) − f(t0)] / (t1 − t0)
integralTrapezios(ts, ys)              // Σ [f(tᵢ) + f(tᵢ₊₁)] / 2 · Δt
instantesOndeCruza(ts, ys, alvo)       // interpolação linear onde f passa pelo alvo
```

## `js/principal.js` — laço de animação

A cada quadro (`requestAnimationFrame`): 2 chamadas de `passo` com `DT = 1/120`; depois mede
`v ≈ Δs/Δt` e `a ≈ Δv/Δt` com `derivadaNoTempo` e guarda no histórico `{t, s, v, a, p, vD, aD}`;
confere fim de fase; desenha.

## `js/relatorio.js`

`montarRelatorio(hist, fase, resultado)` usa as três funções de análise de `fisica.js` sobre o
histórico (velocidade média, Valor Médio, área sob v(t), ponto crítico, concavidade) e
`mostrarRelatorio(relatorio, anterior)` escreve o cartão; com `anterior` mostra a comparação.

## Testes (`node tests/fisica.test.js`)

| Teste | Esperado |
|---|---|
| `derivada(x => x*x, 3)` | ≈ 6 |
| `derivadaNoTempo(10, 4, 2)` | 3 |
| `componenteDaGravidade(s => 0, 10)` | 0 |
| `componenteDaGravidade(s => -s, 0)` (descida de 45°) | ≈ +6,93 |
| `aceleracao` sem freio, plano, v = 10 | ≈ −0,4 |
| simulação da fase 1 freando a partir de t = 3,77 s até parar | para a menos de 0,25 m da faixa |
| simulação de cada fase sem frear | passa da faixa |
| `taxaDeVariacaoMedia(0, 50, 0, 5)` | 10 |
| `integralTrapezios` de 2t em [0, 3] / de t² em [0, 1] | 9 / ≈ 1/3 |
| `instantesOndeCruza` em 3, 1, −1 e em sen(t) | t = 1,5 / π e 2π |
| fase 1: área sob v(t) − distância | exatamente (v₀ − v_final)·Δt/2 |
